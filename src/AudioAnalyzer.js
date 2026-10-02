const BAND_HZ = { bassLo: 20, bassHi: 250, midHi: 4000, trebleHi: 16000 };
const FLUX_HISTORY = 43;       // ~0.7 s at 60 fps
const BEAT_COOLDOWN = 0.12;

const clamp01 = x => (x < 0 ? 0 : x > 1 ? 1 : x);

export class AudioAnalyzer {

    constructor() {
        this.context = null;
        this.analyser = null;
        this.stream = null;
        this.data = null;
        this.prev = null;
        this.bins = null;

        this.onStatus = () => {};

        // Smoothed, auto-gained bands in 0..1.
        this.bass = 0;
        this.mid = 0;
        this.treble = 0;
        this.energy = 0;
        this.beat = 0;

        this._peaks = [0.25, 0.25, 0.25];
        this._fluxHistory = new Float32Array(FLUX_HISTORY);
        this._fluxCount = 0;
        this._fluxIndex = 0;
        this._cooldown = 0;
        this._primed = false;
    }

    get active() {
        return this.analyser !== null;
    }

    async start() {
        if (this.active) return true;

        this.onStatus("AUDIO: REQUESTING");

        let stream;
        try {
            // Music should not be "cleaned up" by the browser's voice filters.
            stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            });
        } catch (error) {
            console.error("Audio initialization failed:", error);
            this.onStatus("AUDIO: DENIED");
            return false;
        }

        stream.getVideoTracks().forEach(track => track.stop());

        const tracks = stream.getAudioTracks();
        if (tracks.length === 0) {
            stream.getTracks().forEach(track => track.stop());
            this.onStatus("AUDIO: NO SOURCE (SHARE A TAB WITH AUDIO)");
            return false;
        }

        try {
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const analyser = context.createAnalyser();
            analyser.fftSize = 2048;
            analyser.smoothingTimeConstant = 0.6;

            context.createMediaStreamSource(stream).connect(analyser);

            if (context.state === "suspended") await context.resume();

            // Bands are defined in Hz. The old code used fractions of the
            // spectrum, so "bass" actually reached ~1.9 kHz.
            const length = analyser.frequencyBinCount;
            const binHz = context.sampleRate / analyser.fftSize;
            const bin = hz => Math.min(length, Math.max(1, Math.round(hz / binHz)));

            const bassLo = bin(BAND_HZ.bassLo);
            const bassHi = Math.max(bassLo + 1, bin(BAND_HZ.bassHi));
            const midHi = Math.max(bassHi + 1, bin(BAND_HZ.midHi));
            const trebleHi = Math.min(length, Math.max(midHi + 1, bin(BAND_HZ.trebleHi)));

            this.bins = { bassLo, bassHi, midHi, trebleHi };
            this.context = context;
            this.analyser = analyser;
            this.stream = stream;
            this.data = new Uint8Array(length);
            this.prev = new Uint8Array(length);
            this._primed = false;
            this._fluxCount = 0;
            this._fluxIndex = 0;

            tracks.forEach(track => {
                track.addEventListener("ended", () => {
                    this._stop();
                    this.onStatus("AUDIO: STOPPED");
                });
            });

            this.onStatus("AUDIO: ACTIVE");
            return true;
        } catch (error) {
            console.error("Audio initialization failed:", error);
            stream.getTracks().forEach(track => track.stop());
            this.onStatus("AUDIO: ERROR");
            return false;
        }
    }

    _stop() {
        this.analyser = null;
        this.data = null;
        this.prev = null;

        if (this.stream) this.stream.getTracks().forEach(track => track.stop());
        this.stream = null;

        if (this.context) this.context.close().catch(() => {});
        this.context = null;
    }

    _average(data, from, to) {
        let sum = 0;
        for (let i = from; i < to; i++) sum += data[i];
        return sum / (255 * Math.max(1, to - from));
    }

    // Slow-decaying peak follower so quiet and loud tracks both fill the 0..1 range.
    _normalize(slot, value, delta) {
        this._peaks[slot] = Math.max(value, this._peaks[slot] * Math.exp(-delta * 0.1));
        return clamp01(value / Math.max(this._peaks[slot], 0.2));
    }

    update(delta) {
        if (!this.analyser) {
            const decay = Math.exp(-delta * 2.5);
            this.bass *= decay;
            this.mid *= decay;
            this.treble *= decay;
            this.energy *= decay;
            this.beat *= Math.exp(-delta * 6);
            return;
        }

        this.analyser.getByteFrequencyData(this.data);

        const data = this.data;
        const { bassLo, bassHi, midHi, trebleHi } = this.bins;

        const bass = this._normalize(0, this._average(data, bassLo, bassHi), delta);
        const mid = this._normalize(1, this._average(data, bassHi, midHi), delta);
        const treble = this._normalize(2, this._average(data, midHi, trebleHi), delta);
        const energy = bass * 0.5 + mid * 0.3 + treble * 0.2;

        // Frame-rate independent smoothing (same feel as the old 0.18/0.14/0.12/0.15 at 60 fps).
        const k = rate => 1 - Math.exp(-delta * rate);
        this.bass += (bass - this.bass) * k(11.9);
        this.mid += (mid - this.mid) * k(9.0);
        this.treble += (treble - this.treble) * k(7.7);
        this.energy += (energy - this.energy) * k(9.8);

        this._detectBeat(delta, data, bass);

        this.beat *= Math.exp(-delta * 10);
    }

    /*
     * Spectral flux on the bass bins: the sum of positive changes between
     * frames, compared with an adaptive threshold (mean + 1.5 * std of the
     * last ~0.7 s). Reacts to kick onsets and ignores a constantly loud bassline.
     */
    _detectBeat(delta, data, bass) {
        const { bassLo, bassHi } = this.bins;
        const prev = this.prev;

        let flux = 0;
        for (let i = bassLo; i < bassHi; i++) {
            const diff = data[i] - prev[i];
            if (diff > 0) flux += diff;
            prev[i] = data[i];
        }
        flux /= 255 * (bassHi - bassLo);

        this._cooldown -= delta;

        // First frame compares against zeros; skip it.
        if (!this._primed) {
            this._primed = true;
            return;
        }

        const history = this._fluxHistory;
        const n = this._fluxCount;

        let mean = 0;
        for (let i = 0; i < n; i++) mean += history[i];
        mean = n ? mean / n : 0;

        let variance = 0;
        for (let i = 0; i < n; i++) {
            const d = history[i] - mean;
            variance += d * d;
        }
        const std = n ? Math.sqrt(variance / n) : 0;

        const threshold = Math.max(0.012, mean + 1.5 * std);

        if (this._cooldown <= 0 && n >= 8 && flux > threshold && bass > 0.1) {
            const strength = clamp01((flux - mean) / Math.max(std * 4, 0.02));
            this.beat = Math.max(this.beat, 0.4 + 0.6 * strength);
            this._cooldown = BEAT_COOLDOWN;
        }

        history[this._fluxIndex] = flux;
        this._fluxIndex = (this._fluxIndex + 1) % FLUX_HISTORY;
        this._fluxCount = Math.min(FLUX_HISTORY, n + 1);
    }
}