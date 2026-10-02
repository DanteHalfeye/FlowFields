import * as THREE from "three";
import { CONFIG } from "./config.js";
import { SteeringBehavior } from "./SteeringBehavior.js";

export class Agent {

    constructor(position) {

        this.position =
            position.clone();

        this.velocity =
            new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            );

        this.velocity.normalize();

        this.velocity.multiplyScalar(
            CONFIG.maxSpeed * 0.5
        );

        this.acceleration =
            new THREE.Vector3();

        this.maxSpeed =
            CONFIG.maxSpeed;

        this.maxForce =
            CONFIG.maxForce;

        this.mesh =
            this.createMesh();
    }

    createMesh() {

        /*
         * Cone points forward.
         *
         * The object looks more like
         * a fish/bird than a sphere.
         */

        const geometry =
            new THREE.ConeGeometry(
                0.35,
                1.5,
                6
            );

        geometry.rotateZ(
            -Math.PI / 2
        );

        const material =
            new THREE.MeshStandardMaterial({
                color: 0xff8844,
                roughness: 0.7
            });

        const mesh =
            new THREE.Mesh(
                geometry,
                material
            );

        mesh.castShadow = true;

        return mesh;
    }

    applyForce(force) {

        this.acceleration.add(
            force
        );
    }

    update(
        deltaTime,
        flowField,
        agents
    ) {

        this.acceleration.set(
            0,
            0,
            0
        );

        /*
         * FLOW FIELD
         */

        const flow =
            SteeringBehavior.flow(
                this,
                flowField
            );

        flow.multiplyScalar(
            CONFIG.flowWeight
        );

        this.applyForce(flow);

        /*
         * FLOCKING
         */

        const flock =
            SteeringBehavior.flock(
                this,
                agents
            );

        this.applyForce(
            flock.separation
        );

        this.applyForce(
            flock.alignment
        );

        this.applyForce(
            flock.cohesion
        );

        /*
         * OBSTACLES
         */

        const obstacle =
            SteeringBehavior.obstacleAvoidance(
                this,
                flowField
            );

        obstacle.multiplyScalar(
            CONFIG.obstacleWeight
        );

        this.applyForce(
            obstacle
        );

        /*
         * BOUNDARIES
         */

        this.applyForce(
            SteeringBehavior.boundary(
                this
            )
        );

        /*
         * Limit acceleration.
         */

        SteeringBehavior.limit(
            this.acceleration,
            this.maxForce
        );

        /*
         * Integrate.
         */

        this.velocity.add(
            this.acceleration.clone()
                .multiplyScalar(
                    deltaTime
                )
        );

        SteeringBehavior.limit(
            this.velocity,
            this.maxSpeed
        );

        this.position.add(
            this.velocity.clone()
                .multiplyScalar(
                    deltaTime
                )
        );

        /*
         * Update visual.
         */

        this.mesh.position.copy(
            this.position
        );

        /*
         * Point the fish/bird in
         * its direction of travel.
         */

        if (this.velocity.lengthSq() > 0.001) {

            const direction =
                this.velocity.clone()
                    .normalize();

            const target =
                this.position.clone()
                    .add(direction);

            this.mesh.lookAt(
                target
            );
        }
    }
}