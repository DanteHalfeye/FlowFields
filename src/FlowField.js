import { CONFIG } from "./config.js";

const smoothstep = (edge0, edge1, x) => {
    const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
};

// ------------------------------------------------------------
// 3D PERLIN NOISE
// ------------------------------------------------------------

const GRADIENTS = [
    [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
    [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
    [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
];

const fade = t => t * t * t * (t * (t * 6 - 15) + 10);

const lerp = (a, b, t) => a + (b - a) * t;

const dotGrid = (gradient, x, y, z) =>
    gradient[0] * x +
    gradient[1] * y +
    gradient[2] * z;

class PerlinNoise3D {

    constructor(seed = 1337) {
        this.permutation = new Uint8Array(512);

        const p = new Uint8Array(256);

        for (let i = 0; i < 256; i++) {
            p[i] = i;
        }

        // Seeded Fisher-Yates shuffle.
        let state = seed >>> 0;

        const random = () => {
            state ^= state << 13;
            state ^= state >>> 17;
            state ^= state << 5;
            state >>>= 0;

            return state / 4294967296;
        };

        for (let i = 255; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));

            const temp = p[i];
            p[i] = p[j];
            p[j] = temp;
        }

        for (let i = 0; i < 512; i++) {
            this.permutation[i] = p[i & 255];
        }
    }

    _gradient(ix, iy, iz) {
        const index =
            this.permutation[
                this.permutation[
                    this.permutation[ix & 255] + (iy & 255)
                ] + (iz & 255)
            ] % GRADIENTS.length;

        return GRADIENTS[index];
    }

    noise(x, y, z) {

        const x0 = Math.floor(x);
        const y0 = Math.floor(y);
        const z0 = Math.floor(z);

        const xf = x - x0;
        const yf = y - y0;
        const zf = z - z0;

        const u = fade(xf);
        const v = fade(yf);
        const w = fade(zf);

        const n000 = dotGrid(
            this._gradient(x0, y0, z0),
            xf,
            yf,
            zf
        );

        const n100 = dotGrid(
            this._gradient(x0 + 1, y0, z0),
            xf - 1,
            yf,
            zf
        );

        const n010 = dotGrid(
            this._gradient(x0, y0 + 1, z0),
            xf,
            yf - 1,
            zf
        );

        const n110 = dotGrid(
            this._gradient(x0 + 1, y0 + 1, z0),
            xf - 1,
            yf - 1,
            zf
        );

        const n001 = dotGrid(
            this._gradient(x0, y0, z0 + 1),
            xf,
            yf,
            zf - 1
        );

        const n101 = dotGrid(
            this._gradient(x0 + 1, y0, z0 + 1),
            xf - 1,
            yf,
            zf - 1
        );

        const n011 = dotGrid(
            this._gradient(x0, y0 + 1, z0 + 1),
            xf,
            yf - 1,
            zf - 1
        );

        const n111 = dotGrid(
            this._gradient(x0 + 1, y0 + 1, z0 + 1),
            xf - 1,
            yf - 1,
            zf - 1
        );

        const nx00 = lerp(n000, n100, u);
        const nx10 = lerp(n010, n110, u);
        const nx01 = lerp(n001, n101, u);
        const nx11 = lerp(n011, n111, u);

        const nxy0 = lerp(nx00, nx10, v);
        const nxy1 = lerp(nx01, nx11, v);

        return lerp(nxy0, nxy1, w);
    }
}

// ------------------------------------------------------------
// FLOW FIELD
// ------------------------------------------------------------

export class FlowField {

    constructor() {

        this.width = CONFIG.worldWidth;
        this.height = CONFIG.worldHeight;
        this.depth = CONFIG.worldDepth;
        this.cellSize = CONFIG.cellSize;

        this.cols = Math.max(
            2,
            Math.ceil(this.width / this.cellSize)
        );

        this.rows = Math.max(
            2,
            Math.ceil(this.height / this.cellSize)
        );

        this.layers = Math.max(
            2,
            Math.ceil(this.depth / this.cellSize)
        );

        this.totalCells =
            this.cols *
            this.rows *
            this.layers;

        this.flowX = new Float32Array(this.totalCells);
        this.flowY = new Float32Array(this.totalCells);
        this.flowZ = new Float32Array(this.totalCells);

        this.gridX = new Float32Array(this.totalCells);
        this.gridY = new Float32Array(this.totalCells);
        this.gridZ = new Float32Array(this.totalCells);

        this.radialX = new Float32Array(this.totalCells);
        this.radialY = new Float32Array(this.totalCells);
        this.radialZ = new Float32Array(this.totalCells);

        this._buildStaticGrid();

        // Separate noise fields prevent the noise from simply pushing
        // everything in the same direction.
        this.noise = new PerlinNoise3D(19283);
        this.noiseOffset = Math.random() * 1000;

        this.time = 0;
        this.amplitude = 0;
        this.treble = 0;
        this.beat = 0;

        this.updateInterval =
            CONFIG.flowUpdateInterval ?? 1 / 30;

        this._lastGenerate = -Infinity;

        this._result = {
            x: 0,
            y: 0,
            z: 0
        };

        this.generate();
    }

    getIndex(x, y, z) {
        return (
            x +
            y * this.cols +
            z * this.cols * this.rows
        );
    }

    _buildStaticGrid() {

        const {
            cols,
            rows,
            layers
        } = this;

        for (let z = 0; z < layers; z++) {

            for (let y = 0; y < rows; y++) {

                for (let x = 0; x < cols; x++) {

                    const i =
                        this.getIndex(x, y, z);

                    const nx =
                        (x / Math.max(1, cols - 1)) * 2 - 1;

                    const ny =
                        (y / Math.max(1, rows - 1)) * 2 - 1;

                    const nz =
                        (z / Math.max(1, layers - 1)) * 2 - 1;

                    this.gridX[i] = nx;
                    this.gridY[i] = ny;
                    this.gridZ[i] = nz;

                    const len =
                        Math.sqrt(
                            nx * nx +
                            ny * ny +
                            nz * nz
                        );

                    if (len > 0.0001) {

                        this.radialX[i] = nx / len;
                        this.radialY[i] = ny / len;
                        this.radialZ[i] = nz / len;

                    }
                }
            }
        }
    }

    setAudio(amplitude, treble, beat) {

        this.amplitude = amplitude;
        this.treble = treble;
        this.beat = beat;
    }

    update(
        time,
        amplitude = this.amplitude,
        treble = this.treble,
        beat = this.beat
    ) {

        this.time = time;
        this.amplitude = amplitude;
        this.treble = treble;
        this.beat = beat;

        if (
            time - this._lastGenerate >=
            this.updateInterval
        ) {

            this._lastGenerate = time;
            this.generate();
        }
    }

    generate() {

        const t = this.time;
        const amp = this.amplitude;

        // --------------------------------------------------------
        // AUDIO
        // --------------------------------------------------------

        const deform = amp * 1.5;
        const beatPush = this.beat * 0.55;
        const hf = 0.15 + this.treble * 0.45;
        const secondary = 0.3 + amp * 0.25;
        const containment = 1.2 + amp * 0.3;

        // Perlin configuration.
        //
        // noiseScale controls how large the noise structures are.
        // Smaller = larger smooth regions.
        //
        // noiseStrength is multiplied by amplitude, so:
        //
        // amplitude = 0
        //      -> no noise
        //
        // amplitude = 1
        //      -> maximum noise deformation
        //
        const noiseScale = 1.35;

        const noiseStrength =
            amp * 2.4;

        // Noise moves slowly through the volume.
        const noiseTime =
            t * (0.12 + amp * 0.18);

        const noiseOffset =
            this.noiseOffset;

        const {
            gridX,
            gridY,
            gridZ,
            radialX,
            radialY,
            radialZ,
            flowX,
            flowY,
            flowZ
        } = this;

        const total = this.totalCells;

        for (let i = 0; i < total; i++) {

            const nx = gridX[i];
            const ny = gridY[i];
            const nz = gridZ[i];

            // ----------------------------------------------------
            // EXISTING MUSIC-DEFORMED FLOW
            // ----------------------------------------------------

            const dx =
                nx +
                Math.sin(
                    ny * 3.2 +
                    nz * 2.4 +
                    t * 0.55
                ) * deform;

            const dy =
                ny +
                Math.sin(
                    nz * 3.8 +
                    nx * 2.0 +
                    t * 0.42
                ) *
                deform *
                0.45;

            const dz =
                nz +
                Math.cos(
                    nx * 3.0 +
                    ny * 2.7 -
                    t * 0.48
                ) * deform;

            // ----------------------------------------------------
            // BASE SWIRL
            // ----------------------------------------------------

            const rho =
                Math.sqrt(
                    dx * dx +
                    dz * dz
                );

            const inv =
                1 / Math.max(rho, 0.35);

            let vx = -dz * inv;
            let vz = dx * inv;

            let vy =
                Math.sin(
                    dx * 3.0 +
                    dz * 2.5 +
                    t * 0.35
                ) * 0.35;

            // ----------------------------------------------------
            // SECONDARY TURBULENCE
            // ----------------------------------------------------

            vx +=
                Math.sin(
                    dy * 3.5 +
                    dz * 2.0 +
                    t * 0.25
                ) *
                secondary;

            vz +=
                Math.cos(
                    dx * 3.0 -
                    dy * 2.5 -
                    t * 0.2
                ) *
                secondary;

            vy +=
                Math.sin(
                    dz * 3.1 -
                    dx * 2.2 +
                    t * 0.3
                ) *
                0.25;

            // ----------------------------------------------------
            // PERLIN NOISE
            // ----------------------------------------------------
            //
            // Three independent samples create a 3D vector field.
            //
            // Offsetting each channel gives the noise vector
            // different directions instead of producing identical
            // values on every axis.
            //

            const noiseX =
                this.noise.noise(
                    nx * noiseScale + noiseOffset,
                    ny * noiseScale,
                    nz * noiseScale + noiseTime
                );

            const noiseY =
                this.noise.noise(
                    nx * noiseScale + noiseOffset + 31.7,
                    ny * noiseScale + 17.3,
                    nz * noiseScale + noiseTime + 11.2
                );

            const noiseZ =
                this.noise.noise(
                    nx * noiseScale + noiseOffset + 63.1,
                    ny * noiseScale + 41.8,
                    nz * noiseScale + noiseTime + 27.4
                );

            // Music amplitude controls how much the Perlin field
            // can bend the existing flow.
            vx += noiseX * noiseStrength;
            vy += noiseY * noiseStrength;
            vz += noiseZ * noiseStrength;

            // ----------------------------------------------------
            // TREBLE DETAIL
            // ----------------------------------------------------

            vx +=
                Math.sin(
                    dz * 8.0 +
                    t * 0.8
                ) *
                hf *
                0.12;

            vy +=
                Math.sin(
                    dx * 7.0 +
                    dz * 5.0 +
                    t * 0.7
                ) *
                hf *
                0.08;

            vz +=
                Math.cos(
                    dy * 8.0 -
                    t * 0.7
                ) *
                hf *
                0.12;

            // ----------------------------------------------------
            // SOFT CONTAINMENT
            // ----------------------------------------------------

            vx -=
                Math.sign(nx) *
                smoothstep(
                    0.6,
                    1.0,
                    Math.abs(nx)
                ) *
                containment;

            vy -=
                Math.sign(ny) *
                smoothstep(
                    0.6,
                    1.0,
                    Math.abs(ny)
                ) *
                containment;

            vz -=
                Math.sign(nz) *
                smoothstep(
                    0.6,
                    1.0,
                    Math.abs(nz)
                ) *
                containment;

            // ----------------------------------------------------
            // BEAT EXPANSION
            // ----------------------------------------------------

            vx += radialX[i] * beatPush;
            vy += radialY[i] * beatPush * 0.5;
            vz += radialZ[i] * beatPush;

            // ----------------------------------------------------
            // NORMALIZE
            // ----------------------------------------------------

            const len =
                Math.sqrt(
                    vx * vx +
                    vy * vy +
                    vz * vz
                );

            if (len > 0.000001) {

                const k = 1 / len;

                vx *= k;
                vy *= k;
                vz *= k;
            }

            flowX[i] = vx;
            flowY[i] = vy;
            flowZ[i] = vz;
        }
    }

    /**
     * Trilinear sample.
     * Writes into `out`.
     */
    getDirectionXYZ(
        x,
        y,
        z,
        out = this._result
    ) {

        const maxX = this.cols - 1;
        const maxY = this.rows - 1;
        const maxZ = this.layers - 1;

        let gx =
            (x / this.width + 0.5) *
            maxX;

        let gy =
            (y / this.height + 0.5) *
            maxY;

        let gz =
            (z / this.depth + 0.5) *
            maxZ;

        if (!(gx > 0))
            gx = 0;
        else if (gx > maxX)
            gx = maxX;

        if (!(gy > 0))
            gy = 0;
        else if (gy > maxY)
            gy = maxY;

        if (!(gz > 0))
            gz = 0;
        else if (gz > maxZ)
            gz = maxZ;

        const x0 = Math.floor(gx);
        const y0 = Math.floor(gy);
        const z0 = Math.floor(gz);

        const x1 =
            x0 < maxX
                ? x0 + 1
                : maxX;

        const y1 =
            y0 < maxY
                ? y0 + 1
                : maxY;

        const z1 =
            z0 < maxZ
                ? z0 + 1
                : maxZ;

        const tx = gx - x0;
        const ty = gy - y0;
        const tz = gz - z0;

        const ux = 1 - tx;
        const uy = 1 - ty;
        const uz = 1 - tz;

        const sy = this.cols;
        const sz = this.cols * this.rows;

        const i000 =
            x0 + y0 * sy + z0 * sz;

        const i100 =
            x1 + y0 * sy + z0 * sz;

        const i010 =
            x0 + y1 * sy + z0 * sz;

        const i110 =
            x1 + y1 * sy + z0 * sz;

        const i001 =
            x0 + y0 * sy + z1 * sz;

        const i101 =
            x1 + y0 * sy + z1 * sz;

        const i011 =
            x0 + y1 * sy + z1 * sz;

        const i111 =
            x1 + y1 * sy + z1 * sz;

        const w000 = ux * uy * uz;
        const w100 = tx * uy * uz;
        const w010 = ux * ty * uz;
        const w110 = tx * ty * uz;

        const w001 = ux * uy * tz;
        const w101 = tx * uy * tz;
        const w011 = ux * ty * tz;
        const w111 = tx * ty * tz;

        const fx = this.flowX;
        const fy = this.flowY;
        const fz = this.flowZ;

        let vx =
            fx[i000] * w000 +
            fx[i100] * w100 +
            fx[i010] * w010 +
            fx[i110] * w110 +
            fx[i001] * w001 +
            fx[i101] * w101 +
            fx[i011] * w011 +
            fx[i111] * w111;

        let vy =
            fy[i000] * w000 +
            fy[i100] * w100 +
            fy[i010] * w010 +
            fy[i110] * w110 +
            fy[i001] * w001 +
            fy[i101] * w101 +
            fy[i011] * w011 +
            fy[i111] * w111;

        let vz =
            fz[i000] * w000 +
            fz[i100] * w100 +
            fz[i010] * w010 +
            fz[i110] * w110 +
            fz[i001] * w001 +
            fz[i101] * w101 +
            fz[i011] * w011 +
            fz[i111] * w111;

        const len =
            Math.sqrt(
                vx * vx +
                vy * vy +
                vz * vz
            );

        if (len > 0.000001) {

            const k = 1 / len;

            vx *= k;
            vy *= k;
            vz *= k;
        }

        out.x = vx;
        out.y = vy;
        out.z = vz;

        return out;
    }
}