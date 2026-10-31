# Google Play listing: Hot Boy & Cool Girl

*Drafted 2026-10-31 from `.agents/product-marketing.md` and the marketing skills (aso, paywalls, referrals).
Everything here is true today; don't add claims we can't prove (no "best", no player numbers, no other games' names).*

## Text

**App name** (30 max, 26 used; Google doesn't allow "free" in the title):
> Hot Boy & Cool Girl: Co-op

**Short description** (80 max, 75 used):
> Two friends, two phones: a co-op puzzle game. Only one of you pays. No ads.

**Full description** (4000 max; Google searches this text, so it says "2 player", "co-op" and "play with friends" plainly):

> Fire and water. Save each other.
>
> Hot Boy & Cool Girl is a co-op puzzle platformer for two players, each on their own phone. He's made of fire and safe in lava. She's made of water and safe in water. Each one is in danger in the other's element, so you only get through the temple by helping each other.
>
> PLAY WITH A FRIEND IN SECONDS
> • Create a room and send the link or the 4-letter code. Your friend joins, and you're playing.
> • One player per phone, online. Play side by side on the sofa or far apart on a call.
> • Three controls only: left, right, jump. Easy for anyone to pick up.
>
> ONLY ONE OF YOU PAYS
> • Chapters 1 and 2 are free to play together.
> • Unlock the full game once, and your friend plays every chapter with you. No second purchase.
> • No ads. No accounts. No timers.
>
> PUZZLES THAT MAKE YOU TALK
> • Hold the button so your friend can pass, then they hold one for you.
> • Different eyes: some stones, buttons and traps are visible on only one phone. Describe what you see and guide each other through.
> • The Sealed Vault: animal carvings are hidden across the chapter. Every pair of friends gets its own secret code, entered on symbol stones by taking turns.
>
> 30 LEVELS IN 6 TEMPLE CHAPTERS
> Lifts, levers, trapdoors, crushing gates, lava, water and poison, built to be readable at a glance and fair to play.
>
> MAKE YOUR OWN LEVELS
> Build a level on your phone, beat it together with a friend to earn its ✅, then share it with a link.
>
> Three stars per level for finishing, collecting every gem and beating the clock, earned as a team.

**Category:** Game › Puzzle. **Tags to pick:** co-op, multiplayer, platformer, puzzle, casual.
**Contact:** the GitHub issues page (or an email address you choose; Google shows it publicly).
**Privacy policy URL:** https://mohammad-ayeshh.github.io/hot-boy-cool-girl/privacy.html

## Images (in this folder; regenerate with `python tools/store_assets.py docs/store/raw docs/store`)
| File | Where it goes | Size |
|---|---|---|
| `feature-graphic.png` | Feature graphic (top of the store page) | 1024×500 |
| `screenshot-1-fire-and-water.png` … `screenshot-5-only-one-pays.png` | Phone screenshots, in this order (the first 3 matter most) | 1920×1080 |
| `../../public/icons/icon-512.png` | App icon | 512×512 |

Still to make: a short **preview video** (YouTube link) that works with the sound off: a funny co-op death, a "different eyes" moment, and the friend's pass line at the end.

## Answers for the Play Console forms
- **Price:** the app is free to install; one in-app product.
- **In-app product:** ID `full_game`, one-time (non-consumable), **$2.99** (decided 2026-10-31). Name "Full game", description "Unlock chapters 3–6 forever. Your friend plays them with you for free."
- **Ads:** no ads.
- **Data safety:** no data collected or shared by the app; data stays on the device. Online play connects phones directly (WebRTC) through the public PeerJS connection service; see the privacy page. Payments are handled by Google Play.
- **Target audience:** pick the ages honestly; the game has no chat and no personal data, but don't pick "children" unless you're ready for Google's extra Families rules.
- **Content rating:** fill the questionnaire honestly (cartoon peril only: characters dissolve into steam or sparks, no blood).
