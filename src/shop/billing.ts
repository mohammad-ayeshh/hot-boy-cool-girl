// The one purchase (design doc 12.6): "full_game", a one-time unlock bought through Google Play inside the
// store app (Capacitor + cordova-plugin-purchase). No server: Google Play keeps the receipt and gives it back
// on a new phone ("Restore purchase"). On the website there is nothing to buy; the offer links to the store.
import { isNativeApp } from '../engine/device';
import { PRICE_TEXT, PRODUCT_ID, ownsGame, setOwned } from '../game/unlock';

// The small part of the plugin's API we use (it adds window.CdvPurchase inside the app).
interface Offer { order(): Promise<unknown> }
interface Product { owned: boolean; pricing?: { price: string }; getOffer(): Offer | undefined }
interface Transaction { finish(): Promise<void> }
interface When {
  approved(cb: (t: Transaction) => void): When;
  productUpdated(cb: (p: Product) => void): When;
}
interface Store {
  register(p: { id: string; type: string; platform: string }[]): void;
  when(): When;
  initialize(platforms: string[]): Promise<unknown>;
  get(id: string): Product | undefined;
  restorePurchases(): Promise<unknown>;
  error(cb: (e: { message: string }) => void): void;
}
interface Plugin { store: Store; ProductType: { NON_CONSUMABLE: string }; Platform: { GOOGLE_PLAY: string } }
declare global { interface Window { CdvPurchase?: Plugin } }

let store: Store | null = null;
let onChange: (owned: boolean) => void = () => {};

/** Can this phone buy right now (inside the store app, plugin ready)? */
export const canBuy = (): boolean => !!store;

/** The local price from the store, or our default text. */
export const priceText = (): string => store?.get(PRODUCT_ID)?.pricing?.price ?? PRICE_TEXT;

/** Start the store connection inside the app. `changed` is told whenever ownership is confirmed. */
export function initBilling(changed: (owned: boolean) => void): void {
  onChange = changed;
  if (!isNativeApp()) return;
  const start = () => {
    const C = window.CdvPurchase;
    if (!C || store) return;
    store = C.store;
    store.register([{ id: PRODUCT_ID, type: C.ProductType.NON_CONSUMABLE, platform: C.Platform.GOOGLE_PLAY }]);
    store.when()
      .approved((t) => void t.finish()) // paid: hand over the unlock (Google refunds purchases left unfinished)
      .productUpdated((p) => {
        // only news is reported: the store confirms an old purchase every time the app starts
        if (p.owned && !ownsGame()) { setOwned(true); onChange(true); }
      });
    store.error((e) => console.warn('store:', e.message));
    void store.initialize([C.Platform.GOOGLE_PLAY]);
  };
  if (window.CdvPurchase) start();
  else document.addEventListener('deviceready', start, { once: true });
}

/** Open Google Play's payment sheet. Resolves when the sheet closes; ownership arrives through `changed`. */
export async function buy(): Promise<void> {
  await store?.get(PRODUCT_ID)?.getOffer()?.order();
}

/** "Restore purchase": ask Google Play again (new phone, cleared data). */
export async function restore(): Promise<void> {
  await store?.restorePurchases();
}
