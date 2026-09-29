# Content and offline verification

Run from the repository root after all artwork has been installed:

```powershell
node tools/verify-content.cjs --allow-missing-voice
node tools/test-gameplay.cjs
node tools/build-cache.cjs
node tools/test-offline.cjs
```

The content checker executes the actual HTML script order, including bootstrap, in an isolated Node VM. It checks content references, all class/background constructors, all recipe costs and outputs, rune inventory conservation, the Act III quest chain, and action handlers emitted by forge and inventory screens. Every required raster asset must exist.

`--allow-missing-voice` permits only the 17 unrecorded Act III narration clips when they also have no runtime VO metadata. They are reported separately as optional narration; cinematics use timed text. Missing earlier narration, sound effects, fonts, or artwork still fail. Without that flag, all 17 planned recordings are required. `--allow-missing-art` is a broad development-only bypass for missing files. `--manifest` rewrites `tools/missing-art.json`, so avoid it while art generation is using that worklist.

The offline test starts a fresh headless Chromium context and an ephemeral loopback HTTP server. It first rejects stale service-worker manifests, waits for installation and control, and verifies every manifest entry is in Cache Storage. It then disables networking, stops the HTTP server, reloads the game, reads every cached resource, decodes every raster image, checks dynamic artwork paths, and renders the Ember Forge. It never connects to an existing browser profile or reads user saves. Output goes to `docs/qa/offline-results.json` and `docs/qa/act3-offline-forge.png`.

The browser test requires Playwright and Chromium. It first resolves a normal `playwright` installation, then the bundled Codex runtime used by this workstation. An unavailable browser executable is an environment failure, not an offline pass.

Narration generation remains available with `python tools/build_vo.py --dry` followed by `python tools/build_vo.py`. The script reads `ELEVENLABS_API_KEY` from the environment. The attempted Act III build returned HTTP 401 before writing any clip. The 17 exact cinematic scripts are already present in `tools/vo_lines.json`; existing recordings were preserved.
