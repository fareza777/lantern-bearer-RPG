# GLOAMREACH: Chronicle of the Last Lantern

A dark fantasy, text-driven dungeon crawler RPG for portrait mobile. The web game uses plain HTML, CSS and JavaScript, with no runtime dependencies or application build step. Saves stay on your device. Offline play is available after the service worker finishes caching the game on a supported secure origin.

## Play it

**Windows:** double-click `start.bat`. It starts a local server on port 8765 and opens `http://localhost:8765`. It uses Python 3 if installed, otherwise Node (`npx http-server`).

**Any OS:**

```
cd "E:\New Grim Clone Factory"
python -m http.server 8765
```

Then open `http://localhost:8765`. Use the browser's device toolbar (F12, then the phone icon) for a portrait phone view.

A server is recommended. Use `http://localhost:8765` for local development; service workers accept localhost as a secure origin. Opening `index.html` from disk does not enable offline caching.

**On a phone (same Wi-Fi):** run the server, find your PC's IP with `ipconfig`, and open `http://<PC-IP>:8765` on the phone. This is useful for previewing, but ordinary LAN HTTP does **not** enable service-worker caching or reliable offline installation.

**Install for offline play:** host the complete game folder over HTTPS, open it on the phone, and let the initial download finish. In Android Chrome, choose **Install app** or **Add to Home screen** from the menu. On iPhone, use Safari's Share menu, then **Add to Home Screen**. Open the installed app while online once, then verify that it launches in airplane mode. Saves belong to the browser/app origin; use export/import when moving between hosts or installations.

## The core loop

1. **Town (Candlemere):** take main quests and bounties at the Wardens' Hall, shop, upgrade gear, rest, cleanse Dread.
2. **The Gloam Gate:** pick a zone and starting floor.
3. **Explore:** move room by room on a fogged 5x7 map. Rooms hold fights, events, traps, shrines, treasure, camps and a wandering merchant. Light drains as you go.
4. **Fight or choose:** turn-based combat against telegraphed enemy intents, or text events with attribute checks.
5. **Rewards:** gold, XP, materials, 5 rarities of gear, uniques, codex lore.
6. **Upgrade:** level up (attributes and skill points), equip, upgrade and salvage gear, then go deeper. In Act III, craft at the Ember Forge, socket runes, and reforge equipment.

The story spans three acts, with a **level cap of 60**. Act I begins beneath Candlemere. Act II, **The Hungering Dark**, adds the Ashen Archive, Sunless Court, Gloamheart and Gallows Wood. Act III, **The Sunless Dawn**, continues with the Black Noon, Drowned Observatory, Cinderwaste, Hall of Nine Lamps and Sunken Sun, plus the Weeping Mines and Moth Warren side dungeons. The Endless Undercroft remains available for deeper expeditions.

Choose among ten classes from level 1: Sellsword, Nightblade, Ashwright, Penitent, Gravecaller, Duskwarden, **Sunforger, Starseer, Veilwalker and Chainwarden**. Act III adds three final choices and endings, bringing the full chronicle to seven endings.

Accept **The Black Noon** at the Wardens' Hall after completing Act II's main quest chain to unlock Vashti's **Ember Forge**. Its 76 recipes cover equipment, supplies and runes. Materials and level requirements appear on each recipe; advanced recipes unlock after the Sunforger quest. Each item accepts one compatible rune. Removing or replacing it returns the old rune to your collection. Reforging rerolls non-unique equipment while preserving its upgrade level and rune. Tempering equipment uses the existing smith upgrade service.

Death: you lose 30% of carried gold and wake in town. In Hardcore, the save is deleted.

## Content at a glance

- 10 classes, 12 backgrounds, 148 skills
- 14 zones, 98 enemies
- 137 gear bases, 43 uniques, 25 consumables
- 62 quests, 111 exploration events, 78 codex entries, 34 rumors
- 76 crafting recipes, 16 runes, 7 endings
- Cinematic prologues and endings with painted keyframes, motion, music and subtitles

These counts come from the data loaded by `index.html`. Act III narration scripts are prepared, but **17 new voice clips are unavailable** because the ElevenLabs request returned HTTP 401. Act III cinematics use adaptive text subtitles and existing music; earlier available narration remains supported. Narration volume is in Settings.

## Saves

- 3 save slots in the browser's `localStorage`. Autosaves after every meaningful action.
- Export and import saves as text from Settings, in the Data section. Export appears when opened from inside a game.
- Clearing browser site data deletes saves. Export first.
- Loading older saves adds missing material/rune containers and Act III progression flags where appropriate. Existing characters, items and earlier ending flags remain intact; no restart is required. Keep an exported backup before changing versions.

## Validation and offline cache

Run from the project root with Node.js:

```sh
node tools/verify-content.cjs --allow-missing-voice
node tools/test-gameplay.cjs
node tools/build-cache.cjs
node tools/test-offline.cjs
```

The content checker validates loaded data, references, recipes and UI action bindings. The voice flag permits the documented missing narration only; missing art still fails validation. While preparing artwork, `--allow-missing-art` can be used for functional checks, but it is not a release completeness check.

Regenerate the offline manifest with `build-cache.cjs` whenever scripts or assets change, and bump `G.VERSION` before shipping a new cached release. The offline checker starts its own temporary server and verifies service-worker installation and offline loading in an isolated Chromium context.

With the web server running on port 8765, run the interaction suite:

```sh
node tools/test-browser.cjs
```

It covers class creation, the Act III prologue, Forge crafting/socketing/reforging, inventory, mobile layouts, all three new endings, and representative boss combat. Set `GLOAM_URL` to test another server. Results and screenshots are written to `docs/qa/`. Browser tests require Playwright and its Chromium browser; they use an installed package or the bundled Codex runtime when available. They never connect to the user's browser or reuse personal saves.

## Project layout

```
index.html              entry point
manifest.webmanifest    PWA manifest (portrait, standalone)
sw.js                   generated offline cache manifest and service worker
css/style.css           all styles, animations and combat effects
js/util.js              helpers, icons, version
js/engine.js            state, saves, stats, items, quests, economy
js/fx.js                art paths, combat animation and visual effects engine
js/ui.js                screen manager, modals, toasts, tap dispatcher
js/screens.js           splash, intro, menu, load, settings, create, onboarding, ending
js/town.js              Candlemere and its locations
js/hero.js              hero sheet, bag, skills, journal
js/dungeon.js           map generation, rooms, events, bosses
js/combat.js            turn-based combat
js/audio.js             procedural music and sound (WebAudio) plus voice-over playback
js/cine.js              cinematic player: keyframe slides, voice-over, subtitles
js/data/*.js            classes, skills, items, enemies, zones, quests, events, lore
assets/                 painted art (webp/jpg), voice-over clips (mp3) and app icons
tools/process_art.py    crops and converts generated art
tools/build_vo.py       regenerates voice-over clips (needs ELEVENLABS_API_KEY)
tools/gen_fal.py        image generation helper (needs FAL_KEY)
tools/build-cache.cjs   regenerates the offline file manifest
tools/verify-content.cjs content/reference/asset validation
tools/test-gameplay.cjs engine and combat regression tests
tools/test-browser.cjs  isolated mobile browser interaction tests
tools/test-offline.cjs  service-worker and offline loading test
```

## Publishing to Google Play (Capacitor)

The game is a static web app, so it can be wrapped into an Android app with Capacitor.

The new [gloamreach-act3-debug.apk](gloamreach-act3-debug.apk) contains the finalized Act III source: versionCode **2**, versionName **3.0.0**, about **21.15 MiB**. Its offline Gradle build and APK signature checks passed, and all 447 bundled runtime files match the web source byte-for-byte. It uses the same debug signing certificate as the preserved older `gloamreach-debug.apk`. It has **not been tested on an Android device** and is a local debug build, not a signed Play release. See [build instructions and checksums](docs/android-build.md) and [release validation](docs/release-validation.md).

1. Install Node.js, Android Studio, an Android SDK and a JDK compatible with the Capacitor version used by your wrapper project. Follow that version's requirements rather than assuming an older SDK/JDK combination will work.
2. Copy the game into a `www` folder inside a new project:

```
mkdir gloamreach-app
cd gloamreach-app
npm init -y
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init Gloamreach com.hollowlantern.gloamreach --web-dir www
```

   Then copy `index.html`, `manifest.webmanifest`, `sw.js`, `css`, `js` and `assets` into `www`.

3. Add Android and open it:

```
npx cap add android
npx cap sync android
npx cap open android
```

4. In Android Studio, lock the orientation to portrait. In `android/app/src/main/AndroidManifest.xml`, add `android:screenOrientation="portrait"` to the main `<activity>`. Replace the launcher icons (right-click `res`, then New, then Image Asset, and use `assets/icons/icon-512.png`).
5. Set `versionCode` and `versionName` in `android/app/build.gradle`.
6. Build a signed release bundle: Build, then Generate Signed Bundle / APK, then Android App Bundle. Keep the keystore safe; you need it for every future update.
7. Upload the `.aab` in the Google Play Console. You also need a privacy policy URL (the game collects no data), a content rating questionnaire, store screenshots and a 512x512 icon.

After changing game files, copy them into `www` again and run `npx cap sync android`.

Notes:
- Saves use WebView `localStorage`. They persist across app updates but are erased if the user clears app data.
- The service worker is harmless inside Capacitor, since the files are already bundled.
- The "Rate" and "Share" buttons use the package id in `js/util.js` (`G.PKG`). Change it there if you use a different application id.
