// The player's own sound and vibration choices (design doc 15.6), saved on the phone.
// Separate from the Feel Lab settings: the online game plays with the default game feel,
// and only these few choices are the player's to change (from the pause menu).
import type { Settings } from './settings.ts';

const KEY = 'hbcg.prefs.v1';
export const PREF_KEYS = ['sound', 'volume', 'music', 'musicVolume', 'haptics'] as const;
export type PrefKey = (typeof PREF_KEYS)[number];

/** Copy the saved choices into the game's settings (anything missing keeps its default). */
export function loadPrefs(into: Settings): void {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, unknown>;
    const out = into as unknown as Record<string, unknown>;
    for (const k of PREF_KEYS) if (typeof saved[k] === typeof out[k]) out[k] = saved[k];
  } catch {
    // Storage blocked or corrupted: defaults.
  }
}

export function savePrefs(from: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(PREF_KEYS.map((k) => [k, from[k]]))));
  } catch {
    // Private mode: the choices last this session.
  }
}
