// The one purchase (design doc 12.6): "full_game", a one-time unlock bought through Google Play inside the
// store app (Capacitor + cordova-plugin-purchase). No server: Google Play keeps the receipt and gives it back
// on a new phone ("Restore purchase"). On the website there is nothing to buy; the offer links to the store.
import { isNativeApp } from '../engine/device';
import { PRICE_TEXT, PRODUCT_ID, ownsGame, setOwned } from '../game/unlock';

// The small part of the plugin's API we use (it adds window.CdvPurchase inside the app).
interface StoreError { isError: true; code: number; message: string }
interface Offer { order(): Promise<StoreError | undefined> }
interface Product { owned: boolean; pricing?: { price: string }; getOffer(): Offer | undefined }
interface Transaction { finish(): Promise<void> }
interface When {
  approved(cb: (t: Transaction) => void): When;
  receiptUpdated(cb: () => void): When;
}
interface Store {
  register(p: { id: string; type: string; platform: string }[]): void;
  when(): When;
  initialize(platforms: string[]): Promise<unknown>;
  get(id: string): Product | undefined;
  owned(id: string): boolean;
  restorePurchases(): Promise<StoreError | undefined>;
  error(cb: (e: StoreError) => void): void;
}
interface Plugin {
  store: Store;
  ProductType: { NON_CONSUMABLE: string };
  Platform: { GOOGLE_PLAY: string };
  ErrorCode: { PAYMENT_CANCELLED: number };
}
declare global { interface Window { CdvPurchase?: Plugin } }

let store: Store | null = null;
let cancelled = -1; // the plugin's code for "player closed the payment sheet"
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
    cancelled = C.ErrorCode.PAYMENT_CANCELLED;
    store.register([{ id: PRODUCT_ID, type: C.ProductType.NON_CONSUMABLE, platform: C.Platform.GOOGLE_PLAY }]);
    store.when()
      .approved((t) => void t.finish()) // paid: hand over the unlock (Google refunds purchases left unfinished)
      .receiptUpdated(() => {
        // the plugin's way to follow ownership without a receipt server; a pending (not yet paid) purchase
        // doesn't count. Only news is reported: the store confirms an old purchase every time the app starts
        if (store?.owned(PRODUCT_ID) && !ownsGame()) { setOwned(true); onChange(true); }
      });
    store.error((e) => console.warn('store:', e.message));
    void store.initialize([C.Platform.GOOGLE_PLAY]);
  };
  if (window.CdvPurchase) start();
  else document.addEventListener('deviceready', start, { once: true });
}

/**
 * Open Google Play's payment sheet. Resolves when the sheet closes (also when the player just closes it);
 * throws if the purchase failed. Ownership arrives through `changed`.
 */
export async function buy(): Promise<void> {
  const offer = store?.get(PRODUCT_ID)?.getOffer();
  if (!offer) throw new Error('product not loaded'); // e.g. offline, or the product isn't active in Play Console
  const err = await offer.order(); // the plugin returns errors instead of throwing them
  if (err && err.code !== cancelled) throw new Error(err.message);
}

/** "Restore purchase": ask Google Play again (new phone, cleared data). */
export async function restore(): Promise<void> {
  await store?.restorePurchases();
}
