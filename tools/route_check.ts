// Can every level be won? Plays each level with its written solution (tools/routes.ts)
// using the real physics and mechanisms (tools/sim.ts).
// Run: npm run check:routes            (all levels)
//      npm run check:routes -- 2-3 -v  (one level, with a step-by-step trace)
import { ALL_LEVELS } from '../src/game/levels.ts';
import { play } from './sim.ts';
import { ROUTES } from './routes.ts';

const args = process.argv.slice(2);
const only = args.filter((a) => !a.startsWith('-'));
const verbose = args.includes('-v');
let failed = 0;
for (const l of ALL_LEVELS) {
  if (only.length && !only.includes(l.id)) continue;
  const route = ROUTES[l.id];
  if (!l.rows) continue;
  if (!route) { console.log(`FAIL  ${l.id} ${l.name}: no written solution in tools/routes.ts`); failed++; continue; }
  const r = play(l.rows, l.mechs ?? [], route, { trace: verbose });
  if (verbose) console.log(r.trace.join('\n'));
  const note = r.won ? `won in ${r.time.toFixed(1)} s, gems ${r.gems} (⭐⭐⭐ under ${l.targetTime} s)` : r.why;
  console.log(`${r.won ? 'PASS' : 'FAIL'}  ${l.id} ${l.name}: ${note}`);
  if (!r.won) failed++;
}
if (failed) {
  console.log(`\n${failed} level(s) can't be won with their solution.`);
  process.exit(1);
}
console.log('\nEvery level can be won.');
