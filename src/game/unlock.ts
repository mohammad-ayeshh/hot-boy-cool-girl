// Free to try, pay once (design doc 12.6, decided 2026-10-31): Chapters 1–2 are free for everyone;
// one purchase ($2.99, in the store app) unlocks every chapter, forever. The level designer is free.
// Friend's pass: if either player in a room owns the game, the room plays everything, so only one of two friends pays.
// There is no server (L2), so ownership is a flag saved on the phone; like the rest of the game, no anti-cheat (13.6).
import { chapterOf } from './levels.ts';

/** Chapters 1..FREE_CHAPTERS are free. */
export const FREE_CHAPTERS = 2;
/** The one product in Google Play Console / App Store Connect. */
export const PRODUCT_ID = 'full_game';
export const PRICE_TEXT = '$2.99'; // shown until the store tells us the local price
export const APP_ID = 'io.github.mohammadayeshh.hotboycoolgirl'; // the store link is in links.ts

/**
 * The lock is off until the app is in the store: switching it on earlier would take Chapter 3 and up away from
 * website players with no way to buy. Turn it on at launch (and `?paywall` previews it in a browser).
 */
export const PAYWALL_LIVE = false;
// read once at start: creating a room rewrites the address to ?room=…, which would drop the preview flag
const PREVIEW = (() => {
  try {
    return typeof location !== 'undefined' && new URLSearchParams(location.search).has('paywall');
  } catch {
    return false;
  }
})();
export const paywallOn = (): boolean => PAYWALL_LIVE || PREVIEW;

const KEY = 'hbcg.owned.v1';

/** Does this phone own the full game? */
export function ownsGame(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function setOwned(on: boolean): void {
  try {
    if (on) localStorage.setItem(KEY, '1');
    else localStorage.removeItem(KEY);
  } catch {
    // storage blocked: the store restores the purchase next time
  }
}

/** Is this an official level behind the purchase? (Homemade levels are always free.) */
export function isPaidLevel(id: string): boolean {
  const ch = chapterOf(id);
  return !!ch && ch.n > FREE_CHAPTERS;
}

/** Can a room play this level? `roomOwns`: this phone or the partner's owns the game (friend's pass). */
export function canPlay(id: string, roomOwns: boolean): boolean {
  return !paywallOn() || roomOwns || !isPaidLevel(id);
}
