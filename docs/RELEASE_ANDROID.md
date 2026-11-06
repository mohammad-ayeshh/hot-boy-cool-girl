# Releasing the Android app (Google Play)

*Written 2026-10-31. The game code, the purchase, the Android project (`android/`), the privacy page and the store images are ready.
These are the steps only you can do, because they need your PC setup, your Google account and your money.*

## 0. Before you start
- ⚠️ **Stranger playtest of Chapter 1 and a phone playtest of Chapters 2–6** are still open (MARKETING.md). Do them before the public launch.
- The app ID is `io.github.mohammadayeshh.hotboycoolgirl`. **It can never change after the first upload.** Change it now in `capacitor.config.ts` and `src/game/unlock.ts` if you want another.

## 1. Install Android Studio (once)
1. Download Android Studio from developer.android.com/studio and install it with the default options (it brings Java and the Android SDK).
2. Open it once and let it finish downloading its components.

*Done 2026-10-31 from the command line instead:* `winget install Google.AndroidStudio` (2026.2.2, brings Java 25 in `C:\Program Files\Android\Android Studio\jbr`), the SDK command-line tools in `%LOCALAPPDATA%\Android\Sdk`, then `android sdk install platforms/android-36 build-tools/36.0.0` plus platform-tools. `JAVA_HOME` and `ANDROID_HOME` are set for the user.
Gradle 8.14 can't run on Java 25 ("Unsupported class file major version 69"), so the wrapper is now **Gradle 9.1.0** (`android/gradle/wrapper/gradle-wrapper.properties`); `gradlew assembleDebug` builds. If `npx cap` ever regenerates `android/`, set it again.

## 2. Put the game into the app and try it on your phone
```bash
npm run app:sync
```
```bash
npm run app:open
```
- `app:sync` builds the game for the app and copies it into `android/`; run it after every game change.
- `app:open` opens the project in Android Studio. Plug in your phone with USB debugging on (Settings › About phone › tap "Build number" 7 times › Developer options › USB debugging) and press the green ▶ Run button.
- Purchases don't work yet in this test build; that needs step 4.

**Easier: the test APK from GitHub (no Android Studio, no cable).** Every push to `main` builds the app on GitHub
(`.github/workflows/android-apk.yml`) and puts it on one fixed link. Open it on the phone, download, tap the file and allow
"install unknown apps" for your browser once:
https://github.com/mohammad-ayeshh/hot-boy-cool-girl/releases/download/apk/hot-boy-cool-girl.apk
- It's signed with the project's **test key** (the `ANDROID_TEST_KEYSTORE` secret on GitHub), never the Google Play key, so
  each new APK installs over the last one and keeps your progress. Without the secret every build gets a random key and
  you'd have to uninstall before installing the next one.
- Purchases don't work in it. **Uninstall it before installing the app from Google Play** (same app, different key).
- Building takes about 5 minutes after a push: see the **Actions** tab on GitHub.

## 3. Make the upload file (signed app bundle)
1. In Android Studio: **Build › Generate Signed App Bundle or APK › Android App Bundle**.
2. **Create new** key store. Save it **outside** the project folder, and **back up the file and both passwords** (a password manager plus a second copy). Losing them makes updates very hard.
3. Choose **release**. The file appears in `android/app/release/app-release.aab`.
4. For every later upload, raise `versionCode` (and `versionName`) in `android/app/build.gradle`.

## 4. Google Play Console
1. Sign up at play.google.com/console ($25 once, identity check). Choose a **personal** account unless you have a company.
2. **Create app**: name "Hot Boy & Cool Girl", game, free.
3. Fill the forms with the answers in [`store/google-play.md`](store/google-play.md): privacy policy URL, ads (no), data safety, content rating, target audience.
4. **Store listing**: paste the text and upload the images from `docs/store/`.
5. **Testing › Internal testing**: upload the `.aab`, add your own Gmail as a tester, install from the link.
6. **Monetize › In-app products** (appears after the first upload): create `full_game`, one-time, $2.99, and activate it.
7. **Settings › License testing**: add your Gmail, so you can buy the unlock in tests without being charged. Test buying it, and test **Restore my purchase** after reinstalling.
8. New personal accounts must run a **closed test with at least 12 testers for 14 days** before going public. Friends and family count; they need to stay opted in the whole time.

## 5. Launch day
1. In `src/game/unlock.ts` set `PAYWALL_LIVE = true` (until then Chapter 3 and up stay open on the website, and the lock only shows with `?paywall`).
2. `npm run app:sync`, raise `versionCode`, build a new signed bundle, and send it to **Production**.
3. Push the website at the same time, so the website becomes the free demo (Chapters 1–2) with a "Get the app" button.
4. Website players who already finished Chapter 3 or later will see those chapters locked: say so in your launch post (or decide to give them something).

## Good to know
- The app and the website can play together. Friends only need the same *play version* (same levels, physics and network messages), not the same build (`src/game/version.ts`).
- Ownership is saved on the phone and restored from Google Play on a new phone. There is no server, so a technical player could fake it; that's accepted (doc 13.6, no anti-cheat).
- iPhone (App Store, $99/year) needs a Mac or a cloud build service, plus the App Store product in `src/shop/billing.ts`. Later.
