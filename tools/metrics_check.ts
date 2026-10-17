// Checks that the movement settings still obey the level metrics (design doc 7.7),
// by running the real physics in the Feel Lab metrics room.
// Run: npm run check:metrics   (uses the default values from src/game/settings.ts)
import { readFileSync } from 'node:fs';
import { Body, STEP, derive } from '../src/game/body.ts';
import { defaults } from '../src/game/settings.ts';
import { Level, parseLevel } from '../src/game/level.ts';

const src = readFileSync(new URL('../src/game/labLevel.ts', import.meta.url), 'utf8');
const rows = [...src.matchAll(/^\s*'([^']{32})',/gm)].map((m) => m[1]);
const level = new Level(parseLevel(rows));
const { phys, stats } = derive(defaults());

/** Run right from (x, y), press jump when `when` says so, until landing. Returns where we ended. */
function jump(x: number, y: number, when: (b: Body) => boolean, hold = true): Body {
  const b = new Body();
  b.place(x, y);
  let jumped = false;
  for (let t = 0; t < 3; t += STEP) {
    const press = !jumped && when(b);
    if (press) jumped = true;
    b.step({ dir: 1, jumpPressed: press, jumpHeld: hold && jumped }, level, phys);
    if (jumped && b.grounded && b.vy === 0 && t > 0.2) break;
  }
  return b;
}
const atEdge = (edge: number, late = 0) => (b: Body) => b.left >= edge - 0.02 + late * phys.run;

let failed = 0;
const check = (ok: boolean, text: string) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${text}`);
  if (!ok) failed++;
};

console.log(`Full jump ${stats.maxHeight} tiles, tap ${stats.minHeight}, longest gap ${stats.maxGap.toFixed(2)} (${stats.maxGapCoyote.toFixed(2)} with every helper)\n`);
check(Math.abs(jump(2, 15, (b) => b.x > 3.5).y - 13) < 0.01, '2-tile ledge can be climbed');
check(Math.abs(jump(9.4, 15, () => true).y - 12) < 0.01, '3-tile ledge can be climbed');
check(jump(27.5, 15, () => true).y > 14.9, '6-tile wall cannot be climbed');
check(stats.maxHeight + phys.ledgeNudge < 4, '4-tile ledge cannot be climbed, even with the ledge nudge');
check(Math.abs(jump(14, 9, atEdge(16)).y - 9) < 0.01, '4-tile gap can be jumped from the edge');
check(jump(21, 9, atEdge(23)).y > 9.5, '6-tile gap cannot be jumped');
check(jump(21, 9, atEdge(23, phys.coyote * 0.95)).y > 9.5, '6-tile gap cannot be jumped, even with coyote time');
check(Math.abs(jump(12.4, 15, () => false, false).x - 12.4) > 3, '2-tile tunnel can be walked through');
check(stats.minHeight >= 1 && stats.minHeight < 2, 'a tap hops over a 1-tile step but not a 2-tile ledge');

console.log(failed ? `\n${failed} check(s) failed: the movement breaks the level rules.` : '\nAll level metrics hold.');
process.exitCode = failed ? 1 : 0;
