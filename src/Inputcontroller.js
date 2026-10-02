import * as THREE from "three";
import { CONFIG } from "./config.js";
import { CATPPUCCIN } from "./Palette.js";


export class InputController {

    constructor({ domElement, camera, cameraController, simulation, effects, onModeChange }) {
        this.dom = domElement;
        this.camera = camera;
        this.cameraController = cameraController;
        this.simulation = simulation;
        this.effects = effects;
        this.onModeChange = onModeChange;

        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.plane = new THREE.Plane();
        this.point = new THREE.Vector3();
        this._direction = new THREE.Vector3();
        this._anchor = new THREE.Vector3();

        this.pointerInside = false;
        this.leftDown = false;
        this.dragging = false;
        this.prevX = 0;
        this.prevY = 0;

        this.pulse = 0;
        this.cooldown = 0;
        this.audioEnergy = 0;

        this._bind();
    }

    _bind() {
        window.addEventListener("pointermove", e => this._onPointerMove(e));
        window.addEventListener("pointerdown", e => this._onPointerDown(e));
        window.addEventListener("pointerup", e => this._onPointerUp(e));
        this.dom.addEventListener("pointerleave", () => this._release());
        window.addEventListener("blur", () => {
            this._release();
            this.cameraController.clearKeys();
        });
        window.addEventListener("wheel", e => {
            e.preventDefault();
            this.cameraController.dolly(-e.deltaY * 0.08);
        }, { passive: false });
        window.addEventListener("keydown", e => this._onKeyDown(e));
        window.addEventListener("keyup", e => this.cameraController.keyUp(e.key.toLowerCase()));
        window.addEventListener("contextmenu", e => e.preventDefault());
    }

    _release() {
        this.pointerInside = false;
        this.leftDown = false;
        this.dragging = false;
    }

    // Plane facing the camera, a fixed distance ahead of it. The old fixed z = 0
    // plane misbehaved as soon as the camera was rotated or moved.
    _project(event) {
        if (event) {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        }

        this.raycaster.setFromCamera(this.mouse, this.camera);
        this.camera.getWorldDirection(this._direction);

        const distance = Math.max(30, this.camera.position.length());
        this._anchor.copy(this.camera.position).addScaledVector(this._direction, distance);
        this.plane.setFromNormalAndCoplanarPoint(this._direction.negate(), this._anchor);

        this.pointerInside = this.raycaster.ray.intersectPlane(this.plane, this.point) !== null;
    }

    _onPointerMove(event) {
        if (this.dragging) {
            this.cameraController.look(event.clientX - this.prevX, event.clientY - this.prevY);
        }

        this.prevX = event.clientX;
        this.prevY = event.clientY;

        this._project(event);
    }

    _onPointerDown(event) {
        if (event.target !== this.dom) return;   // ignore start screen / HUD clicks

        this.prevX = event.clientX;
        this.prevY = event.clientY;

        if (event.button === 2) {
            this.dragging = true;
        } else if (event.button === 0) {
            this._project(event);
            if (this.pointerInside) {
                this.leftDown = true;
                this._trigger(true);
            }
        }
    }

    _onPointerUp(event) {
        if (event.button === 0) this.leftDown = false;
        if (event.button === 2) this.dragging = false;
    }

    _trigger(attract) {
        const type = attract ? "attract" : "repulse";
        const radius = CONFIG.interactionRadius * (1 + this.audioEnergy * 0.7);
        const secondaryRadius = radius * 0.55;
        const p = this.point;

        this.simulation.addForce(p.x, p.y, p.z, type);

        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            this.simulation.addForce(
                p.x + Math.cos(angle) * secondaryRadius,
                p.y + Math.sin(angle * 1.7) * secondaryRadius * 0.35,
                p.z + Math.sin(angle) * secondaryRadius,
                type
            );
        }

        this.pulse = Math.min(1, this.pulse + 0.9);
        this.effects.createForceVisual(p, attract);
        this.effects.createShockwave(p, attract ? CATPPUCCIN.mauve : CATPPUCCIN.sky, 1.3);
    }

    _randomPosition() {
        return new THREE.Vector3(
            (Math.random() - 0.5) * CONFIG.worldWidth,
            (Math.random() - 0.5) * CONFIG.worldHeight,
            (Math.random() - 0.5) * CONFIG.worldDepth
        );
    }

    _addForceAt(position, attract) {
        this.simulation.addForce(position.x, position.y, position.z, attract ? "attract" : "repulse");
        this.effects.createForceVisual(position, attract);
        this.effects.createShockwave(position, attract ? CATPPUCCIN.mauve : CATPPUCCIN.sky, 1);
    }

    _onKeyDown(event) {
        const key = event.key.toLowerCase();
        this.cameraController.keyDown(key);

        if (event.repeat) return;

        if (key === "f") {
            this._addForceAt(this._randomPosition(), true);
        } else if (key === "r") {
            this._addForceAt(this._randomPosition(), false);
        } else if (key === "x") {
            const center = new THREE.Vector3();
            this.simulation.addForce(0, 0, 0, "repulse");

            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                this.simulation.addForce(
                    Math.cos(angle) * 18,
                    Math.sin(angle * 1.5) * 6,
                    Math.sin(angle) * 18,
                    "repulse"
                );
            }

            this.effects.createShockwave(center, CATPPUCCIN.pink, 2);
            this.effects.createShockwave(center, CATPPUCCIN.text, 0.8);
            this.pulse = 1;
        } else if (event.code === "Space") {
            event.preventDefault();
            this.simulation.clearForces();
            this.effects.clearTransient();
        } else if (/^[1-5]$/.test(key)) {
            this.onModeChange(Number(key));
        } else if (key === "0" || key === "home") {
            this.cameraController.reset();
        }
    }

    update(delta, audioEnergy) {
        this.audioEnergy = audioEnergy;
        this.cooldown -= delta;
        this.pulse = Math.max(0, this.pulse - delta * 3.5);

        if (this.pointerInside) this._project();   // keep following the camera

        if (!this.pointerInside || !this.leftDown || this.cooldown > 0) return;

        this.simulation.addForce(this.point.x, this.point.y, this.point.z, "attract");
        this.cooldown = 0.08;
        this.pulse = Math.max(this.pulse, 0.35);
    }
}