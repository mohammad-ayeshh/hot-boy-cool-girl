// Every tunable number and on/off switch of the Feel Lab, defined in one list.
// The panel UI, the defaults, saving and "copy values" are all generated from this list,
// so adding a setting here is the only step needed to make it tweakable on the phone.
// Movement starting values come from docs/GAME_DESIGN.md section 7.5; effects from section 8.2.

export type Group =
  | 'Movement'
  | 'Helpers'
  | 'Controls'
  | 'Character'
  | 'Camera'
  | 'Light & flash'
  | 'World'
  | 'Time'
  | 'Rewards'
  | 'Sound & haptics'
  | 'Debug';

interface Base {
  label: string;
  group: Group;
  hint?: string;
  /** Effects are switched off by "All effects off"; movement and debug settings are not. */
  effect?: boolean;
}
export interface ToggleDef extends Base { kind: 'toggle'; value: boolean }
export interface SliderDef extends Base { kind: 'slider'; value: number; min: number; max: number; step: number; unit?: string }
export type SettingDef = ToggleDef | SliderDef;

const t = (group: Group, label: string, value: boolean, extra: Partial<ToggleDef> = {}): ToggleDef =>
  ({ kind: 'toggle', group, label, value, ...extra });
const s = (group: Group, label: string, value: number, min: number, max: number, step: number, unit = '', extra: Partial<SliderDef> = {}): SliderDef =>
  ({ kind: 'slider', group, label, value, min, max, step, unit, ...extra });

export const DEFS = {
  // ---- Movement (7.5) ----
  runSpeed: s('Movement', 'Run speed', 7.5, 4, 12, 0.1, 'tiles/s'),
  accelTime: s('Movement', 'Time to full speed', 0.08, 0, 0.4, 0.01, 's'),
  decelTime: s('Movement', 'Time to stop', 0.06, 0, 0.4, 0.01, 's'),
  airControl: s('Movement', 'Air control', 1, 0.2, 1, 0.05, '×', { hint: 'How fast you can change direction in the air' }),
  jumpHeight: s('Movement', 'Max jump height (hold)', 3.5, 2, 5, 0.05, 'tiles'),
  minJumpHeight: s('Movement', 'Min jump height (tap)', 1.2, 0.5, 2.5, 0.05, 'tiles'),
  timeToApex: s('Movement', 'Time to top of jump', 0.3, 0.2, 0.6, 0.01, 's'),
  fallMult: s('Movement', 'Fall faster than rise', 2, 1, 3, 0.05, '×'),
  apexHang: t('Movement', 'Apex hang', true, { hint: 'Gravity is lighter near the top while you hold jump' }),
  apexHangGravity: s('Movement', 'Apex hang gravity', 0.5, 0.2, 1, 0.05, '×'),
  apexHangThreshold: s('Movement', 'Apex hang zone', 1.5, 0.5, 6, 0.1, 'tiles/s'),
  fallCap: s('Movement', 'Max fall speed', 22, 10, 40, 0.5, 'tiles/s'),

  // ---- Helpers (7.6) ----
  coyote: t('Helpers', 'Coyote time', true, { hint: 'Jump a split second after leaving a ledge' }),
  coyoteTime: s('Helpers', 'Coyote time length', 0.1, 0.02, 0.25, 0.01, 's'),
  buffer: t('Helpers', 'Jump buffer', true, { hint: 'A jump pressed just before landing still happens' }),
  bufferTime: s('Helpers', 'Jump buffer length', 0.12, 0.02, 0.3, 0.01, 's'),
  ledgeNudge: t('Helpers', 'Ledge nudge', true, { hint: 'Miss a ledge top by a little and get pushed up onto it' }),
  ledgeNudgeAmount: s('Helpers', 'Ledge nudge reach', 0.35, 0.05, 0.7, 0.05, 'tiles'),
  headNudge: t('Helpers', 'Head nudge', true, { hint: 'Clip a ceiling corner and slide around it' }),
  headNudgeAmount: s('Helpers', 'Head nudge reach', 0.3, 0.05, 0.6, 0.05, 'tiles'),
  stepUp: t('Helpers', 'Small step-up', true, { hint: 'Tiny bumps are walked over (also stepping out of a pool)' }),
  stepUpAmount: s('Helpers', 'Step-up height', 0.25, 0.05, 0.45, 0.05, 'tiles'),

  // ---- Controls (6.2, 6.3) ----
  deadZone: s('Controls', 'Move dead zone', 10, 2, 40, 1, 'pt'),
  anchorFollows: t('Controls', 'Touch point follows thumb', false, { hint: 'Off = turn around by sliding back past where you first touched (the design). On = the start point is dragged along, so turning needs a shorter slide.' }),
  anchorLeash: s('Controls', 'Follow distance', 40, 15, 120, 5, 'pt'),
  showZones: t('Controls', 'Show touch zones', true, { hint: 'Faint zone hints that fade after a few seconds' }),

  // ---- Character juice (8.2 movement + 14.4) ----
  squash: t('Character', 'Squash & stretch', true, { effect: true }),
  squashAmount: s('Character', 'Squash amount', 1, 0, 2, 0.05, '×'),
  jumpFx: t('Character', 'Jump / land / turn puffs', true, { effect: true }),
  animations: t('Character', 'Animations (run, idle, jump)', true, { effect: true }),
  nudgeFx: t('Character', 'Puff when a helper saves you', true, { effect: true }),
  trails: t('Character', 'Trails (scorch / wet)', true, { effect: true }),
  nearDanger: t('Character', 'Near-danger reaction', true, { effect: true, hint: 'His flame sputters, she starts to boil' }),
  aura: t('Character', 'Floating embers / droplets', true, { effect: true }),

  // ---- Camera (8.2) ----
  shake: t('Camera', 'Camera shake', true, { effect: true }),
  shakeAmount: s('Camera', 'Shake strength', 1, 0, 3, 0.1, '×'),
  bump: t('Camera', 'Camera kick on hard landing', true, { effect: true }),
  zoomPulse: t('Camera', 'Zoom pulse on death', true, { effect: true }),

  // ---- Light & flash (8.2) ----
  lighting: t('Light & flash', 'Lighting', true, { effect: true, hint: 'Dark world; characters and liquids bring their own light' }),
  lightRadius: s('Light & flash', 'Character light size', 1, 0.4, 2, 0.05, '×'),
  blink: t('Light & flash', 'White blink on impact', true, { effect: true }),
  flash: t('Light & flash', 'Screen flash on death', true, { effect: true }),

  // ---- World reactions (8.2) ----
  splash: t('World', 'Liquid splashes', true, { effect: true }),
  deathFx: t('World', 'Element deaths (steam, vapor, sparks)', true, { effect: true }),
  liquidGlow: t('World', 'Liquids glow', true, { effect: true }),

  // ---- Time (8.2) ----
  hitStop: t('Time', 'Hit-stop on death', true, { effect: true }),
  hitStopMs: s('Time', 'Hit-stop length', 80, 20, 250, 5, 'ms'),

  // ---- Rewards (8.2) ----
  gemFx: t('Rewards', 'Gem pop & sparkles', true, { effect: true }),
  gemCombo: t('Rewards', 'Rising pitch for quick pickups', true, { effect: true }),

  // ---- Sound & haptics ----
  sound: t('Sound & haptics', 'Sound', true, { effect: true }),
  volume: s('Sound & haptics', 'Volume', 0.7, 0, 1, 0.05),
  haptics: t('Sound & haptics', 'Vibration (Android)', true, { effect: true }),

  // ---- Debug ----
  jumpArc: t('Debug', 'Jump arc preview', false, { hint: 'Where a full jump (bright) and a tap (dim) would go' }),
  grid: t('Debug', 'Tile grid', false),
  hitboxes: t('Debug', 'Hitboxes', false),
  stats: t('Debug', 'FPS counter', true),
  closeup: t('Debug', 'Zoom in on my character', false, { hint: 'To look at the character art up close' }),
  timeScale: s('Debug', 'Game speed', 1, 0.1, 1, 0.05, '×', { hint: 'Slow motion to study an effect' }),
} satisfies Record<string, SettingDef>;

export type Key = keyof typeof DEFS;
type ValueOf<D> = D extends ToggleDef ? boolean : number;
export type Settings = { -readonly [K in Key]: ValueOf<(typeof DEFS)[K]> };

const STORAGE_KEY = 'hbcg.feelLab.v1';
export const KEYS = Object.keys(DEFS) as Key[];

export function defaults(): Settings {
  const out = {} as Record<Key, number | boolean>;
  for (const k of KEYS) out[k] = DEFS[k].value;
  return out as Settings;
}

export function load(): Settings {
  const out = defaults() as Record<Key, number | boolean>;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, unknown>;
    for (const k of KEYS) if (typeof saved[k] === typeof out[k]) out[k] = saved[k] as number | boolean;
  } catch {
    // Storage blocked or corrupted: just use defaults.
  }
  return out as Settings;
}

export function save(settings: Settings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Private mode etc.; settings still work for this session.
  }
}

/** Only the values that differ from the defaults, as readable text to paste back to the developer. */
export function describeChanges(settings: Settings): string {
  const d = defaults();
  const lines: string[] = [];
  for (const k of KEYS) {
    if (settings[k] === d[k]) continue;
    const def = DEFS[k];
    const v = settings[k];
    const shown = typeof v === 'boolean' ? (v ? 'on' : 'off') : `${v}${def.kind === 'slider' && def.unit ? ' ' + def.unit : ''}`;
    lines.push(`${def.group} › ${def.label}: ${shown}  [${k}=${JSON.stringify(v)}]`);
  }
  return lines.length ? lines.join('\n') : 'All settings are at their defaults.';
}
