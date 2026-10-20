// Shared mechanisms (design doc 10.1, 10.2): pressure buttons, levers, moving platforms, gates.
// Linked things share a gold rune: a button or lever "powers" every platform and gate with its rune.
// Pure logic, no drawing. Both phones run it; the host's phone sends corrections (13.1, 13.2).
// Coordinates in tiles. Buttons and levers sit on the floor at the bottom of their cell (y + 1).
import type { Rect } from './level';

export type Rune = 'circle' | 'triangle' | 'square' | 'star';

export type MechDef =
  | { kind: 'button'; x: number; y: number; rune: Rune }
  | { kind: 'lever'; x: number; y: number; rune: Rune }
  /** top-left at (x, y), w tiles wide, half a tile thick; travels to `to` while powered */
  | { kind: 'platform'; x: number; y: number; w: number; to: [number, number]; rune: Rune }
  /** fills w × h tiles while closed; slides up into the ceiling while powered */
  | { kind: 'gate'; x: number; y: number; w: number; h: number; rune: Rune };

type ButtonDef = Extract<MechDef, { kind: 'button' }>;
type LeverDef = Extract<MechDef, { kind: 'lever' }>;
type PlatformDef = Extract<MechDef, { kind: 'platform' }>;
type GateDef = Extract<MechDef, { kind: 'gate' }>;

export interface ButtonState { def: ButtonDef; pressed: boolean; sink: number }
export interface LeverState { def: LeverDef; on: boolean; angle: number; holdUntil: number }
export interface PlatformState { def: PlatformDef; p: number; rect: Rect; dx: number; dy: number; moving: boolean }
export interface GateState { def: GateDef; open: number; rect: Rect; moving: boolean }

/** What a mechanism needs to know about a character. */
export interface Feet { left: number; right: number; y: number; vx: number; grounded: boolean }

export const PLATFORM_THICK = 0.5;
const PLATFORM_SPEED = 3; // tiles/s
const GATE_SPEED = 2.2; // full opens per second

export type MechEvent =
  | { k: 'button'; i: number; down: boolean }
  | { k: 'lever'; i: number; on: boolean; local: boolean }
  | { k: 'platform'; i: number; start: boolean }
  | { k: 'gate'; i: number; opening: boolean };

export class Mechanisms {
  buttons: ButtonState[] = [];
  levers: LeverState[] = [];
  platforms: PlatformState[] = [];
  gates: GateState[] = [];
  /** Solid rectangles for collision (platforms + closed part of gates); updated in place. */
  readonly solids: Rect[] = [];
  private readonly defs: MechDef[];

  constructor(defs: MechDef[]) {
    this.defs = defs;
    this.reset();
  }

  reset(): void {
    this.buttons = [];
    this.levers = [];
    this.platforms = [];
    this.gates = [];
    this.solids.length = 0;
    for (const d of this.defs) {
      if (d.kind === 'button') this.buttons.push({ def: d, pressed: false, sink: 0 });
      else if (d.kind === 'lever') this.levers.push({ def: d, on: false, angle: -1, holdUntil: 0 });
      else if (d.kind === 'platform') {
        const rect = { x0: d.x, y0: d.y, x1: d.x + d.w, y1: d.y + PLATFORM_THICK };
        this.platforms.push({ def: d, p: 0, rect, dx: 0, dy: 0, moving: false });
        this.solids.push(rect);
      } else {
        const rect = { x0: d.x, y0: d.y, x1: d.x + d.w, y1: d.y + d.h };
        this.gates.push({ def: d, open: 0, rect, moving: false });
        this.solids.push(rect);
      }
    }
  }

  powered(rune: Rune): boolean {
    return this.buttons.some((b) => b.pressed && b.def.rune === rune) || this.levers.some((l) => l.on && l.def.rune === rune);
  }

  /** Index of the platform someone is standing on, or -1. */
  platformUnder(f: Feet): number {
    if (!f.grounded) return -1;
    return this.platforms.findIndex((p) => Math.abs(f.y - p.rect.y0) < 0.06 && f.right > p.rect.x0 && f.left < p.rect.x1);
  }

  /** Buttons: pressed while anyone stands on them. */
  updateButtons(all: Feet[], events: MechEvent[]): void {
    this.buttons.forEach((b, i) => {
      const { x, y } = b.def;
      const down = all.some((f) => f.grounded && Math.abs(f.y - (y + 1)) < 0.08 && f.right > x + 0.15 && f.left < x + 0.85);
      if (down !== b.pressed) events.push({ k: 'button', i, down });
      b.pressed = down;
    });
  }

  /** Levers: flipped by walking into them (only characters simulated on this phone flip them). */
  updateLevers(local: Feet[], now: number, events: MechEvent[]): void {
    this.levers.forEach((l, i) => {
      const { x, y } = l.def;
      for (const f of local) {
        if (!f.grounded || Math.abs(f.y - (y + 1)) > 0.08 || f.right < x + 0.25 || f.left > x + 0.75 || Math.abs(f.vx) < 1) continue;
        const on = f.vx > 0; // pushed right = on
        if (on === l.on) continue;
        l.on = on;
        l.holdUntil = now + 700; // ignore older host corrections for a moment
        events.push({ k: 'lever', i, on, local: true });
      }
    });
  }

  /**
   * Move platforms and gates toward their powered / unpowered positions.
   * `closing(rect)` is told the solid part of every gate that is closing: whoever is under it gets crushed.
   */
  update(dt: number, closing: (r: Rect) => void, events: MechEvent[]): void {
    for (const b of this.buttons) b.sink += ((b.pressed ? 1 : 0) - b.sink) * Math.min(1, dt * 20);
    for (const l of this.levers) l.angle += ((l.on ? 1 : -1) - l.angle) * Math.min(1, dt * 14);
    this.platforms.forEach((pl, i) => {
      const d = pl.def;
      const dist = Math.hypot(d.to[0] - d.x, d.to[1] - d.y) || 1;
      const target = this.powered(d.rune) ? 1 : 0;
      const old = pl.p;
      const step = (PLATFORM_SPEED / dist) * dt;
      pl.p = target > pl.p ? Math.min(target, pl.p + step) : Math.max(target, pl.p - step);
      const moving = pl.p !== old;
      if (moving !== pl.moving) events.push({ k: 'platform', i, start: moving });
      pl.moving = moving;
      const before = { x: pl.rect.x0, y: pl.rect.y0 };
      this.placePlatform(pl);
      pl.dx = pl.rect.x0 - before.x;
      pl.dy = pl.rect.y0 - before.y;
    });
    this.gates.forEach((g, i) => {
      const target = this.powered(g.def.rune) ? 1 : 0;
      const old = g.open;
      const open = target > g.open ? Math.min(1, g.open + GATE_SPEED * dt) : Math.max(0, g.open - GATE_SPEED * dt);
      // A closing gate doesn't stop for anyone (10.2): standing in the gateway is deadly.
      if (open < old) closing({ x0: g.def.x, y0: g.def.y, x1: g.def.x + g.def.w, y1: g.def.y + g.def.h * (1 - open) });
      const moving = open !== old;
      if (moving && !g.moving) events.push({ k: 'gate', i, opening: open > old });
      g.moving = moving;
      g.open = open;
      g.rect.y1 = g.def.y + g.def.h * (1 - open);
    });
  }

  private placePlatform(pl: PlatformState): void {
    const d = pl.def;
    const e = pl.p * pl.p * (3 - 2 * pl.p); // ease in and out (8.2)
    const x = d.x + (d.to[0] - d.x) * e;
    const y = d.y + (d.to[1] - d.y) * e;
    pl.rect.x0 = x;
    pl.rect.x1 = x + d.w;
    pl.rect.y0 = y;
    pl.rect.y1 = y + PLATFORM_THICK;
  }

  // ---- network: the host's word on the shared world ----

  state(): { lv: number[]; pl: number[] } {
    return { lv: this.levers.map((l) => (l.on ? 1 : 0)), pl: this.platforms.map((p) => Math.round(p.p * 1000) / 1000) };
  }

  /** Guest: blend toward the host's state (levers snap unless we just flipped one ourselves). */
  correct(s: { lv?: number[]; pl?: number[] }, now: number): void {
    s.lv?.forEach((v, i) => {
      const l = this.levers[i];
      if (l && now > l.holdUntil) l.on = v === 1;
    });
    s.pl?.forEach((v, i) => {
      const p = this.platforms[i];
      if (p && Math.abs(p.p - v) > 0.03) {
        p.p += (v - p.p) * 0.5;
        this.placePlatform(p);
      }
    });
  }

  setLever(i: number, on: boolean): boolean {
    const l = this.levers[i];
    if (!l || l.on === on) return false;
    l.on = on;
    return true;
  }
}
