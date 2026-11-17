// A workbench for building one official level (docs/LEVEL_BUILDING.md).
//   node tools/level_lab.ts 6-2 -m        the map with a ruler and the mechanisms drawn in
//   node tools/level_lab.ts 6-2           play it with its written solution; says who died where, or the time and gems
//   node tools/level_lab.ts 6-2 -v 40     the same, with the last 40 lines of the step-by-step trace
//   node tools/level_lab.ts 6-2 -p        after a win, probe the spare room: how much faster the tide may rise, how
//                                         much every clock may lose, and how long each character may dawdle at the start
import { findLevel, withCode } from '../src/game/levels.ts';
import { pause, play, type Route } from './sim.ts';
import { ROUTES, TEST_CODE } from './routes.ts';

const args = process.argv.slice(2);
const id = args.find((a) => /^\d+-\d+$/.test(a));
const l = id ? findLevel(id) : undefined;
if (!l?.rows) { console.log('usage: node tools/level_lab.ts <level id> [-m] [-v [lines]] [-p]'); process.exit(1); }
const { mechs, pattern } = withCode(l, TEST_CODE);

if (args.includes('-m')) {
  console.log('    ' + Array.from({ length: 32 }, (_, i) => (i % 10 === 0 ? String(i / 10) : ' ')).join(''));
  console.log('    ' + Array.from({ length: 32 }, (_, i) => String(i % 10)).join(''));
  const g = l.rows.map((r) => [...r]);
  const put = (x: number, y: number, ch: string) => { if (g[y]?.[x] === '.') g[y][x] = ch; };
  for (const m of mechs) {
    if (m.kind === 'timer') put(m.x, m.y, 'T'); else if (m.kind === 'button') put(m.x, m.y, 'o'); else if (m.kind === 'lever') put(m.x, m.y, '/');
    else if (m.kind === 'stone') put(m.x, m.y, 's'); else if (m.kind === 'carving') put(m.x, m.y, '?');
    else if (m.kind === 'gate') { for (let y = m.y; y < m.y + m.h; y++) for (let x = m.x; x < m.x + m.w; x++) put(x, y, '|'); }
    else if (m.kind === 'platform') { for (let x = m.x; x < m.x + m.w; x++) put(x, m.y, '='); for (let x = m.to[0]; x < m.to[0] + m.w; x++) put(x, m.to[1], '-'); }
    else if (m.kind === 'crumble') { for (let x = m.x; x < m.x + m.w; x++) put(x, m.y, '~'); }
  }
  g.forEach((r, y) => console.log(String(y).padStart(2) + '  ' + r.join('') + (l.seen ? '   ' + l.seen[y] : '')));
  console.log('    o button  / lever  T timed switch  | gate  = lift (start)  - lift (end)  ~ crumbling  s stone  ? carving' + (l.seen ? '   right: who alone sees a cell' : ''));
  mechs.forEach((m, i) => console.log(`   [${i}] ${JSON.stringify(m)}`));
  console.log(`   ${l.apart ? "Don't touch  " : ''}${l.tide ? `tide ${JSON.stringify(l.tide)}` : ''}`);
}

const entry = ROUTES[l.id];
if (!entry) { console.log(`${l.id}: no written solution yet`); process.exit(0); }
const route = (): Route => (typeof entry === 'function' ? entry() : entry);
const timed = mechs.some((m) => m.kind === 'timer');
const go = (o: { cut?: number; rush?: number; trace?: boolean; mechs?: typeof mechs; late?: Partial<Record<'fire' | 'water', number>> } = {}) => {
  const r = route();
  const rt: Route = { fire: o.late?.fire ? [pause(o.late.fire), ...r.fire] : r.fire, water: o.late?.water ? [pause(o.late.water), ...r.water] : r.water };
  return play(l.rows!, o.mechs ?? mechs, rt, { pattern, apart: l.apart, tide: l.tide, cut: o.cut, rush: o.rush, trace: o.trace });
};
const v = args.indexOf('-v');
const r = go({ trace: v >= 0 });
if (v >= 0) console.log(r.trace.slice(-(Number(args[v + 1]) || 60)).join('\n'));
const cmds = route();
console.log(r.won ? `WON  ${l.id} ${l.name}: ${r.time.toFixed(1)} s, gems ${r.gems}, ${cmds.fire.length}+${cmds.water.length} commands` : `LOST ${l.id} ${l.name}: ${r.why} (gems ${r.gems})`);
if (r.won && typeof entry !== 'function' && (timed || l.tide)) console.log('  ! a level with timed switches or a tide needs its solution as a function: () => ({ fire: [...], water: [...] })');
if (r.won && typeof entry === 'function' && (timed || l.tide)) console.log(`  the robot's own test (clocks 0.5 s shorter, tide 1.25x): ${go({ cut: timed ? 0.5 : 0, rush: l.tide ? 1.25 : 1 }).won ? 'passes' : 'FAILS'}`);
if (r.won && args.includes('-p')) {
  if (typeof entry !== 'function') console.log('  (probing needs the solution as a function, so it can be played again and again)');
  else {
    if (l.tide) { let k = 1; while (k < 12 && go({ rush: k + 0.05, cut: timed ? 0.5 : 0 }).won) k += 0.05; console.log(`  tide ${l.tide.speed} tiles/s: the robot loses above ${k.toFixed(2)}x  (for a 1.5x limit set speed ${(l.tide.speed * k / 1.5).toFixed(2)})`); }
    if (timed) {
      let c = 0; while (c < 6 && go({ cut: c + 0.05 }).won) c += 0.05;
      console.log(`  all clocks together may lose ${c.toFixed(2)} s`);
      mechs.forEach((m, i) => {
        if (m.kind !== 'timer') return;
        let d = 0;
        while (d < m.secs - 0.05 && go({ mechs: mechs.map((x, j) => (j === i ? { ...x, secs: m.secs - d - 0.05 } : x)) }).won) d += 0.05;
        console.log(`    clock [${i}] ${m.rune} ${m.secs} s: may lose ${d.toFixed(2)} s`);
      });
    }
    for (const e of ['fire', 'water'] as const) { let d = 0; while (d < 5 && go({ late: { [e]: d + 0.1 } }).won) d += 0.1; console.log(`  ${e} may start ${d >= 5 ? '5+' : d.toFixed(1)} s late`); }
  }
}
