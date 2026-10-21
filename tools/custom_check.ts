// Checks for homemade levels (design doc 16.3): share links survive the round trip, the fingerprint
// notices a one-tile edit, broken links are refused, and all our own levels pass the level checker.
// Run: npm run check:custom
import { ALL_LEVELS } from '../src/game/levels.ts';
import { blankLevel, decodeLink, encodeLink, isVerified, levelHash, markVerified, sanitize, type CustomLevel } from '../src/game/custom.ts';
import { checkLevel, hasErrors } from '../src/game/levelCheck.ts';

let failed = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
  if (!ok) failed++;
};

const asCustom = (i: number): CustomLevel => {
  const d = ALL_LEVELS[i];
  return { ...blankLevel(d.name, 'test'), rows: [...d.rows!], mechs: d.mechs ?? [] };
};

// Every official level passes (warnings are fine, errors are not).
ALL_LEVELS.forEach((_, i) => {
  const issues = checkLevel(asCustom(i));
  const errs = issues.filter((x) => x.error).map((x) => x.msg);
  check(`level ${ALL_LEVELS[i].id} has no errors`, !hasErrors(issues), errs.join('; ') || `${issues.length} warnings`);
});
check('a blank level has no errors', !hasErrors(checkLevel(blankLevel('Blank', 'me'))));

// Share link round trip.
const lvl = asCustom(4);
lvl.name = 'Crossing — ✨ test';
markVerified(lvl, 40.3, 'Sara');
const link = encodeLink(lvl);
const back = decodeLink(link);
check('link decodes', !!back);
check('link keeps the map, mechanisms and name', !!back && back.rows.join() === lvl.rows.join() &&
  JSON.stringify(back.mechs) === JSON.stringify(lvl.mechs) && back.name === lvl.name, `${link.length} characters`);
check('link keeps the ✅', !!back && isVerified(back));
check('link is short enough for a chat message', link.length < 2000, `${link.length}`);

// Fingerprint and ✅.
const edited = { ...lvl, rows: [...lvl.rows] };
edited.rows[5] = edited.rows[5].slice(0, 3) + '#' + edited.rows[5].slice(4);
check('one changed tile changes the fingerprint', levelHash(edited) !== levelHash(lvl));
check('editing removes the ✅', !isVerified(edited));
check('star time is set by the verified run', lvl.targetTime === Math.ceil(40.3 * 1.2), String(lvl.targetTime));

// Broken or hostile input never makes a level.
check('garbage link is refused', decodeLink('not-a-level!!') === null);
check('cut-off link is refused', decodeLink(link.slice(0, link.length / 2)) === null);
check('bad map characters are refused', sanitize({ ...lvl, rows: lvl.rows.map((r) => r.replace('#', 'X')) }) === null);
check('bad mechanism is refused', sanitize({ ...lvl, mechs: [{ kind: 'bomb', x: 1, y: 1, rune: 'circle' }] }) === null);
check('mechanism outside the grid is refused', sanitize({ ...lvl, mechs: [{ kind: 'button', x: 99, y: 1, rune: 'circle' }] }) === null);

// The checker finds problems.
const broken = blankLevel('Broken', 'me');
broken.rows[15] = broken.rows[15].replace('H', '.');
check('missing door is an error', checkLevel(broken).some((x) => x.error && /door/.test(x.msg)));
const gap = blankLevel('Gap', 'me');
gap.rows[16] = '#' + '#'.repeat(10) + '.....' + '#'.repeat(15) + '#';
check('5-tile gap is a warning', checkLevel(gap).some((x) => !x.error && /5-tile gap/.test(x.msg)));
const ledge = blankLevel('Ledge', 'me');
for (let y = 11; y <= 15; y++) ledge.rows[y] = ledge.rows[y].slice(0, 14) + '#' + ledge.rows[y].slice(15);
for (let y = 12; y <= 15; y++) ledge.rows[y] = ledge.rows[y].slice(0, 15) + '#' + ledge.rows[y].slice(16);
check('4-tile ledge is a warning', checkLevel(ledge).some((x) => !x.error && /4-tile ledge/.test(x.msg)));

process.exitCode = failed ? 1 : 0;
console.log(failed ? `\n${failed} check(s) failed` : '\nAll checks passed');
