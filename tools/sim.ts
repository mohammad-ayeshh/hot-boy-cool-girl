// A headless copy of one level being played: the real physics (body.ts) and mechanisms
// (mechanisms.ts), stepped in the same order as src/play/stage.ts, with no drawing.
// Both characters are driven by a written solution (tools/routes.ts), so `npm run check:routes`
// proves every level can be won (decision log 2026-10-21: the checker alone can't see that).
import { Body, HITBOX_H, HITBOX_W, NO_INPUT, STEP, derive, type Input } from '../src/game/body.ts';
import { ROWS, Level, parseLevel, type Elem, type Liquid, type Rect } from '../src/game/level.ts';
import { Mechanisms, type MechDef, type MechEvent } from '../src/game/mechanisms.ts';
import { defaults } from '../src/game/settings.ts';

const { phys } = derive(defaults());
const ELEMS: Elem[] = ['fire', 'water'];
const DEADLY: Record<Elem, Liquid[]> = { fire: ['water', 'poison'], water: ['lava', 'poison'] };
const feetOf = (b: Body) => ({ left: b.left, right: b.right, y: b.y, vx: b.vx, grounded: b.grounded });

export class World {
  readonly level: Level;
  readonly mech: Mechanisms;
  readonly body: Record<Elem, Body> = { fire: new Body(), water: new Body() };
  readonly doors: Partial<Record<Elem, { x: number; y: number }>>;
  gems: { x: number; y: number; elem: Elem; alive: boolean }[];
  time = 0;
  dead: string | null = null;
  flags = new Set<string>();

  constructor(rows: readonly string[], mechs: MechDef[]) {
    const data = parseLevel(rows, mechs);
    this.level = new Level(data);
    this.mech = new Mechanisms(mechs);
    this.level.dynamic = this.mech.solids;
    this.doors = data.doors;
    this.gems = data.gems.map((g) => ({ ...g, alive: true }));
    for (const e of ELEMS) this.body[e].place(data.spawn[e].x, data.spawn[e].y);
  }

  atDoor(e: Elem): boolean {
    const d = this.doors[e], b = this.body[e];
    return !!d && b.grounded && Math.abs(b.x - d.x) < 0.45 && Math.abs(b.y - d.y) < 0.15;
  }

  gate(i: number): number { return this.mech.gates[i].open; }
  plat(i: number): number { return this.mech.platforms[i].p; }

  step(input: Record<Elem, Input>): void {
    this.time += STEP;
    this.stepMechanisms();
    if (this.dead) return;
    for (const e of ELEMS) {
      const b = this.body[e];
      b.step(input[e], this.level, phys);
      if (b.grounded) {
        const under = this.level.liquidUnder(b.left, b.right, b.y);
        for (const k of DEADLY[e]) if (under[k] >= HITBOX_W * 0.35) return this.die(e, `fell in ${k} at x ${b.x.toFixed(1)}`);
      }
      if (b.y > ROWS + 2) return this.die(e, 'fell out of the level');
      for (const g of this.gems) {
        if (!g.alive || g.elem !== e) continue;
        const cx = Math.min(Math.max(g.x, b.left), b.right), cy = Math.min(Math.max(g.y, b.top), b.y);
        if (Math.hypot(g.x - cx, g.y - cy) < 0.4) g.alive = false;
      }
    }
    this.mech.updateLevers(ELEMS.map((e) => feetOf(this.body[e])), this.time * 1000, []);
  }

  private stepMechanisms(): void {
    const m = this.mech;
    const events: MechEvent[] = [];
    const heroes = ELEMS.map((e) => this.body[e]);
    m.updateButtons(heroes.map(feetOf), events);
    const riding = heroes.map((b) => m.platformUnder(feetOf(b)));
    const crush = (r: Rect) => {
      ELEMS.forEach((e) => {
        const b = this.body[e];
        if (r.x0 < b.right - 0.12 && r.x1 > b.left + 0.12 && r.y0 < b.y && r.y1 > b.top + 0.04) this.die(e, 'crushed by a gate');
      });
    };
    m.update(STEP, crush, events);
    heroes.forEach((b, i) => {
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
      for (const pl of m.platforms) {
        const r = pl.rect;
        if (!(r.x0 < b.right && r.x1 > b.left && r.y0 < b.y && r.y1 > b.top)) continue;
        if (b.y - HITBOX_H / 2 < (r.y0 + r.y1) / 2) b.y = r.y0 - 1e-4;
        else b.y = r.y1 + HITBOX_H + 1e-4;
        b.prevY = b.y;
      }
    });
  }

  private die(e: Elem, why: string): void {
    if (!this.dead) this.dead = `${e === 'fire' ? 'Hot Boy' : 'Cool Girl'} ${why} (t=${this.time.toFixed(2)})`;
  }
}

// ---------------------------------------------------------------- the solution language

/** One instruction for one character. `run` gives this step's input, or null when the instruction is done. */
export interface Cmd { what: string; run(w: World, b: Body, e: Elem): Input | null }

const idle = (): Input => NO_INPUT;
const toward = (b: Body, x: number, slack = 0.12): -1 | 0 | 1 => (Math.abs(x - b.x) <= slack ? 0 : x > b.x ? 1 : -1);

/** Walk (or ride a fall) to x and stop there. */
export function to(x: number): Cmd {
  return {
    what: `walk to ${x}`,
    run: (_w, b) => {
      const dx = x - b.x;
      // stop early enough that braking lands us on the spot
      const brake = (b.vx * b.vx) / (2 * phys.decel) + 0.05;
      if (Math.abs(dx) < 0.15 && Math.abs(b.vx) < 0.3 && b.grounded) return null;
      if (Math.sign(dx) === Math.sign(b.vx) && Math.abs(dx) <= brake) return idle();
      return { dir: dx > 0 ? 1 : -1, jumpPressed: false, jumpHeld: false };
    },
  };
}

/**
 * Jump and steer toward x until landing. `at`: keep running toward x and take off once past `at`
 * (a running jump). `hold`: seconds the jump is held (default: the whole jump = full height).
 */
export function jump(x: number, opt: { at?: number; hold?: number } = {}): Cmd {
  let started = -1;
  let air = false;
  return {
    what: `jump to ${x}${opt.at !== undefined ? ` from ${opt.at}` : ''}`,
    run: (w, b) => {
      if (started < 0) {
        const dir = x > b.x ? 1 : -1;
        if (opt.at !== undefined && (dir > 0 ? b.x < opt.at : b.x > opt.at)) return { dir, jumpPressed: false, jumpHeld: false };
        if (!b.grounded) return idle();
        started = w.time;
        return { dir: toward(b, x), jumpPressed: true, jumpHeld: true };
      }
      if (!b.grounded) air = true;
      if (air && b.grounded) return null;
      if (!air && w.time - started > 0.3) return null; // never left the ground (bumped a ceiling?)
      const held = opt.hold === undefined || w.time - started < opt.hold;
      return { dir: toward(b, x), jumpPressed: false, jumpHeld: held };
    },
  };
}

/** Stand still until something is true. */
export function until(what: string, ok: (w: World) => boolean): Cmd {
  return { what: `wait until ${what}`, run: (w) => (ok(w) ? null : idle()) };
}
/** Stand still for a moment. */
export function pause(s: number): Cmd {
  let t0 = -1;
  return { what: `wait ${s}s`, run: (w) => { if (t0 < 0) t0 = w.time; return w.time - t0 >= s ? null : idle(); } };
}
/** Tell the partner something happened ("I'm on the button"). */
export function say(flag: string): Cmd {
  return { what: `say ${flag}`, run: (w) => { w.flags.add(flag); return null; } };
}
export const heard = (flag: string): Cmd => until(`heard "${flag}"`, (w) => w.flags.has(flag));
export const gateOpen = (i: number): Cmd => until(`gate ${i} open`, (w) => w.gate(i) >= 0.999);
export const gateShut = (i: number): Cmd => until(`gate ${i} shut`, (w) => w.gate(i) <= 0.001);
export const platAt = (i: number, p: 0 | 1): Cmd => until(`platform ${i} at ${p}`, (w) => w.plat(i) === p);

export type Route = Record<Elem, Cmd[]>;

export interface Result { won: boolean; time: number; gems: string; why: string; trace: string[] }

/** Play the level with the solution. Wins when both stand in their doors at the same time. */
export function play(rows: readonly string[], mechs: MechDef[], route: Route, opt: { trace?: boolean; limit?: number } = {}): Result {
  const w = new World(rows, mechs);
  const pc: Record<Elem, number> = { fire: 0, water: 0 };
  const since: Record<Elem, number> = { fire: 0, water: 0 };
  const trace: string[] = [];
  const limit = opt.limit ?? 180;
  const gemText = () => `${w.gems.filter((g) => !g.alive).length}/${w.gems.length}`;
  const where = (e: Elem) => `${w.body[e].x.toFixed(2)},${w.body[e].y.toFixed(2)}`;
  let lastTrace = -1;
  while (w.time < limit) {
    const input = { fire: NO_INPUT, water: NO_INPUT } as Record<Elem, Input>;
    for (const e of ELEMS) {
      const list = route[e];
      for (let guard = 0; guard < 20 && pc[e] < list.length; guard++) {
        const got = list[pc[e]].run(w, w.body[e], e);
        if (got) { input[e] = got; break; }
        if (opt.trace) trace.push(`${w.time.toFixed(2)}  ${e} done: ${list[pc[e]].what}  @ ${where(e)}`);
        pc[e]++;
        since[e] = w.time;
      }
      if (pc[e] < list.length && w.time - since[e] > 20) {
        return { won: false, time: w.time, gems: gemText(), why: `${e} stuck on "${list[pc[e]].what}" at ${where(e)}`, trace };
      }
    }
    w.step(input);
    if (opt.trace && Math.floor(w.time * 4) !== lastTrace) {
      lastTrace = Math.floor(w.time * 4);
      trace.push(`${w.time.toFixed(2)}  fire ${where('fire')}  water ${where('water')}  gates ${w.mech.gates.map((g) => g.open.toFixed(2))}  plats ${w.mech.platforms.map((p) => p.p.toFixed(2))}`);
    }
    if (w.dead) return { won: false, time: w.time, gems: gemText(), why: w.dead, trace };
    if (pc.fire >= route.fire.length && pc.water >= route.water.length && w.atDoor('fire') && w.atDoor('water')) {
      return { won: true, time: w.time, gems: gemText(), why: '', trace };
    }
  }
  return { won: false, time: w.time, gems: gemText(), why: `time ran out: fire step ${pc.fire}/${route.fire.length} @ ${where('fire')}, water step ${pc.water}/${route.water.length} @ ${where('water')}`, trace };
}
