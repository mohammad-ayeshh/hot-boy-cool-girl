// The stage: one level on screen with both characters, all game-feel effects, sound and haptics.
// Used by the Feel Lab (both characters on this phone) and by the online game (one character is
// simulated here, the partner's comes from the network).
// Ownership (design doc 13.1): this phone decides its own character's moves, death and gems.
import { Application, Container, Graphics, Sprite, Text } from 'pixi.js';
import * as device from '../engine/device';
import * as sfx from '../engine/sfx';
import { Controls } from '../engine/input';
import { Body, HITBOX_H, HITBOX_W, NO_INPUT, STEP, derive, type JumpStats, type Phys } from '../game/body';
import { COLS, ROWS, Level, type DeathCause, type Elem, type Gem, type LevelData, type Liquid, type Rect } from '../game/level';
import { Mechanisms, type Feet, type MechEvent, type Rune } from '../game/mechanisms';
import type { Settings } from '../game/settings';
import { ParticleSystem, makeGlowTexture } from '../render/particles';
import { CharacterView, type Pose } from '../render/character';
import { Pools, T, drawBackground, drawTiles, lerpColor } from '../render/world';
import { COOL_HAIR, HOT_FLAME, HairChain } from '../render/hair';

const FIRE_FX = [0xfff0c2, 0xffb02e, 0xff6a1a];
const WATER_FX = [0xe4faff, 0x7adfff, 0x1fa3ff];
const VIOLET_FX = [0xf2d4ff, 0xd17bff, 0xa23be8];
const DUST = [0x55695f, 0x3a4a45, 0x7d8f86];
const STONE_DUST = [0xb7c4bc, 0x8a9a90, 0x55695f];
const STEAM = [0xffffff, 0xd8e4e8, 0xa9bac0];
export const OWN_LIQUID: Record<Elem, Liquid> = { fire: 'lava', water: 'water' };
const DEADLY: Record<Elem, Liquid[]> = { fire: ['water', 'poison'], water: ['lava', 'poison'] };
const ELEMS: Elem[] = ['water', 'fire']; // draw order: she's behind him
/** The partner is shown this far in the past, smoothly blended (13.2). */
const INTERP_DELAY = 100;
const PARTNER_GAIN = 0.6;

export type HeroEvent = { k: 'jump' } | { k: 'land'; v: number } | { k: 'turn' };

/** What the network sends ~30×/s about one character. p = platform stood on (-1 = none), rx/ry = position on it. */
export interface Snapshot { x: number; y: number; vx: number; vy: number; g: 0 | 1; f: -1 | 1; p?: number; rx?: number; ry?: number }

export interface StageHooks {
  /** A character simulated on this phone died. */
  localDeath?(elem: Elem, cause: DeathCause): void;
  /** A character simulated on this phone picked up gem number `index`. */
  localGem?(elem: Elem, index: number): void;
  /** Movement events to mirror on the partner's phone. */
  localEvent?(elem: Elem, ev: HeroEvent): void;
  /** A character simulated on this phone flipped lever `i`. */
  localLever?(i: number, on: boolean): void;
}

export interface StageOptions {
  /** Feel Lab: dead characters come back on their own, gems grow back. */
  sandbox: boolean;
  hooks?: StageHooks;
}

interface Hero {
  elem: Elem;
  body: Body;
  view: CharacterView;
  light: Sprite;
  status: Text;
  hair: HairChain;
  hairG: Graphics;
  hairReset: boolean;
  local: boolean;
  alive: boolean;
  dying: DeathCause | null;
  deadT: number;
  sx: number; sy: number; vsx: number; vsy: number;
  whiten: number;
  excite: number;
  danger: number;
  runPhase: number;
  idle: number;
  time: number;
  ownPrev: number;
  auraT: number;
  lastGemT: number;
  combo: number;
  arcFull: number[];
  arcTap: number[];
  victory: number;
  /** partner only: received snapshots and events, played back INTERP_DELAY ms late */
  buf: { t: number; s: Snapshot }[];
  queue: { t: number; run: () => void }[];
}

interface GemState extends Gem { alive: boolean; respawn: number; glow: Sprite; phase: number }
interface DoorState { elem: Elem; x: number; y: number; glow: Sprite; near: number; open: number }

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const PLAT_H = 0.5;
const feetOf = (b: Body): Feet => ({ left: b.left, right: b.right, y: b.y, vx: b.vx, grounded: b.grounded });

function drawRune(g: Graphics, rune: Rune, x: number, y: number, r: number, color: number, alpha: number): void {
  const st = { width: 1.6, color, alpha };
  if (rune === 'circle') {
    g.circle(x, y, r).stroke(st);
    g.circle(x, y, r * 0.3).fill({ color, alpha });
  } else if (rune === 'triangle') g.poly([x, y - r, x + r * 0.95, y + r * 0.7, x - r * 0.95, y + r * 0.7]).stroke(st);
  else if (rune === 'square') g.rect(x - r * 0.8, y - r * 0.8, r * 1.6, r * 1.6).stroke(st);
  else {
    const pts: number[] = [];
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r * 0.45 : r;
      pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    g.poly(pts).stroke(st);
  }
}

export async function createApp(): Promise<Application> {
  const app = new Application();
  await app.init({
    resizeTo: window,
    background: '#050a09',
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
    preference: 'webgl',
  });
  document.getElementById('app')!.appendChild(app.canvas);
  return app;
}

export class Stage {
  readonly controls: Controls;
  level!: Level;
  phys!: Phys;
  stats!: JumpStats;
  /** Which character the thumbs drive on this phone (null = none). */
  controlled: Elem | null = 'fire';
  /** False while a menu is open or the app is in the background: your character stands still. */
  inputEnabled = true;
  showHints = false;
  /** Level designer: physics stops, characters wait at their start spots. */
  paused = false;
  /** Level designer: room kept free on the left/right for toolbars (CSS px). */
  insets = { left: 0, right: 0 };
  /** Level designer: zoom (1 = whole level) and pan offset in screen px. */
  view = { zoom: 1, panX: 0, panY: 0 };
  /** Drawn on top of the level, in world coordinates (T px per tile). */
  readonly overlay = new Graphics();
  /** Seconds since the level (re)started; stops when it's completed. */
  levelTime = 0;
  completed = false;
  fps = 0;

  private readonly glowTex = makeGlowTexture(64);
  private readonly margins = new Graphics();
  private readonly world = new Container();
  private readonly bg = new Graphics();
  private readonly tiles = new Graphics();
  private readonly lights = new Container();
  private readonly levelLights = new Container();
  private readonly trails = new ParticleSystem(this.glowTex, 1500);
  private readonly doorsG = new Graphics();
  private readonly mechG = new Graphics();
  mech: Mechanisms = new Mechanisms([]);
  private readonly flamesG = new Graphics();
  private flames: { x: number; y: number; age: number; life: number; seed: number }[] = [];
  private readonly gemsG = new Graphics();
  private readonly heroesLayer = new Container();
  private readonly dust = new ParticleSystem(this.glowTex, 800, 'normal');
  private readonly poolsG = new Graphics();
  private readonly fx = new ParticleSystem(this.glowTex, 4000);
  private readonly debug = new Graphics();
  private readonly screenFx = new Graphics();
  private readonly hints = new Graphics();
  private pools!: Pools;
  private liquidGlows: { s: Sprite; kind: Liquid; seed: number }[] = [];
  private gems: GemState[] = [];
  private doors: DoorState[] = [];
  readonly heroes: Record<Elem, Hero>;

  private scale = 1;
  private baseX = 0;
  private baseY = 0;
  private shakeT = 0;
  private shakeDur = 1;
  private shakePow = 0;
  private bumpY = 0;
  private zoomK = 0;
  private flashA = 0;
  private hitStop = 0;
  private slowMo = 0;
  private simTime = 0;
  private acc = 0;
  private markerT = 0;
  private firstActivity = 0;
  private frames = 0;
  private fpsT = performance.now();

  constructor(readonly app: Application, readonly settings: Settings, level: LevelData, private opts: StageOptions) {
    this.controls = new Controls(app.canvas, { deadZone: settings.deadZone, anchorFollows: settings.anchorFollows, anchorLeash: settings.anchorLeash });
    this.lights.addChild(this.levelLights);
    this.world.addChild(this.bg, this.tiles, this.lights, this.trails.view, this.doorsG, this.mechG, this.flamesG, this.gemsG, this.heroesLayer, this.dust.view, this.poolsG, this.fx.view, this.debug, this.overlay);
    app.stage.addChild(this.margins, this.world, this.screenFx, this.hints);
    drawBackground(this.bg);
    this.heroes = { water: this.makeHero('water'), fire: this.makeHero('fire') };
    this.setLevel(level);
    this.applySettings();
    this.layout();
    app.renderer.on('resize', this.layout);
    app.ticker.add(this.tick);
  }

  // ================================================================ setup

  /** Sandbox: dead characters come back by themselves (Feel Lab, trying a level alone). */
  setSandbox(on: boolean): void {
    this.opts = { ...this.opts, sandbox: on };
  }

  /** Screen point (CSS px) → tile coordinates. */
  toTile(px: number, py: number): { x: number; y: number } {
    const k = this.world.scale.x * T;
    return { x: (px - this.world.position.x) / k, y: (py - this.world.position.y) / k };
  }

  /** Size of one tile on screen (CSS px). */
  get tilePx(): number {
    return this.scale * T * this.view.zoom;
  }

  relayout(): void {
    this.layout();
  }

  /** `quiet`: no spawn sparkle (the level designer redraws on every brush stroke). */
  setLevel(data: LevelData, quiet = false): void {
    this.quiet = quiet;
    this.level = new Level(data);
    this.mech = new Mechanisms(data.mechs);
    this.level.dynamic = this.mech.solids;
    drawTiles(this.tiles, this.level);
    this.pools = new Pools(this.level, this.poolsG);
    for (const c of this.levelLights.removeChildren()) c.destroy();
    this.liquidGlows = [];
    for (const pool of this.level.pools()) {
      for (let x = pool.x0; x < pool.x1; x++) {
        const s = this.glow(pool.kind === 'lava' ? 0xff6a1a : pool.kind === 'water' ? 0x1fa3ff : 0xa23be8, 2.6);
        s.position.set((x + 0.5) * T, (pool.y + 0.1) * T);
        this.liquidGlows.push({ s, kind: pool.kind, seed: Math.random() * 10 });
      }
    }
    this.gems = data.gems.map((g, i) => {
      const glow = this.glow(g.elem === 'fire' ? 0xffb02e : 0x7adfff, 1.6);
      glow.position.set(g.x * T, g.y * T);
      return { ...g, alive: true, respawn: 0, glow, phase: i * 1.3 };
    });
    this.doors = [];
    for (const elem of ['fire', 'water'] as Elem[]) {
      const d = data.doors[elem];
      if (!d) continue;
      const glow = this.glow(elem === 'fire' ? 0xff8a2a : 0x3fb8ff, 3);
      glow.position.set(d.x * T, (d.y - 1.1) * T);
      this.doors.push({ elem, x: d.x, y: d.y, glow, near: 0, open: 0 });
    }
    this.fx.clear();
    this.dust.clear();
    this.restart();
    this.quiet = false;
  }
  private quiet = false;

  private glow(tint: number, sizeTiles: number): Sprite {
    const s = new Sprite({ texture: this.glowTex, anchor: 0.5, blendMode: 'add' });
    s.tint = tint;
    s.scale.set((sizeTiles * T) / 64);
    this.levelLights.addChild(s);
    return s;
  }

  private makeHero(elem: Elem): Hero {
    const hairG = new Graphics();
    const view = new CharacterView(elem);
    this.heroesLayer.addChild(hairG, view);
    const light = new Sprite({ texture: this.glowTex, anchor: 0.5, blendMode: 'add' });
    light.tint = elem === 'fire' ? 0xff8a2a : 0x3fb8ff;
    this.lights.addChild(light);
    const status = new Text({ text: '', style: { fontSize: 22, fill: 0xffffff } });
    status.anchor.set(0.5, 1);
    this.heroesLayer.addChild(status);
    const h: Hero = {
      elem, body: new Body(), view, light, status, hair: new HairChain(elem === 'water' ? COOL_HAIR : HOT_FLAME), hairG, hairReset: true, local: true, alive: true, dying: null, deadT: 0,
      sx: 1, sy: 1, vsx: 0, vsy: 0, whiten: 0, excite: 0, danger: 0, runPhase: 0, idle: 0, time: Math.random() * 10,
      ownPrev: 0, auraT: 0, lastGemT: -10, combo: 0, arcFull: [], arcTap: [], victory: -1, buf: [], queue: [],
    };
    h.body.events = {
      jump: () => this.onJump(h),
      land: (v) => this.onLand(h, v),
      turn: () => this.onTurn(h),
      nudge: (kind, x, y) => this.onNudge(kind, x, y),
    };
    return h;
  }

  /** Which characters this phone simulates (the rest are driven by the network). */
  setLocal(local: Record<Elem, boolean>): void {
    for (const e of ELEMS) {
      this.heroes[e].local = local[e];
      this.heroes[e].buf = [];
      this.heroes[e].queue = [];
    }
  }

  applySettings(): void {
    const s = this.settings;
    const d = derive(s);
    this.phys = d.phys;
    this.stats = d.stats;
    this.controls.opts = { deadZone: s.deadZone, anchorFollows: s.anchorFollows, anchorLeash: s.anchorLeash };
    sfx.configure(s.sound, s.volume);
    this.tiles.tint = s.lighting ? 0x8d9a9c : 0xffffff;
    this.bg.tint = s.lighting ? 0xb0bcbd : 0xffffff;
    if (!s.trails) this.trails.clear();
  }

  /** Back to the start of the level: everyone alive at their start, gems back, timer at 0. */
  restart(): void {
    for (const e of ELEMS) {
      const h = this.heroes[e];
      const sp = this.level.data.spawn[e];
      h.body.place(sp.x, sp.y);
      h.hairReset = true;
      h.alive = true;
      h.dying = null;
      h.sx = h.sy = 1;
      h.vsx = h.vsy = 0;
      h.ownPrev = 0;
      h.danger = 0;
      h.victory = -1;
      h.combo = 0;
      h.buf = [];
      h.queue = [];
      if (this.settings.blink) h.whiten = 0.6;
      if (this.settings.jumpFx && !this.quiet) this.burst(sp.x * T, (sp.y - 0.7) * T, e === 'fire' ? FIRE_FX : WATER_FX);
    }
    for (const g of this.gems) g.alive = true;
    for (const d of this.doors) d.open = 0;
    this.mech.reset();
    this.level.dynamic = this.mech.solids;
    this.trails.clear();
    this.levelTime = 0;
    this.completed = false;
    this.slowMo = 0;
    this.controls.reset();
  }

  hintZones(): void {
    this.showHints = true;
    this.firstActivity = 0;
  }

  showMarker(): void {
    this.markerT = 1.6;
    const h = this.controlled ? this.heroes[this.controlled] : null;
    if (h && this.settings.squash && h.alive) { h.sy = 1 + 0.2 * this.settings.squashAmount; h.sx = 1 - 0.12 * this.settings.squashAmount; }
  }

  // ================================================================ network side

  /** Latest state of the partner's character. */
  pushSnapshot(elem: Elem, s: Snapshot): void {
    const h = this.heroes[elem];
    if (h.local) return;
    h.buf.push({ t: performance.now(), s });
    if (h.buf.length > 60) h.buf.splice(0, h.buf.length - 60);
  }

  /** A jump / land / turn on the partner's phone: play its effects when their character gets there. */
  remoteEvent(elem: Elem, ev: HeroEvent): void {
    const h = this.heroes[elem];
    this.later(h, () => {
      if (!h.alive) return;
      if (ev.k === 'jump') this.onJump(h);
      else if (ev.k === 'land') this.onLand(h, ev.v);
      else this.onTurn(h);
    });
  }

  remoteDeath(elem: Elem, cause: DeathCause): void {
    const h = this.heroes[elem];
    this.later(h, () => this.die(h, cause));
  }

  remoteGem(index: number): void {
    const gem = this.gems[index];
    if (!gem?.alive) return;
    const h = this.heroes[gem.elem];
    this.later(h, () => { if (gem.alive) this.pickGem(h, gem, index); });
  }

  setPartnerStatus(elem: Elem, status: '' | 'menu' | 'away'): void {
    this.heroes[elem].status.text = status === 'menu' ? '⏸️' : status === 'away' ? '💤' : '';
  }

  private later(h: Hero, run: () => void): void {
    if (h.local) run();
    else h.queue.push({ t: performance.now(), run });
  }

  snapshot(elem: Elem): Snapshot {
    const b = this.heroes[elem].body;
    const r = (v: number) => Math.round(v * 1000) / 1000;
    const snap: Snapshot = { x: r(b.x), y: r(b.y), vx: r(b.vx), vy: r(b.vy), g: b.grounded ? 1 : 0, f: b.facing };
    const p = this.mech.platformUnder(feetOf(b));
    if (p >= 0) {
      // Riding a platform: send the position on it, so the partner sees us glued to it (13.2).
      const rect = this.mech.platforms[p].rect;
      snap.p = p;
      snap.rx = r(b.x - rect.x0);
      snap.ry = r(b.y - rect.y0);
    }
    return snap;
  }

  /** Partner's phone flipped a lever. */
  remoteLever(i: number, on: boolean): void {
    if (this.mech.setLever(i, on)) sfx.lever(this.panX(this.mech.levers[i].def.x));
  }

  mechState(): { lv: number[]; pl: number[] } {
    return this.mech.state();
  }

  correctMech(s: { lv?: number[]; pl?: number[] }): void {
    this.mech.correct(s, performance.now());
  }

  /** 0..1 how much a character is moving (drives their music layer). */
  movement(elem: Elem): number {
    const h = this.heroes[elem];
    if (!this.isAlive(elem)) return 0;
    return h.body.grounded ? Math.min(1, Math.abs(h.body.vx) / this.phys.run) : 1;
  }

  isAlive(elem: Elem): boolean {
    return this.heroes[elem].alive && !this.heroes[elem].dying;
  }

  /** Standing in your own door (10.2). */
  atDoor(elem: Elem): boolean {
    const d = this.doors.find((o) => o.elem === elem);
    const h = this.heroes[elem];
    if (!d || !this.isAlive(elem)) return false;
    return h.body.grounded && Math.abs(h.body.x - d.x) < 0.45 && Math.abs(h.body.y - d.y) < 0.15;
  }

  gemCount(): { got: number; total: number } {
    return { got: this.gems.filter((g) => !g.alive).length, total: this.gems.length };
  }

  /** Both are in their doors: slow-motion moment, doors burst with light, victory poses (8.2, 14.4). */
  celebrate(): void {
    if (this.completed) return;
    this.completed = true;
    this.slowMo = 0.9;
    if (this.settings.flash) this.flashA = 0.35;
    if (this.settings.zoomPulse) this.zoomK = 0.03;
    for (const d of this.doors) {
      this.fx.emit({ x: d.x * T, y: (d.y - 1) * T, count: 50, colors: d.elem === 'fire' ? FIRE_FX : WATER_FX, speed: [80, 320], life: [0.5, 1.2], size: [4, 11], spread: Math.PI, gravity: 60, drag: 0.2 });
    }
    for (const e of ELEMS) {
      const h = this.heroes[e];
      h.victory = 0;
      sfx.victory(e, this.pan(h), h.local ? 1 : PARTNER_GAIN);
    }
    this.haptic(30);
  }

  // ================================================================ effects

  private haptic(ms: number): void {
    if (this.settings.haptics) device.haptic(ms);
  }

  private pan(h: Hero): number {
    return (h.body.x / COLS) * 1.4 - 0.7;
  }

  private gain(h: Hero): number {
    return h.local && (this.controlled === h.elem || this.opts.sandbox) ? 1 : PARTNER_GAIN;
  }

  private mine(h: Hero): boolean {
    return h.elem === this.controlled;
  }

  private shake(power: number, dur: number): void {
    if (!this.settings.shake) return;
    if (power >= this.shakePow * (this.shakeT / this.shakeDur)) { this.shakePow = power; this.shakeDur = this.shakeT = dur; }
  }

  private feet(h: Hero) {
    return { x: h.body.x * T, y: h.body.y * T };
  }

  private burst(x: number, y: number, colors: number[]): void {
    this.fx.emit({ x, y, count: 20, colors, speed: [60, 140], life: [0.25, 0.45], size: [4, 8], spread: Math.PI, drag: 0.05 });
  }

  private onJump(h: Hero): void {
    const s = this.settings;
    if (s.squash) { h.sy = 1 + 0.32 * s.squashAmount; h.sx = 1 - 0.22 * s.squashAmount; h.vsx = h.vsy = 0; }
    const { x, y } = this.feet(h);
    if (s.jumpFx) {
      if (h.elem === 'fire') this.fx.emit({ x, y, count: 16, colors: FIRE_FX, speed: [60, 260], life: [0.2, 0.5], size: [4, 10], angle: Math.PI / 2, spread: 1.3, gravity: -200, drag: 0.08 });
      else this.fx.emit({ x, y, count: 14, colors: WATER_FX, speed: [70, 190], life: [0.3, 0.55], size: [3, 7], angle: -Math.PI / 2, spread: 1.35, gravity: 700, drag: 0.4 });
      this.dust.emit({ x, y, count: 5, colors: DUST, speed: [20, 70], life: [0.25, 0.45], size: [6, 12], angle: -Math.PI / 2, spread: 1.4, gravity: -30, drag: 0.1, alpha: 0.5 });
    }
    sfx.jump(h.elem, this.pan(h), this.gain(h));
    if (this.mine(h)) this.haptic(8);
    if (h.local) this.opts.hooks?.localEvent?.(h.elem, { k: 'jump' });
  }

  private onLand(h: Hero, impact: number): void {
    if (impact < 2) return;
    const s = this.settings;
    const n = clamp((impact - 4) / 18, 0, 1);
    if (s.squash) { h.sx = 1 + (0.15 + 0.35 * n) * s.squashAmount; h.sy = 1 - (0.12 + 0.3 * n) * s.squashAmount; h.vsx = h.vsy = 0; }
    const { x, y } = this.feet(h);
    const onOwnLiquid = this.level.liquidUnder(h.body.left, h.body.right, h.body.y)[OWN_LIQUID[h.elem]] > 0.05;
    if (s.jumpFx && !onOwnLiquid) {
      for (const dir of [0, Math.PI]) {
        this.dust.emit({ x, y: y - 2, count: 3 + Math.round(6 * n), colors: DUST, speed: [30, 90 + 160 * n], life: [0.3, 0.6], size: [6, 13], angle: dir, spread: 0.35, gravity: -20, drag: 0.05, alpha: 0.55 });
        if (h.elem === 'fire') this.fx.emit({ x, y: y - 2, count: 4 + Math.round(10 * n), colors: FIRE_FX, speed: [80, 200 + 200 * n], life: [0.15, 0.4], size: [3, 7], angle: dir + (dir ? 0.35 : -0.35), spread: 0.4, gravity: 600 });
        else this.fx.emit({ x, y: y - 2, count: 3 + Math.round(6 * n), colors: WATER_FX, speed: [50, 120 + 120 * n], life: [0.25, 0.5], size: [3, 6], angle: dir + (dir ? 0.6 : -0.6), spread: 0.3, gravity: 700 });
      }
    }
    if (h.elem === 'fire' && s.stepFire && !onOwnLiquid) for (let i = 0; i < 2 + Math.round(n * 3); i++) this.addFlame(x + (Math.random() - 0.5) * 22, y);
    sfx.land(h.elem, n, this.pan(h), this.gain(h));
    if (this.mine(h)) {
      this.haptic(Math.round(6 + 16 * n));
      if (n > 0.45 && s.bump) this.bumpY += n * T * this.scale * 0.12 * s.shakeAmount;
      if (n > 0.8) this.shake(0.18, 0.12);
    }
    if (h.local) this.opts.hooks?.localEvent?.(h.elem, { k: 'land', v: Math.round(impact * 10) / 10 });
  }

  private onTurn(h: Hero): void {
    const s = this.settings;
    if (s.squash) { h.sx = 1 - 0.15 * s.squashAmount; h.vsx = 0; }
    if (s.jumpFx) {
      const { x, y } = this.feet(h);
      this.dust.emit({ x: x - h.body.facing * 6, y: y - 2, count: 4, colors: DUST, speed: [30, 80], life: [0.2, 0.4], size: [5, 10], angle: h.body.facing > 0 ? Math.PI : 0, spread: 0.5, gravity: -40, alpha: 0.5 });
    }
    sfx.turn(h.elem, this.pan(h), this.gain(h));
    if (h.local) this.opts.hooks?.localEvent?.(h.elem, { k: 'turn' });
  }

  private onNudge(kind: 'ledge' | 'head' | 'step', x: number, y: number): void {
    if (!this.settings.nudgeFx) return;
    if (kind === 'step') {
      this.dust.emit({ x: x * T, y: y * T, count: 2, colors: DUST, speed: [10, 40], life: [0.2, 0.3], size: [4, 8], angle: -Math.PI / 2, spread: 1, alpha: 0.4 });
      return;
    }
    this.fx.emit({ x: x * T, y: y * T, count: 8, colors: [0xffffff, 0xf1e6c8], speed: [30, 110], life: [0.15, 0.3], size: [3, 6], angle: kind === 'head' ? Math.PI / 2 : -Math.PI / 2, spread: 1.2, alpha: 0.7 });
    sfx.nudge(0);
  }

  private footstep(h: Hero): void {
    const s = this.settings;
    const { x, y } = this.feet(h);
    const inOwn = this.level.liquidUnder(h.body.left, h.body.right, h.body.y)[OWN_LIQUID[h.elem]] > 0.05;
    sfx.step(h.elem, this.pan(h), this.gain(h));
    if (inOwn) {
      if (s.splash) {
        this.pools.splash(h.body.x, 0.35);
        this.fx.emit({ x, y: y - 3, count: 3, colors: h.elem === 'fire' ? FIRE_FX : WATER_FX, speed: [40, 110], life: [0.2, 0.4], size: [3, 6], angle: -Math.PI / 2, spread: 0.8, gravity: 600 });
      }
      return;
    }
    if (!s.trails) return;
    if (h.elem === 'fire') {
      if (s.stepFire) this.addFlame(x + (Math.random() - 0.5) * 6, y);
      this.trails.emit({ x: x + (Math.random() - 0.5) * 6, y: y - 1, count: 1, colors: [0xff6a1a, 0xb8320c], speed: [0, 0], life: [1.2, 1.8], size: [10, 14], alpha: 0.7 }); // scorch mark
      this.fx.emit({ x, y: y - 2, count: 1, colors: FIRE_FX, speed: [20, 60], life: [0.3, 0.6], size: [3, 5], angle: -Math.PI / 2, spread: 0.6, gravity: -80 });
    } else {
      this.trails.emit({ x: x + (Math.random() - 0.5) * 6, y: y - 1, count: 1, colors: [0x7adfff, 0xe4faff], speed: [0, 0], life: [0.8, 1.2], size: [7, 10], alpha: 0.55 }); // wet, shiny
    }
  }

  private enterOwnLiquid(h: Hero): void {
    if (!this.settings.splash) return;
    this.pools.splash(h.body.x, 1);
    const { x, y } = this.feet(h);
    this.fx.emit({ x, y: y - 3, count: 12, colors: h.elem === 'fire' ? FIRE_FX : WATER_FX, speed: [60, 200], life: [0.25, 0.5], size: [3, 7], angle: -Math.PI / 2, spread: 0.9, gravity: 700 });
    sfx.splash(OWN_LIQUID[h.elem], this.pan(h), this.gain(h));
  }

  private die(h: Hero, cause: DeathCause): void {
    if (!h.alive || h.dying || this.completed) return;
    const s = this.settings;
    h.dying = cause;
    h.body.vx = h.body.vy = 0;
    if (cause === 'crush') { h.sy = 0.35; h.sx = 1.6; h.vsx = h.vsy = 0; } // flattened by the gate
    if (s.blink) h.whiten = 1;
    if (s.hitStop) this.hitStop = s.hitStopMs / 1000;
    if (s.flash) this.flashA = 0.32;
    if (s.zoomPulse) this.zoomK = 0.035;
    this.shake(0.55, 0.3);
    this.haptic(45);
    sfx.death(h.elem, cause, this.pan(h), this.gain(h));
    if (h.local) this.opts.hooks?.localDeath?.(h.elem, cause);
  }

  private explode(h: Hero, cause: DeathCause): void {
    const s = this.settings;
    const x = h.body.x * T, y = (h.body.y - 0.6) * T;
    if (s.splash && cause !== 'crush') this.pools.splash(h.body.x, 1.6);
    if (s.deathFx) {
      const fx = this.fx;
      if (cause === 'crush') {
        // squashed by a gate: stone dust bursts out sideways, plus a puff of the character's own color
        const fy = h.body.y * T - 4;
        fx.emit({ x, y: fy, count: 40, colors: STONE_DUST, speed: [60, 260], life: [0.4, 0.9], size: [4, 10], angle: 0, spread: 0.5, gravity: 200, drag: 0.2, alpha: 0.7 });
        fx.emit({ x, y: fy, count: 40, colors: STONE_DUST, speed: [60, 260], life: [0.4, 0.9], size: [4, 10], angle: Math.PI, spread: 0.5, gravity: 200, drag: 0.2, alpha: 0.7 });
        fx.emit({ x, y: fy, count: 24, colors: h.elem === 'fire' ? FIRE_FX : WATER_FX, speed: [80, 240], life: [0.3, 0.7], size: [3, 8], angle: -Math.PI / 2, spread: 1.4, gravity: 500 });
      } else if (cause === 'poison') {
        fx.emit({ x, y, count: 60, colors: VIOLET_FX, speed: [40, 320], life: [0.4, 1.0], size: [4, 11], spread: Math.PI, gravity: 120, drag: 0.15 });
      } else if (h.elem === 'fire') {
        // Hot Boy hisses into steam in the water
        fx.emit({ x, y, count: 45, colors: STEAM, speed: [20, 130], life: [0.7, 1.4], size: [10, 26], angle: -Math.PI / 2, spread: 0.9, gravity: -160, drag: 0.25, alpha: 0.45 });
        fx.emit({ x, y, count: 14, colors: FIRE_FX, speed: [60, 200], life: [0.2, 0.5], size: [3, 7], spread: Math.PI, gravity: 300 });
        fx.emit({ x, y: y + 16, count: 16, colors: WATER_FX, speed: [80, 220], life: [0.3, 0.6], size: [3, 7], angle: -Math.PI / 2, spread: 0.9, gravity: 800 });
      } else {
        // Cool Girl boils into vapor on the lava
        fx.emit({ x, y, count: 40, colors: [...STEAM, 0x7adfff], speed: [20, 110], life: [0.8, 1.5], size: [10, 24], angle: -Math.PI / 2, spread: 0.7, gravity: -200, drag: 0.3, alpha: 0.45 });
        fx.emit({ x, y, count: 24, colors: WATER_FX, speed: [40, 160], life: [0.3, 0.8], size: [4, 9], angle: -Math.PI / 2, spread: 1.2, gravity: -60 });
        fx.emit({ x, y: y + 16, count: 16, colors: FIRE_FX, speed: [80, 220], life: [0.3, 0.6], size: [3, 7], angle: -Math.PI / 2, spread: 0.8, gravity: 800 });
      }
    }
    h.alive = false;
    h.dying = null;
    h.deadT = 0;
  }

  /** Feel Lab only: bring one character back by itself. */
  private respawnOne(h: Hero): void {
    const sp = this.level.data.spawn[h.elem];
    h.body.place(sp.x, sp.y);
    h.hairReset = true;
    h.alive = true;
    h.ownPrev = 0;
    h.danger = 0;
    if (this.settings.blink) h.whiten = 0.7;
    if (this.settings.squash) { h.sy = 1 + 0.25 * this.settings.squashAmount; h.sx = 1 - 0.15 * this.settings.squashAmount; }
    if (this.settings.jumpFx) this.burst(sp.x * T, (sp.y - 0.7) * T, h.elem === 'fire' ? FIRE_FX : WATER_FX);
    sfx.respawn(h.elem, this.pan(h));
  }

  private pickGem(h: Hero, gem: GemState, index: number): void {
    const s = this.settings;
    gem.alive = false;
    gem.respawn = 4;
    const quick = this.simTime - h.lastGemT < 1.4;
    h.combo = s.gemCombo && quick ? h.combo + 1 : 0;
    h.lastGemT = this.simTime;
    const colors = gem.elem === 'fire' ? FIRE_FX : WATER_FX;
    if (s.gemFx) {
      this.fx.emit({ x: gem.x * T, y: gem.y * T, count: 1, colors: [0xffffff], speed: [0, 0], life: [0.12, 0.15], size: [60, 70], alpha: 0.6 });
      this.fx.emit({ x: gem.x * T, y: gem.y * T, count: 18, colors: [...colors, 0xffffff], speed: [140, 220], life: [0.2, 0.35], size: [4, 8], spread: Math.PI, drag: 0.02 });
      this.fx.emit({ x: gem.x * T, y: gem.y * T, count: 10, colors: [0xffffff, colors[0]], speed: [10, 50], life: [0.5, 1.0], size: [3, 6], spread: Math.PI, gravity: -30 });
    }
    if (s.blink) h.whiten = Math.max(h.whiten, 0.45);
    sfx.gem(gem.elem, h.combo, this.pan(h), this.gain(h));
    if (this.mine(h)) this.haptic(6);
    if (h.local) this.opts.hooks?.localGem?.(h.elem, index);
  }

  // ================================================================ simulation (fixed 120 Hz)

  private stepSim(): void {
    this.simTime += STEP;
    if (!this.completed) this.levelTime += STEP;
    const jumpPressed = this.controls.consumeJump();
    const now = performance.now();
    this.stepMechanisms();
    for (const e of ELEMS) {
      const h = this.heroes[e];
      h.time += STEP;
      if (h.victory >= 0) h.victory += STEP;
      // partner's delayed events
      while (h.queue.length && h.queue[0].t <= now - INTERP_DELAY) h.queue.shift()!.run();
      if (h.dying) this.explode(h, h.dying);
      if (!h.alive) {
        h.deadT += STEP;
        if (this.opts.sandbox && h.deadT > 0.9) this.respawnOne(h);
        continue;
      }
      const b = h.body;
      if (h.local) {
        const mine = e === this.controlled && this.inputEnabled && !this.completed;
        b.step(mine ? { dir: this.controls.dir, jumpPressed, jumpHeld: this.controls.jumpHeld } : NO_INPUT, this.level, this.phys);
      } else this.sampleRemote(h, now - INTERP_DELAY);

      // run cycle + footsteps
      const sp = Math.abs(b.vx);
      if (b.grounded && sp > 0.4) {
        const before = h.runPhase;
        h.runPhase += sp * STEP * 2.6;
        if (Math.floor(before / Math.PI) !== Math.floor(h.runPhase / Math.PI)) this.footstep(h);
        h.idle = 0;
      } else if (b.grounded) h.idle += STEP;
      else h.idle = 0;

      // liquids: your own is safe (splash), the others kill when you're clearly inside (7.4)
      if (b.grounded) {
        const under = this.level.liquidUnder(b.left, b.right, b.y);
        if (h.local && !this.completed) {
          let cause: Liquid | null = null;
          let most = 0;
          for (const k of DEADLY[e]) if (under[k] > most) { most = under[k]; cause = k; }
          if (cause && most >= HITBOX_W * 0.35) { this.die(h, cause); continue; }
        }
        const own = under[OWN_LIQUID[e]];
        if (own > 0.05 && h.ownPrev <= 0.05) this.enterOwnLiquid(h);
        h.ownPrev = own;
      } else h.ownPrev = 0;
      if (h.local && b.y > ROWS + 2) {
        if (this.opts.sandbox) this.respawnOne(h);
        else this.die(h, 'poison');
        continue;
      }

      // near danger (14.4)
      const dist = this.settings.nearDanger ? this.level.distanceToLiquid(b.x, b.y - 0.4, DEADLY[e], 2.5) : Infinity;
      const target = clamp(1 - (dist - 0.3) / 1.7, 0, 1);
      h.danger += (target - h.danger) * Math.min(1, STEP * 8);

      // gems (each player only their own color)
      if (h.local) {
        this.gems.forEach((gem, i) => {
          if (!gem.alive || gem.elem !== e) return;
          const cx = clamp(gem.x, b.left, b.right), cy = clamp(gem.y, b.top, b.y);
          if (Math.hypot(gem.x - cx, gem.y - cy) < 0.4) this.pickGem(h, gem, i);
        });
      }

      // squash & stretch spring
      if (this.settings.squash) {
        h.vsx += ((1 - h.sx) * 520 - h.vsx * 20) * STEP;
        h.vsy += ((1 - h.sy) * 520 - h.vsy * 20) * STEP;
        h.sx += h.vsx * STEP;
        h.sy += h.vsy * STEP;
      } else h.sx = h.sy = 1;
      h.whiten = Math.max(0, h.whiten - STEP * 4);
      const excite = h.victory >= 0 ? 1 : b.grounded ? Math.min(1, sp / this.phys.run) * 0.8 : 1;
      h.excite += (excite - h.excite) * Math.min(1, STEP * 6);
    }
    // levers: flipped by characters on this phone walking into them
    const events: MechEvent[] = [];
    this.mech.updateLevers(ELEMS.filter((e) => this.heroes[e].local && this.isAlive(e)).map((e) => feetOf(this.heroes[e].body)), now, events);
    this.mechEvents(events);
    if (this.opts.sandbox) {
      for (const gem of this.gems) {
        if (gem.alive) continue;
        gem.respawn -= STEP;
        if (gem.respawn <= 0) {
          gem.alive = true;
          if (this.settings.gemFx) this.fx.emit({ x: gem.x * T, y: gem.y * T, count: 8, colors: [0xffffff], speed: [20, 60], life: [0.2, 0.4], size: [3, 6], spread: Math.PI });
        }
      }
    }
  }

  /** Buttons, platforms and gates move; riders are carried; nobody gets stuck inside a platform. */
  private stepMechanisms(): void {
    const m = this.mech;
    if (!m.buttons.length && !m.platforms.length && !m.gates.length) return;
    const events: MechEvent[] = [];
    const alive = ELEMS.filter((e) => this.isAlive(e)).map((e) => this.heroes[e]);
    m.updateButtons(alive.map((h) => feetOf(h.body)), events);
    const locals = alive.filter((h) => h.local);
    const riding = locals.map((h) => m.platformUnder(feetOf(h.body)));
    // A closing gate crushes whoever is under it the moment it reaches their head (brushing its side is forgiven, 7.4).
    const crushed = new Set<Hero>();
    const crush = (r: Rect) => {
      if (this.completed) return;
      for (const h of locals) if (r.x0 < h.body.right - 0.12 && r.x1 > h.body.left + 0.12 && r.y0 < h.body.y && r.y1 > h.body.top + 0.04) crushed.add(h);
    };
    m.update(STEP, crush, events);
    for (const h of crushed) this.die(h, 'crush');
    locals.forEach((h, i) => {
      if (crushed.has(h)) return;
      const b = h.body;
      const pi = riding[i];
      if (pi >= 0) {
        const pl = m.platforms[pi];
        if ((pl.dx || pl.dy) && this.level.free(b.left + pl.dx, b.top + pl.dy, b.right + pl.dx, pl.rect.y0 - 1e-4)) {
          b.x += pl.dx;
          b.prevX += pl.dx;
          b.y = pl.rect.y0 - 1e-4;
          b.prevY += pl.dy;
        }
      }
      // pushed by a platform it isn't riding: move out of the way (up onto it, or down below it)
      for (const pl of m.platforms) {
        const r = pl.rect;
        if (!(r.x0 < b.right && r.x1 > b.left && r.y0 < b.y && r.y1 > b.top)) continue;
        if (b.y - HITBOX_H / 2 < (r.y0 + r.y1) / 2) b.y = r.y0 - 1e-4;
        else b.y = r.y1 + HITBOX_H + 1e-4;
        b.prevY = b.y;
      }
    });
    this.mechEvents(events);
  }

  private panX(xTiles: number): number {
    return (xTiles / COLS) * 1.4 - 0.7;
  }

  private mechEvents(events: MechEvent[]): void {
    for (const ev of events) {
      if (ev.k === 'button') {
        const d = this.mech.buttons[ev.i].def;
        sfx.button(ev.down, this.panX(d.x));
        const me = this.controlled ? this.heroes[this.controlled] : null;
        if (ev.down && me?.local && Math.abs(me.body.x - (d.x + 0.5)) < 0.9) this.haptic(15);
      } else if (ev.k === 'lever') {
        sfx.lever(this.panX(this.mech.levers[ev.i].def.x));
        this.haptic(20);
        if (ev.local) this.opts.hooks?.localLever?.(ev.i, ev.on);
      } else if (ev.k === 'platform') {
        sfx.grind(ev.start, this.panX(this.mech.platforms[ev.i].rect.x0));
      } else {
        sfx.gate(ev.opening, this.panX(this.mech.gates[ev.i].def.x));
      }
    }
  }

  /** Place the partner's character at where it was INTERP_DELAY ago, blending between snapshots. */
  private sampleRemote(h: Hero, t: number): void {
    const buf = h.buf;
    if (!buf.length) return;
    while (buf.length > 2 && buf[1].t <= t) buf.shift();
    const a = buf[0];
    const b = buf[1];
    const b0 = h.body;
    let s = a.s;
    if (b && t > a.t) {
      const k = clamp((t - a.t) / Math.max(1, b.t - a.t), 0, 1);
      s = { ...b.s, x: a.s.x + (b.s.x - a.s.x) * k, y: a.s.y + (b.s.y - a.s.y) * k, vx: a.s.vx + (b.s.vx - a.s.vx) * k, vy: a.s.vy + (b.s.vy - a.s.vy) * k };
      if (k < 0.5) s = { ...s, g: a.s.g, f: a.s.f };
    }
    const onPlat = s.p !== undefined && s.p >= 0 ? this.mech.platforms[s.p] : undefined;
    if (onPlat) {
      // glued to the platform as it is on this phone right now
      const same = b && a.s.p === b.s.p;
      const k = same ? clamp((t - a.t) / Math.max(1, b.t - a.t), 0, 1) : 0;
      const src = same ? a.s : s;
      const dst = same ? b.s : s;
      s = { ...s, x: onPlat.rect.x0 + (src.rx ?? 0) + ((dst.rx ?? 0) - (src.rx ?? 0)) * k, y: onPlat.rect.y0 + (src.ry ?? 0) + ((dst.ry ?? 0) - (src.ry ?? 0)) * k };
    }
    b0.prevX = b0.x = s.x;
    b0.prevY = b0.y = s.y;
    b0.vx = s.vx;
    b0.vy = s.vy;
    b0.grounded = s.g === 1;
    b0.facing = s.f;
  }

  // ================================================================ per-frame drawing

  private drawHero(h: Hero, alpha: number, dt: number): void {
    const b = h.body;
    const s = this.settings;
    const show = h.alive || h.dying !== null;
    h.view.visible = show;
    h.light.visible = show && s.lighting;
    h.status.visible = show && h.status.text !== '';
    h.hairG.visible = show;
    if (!show) return;
    const x = (b.prevX + (b.x - b.prevX) * alpha) * T;
    const y = (b.prevY + (b.y - b.prevY) * alpha) * T;
    h.view.position.set(x, y);
    h.status.position.set(x, y - (HITBOX_H + 0.35) * T + Math.sin(this.simTime * 3) * 2);
    h.view.facing = b.facing;
    h.view.sx = h.sx;
    h.view.sy = h.sy;
    const pose: Pose = {
      time: h.time, speed: Math.min(1, Math.abs(b.vx) / this.phys.run), grounded: b.grounded, vy: b.vy, runPhase: h.runPhase,
      idle: h.idle, animate: s.animations, danger: h.danger, whiten: h.whiten, excite: h.excite, victory: h.victory,
    };
    h.view.trailHair = s.hairTrail;
    h.view.draw(pose);
    this.drawHair(h, dt, pose);

    // own light: he pulses with excitement, she shimmers steadily (14.5)
    const r = (4.6 * T * s.lightRadius) / 64;
    if (h.elem === 'fire') {
      const flick = Math.sin(h.time * 13) * 0.04 + Math.sin(h.time * 29) * 0.03;
      h.light.scale.set(r * (1 + h.excite * 0.2 + flick));
      h.light.alpha = 0.36 + h.excite * 0.14 + flick;
    } else {
      h.light.scale.set(r * (1 + Math.sin(h.time * 2.2) * 0.03));
      h.light.alpha = 0.3 + Math.sin(h.time * 5.1) * 0.02;
    }
    h.light.position.set(x, y - 0.75 * T);

    // floating embers / droplets, and the near-danger reaction
    if (!h.alive) return;
    h.auraT -= dt;
    if (h.auraT > 0) return;
    const hx = x - b.facing * 4, hy = y - 1.35 * T;
    const tip = s.hairTrail ? h.hair.tip() : null; // the trailing hair sheds embers / drops
    if (h.elem === 'fire') {
      h.auraT = 0.13 - h.excite * 0.08;
      if (s.aura && h.danger < 0.6) this.fx.emit({ x: tip ? tip.x : hx + (Math.random() - 0.5) * 14, y: tip ? tip.y : hy, count: 1, colors: FIRE_FX, speed: [20, 50], life: [0.4, 0.9], size: [3, 6], angle: -Math.PI / 2, spread: 0.5, gravity: -60 });
      if (s.nearDanger && h.danger > 0.25) this.dust.emit({ x: hx, y: hy, count: 1, colors: [0x7d8b8f, 0x5a6669], speed: [15, 40], life: [0.5, 0.9], size: [6, 11], angle: -Math.PI / 2, spread: 0.4, gravity: -50, alpha: 0.45 * h.danger }); // sputter smoke
      if (h.victory >= 0) this.fx.emit({ x: hx, y: hy - 6, count: 3, colors: FIRE_FX, speed: [80, 200], life: [0.3, 0.7], size: [3, 7], angle: -Math.PI / 2, spread: 0.7, gravity: 200 }); // his fireworks
    } else {
      h.auraT = tip && h.excite > 0.3 ? 0.07 : 0.16;
      if (s.aura) this.fx.emit({ x: tip ? tip.x : x - b.facing * (10 + Math.random() * 14), y: tip ? tip.y : hy + 8 + Math.random() * 10, count: 1, colors: WATER_FX, speed: [5, 20], life: [0.4, 0.8], size: [2, 4], angle: Math.PI / 2, spread: 0.6, gravity: 140, alpha: 0.8 });
      if (s.nearDanger && h.danger > 0.25) {
        this.fx.emit({ x: x + (Math.random() - 0.5) * 16, y: hy, count: 1 + Math.round(h.danger * 2), colors: STEAM, speed: [20, 60], life: [0.4, 0.8], size: [5, 10], angle: -Math.PI / 2, spread: 0.5, gravity: -80, alpha: 0.35 * h.danger }); // steam
        this.fx.emit({ x: x + (Math.random() - 0.5) * 18, y: y - Math.random() * 30, count: 1, colors: [0xe4faff], speed: [10, 30], life: [0.2, 0.4], size: [2, 4], angle: -Math.PI / 2, spread: 0.6, gravity: -100 }); // bubbles
      }
    }
  }

  /** Trailing hair (render/hair.ts): her long water ribbon, his flame tail. */
  private drawHair(h: Hero, dt: number, p: Pose): void {
    const g = h.hairG.clear();
    if (!this.settings.hairTrail) return;
    const v = h.view;
    const root = h.elem === 'water' ? v.headPoint(-7.5, -2.5) : v.headPoint(-7.5, -5);
    if (h.hairReset) {
      h.hair.reset(root.x, root.y, v.facing);
      h.hairReset = false;
    }
    h.hair.update(root.x, root.y, v.facing, dt, h.time, p.speed);
    const C = (c: number) => lerpColor(c, 0xffffff, h.whiten);
    if (h.elem === 'water') {
      h.hair.ribbon(g, 7.5, 1.6, C(0x1fa3ff));
      h.hair.ribbon(g, 3, 0.6, C(0x7adfff), 0.55);
      h.hair.line(g, 1, 8, 1.1, C(0xe4faff), 0.7, 1.5);
    } else {
      const size = Math.max(0.35, 1 + h.excite * 0.35 - h.danger * 0.6) * (p.victory >= 0 ? 1.4 : 1);
      const flick = (i: number) => 0.8 + 0.35 * Math.sin(h.time * (17 + i * 3) + i * 1.9);
      h.hair.ribbon(g, 9 * size, 0, C(0xff6a1a), 0.95, flick);
      h.hair.ribbon(g, 5.5 * size, 0, C(0xffb02e), 0.95, flick);
      h.hair.ribbon(g, 2.4 * size, 0, C(0xfff0c2), 0.9, flick);
    }
  }

  private addFlame(x: number, y: number): void {
    if (this.flames.length > 40) this.flames.shift();
    this.flames.push({ x, y, age: 0, life: 0.55 + Math.random() * 0.35, seed: Math.random() * 10 });
  }

  /** Small fires left behind in Hot Boy's footsteps: they flicker, shrink and go out. */
  private drawFlames(dt: number): void {
    const g = this.flamesG.clear();
    this.flames = this.flames.filter((f) => (f.age += dt) < f.life);
    for (const f of this.flames) {
      const k = 1 - f.age / f.life;
      const flick = 0.85 + 0.25 * Math.sin(this.simTime * 30 + f.seed) + 0.1 * Math.sin(this.simTime * 47 + f.seed * 2);
      const hgt = (6 + 5 * Math.sqrt(k)) * Math.sqrt(k) * flick;
      const w = 3.6 * Math.sqrt(k);
      const sway = Math.sin(this.simTime * 9 + f.seed) * 1.2;
      const shape = (hh: number, ww: number) => [f.x + sway, f.y - hh, f.x + ww, f.y - hh * 0.4, f.x + ww * 0.55, f.y, f.x - ww * 0.55, f.y, f.x - ww, f.y - hh * 0.4];
      g.poly(shape(hgt, w)).fill({ color: 0xff6a1a, alpha: 0.85 * Math.min(1, k * 2) });
      g.poly(shape(hgt * 0.62, w * 0.6)).fill({ color: 0xffb02e, alpha: 0.9 * Math.min(1, k * 2) });
      g.poly(shape(hgt * 0.3, w * 0.3)).fill({ color: 0xfff0c2, alpha: Math.min(1, k * 2) });
    }
  }

  private drawGems(): void {
    const g = this.gemsG.clear();
    const t = this.simTime;
    for (const gem of this.gems) {
      gem.glow.visible = gem.alive && this.settings.lighting;
      if (!gem.alive) continue;
      const bob = Math.sin(t * 2.6 + gem.phase) * 2.5;
      const x = gem.x * T, y = gem.y * T + bob;
      gem.glow.y = y;
      gem.glow.alpha = 0.32 + Math.sin(t * 3 + gem.phase) * 0.06;
      const [hi, mid, lo] = gem.elem === 'fire' ? [0xfff0c2, 0xffb02e, 0xff6a1a] : [0xe4faff, 0x7adfff, 0x1fa3ff];
      if (gem.elem === 'fire') {
        // flame-shaped crystal
        g.poly([x, y - 10, x + 6.5, y - 1, x + 4.5, y + 7, x - 4.5, y + 7, x - 6.5, y - 1]).fill(lo);
        g.poly([x, y - 10, x + 6.5, y - 1, x, y + 2, x - 6.5, y - 1]).fill(mid);
        g.poly([x, y - 10, x + 2.5, y - 2, x, y + 2, x - 2.5, y - 2]).fill(hi);
      } else {
        // drop-shaped crystal
        g.poly([x, y - 10, x + 4.5, y - 3, x + 6.5, y + 2, x + 4, y + 6.5, x, y + 8, x - 4, y + 6.5, x - 6.5, y + 2, x - 4.5, y - 3]).fill(lo);
        g.poly([x, y - 10, x + 4.5, y - 3, x + 3, y + 3, x - 3, y + 3, x - 4.5, y - 3]).fill(mid);
        g.poly([x, y - 10, x + 1.8, y - 3, x, y + 1, x - 1.8, y - 3]).fill(hi);
      }
      // shine sweeping across every couple of seconds
      const sweep = ((t * 0.6 + gem.phase * 0.17) % 1.6) - 0.3;
      if (sweep > 0 && sweep < 1) {
        const sx = x - 7 + sweep * 14;
        g.moveTo(sx - 2, y + 5).lineTo(sx + 2, y - 7).stroke({ width: 2, color: 0xffffff, alpha: 0.75 * Math.sin(sweep * Math.PI) });
      }
    }
  }

  /** Stone arches with the player's symbol; they glow brighter as their player gets close (8.2, 14.6). */
  private drawDoors(dt: number): void {
    const g = this.doorsG.clear();
    for (const d of this.doors) {
      const h = this.heroes[d.elem];
      const dist = h.alive ? Math.hypot(h.body.x - d.x, (h.body.y - d.y) * 1.5) : 99;
      d.near += (clamp(1 - (dist - 0.5) / 5, 0, 1) - d.near) * Math.min(1, dt * 5);
      const inside = this.atDoor(d.elem) || this.completed;
      d.open += ((inside ? 1 : 0) - d.open) * Math.min(1, dt * 6);
      const [hi, mid, lo] = d.elem === 'fire' ? [0xfff0c2, 0xffb02e, 0xff6a1a] : [0xe4faff, 0x7adfff, 0x1fa3ff];
      const x = d.x * T, y = d.y * T;
      const w = 1.25 * T, hgt = 2.05 * T;
      // frame
      g.roundRect(x - w / 2 - 5, y - hgt - 5, w + 10, hgt + 5, w / 2 + 5).fill(0x2e3d39);
      g.roundRect(x - w / 2 - 5, y - hgt - 5, w + 10, 4, 2).fill({ color: 0x55695f, alpha: 0.6 });
      // the opening: dark, filling with light as the player gets close / steps in
      g.roundRect(x - w / 2, y - hgt, w, hgt, w / 2).fill(0x070d0c);
      const glowA = 0.15 + d.near * 0.35 + d.open * 0.5;
      g.roundRect(x - w / 2 + 3, y - hgt + 3, w - 6, hgt - 3, w / 2 - 3).fill({ color: lo, alpha: glowA * 0.7 });
      g.roundRect(x - w / 2 + 8, y - hgt + 10, w - 16, hgt - 10, w / 2 - 8).fill({ color: mid, alpha: glowA * 0.5 });
      if (d.open > 0.05) g.roundRect(x - w / 2 + 12, y - hgt + 16, w - 24, hgt - 16, 6).fill({ color: hi, alpha: d.open * 0.6 });
      // symbol above the arch
      const sy = y - hgt - 14;
      const pulse = 1 + Math.sin(this.simTime * 4) * 0.05 * (0.3 + d.near);
      const sa = 0.55 + d.near * 0.45;
      if (d.elem === 'fire') g.poly([x, sy - 9 * pulse, x + 6 * pulse, sy + 3, x, sy + 7 * pulse, x - 6 * pulse, sy + 3]).fill({ color: mid, alpha: sa });
      else g.poly([x, sy - 9 * pulse, x + 5 * pulse, sy, x + 5 * pulse, sy + 4, x, sy + 7 * pulse, x - 5 * pulse, sy + 4, x - 5 * pulse, sy]).fill({ color: mid, alpha: sa });
      d.glow.visible = this.settings.lighting;
      d.glow.alpha = 0.12 + d.near * 0.25 + d.open * 0.35;
    }
  }

  /** Brass and gold mechanisms with their linking rune (10.1, 14.6). */
  private drawMechs(): void {
    const g = this.mechG.clear();
    const m = this.mech;
    const GOLD = 0xe3b04b, BRASS = 0x8a6a2a, IVORY = 0xf1e6c8;
    const lit = (rune: Rune) => (m.powered(rune) ? 1 : 0);
    for (const pl of m.platforms) {
      const d = pl.def;
      // dotted guide: where it goes
      const sx = (d.x + d.w / 2) * T, sy = (d.y + PLAT_H / 2) * T, ex = (d.to[0] + d.w / 2) * T, ey = (d.to[1] + PLAT_H / 2) * T;
      const len = Math.hypot(ex - sx, ey - sy);
      for (let t = 0; t <= len; t += 10) g.circle(sx + ((ex - sx) * t) / len, sy + ((ey - sy) * t) / len, 1.3).fill({ color: GOLD, alpha: 0.22 });
      const r = pl.rect;
      const x = r.x0 * T, y = r.y0 * T, w = (r.x1 - r.x0) * T, h = (r.y1 - r.y0) * T;
      g.roundRect(x, y, w, h, 4).fill(0x3a4a45);
      g.rect(x + 2, y, w - 4, 3).fill(GOLD);
      g.rect(x + 2, y + h - 3, w - 4, 2).fill({ color: BRASS, alpha: 0.8 });
      drawRune(g, d.rune, x + w / 2, y + h / 2 + 1, 4.5, lit(d.rune) ? IVORY : GOLD, 0.6 + 0.4 * lit(d.rune));
    }
    for (const gt of m.gates) {
      const d = gt.def;
      const x = d.x * T, y = d.y * T, w = d.w * T, bottom = gt.rect.y1 * T;
      g.rect(x, y - 4, w, 6).fill(BRASS); // lintel
      if (bottom > y + 1) {
        for (let bx = x + 5; bx < x + w - 2; bx += 8) g.rect(bx, y, 4, bottom - y).fill(0x9a7a38);
        g.rect(x, bottom - 5, w, 5).fill(GOLD);
        for (let bx = x + 3; bx < x + w - 2; bx += 8) g.poly([bx, bottom, bx + 4, bottom, bx + 2, bottom + 4]).fill(GOLD);
        drawRune(g, d.rune, x + w / 2, Math.min(bottom - 14, y + 14), 6, lit(d.rune) ? IVORY : GOLD, 0.85);
      } else drawRune(g, d.rune, x + w / 2, y - 12, 5, IVORY, 0.9);
    }
    for (const b of m.buttons) {
      const x = b.def.x * T, floor = (b.def.y + 1) * T;
      g.roundRect(x + 3, floor - 4, T - 6, 4, 1.5).fill(BRASS);
      const top = floor - 8 + b.sink * 4;
      g.roundRect(x + 6, top, T - 12, floor - 4 - top + 1, 2).fill(b.pressed ? IVORY : GOLD);
      drawRune(g, b.def.rune, x + T / 2, floor - 0.75 * T, 4.5, b.pressed ? IVORY : GOLD, 0.45 + 0.55 * b.sink);
    }
    for (const l of m.levers) {
      const cx = (l.def.x + 0.5) * T, floor = (l.def.y + 1) * T;
      const ang = l.angle * 0.65; // tilted left (off) or right (on)
      const px = cx, py = floor - 6;
      g.moveTo(px, py).lineTo(px + Math.sin(ang) * 20, py - Math.cos(ang) * 20).stroke({ width: 3, color: 0x9a7a38, cap: 'round' });
      g.circle(px + Math.sin(ang) * 20, py - Math.cos(ang) * 20, 3.6).fill(l.on ? IVORY : GOLD);
      g.ellipse(cx, floor - 2, 10, 6).fill(0x3a4a45);
      g.rect(cx - 10, floor - 3, 20, 3).fill(BRASS);
      drawRune(g, l.def.rune, cx, floor - 0.95 * T - 4, 4.5, l.on ? IVORY : GOLD, l.on ? 1 : 0.6);
    }
  }

  private computeArc(h: Hero, hold: boolean): number[] {
    const src = h.body;
    const b = new Body();
    b.place(src.x, src.y);
    b.vx = src.facing * this.phys.run;
    b.grounded = true;
    const pts: number[] = [];
    for (let i = 0; i < 300; i++) {
      b.step({ dir: src.facing, jumpPressed: i === 0, jumpHeld: hold }, null, this.phys);
      if (!this.level.free(b.left, b.top, b.right, b.y)) break;
      if (i % 3 === 0) pts.push(b.x * T, b.y * T);
      if (b.vy > 0 && b.y > src.y + 4) break;
    }
    return pts;
  }

  private drawDebug(dt: number, alpha: number): void {
    const g = this.debug.clear();
    const s = this.settings;
    if (s.grid) {
      for (let x = 0; x <= COLS; x++) g.moveTo(x * T, 0).lineTo(x * T, ROWS * T);
      for (let y = 0; y <= ROWS; y++) g.moveTo(0, y * T).lineTo(COLS * T, y * T);
      g.stroke({ width: 1, color: 0xffffff, alpha: 0.12 });
    }
    const me = this.controlled ? this.heroes[this.controlled] : null;
    if (s.jumpArc && me?.alive && me.local) {
      if (me.body.grounded) { me.arcFull = this.computeArc(me, true); me.arcTap = this.computeArc(me, false); }
      const path = (pts: number[], width: number, a: number) => {
        if (pts.length < 4) return;
        g.moveTo(pts[0], pts[1]);
        for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
        g.stroke({ width, color: 0xf1e6c8, alpha: a });
        for (let i = 0; i < pts.length; i += 6) g.circle(pts[i], pts[i + 1], width * 1.4).fill({ color: 0xf1e6c8, alpha: a });
      };
      path(me.arcTap, 1.5, 0.35);
      path(me.arcFull, 2.2, 0.8);
    }
    if (s.hitboxes) {
      for (const e of ELEMS) {
        const h = this.heroes[e];
        if (!h.alive) continue;
        const b = h.body;
        const x = b.prevX + (b.x - b.prevX) * alpha, y = b.prevY + (b.y - b.prevY) * alpha;
        g.rect((x - HITBOX_W / 2) * T, (y - HITBOX_H) * T, HITBOX_W * T, HITBOX_H * T).stroke({ width: 1.5, color: e === 'fire' ? 0xffb02e : 0x7adfff });
      }
      for (const gem of this.gems) if (gem.alive) g.circle(gem.x * T, gem.y * T, 0.4 * T).stroke({ width: 1, color: 0xffffff, alpha: 0.5 });
    }
    // "this one is you": a small arrow over your character for a moment
    this.markerT = Math.max(0, this.markerT - dt);
    if (this.markerT > 0 && me?.alive) {
      const x = me.body.x * T, y = (me.body.y - HITBOX_H - 0.55) * T + Math.sin(this.simTime * 8) * 2;
      g.poly([x - 6, y - 6, x + 6, y - 6, x, y + 2]).fill({ color: 0xffffff, alpha: Math.min(1, this.markerT) });
    }
  }

  private drawHints(): void {
    const g = this.hints.clear();
    const W = this.app.screen.width, H = this.app.screen.height;
    const m = this.controls.move;
    if (m && this.inputEnabled) {
      // the ring under the left thumb (6.2)
      g.circle(m.anchorX, m.anchorY, 28).stroke({ width: 2, color: 0xffffff, alpha: 0.28 });
      const dx = clamp(m.x - m.anchorX, -28, 28);
      g.circle(m.anchorX + dx, m.anchorY, 10).fill({ color: 0xffffff, alpha: this.controls.dir ? 0.35 : 0.18 });
    }
    // zone hints: shown until 3 s after the first touch, then fade out (6.3)
    if (!this.showHints || !this.settings.showZones) return;
    if (this.controls.lastActivity && !this.firstActivity) this.firstActivity = this.controls.lastActivity;
    const v = this.firstActivity ? clamp(1 - ((performance.now() - this.firstActivity) / 1000 - 3), 0, 1) : 1;
    if (v <= 0) { this.showHints = false; return; }
    g.rect(0, 0, W * 0.4, H).fill({ color: 0xffffff, alpha: 0.035 * v });
    g.rect(W * 0.6, 0, W * 0.4, H).fill({ color: 0xffffff, alpha: 0.035 * v });
    const y = H * 0.82, cx = W * 0.2;
    g.moveTo(cx - 34, y).lineTo(cx + 34, y).stroke({ width: 3, color: 0xffffff, alpha: 0.4 * v });
    g.poly([cx - 44, y, cx - 32, y - 8, cx - 32, y + 8]).fill({ color: 0xffffff, alpha: 0.4 * v });
    g.poly([cx + 44, y, cx + 32, y - 8, cx + 32, y + 8]).fill({ color: 0xffffff, alpha: 0.4 * v });
    const jx = W * 0.8;
    g.poly([jx, y - 26, jx - 16, y - 6, jx + 16, y - 6]).fill({ color: 0xffffff, alpha: 0.4 * v });
    g.circle(jx, y + 12, 12).stroke({ width: 3, color: 0xffffff, alpha: 0.4 * v });
  }

  private layout = (): void => {
    const W = this.app.screen.width, H = this.app.screen.height;
    const { left, right } = this.insets;
    this.scale = Math.min((W - left - right) / (COLS * T), H / (ROWS * T));
    this.baseX = left + (W - left - right - COLS * T * this.scale) / 2;
    this.baseY = (H - ROWS * T * this.scale) / 2;
    const m = this.margins.clear().rect(0, 0, W, H).fill(0x050a09);
    // simple temple columns in the side margins (where the thumbs rest)
    const mw = this.baseX;
    if (mw > 8) {
      for (const side of [0, 1]) {
        const x0 = side ? W - mw : 0;
        m.rect(x0, 0, mw, H).fill(0x0a1412);
        const colX = side ? x0 + mw * 0.25 : x0 + mw * 0.35;
        m.rect(colX, 0, mw * 0.4, H).fill(0x0f1c19);
        m.rect(side ? colX : colX + mw * 0.4 - 3, 0, 3, H).fill({ color: 0x2e3d39, alpha: 0.6 });
        for (let y = 0; y < H; y += 46) m.rect(colX - 3, y, mw * 0.4 + 6, 5).fill(0x070e0c);
      }
    }
  };

  // ================================================================ main loop

  private tick = (ticker: { deltaMS: number }): void => {
    const s = this.settings;
    const realDt = Math.min(ticker.deltaMS / 1000, 0.1);
    let simDt = realDt * s.timeScale;
    if (this.slowMo > 0) {
      this.slowMo -= realDt;
      simDt *= 0.35;
    }
    if (this.hitStop > 0) {
      this.hitStop -= realDt;
      simDt = 0;
    }
    this.acc += simDt;
    let steps = 0;
    if (this.paused) this.acc = 0;
    while (this.acc >= STEP && steps < 12) {
      this.stepSim();
      this.acc -= STEP;
      steps++;
    }
    if (steps === 12) this.acc = 0;
    const alpha = this.acc / STEP;

    this.pools.update(simDt, this.simTime);
    this.drawDoors(simDt);
    this.drawMechs();
    this.drawGems();
    for (const e of ELEMS) this.drawHero(this.heroes[e], alpha, simDt);
    this.drawFlames(simDt);
    this.trails.update(simDt);
    this.dust.update(simDt);
    this.fx.update(simDt);
    for (const lg of this.liquidGlows) {
      lg.s.visible = s.lighting && s.liquidGlow;
      const base = lg.kind === 'lava' ? 0.42 : lg.kind === 'water' ? 0.2 : 0.3;
      lg.s.alpha = base + Math.sin(this.simTime * (lg.kind === 'lava' ? 1.7 : 3) + lg.seed) * 0.05;
    }
    this.drawDebug(realDt, alpha);

    // camera: shake, landing kick, zoom pulse (kept small: the whole level must stay visible)
    let ox = 0, oy = 0;
    if (this.shakeT > 0) {
      this.shakeT -= realDt;
      const amp = this.shakePow * T * this.scale * 0.35 * s.shakeAmount * Math.max(0, this.shakeT / this.shakeDur);
      ox = (Math.random() * 2 - 1) * amp;
      oy = (Math.random() * 2 - 1) * amp;
    }
    this.bumpY *= Math.exp(-realDt * 16);
    this.zoomK *= Math.exp(-realDt * 7);
    const z = 1 + this.zoomK;
    this.world.scale.set(this.scale * z);
    this.world.position.set(this.baseX - (COLS * T * this.scale * (z - 1)) / 2 + ox, this.baseY - (ROWS * T * this.scale * (z - 1)) / 2 + oy + this.bumpY);
    if (this.view.zoom !== 1 || this.view.panX || this.view.panY) {
      const zs = this.scale * this.view.zoom;
      this.world.scale.set(zs);
      this.world.position.set(this.baseX - (COLS * T * this.scale * (this.view.zoom - 1)) / 2 + this.view.panX, this.baseY - (ROWS * T * this.scale * (this.view.zoom - 1)) / 2 + this.view.panY);
    }
    if (s.closeup && this.controlled) {
      // debug only: 4× zoom centered on your character
      const me = this.heroes[this.controlled].view;
      const zs = this.scale * 4;
      this.world.scale.set(zs);
      this.world.position.set(this.app.screen.width / 2 - me.x * zs + ox, this.app.screen.height * 0.62 - me.y * zs + oy);
    }

    const W = this.app.screen.width, H = this.app.screen.height;
    this.flashA = Math.max(0, this.flashA - realDt * 1.6);
    this.screenFx.clear();
    if (this.flashA > 0) this.screenFx.rect(0, 0, W, H).fill({ color: 0xffffff, alpha: this.flashA });
    this.drawHints();

    this.frames++;
    const now = performance.now();
    if (now - this.fpsT >= 500) {
      this.fps = (this.frames * 1000) / (now - this.fpsT);
      this.frames = 0;
      this.fpsT = now;
    }
  };

  get particleCount(): number {
    return this.fx.count + this.dust.count + this.trails.count;
  }
}
