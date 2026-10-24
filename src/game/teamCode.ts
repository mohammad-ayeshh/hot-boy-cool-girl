// Team codes for password chapters (design doc 16.7, G3, G11, G12). No accounts, no server: just localStorage,
// next to the saved progress (12.4).
// - Each phone has a hidden random ID, made once and never shown.
// - Each pair of phones (friend pair) keeps its own code per password chapter: 4 animals, fully random, repeats allowed.
// - The host picks it the first time the pair plays, both phones save it, and it stays until the team finishes
//   the chapter's vault level; then the host picks a new one (G3, changed 2026-10-24).
import { ANIMALS, type Animal } from './mechanisms.ts';

const ID_KEY = 'hbcg.phoneId.v1';
const CODES_KEY = 'hbcg.teamCodes.v1';
export const CODE_LENGTH = 4;

/** [pair of phone IDs] → { chapter number → code } */
type Codes = Record<string, Record<string, Animal[]>>;

function randomInts(n: number, below: number): number[] {
  const a = new Uint32Array(n);
  crypto.getRandomValues(a);
  return [...a].map((v) => v % below);
}

/** This phone's hidden ID (made on first use). */
export function phoneId(): string {
  try {
    const old = localStorage.getItem(ID_KEY);
    if (old && /^[0-9a-z]{12}$/.test(old)) return old;
    const id = randomInts(12, 36).map((v) => v.toString(36)).join('');
    localStorage.setItem(ID_KEY, id);
    return id;
  } catch {
    return 'nostorage000';
  }
}

/** The same text on both phones, whoever is host. */
export const pairKey = (a: string, b: string): string => [a, b].sort().join('+');

/** Any 4 of the 8 animals, repeats allowed: 4,096 codes (G11). */
export function randomCode(): Animal[] {
  return randomInts(CODE_LENGTH, ANIMALS.length).map((i) => ANIMALS[i]);
}

export function isCode(c: unknown): c is Animal[] {
  return Array.isArray(c) && c.length === CODE_LENGTH && c.every((a) => (ANIMALS as readonly unknown[]).includes(a));
}

function load(): Codes {
  try {
    const c = JSON.parse(localStorage.getItem(CODES_KEY) ?? '{}');
    return c && typeof c === 'object' ? (c as Codes) : {};
  } catch {
    return {};
  }
}

/** The code this phone remembers for playing chapter `chapter` with that partner, or null. */
export function loadCode(chapter: number, partnerId: string): Animal[] | null {
  const c = load()[pairKey(phoneId(), partnerId)]?.[chapter];
  return isCode(c) ? c : null;
}

export function saveCode(chapter: number, partnerId: string, code: Animal[]): void {
  const all = load();
  const key = pairKey(phoneId(), partnerId);
  all[key] = { ...all[key], [chapter]: code };
  try {
    localStorage.setItem(CODES_KEY, JSON.stringify(all));
  } catch {
    // Storage blocked: the code only lasts this session.
  }
}
