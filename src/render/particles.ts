import { Particle, ParticleContainer, Texture } from 'pixi.js';

/** Soft white radial blob; tinted per particle and drawn additively it reads as glow. */
export function makeGlowTexture(size = 64): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const g = canvas.getContext('2d')!;
  const r = size / 2;
  const grad = g.createRadialGradient(r, r, 0, r, r, r);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.2, 'rgba(255,255,255,0.75)');
  grad.addColorStop(0.5, 'rgba(255,255,255,0.22)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return Texture.from(canvas);
}

type Range = readonly [min: number, max: number];

export interface EmitOptions {
  x: number;
  y: number;
  count: number;
  /** Colors picked at random per particle. */
  colors: readonly number[];
  /** px/s */
  speed: Range;
  /** seconds */
  life: Range;
  /** diameter in px at birth; shrinks to 0 over life */
  size: Range;
  /** emission direction in radians (0 = right, -PI/2 = up) and half-spread */
  angle?: number;
  spread?: number;
  /** px/s², positive = down */
  gravity?: number;
  /** fraction of velocity kept per second (0..1) */
  drag?: number;
  alpha?: number;
}

interface Live {
  p: Particle;
  vx: number;
  vy: number;
  age: number;
  life: number;
  scale0: number;
  alpha0: number;
  gravity: number;
  dragPerSec: number;
}

const rand = ([a, b]: Range) => a + Math.random() * (b - a);

/**
 * Pooled additive particles on a Pixi ParticleContainer (one draw call for all of them).
 * Call update(dt) once per frame.
 */
export class ParticleSystem {
  readonly view: ParticleContainer;
  private readonly live: Live[] = [];
  private readonly pool: Particle[] = [];
  private readonly texSize: number;
  private born = false;

  constructor(private readonly texture: Texture, private readonly maxParticles = 5000) {
    this.texSize = texture.width;
    this.view = new ParticleContainer({
      texture,
      blendMode: 'add',
      dynamicProperties: { position: true, vertex: true, color: true, rotation: false, uvs: false },
    });
  }

  get count(): number {
    return this.live.length;
  }

  emit(o: EmitOptions): void {
    const n = Math.min(o.count, this.maxParticles - this.live.length);
    const angle = o.angle ?? 0;
    const spread = o.spread ?? Math.PI;
    for (let i = 0; i < n; i++) {
      const p = this.pool.pop() ?? new Particle({ texture: this.texture, anchorX: 0.5, anchorY: 0.5 });
      const a = angle + (Math.random() * 2 - 1) * spread;
      const s = rand(o.speed);
      const scale = rand(o.size) / this.texSize;
      p.x = o.x;
      p.y = o.y;
      p.scaleX = p.scaleY = scale;
      p.tint = o.colors[(Math.random() * o.colors.length) | 0];
      p.alpha = o.alpha ?? 1;
      this.born = true;
      this.live.push({
        p,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        age: 0,
        life: rand(o.life),
        scale0: scale,
        alpha0: p.alpha,
        gravity: o.gravity ?? 0,
        dragPerSec: o.drag ?? 1,
      });
    }
  }

  update(dt: number): void {
    const live = this.live;
    let w = 0;
    for (let i = 0; i < live.length; i++) {
      const l = live[i];
      l.age += dt;
      if (l.age >= l.life) {
        this.pool.push(l.p);
        continue;
      }
      const k = Math.pow(l.dragPerSec, dt);
      l.vx *= k;
      l.vy = l.vy * k + l.gravity * dt;
      l.p.x += l.vx * dt;
      l.p.y += l.vy * dt;
      const t = l.age / l.life;
      const fade = 1 - t * t;
      l.p.scaleX = l.p.scaleY = l.scale0 * (1 - t * 0.7);
      l.p.alpha = l.alpha0 * fade;
      live[w++] = l;
    }
    const died = w !== live.length;
    live.length = w;
    if (!died && !this.born) return; // dynamic props (position/scale/color) upload themselves each frame
    this.born = false;
    // Rebuild the render list in place (dead particles were dropped above).
    const children = this.view.particleChildren;
    children.length = w;
    for (let i = 0; i < w; i++) children[i] = live[i].p;
    this.view.update();
  }
}
