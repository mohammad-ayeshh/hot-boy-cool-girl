// Saved progress on this phone (design doc 12). No accounts, no server: just localStorage.
import { ALL_LEVELS } from './levels';

export interface LevelResult { stars: number; bestTime: number }
export type Progress = Record<string, LevelResult>;

const KEY = 'hbcg.progress.v1';
const NAME_KEY = 'hbcg.name.v1';

export function loadProgress(): Progress {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return p && typeof p === 'object' ? (p as Progress) : {};
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

/** A level is open if it's the first one or the previous one was finished (in any chapter), on either phone (12.2, 12.3). */
export function isUnlocked(id: string, ...finished: Iterable<string>[]): boolean {
  const i = ALL_LEVELS.findIndex((l) => l.id === id);
  if (i <= 0) return i === 0;
  const prev = ALL_LEVELS[i - 1].id;
  return finished.some((set) => [...set].includes(prev));
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
