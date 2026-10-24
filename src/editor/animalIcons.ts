// Small pictures of the 8 temple animals for the level designer's menus (16.3, 16.7), drawn by the very same
// code as in the game (render/animals.ts), so what you pick is what players see. A tiny stand-in for the
// PixiJS Graphics calls that drawAnimal() uses draws onto a plain 2D canvas instead.
import type { Graphics } from 'pixi.js';
import { ANIMALS, type Animal } from '../game/mechanisms';
import { drawAnimal } from '../render/animals';

type Style = { color: number; alpha?: number; width?: number; cap?: CanvasLineCap; join?: CanvasLineJoin };

class CanvasPen {
  constructor(private readonly c: CanvasRenderingContext2D) { c.beginPath(); }
  private css = (s: Style) => `rgba(${(s.color >> 16) & 255},${(s.color >> 8) & 255},${s.color & 255},${s.alpha ?? 1})`;
  moveTo(x: number, y: number) { this.c.moveTo(x, y); return this; }
  lineTo(x: number, y: number) { this.c.lineTo(x, y); return this; }
  bezierCurveTo(a: number, b: number, c: number, d: number, x: number, y: number) { this.c.bezierCurveTo(a, b, c, d, x, y); return this; }
  quadraticCurveTo(a: number, b: number, x: number, y: number) { this.c.quadraticCurveTo(a, b, x, y); return this; }
  circle(x: number, y: number, r: number) { this.c.moveTo(x + r, y); this.c.arc(x, y, r, 0, Math.PI * 2); return this; }
  ellipse(x: number, y: number, rx: number, ry: number) { this.c.moveTo(x + rx, y); this.c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); return this; }
  rect(x: number, y: number, w: number, h: number) { this.c.rect(x, y, w, h); return this; }
  poly(p: number[]) {
    this.c.moveTo(p[0], p[1]);
    for (let i = 2; i < p.length; i += 2) this.c.lineTo(p[i], p[i + 1]);
    this.c.closePath();
    return this;
  }
  fill(s: Style) { this.c.fillStyle = this.css(s); this.c.fill(); this.c.beginPath(); return this; }
  stroke(s: Style) {
    this.c.strokeStyle = this.css(s);
    this.c.lineWidth = s.width ?? 1;
    this.c.lineCap = s.cap ?? 'butt';
    this.c.lineJoin = s.join ?? 'miter';
    this.c.stroke();
    this.c.beginPath();
    return this;
  }
}

const cache = new Map<Animal, string>();

/** A data-URL picture of one animal: gold on the dark plaque color, like a symbol stone. */
export function animalIcon(a: Animal): string {
  const hit = cache.get(a);
  if (hit) return hit;
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const c = canvas.getContext('2d')!;
  c.fillStyle = '#2e3d39';
  c.beginPath();
  c.roundRect(2, 2, size - 4, size - 4, 10);
  c.fill();
  drawAnimal(new CanvasPen(c) as unknown as Graphics, a, size / 2, size / 2, size * 0.82, 0xe3b04b, 1, 0x2e3d39);
  const url = canvas.toDataURL();
  cache.set(a, url);
  return url;
}

export const ANIMAL_NAME: Record<Animal, string> = Object.fromEntries(ANIMALS.map((a) => [a, a[0].toUpperCase() + a.slice(1)])) as Record<Animal, string>;
