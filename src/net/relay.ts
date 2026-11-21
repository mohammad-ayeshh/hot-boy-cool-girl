// The relay pass (doc 13.8). Phones on mobile data usually can't reach each other directly, so WebRTC needs a relay
// (TURN) server in the middle. Our small Cloudflare Worker (relay/) hands out short-lived passwords for
// Cloudflare's relay network; we fetch them before opening a room. If the Worker can't be reached, PeerJS's own
// public servers are used as before, so the game never gets worse than it was.

/** The Worker's address. Empty = no relay of our own yet (PeerJS defaults). */
export const RELAY_URL = 'https://hbcg-relay.mohammad-ayeshh.workers.dev/';

const FETCH_TIMEOUT_MS = 4000;
const STUN_FALLBACK: RTCIceServer = { urls: 'stun:stun.l.google.com:19302' };

let cached: { servers: RTCIceServer[]; until: number } | null = null;

/** ICE servers for a new room, or null to keep PeerJS's defaults. */
export async function relayServers(): Promise<RTCIceServer[] | null> {
  if (!RELAY_URL) return null;
  if (cached && Date.now() < cached.until) return cached.servers;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(RELAY_URL, { signal: ctrl.signal, cache: 'no-store' });
    if (!res.ok) throw new Error(`relay ${res.status}`);
    const data = (await res.json()) as { iceServers: RTCIceServer[]; ttl: number };
    if (!Array.isArray(data.iceServers) || !data.iceServers.length) throw new Error('relay: empty');
    const servers = [...data.iceServers, STUN_FALLBACK];
    // Reuse while at least an hour of the pass is left.
    cached = { servers, until: Date.now() + Math.max(0, data.ttl - 3600) * 1000 };
    return servers;
  } catch (err) {
    console.warn('Relay pass unavailable, using the public servers.', err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}
