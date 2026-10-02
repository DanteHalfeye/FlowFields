import * as THREE from "three";
import { CONFIG } from "./config.js";
import { Agent } from "./Agent.js";

export class AgentManager {

    constructor(scene, flowField) {

        this.scene = scene;

        this.flowField =
            flowField;

        this.agents = [];

        this.spawnAgents();
    }

    spawnAgents() {

        for (
            let i = 0;
            i < CONFIG.agentCount;
            i++
        ) {

            const position =
                this.randomPosition();

            const agent =
                new Agent(position);

            this.agents.push(
                agent
            );

            this.scene.add(
                agent.mesh
            );
        }
    }

    randomPosition() {

        return new THREE.Vector3(

            THREE.MathUtils.randFloat(
                -CONFIG.worldWidth / 2 + 5,
                CONFIG.worldWidth / 2 - 5
            ),

            THREE.MathUtils.randFloat(
                5,
                CONFIG.worldHeight - 5
            ),

            THREE.MathUtils.randFloat(
                -CONFIG.worldDepth / 2 + 5,
                CONFIG.worldDepth / 2 - 5
            )
        );
    }

    update(deltaTime) {

        for (const agent of this.agents) {

            agent.update(
                deltaTime,
                this.flowField,
                this.agents
            );
        }
    }

    clear() {

        for (const agent of this.agents) {

            this.scene.remove(
                agent.mesh
            );
        }

        this.agents.length = 0;
    }

    respawn() {

        this.clear();

        this.spawnAgents();
    }
}