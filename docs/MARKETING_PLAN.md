# Hot Boy & Cool Girl: Launch Marketing Plan

*Written 2026-11-06. Part 1 is an honest review of what the game still lacks before it can sell well. Part 2 is the plan
from now through launch and the first months. Built from `docs/GAME_DESIGN.md`, [`MARKETING.md`](MARKETING.md),
[`RELEASE_ANDROID.md`](RELEASE_ANDROID.md), [`store/`](store/), the code in `src/`, and the marketing skills in
`.claude/skills/` (launch, marketing-plan, aso, customer-research, community-marketing, influencer-marketing, referrals,
social, video, onboarding, public-relations, directory-submissions).*

**House rules for this plan**
- **Free first.** Anything that costs money is marked **💲 optional** with its price.
- **No invented numbers.** We have no player numbers, ratings or quotes yet. Anything we don't know is marked **to measure**.
  Numbers quoted from the marketing skills are marked *(skill's claim)*: they are rules of thumb, not proven facts.
- **Nothing is posted, published, sent or paid, and `PAYWALL_LIVE` stays off,** until the owner says yes to that step.
- **The design pillars win.** Nothing here may break P1–P6 or L1–L6 (doc 2–3). Ideas that would are listed in 1.6.

---

## The plan in 60 seconds

**Three big bets**
1. **Every invite is an ad.** This game spreads one friend at a time through the room link. Make that link look good when
   it lands in WhatsApp, make the invite message sell the game, and ask for a share right after a win.
2. **Clips of two real phones.** Short vertical videos of two screens stacked on top of each other: one sees the trap,
   the other doesn't. That is the game's best hook, and nothing else on the store looks like it.
3. **A small, real community from day one.** The ~20 playtesters become the first Discord members, the closed testers,
   and the first honest reviews. Discord is also where people without a partner can find one.

**Before launch (the short version):** write down what playtesters said; fix the shared-link preview, the home screen
and the invite text; decide what iPhone players see at the paywall; get a support email and a Discord; make one 30-second
video; add a review prompt after a win; run the 14-day closed test in pairs.

**When:** the 14-day closed test is the longest wait, so it starts first. If the Play Console account and the first
upload happen next week, the earliest realistic public launch is **mid-December 2026** (before the school holidays). If
Google's reviews take longer, launch in **early January** instead. Chapters 8–9 come as the **first big update**
(a second launch moment), not as a reason to delay.

---

# Part 1: What's missing (the gap review)

## 1.1 What's already strong (don't redo it)
- **The core idea is clear and different:** one player per phone, joined by a link, fire and water helping each other.
  "Different eyes" and the team codes are puzzles where *talking is the puzzle*; few phone games do that.
- **Enough content for $2.99:** 9 chapters and 45 levels, every one proven winnable by the route robot (D13), plus a free
  level designer. Two playtesters finished the whole game.
- **A fair, friendly price:** Chapters 1–2 free, one $2.99 unlock, the friend's pass ("only one of you pays"), no ads (12.6).
- **Look and sound:** a background and a tune for each chapter (9.3), the reacting duet music (15.4), chapter riddles (11.2),
  game-feel effects (8).
- **Store basics are drafted:** title, short and full description, 5 captioned screenshots, a feature graphic, Play Console
  form answers ([`store/google-play.md`](store/google-play.md)) and a privacy page (`public/privacy.html`).
- **The Android app runs** on the owner's phone, with the purchase built in (`src/shop/billing.ts`).

## 1.2 How to read the gap tables
- **Hurts sales:** 🔴 high (people leave or never come), 🟠 medium, 🟢 low.
- **Fix size:** **XS** under an hour · **S** an afternoon · **M** a weekend · **L** a week or more.
- **Who:** 🧑 the owner (accounts, decisions, filming) · 🤖 a coding session (game code) · 📝 docs.
- Code fixes are listed here but **not made by this plan**: each one goes to a coding session after the owner agrees.

## 1.3 Must fix before launch 🔴
In the order to go through them. Each has one recommendation.

| # | Gap (what's missing today) | Why it hurts sales | Hurts | Size | Who | Doc |
|---|---|---|---|---|---|---|
| M1 | **Playtest results aren't written down.** ~20 people played the levels and 2 the whole game, but the three numbers (finished Chapter 1 / came back another day / invited a friend) and their words are not recorded. | Everything else is guesswork without them. They are also the only honest source for store text and "what players say". | 🔴 | S | 🧑 | MARKETING 3–4 |
| M2 | **A shared link has no preview.** `index.html` has no description and no preview picture (no Open Graph tags), so a room link pasted into WhatsApp, Discord or Messages shows a bare address. | The room link is the game's main way to spread. A link with a picture and "Free co-op game for two phones" gets opened far more than a bare URL. | 🔴 | S | 🤖 | P5, 11.1 |
| M3 | **The home screen doesn't tell a stranger what the game is.** It shows the title, a name box, Create/Join, the designer and a "Feel Lab" link. Nothing says "you need a friend with their own phone", and the Feel Lab (a test room) is public. | A visitor from a clip or the store who doesn't get it in 5 seconds leaves. A solo visitor has nothing to do and no idea why. | 🔴 | S | 🤖 | 11.1, 11.2 (no tutorial screens: one line and a picture are enough) |
| M4 | **The invite message is weak:** "Play with me! Room ABCD". | The invited friend decides in a second. "Free, no download, no account" answers their worries. | 🟠 | XS | 🤖 | 11.1 |
| M5 | **iPhone players at the paywall.** When `PAYWALL_LIVE` goes on, the website offer shows "Get the app on Google Play" on every phone, including iPhones, which can't use it. Two iPhone friends can only ever play Chapters 1–2. | Dead ends feel broken and earn 1-star comments. Also: website players who already reached Chapter 3+ will suddenly see those chapters locked. | 🟠 | S | 🧑 decision, 🤖 code | 12.6 |
| M6 | **No support email and no feedback button.** The privacy page and store draft point to GitHub issues, which ordinary players won't use. Google Play shows a contact email publicly. | Players with a problem leave a bad review instead of writing to you. | 🟠 | XS | 🧑 (free Gmail) + 🤖 (a "Send feedback" link) | — |
| M7 | **No place of our own to gather players** (no Discord, no email list). | Clip and store visitors who aren't ready today are lost forever. No place for "find a partner" or sharing homemade levels. | 🟠 | S | 🧑 | MARKETING 6 idea 6, 10 |
| M8 | **No video.** The store preview video and a trailer are missing. | The aso skill weighs visuals at 25% of a listing's score *(skill's claim)*; a video is the clearest way to show "two phones, two views". The same footage feeds every clip. | 🔴 | M | 🧑 | store/google-play.md |
| M9 | **No review prompt.** Nothing asks happy players for a rating. | Ratings drive store ranking and trust; a new listing with zero ratings converts poorly. | 🔴 | S | 🤖 (Google Play In-App Review, app only) | MARKETING 6 idea 9 |
| M10 | **The target age isn't decided.** The Play Console asks it. Fire-and-water games are popular with children and teens; picking "under 13" brings Google's Families rules. | A wrong answer can get the app rejected or pulled later. | 🟠 (blocking) | XS | 🧑 decision | store/google-play.md |
| M11 | **The release blockers already known:** check the app ID (it can never change), make and back up the signing key, open the Play Console account, run the closed test (12 testers, 14 days). | Nothing can be sold without them. | 🔴 blocker | M | 🧑 | RELEASE_ANDROID 0–4 |
| M12 | **No way to tell where installs come from.** There are no analytics (on purpose) and the store link has no tag. | Without it we can't tell whether clips, creators or the website work, so we can't double down. | 🟠 | XS | 🤖 (add a free `utm_source` tag to the store link) | L2, privacy page |
| M13 | **Connection trouble isn't explained.** Rooms use the free public PeerJS servers (no guarantee) and drops were seen on shared Wi-Fi (13.5). There's no "Can't connect? Try mobile data" help. | "Doesn't connect" is the review that kills an online game. | 🔴 | S | 🧑 test in the closed test, 🤖 a help line | 13.5, 13.7, MARKETING 7 |
| M14 | **No page to send people to** besides the game itself: no "about" page with the video, the store badge, the Discord link and a press kit. | Creators, Reddit and press need one link that explains the game; the game screen can't. | 🟠 | S | 🤖 + 📝 | MARKETING 6 idea 10 |

## 1.4 Soon after launch (first 1–2 months) 🟠
| # | Gap | Why it matters | Hurts | Size | Who | Doc |
|---|---|---|---|---|---|---|
| S1 | **No share moment after a win.** No "send this to another friend" and no "duo stats" card ("Hot Boy died 14 times"). | Asking right after the "aha" is when people share most (referrals skill). | 🔴 | M | 🤖 | MARKETING 6 ideas 1–3 |
| S2 | **Chapters 8–9 aren't built yet** (planned and approved, 16.11–16.12; Chapter 8 needs a two-phone test first). | A content update is a second launch: new clips, a store update, a reason to come back. | 🟠 | L | 🤖 (already in progress in another session) | 16.11, 16.12 |
| S3 | **Star times are still guesses** (D12). | The ⭐⭐⭐ chase is the main replay reason; wrong times feel unfair or pointless. | 🟢 | S | 🤖 from real play times | 12.1, D12 |
| S4 | **English only**, in the game and on the store. | Most phone players don't read English well. Store text is easy to translate; the game has little text (menus, riddles). | 🟠 | S (store) / M (game) | 🧑 + 📝, later 🤖 | — |
| S5 | **No progress backup.** iPhone Safari can erase website progress after about 7 days without a visit (12.4). | Losing progress makes people quit. | 🟢 | M | 🤖 | 12.4 |
| S6 | **No control options** (left-handed swap, button size; doc 6.4 "later"). | Small, but it shows care and earns good reviews. | 🟢 | S | 🤖 | 6.4 |
| S7 | **Nowhere to share homemade levels** with strangers. | The designer is free and every shared level carries the game's name (MARKETING 6 idea 4). | 🟢 | XS (a Discord channel) | 🧑 | 16.3 |
| S8 | **Store listing never tested.** Google Play has free store listing experiments. | Small wins on the icon, screenshots and short text add up. | 🟢 | S | 🧑 | aso |

## 1.5 Later 🟢
| # | Gap | When it makes sense | Size | Cost |
|---|---|---|---|---|
| L1 | **iPhone app** (App Store). The website already works on iPhone, and the friend's pass lets an iPhone player play everything with an Android owner. | When Android sales show people pay, so the yearly fee is covered. | L (needs a Mac or a cloud build) | 💲 $99/year |
| L2 | **Steam** (keyboard already works; Remote Play Together). | After the phone game proves itself. | L | 💲 $100 per game |
| L3 | **Cosmetics** (hats, trail colors) that never change gameplay (12.5). | When there are repeat players asking for more. | M | free |
| L4 | **Story pictures between chapters** (16.7). | With or after Chapter 9's ending. | M | free |
| L5 | **A Versus mode** (16.7, separate from the story). | Only if players ask. | L | free |
| L6 | **Visitor counting on the website.** Today we can't count website visitors at all. | Only if the free sources in 2.1 aren't enough. It would change the privacy page ("no analytics"), which is a selling point. | S | free tools exist |
| L7 | **Our own connection server** if the public PeerJS servers become unreliable. | Only if the closed test or reviews show connection trouble. | M | 💲 usually a monthly fee (conflicts with L2) |
| L8 | **Paid ads.** | Only after organic clips show which message converts. | — | 💲 owner sets a test budget |

## 1.6 Ideas we skip on purpose (they break a pillar or a decision)
- **Matching strangers** to play together: needs a server (L2), and strangers are the anti-persona. Use a Discord
  "find a partner" channel instead.
- **Ads or "watch an ad to unlock"**: no ads, ever (12.6, P5).
- **A single-player or same-phone mode**: breaks P1 and L3.
- **Accounts or an email sign-up inside the game**: breaks P5. Email or Discord sign-up happens only on the website, never required.
- **Tutorial screens**: the first levels are the tutorial (11.2, D4). The home screen fix (M3) is one line and a picture, not a tutorial.
- **Dropping the price to $0.99 or fake "today only" sales**: rejected in MARKETING 6 idea 11.
- **Paying for reviews, asking only happy players, or asking for 5 stars**: against Google's rules (referrals skill).
- **Using the other fire/water game's name** in keywords, tags, clips or replies (L4).

## 1.7 Other areas checked (no gap that blocks sales)
- **Content amount:** 45 levels for $2.99 (35 paid levels plus the designer) is fair. How long the whole game takes is
  **to measure**: ask the 2 players who finished it.
- **Replay value:** stars, a fresh team code on every vault playthrough (G3), and the designer. Real star times (S3) and
  sharing homemade levels (S7) are the cheap improvements.
- **Accessibility:** colors never stand alone (4.1), sound is never required (15.1), three controls (6.1). Chapters 5–7 need
  players to talk; deaf or hard-of-hearing pairs can type to each other instead, so nothing to change now.
- **Legal:** a privacy page exists and is honest. The source code is public on GitHub, so a technical player could unlock
  the game for free; that is accepted (13.6). The name is original (L4), but see the name risk in 2.10.

---

# Part 2: The marketing plan

## 2.1 The goal and the numbers to watch
**Goal for the first three months:** prove that strangers who play the free chapters with a friend buy the unlock, then
put more effort into whatever brings those players.

**North star:** full-game unlocks per week (Play Console). Current value: **to measure** (not launched).

There is no server and no analytics (L2, privacy page), so every number comes from a free source:

| Stage | What to watch | Where it comes from | How often |
|---|---|---|---|
| Find (acquisition) | Store page visitors, installs, where installs came from (UTM tags, M12) | Play Console › Statistics and Acquisition reports | Weekly |
| Find | Views, watch-through, shares of each clip | TikTok and YouTube Studio | Weekly |
| First fun (activation) | Share of pairs who finish Chapter 1, and where they get stuck | Playtests and the tester form (no in-game counting) | During the closed test |
| Come back (retention) | Uninstalls, active users | Play Console | Weekly |
| Bring a friend (referral) | Installs tagged "website" or per creator; Discord joins | Play Console UTM, Discord | Weekly |
| Pay (revenue) | Unlocks, unlocks ÷ installs | Play Console › Financial reports | Weekly |
| Health | Rating and its count, crash and ANR rates | Play Console | Weekly |

**Weekly 20-minute review:** copy these numbers into one spreadsheet row every Monday. Note the 3 best and 3 worst clips.
**Decision rules** (relative, so no invented targets):
- A clip format that does worse than your average 5 times in a row gets dropped (social skill: change the hook first).
- A creator or channel that brings no tagged installs in 3 weeks gets no more time.
- If the store's visitor-to-install rate drops after a change, undo the change.
- If many reviews mention connecting, stop marketing and fix the connection first.

## 2.2 Who we sell to, and what we say
From [`.agents/product-marketing.md`](../.agents/product-marketing.md): pairs who already know each other (friends,
couples, siblings, a parent and child) who want to play *together* on the phones they have. Not for solo players or
people who want strangers.

- **The ad line:** "Play together free. Only one of you ever pays. No ads."
- **The hook line:** "Two friends, two phones, one temple: fire and water must save each other."
- **For clips:** short duo jokes in the brand voice ("He jumped. She sighed. They both made it.").
- **Words players use:** none recorded yet. Collect them in M1 and use them in the store text and captions.

## 2.3 Channels: where we show up (and where we don't)
The launch skill's rule: use rented and borrowed channels to bring people into owned ones.

| Type | Channel | Why | Cost |
|---|---|---|---|
| **Owned** | **Discord server** (main) | Founding playtesters, announcements, a "find a partner" channel, "level of the week", feedback, the iPhone wait list | Free |
| **Owned** | **The website** (the free demo) plus a small about page (M14) | Every clip, post and creator links here or to the store | Free |
| **Rented** | **TikTok and YouTube Shorts** (the same vertical clip on both; Instagram Reels too if it's easy) | Short gameplay clips are how games like this get found | Free |
| **Rented** | **Google Play** (the store page itself, 2.5) | Search for "2 player", "co-op", "play with friends" | $25 once (already planned) |
| **Rented** | **itch.io** page for the web demo | A free home for browser games with a gaming audience; the page links to Google Play | Free |
| **Borrowed** | **Small creators** (about 1k–50k followers) who play co-op or couples games | Their audience already wants this; free unlock codes instead of payment | Free (💲 optional paid posts) |
| **Borrowed** | **Reddit**, only in communities whose rules allow self-promotion | Honest "I made this" posts; reply to every comment | Free |

**Skipped for now:** X/Twitter and LinkedIn (wrong audience), Product Hunt (tech audience, not gamers), press releases and
paid PR. A short list of mobile-game writers comes after launch, when there's a story to tell (a beginner's solo game
with no ads where only one friend pays; public-relations skill).

## 2.4 What to make

### The 30-second video (store preview and trailer, M8)
One video, two versions: 16:9 landscape for Google Play and YouTube, and a 9:16 cut for TikTok and Shorts.
- **0–3 s, the hook:** a funny double death (both walk into the wrong pool), caption "We trusted each other."
- **3–10 s:** "Hold the button": one waits so the other passes. Caption: "You can't win alone."
- **10–20 s, different eyes:** the two phones' screens stacked; one shows a bridge, the other shows nothing. Caption:
  "She sees the bridge. He doesn't."
- **20–26 s:** the vault: taking turns on the animal stones. Caption: "Every team gets its own secret code."
- **26–30 s, end card:** "Play together free. Only one of you ever pays. No ads." plus the Google Play badge.
- **Rules:** works with the sound off (captions on every shot); real gameplay only; no other game's name; nothing the
  game doesn't do. Google Play takes it as a YouTube link (public or unlisted, no ads on the video).
- **How to film for free:** each phone's built-in screen recorder (Android and iPhone have one), play a real session on a
  call, then line the two recordings up in a free editor (CapCut or DaVinci Resolve). Stacking two landscape screens on
  top of each other fills a vertical 9:16 frame almost exactly.

### Clips (the weekly engine)
**Cadence:** 3 clips a week, posted to both TikTok and YouTube Shorts. Film and edit in one 2–3 hour batch each week
(social skill: batch, keep a 1–2 week queue). The skill's "growth" pace is daily; start at 3 and raise it only if the
weekly batch stays easy.
**Every clip:** the first second has the picture, a spoken or reacting voice, and a caption, each saying something
different; captions are 2 lines at most; no links in the post text.

Ten starting ideas, all real moments from the game:
1. **"Whose fault was that?"**: a double death; let the comments argue.
2. **Two screens, two worlds** (Chapter 5): the stacked screens, one sees the lava, the other sees floor.
3. **"Jump NOW!"**: the warning shout in 5-3, with the death flash when it's too late.
4. **The vault**: "Your turn: the frog!" from 6-5.
5. **Half a secret** (Chapter 7): each says their half of the code out loud.
6. **He rushes, she thinks**: a skit in the brand voice; ends "He jumped. She sighed. They both made it."
7. **The gate crush**: someone lets go of the button too early.
8. **Fail montage**: ten deaths in ten seconds.
9. **"Can you beat this level without talking?"**: a challenge clip (MARKETING 6 idea 5).
10. **Dev diary**: "I'm a beginner who made a co-op game for two phones" (founding story; also good for Reddit).

Real players' voices make the best clips. Use tester footage **only with their written OK** (a yes in the form is enough).

### The about page and press kit (M14)
One page on the website: the hook line, the video, 5 screenshots, the Google Play badge, the Discord link, the support
email, and a "press kit" zip (logo, icon, screenshots, feature graphic, a 3-sentence description, a short note about the
maker). The same page answers creators and journalists.

### Posts
- **Discord:** a pinned welcome, a weekly "fail of the week" and "level of the week" thread, every update posted there first.
- **Reddit:** one honest launch post per allowed community, written by the owner in their own words, replying to every comment.

## 2.5 The store page (ASO)
The store text in [`store/google-play.md`](store/google-play.md) is already good. Changes to consider (not made yet;
the owner decides):

| Item | Now | Suggestion | Why |
|---|---|---|---|
| Title (30 max) | "Hot Boy & Cool Girl: Co-op" (26) | **"Hot Boy & Cool Girl: 2 Player"** (29) | The title is Google's strongest search signal (aso skill). People search for "2 player games" in plain words; "co-op" stays in the short and full text. Search volume can't be checked without paid tools, so this is a judgment, not a measurement. |
| Short description (80 max) | "Two friends, two phones: a co-op puzzle game. Only one of you pays. No ads." (75) | Keep | Says the hook, the friend's pass and no ads. |
| Full description | Says "2 player", "co-op", "play with friends" plainly | Keep; add one honest line about the connection ("needs internet on both phones") and the levels count once Chapters 8–9 ship | Sets expectations; avoids "doesn't work offline" reviews. |
| Screenshots | 5 captioned landscape shots | Keep; regenerate the "35 levels" caption when the count changes (`tools/store_assets.py`) | Google allows up to 8 *(skill's claim)*; the first 3 matter most. A stacked "two phones" shot could replace #1 after an experiment (S8). |
| Video | none | The 30-second video (2.4) | Biggest missing piece. |
| Ratings | none yet | Review prompt after a win (M9); reply to every review | Ratings are 20% of the aso score *(skill's claim)*. |
| Contact | GitHub issues | A dedicated free Gmail (M6) | Google shows it publicly. |
| Local prices | auto-converted | Accept Google Play's suggested local prices | $2.99 converted directly can be expensive in many countries; Google offers adjusted prices for free. |
| Languages | English | Store text in 1–2 more languages after launch (S4) | Pick from the countries Play Console shows; a native speaker checks it. |

**Free promo codes:** Google Play can make promo codes for the in-app unlock (the Console shows the quarterly limit). Use
them for creators and for testers who helped. They are a gift, so creators must still label the post as an ad (2.6).

## 2.6 Using the playtesters and the closed test

### The ~20 playtesters (start this week)
1. **A short form** (Google Forms, free), sent to all of them:
   - Did you finish Chapter 1? Chapter 2? Did you play again on another day? Did you invite anyone?
   - "How would you feel if you could no longer play this game?" (very / somewhat / not disappointed). The customer-research
     skill reads 40% "very disappointed" as a sign people truly want it *(skill's claim)*.
   - "How would you describe the game to a friend?" (their words become store and clip text).
   - "What almost made you stop?"
   - "May we quote you (first name only)?" and "May we use your gameplay recordings in clips?"
2. **Write the answers down** in MARKETING.md section 3, word for word. That closes M1.
3. **Invite them to the Discord** as founding members before it opens to the public (community skill: seed 20–50 members
   by hand, post the first few things yourself, reply to everything).

### The Google Play closed test (12 testers for 14 days)
- **Recruit 16–20 people, not 12,** so a few dropping out doesn't restart the clock. Everyone must stay opted in for the full 14 days.
- **Recruit in pairs.** It's a co-op game: a tester without a partner can't really test. Ask each tester to bring their usual gaming partner.
- **Add every tester as a license tester** too (Play Console › Settings › License testing), so they can try buying the
  unlock and "Restore my purchase" without being charged.
- **Give them a simple two-week plan** in Discord:
  - **Week 1:** play Chapters 1–2 as a new player would, from a link sent by your partner. Report anything confusing.
    Try once on mobile data and once on shared Wi-Fi.
  - **Week 2:** try the unlock (free as a license tester), play into Chapters 3–7, record one session with the phone's
    screen recorder, and fill the form again.
- **Keep notes** of who tested, what they found and what you fixed: Google asks about the closed test when you apply
  for production access.
- **Send updates during the test** (fixes for M2–M13) to the same closed track; that's allowed and keeps testers busy.
- **At launch,** tell testers the game is public and that an honest review helps. Never ask for 5 stars and never offer
  anything for a review.

## 2.7 Week by week
*Weeks start on Monday. Dates move if Google's account check or reviews take longer; the order stays the same.*

| Week | Dates | Focus | What to do |
|---|---|---|---|
| 1 | Nov 9–15 | **Unblock** | Send the playtester form (M1). Decide M5 and M10. Check the app ID, make and back up the signing key (M11). Open the Play Console account (identity check can take days). Make a support Gmail (M6). Open the Discord privately and invite the playtesters (M7). Start recruiting closed testers in pairs. A coding session fixes M2, M3, M4, M12 and M13. |
| 2 | Nov 16–22 | **Closed test starts** | Upload the signed bundle to internal testing, then the closed track; add testers and license testers. Day 1 of 14 when the first testers opt in. Film the first gameplay session with two phones. Coding: the review prompt (M9). |
| 3 | Nov 23–29 | **Footage and video** | Testers play week 1 of the plan. Edit the 30-second video (M8). Post the first 3 clips (with the owner's OK on each). Write answers from the form into MARKETING.md. |
| 4 | Nov 30–Dec 6 | **Closed test ends** | Testers do week 2 (buying, Chapters 3–7). Apply for production access once 14 days are complete. Build the about page and press kit (M14). Make a list of 20 small creators (2.8). Fill all store forms; upload the video. |
| 5 | Dec 7–13 | **Ready** | While Google reviews: open the Discord to the public, keep posting clips, put the game on itch.io (web demo), draft the launch posts and creator messages (owner approves each). |
| 6 | Dec 14–20 | **Launch week** (earliest) | With the owner's yes: switch `PAYWALL_LIVE` on, release to production, push the website at the same time with a note for website players (M5). Post in Discord, on TikTok/Shorts and in the allowed Reddit communities. Send the first 10 creator messages with promo codes. Answer every comment and review that week. |
| 7–8 | Dec 21–Jan 3 | **Holidays** | People have time and are with family and partners. Keep 3 clips a week, a holiday "play with your person" clip, reply to every review, fix what reviews report. Second batch of creator messages. |
| 9–10 | Jan 4–17 | **Learn** | First monthly review of the numbers in 2.1. Double down on the best clip type and the best creator. Start the share-after-a-win feature (S1) and real star times (S3). |
| 11–14 | Jan 18–Feb 14 | **Update launch** | Release Chapters 8–9 (after the two-phone test, 16.11) as a big update: new clips ("touching kills"), store text and screenshot update, Discord event. Time it so the build is out before **Valentine's Day** with a couples clip: "Better with your person." |
| After | Feb onward | **Compound** | One small update or event a month (launch skill: launch again and again). Store text in 1–2 more languages (S4). A store listing experiment (S8). Decide on iPhone (L1) from real sales. |

## 2.8 Creators (borrowed reach)
- **Who:** about 20 creators with roughly 1k–50k followers who already post co-op, couples or mobile games (influencer
  skill: an audience that fits beats a big one). Check their last few weeks of posts first.
- **How:** a personal message to each (not a copy-paste blast): why this game fits *their* audience, a promo code for the
  full game (their partner plays free with the friend's pass, which is the point), and a short brief: 2–3 things worth
  showing, the store link with their own `utm_source` tag, and full creative freedom. Never a script.
- **Disclosure:** a free unlock counts as a gift, so they must label the post as an ad or use the platform's paid-partnership
  label (influencer skill: "non-negotiable"; the brand is responsible too).
- **Follow up once** after a week, then stop. Thank and share the ones who post.
- **💲 Optional:** paid posts. The skill's rough prices are "free product to $100" for very small creators and "$100–$1,500"
  per post for small ones *(skill's claim)*. Not recommended until free outreach shows which kind of creator brings buyers.

## 2.9 What costs money
| Item | Price | Needed? |
|---|---|---|
| Google Play developer account | $25 once | **Yes** (already planned) |
| Google Play's cut of each sale | 15% of each sale (Google's standard rate for a small developer's first $1M a year; check it in the Console) | Automatic, not paid up front |
| 💲 Own web address (domain) | about $10–15 a year | No: the GitHub address works |
| 💲 Paid creator posts | see 2.8 | No, not yet |
| 💲 Ads (TikTok, Google App campaigns) | the owner's choice of test budget | No, not before organic clips show what works |
| 💲 Apple developer account (iPhone app) | $99 a year | Later (L1) |
| 💲 Steam | $100 per game | Later (L2) |
| Discord, TikTok, YouTube, itch.io, Google Forms, CapCut or DaVinci Resolve, phone screen recorders | free | Yes, these do the work |

## 2.10 Risks
- **Connection trouble → bad reviews.** Test on many networks in the closed test (M13). If reviews mention it, pause marketing and fix it first.
- **The name.** "Hot Boy & Cool Girl" is original (L4) but close in spirit to the classic fire/water games; a complaint or
  confusion is possible. Never use their name anywhere, keep our art and wording clearly our own. Also, "hot boy" alone
  is a common phrase on social apps, so always search and tag the full name.
- **Children and teens.** The genre is popular with younger players. Clips and store art stay "stylish, not cute" (14.2),
  and the age answer (M10) is honest.
- **Website players losing chapters** when the paywall goes on (RELEASE_ANDROID 5.4). Tell them in advance, kindly (M5).
- **Burnout.** One person can't do daily clips, Discord, creators and new chapters at once. The plan keeps a fixed weekly
  batch; skip a week rather than drop the quality of replies.
- **Chapter 7's "forgot to say the carving"** frustration (16.10, accepted). Watch for it in tester comments.

## 2.11 Decisions for the owner
1. Each item in 1.3 (M1–M14): yes, no or later. Gone through one at a time.
2. Launch with 35 levels and ship Chapters 8–9 as the first big update (recommended), or wait for 45? *(2026-11-06: Chapters 8–9 are now built, so the game has 45 levels; Chapter 8 still needs a two-phone test.)*
3. The title: keep "Co-op" or switch to "2 Player" (2.5)?
4. Which 1–2 extra languages, and who checks them?
5. Each post, message, upload and the `PAYWALL_LIVE` switch: a yes each time.

---

## Changelog
- 2026-11-06: First version: gap review (M1–M14, S1–S8, L1–L8) and the launch plan.
