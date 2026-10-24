// Built-in checks for homemade levels (design doc 16.3), so they follow the same rules as ours:
// level metrics (7.7), thumb zones (5.3) and the level design rules (16.1).
// Errors block playing; warnings are allowed. Whether a level can be beaten is never checked here:
// that is what finishing it together (the ✅) proves.
import { COLS, ROWS } from './level.ts';
import { MAX_BYTES, type CustomLevel } from './custom.ts';
import type { MechDef } from './mechanisms';

export interface Issue {
  error: boolean;
  msg: string;
  /** Tile to highlight in the editor. */
  x?: number;
  y?: number;
}

const THUMB = 4; // bottom-left and bottom-right 4 × 4 tiles (5.3)
const inThumbCorner = (x: number, y: number) => y >= ROWS - THUMB && (x < THUMB || x >= COLS - THUMB);
const NICE: Record<string, string> = { h: 'Hot Boy start', c: 'Cool Girl start', H: 'Hot Boy door', C: 'Cool Girl door' };

export function checkLevel(l: Pick<CustomLevel, 'rows' | 'mechs' | 'seen'>): Issue[] {
  const out: Issue[] = [];
  const err = (msg: string, x?: number, y?: number) => out.push({ error: true, msg, x, y });
  const warn = (msg: string, x?: number, y?: number) => out.push({ error: false, msg, x, y });
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= COLS || y >= ROWS ? '#' : l.rows[y][x]);
  const stone = (x: number, y: number) => at(x, y) === '#';
  const liquid = (x: number, y: number) => 'LWP'.includes(at(x, y));
  /** Gates and platforms also block, so a start or button can stand on a closed gate. */
  const solidMech = (x: number, y: number) => l.mechs.some((m) =>
    (m.kind === 'gate' && x >= m.x && x < m.x + m.w && y >= m.y && y < m.y + m.h) ||
    (m.kind === 'platform' && x >= m.x && x < m.x + m.w && y === m.y));

  // Start spots and doors: exactly one each, standing on something, with room above.
  for (const ch of 'hcHC') {
    const spots: [number, number][] = [];
    l.rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === ch) spots.push([x, y]); }));
    if (spots.length === 0) { err(`Place the ${NICE[ch]}.`); continue; }
    if (spots.length > 1) err(`There are ${spots.length} × ${NICE[ch]}: keep only one.`, spots[1][0], spots[1][1]);
    const [x, y] = spots[0];
    if (liquid(x, y + 1)) err(`The ${NICE[ch]} stands in liquid.`, x, y);
    else if (!stone(x, y + 1) && !solidMech(x, y + 1)) err(`The ${NICE[ch]} is floating: put stone under it.`, x, y);
    if (stone(x, y - 1)) err(`The ${NICE[ch]} has no room above it.`, x, y);
    if (inThumbCorner(x, y)) warn(`The ${NICE[ch]} is under a thumb (bottom corners).`, x, y);
  }

  // Mechanisms.
  const powers = new Set(l.mechs.filter((m) => m.kind === 'button' || m.kind === 'lever').map((m) => m.rune));
  const moved = new Set(l.mechs.filter((m) => m.kind === 'platform' || m.kind === 'gate').map((m) => m.rune));
  const name = (m: MechDef) => ({ button: 'button', lever: 'lever', platform: 'moving platform', gate: 'gate' })[m.kind];
  for (const m of l.mechs) {
    if (m.kind === 'button' || m.kind === 'lever') {
      if (stone(m.x, m.y)) err(`A ${name(m)} is inside stone.`, m.x, m.y);
      else if (!stone(m.x, m.y + 1) && !solidMech(m.x, m.y + 1)) err(`A ${name(m)} is floating: put stone under it.`, m.x, m.y);
      if (!moved.has(m.rune)) warn(`A ${name(m)} (${m.rune}) controls nothing: give a platform or gate the same rune.`, m.x, m.y);
    } else {
      if (!powers.has(m.rune)) err(`A ${name(m)} (${m.rune}) has no button or lever with its rune.`, m.x, m.y);
      const w = m.w, h = m.kind === 'gate' ? m.h : 1;
      const ends: [number, number][] = m.kind === 'platform' ? [[m.x, m.y], m.to] : [[m.x, m.y]];
      for (const [ex, ey] of ends) {
        if (ex < 0 || ey < 0 || ex + w > COLS || ey + h > ROWS) err(`A ${name(m)} goes outside the level.`, m.x, m.y);
        else {
          let hits = false;
          for (let yy = ey; yy < ey + h; yy++) for (let xx = ex; xx < ex + w; xx++) if (stone(xx, yy)) hits = true;
          if (hits) warn(`A ${name(m)} overlaps stone and may get stuck.`, ex, ey);
        }
      }
    }
    if (inThumbCorner(m.x, m.y)) warn(`A ${name(m)} is under a thumb (bottom corners).`, m.x, m.y);
  }

  // Gems and hazards.
  let gems = 0;
  l.rows.forEach((r, y) => [...r].forEach((c, x) => {
    if (c === 'r' || c === 'b') {
      gems++;
      if (inThumbCorner(x, y)) warn('A gem is under a thumb (bottom corners).', x, y);
    }
    if ('LWP'.includes(c) && inThumbCorner(x, y)) warn('A pool is under a thumb (bottom corners).', x, y);
  }));
  if (!gems) warn('No gems yet: gems show the way and tempt (D8).');

  // "Almost" jumps (7.7): every jump must be clearly possible or clearly impossible.
  const seen = new Set<string>();
  const once = (key: string, f: () => void) => { if (!seen.has(key)) { seen.add(key); f(); } };
  const floor = (x: number, y: number) => stone(x, y) && !stone(x, y - 1) && !stone(x, y - 2); // you can stand on (x, y)
  for (let y = 1; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (!floor(x, y)) continue;
      // A wall exactly 4 tiles taller than this floor, right next to it.
      for (const nx of [x - 1, x + 1]) {
        if (!stone(nx, y - 1)) continue;
        let top = y - 1;
        while (top > 0 && stone(nx, top - 1)) top--;
        if (y - top === 4 && floor(nx, top)) once(`l${nx},${top}`, () => warn('A 4-tile ledge: just too high to climb. Make it 3 (climbable) or 5+ (clearly not).', nx, top));
      }
      // A gap exactly 5 tiles wide to a floor at the same height.
      if (x + 6 < COLS && !stone(x + 1, y) && floor(x + 6, y)) {
        let open = true;
        for (let gx = x + 1; gx <= x + 5; gx++) if (stone(gx, y) || stone(gx, y - 1) || stone(gx, y - 2)) open = false;
        if (open) once(`g${x},${y}`, () => warn('A 5-tile gap: just too wide to jump. Make it 4 (jumpable) or 6+ (clearly not).', x + 3, y));
      }
    }
  }

  // Different eyes (16.7, E3): a hidden pool that can kill the player who can't see it needs 2 tiles of flat floor
  // before it, so the partner has time to shout "stop!" (never right after a landing or mid-jump).
  const BLIND_DEADLY: Record<string, string> = { h: 'LP', c: 'WP' }; // h = only Hot Boy sees it, so it can kill her
  const wall = (x: number, y: number) => stone(x, y) && stone(x, y - 1);
  l.seen?.forEach((r, y) => {
    for (let x = 0; x < COLS; x++) {
      const eye = r[x], liq = at(x, y);
      if (!BLIND_DEADLY[eye]?.includes(liq) || (r[x - 1] === eye && at(x - 1, y) === liq)) continue;
      let x1 = x;
      while (r[x1 + 1] === eye && at(x1 + 1, y) === liq) x1++;
      for (const [near, far] of [[x - 1, x - 2], [x1 + 1, x1 + 2]]) {
        if (!wall(near, y) && !(floor(near, y) && floor(far, y))) once(`w${x},${y}`, () => warn('A hidden pool needs 2 tiles of floor before it, so your partner has time to warn you.', x, y));
      }
    }
  });

  if (JSON.stringify(l).length > MAX_BYTES) err('This level is too big to send to your friend.');
  return out;
}

export const hasErrors = (issues: Issue[]): boolean => issues.some((i) => i.error);
