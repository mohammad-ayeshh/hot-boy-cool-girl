// The relay pass (doc 13.8): hands each phone short-lived Cloudflare TURN passwords, so two phones that can't
// reach each other directly (mobile data) can still play through Cloudflare's relay.
// The long-term key stays here as Worker secrets (TURN_KEY_ID, TURN_KEY_API_TOKEN); the game only ever sees
// passwords that expire after TTL seconds.

const TTL = 6 * 60 * 60; // longer than any play session; a new room fetches a fresh pass

// Pages allowed to ask (browsers send Origin; the Android app's page is https://localhost).
const ALLOWED = [
  /^https:\/\/mohammad-ayeshh\.github\.io$/,
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https?:\/\/(10|192\.168|172\.(1[6-9]|2\d|3[01]))\.[\d.]+(:\d+)?$/, // dev server on the home network
];

function cors(origin) {
  const ok = origin && ALLOWED.some((re) => re.test(origin));
  return ok
    ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'GET, OPTIONS', Vary: 'Origin' }
    : null;
}

export default {
  async fetch(request, env) {
    const headers = cors(request.headers.get('Origin'));
    if (!headers) return new Response('Not allowed', { status: 403 });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'GET') return new Response('Use GET', { status: 405, headers });

    const res = await fetch(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${env.TURN_KEY_ID}/credentials/generate-ice-servers`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.TURN_KEY_API_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ttl: TTL }),
      },
    );
    if (!res.ok) return new Response(`Relay key error ${res.status}`, { status: 502, headers });
    const { iceServers } = await res.json();

    // Browsers block port 53, and a URL on it only makes the phone wait for a timeout.
    const clean = iceServers
      .map((s) => ({ ...s, urls: [].concat(s.urls).filter((u) => !/:53(\?|$)/.test(u)) }))
      .filter((s) => s.urls.length);

    return new Response(JSON.stringify({ iceServers: clean, ttl: TTL }), {
      headers: { ...headers, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  },
};
