import * as THREE from "three";

const MOVE_SPEED = 35;
const FAST_MULTIPLIER = 3;
const MOUSE_SENSITIVITY = 0.0025;

// Keep the camera inside the scene: beyond this the swarm is lost to fog
// and the far plane, which looks exactly like the agents disappearing.
const MAX_DISTANCE = 260;

export class CameraController {

    constructor(camera) {
        this.camera = camera;
        this.home = camera.position.clone();
        this.yaw = 0;
        this.pitch = 0;
        this.keys = new Set();

        this._direction = new THREE.Vector3();
        this._right = new THREE.Vector3();

        this._applyRotation();
    }

    _applyRotation() {
        this.camera.rotation.order = "YXZ";
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;
    }

    _limit() {
        const distance = this.camera.position.length();
        if (distance > MAX_DISTANCE) {
            this.camera.position.multiplyScalar(MAX_DISTANCE / distance);
        }
    }

    look(dx, dy) {
        this.yaw -= dx * MOUSE_SENSITIVITY;
        this.pitch = THREE.MathUtils.clamp(
            this.pitch - dy * MOUSE_SENSITIVITY,
            -Math.PI * 0.49,
            Math.PI * 0.49
        );
        this._applyRotation();
    }

    dolly(amount) {
        this.camera.getWorldDirection(this._direction);
        this.camera.position.addScaledVector(this._direction, amount);
        this._limit();
    }

    keyDown(key) { this.keys.add(key); }
    keyUp(key) { this.keys.delete(key); }
    clearKeys() { this.keys.clear(); }

    reset() {
        this.camera.position.copy(this.home);
        this.yaw = 0;
        this.pitch = 0;
        this._applyRotation();
    }

    update(delta) {
        const keys = this.keys;

        const forward = (keys.has("w") ? 1 : 0) - (keys.has("s") ? 1 : 0);
        const right = (keys.has("d") ? 1 : 0) - (keys.has("a") ? 1 : 0);
        // E / Q move along world Y (not camera-up), so "up" stays up after pitching.
        const vertical = (keys.has("e") ? 1 : 0) - (keys.has("q") ? 1 : 0);

        if (forward === 0 && right === 0 && vertical === 0) return;

        const speed = MOVE_SPEED * (keys.has("shift") ? FAST_MULTIPLIER : 1) * delta;

        this.camera.getWorldDirection(this._direction);
        this._right.crossVectors(this._direction, this.camera.up).normalize();

        this.camera.position.addScaledVector(this._direction, forward * speed);
        this.camera.position.addScaledVector(this._right, right * speed);
        this.camera.position.y += vertical * speed;

        this._limit();
    }
}