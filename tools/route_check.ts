// Can every level be won? Plays each level with its written solution (tools/routes.ts)
// using the real physics and mechanisms (tools/sim.ts).
// Run: npm run check:routes            (all levels)
//      npm run check:routes -- 2-3 -v  (one level, with a step-by-step trace)
import { ALL_LEVELS, findLevel, withCode } from '../src/game/levels.ts';
import { CRUMBLE_MECHS, CRUMBLE_ROWS, TIDE_LAB, TIDE_ROWS, TIMER_MECHS, TIMER_ROWS, VAULT_MECHS, VAULT_PATTERN, VAULT_ROWS } from '../src/game/labLevel.ts';
import { ANIMALS, CRUMBLE_BACK, CRUMBLE_SHAKE, Mechanisms, type Animal, type MechEvent, type MechSync } from '../src/game/mechanisms.ts';
import { gateShut, heard, jump, pause, platAt, play, say, to, until, type Route, type World } from './sim.ts';
import { CODE_ROUTES, ROUTES, TEST_CODE, VAULT_ROUTE } from './routes.ts';

const args = process.argv.slice(2);
const only = args.filter((a) => !a.startsWith('-'));
const verbose = args.includes('-v');
let failed = 0;
/** Timed switches (16.7, S5): how much shorter every clock runs in the lag test. Seconds. */
const LAG_CUT = 0.5;
/** The rising tide (16.7, V5): how much faster the tide rises in the spare-time test. */
const TIDE_RUSH = 1.25;
for (const l of ALL_LEVELS) {
  if (only.length && !only.includes(l.id)) continue;
  const entry = ROUTES[l.id];
  if (!l.rows) continue;
  const route = typeof entry === 'function' ? entry() : entry;
  if (!route) { console.log(`FAIL  ${l.id} ${l.name}: no written solution in tools/routes.ts`); failed++; continue; }
  const { mechs, pattern } = withCode(l, TEST_CODE); // password levels play with a fixed test code (16.7 build notes)
  const r = play(l.rows, mechs, route, { trace: verbose, pattern, apart: l.apart, tide: l.tide });
  if (verbose) console.log(r.trace.join('\n'));
  // Password levels (16.7): every carving is on the path (G9), and the vault takes exactly the code, no wrong steps.
  const w = r.world;
  if (r.won && w.mech.carvings.length > w.carvingsSeen.size) { r.won = false; r.why = `the route never lights ${w.mech.carvings.length - w.carvingsSeen.size} carving(s)`; }
  if (r.won && pattern && (w.stoneLog.join() !== pattern.code.join() || !w.solved())) { r.won = false; r.why = `stones stepped: ${w.stoneLog.join(', ')} (code ${pattern.code.join(', ')})`; }
  // Timed switches (16.7, S5): the level must also be won with every clock 0.5 s shorter, so two phones that
  // disagree a little about a clock (the partner is shown about 0.1 s late, 13.2) both have room to spare.
  // The rising tide (16.7, V5): the level must be won in the same go with the tide a quarter faster, so a team that
  // is slower than the robot still has time.
  let lag = '';
  const timed = mechs.some((m) => m.kind === 'timer');
  if (r.won && (timed || l.tide)) {
    if (typeof entry !== 'function') { r.won = false; r.why = 'a level with timed switches or a tide needs its solution as a function (() => Route), so the robot can play it twice'; }
    else {
      const hard = play(l.rows, mechs, entry(), { pattern, apart: l.apart, tide: l.tide, cut: timed ? LAG_CUT : 0, rush: TIDE_RUSH });
      const how = [timed ? `every clock ${LAG_CUT} s shorter` : '', l.tide ? `the tide ${TIDE_RUSH}× faster` : ''].filter(Boolean).join(' and ');
      if (!hard.won) { r.won = false; r.why = `no room to spare: with ${how}, ${hard.why}`; }
      else lag = `, and with ${how}`;
    }
  }
  const note = r.won ? `won in ${r.time.toFixed(1)} s, gems ${r.gems} (⭐⭐⭐ under ${l.targetTime} s)${lag}` : r.why;
  console.log(`${r.won ? 'PASS' : 'FAIL'}  ${l.id} ${l.name}: ${note}`);
  if (!r.won) failed++;
}
// The vaults (6-10, 7-10, 9-10) with many codes, not just the test one: a vault must work for whatever code a team gets (G11),
// including every animal on one side (one player does all the stepping) and the same animal four times.
for (const [id, routeFor] of Object.entries(CODE_ROUTES)) {
  const vault = findLevel(id);
  if (!vault?.rows || (only.length && !only.includes(id))) continue;
  const codes: Animal[][] = [
    ['snake', 'monkey', 'jaguar', 'frog'], ['turtle', 'bat', 'fish', 'bird'], ['frog', 'frog', 'frog', 'frog'],
    ['snake', 'turtle', 'snake', 'turtle'], ['bird', 'bird', 'jaguar', 'jaguar'],
  ];
  let seed = 7;
  const rnd = () => (seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let i = 0; i < 40; i++) codes.push(Array.from({ length: 4 }, () => ANIMALS[Math.floor(rnd() * 8)]));
  const bad: string[] = [];
  for (const code of codes) {
    const { mechs, pattern } = withCode(vault, code);
    const r = play(vault.rows, mechs, routeFor(code), { pattern, apart: vault.apart, tide: vault.tide });
    if (!r.won || r.world.stoneLog.join() !== code.join()) bad.push(`${code.join(' ')}: ${r.why || r.world.stoneLog.join(',')}`);
  }
  console.log(`${bad.length ? 'FAIL' : 'PASS'}  ${id} with ${codes.length} different codes${bad.length ? `: ${bad.slice(0, 3).join(' | ')}` : ' (one side only, repeats, 40 random)'}`);
  if (bad.length) failed++;
}
// Don't touch (16.7, T1–T2): in a flat room, walking into each other bursts both; a full jump over a friend who
// stands still is safe; a brush at the edge is survived; and in a normal level they still walk through each other (7.3).
if (!only.length || only.includes('touch')) {
  const wall = '################################';
  const room = [wall, ...Array(15).fill('#..............................#'), '#....h.........c...............#', wall];
  const tests: [string, Route, boolean, boolean][] = [
    ['walking into each other bursts both', { fire: [to(20)], water: [to(4)] }, true, false],
    ['jumping over a friend who stands still is safe', { fire: [to(13.4), jump(18.6, { at: 13.4 }), to(20.5)], water: [] }, true, true],
    ['a brush at the edge is survived', { fire: [to(14.95)], water: [] }, true, true],
    ["without Don't touch they walk through each other", { fire: [to(20)], water: [to(4)] }, false, true],
  ];
  for (const [what, route, apart, survive] of tests) {
    const r = play(room, [], route, { apart, goal: () => true });
    const ok = survive ? !r.world.dead : !!r.world.dead?.includes('steam');
    console.log(`${ok ? 'PASS' : 'FAIL'}  don't touch: ${what}${ok ? '' : ` (${r.world.dead ?? 'nobody died'})`}`);
    if (!ok) failed++;
  }
}
// The password-gate test room (?lab=vault): a right step, a wrong one that must reset everything (G7),
// a repeated animal entered by stepping off and on again (G11), and the gate opening at the end.
if (!only.length || only.includes('vault')) {
  const goal = (w: World) => w.solved() && w.gate(0) >= 0.999 && w.mech.vault!.resets === 1;
  const r = play(VAULT_ROWS, VAULT_MECHS, VAULT_ROUTE, { trace: verbose, pattern: VAULT_PATTERN, goal });
  if (verbose) console.log(r.trace.join('\n'));
  console.log(`${r.won ? 'PASS' : 'FAIL'}  vault test room: ${r.won ? `code entered, a wrong step reset it, gate open (${r.time.toFixed(1)} s)` : r.why}`);
  if (!r.won) failed++;
}
// Two phones entering the code online (13.1): the guest's steps go to the host, the host's word comes back.
// Messages arrive one "tick" late. Both phones must agree on every step, a wrong step and the final solve.
if (!only.length || only.includes('vault')) {
  const host = new Mechanisms(VAULT_MECHS, VAULT_PATTERN), guest = new Mechanisms(VAULT_MECHS, VAULT_PATTERN);
  const idx = (a: string) => host.stones.findIndex((s) => s.def.animal === a);
  const toHost: number[] = [];
  let toGuest: MechSync | null = null;
  let now = 0;
  const heard: string[] = [];
  const deliver = () => {
    now += 1000; // past the guest's own "trust myself" window
    for (const i of toHost.splice(0)) { host.pressStone(i, []); toGuest = host.state(); }
    if (toGuest) { const ev: MechEvent[] = []; guest.correct(toGuest, now, ev); heard.push(...ev.map((e) => e.k === 'stone' ? (e.ok ? 'ok' : 'thud') : e.k)); toGuest = null; }
  };
  const hostSteps = (a: string) => { host.pressStone(idx(a), [], true, now); toGuest = host.state(); deliver(); };
  const guestSteps = (a: string) => { guest.pressStone(idx(a), [], true, now); toHost.push(idx(a)); deliver(); };
  hostSteps('frog'); guestSteps('fish'); hostSteps('frog'); hostSteps('snake'); hostSteps('frog'); guestSteps('bat'); guestSteps('bat'); hostSteps('monkey');
  deliver();
  const same = JSON.stringify(host.state().pw) === JSON.stringify(guest.state().pw);
  const ok = same && host.vault!.solved && guest.powered('star') && host.vault!.resets === 2 && heard.includes('thud') && heard.at(-1) === 'solved';
  console.log(`${ok ? 'PASS' : 'FAIL'}  vault on two phones: ${ok ? 'host and guest agree on every step, both wrong steps and the solve' : `host ${JSON.stringify(host.state().pw)} guest ${JSON.stringify(guest.state().pw)} heard ${heard}`}`);
  if (!ok) failed++;
}
// Crumbling stones (16.7, K1–K6) in their test room (?lab=crumble), with the real physics: running across the
// bridge is safe and it falls away behind you; standing still drops you into the poison; the whole bridge grows
// back and can be crossed again; and single crumbling stones work as quick steps up to the gem shelf.
if (!only.length || only.includes('crumble')) {
  const bridge = [...Array(12).keys()];
  const tests: [string, Route, (w: World) => boolean, (r: ReturnType<typeof play>) => boolean][] = [
    ['running across is safe, the bridge falls behind you, grows back, and holds again',
      { fire: [to(23.5), until('the whole bridge is gone', (w) => bridge.every((i) => w.gone(i))), until('the whole bridge is back', (w) => bridge.every((i) => w.mech.crumbles[i].t < 0)), to(8.5)], water: [] },
      (w) => w.body.fire.x < 9, (r) => r.won && r.time > CRUMBLE_SHAKE + CRUMBLE_BACK],
    ['standing still on it drops you into the poison',
      { fire: [], water: [to(15.5), pause(3)] }, () => false, (r) => !!r.world.dead?.includes('Cool Girl fell in poison')],
    ['a block warns for the full shake time before it falls',
      { fire: [], water: [to(15.5), until('her block is gone', (w) => w.gone(5))] }, () => true,
      (r) => r.won && r.time > 0.9 && r.world.body.water.y < 13.2],
    ['single crumbling stones are quick steps up to the gems',
      { fire: [to(23.3), jump(24.5), jump(27.5), jump(29.5), to(29.6)], water: [] },
      (w) => w.body.fire.y < 6.1 && w.gems.some((g) => g.elem === 'fire' && !g.alive), (r) => r.won],
  ];
  for (const [what, route, goal, ok] of tests) {
    const r = play(CRUMBLE_ROWS, CRUMBLE_MECHS, route, { trace: verbose, goal, limit: 30 });
    if (verbose) console.log(r.trace.join('\n'));
    const pass = ok(r);
    console.log(`${pass ? 'PASS' : 'FAIL'}  crumbling stones: ${what}${pass ? '' : ` (${r.why || `ended at ${r.time.toFixed(2)} s`})`}`);
    if (!pass) failed++;
  }
  // The rules alone (no physics): a block never grows back while someone is in its space (K3).
  {
    const m = new Mechanisms([{ kind: 'crumble', x: 5, y: 5, w: 1 }]);
    const stand = { left: 5.1, right: 5.8, y: 5, vx: 0, grounded: true };
    const inside = { left: 5.1, right: 5.8, top: 4.65, y: 6 };
    m.updateCrumbles([stand], [], 0.01, 0, []);
    for (let t = 0; t < CRUMBLE_SHAKE + CRUMBLE_BACK + 2; t += 0.01) m.updateCrumbles([], [inside], 0.01, 0, []);
    const blocked = m.crumbleGone(0);
    m.updateCrumbles([], [], 0.01, 0, []);
    const ok = blocked && m.crumbles[0].t < 0 && m.solids[0].y1 === 6;
    console.log(`${ok ? 'PASS' : 'FAIL'}  crumbling stones: a block waits to grow back until its space is empty`);
    if (!ok) failed++;
  }
  // Two phones (13.1, K5): each starts the shake for its own character and tells the other, one "tick" (0.1 s) late.
  // Both must see every block fall and return within that tick of each other; and if a message is lost, the host's
  // world state must bring the guest back in step.
  {
    const defs = [{ kind: 'crumble' as const, x: 5, y: 5, w: 3 }];
    const host = new Mechanisms(defs), guest = new Mechanisms(defs);
    const on = (i: number) => ({ left: 5.15 + i, right: 5.85 + i, y: 5, vx: 0, grounded: true });
    const LAG = 0.1, DT = 0.01;
    const mail: { at: number; run: () => void }[] = [];
    const log: Record<string, number> = {};
    let now = 0, worst = 0;
    const note = (who: string, ev: MechEvent[]) => {
      for (const e of ev) if (e.k === 'crumble' && e.what !== 'shake') {
        const other = log[`${who === 'host' ? 'guest' : 'host'} ${e.i} ${e.what}`];
        if (other !== undefined) worst = Math.max(worst, now - other);
        log[`${who} ${e.i} ${e.what}`] = now;
      }
    };
    // the host steps on block 0 at 0 s, the guest on block 1 at 0.5 s; the guest's message about block 2 (1 s) is lost
    const plan: [number, 'host' | 'guest', number, boolean][] = [[0, 'host', 0, true], [0.5, 'guest', 1, true], [1, 'host', 2, false]];
    for (let step = 0; step < 900; step++) {
      now = step * DT;
      for (const [at, who, i, delivered] of plan) {
        if (Math.abs(now - at) > DT / 2) continue;
        const me = who === 'host' ? host : guest, them = who === 'host' ? guest : host;
        const ev: MechEvent[] = [];
        me.updateCrumbles([on(i)], [], 0, now * 1000, ev);
        if (delivered) mail.push({ at: now + LAG, run: () => { them.shakeCrumble(i, []); } });
      }
      const hv: MechEvent[] = [], gv: MechEvent[] = [];
      host.updateCrumbles([], [], DT, now * 1000, hv);
      guest.updateCrumbles([], [], DT, now * 1000, gv);
      if (step % 20 === 0) { const s = host.state(); mail.push({ at: now + LAG, run: () => guest.correct(s, now * 1000, gv) }); }
      for (const m of mail.splice(0)) { if (m.at <= now) m.run(); else mail.push(m); }
      note('host', hv); note('guest', gv);
    }
    const all = ['host', 'guest'].every((w) => [0, 1, 2].every((i) => log[`${w} ${i} fall`] !== undefined && log[`${w} ${i} back`] !== undefined));
    const ok = all && worst <= 0.31 && JSON.stringify(host.state().cr) === JSON.stringify(guest.state().cr);
    console.log(`${ok ? 'PASS' : 'FAIL'}  crumbling stones on two phones: ${ok ? `both see every block fall and grow back (at most ${worst.toFixed(2)} s apart, even with a lost message)` : `worst gap ${worst.toFixed(2)} s, log ${JSON.stringify(log)}`}`);
    if (!ok) failed++;
  }
}
// Timed switches (16.7, S1–S6) in their test room (?lab=timer), with the real physics.
if (!only.length || only.includes('timer')) {
  type Res = ReturnType<typeof play>;
  const run = (): Route => ({ fire: [to(7.5), to(15.5), gateShut(0)], water: [] });
  const tests: [string, () => Route, (w: World) => boolean, (r: Res) => boolean, number][] = [
    ['press, step off and run: through the gate before it shuts behind you', run, (w) => w.body.fire.x > 14.5, (r) => r.won, 0],
    [`the same run with the clock ${LAG_CUT} s shorter (room for lag)`, run, (w) => w.body.fire.x > 14.5, (r) => r.won, LAG_CUT],
    ['the gate stays open 3 s after the step-off, then shuts',
      () => ({ fire: [], water: [to(7.5), until('she stands on it', (w) => w.timer(0) === 3), pause(2), to(9.5), until('the clock ran out and the gate is shut', (w) => w.timer(0) === 0 && w.gate(0) <= 0.001)] }),
      () => true, (r) => r.won && r.world.time > 5.4 && r.world.time < 6.6, 0],
    ['standing under the gate when the time runs out crushes',
      () => ({ fire: [], water: [to(7.5), to(13.5), pause(5)] }), () => false, (r) => !!r.world.dead?.includes('crushed'), 0],
    ['a timed lift: one presses and steps off, the rider reaches the shelf, then the lift sinks again',
      () => ({
        fire: [to(20.2), platAt(0, 0), jump(22), say('he is on the lift'), platAt(0, 1), to(25.5), platAt(0, 0)],
        water: [heard('he is on the lift'), to(17.5), platAt(0, 1), to(19.2)],
      }), (w) => w.body.fire.y < 9.1 && w.body.fire.x > 24, (r) => r.won, 0],
  ];
  for (const [what, route, goal, ok, cut] of tests) {
    const r = play(TIMER_ROWS, TIMER_MECHS, route(), { trace: verbose, goal, limit: 40, cut });
    if (verbose) console.log(r.trace.join('\n'));
    const pass = ok(r);
    console.log(`${pass ? 'PASS' : 'FAIL'}  timed switches: ${what}${pass ? '' : ` (${r.why || `ended at ${r.time.toFixed(2)} s`})`}`);
    if (!pass) failed++;
  }
  // Two phones (13.1, S5): each sees the other's character 0.1 s late, so each starts the clock at a different
  // moment. The host's clock counts; the guest follows it. Both must see the rune go off within 0.2 s of each other,
  // whoever pressed.
  for (const presser of ['host', 'guest'] as const) {
    const defs = [{ kind: 'timer' as const, x: 5, y: 5, rune: 'circle' as const, secs: 3 }];
    const host = new Mechanisms(defs), guest = new Mechanisms(defs);
    const feet = [{ left: 5.15, right: 5.85, y: 6, vx: 0, grounded: true }];
    const LAG = 0.1, DT = 0.01, OFF = 1;
    const mail: { at: number; run: () => void }[] = [];
    const out: Record<string, number> = {};
    for (let step = 0; step < 700; step++) {
      const now = step * DT;
      const hv: MechEvent[] = [], gv: MechEvent[] = [];
      // the presser's own phone sees the step-off at OFF; the other phone sees it LAG later
      host.updateButtons(now < OFF + (presser === 'host' ? 0 : LAG) ? feet : [], hv);
      guest.updateButtons(now < OFF + (presser === 'guest' ? 0 : LAG) ? feet : [], gv);
      host.update(DT, () => {}, hv);
      guest.update(DT, () => {}, gv);
      if (step % 20 === 0) { const s = host.state(); mail.push({ at: now + LAG, run: () => guest.correct(s, now * 1000) }); }
      for (const m of mail.splice(0)) { if (m.at <= now) m.run(); else mail.push(m); }
      if (hv.some((e) => e.k === 'timer' && e.what === 'out')) out.host = now;
      if (gv.some((e) => e.k === 'timer' && e.what === 'out')) out.guest = now;
    }
    const gap = Math.abs(out.host - out.guest);
    const ok = gap <= 0.2 && out.host >= OFF + 3 - 0.02 && !host.powered('circle') && !guest.powered('circle');
    console.log(`${ok ? 'PASS' : 'FAIL'}  timed switches on two phones (${presser} presses): ${ok ? `both see the time run out ${gap.toFixed(2)} s apart, inside the ${LAG_CUT} s lag room` : `host ${out.host} guest ${out.guest}`}`);
    if (!ok) failed++;
  }
}
// The rising tide (16.7, V1–V6) in its test room (?lab=tide), with the real physics.
if (!only.length || only.includes('tide')) {
  type Res = ReturnType<typeof play>;
  const climb = (): Route => ({
    fire: [to(10.3), jump(11.6), to(11.5), jump(9.4), to(9.5), jump(10.7), to(14.5), until('the tide has stopped', (w) => w.tideY() <= TIDE_LAB.to)],
    water: [to(21.7), jump(20.4), to(20.5), jump(22.6), to(22.5), jump(21.3), to(17.5)],
  });
  const top = (w: World) => w.body.fire.y < 5.1 && w.body.water.y < 5.1;
  const tests: [string, () => Route, (w: World) => boolean, (r: Res) => boolean, number][] = [
    ['it waits until someone moves', () => ({ fire: [pause(3)], water: [pause(3)] }), () => true, (r) => r.won && r.world.tideY() === TIDE_LAB.from, 1],
    ['both climb ahead of it, and it stops under the top platform', climb, top, (r) => r.won && r.world.tideY() === TIDE_LAB.to, 1],
    [`the same climb with the tide ${TIDE_RUSH}× faster (room to spare)`, climb, top, (r) => r.won, TIDE_RUSH],
    ['staying at the bottom gets you caught', () => ({ fire: [to(6.5), pause(12)], water: [] }), () => false, (r) => !!r.world.dead?.includes('caught by the rising tide'), 1],
    ['wading in before it moves is deadly too', () => ({ fire: [to(13.5), pause(2)], water: [] }), () => false, (r) => !!r.world.dead?.includes('Hot Boy'), 1],
  ];
  for (const [what, route, goal, ok, rush] of tests) {
    const r = play(TIDE_ROWS, [], route(), { trace: verbose, goal, limit: 60, tide: TIDE_LAB, rush });
    if (verbose) console.log(r.trace.join('\n'));
    const pass = ok(r);
    console.log(`${pass ? 'PASS' : 'FAIL'}  rising tide: ${what}${pass ? '' : ` (${r.why || `ended at ${r.time.toFixed(2)} s, tide ${r.world.tideY().toFixed(2)}`})`}`);
    if (!pass) failed++;
  }
  // Two phones (13.1): the guest sees the first move 0.1 s late; the host's surface is the one that counts.
  {
    const host = new Mechanisms([], undefined, TIDE_LAB), guest = new Mechanisms([], undefined, TIDE_LAB);
    const LAG = 0.1, DT = 0.01;
    const mail: { at: number; run: () => void }[] = [];
    let worst = 0;
    for (let step = 0; step < 3000; step++) {
      const now = step * DT;
      if (step === 100) host.startTide([]);
      if (step === 100 + LAG / DT) guest.startTide([]);
      host.update(DT, () => {}, []);
      guest.update(DT, () => {}, []);
      if (step % 20 === 0) { const s = host.state(); mail.push({ at: now + LAG, run: () => guest.correct(s, now * 1000) }); }
      for (const m of mail.splice(0)) { if (m.at <= now) m.run(); else mail.push(m); }
      worst = Math.max(worst, Math.abs(host.tide!.y - guest.tide!.y));
    }
    const ok = worst <= 0.06 && host.tide!.y === TIDE_LAB.to && guest.tide!.y === TIDE_LAB.to;
    console.log(`${ok ? 'PASS' : 'FAIL'}  rising tide on two phones: ${ok ? `the two surfaces are never more than ${worst.toFixed(2)} tiles apart` : `up to ${worst.toFixed(2)} tiles apart`}`);
    if (!ok) failed++;
  }
}
if (failed) {
  console.log(`\n${failed} level(s) can't be won with their solution.`);
  process.exit(1);
}
console.log('\nEvery level can be won.');
