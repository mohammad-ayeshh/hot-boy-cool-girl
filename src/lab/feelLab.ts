// The Feel Lab (design doc 8.1): one test room with both characters and an on-phone panel where
// every game-feel effect can be switched on/off and tuned. Single phone, no network: you control
// one character at a time and can swap. Values found here go back into the design doc.
import { Application, Container, Graphics, Sprite } from 'pixi.js';
import * as device from '../engine/device';
import * as sfx from '../engine/sfx';
import { Controls } from '../engine/input';
import { Body, HITBOX_H, HITBOX_W, NO_INPUT, STEP, derive, type JumpStats, type Phys } from '../game/body';
import { COLS, ROWS, Level, type Elem, type Gem, type Liquid } from '../game/level';
import { labLevel } from '../game/labLevel';
import { load, save, type Key, type Settings } from '../game/settings';
import { ParticleSystem, makeGlowTexture } from '../render/particles';
import { CharacterView, type Pose } from '../render/character';
import { Pools, T, drawBackground, drawTiles } from '../render/world';
import { Panel } from './panel';

const FIRE_FX = [0xfff0c2, 0xffb02e, 0xff6a1a];
const WATER_FX = [0xe4faff, 0x7adfff, 0x1fa3ff];
const VIOLET_FX = [0xf2d4ff, 0xd17bff, 0xa23be8];
const DUST = [0x55695f, 0x3a4a45, 0x7d8f86];
const STEAM = [0xffffff, 0xd8e4e8, 0xa9bac0];
const OWN_LIQUID: Record<Elem, Liquid> = { fire: 'lava', water: 'water' };
const DEADLY: Record<Elem, Liquid[]> = { fire: ['water', 'poison'], water: ['lava', 'poison'] };
const NAMES: Record<Elem, string> = { fire: '🔥 Hot Boy', water: '💧 Cool Girl' };

interface Hero {
  elem: Elem;
  body: Body;
  view: CharacterView;
  light: Sprite;
  alive: boolean;
  dying: Liquid | null;
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
}

interface GemState extends Gem { alive: boolean; respawn: number; glow: Sprite; phase: number }

const $ = <E extends HTMLElement>(id: string) => document.getElementById(id) as E;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export async function startFeelLab(): Promise<void> {
  const settings: Settings = load();
  let derived = derive(settings);
  let phys: Phys = derived.phys;

  const app = new Application();
  await app.init({
    resizeTo: window,
    background: '#050a09',
    antialias: true,
    resolution: Math.min(window.devicePixelRatio || 1, 2),
    autoDensity: true,
    preference: 'webgl',
  });
  $('app').appendChild(app.canvas);

  const level = new Level(labLevel());
  const glowTex = makeGlowTexture(64);

  // ---------------------------------------------------------------- scene graph
  const margins = new Graphics();
  const world = new Container();
  const bg = new Graphics();
  const tiles = new Graphics();
  const lights = new Container();
  const trails = new ParticleSystem(glowTex, 1500);
  const gemsG = new Graphics();
  const heroesLayer = new Container();
  const dust = new ParticleSystem(glowTex, 800, 'normal');
  const poolsG = new Graphics();
  const fx = new ParticleSystem(glowTex, 4000);
  const debug = new Graphics();
  const screenFx = new Graphics();
  const hints = new Graphics();
  drawBackground(bg);
  drawTiles(tiles, level);
  world.addChild(bg, tiles, lights, trails.view, gemsG, heroesLayer, dust.view, poolsG, fx.view, debug);
  app.stage.addChild(margins, world, screenFx, hints);
  const pools = new Pools(level, poolsG);

  const liquidGlows: { s: Sprite; kind: Liquid; seed: number }[] = [];
  for (const pool of level.pools()) {
    for (let x = pool.x0; x < pool.x1; x++) {
      const s = new Sprite({ texture: glowTex, anchor: 0.5, blendMode: 'add' });
      s.position.set((x + 0.5) * T, (pool.y + 0.1) * T);
      s.scale.set((2.6 * T) / 64);
      s.tint = pool.kind === 'lava' ? 0xff6a1a : pool.kind === 'water' ? 0x1fa3ff : 0xa23be8;
      lights.addChild(s);
      liquidGlows.push({ s, kind: pool.kind, seed: Math.random() * 10 });
    }
  }

  // ---------------------------------------------------------------- heroes
  const makeHero = (elem: Elem): Hero => {
    const view = new CharacterView(elem);
    heroesLayer.addChild(view);
    const light = new Sprite({ texture: glowTex, anchor: 0.5, blendMode: 'add' });
    light.tint = elem === 'fire' ? 0xff8a2a : 0x3fb8ff;
    lights.addChild(light);
    const h: Hero = {
      elem, body: new Body(), view, light, alive: true, dying: null, deadT: 0,
      sx: 1, sy: 1, vsx: 0, vsy: 0, whiten: 0, excite: 0, danger: 0, runPhase: 0, idle: 0, time: Math.random() * 10,
      ownPrev: 0, auraT: 0, lastGemT: -10, combo: 0, arcFull: [], arcTap: [],
    };
    h.body.events = {
      jump: () => onJump(h),
      land: (v) => onLand(h, v),
      turn: () => onTurn(h),
      nudge: (kind, x, y) => onNudge(kind, x, y),
    };
    const sp = level.data.spawn[elem];
    h.body.place(sp.x, sp.y);
    return h;
  };
  const heroes: Record<Elem, Hero> = { water: makeHero('water'), fire: makeHero('fire') };
  let controlled: Elem = 'fire';
  let markerT = 2;

  const gems: GemState[] = level.data.gems.map((g, i) => {
    const glow = new Sprite({ texture: glowTex, anchor: 0.5, blendMode: 'add' });
    glow.tint = g.elem === 'fire' ? 0xffb02e : 0x7adfff;
    glow.scale.set((1.6 * T) / 64);
    glow.position.set(g.x * T, g.y * T);
    lights.addChild(glow);
    return { ...g, alive: true, respawn: 0, glow, phase: i * 1.3 };
  });

  // ---------------------------------------------------------------- camera, time, flashes
  let scale = 1, baseX = 0, baseY = 0;
  let shakeT = 0, shakeDur = 1, shakePow = 0;
  let bumpX = 0, bumpY = 0, zoomK = 0, flashA = 0;
  let hitStop = 0;
  let simTime = 0;

  const layout = () => {
    const W = app.screen.width, H = app.screen.height;
    scale = Math.min(W / (COLS * T), H / (ROWS * T));
    baseX = (W - COLS * T * scale) / 2;
    baseY = (H - ROWS * T * scale) / 2;
    margins.clear().rect(0, 0, W, H).fill(0x050a09);
    // simple temple columns in the side margins (where the thumbs rest)
    const mw = baseX;
    if (mw > 8) {
      for (const side of [0, 1]) {
        const x0 = side ? W - mw : 0;
        margins.rect(x0, 0, mw, H).fill(0x0a1412);
        const colX = side ? x0 + mw * 0.25 : x0 + mw * 0.35;
        margins.rect(colX, 0, mw * 0.4, H).fill(0x0f1c19);
        margins.rect(side ? colX : colX + mw * 0.4 - 3, 0, 3, H).fill({ color: 0x2e3d39, alpha: 0.6 });
        for (let y = 0; y < H; y += 46) margins.rect(colX - 3, y, mw * 0.4 + 6, 5).fill(0x070e0c);
      }
    }
  };
  layout();
  app.renderer.on('resize', layout);

  const shake = (power: number, dur: number) => {
    if (!settings.shake) return;
    if (power >= shakePow * (shakeT / shakeDur)) { shakePow = power; shakeDur = shakeT = dur; }
  };
  const haptic = (ms: number) => { if (settings.haptics) device.haptic(ms); };
  const pan = (h: Hero) => (h.body.x / COLS) * 1.4 - 0.7;

  // ---------------------------------------------------------------- effects
  const feet = (h: Hero) => ({ x: h.body.x * T, y: h.body.y * T });

  function onJump(h: Hero): void {
    const A = settings.squashAmount;
    if (settings.squash) { h.sy = 1 + 0.32 * A; h.sx = 1 - 0.22 * A; h.vsx = h.vsy = 0; }
    const { x, y } = feet(h);
    if (settings.jumpFx) {
      if (h.elem === 'fire') {
        fx.emit({ x, y, count: 16, colors: FIRE_FX, speed: [60, 260], life: [0.2, 0.5], size: [4, 10], angle: Math.PI / 2, spread: 1.3, gravity: -200, drag: 0.08 });
      } else {
        fx.emit({ x, y, count: 14, colors: WATER_FX, speed: [70, 190], life: [0.3, 0.55], size: [3, 7], angle: -Math.PI / 2, spread: 1.35, gravity: 700, drag: 0.4 });
      }
      dust.emit({ x, y, count: 5, colors: DUST, speed: [20, 70], life: [0.25, 0.45], size: [6, 12], angle: -Math.PI / 2, spread: 1.4, gravity: -30, drag: 0.1, alpha: 0.5 });
    }
    sfx.jump(h.elem, pan(h));
    haptic(8);
  }

  function onLand(h: Hero, impact: number): void {
    if (impact < 2) return;
    const n = clamp((impact - 4) / 18, 0, 1);
    const A = settings.squashAmount;
    if (settings.squash) { h.sx = 1 + (0.15 + 0.35 * n) * A; h.sy = 1 - (0.12 + 0.3 * n) * A; h.vsx = h.vsy = 0; }
    const { x, y } = feet(h);
    const onOwnLiquid = level.liquidUnder(h.body.left, h.body.right, h.body.y)[OWN_LIQUID[h.elem]] > 0.05;
    if (settings.jumpFx && !onOwnLiquid) {
      for (const dir of [0, Math.PI]) {
        dust.emit({ x, y: y - 2, count: 3 + Math.round(6 * n), colors: DUST, speed: [30, 90 + 160 * n], life: [0.3, 0.6], size: [6, 13], angle: dir, spread: 0.35, gravity: -20, drag: 0.05, alpha: 0.55 });
        if (h.elem === 'fire') fx.emit({ x, y: y - 2, count: 4 + Math.round(10 * n), colors: FIRE_FX, speed: [80, 200 + 200 * n], life: [0.15, 0.4], size: [3, 7], angle: dir + (dir ? 0.35 : -0.35), spread: 0.4, gravity: 600 });
        else fx.emit({ x, y: y - 2, count: 3 + Math.round(6 * n), colors: WATER_FX, speed: [50, 120 + 120 * n], life: [0.25, 0.5], size: [3, 6], angle: dir + (dir ? 0.6 : -0.6), spread: 0.3, gravity: 700 });
      }
    }
    sfx.land(h.elem, n, pan(h));
    haptic(Math.round(6 + 16 * n));
    if (n > 0.45 && settings.bump) bumpY += n * T * scale * 0.12 * settings.shakeAmount;
    if (n > 0.8) shake(0.18, 0.12);
  }

  function onTurn(h: Hero): void {
    if (settings.squash) { h.sx = 1 - 0.15 * settings.squashAmount; h.vsx = 0; }
    if (settings.jumpFx) {
      const { x, y } = feet(h);
      dust.emit({ x: x - h.body.facing * 6, y: y - 2, count: 4, colors: DUST, speed: [30, 80], life: [0.2, 0.4], size: [5, 10], angle: h.body.facing > 0 ? Math.PI : 0, spread: 0.5, gravity: -40, alpha: 0.5 });
    }
    sfx.turn(h.elem, pan(h));
  }

  function onNudge(kind: 'ledge' | 'head' | 'step', x: number, y: number): void {
    if (!settings.nudgeFx) return;
    if (kind === 'step') {
      dust.emit({ x: x * T, y: y * T, count: 2, colors: DUST, speed: [10, 40], life: [0.2, 0.3], size: [4, 8], angle: -Math.PI / 2, spread: 1, alpha: 0.4 });
      return;
    }
    fx.emit({ x: x * T, y: y * T, count: 8, colors: [0xffffff, 0xf1e6c8], speed: [30, 110], life: [0.15, 0.3], size: [3, 6], angle: kind === 'head' ? Math.PI / 2 : -Math.PI / 2, spread: 1.2, alpha: 0.7 });
    sfx.nudge(0);
  }

  function footstep(h: Hero): void {
    const { x, y } = feet(h);
    const inOwn = level.liquidUnder(h.body.left, h.body.right, h.body.y)[OWN_LIQUID[h.elem]] > 0.05;
    sfx.step(h.elem, pan(h));
    if (inOwn) {
      if (settings.splash) {
        pools.splash(h.body.x, 0.35);
        fx.emit({ x, y: y - 3, count: 3, colors: h.elem === 'fire' ? FIRE_FX : WATER_FX, speed: [40, 110], life: [0.2, 0.4], size: [3, 6], angle: -Math.PI / 2, spread: 0.8, gravity: 600 });
      }
      return;
    }
    if (!settings.trails) return;
    if (h.elem === 'fire') {
      trails.emit({ x: x + (Math.random() - 0.5) * 6, y: y - 1, count: 1, colors: [0xff6a1a, 0xb8320c], speed: [0, 0], life: [1.2, 1.8], size: [10, 14], alpha: 0.7 }); // scorch mark
      fx.emit({ x, y: y - 2, count: 1, colors: FIRE_FX, speed: [20, 60], life: [0.3, 0.6], size: [3, 5], angle: -Math.PI / 2, spread: 0.6, gravity: -80 });
    } else {
      trails.emit({ x: x + (Math.random() - 0.5) * 6, y: y - 1, count: 1, colors: [0x7adfff, 0xe4faff], speed: [0, 0], life: [0.8, 1.2], size: [7, 10], alpha: 0.55 }); // wet, shiny
    }
  }

  function die(h: Hero, cause: Liquid): void {
    if (!h.alive || h.dying) return;
    h.dying = cause;
    h.body.vx = h.body.vy = 0;
    if (settings.blink) h.whiten = 1;
    if (settings.hitStop) hitStop = settings.hitStopMs / 1000;
    if (settings.flash) flashA = 0.32;
    if (settings.zoomPulse) zoomK = 0.035;
    shake(0.55, 0.3);
    haptic(45);
    sfx.death(h.elem, cause, pan(h));
  }

  function explode(h: Hero, cause: Liquid): void {
    const x = h.body.x * T, y = (h.body.y - 0.6) * T;
    if (settings.splash) pools.splash(h.body.x, 1.6);
    if (settings.deathFx) {
      if (cause === 'poison') {
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

  function respawn(h: Hero): void {
    const sp = level.data.spawn[h.elem];
    h.body.place(sp.x, sp.y);
    h.alive = true;
    h.dying = null;
    h.sx = h.sy = 1;
    h.ownPrev = 0;
    h.danger = 0;
    if (settings.blink) h.whiten = 0.7;
    if (settings.squash) { h.sy = 1 + 0.25 * settings.squashAmount; h.sx = 1 - 0.15 * settings.squashAmount; }
    if (settings.jumpFx) fx.emit({ x: sp.x * T, y: (sp.y - 0.7) * T, count: 20, colors: h.elem === 'fire' ? FIRE_FX : WATER_FX, speed: [60, 140], life: [0.25, 0.45], size: [4, 8], spread: Math.PI, drag: 0.05 });
    sfx.respawn(h.elem, pan(h));
  }

  function pickGem(h: Hero, gem: GemState): void {
    gem.alive = false;
    gem.respawn = 4;
    const quick = simTime - h.lastGemT < 1.4;
    h.combo = settings.gemCombo && quick ? h.combo + 1 : 0;
    h.lastGemT = simTime;
    const colors = gem.elem === 'fire' ? FIRE_FX : WATER_FX;
    if (settings.gemFx) {
      fx.emit({ x: gem.x * T, y: gem.y * T, count: 1, colors: [0xffffff], speed: [0, 0], life: [0.12, 0.15], size: [60, 70], alpha: 0.6 });
      fx.emit({ x: gem.x * T, y: gem.y * T, count: 18, colors: [...colors, 0xffffff], speed: [140, 220], life: [0.2, 0.35], size: [4, 8], spread: Math.PI, drag: 0.02 });
      fx.emit({ x: gem.x * T, y: gem.y * T, count: 10, colors: [0xffffff, colors[0]], speed: [10, 50], life: [0.5, 1.0], size: [3, 6], spread: Math.PI, gravity: -30 });
    }
    if (settings.blink) h.whiten = Math.max(h.whiten, 0.45);
    sfx.gem(gem.elem, h.combo, pan(h));
    haptic(6);
  }

  // ---------------------------------------------------------------- simulation step (fixed 120 Hz)
  const controls = new Controls(app.canvas, { deadZone: settings.deadZone, anchorFollows: settings.anchorFollows, anchorLeash: settings.anchorLeash });

  function stepSim(): void {
    simTime += STEP;
    const jumpPressed = controls.consumeJump();
    for (const h of [heroes.fire, heroes.water]) {
      h.time += STEP;
      if (h.dying) explode(h, h.dying);
      if (!h.alive) {
        h.deadT += STEP;
        if (h.deadT > 0.9) respawn(h);
        continue;
      }
      const b = h.body;
      const input = h.elem === controlled ? { dir: controls.dir, jumpPressed, jumpHeld: controls.jumpHeld } : NO_INPUT;
      b.step(input, level, phys);

      // run cycle + footsteps
      const sp = Math.abs(b.vx);
      if (b.grounded && sp > 0.4) {
        const before = h.runPhase;
        h.runPhase += sp * STEP * 2.6;
        if (Math.floor(before / Math.PI) !== Math.floor(h.runPhase / Math.PI)) footstep(h);
        h.idle = 0;
      } else if (b.grounded) h.idle += STEP;
      else h.idle = 0;

      // liquids: own = safe (splash), others = death when clearly inside (7.4)
      if (b.grounded) {
        const under = level.liquidUnder(b.left, b.right, b.y);
        let cause: Liquid | null = null;
        let most = 0;
        for (const k of DEADLY[h.elem]) if (under[k] > most) { most = under[k]; cause = k; }
        if (cause && most >= HITBOX_W * 0.35) { die(h, cause); continue; }
        const own = under[OWN_LIQUID[h.elem]];
        if (own > 0.05 && h.ownPrev <= 0.05 && settings.splash) {
          pools.splash(b.x, 1);
          const { x, y } = feet(h);
          fx.emit({ x, y: y - 3, count: 12, colors: h.elem === 'fire' ? FIRE_FX : WATER_FX, speed: [60, 200], life: [0.25, 0.5], size: [3, 7], angle: -Math.PI / 2, spread: 0.9, gravity: 700 });
          sfx.splash(OWN_LIQUID[h.elem], pan(h));
        }
        h.ownPrev = own;
      } else h.ownPrev = 0;
      if (b.y > ROWS + 2) { respawn(h); continue; }

      // near danger (14.4)
      const dist = settings.nearDanger ? level.distanceToLiquid(b.x, b.y - 0.4, DEADLY[h.elem], 2.5) : Infinity;
      const target = clamp(1 - (dist - 0.3) / 1.7, 0, 1);
      h.danger += (target - h.danger) * Math.min(1, STEP * 8);

      // gems
      for (const gem of gems) {
        if (!gem.alive || gem.elem !== h.elem) continue;
        const cx = clamp(gem.x, b.left, b.right), cy = clamp(gem.y, b.top, b.y);
        if (Math.hypot(gem.x - cx, gem.y - cy) < 0.4) pickGem(h, gem);
      }

      // squash & stretch spring
      if (settings.squash) {
        h.vsx += ((1 - h.sx) * 520 - h.vsx * 20) * STEP;
        h.vsy += ((1 - h.sy) * 520 - h.vsy * 20) * STEP;
        h.sx += h.vsx * STEP;
        h.sy += h.vsy * STEP;
      } else h.sx = h.sy = 1;
      h.whiten = Math.max(0, h.whiten - STEP * 4);
      const excite = b.grounded ? Math.min(1, sp / phys.run) * 0.8 : 1;
      h.excite += (excite - h.excite) * Math.min(1, STEP * 6);
    }
    for (const gem of gems) {
      if (gem.alive) continue;
      gem.respawn -= STEP;
      if (gem.respawn <= 0) {
        gem.alive = true;
        if (settings.gemFx) fx.emit({ x: gem.x * T, y: gem.y * T, count: 8, colors: [0xffffff], speed: [20, 60], life: [0.2, 0.4], size: [3, 6], spread: Math.PI });
      }
    }
  }

  // ---------------------------------------------------------------- per-frame drawing
  function drawHero(h: Hero, alpha: number, dt: number): void {
    const b = h.body;
    const show = h.alive || h.dying !== null;
    h.view.visible = show;
    h.light.visible = show && settings.lighting;
    if (!show) return;
    const x = (b.prevX + (b.x - b.prevX) * alpha) * T;
    const y = (b.prevY + (b.y - b.prevY) * alpha) * T;
    h.view.position.set(x, y);
    h.view.facing = b.facing;
    h.view.sx = h.sx;
    h.view.sy = h.sy;
    const pose: Pose = {
      time: h.time, speed: Math.min(1, Math.abs(b.vx) / phys.run), grounded: b.grounded, vy: b.vy, runPhase: h.runPhase,
      idle: h.idle, animate: settings.animations, danger: h.danger, whiten: h.whiten, excite: h.excite,
    };
    h.view.draw(pose);

    // own light: he pulses with excitement, she shimmers steadily (14.5)
    const r = (4.6 * T * settings.lightRadius) / 64;
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
    if (h.auraT <= 0) {
      const hx = x - b.facing * 4, hy = y - 1.35 * T;
      if (h.elem === 'fire') {
        h.auraT = 0.13 - h.excite * 0.08;
        if (settings.aura && h.danger < 0.6) fx.emit({ x: hx + (Math.random() - 0.5) * 14, y: hy, count: 1, colors: FIRE_FX, speed: [20, 50], life: [0.4, 0.9], size: [3, 6], angle: -Math.PI / 2, spread: 0.5, gravity: -60 });
        if (settings.nearDanger && h.danger > 0.25) dust.emit({ x: hx, y: hy, count: 1, colors: [0x7d8b8f, 0x5a6669], speed: [15, 40], life: [0.5, 0.9], size: [6, 11], angle: -Math.PI / 2, spread: 0.4, gravity: -50, alpha: 0.45 * h.danger }); // sputter smoke
      } else {
        h.auraT = 0.16;
        if (settings.aura) fx.emit({ x: x - b.facing * (10 + Math.random() * 14), y: hy + 8 + Math.random() * 10, count: 1, colors: WATER_FX, speed: [5, 20], life: [0.4, 0.8], size: [2, 4], angle: Math.PI / 2, spread: 0.6, gravity: 140, alpha: 0.8 });
        if (settings.nearDanger && h.danger > 0.25) {
          fx.emit({ x: x + (Math.random() - 0.5) * 16, y: hy, count: 1 + Math.round(h.danger * 2), colors: STEAM, speed: [20, 60], life: [0.4, 0.8], size: [5, 10], angle: -Math.PI / 2, spread: 0.5, gravity: -80, alpha: 0.35 * h.danger }); // steam
          fx.emit({ x: x + (Math.random() - 0.5) * 18, y: y - Math.random() * 30, count: 1, colors: [0xe4faff], speed: [10, 30], life: [0.2, 0.4], size: [2, 4], angle: -Math.PI / 2, spread: 0.6, gravity: -100 }); // bubbles
        }
      }
    }
  }

  function drawGems(): void {
    const g = gemsG.clear();
    for (const gem of gems) {
      gem.glow.visible = gem.alive;
      if (!gem.alive) continue;
      const bob = Math.sin(simTime * 2.6 + gem.phase) * 2.5;
      const x = gem.x * T, y = gem.y * T + bob;
      gem.glow.y = y;
      gem.glow.alpha = 0.32 + Math.sin(simTime * 3 + gem.phase) * 0.06;
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
      const sweep = ((simTime * 0.6 + gem.phase * 0.17) % 1.6) - 0.3;
      if (sweep > 0 && sweep < 1) {
        const sx = x - 7 + sweep * 14;
        g.moveTo(sx - 2, y + 5).lineTo(sx + 2, y - 7).stroke({ width: 2, color: 0xffffff, alpha: 0.75 * Math.sin(sweep * Math.PI) });
      }
    }
  }

  function computeArc(h: Hero, hold: boolean): number[] {
    const src = h.body;
    const b = new Body();
    b.place(src.x, src.y);
    b.vx = src.facing * phys.run;
    b.grounded = true;
    const pts: number[] = [];
    for (let i = 0; i < 300; i++) {
      b.step({ dir: src.facing, jumpPressed: i === 0, jumpHeld: hold }, null, phys);
      if (!level.free(b.left, b.top, b.right, b.y)) break;
      if (i % 3 === 0) pts.push(b.x * T, b.y * T);
      if (b.vy > 0 && b.y > src.y + 4) break;
    }
    return pts;
  }

  function drawDebug(alpha: number, dt: number): void {
    const g = debug.clear();
    if (settings.grid) {
      for (let x = 0; x <= COLS; x++) g.moveTo(x * T, 0).lineTo(x * T, ROWS * T);
      for (let y = 0; y <= ROWS; y++) g.moveTo(0, y * T).lineTo(COLS * T, y * T);
      g.stroke({ width: 1, color: 0xffffff, alpha: 0.12 });
    }
    const me = heroes[controlled];
    if (settings.jumpArc && me.alive) {
      if (me.body.grounded) { me.arcFull = computeArc(me, true); me.arcTap = computeArc(me, false); }
      const path = (pts: number[], width: number, alpha: number) => {
        if (pts.length < 4) return;
        g.moveTo(pts[0], pts[1]);
        for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
        g.stroke({ width, color: 0xf1e6c8, alpha });
        for (let i = 0; i < pts.length; i += 6) g.circle(pts[i], pts[i + 1], width * 1.4).fill({ color: 0xf1e6c8, alpha });
      };
      path(me.arcTap, 1.5, 0.35);
      path(me.arcFull, 2.2, 0.8);
    }
    if (settings.hitboxes) {
      for (const h of [heroes.fire, heroes.water]) {
        if (!h.alive) continue;
        const b = h.body;
        const x = b.prevX + (b.x - b.prevX) * alpha, y = b.prevY + (b.y - b.prevY) * alpha;
        g.rect((x - HITBOX_W / 2) * T, (y - HITBOX_H) * T, HITBOX_W * T, HITBOX_H * T).stroke({ width: 1.5, color: h.elem === 'fire' ? 0xffb02e : 0x7adfff });
      }
      for (const gem of gems) if (gem.alive) g.circle(gem.x * T, gem.y * T, 0.4 * T).stroke({ width: 1, color: 0xffffff, alpha: 0.5 });
    }
    // who am I controlling? (after a swap)
    markerT = Math.max(0, markerT - dt);
    if (markerT > 0 && me.alive) {
      const b = me.body;
      const x = b.x * T, y = (b.y - HITBOX_H - 0.55) * T + Math.sin(simTime * 8) * 2;
      g.poly([x - 6, y - 6, x + 6, y - 6, x, y + 2]).fill({ color: 0xffffff, alpha: Math.min(1, markerT) });
    }
  }

  function drawHints(): void {
    const g = hints.clear();
    const W = app.screen.width, H = app.screen.height;
    const m = controls.move;
    if (m) {
      // the ring under the left thumb (6.2)
      g.circle(m.anchorX, m.anchorY, 28).stroke({ width: 2, color: 0xffffff, alpha: 0.28 });
      const dx = clamp(m.x - m.anchorX, -28, 28);
      g.circle(m.anchorX + dx, m.anchorY, 10).fill({ color: 0xffffff, alpha: controls.dir ? 0.35 : 0.18 });
    }
    // zone hints: shown until 3 s after the first touch, then fade out (6.3)
    if (!settings.showZones) return;
    if (controls.lastActivity && !firstActivity) firstActivity = controls.lastActivity;
    const visible = firstActivity ? clamp(1 - ((performance.now() - firstActivity) / 1000 - 3), 0, 1) : 1;
    if (visible <= 0) return;
    g.rect(0, 0, W * 0.4, H).fill({ color: 0xffffff, alpha: 0.035 * visible });
    g.rect(W * 0.6, 0, W * 0.4, H).fill({ color: 0xffffff, alpha: 0.035 * visible });
    const y = H * 0.82, cx = W * 0.2;
    g.moveTo(cx - 34, y).lineTo(cx + 34, y).stroke({ width: 3, color: 0xffffff, alpha: 0.4 * visible });
    g.poly([cx - 44, y, cx - 32, y - 8, cx - 32, y + 8]).fill({ color: 0xffffff, alpha: 0.4 * visible });
    g.poly([cx + 44, y, cx + 32, y - 8, cx + 32, y + 8]).fill({ color: 0xffffff, alpha: 0.4 * visible });
    const jx = W * 0.8;
    g.poly([jx, y - 26, jx - 16, y - 6, jx + 16, y - 6]).fill({ color: 0xffffff, alpha: 0.4 * visible });
    g.circle(jx, y + 12, 12).stroke({ width: 3, color: 0xffffff, alpha: 0.4 * visible });
  }
  let firstActivity = 0;

  // ---------------------------------------------------------------- main loop
  let acc = 0;
  let frames = 0, fps = 0, fpsT = performance.now();
  app.ticker.add((ticker) => {
    const realDt = Math.min(ticker.deltaMS / 1000, 0.1);
    let simDt = realDt * settings.timeScale;
    if (hitStop > 0) {
      hitStop -= realDt;
      simDt = 0;
    }
    acc += simDt;
    let steps = 0;
    while (acc >= STEP && steps < 12) {
      stepSim();
      acc -= STEP;
      steps++;
    }
    if (steps === 12) acc = 0;
    const alpha = acc / STEP;

    pools.update(simDt, simTime);
    drawGems();
    drawHero(heroes.water, alpha, simDt);
    drawHero(heroes.fire, alpha, simDt);
    trails.update(simDt);
    dust.update(simDt);
    fx.update(simDt);
    for (const lg of liquidGlows) {
      lg.s.visible = settings.lighting && settings.liquidGlow;
      const base = lg.kind === 'lava' ? 0.42 : lg.kind === 'water' ? 0.2 : 0.3;
      lg.s.alpha = base + Math.sin(simTime * (lg.kind === 'lava' ? 1.7 : 3) + lg.seed) * 0.05;
    }
    for (const gem of gems) gem.glow.visible = gem.alive && settings.lighting;
    drawDebug(alpha, realDt);

    // camera: shake, landing kick, zoom pulse (kept small: the whole level must stay visible)
    let ox = 0, oy = 0;
    if (shakeT > 0) {
      shakeT -= realDt;
      const amp = shakePow * T * scale * 0.35 * settings.shakeAmount * Math.max(0, shakeT / shakeDur);
      ox = (Math.random() * 2 - 1) * amp;
      oy = (Math.random() * 2 - 1) * amp;
    }
    bumpX *= Math.exp(-realDt * 16);
    bumpY *= Math.exp(-realDt * 16);
    zoomK *= Math.exp(-realDt * 7);
    const z = 1 + zoomK;
    world.scale.set(scale * z);
    world.position.set(baseX - (COLS * T * scale * (z - 1)) / 2 + ox + bumpX, baseY - (ROWS * T * scale * (z - 1)) / 2 + oy + bumpY);
    if (settings.closeup) {
      // debug only: 4× zoom centered on the controlled character
      const me = heroes[controlled].view;
      const zs = scale * 4;
      world.scale.set(zs);
      world.position.set(app.screen.width / 2 - me.x * zs + ox, app.screen.height * 0.62 - me.y * zs + oy);
    }

    const W = app.screen.width, H = app.screen.height;
    flashA = Math.max(0, flashA - realDt * 1.6);
    screenFx.clear();
    if (flashA > 0) screenFx.rect(0, 0, W, H).fill({ color: 0xffffff, alpha: flashA });
    drawHints();

    frames++;
    const now = performance.now();
    if (now - fpsT >= 500) {
      fps = (frames * 1000) / (now - fpsT);
      frames = 0;
      fpsT = now;
      statsEl.textContent = `${Math.round(fps)} fps · ${fx.count + dust.count + trails.count} particles`;
    }
  });

  // ---------------------------------------------------------------- UI
  const ui = $('ui');
  ui.innerHTML = `
    <div class="stats" id="lab-stats"></div>
    <div class="lab-hud">
      <button id="lab-swap" class="hud-btn" title="Swap character (Q)"></button>
      <button id="lab-gear" class="hud-btn" title="Feel Lab settings (Esc)">⚙️ Feel Lab</button>
      <button id="lab-reset" class="hud-btn" title="Back to start (R)">↺</button>
    </div>
    <div class="overlay" id="lab-start">
      <div class="panel">
        <h1><span class="hot">Hot Boy</span> &amp; <span class="cool">Cool Girl</span></h1>
        <h2>Feel Lab</h2>
        <p><b>Left thumb:</b> slide to walk. <b>Right thumb:</b> tap to hop, hold to jump higher.</p>
        <p>Tap <b>⚙️ Feel Lab</b> to switch effects on and off and tune the numbers. Tap <b>🔥/💧</b> to swap characters.</p>
        <button class="primary" id="lab-go">Tap to start</button>
        <p class="small">PC: arrows / A D to walk · Space / W to jump · Q swap · R restart · Esc settings</p>
      </div>
    </div>
    <div class="rotate-msg"><div>📱↻<br/>Turn your phone sideways</div></div>`;
  const statsEl = $('lab-stats');
  const swapBtn = $('lab-swap');

  const panel = new Panel(ui, settings, {
    onChange: (k) => apply(k),
    onBulk: () => apply(null),
  });

  let saveTimer = 0;
  function apply(k: Key | null): void {
    derived = derive(settings);
    phys = derived.phys;
    controls.opts = { deadZone: settings.deadZone, anchorFollows: settings.anchorFollows, anchorLeash: settings.anchorLeash };
    sfx.configure(settings.sound, settings.volume);
    tiles.tint = settings.lighting ? 0x8d9a9c : 0xffffff;
    bg.tint = settings.lighting ? 0xb0bcbd : 0xffffff;
    statsEl.classList.toggle('hidden', !settings.stats);
    if (!settings.trails) trails.clear();
    if (k === 'showZones') firstActivity = 0;
    panel.setReadout(readout(derived.stats, phys));
    clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => save(settings), 300);
  }

  const swap = () => {
    controlled = controlled === 'fire' ? 'water' : 'fire';
    swapBtn.textContent = NAMES[controlled];
    swapBtn.classList.toggle('hot', controlled === 'fire');
    swapBtn.classList.toggle('cool', controlled === 'water');
    markerT = 1.6;
    controls.reset();
    const h = heroes[controlled];
    if (settings.squash && h.alive) { h.sy = 1 + 0.2 * settings.squashAmount; h.sx = 1 - 0.12 * settings.squashAmount; }
  };
  controlled = 'water';
  swap();
  const restart = () => { for (const h of [heroes.fire, heroes.water]) respawn(h); };

  swapBtn.addEventListener('click', swap);
  $('lab-reset').addEventListener('click', restart);
  $('lab-gear').addEventListener('click', () => panel.toggle());
  $('lab-go').addEventListener('click', () => {
    device.unlock();
    sfx.configure(settings.sound, settings.volume);
    $('lab-start').classList.add('hidden');
    if (device.canFullscreen() && !device.isStandalone() && matchMedia('(pointer: coarse)').matches) device.enterFullscreenLandscape().catch(() => {});
  });
  window.addEventListener('keydown', (e) => {
    if (e.target instanceof HTMLInputElement) return;
    if (e.code === 'KeyQ' || e.code === 'Tab') { e.preventDefault(); swap(); }
    else if (e.code === 'KeyR') restart();
    else if (e.code === 'Escape' || e.code === 'Backquote') panel.toggle();
  });
  // Closing the panel or tapping UI must not leave a stuck touch.
  ui.addEventListener('pointerdown', () => controls.reset());

  apply(null);
  // Dev-only handle for automated checks in the browser console (not in the published build).
  if (import.meta.env.DEV) Object.assign(window, { __lab: { heroes, settings, swap, apply } });
}

function readout(s: JumpStats, p: Phys): string {
  const ok = (good: boolean, yes: string, no: string) => `<li class="${good ? 'ok' : 'bad'}">${good ? '✅' : '❌'} ${good ? yes : no}</li>`;
  const f = (v: number) => v.toFixed(2);
  return `
    <div><b>Full jump</b> ${f(s.maxHeight)} tiles high · <b>tap</b> ${f(s.minHeight)} · <b>air time</b> ${f(s.airTime)} s</div>
    <div><b>Longest jump</b> ${f(s.maxGap)} tiles gap (${f(s.maxGapCoyote)} using every helper)</div>
    <ul>
      ${ok(s.maxHeight >= 3.2, '3-tile ledge: reachable', '3-tile ledge: out of reach')}
      ${ok(s.maxHeight + p.ledgeNudge < 4, '4+ tile wall: can\'t be climbed', '4-tile wall can be climbed')}
      ${ok(s.maxGap >= 4.3, `4-tile gap: possible (${f(s.maxGap - 4)} spare)`, '4-tile gap: too tight')}
      ${ok(s.maxGapCoyote < 6, '6-tile gap: impossible', '6-tile gap can be jumped')}
    </ul>
    <p class="small">These are the level rules in the design doc (7.7). A ❌ means the levels would need to change.</p>`;
}
