import * as THREE from "three";
import { Pass } from "three/addons/postprocessing/Pass.js";

const vertexShader = /* glsl */ `
    varying vec2 vUv;

    void main() {
        vUv = uv;

        gl_Position =
            projectionMatrix *
            modelViewMatrix *
            vec4(position, 1.0);
    }
`;

const fragmentShader = /* glsl */ `
    uniform sampler2D tCurrent;
    uniform sampler2D tPrevious;

    uniform float persistence;
    uniform float intensity;

    varying vec2 vUv;

    void main() {

        vec4 current =
            texture2D(tCurrent, vUv);

        vec4 previous =
            texture2D(tPrevious, vUv);

        /*
         * Current frame is always present.
         *
         * Previous frame fades according to
         * persistence.
         */
        vec3 color =
            current.rgb +
            previous.rgb *
            persistence *
            intensity;

        /*
         * Prevent unlimited accumulation.
         */
        color =
            min(color, vec3(1.0));

        gl_FragColor =
            vec4(color, 1.0);
    }
`;

export class MotionBlurPass extends Pass {

    constructor(width, height) {
        super();

        this.needsSwap = true;

        this.persistence = 0.72;
        this.intensity = 0.85;

        this._initialized = false;

        this.previousBuffer =
            new THREE.WebGLRenderTarget(
                width,
                height,
                {
                    minFilter: THREE.LinearFilter,
                    magFilter: THREE.LinearFilter,
                    format: THREE.RGBAFormat,
                    type: THREE.HalfFloatType,
                    depthBuffer: false,
                    stencilBuffer: false
                }
            );

        this.material =
            new THREE.ShaderMaterial({

                uniforms: {

                    tCurrent: {
                        value: null
                    },

                    tPrevious: {
                        value:
                            this.previousBuffer.texture
                    },

                    persistence: {
                        value:
                            this.persistence
                    },

                    intensity: {
                        value:
                            this.intensity
                    }
                },

                vertexShader,

                fragmentShader,

                depthWrite: false,

                depthTest: false
            });

        this.quad =
            new THREE.Mesh(
                new THREE.PlaneGeometry(2, 2),
                this.material
            );

        this.scene =
            new THREE.Scene();

        this.camera =
            new THREE.OrthographicCamera(
                -1,
                1,
                1,
                -1,
                0,
                1
            );

        this.scene.add(this.quad);
    }

    setSize(width, height) {

        this.previousBuffer.setSize(
            width,
            height
        );
    }

    render(
        renderer,
        writeBuffer,
        readBuffer
    ) {

        /*
         * First frame:
         *
         * There is no previous frame yet,
         * so display the current frame directly
         * and initialize the history buffer.
         */
        if (!this._initialized) {

            this.material.uniforms.tCurrent.value =
                readBuffer.texture;

            this.material.uniforms.tPrevious.value =
                readBuffer.texture;

            this.material.uniforms.persistence.value =
                0.0;

            renderer.setRenderTarget(
                writeBuffer
            );

            renderer.render(
                this.scene,
                this.camera
            );

            /*
             * Copy current frame into history.
             */
            renderer.setRenderTarget(
                this.previousBuffer
            );

            renderer.render(
                this.scene,
                this.camera
            );

            this.material.uniforms.persistence.value =
                this.persistence;

            this._initialized = true;

            renderer.setRenderTarget(null);

            return;
        }

        /*
         * Current composer frame.
         */
        this.material.uniforms.tCurrent.value =
            readBuffer.texture;

        this.material.uniforms.tPrevious.value =
            this.previousBuffer.texture;

        this.material.uniforms.persistence.value =
            this.persistence;

        this.material.uniforms.intensity.value =
            this.intensity;

        /*
         * Produce:
         *
         * current + previous
         */
        renderer.setRenderTarget(
            writeBuffer
        );

        renderer.render(
            this.scene,
            this.camera
        );

        /*
         * Save the resulting frame as history.
         *
         * We render the same composited image
         * into the history buffer.
         */
        this.material.uniforms.tCurrent.value =
            writeBuffer.texture;

        this.material.uniforms.tPrevious.value =
            writeBuffer.texture;

        this.material.uniforms.persistence.value =
            0.0;

        renderer.setRenderTarget(
            this.previousBuffer
        );

        renderer.render(
            this.scene,
            this.camera
        );

        /*
         * Restore uniforms.
         */
        this.material.uniforms.persistence.value =
            this.persistence;

        renderer.setRenderTarget(null);
    }

    reset() {

        this._initialized = false;
    }

    dispose() {

        this.previousBuffer.dispose();

        this.material.dispose();

        this.quad.geometry.dispose();
    }
}