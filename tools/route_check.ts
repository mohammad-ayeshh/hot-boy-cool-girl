// Can every level be won? Plays each level with its written solution (tools/routes.ts)
// using the real physics and mechanisms (tools/sim.ts).
// Run: npm run check:routes            (all levels)
//      npm run check:routes -- 2-3 -v  (one level, with a step-by-step trace)
import { ALL_LEVELS, findLevel, withCode } from '../src/game/levels.ts';
import { VAULT_MECHS, VAULT_PATTERN, VAULT_ROWS } from '../src/game/labLevel.ts';
import { ANIMALS, Mechanisms, type Animal, type MechEvent, type MechSync } from '../src/game/mechanisms.ts';
import { play, type World } from './sim.ts';
import { ROUTES, TEST_CODE, VAULT_ROUTE, vaultRoute } from './routes.ts';

const args = process.argv.slice(2);
const only = args.filter((a) => !a.startsWith('-'));
const verbose = args.includes('-v');
let failed = 0;
for (const l of ALL_LEVELS) {
  if (only.length && !only.includes(l.id)) continue;
  const route = ROUTES[l.id];
  if (!l.rows) continue;
  if (!route) { console.log(`FAIL  ${l.id} ${l.name}: no written solution in tools/routes.ts`); failed++; continue; }
  const { mechs, pattern } = withCode(l, TEST_CODE); // password levels play with a fixed test code (16.7 build notes)
  const r = play(l.rows, mechs, route, { trace: verbose, pattern });
  if (verbose) console.log(r.trace.join('\n'));
  // Password levels (16.7): every carving is on the path (G9), and the vault takes exactly the code, no wrong steps.
  const w = r.world;
  if (r.won && w.mech.carvings.length > w.carvingsSeen.size) { r.won = false; r.why = `the route never lights ${w.mech.carvings.length - w.carvingsSeen.size} carving(s)`; }
  if (r.won && pattern && (w.stoneLog.join() !== pattern.code.join() || !w.solved())) { r.won = false; r.why = `stones stepped: ${w.stoneLog.join(', ')} (code ${pattern.code.join(', ')})`; }
  const note = r.won ? `won in ${r.time.toFixed(1)} s, gems ${r.gems} (⭐⭐⭐ under ${l.targetTime} s)` : r.why;
  console.log(`${r.won ? 'PASS' : 'FAIL'}  ${l.id} ${l.name}: ${note}`);
  if (!r.won) failed++;
}
// Level 6-5 with many codes, not just the test one: the vault must work for whatever code a team gets (G11),
// including every animal on one side (one player does all the stepping) and the same animal four times.
const vault = findLevel('6-5');
if (vault?.rows && (!only.length || only.includes('6-5'))) {
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
    const r = play(vault.rows, mechs, vaultRoute(code), { pattern });
    if (!r.won || r.world.stoneLog.join() !== code.join()) bad.push(`${code.join(' ')}: ${r.why || r.world.stoneLog.join(',')}`);
  }
  console.log(`${bad.length ? 'FAIL' : 'PASS'}  6-5 with ${codes.length} different codes${bad.length ? `: ${bad.slice(0, 3).join(' | ')}` : ' (one side only, repeats, 40 random)'}`);
  if (bad.length) failed++;
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
if (failed) {
  console.log(`\n${failed} level(s) can't be won with their solution.`);
  process.exit(1);
}
console.log('\nEvery level can be won.');
