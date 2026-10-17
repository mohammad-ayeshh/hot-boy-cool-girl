// Character movement physics (design doc 7.3–7.6). Pure logic: no drawing, no sound.
// Units are tiles and seconds; y points down; (x, y) is the middle of the feet.
// Runs at a fixed step (STEP) so the same jump is identical on 60 Hz and 120 Hz phones.
import type { Level } from './level';
import type { Settings } from './settings';

export const STEP = 1 / 120;
export const HITBOX_W = 0.7; // looks ~1 tile wide: forgiving (7.4)
export const HITBOX_H = 1.35; // looks ~1.5 tiles tall; fits 2-tile tunnels
const EPS = 1e-4;

export interface Input {
  dir: -1 | 0 | 1;
  jumpPressed: boolean; // went down since the last step
  jumpHeld: boolean;
}
export const NO_INPUT: Input = { dir: 0, jumpPressed: false, jumpHeld: false };

/** Physics constants derived from the settings (see derive()). */
export interface Phys {
  run: number;
  accel: number;
  decel: number;
  air: number;
  gUp: number;
  fallMult: number;
  v0: number; // jump take-off speed
  vMin: number; // speed kept when the jump is released early
  hang: boolean;
  hangG: number;
  hangV: number;
  fallCap: number;
  coyote: number; // seconds, 0 = off
  buffer: number; // seconds, 0 = off
  ledgeNudge: number; // tiles, 0 = off
  headNudge: number;
  stepUp: number;
}

export interface BodyEvents {
  jump?(): void;
  land?(impactSpeed: number): void;
  turn?(): void;
  nudge?(kind: 'ledge' | 'head' | 'step', x: number, y: number): void;
}

export class Body {
  x = 0;
  y = 0;
  vx = 0;
  vy = 0;
  prevX = 0;
  prevY = 0;
  grounded = false;
  facing: -1 | 1 = 1;
  private coyoteT = 0;
  private bufferT = 0;
  private rising = false; // in a jump that can still be cut short

  events: BodyEvents;
  constructor(events: BodyEvents = {}) {
    this.events = events;
  }

  place(x: number, y: number): void {
    this.x = this.prevX = x;
    this.y = this.prevY = y;
    this.vx = this.vy = 0;
    this.grounded = false;
    this.coyoteT = this.bufferT = 0;
    this.rising = false;
  }

  get left() { return this.x - HITBOX_W / 2; }
  get right() { return this.x + HITBOX_W / 2; }
  get top() { return this.y - HITBOX_H; }

  step(input: Input, level: Level | null, p: Phys): void {
    const dt = STEP;
    this.prevX = this.x;
    this.prevY = this.y;
    const wasGrounded = this.grounded;

    // --- run ---
    const target = input.dir * p.run;
    let rate: number;
    if (input.dir === 0) rate = p.decel;
    else if (this.vx !== 0 && Math.sign(this.vx) !== input.dir) rate = Math.max(p.accel, p.decel);
    else rate = p.accel;
    if (!this.grounded) rate *= p.air;
    this.vx = approach(this.vx, target, rate * dt);
    if (input.dir !== 0 && input.dir !== this.facing) {
      this.facing = input.dir;
      if (this.grounded && Math.abs(this.vx) > p.run * 0.3) this.events.turn?.();
    }

    // --- jump: coyote time + jump buffer ---
    if (this.grounded) this.coyoteT = p.coyote;
    else this.coyoteT -= dt;
    if (input.jumpPressed) this.bufferT = Math.max(p.buffer, dt * 0.5);
    let jumped = false;
    if (this.bufferT > 0 && (this.grounded || this.coyoteT > 0)) {
      this.vy = -p.v0;
      this.grounded = false;
      this.coyoteT = this.bufferT = 0;
      this.rising = true;
      jumped = true;
      this.events.jump?.();
    }
    this.bufferT -= dt;

    // Let go early = lower jump (but never lower than the min jump).
    if (this.rising && !input.jumpHeld && this.vy < -p.vMin) {
      this.vy = -p.vMin;
      this.rising = false;
    }
    if (this.vy >= 0) this.rising = false;

    // --- gravity ---
    let g = p.gUp;
    if (this.vy > 0) g *= p.fallMult;
    if (p.hang && input.jumpHeld && Math.abs(this.vy) < p.hangV && !this.grounded) g *= p.hangG;
    this.vy = Math.min(this.vy + g * dt, p.fallCap);

    if (!level) {
      // Free flight, used by the jump calibration and the arc preview.
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      this.grounded = false;
      return;
    }

    this.moveX(this.vx * dt, level, p);
    const impact = this.vy;
    this.moveY(this.vy * dt, level, p);

    // --- ground check, landing, snapping down small steps ---
    this.grounded = this.vy >= 0 && !level.free(this.left, this.y, this.right, this.y + 0.02);
    if (!this.grounded && wasGrounded && !jumped && p.stepUp > 0 && this.vy >= 0) {
      const drop = this.findGround(level, p.stepUp);
      if (drop !== null) {
        this.y += drop;
        this.grounded = true;
      }
    }
    if (this.grounded) {
      if (!wasGrounded) this.events.land?.(impact);
      this.vy = 0;
    }
  }

  private findGround(level: Level, maxDrop: number): number | null {
    for (let d = 0.02; d <= maxDrop + 1e-6; d += 0.02) {
      if (!level.free(this.left, this.y + d, this.right, this.y + d + 0.02)) return d;
    }
    return null;
  }

  private moveX(dx: number, level: Level, p: Phys): void {
    const steps = Math.max(1, Math.ceil(Math.abs(dx) / 0.25));
    const part = dx / steps;
    for (let i = 0; i < steps; i++) {
      const nx = this.x + part;
      const hit = level.hit(nx - HITBOX_W / 2, this.top, nx + HITBOX_W / 2, this.y);
      if (!hit) { this.x = nx; continue; }

      // Small step-up (grounded) or ledge nudge (in the air): pop up onto the obstacle if it's only a little higher.
      const lift = this.y - hit.top;
      const reach = this.grounded ? p.stepUp : this.vy > -4 ? p.ledgeNudge : 0;
      if (lift > 0 && lift <= reach + EPS && level.free(nx - HITBOX_W / 2, hit.top - HITBOX_H - EPS, nx + HITBOX_W / 2, hit.top - EPS)) {
        this.x = nx;
        this.y = hit.top - EPS;
        if (!this.grounded) {
          this.vy = 0;
          this.events.nudge?.('ledge', this.x + Math.sign(part) * HITBOX_W / 2, this.y);
        } else if (lift > 0.1) {
          this.events.nudge?.('step', this.x, this.y);
        }
        continue;
      }
      this.x = part > 0 ? hit.left - HITBOX_W / 2 - EPS : hit.right + HITBOX_W / 2 + EPS;
      this.vx = 0;
      return;
    }
  }

  private moveY(dy: number, level: Level, p: Phys): void {
    const steps = Math.max(1, Math.ceil(Math.abs(dy) / 0.25));
    const part = dy / steps;
    for (let i = 0; i < steps; i++) {
      const ny = this.y + part;
      const hit = level.hit(this.left, ny - HITBOX_H, this.right, ny);
      if (!hit) { this.y = ny; continue; }
      if (part < 0 && p.headNudge > 0) {
        // Head nudge: clipped a ceiling corner by a little? Slide around it and keep rising.
        const pushLeft = this.right - hit.left; // overlap if we go left of the obstacle
        const pushRight = hit.right - this.left;
        const shift = pushLeft <= pushRight ? -(pushLeft + EPS) : pushRight + EPS;
        if (Math.abs(shift) <= p.headNudge && level.free(this.left + shift, ny - HITBOX_H, this.right + shift, ny)) {
          this.x += shift;
          this.y = ny;
          this.events.nudge?.('head', this.x, this.top);
          continue;
        }
      }
      if (part > 0) this.y = hit.top - EPS;
      else { this.y = hit.bottom + HITBOX_H + EPS; this.rising = false; }
      this.vy = 0;
      return;
    }
  }
}

function approach(v: number, target: number, maxDelta: number): number {
  return v < target ? Math.min(v + maxDelta, target) : Math.max(v - maxDelta, target);
}

// ---------------------------------------------------------------------------
// Turning the settings into physics. The take-off speeds are found by simulating the jump,
// so "Max jump height 3.5" really means the feet rise exactly 3.5 tiles, apex hang included.

export interface JumpStats {
  maxHeight: number;
  minHeight: number;
  /** Longest gap (edge to edge) cleared by a running full jump, without coyote time. */
  maxGap: number;
  /** Same, using all of the coyote time and the ledge nudge: the absolute limit. */
  maxGapCoyote: number;
  airTime: number;
}

export function derive(s: Settings): { phys: Phys; stats: JumpStats } {
  const gUp = (2 * s.jumpHeight) / (s.timeToApex * s.timeToApex);
  const phys: Phys = {
    run: s.runSpeed,
    accel: s.accelTime > 0 ? s.runSpeed / s.accelTime : 1e9,
    decel: s.decelTime > 0 ? s.runSpeed / s.decelTime : 1e9,
    air: s.airControl,
    gUp,
    fallMult: s.fallMult,
    v0: 0,
    vMin: 0,
    hang: s.apexHang,
    hangG: s.apexHangGravity,
    hangV: s.apexHangThreshold,
    fallCap: s.fallCap,
    coyote: s.coyote ? s.coyoteTime : 0,
    buffer: s.buffer ? s.bufferTime : 0,
    ledgeNudge: s.ledgeNudge ? s.ledgeNudgeAmount : 0,
    headNudge: s.headNudge ? s.headNudgeAmount : 0,
    stepUp: s.stepUp ? s.stepUpAmount : 0,
  };
  phys.v0 = solve((v) => peak(phys, v, Infinity), s.jumpHeight, 0, 60);
  // A tap is released at once: it takes off at vMin (no cut, no apex hang).
  phys.vMin = Math.min(phys.v0, solve((v) => peak({ ...phys, vMin: v }, v, 0), Math.min(s.minJumpHeight, s.jumpHeight), 0, 60));

  // Running full jump from a ledge edge: how far do we travel before the feet are back at ledge height?
  const b = new Body();
  b.place(0, 0);
  b.vx = phys.run;
  b.grounded = true;
  let t = 0;
  b.step({ dir: 1, jumpPressed: true, jumpHeld: true }, null, phys);
  t += STEP;
  while (b.y < 0 || b.vy < 0) {
    b.step({ dir: 1, jumpPressed: false, jumpHeld: true }, null, phys);
    t += STEP;
    if (t > 5) break;
  }
  const maxGap = b.x + HITBOX_W;
  const airTime = t;
  // The ledge nudge also catches feet that arrive a little below the far ledge: keep falling that far.
  while (b.y < phys.ledgeNudge && t < 5) {
    b.step({ dir: 1, jumpPressed: false, jumpHeld: true }, null, phys);
    t += STEP;
  }
  const withHelpers = b.x + HITBOX_W + phys.run * phys.coyote;
  return {
    phys,
    stats: { maxHeight: s.jumpHeight, minHeight: Math.min(s.minJumpHeight, s.jumpHeight), maxGap, maxGapCoyote: withHelpers, airTime },
  };
}

/** Peak height of a jump that starts with speed v0 and is held for `holdSteps` steps. */
function peak(p: Phys, v0: number, holdSteps: number): number {
  const b = new Body();
  b.place(0, 0);
  b.grounded = true;
  const pp = { ...p, v0 };
  let top = 0;
  for (let i = 0; i < 2000; i++) {
    b.step({ dir: 0, jumpPressed: i === 0, jumpHeld: i < holdSteps }, null, pp);
    top = Math.min(top, b.y);
    if (b.vy > 0) break;
  }
  return -top;
}

/** Bisection: find x in [lo, hi] where f(x) = target (f increasing). */
function solve(f: (x: number) => number, target: number, lo: number, hi: number): number {
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) < target) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
