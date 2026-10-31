// Which phones can play together (design doc 13.6). Two friends must agree on the levels, the movement physics
// and the network messages; anything else (menus, art, sounds) may differ. That matters once there is an app:
// a website update must not lock app players out until the store delivers their update.
import { CHAPTERS } from './levels.ts';
import { defaults } from './settings.ts';

/** Bump by hand whenever the messages between the two phones change (src/online/game.ts, src/net/). */
export const PROTOCOL = 1;

let cached = '';
/** "<protocol>-<fingerprint of every official level and the default physics>": the same on both phones = can play. */
export function playVersion(): string {
  if (cached) return cached;
  const text = JSON.stringify(CHAPTERS) + JSON.stringify(defaults());
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  cached = `${PROTOCOL}-${h.toString(16).padStart(8, '0')}`;
  return cached;
}
