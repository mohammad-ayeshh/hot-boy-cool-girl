# Hot Boy & Cool Girl: How to Sell the Game

*Started 2026-10-24. Section 1 was decided on 2026-10-31; the rest is a plan (💬). Updated 2026-10-31 with ideas from the
marketing skills installed in `.claude/skills/` (their game context is `.agents/product-marketing.md`).*

**The launch plan** (what's still missing before the game sells well, and what to do each week through launch and the
first months) is in [`MARKETING_PLAN.md`](MARKETING_PLAN.md), written 2026-11-06.

## 1. How we make money 🔒
*Decided 2026-10-31 (design doc 12.6).*
- **No ads, ever.** The owner hates them, and they break P5 (friends playing in 30 seconds).
- **Free:** Chapters 1 and 2 (10 levels), and the level designer.
- **One purchase, $2.99,** unlocks every other chapter, forever.
- **Friend's pass:** if either player in a room owns the game, the room plays everything. Only one of two friends pays, and every buyer brings a new player.
- **Where the offer appears:** right after the last free level (2-5), and when a 🔑 level is tapped. Never mid-level, always with "Not now" and "play with a friend who owns it".
- **Payment:** Google Play inside the Android app. No server needed, so the $0 running cost limit (L2) holds.
- **The website** is the free demo that leads to the app.
- **Later:** cosmetics (hats, trail colors) that never change gameplay.

## 2. Where we sell
1. **Android first** (Google Play): built and ready to package; steps in [`RELEASE_ANDROID.md`](RELEASE_ANDROID.md).
   - $25 once; new personal accounts need a closed test with 12 testers for 14 days.
   - Store text and images: [`store/google-play.md`](store/google-play.md).
2. **iPhone later:** the App Store costs $99 a year and uses TestFlight for testing.
3. **Steam later:** needs keyboard or controller support and a $100 fee. A friend can join through Steam Remote Play Together without owning the game.

## 3. When to start selling
Start selling when **a stranger who plays the free chapters wants to pay for the next one.** That is measured, not guessed.

Where we are (updated 2026-11-06):
- ✅ 9 chapters, 45 levels: different eyes, password gates (both mixed in Chapter 7), Don't touch (Chapter 8) and the finale (Chapter 9) are built (2026-11-06).
- ✅ Each chapter has its own background and tune (2026-10-31), and Chapters 1–6 open with a riddle (2026-11-06).
- 💬 Chapter 8 ("Don't touch") still needs a test on two real phones over the internet before it is final (design doc 16.11, T2).
- ✅ A two-phone test over mobile data worked and was fun.
- ✅ Chapter 1 was tested with a friend.
- ✅ **Playtests done (owner, 2026-10-31):** about 20 people played the levels and 2 played the whole game. *The three numbers below and what testers said aren't written down yet: add them here.*
- ✅ The Android app runs on the S23 Ultra (back button, sound pause, fullscreen fixed, 2026-10-31).
- ⬜ A simple story (optional for the first release).

⚠️ The launch skill warns about two traps: polishing in private for too long, and "just one more feature". The game has enough content to start; what's missing is outside eyes.

## 4. What a marketing expert checks (in order)
1. **The hook in one sentence:** "Two friends, two phones, one temple: fire and water must save each other." Shorter for ads: **"Play together free. Only one of you ever pays. No ads."**
2. **The 5-second clip.** Short gameplay videos (TikTok, Reels, YouTube Shorts) sell games like this. A funny co-op death or a clever "aha" moment works better than a polished trailer (section 5).
3. **Test with strangers before building more.** About 20–50 people who don't know us play the free chapters. Watch three numbers:
   - **How many finish Chapter 1 (and 2).**
   - **How many come back another day.**
   - **How many invite a friend.**

   With no server and no analytics, count them by hand at first: watch people play, or ask testers in a short form. If these numbers are low, more levels won't help; fix the fun first.
4. **Interest before launch.** Use Google Play pre-registration on mobile and wishlists on Steam. *(The earlier "7,000 wishlists" and "a year before release" figures had no source, so they were removed; the skills' rule is never to use an unsourced number.)*
5. **Build an audience before launch:** post development clips, collect emails or Discord members from the website demo, and share early versions.
6. **The store page.** The icon, the first 3 screenshots and a short video decide whether someone installs. Ready in `docs/store/`; the video is still to make.
7. **Price and the offer moment** (section 1).
8. **Launch and creators.** Send the game to small co-op and couples gaming creators (section 6).

## 5. What makes the ads work (the owner's ideas, sharpened)
- **Tell a story (sharpened):** a lore intro starts too slowly; a video has about 3 seconds to stop the scroll (a skill's claim). Tell the story **through the two characters** instead: 10–20 second skits, "he rushes in, she thinks first", ending on a punchline ("He jumped. She sighed. They both made it."). Keep the lore for the store description and devlog posts.
- **Show the graphics (sharpened):** use the art behind a **co-op moment plus a one-line caption**, not as scenery alone, e.g. "She sees the trap. He doesn't." The store screenshots already follow this.
- **Show the mechanics (keep: the strongest idea):** every clip opens with three things at once: what's on screen, a spoken line and a caption, each different. Best formats:
  - **Different eyes:** two phones side by side, each showing something different.
  - **Fail montages:** a run of funny co-op deaths.
  - **"Whose fault was that?":** invites comments.

  Always add captions: most people watch with the sound off (the video skill claims 85%). Make clips cheaply, and only polish the ones that work.
- **Say it's free to try (sharpened):** lead with the friend's pass, because it answers the real worry ("will we both have to pay?"): **"Play together free. Only one of you ever pays. No ads."** Google Play doesn't allow "free" in the app title, so put it in the short description and the screenshots.

## 6. New ideas from the marketing skills
| # | Idea | Why it fits | Effort | Cost |
|---|---|---|---|---|
| 1 | After a big win: **"Send this to another friend"** with a ready-written message and the room link | Ask right after the "aha" moment (referrals) | Low | Free |
| 2 | Present the friend's pass as a **gift**: "You unlock it, your friend plays free" | A reward that is the game itself (referrals) | Low | Free |
| 3 | A funny **"duo stats" card** at the end of a chapter ("Hot Boy died 14 times"), with the game link on it | A shareable card carrying the name; worked out on the phone, no server (marketing-ideas) | Med | Free |
| 4 | Every shared homemade-level link shows **"Made in Hot Boy & Cool Girl"** and the ✅ | Every share works as an ad, and the ✅ gives a bit of status (referrals) | Low | Free |
| 5 | **Challenges:** "Beat level X without talking", "Can your duo crack your code?" | Challenges spread on their own; each team's code is different, so the answer can't be copied (marketing-ideas) | Low | Free |
| 6 | **Discord, founder-led:** hand-pick 20–50 playtesters first, post a few things yourself, then weekly "level of the week" and "fail of the week" threads | Don't open an empty server; reply to everyone yourself at first (community-marketing) | Low | Time |
| 7 | **Small creators:** free unlock codes for co-op and couples gaming creators with about 1k–50k followers. Send personal messages, a short brief (not a script), and one tracking link each; they must still tag it "#ad" | Small creators whose audience fits beat big ones (influencer-marketing) | Med | Free |
| 8 | **Store page:** captioned screenshots, a video that works on mute, and plain search words ("2 player", "co-op", "play with friends") in the description | Google searches the full description; the first 3 screenshots do most of the work (aso) | Done (video to do) | Free |
| 9 | **Ask for a review right after a win, never after a death** | People judge by the best moment and the ending; ratings drive store visibility (aso, psychology) | Low | Free |
| 10 | An **email or Discord sign-up on the website demo**; treat each new chapter as its own small launch | Social platforms are borrowed reach; keep a way to reach players yourself (launch) | Low | Free |
| 11 | **Keep $2.99; don't drop to $0.99.** Any launch discount needs a real end date | Very low prices bring "false traction"; no fake urgency (pricing, offers) | — | — |

## 7. Risks the skills flagged
- **Bad internet means bad reviews.** Keep testing online play on mobile data before each release (it worked in the 2026-10-31 test).
- **Don't use other games' names in anything public** (also hard limit L4), and never put an unsourced number in public text.
- **Ignore subscription advice** from the paywall skill: a one-time unlock with free chapters that drive sharing is right for this game.

## 8. Honest note
Most indie games earn little. What makes a co-op game spread is **people inviting their friends**, so the free chapters, the friend's pass and the instant room link matter more than the price.

## 9. To do, roughly in order
- [x] Finish the new mechanics and chapters (design doc 16.7)
- [x] Real internet test on two phones (mobile data), 2026-10-31
- [x] Free/paid decided; offer, friend's pass, settings and update check built; Android project, privacy page and store images ready (2026-10-31)
- [x] Playtests: ~20 people played the levels, 2 the whole game (2026-10-31). Still to do: write down the three numbers and quotes; set real star times
- [x] Android app built and running on the owner's phone (2026-10-31)
- [ ] Go through the "must fix before launch" list (M1–M14) in [`MARKETING_PLAN.md`](MARKETING_PLAN.md) 1.3, one item at a time
- [ ] Start posting short clips now (section 5); open the Discord founder-led (idea 6)
- [ ] **Google Play account, signed upload, closed test with 12 testers for 14 days** (`RELEASE_ANDROID.md`) ← next: the 14-day clock is the longest wait, so start it first
- [ ] Short store video (works on mute)
- [ ] Launch: switch `PAYWALL_LIVE` on, publish, reach out to small co-op creators
- [ ] Later: share card, "send to another friend", review prompt (section 6); iPhone; Steam
