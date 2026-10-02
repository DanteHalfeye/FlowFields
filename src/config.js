export const CONFIG = {
    agentCount: 30000,

    worldWidth: 140,
    worldHeight: 80,
    worldDepth: 100,

    cellSize: 5,

    // Movement
    maxSpeed: 30*2,
    maxForce: 22,

    // Flocking
    separationRadius: 3,
    alignmentRadius: 5,
    cohesionRadius: 8,

    separationWeight: 4,
    alignmentWeight: 0.12,
    cohesionWeight: 0.5,

    flowWeight: 0.3,
    boundaryForce: 14,

    // Audio
    audioSensitivity: 2.0,

    bassSpeedMultiplier: 2.0,
    bassForceMultiplier: 1.8,

    // Audio visual changes
    audioSizeMultiplier: 2.8,
    audioSeparationMultiplier: 3.5,

    // Interaction
    attractorStrength: 10,
    repulsorStrength: 14,

    interactionRadius: 20,
    interactionLifetime: 12,

    // Rendering
    fishLength: 0.9,
    fishWidth: 0.22,

    pixelRatio: 1.5


};