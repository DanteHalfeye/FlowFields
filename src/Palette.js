export const CATPPUCCIN = {

    crust: 0x11111b,
    mantle: 0x181825,
    base: 0x1e1e2e,

    surface0: 0x313244,
    surface1: 0x45475a,
    surface2: 0x585b70,

    text: 0xcdd6f4,
    subtext: 0xa6adc8,

    lavender: 0xb4befe,
    blue: 0x89b4fa,
    sky: 0x89dceb,
    teal: 0x94e2d5,

    green: 0xa6e3a1,
    yellow: 0xf9e2af,

    peach: 0xfab387,
    mauve: 0xcba6f7,

    pink: 0xf5c2e7,
    red: 0xf38ba8,
    maroon: 0xeba0ac
};


/*
 * ------------------------------------------------------------
 * VISUAL MODES
 * ------------------------------------------------------------
 *
 * Index 0 is intentionally unused.
 *
 * 1 = Deep Space
 * 2 = Deep Ocean
 * 3 = Abyss
 * 4 = Plasma
 * 5 = Organic
 */

export const VISUAL_MODES = [

    null,

    // ========================================================
    // 1 — DEEP SPACE
    // ========================================================

    {
        name: "DEEP SPACE",

        theme: "space",

        model: "fish",

        colors: [
            0x89b4fa,
            0xcba6f7,
            0xf5c2e7
        ],

        core: 0xcba6f7,

        glow: 0xf5c2e7,

        rings: [
            0xcba6f7,
            0x89b4fa,
            0x74c7ec
        ],

        background: 0x11111b,

        fogColor: 0x11111b,

        fogDensity: 0.0035,

        bloom: 0.32,

        opacity: 0.48,

        emissive: 0.35,

        emissiveColor: 0xcba6f7,

        colorBy: "depth",

        motionBlur: 0.70,

        motionIntensity: 0.82,

        flowMultiplier: 1.0,

        environmentOpacity: 0.25
    },


    // ========================================================
    // 2 — DEEP OCEAN
    // ========================================================

    {
        name: "DEEP OCEAN",

        theme: "ocean",

        model: "jellyfish",

        colors: [
            0x74c7ec,
            0x89dceb,
            0x94e2d5,
            0x89b4fa
        ],

        core: 0x74c7ec,

        glow: 0x89dceb,

        rings: [
            0x74c7ec,
            0x89dceb,
            0x94e2d5
        ],

        background: 0x031018,

        fogColor: 0x062631,

        fogDensity: 0.007,

        bloom: 0.42,

        opacity: 0.55,

        emissive: 0.50,

        emissiveColor: 0x74c7ec,

        colorBy: "depth",

        motionBlur: 0.80,

        motionIntensity: 0.88,

        flowMultiplier: 0.65,

        environmentOpacity: 0.42
    },


    // ========================================================
    // 3 — ABYSS
    // ========================================================

    {
        name: "ABYSS",

        theme: "abyss",

        model: "skull",

        colors: [
            0xf38ba8,
            0xcba6f7,
            0xf5c2e7,
            0xeba0ac
        ],

        core: 0xf38ba8,

        glow: 0xf38ba8,

        rings: [
            0xf38ba8,
            0xcba6f7,
            0xeba0ac
        ],

        background: 0x07050b,

        fogColor: 0x0b0710,

        fogDensity: 0.009,

        bloom: 0.55,

        opacity: 0.62,

        emissive: 0.65,

        emissiveColor: 0xf38ba8,

        colorBy: "radius",

        motionBlur: 0.64,

        motionIntensity: 0.82,

        flowMultiplier: 0.42,

        environmentOpacity: 0.30
    },


    // ========================================================
// 4 — PLASMA
// ========================================================

{
    name: "PLASMA",

    theme: "plasma",

    model: "shard",

    colors: [
        0xf9e2af,
        0xfab387,
        0xf38ba8,
        0xcba6f7
    ],

    core: 0xfab387,

    glow: 0xf9e2af,

    rings: [
        0xfab387,
        0xf38ba8,
        0xcba6f7
    ],

    background: 0x120910,

    fogColor: 0x180b15,

    fogDensity: 0.004,

    // Much lower base bloom
    bloom: 0.28,

    // Less opaque agents
    opacity: 0.48,

    // Less emissive material
    emissive: 0.38,

    emissiveColor: 0xfab387,

    colorBy: "treble",

    // Keep the plasma motion energetic
    motionBlur: 0.78,

    motionIntensity: 0.86,

    flowMultiplier: 1.35,

    environmentOpacity: 0.38
},


    // ========================================================
    // 5 — ORGANIC
    // ========================================================

    {
        name: "ORGANIC",

        theme: "organic",

        model: "cell",

        colors: [
            0xa6e3a1,
            0x94e2d5,
            0x74c7ec,
            0xcba6f7
        ],

        core: 0xa6e3a1,

        glow: 0x94e2d5,

        rings: [
            0xa6e3a1,
            0x94e2d5,
            0x74c7ec
        ],

        background: 0x06120c,

        fogColor: 0x071a12,

        fogDensity: 0.0055,

        bloom: 0.48,

        opacity: 0.52,

        emissive: 0.55,

        emissiveColor: 0xa6e3a1,

        colorBy: "angle",

        motionBlur: 0.78,

        motionIntensity: 0.88,

        flowMultiplier: 0.80,

        environmentOpacity: 0.45
    }
];