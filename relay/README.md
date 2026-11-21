# Relay pass (doc 13.8)

A tiny Cloudflare Worker that gives the game short-lived passwords for Cloudflare's relay (TURN),
so friends on mobile data can connect. Live at https://hbcg-relay.mohammad-ayeshh.workers.dev/

- Code: `src/index.js`. The game calls it from `src/net/relay.ts` (`RELAY_URL`).
- Secrets (set once, never in the code): `TURN_KEY_ID` and `TURN_KEY_API_TOKEN`, from
  Cloudflare dashboard → Realtime → TURN Server → hot-boy-cool-girl.
- Deploy a change (from this folder, in PowerShell use `npx.cmd`):
  `npx wrangler@4 deploy`
- Replace a secret: `npx wrangler@4 secret put TURN_KEY_API_TOKEN` and paste the value.
- New website address? Add it to `ALLOWED` in `src/index.js` and deploy.
