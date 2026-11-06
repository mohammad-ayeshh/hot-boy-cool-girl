// Chapter themes (design doc 9.3): one temple, one journey. Each chapter is its own area of the temple with its
// own scenery; only the world colors change (4.2 "dark slate, muted moss"). Characters, liquids, gems, doors and
// mechanisms look the same everywhere. Everything here stays dark and muted: no bright orange, cyan, violet or gold.

/** Which far-depths scenery a theme draws (world.ts). */
export type Scenery = 'jungle' | 'flooded' | 'machine' | 'summit' | 'eyes' | 'vault' | 'caves' | 'pipes' | 'heart';

/** Floating bits in the air layer (9.1 layer 2), behind the level. */
export interface Air {
  /** float: fireflies wandering; fall: dust settling; drip: drops falling fast; wind: specks blown sideways; drift: slow wisps; rise: steam rising */
  kind: 'float' | 'fall' | 'drip' | 'wind' | 'drift' | 'rise';
  colors: readonly number[];
  /** particles per second */
  rate: number;
  size: readonly [number, number];
  alpha: number;
}

export interface Theme {
  chapter: number;
  name: string;
  /** far depths: gradient top → bottom */
  sky: readonly [number, number];
  /** stone tiles: shadow lines, basins, block face, lit top edge */
  stone: { deep: number; dark: number; mid: number; light: number };
  /** tufts along lit top edges (moss, algae, snow); null = bare stone */
  top: number | null;
  /** what hangs under ledges */
  hang: 'vines' | 'drips' | 'chains' | null;
  hangColor: number;
  scenery: Scenery;
  /** far shapes (pillars, arches, gears, mountains…) and their faint lit edge */
  far: number;
  farEdge: number;
  /** faint carved runes on the back wall */
  rune: number;
  air: Air;
  /** the decorated side margins on wide phones: outside, column, column bands */
  margin: readonly [number, number, number];
}

export const THEMES: readonly Theme[] = [
  {
    chapter: 1, name: 'The Temple Gate',
    sky: [0x0f1c19, 0x070d0c],
    stone: { deep: 0x0a1211, dark: 0x16211f, mid: 0x2e3d39, light: 0x55695f },
    top: 0x4a5a3c, hang: 'vines', hangColor: 0x4a5a3c,
    scenery: 'jungle', far: 0x132320, farEdge: 0x1d302b, rune: 0x20332e,
    air: { kind: 'float', colors: [0xc9e39a, 0xa9cf7d], rate: 1.6, size: [4, 7], alpha: 0.55 },
    margin: [0x0a1412, 0x0f1c19, 0x070e0c],
  },
  {
    chapter: 2, name: 'The Flooded Halls',
    sky: [0x0d1a1a, 0x060c0c],
    stone: { deep: 0x08110f, dark: 0x13201e, mid: 0x2a3c3a, light: 0x4f6866 },
    top: 0x3d5848, hang: 'drips', hangColor: 0x5f7a77,
    scenery: 'flooded', far: 0x112020, farEdge: 0x1a2e2d, rune: 0x1c2f2d,
    air: { kind: 'drip', colors: [0x8fa9a6, 0x7b9592], rate: 3, size: [2.5, 4], alpha: 0.45 },
    margin: [0x081211, 0x0e1a19, 0x050c0b],
  },
  {
    chapter: 3, name: 'The Deep Machine',
    sky: [0x16110d, 0x090705],
    stone: { deep: 0x0f0c09, dark: 0x1e1914, mid: 0x3a3128, light: 0x6a5a46 },
    top: null, hang: 'chains', hangColor: 0x4a3e31,
    scenery: 'machine', far: 0x221a14, farEdge: 0x30261d, rune: 0x2a2119,
    air: { kind: 'fall', colors: [0x8a7a66, 0x6f6252], rate: 2.5, size: [3, 6], alpha: 0.35 },
    margin: [0x110d0a, 0x1a140f, 0x0a0806],
  },
  {
    chapter: 4, name: 'The Summit',
    sky: [0x121b2b, 0x0a0f17],
    stone: { deep: 0x0b0f14, dark: 0x182029, mid: 0x323d48, light: 0x6b7887 },
    top: 0xaab6c2, hang: null, hangColor: 0,
    scenery: 'summit', far: 0x172233, farEdge: 0x22304a, rune: 0x1d2838,
    air: { kind: 'wind', colors: [0xc9d3dd, 0xa9b6c2], rate: 4, size: [2.5, 5], alpha: 0.4 },
    margin: [0x0b111b, 0x111a28, 0x070b12],
  },
  {
    chapter: 5, name: 'The Hall of Eyes',
    sky: [0x161a18, 0x090b0a],
    stone: { deep: 0x0d0f0e, dark: 0x1c201e, mid: 0x3a403c, light: 0x6e766f },
    top: 0x4c5448, hang: null, hangColor: 0,
    scenery: 'eyes', far: 0x202523, farEdge: 0x2c332f, rune: 0x262c29,
    air: { kind: 'float', colors: [0xb8c0b8, 0x9aa39b], rate: 1.2, size: [3, 6], alpha: 0.3 },
    margin: [0x0c0f0d, 0x141815, 0x070908],
  },
  {
    chapter: 6, name: 'The Sealed Vault',
    sky: [0x14100f, 0x070606],
    stone: { deep: 0x0c0a0a, dark: 0x1b1716, mid: 0x363030, light: 0x645a55 },
    top: null, hang: null, hangColor: 0,
    scenery: 'vault', far: 0x1f1a19, farEdge: 0x2b2423, rune: 0x262020,
    air: { kind: 'fall', colors: [0x9a8c80, 0x7d7168], rate: 2, size: [3, 5], alpha: 0.3 },
    margin: [0x0e0b0a, 0x161211, 0x080606],
  },
  {
    chapter: 7, name: 'The Whispering Vault',
    sky: [0x0b1015, 0x040608],
    stone: { deep: 0x080b0e, dark: 0x12171c, mid: 0x283039, light: 0x4d5966 },
    top: null, hang: null, hangColor: 0,
    scenery: 'caves', far: 0x0f151c, farEdge: 0x18212b, rune: 0x16202a,
    air: { kind: 'drift', colors: [0xaab4c0, 0x8e99a6], rate: 1, size: [12, 22], alpha: 0.16 },
    margin: [0x070a0d, 0x0c1116, 0x040608],
  },
  {
    chapter: 8, name: 'The Steam Halls',
    sky: [0x17110e, 0x080605],
    stone: { deep: 0x100b09, dark: 0x1f1712, mid: 0x3d2f26, light: 0x6e5848 },
    top: null, hang: 'drips', hangColor: 0x5e544e,
    scenery: 'pipes', far: 0x241a15, farEdge: 0x33261e, rune: 0x2b201a,
    air: { kind: 'rise', colors: [0x9a948f, 0x7f7a76], rate: 1.4, size: [10, 20], alpha: 0.12 },
    margin: [0x100b09, 0x18120e, 0x090605],
  },
  {
    chapter: 9, name: 'The Heart of the Temple',
    sky: [0x16100f, 0x080505],
    stone: { deep: 0x0e0a0a, dark: 0x1d1615, mid: 0x3a2f2c, light: 0x6a5a54 },
    top: null, hang: null, hangColor: 0,
    scenery: 'heart', far: 0x221917, farEdge: 0x31241f, rune: 0x2a201d,
    air: { kind: 'float', colors: [0xb5a49a, 0x978880], rate: 1.2, size: [3, 5], alpha: 0.3 },
    margin: [0x0e0a09, 0x161110, 0x080505],
  },
];

/** The look for a chapter; homemade levels and test rooms (no chapter) use Chapter 1's (9.3). */
export const themeFor = (chapter?: number): Theme => THEMES.find((t) => t.chapter === chapter) ?? THEMES[0];
