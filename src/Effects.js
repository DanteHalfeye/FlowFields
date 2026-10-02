import * as THREE from "three";

import {
    CONFIG
} from "./config.js";

import {
    CATPPUCCIN
} from "./Palette.js";


export class Effects {

    constructor(scene) {

        this.scene =
            scene;

        this.forceVisuals =
            [];

        this.shockwaves =
            [];

        this.energyRings =
            [];

        this.orbitals =
            [];

        this.environmentParticles =
            [];

        this.currentTheme =
            "space";


        this.ringGeometry =
            new THREE.RingGeometry(
                0.5,
                0.8,
                64
            );


        this._createStars();

        this._createBounds();

        this._createCore();

        this._createEnergyRings();

        this._createOrbitalParticles();

        this._createEnvironmentParticles();
    }


    // ========================================================
    // STARS
    // ========================================================

    _createStars() {

        const count =
            1800;

        const positions =
            new Float32Array(
                count * 3
            );


        for (
            let i = 0;
            i < count;
            i++
        ) {

            const radius =
                150 +
                Math.random() *
                180;


            const theta =
                Math.random() *
                Math.PI *
                2;


            const phi =
                Math.acos(
                    2 *
                    Math.random() -
                    1
                );


            positions[
                i * 3
            ] =
                radius *
                Math.sin(phi) *
                Math.cos(theta);


            positions[
                i * 3 + 1
            ] =
                radius *
                Math.cos(phi);


            positions[
                i * 3 + 2
            ] =
                radius *
                Math.sin(phi) *
                Math.sin(theta);
        }


        const geometry =
            new THREE.BufferGeometry();


        geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(
                positions,
                3
            )
        );


        const material =
            new THREE.PointsMaterial({

                color:
                    CATPPUCCIN.lavender,

                size:
                    0.35,

                transparent:
                    true,

                opacity:
                    0.25,

                depthWrite:
                    false,

                blending:
                    THREE.AdditiveBlending
            });


        this.stars =
            new THREE.Points(
                geometry,
                material
            );


        this.scene.add(
            this.stars
        );
    }


    // ========================================================
    // BOUNDS
    // ========================================================

    _createBounds() {

        const box =
            new THREE.BoxGeometry(

                CONFIG.worldWidth,

                CONFIG.worldHeight,

                CONFIG.worldDepth
            );


        const edges =
            new THREE.EdgesGeometry(
                box
            );


        box.dispose();


        const material =
            new THREE.LineBasicMaterial({

                color:
                    CATPPUCCIN.surface2,

                transparent:
                    true,

                opacity:
                    0.28
            });


        this.bounds =
            new THREE.LineSegments(
                edges,
                material
            );


        this.scene.add(
            this.bounds
        );
    }


    // ========================================================
    // CORE
    // ========================================================

    _createCore() {

        this.core =
            new THREE.Mesh(

                new THREE.IcosahedronGeometry(
                    4,
                    3
                ),

                new THREE.MeshBasicMaterial({

                    color:
                        CATPPUCCIN.mauve,

                    transparent:
                        true,

                    opacity:
                        0.15,

                    wireframe:
                        true,

                    blending:
                        THREE.AdditiveBlending,

                    depthWrite:
                        false
                })
            );


        this.coreGlow =
            new THREE.Mesh(

                new THREE.SphereGeometry(
                    3,
                    32,
                    32
                ),

                new THREE.MeshBasicMaterial({

                    color:
                        CATPPUCCIN.pink,

                    transparent:
                        true,

                    opacity:
                        0.12,

                    blending:
                        THREE.AdditiveBlending,

                    depthWrite:
                        false
                })
            );


        this.coreLight =
            new THREE.PointLight(
                CATPPUCCIN.mauve,
                10,
                100,
                2
            );


        this.scene.add(
            this.core,
            this.coreGlow,
            this.coreLight
        );
    }


    // ========================================================
    // ENERGY RINGS
    // ========================================================

    _createEnergyRings() {

        for (
            let i = 0;
            i < 3;
            i++
        ) {

            const material =
                new THREE.MeshBasicMaterial({

                    color:
                        CATPPUCCIN.mauve,

                    transparent:
                        true,

                    opacity:
                        0.1,

                    side:
                        THREE.DoubleSide,

                    blending:
                        THREE.AdditiveBlending,

                    depthWrite:
                        false
                });


            const ring =
                new THREE.Mesh(

                    new THREE.RingGeometry(
                        7 + i * 4,
                        7.08 + i * 4,
                        128
                    ),

                    material
                );


            ring.rotation.x =
                Math.PI * 0.5;


            ring.rotation.z =
                i *
                Math.PI /
                3;


            ring.userData.phase =
                i * 1.7;


            this.scene.add(
                ring
            );


            this.energyRings.push(
                ring
            );
        }
    }


    // ========================================================
    // ORBITAL PARTICLES
    // ========================================================

    _createOrbitalParticles() {

        const palette = [

            CATPPUCCIN.mauve,

            CATPPUCCIN.pink,

            CATPPUCCIN.blue,

            CATPPUCCIN.sky,

            CATPPUCCIN.teal
        ];


        const geometry =
            new THREE.SphereGeometry(
                0.08,
                6,
                6
            );


        this.orbitalMaterials =
            palette.map(
                color =>
                    new THREE.MeshBasicMaterial({

                        color,

                        transparent:
                            true,

                        opacity:
                            0.65,

                        blending:
                            THREE.AdditiveBlending,

                        depthWrite:
                            false
                    })
            );


        for (
            let i = 0;
            i < 250;
            i++
        ) {

            const particle =
                new THREE.Mesh(

                    geometry,

                    this.orbitalMaterials[
                        i %
                        palette.length
                    ]
                );


            particle.userData.angle =
                Math.random() *
                Math.PI *
                2;


            particle.userData.radius =
                6 +
                Math.random() *
                13;


            particle.userData.height =
                (
                    Math.random() -
                    0.5
                ) *
                7;


            particle.userData.speed =
                (
                    0.25 +
                    Math.random() *
                    0.8
                ) *
                (
                    Math.random() >
                    0.5
                        ? 1
                        : -1
                );


            this.scene.add(
                particle
            );


            this.orbitals.push(
                particle
            );
        }
    }


    // ========================================================
    // ENVIRONMENT PARTICLES
    // ========================================================

    _createEnvironmentParticles() {

        const count =
            900;


        const positions =
            new Float32Array(
                count * 3
            );


        const sizes =
            new Float32Array(
                count
            );


        for (
            let i = 0;
            i < count;
            i++
        ) {

            const index =
                i * 3;


            positions[index] =
                (
                    Math.random() -
                    0.5
                ) *
                CONFIG.worldWidth;


            positions[index + 1] =
                (
                    Math.random() -
                    0.5
                ) *
                CONFIG.worldHeight;


            positions[index + 2] =
                (
                    Math.random() -
                    0.5
                ) *
                CONFIG.worldDepth;


            sizes[i] =
                0.05 +
                Math.random() *
                0.18;
        }


        const geometry =
            new THREE.BufferGeometry();


        geometry.setAttribute(
            "position",
            new THREE.BufferAttribute(
                positions,
                3
            )
        );


        geometry.setAttribute(
            "size",
            new THREE.BufferAttribute(
                sizes,
                1
            )
        );


        const material =
            new THREE.PointsMaterial({

                color:
                    CATPPUCCIN.sky,

                size:
                    0.12,

                transparent:
                    true,

                opacity:
                    0,

                depthWrite:
                    false,

                blending:
                    THREE.AdditiveBlending
            });


        this.environment =
            new THREE.Points(
                geometry,
                material
            );


        this.scene.add(
            this.environment
        );
    }


    // ========================================================
    // MODE
    // ========================================================

    setMode(mode) {

        this.currentTheme =
            mode.theme;


        this.scene.background =
            new THREE.Color(
                mode.background
            );


        if (this.scene.fog) {

            this.scene.fog.color.setHex(
                mode.fogColor
            );

            this.scene.fog.density =
                mode.fogDensity;
        }


        this.core.material.color
            .setHex(
                mode.core
            );


        this.coreGlow.material.color
            .setHex(
                mode.glow
            );


        this.coreLight.color
            .setHex(
                mode.core
            );


        this.energyRings.forEach(
            (ring, i) => {

                ring.material.color
                    .setHex(
                        mode.rings[
                            i %
                            mode.rings.length
                        ]
                    );
            }
        );


        /*
         * Theme-specific environment.
         */

        switch (mode.theme) {

            case "space":

                this._setSpaceTheme(
                    mode
                );

                break;


            case "ocean":

                this._setOceanTheme(
                    mode
                );

                break;


            case "abyss":

                this._setAbyssTheme(
                    mode
                );

                break;


            case "plasma":

                this._setPlasmaTheme(
                    mode
                );

                break;


            case "organic":

                this._setOrganicTheme(
                    mode
                );

                break;
        }
    }


    // ========================================================
    // SPACE
    // ========================================================

    _setSpaceTheme(mode) {

        this.stars.visible =
            true;


        this.stars.material.color
            .setHex(
                mode.colors[0]
            );


        this.stars.material.size =
            0.35;


        this.stars.material.opacity =
            0.25;


        this.environment.visible =
            false;


        this.bounds.visible =
            true;


        this.bounds.material.opacity =
            0.20;
    }


    // ========================================================
    // OCEAN
    // ========================================================

    _setOceanTheme(mode) {

        this.stars.visible =
            false;


        this.environment.visible =
            true;


        this.environment.material.color
            .setHex(
                mode.colors[1]
            );


        this.environment.material.size =
            0.18;


        this.environment.material.opacity =
            0.45;


        this.bounds.visible =
            false;
    }


    // ========================================================
    // ABYSS
    // ========================================================

    _setAbyssTheme(mode) {

        this.stars.visible =
            false;


        this.environment.visible =
            true;


        this.environment.material.color
            .setHex(
                mode.colors[0]
            );


        this.environment.material.size =
            0.22;


        this.environment.material.opacity =
            0.20;


        this.bounds.visible =
            false;
    }


    // ========================================================
    // PLASMA
    // ========================================================

    _setPlasmaTheme(mode) {

        this.stars.visible =
            false;


        this.environment.visible =
            true;


        this.environment.material.color
            .setHex(
                mode.colors[0]
            );


        this.environment.material.size =
            0.24;


        this.environment.material.opacity =
            0.55;


        this.bounds.visible =
            false;
    }


    // ========================================================
    // ORGANIC
    // ========================================================

    _setOrganicTheme(mode) {

        this.stars.visible =
            false;


        this.environment.visible =
            true;


        this.environment.material.color
            .setHex(
                mode.colors[0]
            );


        this.environment.material.size =
            0.28;


        this.environment.material.opacity =
            0.45;


        this.bounds.visible =
            false;
    }


    // ========================================================
    // TRANSIENT EFFECTS
    // ========================================================

    createForceVisual(
        position,
        attract
    ) {

        const material =
            new THREE.MeshBasicMaterial({

                color:
                    attract
                        ? CATPPUCCIN.mauve
                        : CATPPUCCIN.sky,

                transparent:
                    true,

                opacity:
                    0.42,

                side:
                    THREE.DoubleSide,

                blending:
                    THREE.AdditiveBlending,

                depthWrite:
                    false
            });


        const ring =
            new THREE.Mesh(

                this.ringGeometry,

                material
            );


        ring.position.copy(
            position
        );


        ring.rotation.x =
            Math.PI * 0.5;


        ring.userData.age =
            0;


        ring.userData.attract =
            attract;


        this.scene.add(
            ring
        );


        this.forceVisuals.push(
            ring
        );
    }


    createShockwave(
        position,
        color = CATPPUCCIN.pink,
        strength = 1
    ) {

        const material =
            new THREE.MeshBasicMaterial({

                color,

                transparent:
                    true,

                opacity:
                    0.75 *
                    strength,

                side:
                    THREE.DoubleSide,

                blending:
                    THREE.AdditiveBlending,

                depthWrite:
                    false
            });


        const wave =
            new THREE.Mesh(

                this.ringGeometry,

                material
            );


        wave.position.copy(
            position
        );


        wave.rotation.x =
            Math.PI * 0.5;


        wave.userData.age =
            0;


        wave.userData.duration =
            0.65 +
            strength *
            0.25;


        wave.userData.maxScale =
            20 +
            strength *
            35;


        this.scene.add(
            wave
        );


        this.shockwaves.push(
            wave
        );
    }


    clearTransient() {

        for (
            const mesh of
            this.forceVisuals
        ) {

            this._remove(
                mesh
            );
        }


        for (
            const mesh of
            this.shockwaves
        ) {

            this._remove(
                mesh
            );
        }


        this.forceVisuals.length =
            0;


        this.shockwaves.length =
            0;
    }


    _remove(mesh) {

        this.scene.remove(
            mesh
        );


        mesh.material.dispose();
    }


    // ========================================================
    // TRANSIENT UPDATE
    // ========================================================

    _updateTransient(delta) {

        for (
            let i =
                this.forceVisuals.length - 1;

            i >= 0;

            i--
        ) {

            const ring =
                this.forceVisuals[i];


            ring.userData.age +=
                delta;


            const t =
                ring.userData.age /
                CONFIG.interactionLifetime;


            if (t >= 1) {

                this._remove(
                    ring
                );


                this.forceVisuals.splice(
                    i,
                    1
                );


                continue;
            }


            const pulse =
                Math.sin(
                    t *
                    Math.PI *
                    8
                ) *
                0.08;


            ring.scale.setScalar(

                1 +

                t *
                CONFIG.interactionRadius *
                1.4 +

                pulse
            );


            ring.material.opacity =
                Math.pow(
                    1 - t,
                    1.5
                ) *
                0.42;


            ring.rotation.z +=

                delta *
                (
                    ring.userData.attract
                        ? 1.8
                        : -1.8
                );
        }


        for (
            let i =
                this.shockwaves.length - 1;

            i >= 0;

            i--
        ) {

            const wave =
                this.shockwaves[i];


            wave.userData.age +=
                delta;


            const t =
                wave.userData.age /
                wave.userData.duration;


            if (t >= 1) {

                this._remove(
                    wave
                );


                this.shockwaves.splice(
                    i,
                    1
                );


                continue;
            }


            const eased =
                1 -
                Math.pow(
                    1 - t,
                    3
                );


            wave.scale.setScalar(

                1 +
                eased *
                wave.userData.maxScale
            );


            wave.material.opacity =
                Math.pow(
                    1 - t,
                    2
                ) *
                0.8;
        }
    }


    // ========================================================
    // UPDATE
    // ========================================================

    update(
        now,
        delta,
        audio,
        pulse
    ) {

        const t =
            now *
            0.001;


        const e =
            audio.energy;


        const bass =
            audio.bass;


        // ----------------------------------------------------
        // CORE
        // ----------------------------------------------------

        const coreScale =

            1 +

            e * 0.8 +

            pulse * 0.45 +

            Math.sin(
                t * 2.5
            ) *
            0.05;


        this.core.scale
            .setScalar(
                coreScale
            );


        this.core.rotation.x +=
            0.002 +
            e * 0.01;


        this.core.rotation.y +=
            0.003 +
            bass * 0.015;


        this.core.material.opacity =

            0.08 +

            e * 0.18 +

            pulse * 0.08;


        this.coreGlow.scale
            .setScalar(
                coreScale *
                1.2
            );


        this.coreGlow.material.opacity =

            0.08 +

            e * 0.2 +

            pulse * 0.12;


        this.coreLight.intensity =

            7 +

            e * 25 +

            pulse * 25;


        this.coreLight.distance =

            70 +

            e * 40 +

            pulse * 25;


        // ----------------------------------------------------
        // RINGS
        // ----------------------------------------------------

        for (
            let i = 0;
            i < this.energyRings.length;
            i++
        ) {

            const ring =
                this.energyRings[i];


            ring.rotation.z +=

                0.0008 +

                e * 0.006 +

                pulse * 0.004;


            ring.rotation.y +=

                Math.sin(
                    t +
                    ring.userData.phase
                ) *
                0.0004;


            ring.scale.setScalar(

                1 +

                e *
                (
                    0.15 +
                    i * 0.08
                ) +

                pulse *
                (
                    0.1 +
                    i * 0.05
                )
            );


            ring.material.opacity =

                0.045 +

                e *
                (
                    0.1 +
                    i * 0.025
                ) +

                pulse *
                0.06;
        }


        // ----------------------------------------------------
        // ORBITALS
        // ----------------------------------------------------

        const orbitalOpacity =

            0.35 +

            e * 0.45 +

            pulse * 0.2;


        for (
            const material of
            this.orbitalMaterials
        ) {

            material.opacity =
                orbitalOpacity;
        }


        const orbitSpeed =

            0.008 +

            e * 0.025 +

            pulse * 0.012;


        const radiusFactor =

            1 +

            e * 0.15 +

            pulse * 0.25;


        const particleScale =

            1 +

            bass * 2 +

            pulse * 1.5;


        for (
            const particle of
            this.orbitals
        ) {

            const data =
                particle.userData;


            data.angle +=
                data.speed *
                orbitSpeed;


            const radius =
                data.radius *
                radiusFactor;


            particle.position.set(

                Math.cos(
                    data.angle
                ) *
                radius,

                data.height +

                Math.sin(
                    data.angle * 2
                ) *
                0.8 *
                e,

                Math.sin(
                    data.angle
                ) *
                radius
            );


            particle.scale
                .setScalar(
                    particleScale
                );
        }


        // ----------------------------------------------------
        // ENVIRONMENT
        // ----------------------------------------------------

        if (
            this.environment.visible
        ) {

            this.environment.rotation.y +=

                0.0001 +

                e *
                0.0005;


            this.environment.material.opacity =

                (
                    0.15 +
                    e * 0.35 +
                    pulse * 0.15
                );


            /*
             * Organic / ocean particles
             * slowly drift vertically.
             */
            if (
                this.currentTheme ===
                "ocean"
            ) {

                this.environment.rotation.x +=
                    delta *
                    0.0008;
            }


            if (
                this.currentTheme ===
                "organic"
            ) {

                this.environment.rotation.z +=
                    delta *
                    0.0005;
            }
        }


        // ----------------------------------------------------
        // STARS
        // ----------------------------------------------------

        if (
            this.stars.visible
        ) {

            this.stars.rotation.y +=

                0.00005 +

                e *
                0.0003;


            this.stars.rotation.x +=
                0.00001;


            this.stars.material.opacity =

                0.25 +

                e * 0.25 +

                pulse * 0.08;
        }


        // ----------------------------------------------------
        // TRANSIENT
        // ----------------------------------------------------

        this._updateTransient(
            delta
        );
    }
}