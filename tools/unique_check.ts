// Finds official levels that look alike (design doc 16.1, D14: every level is its own room, never a copy or a mirror
// of another). For every pair of levels it compares the stone and the pools, as built and mirrored left to right, also
// slid a few tiles, and prints how much of the two rooms is the same. `npm run check:unique` fails when a pair is
// over the limit. `-- 6-2 6-6` looks only at those levels, `-- -v` lists the closest pairs, `-- --all` every level's closest other level.
import { BUILT_LEVELS } from '../src/game/levels.ts';

const LIMIT = 0.8; // share of the two rooms' stone and pools that may be the same
const args = process.argv.slice(2);
const only = args.filter((a) => !a.startsWith('-')); // level ids: look only at pairs with one of these

type Grid = string[]; // '#' stone, '~' any pool, '.' air; without the outer wall
const grid = (rows: readonly string[]): Grid =>
  rows.slice(1, -1).map((r) => r.slice(1, -1).replace(/[LWP]/g, '~').replace(/[^#~]/g, '.'));
const mirror = (g: Grid): Grid => g.map((r) => [...r].reverse().join(''));

function same(a: Grid, b: Grid, dx: number, dy: number): number {
  let both = 0, either = 0;
  for (let y = 0; y < a.length; y++) for (let x = 0; x < a[0].length; x++) {
    const p = a[y][x], q = b[y + dy]?.[x + dx] ?? '#';
    if (p === '.' && q === '.') continue;
    either++;
    if (p === q) both++;
  }
  return either ? both / either : 1;
}
function best(a: Grid, b: Grid): { s: number; how: string } {
  let out = { s: 0, how: '' };
  for (const [g, how] of [[b, 'same way round'], [mirror(b), 'mirrored']] as const)
    for (let dx = -3; dx <= 3; dx++) for (let dy = -2; dy <= 2; dy++) {
      const s = same(a, g, dx, dy);
      if (s > out.s) out = { s, how };
    }
  return out;
}

const L = BUILT_LEVELS.map((l) => ({ id: l.id, name: l.name, g: grid(l.rows!) }));
const pairs: { a: string; b: string; s: number; how: string }[] = [];
for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
  const r = best(L[i].g, L[j].g);
  pairs.push({ a: L[i].id, b: L[j].id, ...r });
}
if (only.length) for (let i = pairs.length - 1; i >= 0; i--) if (!only.includes(pairs[i].a) && !only.includes(pairs[i].b)) pairs.splice(i, 1);
pairs.sort((p, q) => q.s - p.s);
const pct = (s: number) => `${Math.round(s * 100)}%`.padStart(4);

if (args.includes('--all')) {
  for (const l of L) {
    if (only.length && !only.includes(l.id)) continue;
    const p = pairs.find((q) => q.a === l.id || q.b === l.id)!;
    const other = p.a === l.id ? p.b : p.a;
    console.log(`${l.id.padEnd(6)} ${pct(p.s)}  closest: ${other.padEnd(6)} ${p.how}`);
  }
}
const bad = pairs.filter((p) => p.s >= LIMIT);
if (args.includes('-v') || bad.length) for (const p of (args.includes('-v') ? pairs.slice(0, Math.max(bad.length, 20)) : bad))
  console.log(`${pct(p.s)}  ${p.a.padEnd(6)} ~ ${p.b.padEnd(6)} ${p.how}`);
const levels = new Set(bad.flatMap((p) => [p.a, p.b]));
console.log(bad.length ? `\n✗ ${bad.length} look-alike pairs, ${levels.size} levels involved (limit ${pct(LIMIT).trim()})` : `✓ all ${L.length} levels are their own room`);
process.exit(bad.length ? 1 : 0);
