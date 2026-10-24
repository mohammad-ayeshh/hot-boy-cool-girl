// Checks for homemade levels (design doc 16.3): share links survive the round trip, the fingerprint
// notices a one-tile edit, broken links are refused, and all our own levels pass the level checker.
// Run: npm run check:custom
import { ALL_LEVELS, withCode, type LevelDef } from '../src/game/levels.ts';
import { blankLevel, decodeLink, encodeLink, isVerified, levelHash, markVerified, sanitize, type CustomLevel } from '../src/game/custom.ts';
import { checkLevel, hasErrors } from '../src/game/levelCheck.ts';
import { isCode, loadCode, pairKey, phoneId, randomCode, saveCode } from '../src/game/teamCode.ts';

let failed = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`);
  if (!ok) failed++;
};

const asCustom = (i: number): CustomLevel => {
  const d = ALL_LEVELS[i];
  return { ...blankLevel(d.name, 'test'), rows: [...d.rows!], mechs: d.mechs ?? [], seen: d.seen ? [...d.seen] : undefined, pattern: d.pattern };
};

// Every official level passes (warnings are fine, errors are not).
ALL_LEVELS.forEach((_, i) => {
  const issues = checkLevel(asCustom(i));
  const errs = issues.filter((x) => x.error).map((x) => x.msg);
  check(`level ${ALL_LEVELS[i].id} has no errors`, !hasErrors(issues), errs.join('; ') || `${issues.length} warnings`);
  const noWarnSpace = issues.filter((x) => /hidden pool/.test(x.msg));
  if (noWarnSpace.length) check(`level ${ALL_LEVELS[i].id} leaves room to warn before hidden pools`, false, noWarnSpace.map((x) => `${x.x},${x.y}`).join(' '));
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

// Different eyes (16.7): hidden things survive the link and count in the fingerprint.
const eyes = asCustom(ALL_LEVELS.findIndex((l) => l.id === '5-2'));
eyes.seen = asCustom(ALL_LEVELS.findIndex((l) => l.id === '5-1')).seen;
const eyesBack = decodeLink(encodeLink(eyes));
check('link keeps who sees what', !!eyesBack && eyesBack.seen?.join() === eyes.seen?.join() &&
  JSON.stringify(eyesBack.mechs) === JSON.stringify(eyes.mechs) && eyesBack.mechs.some((m) => m.seen === 'water'));
const plain = asCustom(4);
check('a level without hidden things keeps its old fingerprint', levelHash(plain) === levelHash({ ...plain, seen: undefined }) &&
  levelHash(plain) === levelHash({ ...plain, seen: plain.rows.map((r) => '.'.repeat(r.length)) }));
const hidden = { ...eyes, seen: [...eyes.seen!] };
hidden.seen[3] = 'h' + hidden.seen[3].slice(1);
check('hiding one tile changes the fingerprint', levelHash(hidden) !== levelHash(eyes));
check('hiding a mechanism changes the fingerprint', levelHash({ ...eyes, mechs: eyes.mechs.map((m) => ({ ...m, seen: undefined })) }) !== levelHash(eyes));
check('bad seen map is dropped', sanitize({ ...eyes, seen: eyes.seen!.map((r) => r.replace('.', 'X')) })?.seen === undefined);
const trap = blankLevel('Trap', 'me');
trap.rows[15] = '#' + '.'.repeat(12) + '#' + '.'.repeat(17) + '#';
trap.rows[16] = '#'.repeat(10) + 'WW' + '#'.repeat(20);
trap.seen = trap.rows.map((r) => '.'.repeat(r.length));
trap.seen[16] = '.'.repeat(10) + 'cc' + '.'.repeat(20);
check('hidden pool right after a step is a warning', checkLevel(trap).some((x) => !x.error && /hidden pool/.test(x.msg)));

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

// Password gates in homemade levels (16.3, G14).
// Fingerprints of levels without password things must never change (their ✅ would fall off): these are frozen.
check('old fingerprints stay the same (1-3)', levelHash(asCustom(2)) === '667ad3e4', levelHash(asCustom(2)));
check('old fingerprints stay the same (5-5, hidden things)', levelHash(asCustom(24)) === 'f0f0580b', levelHash(asCustom(24)));
const vaultIdx = ALL_LEVELS.findIndex((l) => l.id === '6-5');
const pw: CustomLevel = { ...asCustom(vaultIdx), pattern: { code: ['frog', 'bat', 'frog'], rune: 'star' } };
pw.mechs = [...pw.mechs, { kind: 'carving', x: 2, y: 3, animal: 'frog', dots: 1 }, { kind: 'carving', x: 5, y: 3, animal: 'bat', dots: 2, seen: 'water' }];
pw.mechs[6] = { ...pw.mechs[6], seen: 'fire' }; // a stone only Hot Boy sees
const pwBack = decodeLink(encodeLink(pw));
check('stones, carvings and the pattern survive a share link', !!pwBack && JSON.stringify(pwBack.mechs) === JSON.stringify(pw.mechs) && JSON.stringify(pwBack.pattern) === JSON.stringify(pw.pattern));
check('a share link keeps the fingerprint of a password level', !!pwBack && levelHash(pwBack) === levelHash(pw));
check('a level with password things survives sanitize (room transfer)', JSON.stringify(sanitize(JSON.parse(JSON.stringify(pw)))?.pattern) === JSON.stringify(pw.pattern));
check('changing the pattern changes the fingerprint', levelHash({ ...pw, pattern: { code: ['frog', 'bat', 'bat'], rune: 'star' } }) !== levelHash(pw));
check('changing the pattern rune changes the fingerprint', levelHash({ ...pw, pattern: { code: ['frog', 'bat', 'frog'], rune: 'circle' } }) !== levelHash(pw));
check('changing a stone animal changes the fingerprint', levelHash({ ...pw, mechs: pw.mechs.map((m, i) => (i === 6 && m.kind === 'stone' ? { ...m, animal: 'fish' } : m)) }) !== levelHash(pw));
check('removing the pattern changes the fingerprint', levelHash({ ...pw, pattern: undefined }) !== levelHash(pw));
check('a pattern with an unknown animal is refused', sanitize({ ...pw, pattern: [3, 2, 99] }) === null);
check('a 1-animal or 5-animal pattern is refused', sanitize({ ...pw, pattern: [3, 2] }) === null && sanitize({ ...pw, pattern: [3, 1, 1, 1, 1, 1] }) === null);
check('a stone with an unknown animal is refused', sanitize({ ...pw, mechs: [['s', 3, 12, 8]] }) === null);
const has = (l: CustomLevel, error: boolean, re: RegExp) => checkLevel(l).some((x) => x.error === error && re.test(x.msg));
check('the vault with its pattern has no errors', !hasErrors(checkLevel(pw)), checkLevel(pw).filter((x) => x.error).map((x) => x.msg).join('; '));
check('stones without a pattern is an error', has({ ...pw, pattern: undefined }, true, /no pattern/));
check('a pattern animal with no stone is an error', has({ ...pw, mechs: pw.mechs.filter((m) => !(m.kind === 'stone' && m.animal === 'bat')) }, true, /no bat stone/));
check('a pattern animal with no carving is a warning', has({ ...pw, pattern: { code: ['frog', 'snake'], rune: 'star' } }, false, /No carving shows the snake/));
check('a carving with the wrong dots is a warning', has({ ...pw, pattern: { code: ['bat', 'frog'], rune: 'star' } }, false, /animal 1 of the pattern/));
check('a carving past the end of the pattern is a warning', has({ ...pw, pattern: { code: ['frog', 'snake'], rune: 'star' }, mechs: [...pw.mechs, { kind: 'carving', x: 8, y: 3, animal: 'bat', dots: 4 }] }, false, /4 dots/));
const walkway = { ...pw, mechs: [...pw.mechs, { kind: 'stone' as const, x: 22, y: 15, animal: 'frog' as const }] };
check('a stone on a walkway is a warning', has(walkway, false, /would press it/));
check('stones on their own shelves are not', !has(pw, false, /would press it/));

// Team codes (16.7, G3, G11, G12). Each "phone" gets its own pretend storage.
const phone = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
};
const use = (s: ReturnType<typeof phone>) => Object.defineProperty(globalThis, 'localStorage', { value: s, configurable: true });
const [a, b, c] = [phone(), phone(), phone()];
use(a); const idA = phoneId();
check('a phone keeps the same hidden ID', phoneId() === idA && /^[0-9a-z]{12}$/.test(idA));
use(b); const idB = phoneId();
use(c); const idC = phoneId();
check('different phones get different IDs', new Set([idA, idB, idC]).size === 3);
const codes = Array.from({ length: 2000 }, randomCode);
check('random codes are 4 of the 8 animals', codes.every(isCode));
check('random codes use every animal and allow repeats', new Set(codes.flat()).size === 8 && codes.some((k) => new Set(k).size < 4));
check('the pair key is the same on both phones', pairKey(idA, idB) === pairKey(idB, idA));
const ab = randomCode(), ac = randomCode();
use(a); saveCode(6, idB, ab); saveCode(6, idC, ac);
use(b); saveCode(6, idA, ab);
use(a); check('a phone keeps a separate code per friend', JSON.stringify(loadCode(6, idB)) === JSON.stringify(ab) && JSON.stringify(loadCode(6, idC)) === JSON.stringify(ac));
use(b); check('both phones of a pair find the same code', JSON.stringify(loadCode(6, idA)) === JSON.stringify(ab));
check('a pair that never played has no code yet', loadCode(6, idC) === null);
use(a); const next = randomCode(); saveCode(6, idB, next);
check('a new code replaces the old one for that pair only', JSON.stringify(loadCode(6, idB)) === JSON.stringify(next) && JSON.stringify(loadCode(6, idC)) === JSON.stringify(ac));
const coded: LevelDef = { ...ALL_LEVELS[0], teamCode: 6, pattern: { code: ['snake', 'snake'], rune: 'star' },
  mechs: [{ kind: 'carving', x: 5, y: 5, animal: 'snake', dots: 3 }, { kind: 'stone', x: 8, y: 11, animal: 'fish' }] };
const filled = withCode(coded, ['frog', 'bat', 'turtle', 'monkey']);
check('a carving shows the code animal for its dots', filled.mechs[0].kind === 'carving' && filled.mechs[0].animal === 'turtle' && filled.mechs[1].kind === 'stone' && filled.mechs[1].animal === 'fish');
check('the vault pattern becomes the team code', filled.pattern?.code.join() === 'frog,bat,turtle,monkey' && filled.pattern.rune === 'star');
check('levels without a team code ignore it', withCode(ALL_LEVELS[3], ['frog', 'bat', 'turtle', 'monkey']).mechs === (ALL_LEVELS[3].mechs ?? withCode(ALL_LEVELS[3]).mechs));
check('a broken code is refused', !isCode(['frog', 'dog', 'bat', 'bat']) && !isCode(['frog', 'bat']));

process.exitCode = failed ? 1 : 0;
console.log(failed ? `\n${failed} check(s) failed` : '\nAll checks passed');
