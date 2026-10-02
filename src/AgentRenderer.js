import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

import { CONFIG } from "./config.js";
import { CATPPUCCIN } from "./Palette.js";


const FORWARD =
    new THREE.Vector3(0, 0, 1);

const TAU =
    Math.PI * 2;


export class AgentRenderer {

    constructor(scene, simulation) {

        this.scene = scene;

        this.simulation =
            simulation;

        this.count =
            CONFIG.agentCount;

        this.baseSize =
            CONFIG.agentScale ?? 0.75;

        this.mode = null;

        this.gradient = [];

        this.mesh = null;

        this.geometry = null;

        this.material = null;


        this._dummy =
            new THREE.Object3D();

        this._velocity =
            new THREE.Vector3();

        this._color =
            new THREE.Color();


        this._geometries = {

            fish:
                this._createFishGeometry(),

            jellyfish:
                this._createJellyfishGeometry(),

            skull:
                this._createSkullGeometry(),

            shard:
                this._createShardGeometry(),

            cell:
                this._createCellGeometry()
        };


        this._createMaterial();


        this._createMesh(
            "fish"
        );
    }


    // --------------------------------------------------------
    // GEOMETRY
    // --------------------------------------------------------

    _createFishGeometry() {

        const geometry =
            new THREE.ConeGeometry(
                CONFIG.fishWidth,
                CONFIG.fishLength,
                5,
                1
            );

        geometry.rotateX(
            Math.PI * 0.5
        );

        return geometry;
    }


    _createJellyfishGeometry() {

        const parts = [];


        /*
         * Dome
         */
        const dome =
            new THREE.SphereGeometry(
                0.65,
                12,
                8,
                0,
                Math.PI * 2,
                0,
                Math.PI * 0.55
            );

        dome.scale(
            1.0,
            0.65,
            1.0
        );

        parts.push(dome);


        /*
         * Tentacles
         */
        for (let i = 0; i < 4; i++) {

            const angle =
                (i / 4) *
                Math.PI *
                2;

            const x =
                Math.cos(angle) *
                0.32;

            const z =
                Math.sin(angle) *
                0.32;

            const tentacle =
                new THREE.CylinderGeometry(
                    0.045,
                    0.025,
                    0.9,
                    5
                );

            tentacle.translate(
                x,
                -0.55,
                z
            );

            parts.push(
                tentacle
            );
        }


        const geometry =
            mergeGeometries(
                parts,
                false
            );


        for (const part of parts) {
            part.dispose();
        }


        return geometry;
    }


    _createSkullGeometry() {

        const parts = [];


        /*
         * Cranium
         */
        const head =
            new THREE.SphereGeometry(
                0.62,
                12,
                10
            );

        head.scale(
            0.9,
            1.05,
            0.75
        );

        head.translate(
            0,
            0.15,
            0
        );

        parts.push(head);


        /*
         * Jaw
         */
        const jaw =
            new THREE.BoxGeometry(
                0.55,
                0.25,
                0.42
            );

        jaw.translate(
            0,
            -0.48,
            0
        );

        parts.push(jaw);


        /*
         * Eye sockets.
         *
         * These are represented as dark geometry
         * recessed into the head.
         */
        const eye =
            new THREE.CylinderGeometry(
                0.16,
                0.16,
                0.15,
                8
            );

        eye.rotateZ(
            Math.PI * 0.5
        );

        const leftEye =
            eye.clone();

        leftEye.translate(
            -0.25,
            0.18,
            0.48
        );

        const rightEye =
            eye.clone();

        rightEye.translate(
            0.25,
            0.18,
            0.48
        );

        parts.push(
            leftEye,
            rightEye
        );


        /*
         * Nose.
         */
        const nose =
            new THREE.ConeGeometry(
                0.12,
                0.25,
                5
            );

        nose.rotateX(
            Math.PI * 0.5
        );

        nose.translate(
            0,
            -0.12,
            0.58
        );

        parts.push(nose);


        /*
         * Teeth.
         */
        for (let i = 0; i < 5; i++) {

            const tooth =
                new THREE.ConeGeometry(
                    0.045,
                    0.18,
                    5
                );

            tooth.translate(
                -0.18 +
                i * 0.09,

                -0.43,

                0.28
            );

            parts.push(
                tooth
            );
        }


        const geometry =
            mergeGeometries(
                parts,
                false
            );


        for (const part of parts) {
            part.dispose();
        }


        return geometry;
    }


    _createShardGeometry() {

        const geometry =
            new THREE.ConeGeometry(
                0.22,
                1.5,
                4,
                1
            );

        geometry.rotateX(
            Math.PI * 0.5
        );

        geometry.scale(
            1,
            1,
            0.45
        );

        return geometry;
    }


    _createCellGeometry() {

        const geometry =
            new THREE.IcosahedronGeometry(
                0.55,
                1
            );

        return geometry;
    }


    // --------------------------------------------------------
    // MATERIAL
    // --------------------------------------------------------

    _createMaterial() {

        this.material =
            new THREE.MeshStandardMaterial({

                color:
                    CATPPUCCIN.text,

                transparent: true,

                opacity: 0.5,

                roughness: 0.4,

                metalness: 0.05,

                emissive:
                    CATPPUCCIN.mauve,

                emissiveIntensity:
                    0.35,

                side:
                    THREE.DoubleSide,

                depthWrite:
                    false
            });
    }


    // --------------------------------------------------------
    // MESH
    // --------------------------------------------------------

    _createMesh(model) {

        if (this.mesh) {

            this.scene.remove(
                this.mesh
            );
        }


        this.geometry =
            this._geometries[
                model
            ];


        this.mesh =
            new THREE.InstancedMesh(

                this.geometry,

                this.material,

                this.count
            );


        this.mesh.instanceMatrix
            .setUsage(
                THREE.DynamicDrawUsage
            );


        this.mesh.frustumCulled =
            false;


        const white =
            new THREE.Color(
                1,
                1,
                1
            );


        for (
            let i = 0;
            i < this.count;
            i++
        ) {

            this.mesh.setColorAt(
                i,
                white
            );
        }


        this.mesh.instanceColor
            .setUsage(
                THREE.DynamicDrawUsage
            );


        this.scene.add(
            this.mesh
        );
    }


    // --------------------------------------------------------
    // MODE
    // --------------------------------------------------------

    setMode(mode) {

        this.mode =
            mode;


        this.gradient =
            mode.colors.map(
                hex =>
                    new THREE.Color(hex)
            );


        this.material.opacity =
            mode.opacity;


        this.material.emissiveIntensity =
            mode.emissive;


        this.material.emissive
            .setHex(
                mode.emissiveColor
            );


        if (
            mode.model &&
            this._geometries[
                mode.model
            ]
        ) {

            this._createMesh(
                mode.model
            );
        }
    }


    // --------------------------------------------------------
    // COLOR
    // --------------------------------------------------------

    _sample(t, out) {

        const last =
            this.gradient.length - 1;


        const scaled =
            THREE.MathUtils.clamp(
                t,
                0,
                1
            ) * last;


        const i =
            Math.min(
                last - 1,
                Math.floor(scaled)
            );


        out.copy(
            this.gradient[i]
        );


        out.lerp(
            this.gradient[i + 1],
            scaled - i
        );
    }


    // --------------------------------------------------------
    // UPDATE
    // --------------------------------------------------------

    update(
        audio,
        interactionPulse
    ) {

        const {
            positions,
            velocities,
            agentScales
        } =
            this.simulation;


        const mode =
            this.mode;

        const mesh =
            this.mesh;

        const dummy =
            this._dummy;

        const velocity =
            this._velocity;

        const color =
            this._color;


        const size =
            this.baseSize *
            (
                1 +
                interactionPulse *
                0.75
            );


        const invW =
            1 /
            CONFIG.worldWidth;


        const invH =
            1 /
            CONFIG.worldHeight;


        const invD =
            1 /
            CONFIG.worldDepth;


        const invR =
            1 /
            (
                0.35 *
                Math.sqrt(
                    CONFIG.worldWidth ** 2 +
                    CONFIG.worldHeight ** 2 +
                    CONFIG.worldDepth ** 2
                )
            );


        const trebleAmount =
            THREE.MathUtils.clamp(
                audio.treble * 1.8,
                0,
                1
            );


        const brightness =
            1 +
            audio.beat * 0.25 +
            audio.treble * 0.2;


        const colorBy =
            mode.colorBy;


        for (
            let i = 0;
            i < this.count;
            i++
        ) {

            const index =
                i * 3;


            const px =
                positions[index];

            const py =
                positions[index + 1];

            const pz =
                positions[index + 2];


            const vx =
                velocities[index];

            const vy =
                velocities[index + 1];

            const vz =
                velocities[index + 2];


            dummy.position.set(
                px,
                py,
                pz
            );


            const speedSq =
                vx * vx +
                vy * vy +
                vz * vz;


            if (
                speedSq >
                0.0001
            ) {

                velocity.set(
                    vx,
                    vy,
                    vz
                );


                velocity.multiplyScalar(
                    1 /
                    Math.sqrt(
                        speedSq
                    )
                );


                dummy.quaternion
                    .setFromUnitVectors(
                        FORWARD,
                        velocity
                    );
            }
            else {

                dummy.quaternion
                    .identity();
            }


            /*
             * Jellyfish look better with
             * some independent wobble.
             */
            if (
                mode.model ===
                "jellyfish"
            ) {

                dummy.rotation.z =
                    Math.sin(
                        px * 0.08 +
                        audio.energy * 4
                    ) *
                    0.12;

                dummy.rotation.x +=
                    Math.cos(
                        pz * 0.07 +
                        audio.mid * 5
                    ) *
                    0.08;
            }


            /*
             * Organic cells pulse.
             */
            if (
                mode.model ===
                "cell"
            ) {

                const pulse =
                    1 +
                    audio.energy *
                    0.45;

                dummy.scale.set(
                    size *
                    agentScales[i] *
                    pulse,

                    size *
                    agentScales[i] *
                    (
                        0.85 +
                        audio.bass * 0.25
                    ),

                    size *
                    agentScales[i] *
                    pulse
                );
            }
            else {

                dummy.scale.setScalar(
                    size *
                    agentScales[i]
                );
            }


            dummy.updateMatrix();


            mesh.setMatrixAt(
                i,
                dummy.matrix
            );


            let t;


            switch (colorBy) {

                case "depth":

                    t =
                        pz *
                        invD +
                        0.5;

                    break;


                case "height":

                    t =
                        py *
                        invH +
                        0.5;

                    break;


                case "radius":

                    t =
                        Math.sqrt(
                            px * px +
                            py * py +
                            pz * pz
                        ) *
                        invR;

                    break;


                case "angle":

                    t =
                        Math.atan2(
                            vz,
                            vx
                        ) /
                        TAU +
                        0.5;

                    break;


                default:

                    t =
                        trebleAmount;

                    break;
            }


            t +=
                (
                    (
                        i *
                        0.00073
                    ) %
                    1 -
                    0.5
                ) *
                (
                    colorBy ===
                    "treble"
                        ? 0.15
                        : 0.06
                );


            this._sample(
                t,
                color
            );


            color.multiplyScalar(
                brightness
            );


            mesh.setColorAt(
                i,
                color
            );
        }


        mesh.instanceMatrix
            .needsUpdate = true;


        mesh.instanceColor
            .needsUpdate = true;
    }
}