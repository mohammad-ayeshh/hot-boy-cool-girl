// Saved progress on this phone (design doc 12). No accounts, no server: just localStorage.
import { BUILT_LEVELS } from './levels.ts';

export interface LevelResult { stars: number; bestTime: number }
export type Progress = Record<string, LevelResult>;

const KEY = 'hbcg.progress.v1';
/**
 * Levels that got a new id (16.7, H3): the vaults became their chapter's level 10 on 2026-11-12, so a result saved
 * for the old id moves with them. Done once per phone (MOVED_KEY), because 6-5, 7-5 and 9-5 are new levels now.
 */
const MOVES: [string, string][] = [['6-5', '6-10'], ['7-5', '7-10'], ['9-5', '9-10']];
const MOVED_KEY = 'hbcg.progress.moved.v1';
const NAME_KEY = 'hbcg.name.v1';

export function loadProgress(): Progress {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    const p = raw && typeof raw === 'object' ? (raw as Progress) : {};
    if (localStorage.getItem(MOVED_KEY) !== '1') {
      for (const [from, to] of MOVES) {
        if (!p[from]) continue;
        if (!p[to]) p[to] = p[from];
        delete p[from];
      }
      localStorage.setItem(KEY, JSON.stringify(p));
      localStorage.setItem(MOVED_KEY, '1');
    }
    return p;
  } catch {
    return {};
  }
}

/** Keep the best result; stars are never lost (12.1). */
export function recordResult(id: string, stars: number, time: number): Progress {
  const p = loadProgress();
  const old = p[id];
  p[id] = { stars: Math.max(stars, old?.stars ?? 0), bestTime: Math.min(time, old?.bestTime ?? Infinity) };
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // Storage blocked: progress only lasts this session.
  }
  return p;
}

/**
 * A level is open if it's the first one, or the one before it was finished, on either phone (12.2, 12.3). It also
 * stays open if it, or any later level, was already finished (16.7, H3): levels added in the middle of the game
 * never lock a player out of what they could already play. Levels that are planned but not built are skipped.
 */
export function isUnlocked(id: string, ...finished: Iterable<string>[]): boolean {
  const i = BUILT_LEVELS.findIndex((l) => l.id === id);
  if (i <= 0) return i === 0;
  const done = new Set(finished.flatMap((set) => [...set]));
  return BUILT_LEVELS.slice(i - 1).some((l) => done.has(l.id));
}

export function starsFor(allGems: boolean, time: number, target: number): number {
  return 1 + (allGems ? 1 : 0) + (allGems && time <= target ? 1 : 0);
}

export function loadName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveName(name: string): void {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    // ignore
  }
}
