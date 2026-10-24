// Homemade levels from the level designer (design doc 16.3).
// A level is the same 32 × 18 ASCII map + mechanism list as Chapter 1, plus a name, the maker,
// and the ✅: proof that two players finished this exact version together online.
// Pure logic (no browser APIs), so Node can run it for tools/custom_check.ts.
import { COLS, ROWS, SEEN_LEGEND } from './level.ts';
import { ANIMALS, type MechDef, type Pattern, type Rune } from './mechanisms.ts';

export interface Verified {
  /** Fingerprint of the level that was finished; any edit changes it, so the ✅ falls off. */
  hash: string;
  at: number;
  time: number;
  /** The partner's name. */
  with: string;
}

export interface CustomLevel {
  /** 'u-' + random letters; stays the same when a friend keeps a copy. */
  id: string;
  name: string;
  author: string;
  rows: string[];
  mechs: MechDef[];
  /** Different eyes (16.7): who alone sees each cell's tile or gem (legend SEEN_LEGEND). Absent = both see everything. */
  seen?: string[];
  /** Password gates (16.7, G14): the maker's fixed pattern (2–4 animals) and the rune it turns on. */
  pattern?: Pattern;
  /** ⭐⭐⭐ time: set by the first verified run (+20%). */
  targetTime: number;
  created: number;
  updated: number;
  verified?: Verified;
  /** A copy kept from a friend: can be played and shared, not edited. */
  copy?: boolean;
  /** "Make my own copy" of someone else's level keeps their name here. */
  basedOn?: string;
}

export const RUNES: Rune[] = ['circle', 'triangle', 'square', 'star'];
/** Map characters a level may use (legend: parseLevel in level.ts). */
export const LEGEND = '.#LWPhcHCrb';
export const NAME_MAX = 24;
/** A homemade pattern has 2–4 animals, repeats allowed (16.3, G14). */
export const PATTERN_MIN = 2;
export const PATTERN_MAX = 4;
/** Messages this big would break the phone-to-phone connection (PeerJS limit is ~16 KB). */
export const MAX_BYTES = 15000;
const DEFAULT_TARGET = 60;

export const isCustomId = (id: string): boolean => id.startsWith('u-');

export function newId(): string {
  let s = 'u-';
  for (let i = 0; i < 8; i++) s += 'abcdefghijkmnpqrstuvwxyz23456789'[Math.floor(Math.random() * 32)];
  return s;
}

/** An empty room: stone border, a floor, both start spots and both doors. */
export function blankLevel(name: string, author: string): CustomLevel {
  const rows: string[] = [];
  for (let y = 0; y < ROWS; y++) {
    if (y === 0 || y >= ROWS - 2) rows.push('#'.repeat(COLS));
    else rows.push('#' + '.'.repeat(COLS - 2) + '#');
  }
  const put = (x: number, y: number, ch: string) => { rows[y] = rows[y].slice(0, x) + ch + rows[y].slice(x + 1); };
  put(6, ROWS - 3, 'h');
  put(8, ROWS - 3, 'c');
  put(22, ROWS - 3, 'H');
  put(25, ROWS - 3, 'C');
  const now = Date.now();
  return { id: newId(), name, author, rows, mechs: [], targetTime: DEFAULT_TARGET, created: now, updated: now };
}

// ---------------------------------------------------------------- fingerprint
/** One mechanism as a fixed-order list, so the same level always gives the same text. A hidden one ends in 'h' or 'c'. */
function mechList(m: MechDef): (string | number)[] {
  const eye = m.seen ? [m.seen === 'fire' ? 'h' : 'c'] : [];
  if (m.kind === 'stone') return ['s', m.x, m.y, ANIMALS.indexOf(m.animal), ...eye];
  if (m.kind === 'carving') return ['k', m.x, m.y, ANIMALS.indexOf(m.animal), m.dots, ...eye];
  const r = RUNES.indexOf(m.rune);
  if (m.kind === 'button') return ['b', m.x, m.y, r, ...eye];
  if (m.kind === 'lever') return ['l', m.x, m.y, r, ...eye];
  if (m.kind === 'platform') return ['p', m.x, m.y, m.w, m.to[0], m.to[1], r, ...eye];
  return ['g', m.x, m.y, m.w, m.h, r, ...eye];
}

/** The seen map only if it hides something (levels without hidden things stay exactly as before). */
export const usedSeen = (seen: string[] | undefined): string[] | undefined => (seen?.some((r) => /[hc]/.test(r)) ? seen : undefined);

/** A pattern as a fixed-order list: the rune, then the animals (16.7, G14). */
const patternList = (p: Pattern): number[] => [RUNES.indexOf(p.rune), ...p.code.map((a) => ANIMALS.indexOf(a))];

/** A pattern from another phone: a known rune and 2–4 known animals, or null. */
function patternFrom(v: unknown): Pattern | null {
  const list = Array.isArray(v) ? v : v && typeof v === 'object' ? patternList(v as Pattern) : null;
  if (!list || list.length < 1 + PATTERN_MIN || list.length > 1 + PATTERN_MAX) return null;
  const rune = RUNES[list[0] as number];
  const code = list.slice(1).map((i) => ANIMALS[i as number]);
  return rune && code.every(Boolean) ? { code, rune } : null;
}

/**
 * FNV-1a over the map, mechanisms, hidden things and the pattern (not the name): 8 hex characters.
 * Hidden things and the pattern are only added when the level has them, so older levels keep their fingerprint.
 */
export function levelHash(l: Pick<CustomLevel, 'rows' | 'mechs' | 'seen' | 'pattern'>): string {
  const seen = usedSeen(l.seen);
  const text = l.rows.join('/') + '|' + JSON.stringify(l.mechs.map(mechList)) + (seen ? '|' + seen.join('/') : '') +
    (l.pattern ? '|p' + patternList(l.pattern).join(',') : '');
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export const isVerified = (l: CustomLevel): boolean => !!l.verified && l.verified.hash === levelHash(l);

/** After two players finish it together (16.3). Returns true the first time this version is verified. */
export function markVerified(l: CustomLevel, time: number, partner: string): boolean {
  const first = !isVerified(l);
  if (first) {
    l.verified = { hash: levelHash(l), at: Date.now(), time, with: partner };
    l.targetTime = Math.max(5, Math.ceil(time * 1.2));
  }
  return first;
}

// ---------------------------------------------------------------- safety
const isInt = (v: unknown, lo: number, hi: number): v is number => typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi;
const str = (v: unknown, max: number): string => (typeof v === 'string' ? v.slice(0, max) : '');

function mechFromList(list: unknown): MechDef | null {
  if (!Array.isArray(list)) return null;
  const last = list[list.length - 1];
  const seen = last === 'h' ? 'fire' : last === 'c' ? 'water' : undefined;
  const a = seen ? list.slice(0, -1) : list;
  const [k, x, y] = a;
  if (!isInt(x, 0, COLS - 1) || !isInt(y, 0, ROWS - 1)) return null;
  let m: MechDef | null = null;
  // Password gates (16.7): stones and carvings end in an animal, not a rune.
  const animal = ANIMALS[a[3] as number];
  if (k === 's' && a.length === 4 && animal) m = { kind: 'stone', x, y, animal };
  else if (k === 'k' && a.length === 5 && animal && isInt(a[4], 1, PATTERN_MAX)) m = { kind: 'carving', x, y, animal, dots: a[4] };
  if (m) {
    if (seen) m.seen = seen;
    return m;
  }
  const rune = RUNES[a[a.length - 1] as number];
  if (!rune) return null;
  if (k === 'b' && a.length === 4) m = { kind: 'button', x, y, rune };
  else if (k === 'l' && a.length === 4) m = { kind: 'lever', x, y, rune };
  else if (k === 'p' && a.length === 7 && isInt(a[3], 1, COLS) && isInt(a[4], 0, COLS - 1) && isInt(a[5], 0, ROWS - 1)) {
    m = { kind: 'platform', x, y, w: a[3], to: [a[4], a[5]], rune };
  } else if (k === 'g' && a.length === 6 && isInt(a[3], 1, COLS) && isInt(a[4], 1, ROWS)) m = { kind: 'gate', x, y, w: a[3], h: a[4], rune };
  if (m && seen) m.seen = seen;
  return m;
}

/** A seen map from another phone: right size and characters, or nothing. */
function seenRows(v: unknown): string[] | undefined {
  if (!Array.isArray(v) || v.length !== ROWS) return undefined;
  const rows = v.map((r) => str(r, COLS + 1));
  if (rows.some((r) => r.length !== COLS || [...r].some((ch) => !SEEN_LEGEND.includes(ch)))) return undefined;
  return usedSeen(rows);
}

/**
 * Turn anything (a saved record, a network message) into a safe CustomLevel, or null.
 * Levels from other phones are never trusted as-is.
 */
export function sanitize(o: unknown): CustomLevel | null {
  if (!o || typeof o !== 'object') return null;
  const v = o as Record<string, unknown>;
  const id = str(v.id, 20);
  if (!/^u-[a-z0-9]{4,16}$/.test(id)) return null;
  if (!Array.isArray(v.rows) || v.rows.length !== ROWS) return null;
  const rows = v.rows.map((r) => str(r, COLS + 1));
  if (rows.some((r) => r.length !== COLS || [...r].some((ch) => !LEGEND.includes(ch)))) return null;
  if (!Array.isArray(v.mechs) || v.mechs.length > 64) return null;
  const mechs: MechDef[] = [];
  for (const m of v.mechs) {
    let list: unknown = m;
    if (m && typeof m === 'object' && !Array.isArray(m)) {
      const kind = (m as { kind?: unknown }).kind;
      if (!['button', 'lever', 'platform', 'gate', 'stone', 'carving'].includes(kind as string)) return null;
      try { list = mechList(m as MechDef); } catch { return null; }
    }
    const def = mechFromList(list);
    if (!def) return null;
    mechs.push(def);
  }
  const num = (x: unknown, d: number) => (typeof x === 'number' && Number.isFinite(x) ? x : d);
  const out: CustomLevel = {
    id,
    name: str(v.name, NAME_MAX) || 'Untitled',
    author: str(v.author, 12),
    rows,
    mechs,
    targetTime: Math.max(5, Math.min(999, num(v.targetTime, DEFAULT_TARGET))),
    created: num(v.created, 0),
    updated: num(v.updated, 0),
  };
  const seen = seenRows(v.seen);
  if (seen) out.seen = seen;
  if (v.pattern !== undefined && v.pattern !== null) {
    const pattern = patternFrom(v.pattern);
    if (!pattern) return null;
    out.pattern = pattern;
  }
  const vf = v.verified as Record<string, unknown> | undefined;
  if (vf && typeof vf === 'object' && typeof vf.hash === 'string') {
    out.verified = { hash: str(vf.hash, 16), at: num(vf.at, 0), time: num(vf.time, 0), with: str(vf.with, 12) };
  }
  if (v.copy === true) out.copy = true;
  if (typeof v.basedOn === 'string' && v.basedOn) out.basedOn = str(v.basedOn, 12);
  return out;
}

// ---------------------------------------------------------------- share link (…/?level=…)
// The map is run-length packed ("#32" = 32 stones), then everything goes into JSON → base64url.
// About 1 KB for a typical level: fine for WhatsApp.

function packRows(rows: string[]): string {
  const s = rows.join('');
  let out = '';
  for (let i = 0; i < s.length;) {
    let j = i;
    while (j < s.length && s[j] === s[i]) j++;
    out += s[i] + (j - i > 1 ? String(j - i) : '');
    i = j;
  }
  return out;
}

function unpackRows(p: string, legend = LEGEND): string[] | null {
  let s = '';
  for (let i = 0; i < p.length;) {
    const ch = p[i++];
    if (!legend.includes(ch)) return null;
    let digits = '';
    while (i < p.length && p[i] >= '0' && p[i] <= '9') digits += p[i++];
    const n = digits ? Number(digits) : 1;
    if (s.length + n > COLS * ROWS) return null;
    s += ch.repeat(n);
  }
  if (s.length !== COLS * ROWS) return null;
  const rows: string[] = [];
  for (let y = 0; y < ROWS; y++) rows.push(s.slice(y * COLS, (y + 1) * COLS));
  return rows;
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): string {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

/** The text that goes after `?level=`. */
export function encodeLink(l: CustomLevel): string {
  const o: Record<string, unknown> = {
    v: 1, i: l.id, n: l.name, a: l.author, r: packRows(l.rows), m: l.mechs.map(mechList), t: l.targetTime,
  };
  const seen = usedSeen(l.seen);
  if (seen) o.s = packRows(seen);
  if (l.pattern) o.p = patternList(l.pattern);
  if (l.verified) o.f = [l.verified.hash, l.verified.at, l.verified.time, l.verified.with];
  if (l.basedOn) o.b = l.basedOn;
  return toBase64Url(JSON.stringify(o));
}

/** Read a link back; null if it's broken or tampered with in a way that doesn't make a level. */
export function decodeLink(s: string): CustomLevel | null {
  try {
    const o = JSON.parse(fromBase64Url(s.trim()));
    if (!o || o.v !== 1) return null;
    const rows = unpackRows(String(o.r ?? ''));
    if (!rows) return null;
    const seen = o.s === undefined ? undefined : unpackRows(String(o.s), SEEN_LEGEND);
    if (seen === null) return null;
    const f = Array.isArray(o.f) ? o.f : null;
    return sanitize({
      id: o.i, name: o.n, author: o.a, rows, mechs: o.m, seen, pattern: o.p, targetTime: o.t, created: Date.now(), updated: Date.now(),
      verified: f ? { hash: f[0], at: f[1], time: f[2], with: f[3] } : undefined,
      copy: true, basedOn: o.b,
    });
  } catch {
    return null;
  }
}
