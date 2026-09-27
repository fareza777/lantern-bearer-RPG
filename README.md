# GLOAMREACH: Chronicle of the Last Lantern

A dark fantasy, text-driven dungeon crawler RPG for portrait mobile. It runs fully offline and saves locally. It is plain HTML, CSS and JavaScript with no build step and no dependencies.

## Play it

**Windows:** double-click `start.bat`. It starts a local server on port 8765 and opens `http://localhost:8765`. It uses Python 3 if installed, otherwise Node (`npx http-server`).

**Any OS:**

```
cd "E:\New Grim Clone Factory"
python -m http.server 8765
```

Then open `http://localhost:8765`. Use the browser's device toolbar (F12, then the phone icon) for a portrait phone view.

A server is required. Opening `index.html` straight from disk works for play, but the service worker (offline cache) only runs over `http://`.

**On a phone (same Wi-Fi):** run the server, find your PC's IP with `ipconfig`, and open `http://<PC-IP>:8765` on the phone. To install it as an app, use Chrome's menu and choose "Add to Home screen". After the first load it works offline.

## The core loop

1. **Town (Candlemere):** take main quests and bounties at the Wardens' Hall, shop, upgrade gear, rest, cleanse Dread.
2. **The Gloam Gate:** pick a zone and starting floor.
3. **Explore:** move room by room on a fogged 5x7 map. Rooms hold fights, events, traps, shrines, treasure, camps and a wandering merchant. Light drains as you go.
4. **Fight or choose:** turn-based combat against telegraphed enemy intents, or text events with attribute checks.
5. **Rewards:** gold, XP, materials, 5 rarities of gear, uniques, codex lore.
6. **Upgrade:** level up (attributes and skill points), equip, upgrade and salvage gear, then go deeper.

The story spans two acts. Act I: the first three zones and their bosses. Act II: **The Hungering Dark**, three new zones (the Ashen Archive, the Sunless Court, the Gloamheart) plus the Gallows Wood side dungeon, two new playable classes (Gravecaller and Duskwarden), and a final choice with 4 endings, then the Endless Undercroft. Level cap is 40.

Death: you lose 30% of carried gold and wake in town. In Hardcore, the save is deleted.

## Content at a glance

- 6 classes, 8 backgrounds, 72 skills
- 8 zones, 58 enemies with painted art, 12 bosses and elites with mechanics
- 82 gear bases, 18 uniques (some only drop from their boss), 13 consumables
- 34 quests, 56 exploration events, 41 codex entries, 22 rumors
- Cinematic intro and endings: painted keyframes with Ken Burns motion, ElevenLabs voice-over and synced subtitles (narration volume in Settings)

## Saves

- 3 save slots in the browser's `localStorage`. Autosaves after every meaningful action.
- Export and import saves as text from Settings, in the Data section. Export appears when opened from inside a game.
- Clearing browser site data deletes saves. Export first.

## Project layout

```
index.html              entry point
manifest.webmanifest    PWA manifest (portrait, standalone)
sw.js                   offline cache (bump CACHE when shipping changes)
css/style.css           all styles, animations and combat effects
js/util.js              helpers, icons, art paths, version
js/engine.js            state, saves, stats, items, quests, economy
js/fx.js                combat animation and visual effects engine
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
```

## Publishing to Google Play (Capacitor)

The game is a static web app, so it can be wrapped into an Android app with Capacitor.

1. Install Node.js 18+ and Android Studio (with an SDK and JDK 17).
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
