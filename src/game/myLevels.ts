// "My levels": homemade levels saved on this phone (design doc 16.3). No server, just localStorage.
// Levels a friend sends in the room live only in memory until you tap "Keep a copy".
import { sanitize, type CustomLevel } from './custom.ts';

const KEY = 'hbcg.mylevels.v1';

function load(): CustomLevel[] {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(list) ? list.map(sanitize).filter((l): l is CustomLevel => !!l) : [];
  } catch {
    return [];
  }
}

function store(list: CustomLevel[]): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false; // storage blocked or full
  }
}

/** Newest first. */
export const listLevels = (): CustomLevel[] => load().sort((a, b) => b.updated - a.updated);
export const getMyLevel = (id: string): CustomLevel | undefined => load().find((l) => l.id === id);

/** Add or replace (same id). Returns false if the phone refused to save. */
export function saveLevel(l: CustomLevel): boolean {
  const list = load().filter((x) => x.id !== l.id);
  list.push(l);
  return store(list);
}

export function deleteLevel(id: string): void {
  store(load().filter((l) => l.id !== id));
}

// ---------------------------------------------------------------- levels shared in the room
/** The latest version of each homemade level either player picked in this room (memory only). */
const room = new Map<string, CustomLevel>();
export const rememberRoomLevel = (l: CustomLevel): void => { room.set(l.id, l); };
export const roomLevel = (id: string): CustomLevel | undefined => room.get(id);
export const roomLevels = (): CustomLevel[] => [...room.values()];
export const forgetRoomLevels = (): void => room.clear();
