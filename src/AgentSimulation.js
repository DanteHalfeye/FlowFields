import { CONFIG } from "./config.js";

const MAX_FORCES = 48;

const smoothstep = (edge0, edge1, x) => {
    const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
    return t * t * (3 - 2 * t);
};

export class AgentSimulation {

    constructor(flowField) {
        this.flowField = flowField;
        this.count = CONFIG.agentCount;

        this.positions = new Float32Array(this.count * 3);
        this.velocities = new Float32Array(this.count * 3);
        this.agentScales = new Float32Array(this.count);
        this.random = new Float32Array(this.count);

        this.forces = [];

        this.audioBass = 0;
        this.audioMid = 0;
        this.audioTreble = 0;
        this.audioEnergy = 0;
        this.audioBeat = 0;

        this._flow = { x: 0, y: 0, z: 0 };

        for (let i = 0; i < this.count; i++) {
            this.random[i] = Math.random();
            this.spawn(i);
        }
    }

    spawn(i) {
        const px = (Math.random() * 2 - 1) * CONFIG.worldWidth * 0.5;
        const py = (Math.random() * 2 - 1) * CONFIG.worldHeight * 0.5;
        const pz = (Math.random() * 2 - 1) * CONFIG.worldDepth * 0.5;

        const index = i * 3;

        this.positions[index] = px;
        this.positions[index + 1] = py;
        this.positions[index + 2] = pz;

        const flow = this.flowField.getDirectionXYZ(
            px,
            py,
            pz,
            this._flow
        );

        const speed = CONFIG.maxSpeed * 0.35;

        this.velocities[index] = flow.x * speed;
        this.velocities[index + 1] = flow.y * speed;
        this.velocities[index + 2] = flow.z * speed;

        this.agentScales[i] = 1;
    }

    setAudio(bass, mid, treble, energy, beat = 0) {
        this.audioBass = bass;
        this.audioMid = mid;
        this.audioTreble = treble;
        this.audioEnergy = energy;
        this.audioBeat = beat;
    }

    _clampForcePosition(force, x, y, z) {
        const inset = (CONFIG.boundaryMargin ?? 10) * 1.5;

        const hx = CONFIG.worldWidth * 0.5 - inset;
        const hy = CONFIG.worldHeight * 0.5 - inset;
        const hz = CONFIG.worldDepth * 0.5 - inset;

        force.x = Math.max(-hx, Math.min(hx, x));
        force.y = Math.max(-hy, Math.min(hy, y));
        force.z = Math.max(-hz, Math.min(hz, z));
    }

    addForce(x, y, z, type) {
        if (this.forces.length >= MAX_FORCES) {
            this.forces.shift();
        }

        const force = {
            x: 0,
            y: 0,
            z: 0,

            type,

            age: 0,

            lifetime: CONFIG.interactionLifetime,

            envelope: 1
        };

        this._clampForcePosition(force, x, y, z);

        this.forces.push(force);

        return force;
    }

    moveForce(force, x, y, z) {
        this._clampForcePosition(force, x, y, z);

        // Moving an active force should NOT reset its lifetime.
        force.age = Math.min(force.age, force.lifetime);
    }

    clearForces() {
        this.forces.length = 0;
    }

    edgeFraction() {
        const margin = Math.max(
            0.001,
            CONFIG.boundaryMargin ?? 10
        );

        const hx = CONFIG.worldWidth * 0.5 - margin;
        const hy = CONFIG.worldHeight * 0.5 - margin;
        const hz = CONFIG.worldDepth * 0.5 - margin;

        const p = this.positions;

        let edge = 0;

        for (let i = 0; i < this.count; i++) {
            const k = i * 3;

            if (
                Math.abs(p[k]) > hx ||
                Math.abs(p[k + 1]) > hy ||
                Math.abs(p[k + 2]) > hz
            ) {
                edge++;
            }
        }

        return edge / this.count;
    }

    update(
        delta,
        time = performance.now() * 0.001
    ) {

        /*
         * Update flow field.
         */
        this.flowField.update(
            time,
            this.audioEnergy,
            this.audioTreble,
            this.audioBeat
        );

        /*
         * Update force lifetime.
         */
        const forces = this.forces;

        for (let i = forces.length - 1; i >= 0; i--) {

            const force = forces[i];

            force.age += delta;

            if (force.age >= force.lifetime) {
                forces.splice(i, 1);
                continue;
            }

            /*
             * Keep the force strong for most of its lifetime.
             *
             * Small fade-in.
             * Long active period.
             * Short fade-out.
             */
            const life = force.age / force.lifetime;

            const fadeIn = Math.min(
                1,
                force.age * 12
            );

            const fadeOut = 1 - smoothstep(
                0.72,
                1.0,
                life
            );

            force.envelope = fadeIn * fadeOut;
        }

        /*
         * Movement parameters.
         */
        const maxSpeed = CONFIG.maxSpeed;
        const flowWeight = CONFIG.flowWeight;
        const maxForce = CONFIG.maxForce;

        const halfW = CONFIG.worldWidth * 0.5;
        const halfH = CONFIG.worldHeight * 0.5;
        const halfD = CONFIG.worldDepth * 0.5;

        const margin = Math.max(
            0.001,
            CONFIG.boundaryMargin ?? 10
        );

        /*
         * IMPORTANT:
         *
         * Your config calls this "boundaryForce",
         * not "boundaryStrength".
         */
        const boundary = CONFIG.boundaryForce ?? 14;

        const ramp = (p, half) => {

            const depth =
                Math.abs(p) -
                (half - margin);

            return depth > 0
                ? Math.min(1, depth / margin)
                : 0;
        };

        /*
         * Beat movement.
         */
        const beatForce =
            this.audioBeat *
            (CONFIG.beatForce ?? 1.5);

        /*
         * Beat scaling.
         */
        const beatScale =
            CONFIG.beatScale ?? 0.8;

        const smoothing =
            1 -
            Math.exp(
                -delta *
                (CONFIG.scaleSmoothing ?? 18)
            );

        /*
         * Interaction parameters.
         */
        const radius =
            CONFIG.interactionRadius ?? 20;

        const radiusSq =
            radius * radius;

        /*
         * Use the actual attractor / repulsor
         * values from config.js.
         */
        const attractorStrength =
            CONFIG.attractorStrength ?? 100;

        const repulsorStrength =
            CONFIG.repulsorStrength ?? 140;

        const forceCount = forces.length;

        const flow = this._flow;
        const field = this.flowField;

        /*
         * Process every agent.
         */
        for (let i = 0; i < this.count; i++) {

            const index = i * 3;

            let px = this.positions[index];
            let py = this.positions[index + 1];
            let pz = this.positions[index + 2];

            let vx = this.velocities[index];
            let vy = this.velocities[index + 1];
            let vz = this.velocities[index + 2];

            /*
             * -----------------------------------------
             * FLOW FIELD
             * -----------------------------------------
             */
            field.getDirectionXYZ(
                px,
                py,
                pz,
                flow
            );

            let ax =
                (flow.x * maxSpeed - vx) *
                flowWeight;

            let ay =
                (flow.y * maxSpeed - vy) *
                flowWeight;

            let az =
                (flow.z * maxSpeed - vz) *
                flowWeight;

            /*
             * Beat pushes agents along the flow.
             */
            ax += flow.x * beatForce;
            ay += flow.y * beatForce;
            az += flow.z * beatForce;

            /*
             * -----------------------------------------
             * ATTRACTORS / REPULSORS
             * -----------------------------------------
             */
            for (let f = 0; f < forceCount; f++) {

                const force = forces[f];

                const dx = force.x - px;
                const dy = force.y - py;
                const dz = force.z - pz;

                const distanceSq =
                    dx * dx +
                    dy * dy +
                    dz * dz;

                if (distanceSq >= radiusSq) {
                    continue;
                }

                const distance = Math.sqrt(
                    Math.max(distanceSq, 0.0001)
                );

                /*
                 * 0 at outer edge
                 * 1 at center
                 */
                const normalizedDistance =
                    distance / radius;

                const falloff =
                    1 -
                    normalizedDistance;

                /*
                 * Smooth force curve.
                 *
                 * This makes the force clearly visible
                 * instead of suddenly switching on/off.
                 */
                const falloffSmooth =
                    falloff * falloff *
                    (3 - 2 * falloff);

                const envelope =
                    force.envelope;

                /*
                 * -------------------------------------
                 * ATTRACTOR
                 * -------------------------------------
                 */
                if (force.type === "attract") {

                    /*
                     * Stronger toward the center.
                     */
                    const strength =
                        attractorStrength *
                        falloffSmooth *
                        envelope;

                    const invDistance =
                        1 / distance;

                    /*
                     * Direction toward attractor.
                     */
                    ax +=
                        dx *
                        invDistance *
                        strength;

                    ay +=
                        dy *
                        invDistance *
                        strength;

                    az +=
                        dz *
                        invDistance *
                        strength;

                    /*
                     * Add a little orbital motion.
                     *
                     * This prevents the attractor from
                     * looking like a simple vacuum.
                     */
                    const horizontal =
                        Math.sqrt(
                            dx * dx +
                            dz * dz
                        );

                    if (horizontal > 0.001) {

                        const swirlStrength =
                            strength *
                            0.18 /
                            horizontal;

                        ax +=
                            -dz *
                            swirlStrength;

                        az +=
                            dx *
                            swirlStrength;
                    }
                }

                /*
                 * -------------------------------------
                 * REPULSOR
                 * -------------------------------------
                 */
                else {

                    const strength =
                        repulsorStrength *
                        falloffSmooth *
                        envelope;

                    const invDistance =
                        1 / distance;

                    /*
                     * Direction AWAY from repulsor.
                     */
                    ax -=
                        dx *
                        invDistance *
                        strength;

                    ay -=
                        dy *
                        invDistance *
                        strength;

                    az -=
                        dz *
                        invDistance *
                        strength;
                }
            }

            /*
             * -----------------------------------------
             * LIMIT ACCELERATION
             * -----------------------------------------
             */
            const accelerationLength =
                Math.sqrt(
                    ax * ax +
                    ay * ay +
                    az * az
                );

            if (
                accelerationLength > maxForce &&
                accelerationLength > 0.000001
            ) {

                const s =
                    maxForce /
                    accelerationLength;

                ax *= s;
                ay *= s;
                az *= s;
            }

            /*
             * -----------------------------------------
             * BOUNDARIES
             * -----------------------------------------
             */
            const rx = ramp(px, halfW);
            const ry = ramp(py, halfH);
            const rz = ramp(pz, halfD);

            if (rx > 0) {

                ax +=
                    (px > 0 ? -1 : 1) *
                    boundary *
                    (0.3 + 1.7 * rx);
            }

            if (ry > 0) {

                ay +=
                    (py > 0 ? -1 : 1) *
                    boundary *
                    (0.3 + 1.7 * ry);
            }

            if (rz > 0) {

                az +=
                    (pz > 0 ? -1 : 1) *
                    boundary *
                    (0.3 + 1.7 * rz);
            }

            /*
             * -----------------------------------------
             * VELOCITY
             * -----------------------------------------
             */
            vx += ax * delta;
            vy += ay * delta;
            vz += az * delta;

            /*
             * Reduce outward velocity near walls.
             */
            if (
                rx > 0 &&
                vx * px > 0
            ) {
                vx *=
                    1 -
                    Math.min(
                        1,
                        delta * 6 * rx
                    );
            }

            if (
                ry > 0 &&
                vy * py > 0
            ) {
                vy *=
                    1 -
                    Math.min(
                        1,
                        delta * 6 * ry
                    );
            }

            if (
                rz > 0 &&
                vz * pz > 0
            ) {
                vz *=
                    1 -
                    Math.min(
                        1,
                        delta * 6 * rz
                    );
            }

            /*
             * -----------------------------------------
             * MAX SPEED
             * -----------------------------------------
             */
            const speed =
                Math.sqrt(
                    vx * vx +
                    vy * vy +
                    vz * vz
                );

            if (
                speed > maxSpeed &&
                speed > 0.000001
            ) {

                const s =
                    maxSpeed /
                    speed;

                vx *= s;
                vy *= s;
                vz *= s;
            }

            /*
             * -----------------------------------------
             * POSITION
             * -----------------------------------------
             */
            px += vx * delta;
            py += vy * delta;
            pz += vz * delta;

            /*
             * -----------------------------------------
             * HARD BOUNDARY
             * -----------------------------------------
             */
            if (px < -halfW) {

                px = -halfW;
                vx = Math.abs(vx) * 0.5;

            } else if (px > halfW) {

                px = halfW;
                vx = -Math.abs(vx) * 0.5;
            }

            if (py < -halfH) {

                py = -halfH;
                vy = Math.abs(vy) * 0.5;

            } else if (py > halfH) {

                py = halfH;
                vy = -Math.abs(vy) * 0.5;
            }

            if (pz < -halfD) {

                pz = -halfD;
                vz = Math.abs(vz) * 0.5;

            } else if (pz > halfD) {

                pz = halfD;
                vz = -Math.abs(vz) * 0.5;
            }

            /*
             * -----------------------------------------
             * SAFETY
             * -----------------------------------------
             */
            if (
                !Number.isFinite(
                    px +
                    py +
                    pz +
                    vx +
                    vy +
                    vz
                )
            ) {

                this.spawn(i);
                continue;
            }

            /*
             * -----------------------------------------
             * WRITE BACK
             * -----------------------------------------
             */
            this.positions[index] = px;
            this.positions[index + 1] = py;
            this.positions[index + 2] = pz;

            this.velocities[index] = vx;
            this.velocities[index + 1] = vy;
            this.velocities[index + 2] = vz;

            /*
             * -----------------------------------------
             * AUDIO SCALE
             * -----------------------------------------
             */
            const variation =
                0.85 +
                this.random[i] * 0.3;

            const target =
                1 +
                this.audioBeat *
                beatScale *
                variation;

            this.agentScales[i] +=
                (target - this.agentScales[i]) *
                smoothing;
        }
    }
}