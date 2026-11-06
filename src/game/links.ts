// Addresses the game sends players to (docs/MARKETING_PLAN.md M2, M6, M12).
import { APP_ID } from './unlock.ts';

/**
 * The website. Every shared link (room, homemade level) points here, also from the store app, whose own address
 * (https://localhost/) only works on that phone. The website and the app play together (same play version, 13.6).
 */
export const WEB_URL = 'https://mohammad-ayeshh.github.io/hot-boy-cool-girl/';

/** The game on Google Play. */
export const STORE_URL = `https://play.google.com/store/apps/details?id=${APP_ID}`;

/**
 * The store link tagged with where the player came from. There are no analytics (privacy page); Google Play Console
 * counts installs per `utm_source` in its acquisition reports, so we can see which places bring players.
 */
export const storeLink = (source: string): string =>
  `${STORE_URL}&referrer=${encodeURIComponent(`utm_source=${source}&utm_medium=game`)}`;

/** Where players write to us (Google Play shows it publicly). Empty = no feedback link yet. */
export const SUPPORT_EMAIL = '';

export const feedbackLink = (): string =>
  `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Hot Boy & Cool Girl feedback')}`;
