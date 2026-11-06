// The main screen's scene (design doc 11.1 "Main screen details"): the temple of the furthest chapter reached,
// blurred and foggy, with Hot Boy and Cool Girl drawn big in a "portrait" light the levels never use:
// shading and a rim in their element's color (a small light filter), a soft shadow on their ledge and on the
// wall, and each lighting the wall around them. Tap one: he jumps with sparks, she flips her hair.
import { BlurFilter, Container, Filter, GlProgram, Graphics, Sprite, Texture, type Application } from 'pixi.js';
import { COLS, ROWS, type Elem } from '../game/level';
import * as sfx from '../engine/sfx';
import { CharacterView, type Pose } from './character';
import { COOL_HAIR, HOT_FLAME, HairChain } from './hair';
import { ParticleSystem, makeGlowTexture } from './particles';
import { themeFor, type Theme } from './themes';
import { T, airParticle, drawBackground, drawScenery } from './world';

const FIRE_FX = [0xfff0c2, 0xffb02e, 0xff6a1a];
const WATER_FX = [0xe4faff, 0x7adfff, 0x1fa3ff];
/** The menu column in the middle (CSS px); the characters share what's left on each side. */
const MENU_W = 420;
const JUMP_S = 0.75;
const JUMP_PX = 1.1 * T;
const FLIP_HOLD_S = 5;

// ---------------------------------------------------------------- the portrait light
// Lights the silhouette from one side: a warm key light on the edge facing the light, a darker shadow side,
// and a thin rim in the character's own color on the shadow edge. Everything is found from the alpha edge,
// so it works on any pose without drawing the characters twice.
const VERTEX = `in vec2 aPosition;
out vec2 vTextureCoord;
uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;
void main(void) {
  vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
  position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
  position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
  gl_Position = vec4(position, 0.0, 1.0);
  vTextureCoord = aPosition * (uOutputFrame.zw * uInputSize.zw);
}`;

const FRAGMENT = `in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform highp vec4 uInputSize; // the vertex shader's precision, or the program won't link
uniform vec2 uLight;
uniform vec3 uKey;
uniform vec3 uRim;
uniform float uReach;

// How much of the figure lies ahead in that direction: 0 = an edge right next to this pixel, 1 = solid all
// the way to "reach". Averaged (not "first gap") so the light falls off smoothly, without bands.
float gap(vec2 dir, float reach) {
  float sum = 0.0;
  for (int i = 1; i <= 12; i++) {
    vec2 o = dir * (reach * float(i) / 12.0) * uInputSize.zw;
    sum += texture(uTexture, vTextureCoord + o).a;
  }
  return sum / 12.0;
}

void main(void) {
  vec4 c = texture(uTexture, vTextureCoord);
  if (c.a < 0.02) { finalColor = c; return; }
  float lit = 1.0 - gap(uLight, uReach);
  float dark = 1.0 - gap(-uLight, uReach * 2.2);
  float rim = 1.0 - gap(-uLight, uReach * 0.22);
  float low = gap(vec2(0.0, -1.0), uReach * 4.0); // far from the top edge: a little darker toward the feet
  vec3 col = c.rgb * (1.0 - 0.6 * dark * dark) * (1.0 - 0.18 * low * low);
  col += uKey * c.a * 0.55 * lit * lit;
  col += uRim * c.a * rim * rim;
  finalColor = vec4(col, c.a);
}`;

function portraitLight(light: [number, number], key: number, rim: number): Filter {
  const rgb = (c: number) => new Float32Array([((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255]);
  const len = Math.hypot(light[0], light[1]);
  return new Filter({
    glProgram: GlProgram.from({ vertex: VERTEX, fragment: FRAGMENT, name: 'title-portrait-light' }),
    resources: {
      portrait: {
        uLight: { value: new Float32Array([light[0] / len, light[1] / len]), type: 'vec2<f32>' },
        uKey: { value: rgb(key), type: 'vec3<f32>' },
        uRim: { value: rgb(rim), type: 'vec3<f32>' },
        uReach: { value: 10, type: 'f32' },
      },
    },
    padding: 24,
    // drawn into a texture first: keep the screen's sharpness and smooth edges, like the level's characters
    resolution: 'inherit',
    antialias: 'inherit',
  });
}

/** A soft dark frame around the screen. */
function vignetteTexture(): Texture {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(128, 118, 40, 128, 128, 182);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.6, 'rgba(0,0,0,0.25)');
  grad.addColorStop(1, 'rgba(0,0,0,0.85)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  return Texture.from(c);
}

interface Hero {
  elem: Elem;
  /** scaled to the character size; holds everything in world px like the levels do */
  holder: Container;
  lit: Container;
  view: CharacterView;
  hair: HairChain;
  hairG: Graphics;
  /** the same pose again, black and blurred, thrown onto the wall behind */
  shadow: Container;
  shadowView: CharacterView;
  shadowHairG: Graphics;
  wallLight: Sprite;
  /** a smaller, brighter light on the wall right behind them */
  wallCore: Sprite;
  light: Filter;
  time: number;
  idle: number;
  /** seconds into a jump (Hot Boy), -1 = standing */
  jumpT: number;
  /** seconds since the hair flip (Cool Girl), -1 = none */
  victory: number;
  sx: number;
  sy: number;
  vsy: number;
  excite: number;
  auraT: number;
  hairReset: boolean;
}

export class TitleScene {
  readonly root = new Container();
  private readonly glowTex = makeGlowTexture(64);
  private readonly back = new Container();
  private readonly bg = new Graphics();
  private readonly scenery = new Graphics();
  private readonly air = new ParticleSystem(this.glowTex, 160, 'normal');
  private readonly shade = new Graphics();
  private readonly beam = new Sprite({ texture: this.glowTex, anchor: { x: 0.5, y: 0.5 }, blendMode: 'add' });
  private readonly fog: Sprite[] = [];
  private readonly lights = new Container();
  private readonly shadows = new Container();
  private readonly ledges = new Graphics();
  private readonly contact = new Graphics();
  private readonly heroLayer = new Container();
  private readonly fxLayer = new Container();
  private readonly fx = new ParticleSystem(this.glowTex, 600);
  private readonly vignette = new Sprite(vignetteTexture());
  private readonly heroes: Record<Elem, Hero>;
  private theme: Theme | null = null;
  private time = 0;
  private airDue = 0;
  /** screen px per world px for the characters */
  private k = 3;
  private feetY = 0;

  constructor(private readonly app: Application) {
    this.back.addChild(this.bg, this.scenery, this.air.view);
    this.back.filters = [new BlurFilter({ strength: 5, quality: 2, resolution: 0.5 })];
    this.beam.tint = 0xffd9a0;
    for (let i = 0; i < 3; i++) {
      const f = new Sprite({ texture: this.glowTex, anchor: 0.5 });
      f.alpha = 0.07;
      this.fog.push(f);
    }
    this.shadows.filters = [new BlurFilter({ strength: 7, quality: 2, resolution: 0.5 })];
    this.contact.filters = [new BlurFilter({ strength: 4, quality: 2 })];
    this.fxLayer.addChild(this.fx.view);
    this.root.addChild(this.back, this.shade, ...this.fog, this.beam, this.lights, this.shadows, this.ledges, this.contact, this.heroLayer, this.fxLayer, this.vignette);
    this.heroes = { fire: this.makeHero('fire'), water: this.makeHero('water') };
    this.root.visible = false;
    app.stage.addChild(this.root);
    this.setChapter(1);
    app.ticker.add(this.tick);
  }

  get visible(): boolean {
    return this.root.visible;
  }

  set visible(on: boolean) {
    if (on && !this.root.visible) for (const e of ['fire', 'water'] as Elem[]) this.heroes[e].hairReset = true;
    this.root.visible = on;
  }

  /** The temple area behind the title (9.3): the furthest chapter this phone has reached. */
  setChapter(n: number): void {
    const th = themeFor(n);
    if (th === this.theme) return;
    this.theme = th;
    drawBackground(this.bg, th);
    this.air.clear();
    for (const f of this.fog) f.tint = th.farEdge;
  }

  /** A tap on the menu's empty space: which character (if any) was tapped, and make them react. */
  tap(x: number, y: number): Elem | null {
    for (const e of ['fire', 'water'] as Elem[]) {
      const h = this.heroes[e];
      const hx = h.holder.x, hy = h.holder.y;
      if (Math.abs(x - hx) > 24 * this.k || y > hy + 6 * this.k || y < hy - 62 * this.k) continue;
      h.idle = 0;
      if (e === 'fire') {
        if (h.jumpT >= 0) return e;
        h.jumpT = 0;
        h.sy = 1.25; h.sx = 0.8; h.vsy = 0;
        h.excite = 1;
        this.burst(hx, hy, FIRE_FX, 18);
        sfx.jump('fire', -0.6);
      } else {
        h.victory = 0;
        this.burst(hx, hy - 30 * this.k, WATER_FX, 14);
        sfx.jump('water', 0.6);
        setTimeout(() => sfx.chime([1046.5, 1318.5], 0.07, 0.07), 330); // the sunglasses drop 😎
      }
      return e;
    }
    return null;
  }

  private makeHero(elem: Elem): Hero {
    const holder = new Container();
    const lit = new Container();
    const view = new CharacterView(elem);
    view.trailHair = true;
    view.facing = elem === 'fire' ? 1 : -1; // both face the middle
    const hairG = new Graphics();
    // her water hair is lit with her; his flame tail glows by itself, so it stays outside the light
    if (elem === 'water') lit.addChild(hairG, view);
    else { lit.addChild(view); holder.addChild(hairG); }
    holder.addChild(lit);
    // light comes from the middle and above: the gold shaft between them
    const light = portraitLight([elem === 'fire' ? 1 : -1, -0.9], 0xffd9a0, elem === 'fire' ? 0xff8a2a : 0x5fd0ff);
    lit.filters = [light];
    this.heroLayer.addChild(holder);

    const shadow = new Container();
    const shadowView = new CharacterView(elem);
    shadowView.trailHair = true;
    const shadowHairG = new Graphics();
    shadow.addChild(shadowHairG, shadowView);
    shadow.tint = 0x000000;
    shadow.alpha = 0.75;
    this.shadows.addChild(shadow);

    const wallLight = new Sprite({ texture: this.glowTex, anchor: 0.5, blendMode: 'add' });
    wallLight.tint = elem === 'fire' ? 0xff7a22 : 0x2fa8ff;
    const wallCore = new Sprite({ texture: this.glowTex, anchor: 0.5, blendMode: 'add' });
    wallCore.tint = elem === 'fire' ? 0xffb02e : 0x7adfff;
    this.lights.addChild(wallLight, wallCore);

    return {
      elem, holder, lit, view, hair: new HairChain(elem === 'water' ? COOL_HAIR : HOT_FLAME), hairG, shadow, shadowView, shadowHairG, wallLight, wallCore, light,
      time: Math.random() * 10, idle: elem === 'fire' ? 0 : 1, jumpT: -1, victory: -1, sx: 1, sy: 1, vsy: 0, excite: 0, auraT: 0, hairReset: true,
    };
  }

  private burst(x: number, y: number, colors: number[], count: number): void {
    this.fx.emit({ x: x / this.k, y: y / this.k, count, colors, speed: [60, 190], life: [0.3, 0.8], size: [3, 7], angle: -Math.PI / 2, spread: 1.4, gravity: 240 });
  }

  private layout(W: number, H: number): void {
    // the temple fills the screen (cover), centered
    const s = Math.max(W / (COLS * T), H / (ROWS * T)) * 1.06;
    this.back.scale.set(s);
    this.back.position.set((W - COLS * T * s) / 2, (H - ROWS * T * s) / 2);
    this.shade.clear().rect(0, 0, W, H).fill({ color: 0x000000, alpha: 0.12 });
    this.vignette.width = W;
    this.vignette.height = H;
    this.beam.scale.set((W * 0.55) / 64, (H * 2.2) / 64);
    this.beam.position.set(W / 2, -H * 0.1);

    // characters: as big as the height allows, but each must fit its side of the menu with its hair
    const side = Math.max(120, (W - Math.min(MENU_W, W * 0.5)) / 2);
    this.k = Math.max(1.4, Math.min((H * 0.44) / 52, side / 62));
    this.feetY = H * 0.84;
    const x = Math.min(side * 0.5, side - 22 * this.k);
    this.place(this.heroes.fire, x, W, H);
    this.place(this.heroes.water, W - x, W, H);
    this.fxLayer.scale.set(this.k);

    // the stone ledges they stand on, from the screen edge to just past their feet
    const th = this.theme!, st = th.stone, g = this.ledges.clear();
    const top = this.feetY, thick = Math.max(22, H * 0.1);
    for (const left of [true, false]) {
      const glowCol = left ? 0xffb02e : 0x7adfff;
      const cx = left ? x : W - x;
      const inner = left ? x + 30 * this.k : W - x - 30 * this.k;
      const x0 = left ? -10 : inner, x1 = left ? inner : W + 10;
      g.rect(x0, top, x1 - x0, H - top).fill({ color: st.deep, alpha: 0.85 }); // below: dark
      g.rect(x0, top, x1 - x0, thick).fill(st.mid);
      g.rect(x0, top + thick * 0.65, x1 - x0, thick * 0.35).fill({ color: st.dark, alpha: 0.9 });
      g.rect(x0, top, x1 - x0, 3).fill(st.light);
      // the stone catches its owner's light: brightest under the feet, fading along the ledge
      for (let i = 0; i < 6; i++) {
        const w = (6 - i) * 9 * this.k;
        g.rect(Math.max(x0, cx - w), top, Math.min(x1, cx + w) - Math.max(x0, cx - w), 3 + i * 0.6).fill({ color: glowCol, alpha: 0.09 });
        g.rect(Math.max(x0, cx - w), top + 4, Math.min(x1, cx + w) - Math.max(x0, cx - w), thick * 0.5).fill({ color: glowCol, alpha: 0.025 });
      }
      for (let bx = left ? inner - 26 * this.k : inner + 26 * this.k; left ? bx > 0 : bx < W; bx += left ? -40 * this.k : 40 * this.k) {
        g.rect(bx, top + 3, 2, thick - 3).fill({ color: st.deep, alpha: 0.8 }); // block seams
      }
      // the bevelled end facing the middle
      const ex = left ? x1 : x0;
      g.poly([ex, top, ex + (left ? 8 : -8), top + thick * 0.4, ex, top + thick]).fill(st.dark);
      if (th.top !== null) {
        for (let tx = x0 + 6; tx < x1 - 6; tx += 9) g.ellipse(tx, top + 1, 4 + ((tx * 7) % 3), 2).fill({ color: th.top, alpha: 0.7 });
      }
    }
  }

  /** The holder stays at the feet; a jump lifts the character inside it, so the hair trails behind. */
  private place(h: Hero, x: number, W: number, H: number): void {
    const lift = h.jumpT >= 0 ? 4 * JUMP_PX * (h.jumpT / JUMP_S) * (1 - h.jumpT / JUMP_S) : 0;
    h.holder.scale.set(this.k);
    h.holder.position.set(x, this.feetY);
    h.view.y = h.shadowView.y = -lift;
    // the shadow on the wall falls away from the middle (the light is between them) and a little up
    const out = x < W / 2 ? -1 : 1;
    h.shadow.scale.set(this.k * 1.08);
    h.shadow.position.set(x + out * 9 * this.k, this.feetY - H * 0.03);
    h.wallLight.position.set(x + out * 6 * this.k, this.feetY - (30 + lift) * this.k);
    h.wallCore.position.set(x + out * 10 * this.k, this.feetY - (26 + lift * 0.8) * this.k);
    (h.light.resources.portrait as { uniforms: { uReach: number } }).uniforms.uReach = 5.5 * this.k;
  }

  private tick = (ticker: { deltaMS: number }): void => {
    if (!this.root.visible) return;
    const dt = Math.min(ticker.deltaMS / 1000, 0.1);
    this.time += dt;
    const W = this.app.screen.width, H = this.app.screen.height;
    for (const e of ['fire', 'water'] as Elem[]) this.step(this.heroes[e], dt);
    this.layout(W, H);
    for (const e of ['fire', 'water'] as Elem[]) this.draw(this.heroes[e], dt);

    const th = this.theme!;
    drawScenery(this.scenery, th, this.time, 0);
    for (this.airDue += dt * th.air.rate; this.airDue >= 1; this.airDue--) this.air.emit(airParticle(th));
    this.air.update(dt);
    this.fx.update(dt);
    this.beam.alpha = 0.22 + Math.sin(this.time * 0.7) * 0.03;
    this.fog.forEach((f, i) => {
      const u = (this.time * (0.012 + i * 0.006) + i * 0.37) % 1;
      f.position.set(-W * 0.3 + u * W * 1.6, H * (0.35 + i * 0.2));
      f.scale.set((W * 0.9) / 64, (H * 0.5) / 64);
    });
    const hot = this.heroes.fire, cool = this.heroes.water;
    const flick = Math.sin(this.time * 13) * 0.04 + Math.sin(this.time * 29) * 0.03;
    hot.wallLight.scale.set((150 * this.k * (1 + hot.excite * 0.25 + flick)) / 64);
    hot.wallLight.alpha = 0.55 + hot.excite * 0.2 + flick;
    hot.wallCore.scale.set((60 * this.k * (1 + flick)) / 64);
    hot.wallCore.alpha = 0.32 + hot.excite * 0.2 + flick;
    const shimmer = Math.sin(this.time * 2.2) * 0.03;
    cool.wallLight.scale.set((140 * this.k * (1 + shimmer)) / 64);
    cool.wallLight.alpha = 0.5 + Math.sin(this.time * 5.1) * 0.02;
    cool.wallCore.scale.set((56 * this.k * (1 + shimmer)) / 64);
    cool.wallCore.alpha = 0.28;
    // a soft dark patch where each one stands
    const c = this.contact.clear();
    for (const h of [hot, cool]) {
      const lift = -h.view.y / JUMP_PX;
      c.ellipse(h.holder.x, this.feetY + 2, 17 * this.k * (1 - lift * 0.4), 3 * this.k).fill({ color: 0x000000, alpha: 0.6 * (1 - lift * 0.6) });
    }
  };

  /** Pose timing: the jump, the hair flip, squash and stretch, the waiting moves (14.4). */
  private step(h: Hero, dt: number): void {
    h.time += dt;
    h.excite = Math.max(0, h.excite - dt * 1.2);
    if (h.jumpT >= 0) {
      h.jumpT += dt;
      if (h.jumpT >= JUMP_S) {
        h.jumpT = -1;
        h.sy = 0.72; h.sx = 1.25; h.vsy = 0; // stomp
        this.burst(h.holder.x, this.feetY, FIRE_FX, 22);
        sfx.land('fire', 1, -0.6);
      }
    } else h.idle += dt;
    if (h.victory >= 0) {
      h.victory += dt;
      if (h.victory > FLIP_HOLD_S) { h.victory = -1; h.idle = 0; }
    }
    // springy squash and stretch back to 1
    h.vsy += (1 - h.sy) * 260 * dt;
    h.vsy *= Math.exp(-dt * 14);
    h.sy += h.vsy * dt;
    h.sx = 1 / Math.max(0.5, h.sy);
  }

  private draw(h: Hero, dt: number): void {
    const air = h.jumpT >= 0;
    const t = air ? h.jumpT / JUMP_S : 0;
    const pose: Pose = {
      time: h.time, speed: 0, grounded: !air, vy: air ? -((4 * JUMP_PX) / JUMP_S) * (1 - 2 * t) / T : 0, runPhase: 0,
      // hold the flip pose once the glasses are down
      idle: h.idle, animate: true, danger: 0, whiten: 0, excite: h.excite, victory: h.victory < 0 ? -1 : Math.min(h.victory, 0.6),
    };
    for (const v of [h.view, h.shadowView]) {
      v.sx = h.sx;
      v.sy = h.sy;
      v.facing = h.elem === 'fire' ? 1 : -1;
      v.draw(pose);
    }
    // hair: simulated in the holder's world px, drawn on the character and again in the shadow
    const root = h.elem === 'water' ? h.view.headPoint(-7.5, -2.5) : h.view.headPoint(-7.5, -5);
    if (h.hairReset) { h.hair.reset(root.x, root.y, h.view.facing); h.hairReset = false; }
    h.hair.update(root.x, root.y, h.view.facing, dt, h.time, air ? 0.6 : 0);
    for (const g of [h.hairG, h.shadowHairG]) {
      g.clear();
      if (h.elem === 'water') {
        h.hair.ribbon(g, 7.5, 1.6, 0x1fa3ff);
        h.hair.ribbon(g, 3, 0.6, 0x7adfff, 0.55);
        h.hair.line(g, 1, 8, 1.1, 0xe4faff, 0.7, 1.5);
      } else {
        const size = (1 + h.excite * 0.35) * (air ? 1.3 : 1);
        const flick = (i: number) => 0.8 + 0.35 * Math.sin(h.time * (17 + i * 3) + i * 1.9);
        h.hair.ribbon(g, 9 * size, 0, 0xff6a1a, 0.95, flick);
        h.hair.ribbon(g, 5.5 * size, 0, 0xffb02e, 0.95, flick);
        h.hair.ribbon(g, 2.4 * size, 0, 0xfff0c2, 0.9, flick);
      }
    }
    // floating embers / droplets from the hair's tip (14.5)
    h.auraT -= dt;
    if (h.auraT > 0) return;
    const tip = h.hair.tip();
    const x = (h.holder.x + tip.x * this.k) / this.k, y = (h.holder.y + tip.y * this.k) / this.k;
    if (h.elem === 'fire') {
      h.auraT = air ? 0.04 : 0.11;
      this.fx.emit({ x, y, count: 1, colors: FIRE_FX, speed: [20, 50], life: [0.5, 1.1], size: [3, 6], angle: -Math.PI / 2, spread: 0.5, gravity: -60 });
    } else {
      h.auraT = 0.14;
      this.fx.emit({ x, y, count: 1, colors: WATER_FX, speed: [5, 20], life: [0.5, 0.9], size: [2, 4], angle: Math.PI / 2, spread: 0.6, gravity: 140, alpha: 0.8 });
    }
  }
}
