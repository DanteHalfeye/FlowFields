import * as THREE from "three";
import { CONFIG } from "./config.js";

export class SteeringBehavior {

    static limit(vector, max) {

        if (vector.lengthSq() > max * max) {
            vector.setLength(max);
        }

        return vector;
    }

    static flow(agent, flowField) {

        const direction =
            flowField.getDirection(
                agent.position
            );

        if (direction.lengthSq() === 0) {
            return new THREE.Vector3();
        }

        const desired =
            direction.clone()
                .multiplyScalar(
                    agent.maxSpeed
                );

        return desired.sub(
            agent.velocity
        );
    }

    static separation(agent, agents) {

        const steering =
            new THREE.Vector3();

        let count = 0;

        for (const other of agents) {

            if (other === agent)
                continue;

            const offset =
                agent.position.clone()
                    .sub(other.position);

            const distanceSq =
                offset.lengthSq();

            if (
                distanceSq === 0 ||
                distanceSq >
                CONFIG.separationRadius *
                CONFIG.separationRadius
            ) {
                continue;
            }

            const distance =
                Math.sqrt(distanceSq);

            /*
             * Stronger push when closer.
             */

            offset.normalize();

            offset.multiplyScalar(
                1 / distance
            );

            steering.add(offset);

            count++;
        }

        if (count > 0) {

            steering.divideScalar(count);

            steering.normalize();

            steering.multiplyScalar(
                agent.maxSpeed
            );

            steering.sub(
                agent.velocity
            );
        }

        return steering;
    }

    static alignment(agent, agents) {

        const averageVelocity =
            new THREE.Vector3();

        let count = 0;

        const radiusSq =
            CONFIG.alignmentRadius *
            CONFIG.alignmentRadius;

        for (const other of agents) {

            if (other === agent)
                continue;

            const distanceSq =
                agent.position.distanceToSquared(
                    other.position
                );

            if (distanceSq > radiusSq)
                continue;

            averageVelocity.add(
                other.velocity
            );

            count++;
        }

        if (count === 0) {
            return new THREE.Vector3();
        }

        averageVelocity.divideScalar(count);

        averageVelocity.normalize();

        averageVelocity.multiplyScalar(
            agent.maxSpeed
        );

        return averageVelocity.sub(
            agent.velocity
        );
    }

    static cohesion(agent, agents) {

        const center =
            new THREE.Vector3();

        let count = 0;

        const radiusSq =
            CONFIG.cohesionRadius *
            CONFIG.cohesionRadius;

        for (const other of agents) {

            if (other === agent)
                continue;

            const distanceSq =
                agent.position.distanceToSquared(
                    other.position
                );

            if (distanceSq > radiusSq)
                continue;

            center.add(
                other.position
            );

            count++;
        }

        if (count === 0) {
            return new THREE.Vector3();
        }

        center.divideScalar(count);

        const desired =
            center.sub(
                agent.position
            );

        if (desired.lengthSq() === 0) {
            return new THREE.Vector3();
        }

        desired.normalize();

        desired.multiplyScalar(
            agent.maxSpeed
        );

        return desired.sub(
            agent.velocity
        );
    }

    static obstacleAvoidance(
        agent,
        flowField
    ) {

        const steering =
            new THREE.Vector3();

        const ahead =
            agent.velocity.clone();

        if (ahead.lengthSq() === 0)
            return steering;

        ahead.normalize();

        ahead.multiplyScalar(
            CONFIG.obstacleAvoidanceDistance
        );

        const probe =
            agent.position.clone()
                .add(ahead);

        const grid =
            flowField.worldToGrid(
                probe
            );

        /*
         * Check the cell we're approaching.
         */

        if (
            flowField.isValidCell(
                grid.x,
                grid.y,
                grid.z
            ) &&
            !flowField.isWalkable(
                grid.x,
                grid.y,
                grid.z
            )
        ) {

            const obstacleCenter =
                flowField.gridToWorld(
                    grid.x,
                    grid.y,
                    grid.z
                );

            steering
                .copy(agent.position)
                .sub(obstacleCenter);

            if (steering.lengthSq() > 0) {

                steering.normalize();

                steering.multiplyScalar(
                    agent.maxSpeed
                );

                steering.sub(
                    agent.velocity
                );
            }
        }

        return steering;
    }

    static boundary(agent) {

        const force =
            new THREE.Vector3();

        const margin = 5;

        const halfWidth =
            CONFIG.worldWidth / 2;

        const halfDepth =
            CONFIG.worldDepth / 2;

        if (
            agent.position.x <
            -halfWidth + margin
        ) {

            force.x +=
                CONFIG.boundaryForce;
        }

        if (
            agent.position.x >
            halfWidth - margin
        ) {

            force.x -=
                CONFIG.boundaryForce;
        }

        if (
            agent.position.y <
            margin
        ) {

            force.y +=
                CONFIG.boundaryForce;
        }

        if (
            agent.position.y >
            CONFIG.worldHeight - margin
        ) {

            force.y -=
                CONFIG.boundaryForce;
        }

        if (
            agent.position.z <
            -halfDepth + margin
        ) {

            force.z +=
                CONFIG.boundaryForce;
        }

        if (
            agent.position.z >
            halfDepth - margin
        ) {

            force.z -=
                CONFIG.boundaryForce;
        }

        return force;
    }

    static flock(agent, agents) {

        const separation =
            this.separation(
                agent,
                agents
            ).multiplyScalar(
                CONFIG.separationWeight
            );

        const alignment =
            this.alignment(
                agent,
                agents
            ).multiplyScalar(
                CONFIG.alignmentWeight
            );

        const cohesion =
            this.cohesion(
                agent,
                agents
            ).multiplyScalar(
                CONFIG.cohesionWeight
            );

        return {
            separation,
            alignment,
            cohesion
        };
    }
}