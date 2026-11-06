// Asking for a Google Play rating (docs/MARKETING_PLAN.md M9): only in the store app, only right after a win (a chapter's
// last level), never after a death, and at most once a month from our side. Google's own sheet decides whether it really
// shows (it has its own limits) and never tells us what the player did. No rewards for reviews (Google's rules).
import { isNativeApp } from '../engine/device';

const KEY = 'hbcg.reviewAsked.v1';
const MONTH = 30 * 24 * 3600 * 1000;

export async function askForReview(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const last = Number(localStorage.getItem(KEY) || 0);
    if (Date.now() - last < MONTH) return;
    localStorage.setItem(KEY, String(Date.now()));
  } catch {
    return; // storage blocked: don't risk asking every time
  }
  try {
    const { InAppReview } = await import('@capacitor-community/in-app-review');
    await InAppReview.requestReview();
  } catch {
    // not installed from Google Play (a test build), or the store said no: nothing to do
  }
}
