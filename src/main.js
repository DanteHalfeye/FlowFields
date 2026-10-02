import * as THREE from "three";

import {
    EffectComposer
} from "three/addons/postprocessing/EffectComposer.js";

import {
    RenderPass
} from "three/addons/postprocessing/RenderPass.js";

import {
    UnrealBloomPass
} from "three/addons/postprocessing/UnrealBloomPass.js";

import {
    OutputPass
} from "three/addons/postprocessing/OutputPass.js";


import { CONFIG } from "./config.js";

import {
    CATPPUCCIN,
    VISUAL_MODES
} from "./Palette.js";


import { FlowField }
    from "./FlowField.js";

import { AgentSimulation }
    from "./AgentSimulation.js";

import { AgentRenderer }
    from "./AgentRenderer.js";

import { AudioAnalyzer }
    from "./AudioAnalyzer.js";

import { CameraController }
    from "./CameraController.js";

import { Effects }
    from "./Effects.js";

import { InputController }
    from "./InputController.js";

import { MotionBlurPass }
    from "./MotionBlurPass.js";


let scene;

let camera;

let renderer;

let composer;

let bloomPass;

let motionBlurPass;


let simulation;

let agents;

let effects;

let input;

let cameraController;


const audio =
    new AudioAnalyzer();


let currentMode =
    VISUAL_MODES[1];


let lastTime =
    performance.now();


let fpsFrames =
    0;

let fpsLastTime =
    lastTime;

let currentFPS =
    0;


// ============================================================
// INIT
// ============================================================

function init() {

    scene =
        new THREE.Scene();


    scene.background =
        new THREE.Color(
            CATPPUCCIN.crust
        );


    scene.fog =
        new THREE.FogExp2(
            CATPPUCCIN.crust,
            0.0035
        );


    // --------------------------------------------------------
    // CAMERA
    // --------------------------------------------------------

    camera =
        new THREE.PerspectiveCamera(

            60,

            window.innerWidth /
            window.innerHeight,

            0.1,

            600
        );


    camera.position.set(
        0,
        0,
        110
    );


    cameraController =
        new CameraController(
            camera
        );


    // --------------------------------------------------------
    // RENDERER
    // --------------------------------------------------------

    renderer =
        new THREE.WebGLRenderer({

            antialias: false,

            powerPreference:
                "high-performance"
        });


    renderer.setPixelRatio(

        Math.min(
            window.devicePixelRatio,
            CONFIG.pixelRatio
        )
    );


    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );


    renderer.outputColorSpace =
        THREE.SRGBColorSpace;


    renderer.toneMapping =
        THREE.ACESFilmicToneMapping;


    renderer.toneMappingExposure =
        1.05;


    document.body.appendChild(
        renderer.domElement
    );


    // --------------------------------------------------------
    // COMPOSER
    // --------------------------------------------------------

    composer =
        new EffectComposer(
            renderer
        );


    composer.addPass(

        new RenderPass(
            scene,
            camera
        )
    );


    // --------------------------------------------------------
    // BLOOM
    // --------------------------------------------------------

    bloomPass =
        new UnrealBloomPass(

            new THREE.Vector2(
                window.innerWidth,
                window.innerHeight
            ),

            0.32,

            0.55,

            0.35
        );


    composer.addPass(
        bloomPass
    );


    // --------------------------------------------------------
    // MOTION BLUR
    // --------------------------------------------------------

    motionBlurPass =
        new MotionBlurPass(

            window.innerWidth,
            window.innerHeight
        );


    motionBlurPass.persistence =
        0.72;


    motionBlurPass.intensity =
        0.85;


    composer.addPass(
        motionBlurPass
    );


    // --------------------------------------------------------
    // OUTPUT
    // --------------------------------------------------------

    composer.addPass(
        new OutputPass()
    );


    // --------------------------------------------------------
    // LIGHT
    // --------------------------------------------------------

    scene.add(

        new THREE.HemisphereLight(

            CATPPUCCIN.lavender,

            CATPPUCCIN.crust,

            0.55
        )
    );


    // --------------------------------------------------------
    // SIMULATION
    // --------------------------------------------------------

    simulation =
        new AgentSimulation(
            new FlowField()
        );


    // --------------------------------------------------------
    // AGENTS
    // --------------------------------------------------------

    agents =
        new AgentRenderer(
            scene,
            simulation
        );


    // --------------------------------------------------------
    // EFFECTS
    // --------------------------------------------------------

    effects =
        new Effects(
            scene
        );


    // --------------------------------------------------------
    // INPUT
    // --------------------------------------------------------

    input =
        new InputController({

            domElement:
                renderer.domElement,

            camera,

            cameraController,

            simulation,

            effects,

            onModeChange:
                setMode
        });


    // --------------------------------------------------------
    // START MODE
    // --------------------------------------------------------

    setMode(1);


    // --------------------------------------------------------
    // EVENTS
    // --------------------------------------------------------

    window.addEventListener(
        "resize",
        onResize
    );


    // --------------------------------------------------------
    // AUDIO
    // --------------------------------------------------------

    const audioStatus =
        document.getElementById(
            "audioStatus"
        );


    audio.onStatus =
        text => {

            if (audioStatus) {

                audioStatus.textContent =
                    text;
            }
        };


    const startButton =
        document.getElementById(
            "startButton"
        );


    if (startButton) {

        startButton.addEventListener(
            "click",
            startAudio
        );
    }


    requestAnimationFrame(
        animate
    );
}


// ============================================================
// MODE
// ============================================================

function setMode(number) {

    const mode =
        VISUAL_MODES[number];


    if (!mode) {
        return;
    }


    currentMode =
        mode;


    // --------------------------------------------------------
    // AGENT MODEL + MATERIAL
    // --------------------------------------------------------

    agents.setMode(
        mode
    );


    // --------------------------------------------------------
    // ENVIRONMENT
    // --------------------------------------------------------

    effects.setMode(
        mode
    );


    // --------------------------------------------------------
    // TEMPORAL EFFECT
    // --------------------------------------------------------

    motionBlurPass.persistence =
        mode.motionBlur ??
        0.72;


    motionBlurPass.intensity =
        mode.motionIntensity ??
        0.85;


    // --------------------------------------------------------
    // RESET HISTORY
    // --------------------------------------------------------

    motionBlurPass.reset();
}


// ============================================================
// AUDIO
// ============================================================

async function startAudio() {

    const ok =
        await audio.start();


    if (!ok) {
        return;
    }


    const startScreen =
        document.getElementById(
            "startScreen"
        );


    if (startScreen) {

        startScreen.style.opacity =
            "0";


        startScreen.style.visibility =
            "hidden";


        setTimeout(

            () => {

                startScreen.style.display =
                    "none";

            },

            900
        );
    }
}


// ============================================================
// HUD
// ============================================================

function updateHUD() {

    const stats =
        document.getElementById(
            "stats"
        );


    if (!stats) {
        return;
    }


    stats.innerHTML =

        `FPS: ${
            Math.round(
                currentFPS
            )
        }<br>` +

        `AGENTS: ${
            CONFIG.agentCount
                .toLocaleString()
        }<br>` +

        `ENERGY: ${
            Math.round(
                audio.energy *
                100
            )
        }%<br>` +

        `EDGE: ${
            Math.round(
                simulation.edgeFraction() *
                100
            )
        }%<br>` +

        `MODE: ${
            currentMode.name
        }`;
}


// ============================================================
// FPS
// ============================================================

function updateFPS(time) {

    fpsFrames++;


    const elapsed =
        time -
        fpsLastTime;


    if (elapsed >= 500) {

        currentFPS =

            (
                fpsFrames *
                1000
            ) /
            elapsed;


        fpsFrames = 0;


        fpsLastTime =
            time;


        updateHUD();
    }
}


// ============================================================
// RESIZE
// ============================================================

function onResize() {

    camera.aspect =

        window.innerWidth /
        window.innerHeight;


    camera.updateProjectionMatrix();


    const pixelRatio =

        Math.min(

            window.devicePixelRatio,

            CONFIG.pixelRatio
        );


    renderer.setPixelRatio(
        pixelRatio
    );


    renderer.setSize(

        window.innerWidth,

        window.innerHeight
    );


    composer.setPixelRatio(
        pixelRatio
    );


    composer.setSize(

        window.innerWidth,

        window.innerHeight
    );


    motionBlurPass.setSize(

        window.innerWidth,

        window.innerHeight
    );


    motionBlurPass.reset();
}


// ============================================================
// ANIMATION
// ============================================================

function animate(time) {

    requestAnimationFrame(
        animate
    );


    const delta =

        Math.min(

            Math.max(

                (
                    time -
                    lastTime
                ) /
                1000,

                0
            ),

            0.033
        );


    lastTime =
        time;


    // --------------------------------------------------------
    // AUDIO
    // --------------------------------------------------------

    audio.update(
        delta
    );


    // --------------------------------------------------------
    // SIMULATION AUDIO
    // --------------------------------------------------------

    simulation.setAudio(

        audio.bass,

        audio.mid,

        audio.treble,

        audio.energy,

        audio.beat
    );


    // --------------------------------------------------------
    // CAMERA
    // --------------------------------------------------------

    cameraController.update(
        delta
    );


    // --------------------------------------------------------
    // INPUT
    // --------------------------------------------------------

    input.update(
        delta,
        audio.energy
    );


    // --------------------------------------------------------
    // SIMULATION
    // --------------------------------------------------------

    simulation.update(

        delta,

        time *
        0.001
    );


    // --------------------------------------------------------
    // AGENTS
    // --------------------------------------------------------

    agents.update(

        audio,

        input.pulse
    );


    // --------------------------------------------------------
    // EFFECTS
    // --------------------------------------------------------

    effects.update(

        time,

        delta,

        audio,

        input.pulse
    );


    // --------------------------------------------------------
    // BLOOM
    // --------------------------------------------------------

    bloomPass.strength =

        currentMode.bloom +

        audio.energy *
        0.45 +

        audio.bass *
        0.2 +

        input.pulse *
        0.18;


    bloomPass.radius =

        0.55 +

        audio.energy *
        0.15;


    bloomPass.threshold =
        0.35;


    // --------------------------------------------------------
    // MOTION BLUR
    // --------------------------------------------------------

    motionBlurPass.persistence =

        THREE.MathUtils.clamp(

            currentMode.motionBlur +

            audio.energy *
            0.08 +

            input.pulse *
            0.06,

            0.45,

            0.90
        );


    motionBlurPass.intensity =

        THREE.MathUtils.clamp(

            currentMode.motionIntensity +

            audio.energy *
            0.08 +

            input.pulse *
            0.05,

            0.60,

            1.0
        );


    // --------------------------------------------------------
    // RENDER
    // --------------------------------------------------------

    composer.render();


    // --------------------------------------------------------
    // FPS
    // --------------------------------------------------------

    updateFPS(
        time
    );
}


// ============================================================
// START
// ============================================================

init();