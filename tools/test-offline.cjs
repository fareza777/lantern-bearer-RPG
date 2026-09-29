/* Real Chromium service-worker test in a fresh isolated profile and ephemeral local server.
 * Run node tools/build-cache.cjs after assets land, then node tools/test-offline.cjs.
 * Never connects to the user's browser or reads their saves; no project dependencies required.
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const vm = require('node:vm');
const crypto = require('node:crypto');
let playwright;
try { playwright = require('playwright'); }
catch { playwright = require('C:/Users/FAJAR/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'); }
const root = path.resolve(__dirname, '..');
const walk = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(`${dir}/${e.name}`) : [`./${dir}/${e.name}`]);
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const swContext = { self: { addEventListener() {} } };
vm.createContext(swContext);
vm.runInContext(sw + '\nthis.manifest = { cache: CACHE, files: FILES };', swContext);
const manifest = JSON.parse(JSON.stringify(swContext.manifest));
const expected = ['./', './index.html', './manifest.webmanifest', ...['css', 'js', 'assets'].flatMap(walk)];
assert.deepEqual([...manifest.files].sort(), expected.sort(), 'Service worker manifest is stale: run node tools/build-cache.cjs');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('Missing'); return; }
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(data);
  });
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'allow' });
  const page = await context.newPage(), errors = [], badResponses = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) badResponses.push(`${response.status()} ${response.url()}`); });
  const result = { cache: manifest.cache, manifestFiles: manifest.files.length };
  try {
    await page.addInitScript(() => localStorage.setItem('gloamreach_settings', JSON.stringify({ introSeen: true, tips: false, music: 0, sfx: 0 })));
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 60000 });
    const absent = await page.evaluate(async ({ cacheName, files }) => {
      const cache = await caches.open(cacheName), missing = [];
      for (const file of files) if (!(await cache.match(new URL(file, location.href)))) missing.push(file);
      return missing;
    }, { cacheName: manifest.cache, files: manifest.files });
    assert.deepEqual(absent, [], 'Every manifest resource must finish precaching');
    await context.setOffline(true);
    await new Promise(resolve => server.close(resolve));
    await page.reload({ waitUntil: 'networkidle' });
    assert(await page.evaluate(() => !!navigator.serviceWorker.controller && !!G.D.QUESTS.m20 && Object.keys(G.D.CLASSES).length === 10), 'Offline reload must load all Act III scripts');
    const failedFetches = await page.evaluate(async files => {
      const failures = [];
      for (let i = 0; i < files.length; i += 16) await Promise.all(files.slice(i, i + 16).map(async file => {
        try { const r = await fetch(file); if (!r.ok || !(await r.arrayBuffer()).byteLength) failures.push(file); }
        catch { failures.push(file); }
      }));
      return failures;
    }, manifest.files);
    assert.deepEqual(failedFetches, [], 'All precached files must be readable with network offline and server stopped');
    const images = manifest.files.filter(file => /\.(png|webp|jpg)$/i.test(file));
    const imageAudit = await page.evaluate(async files => {
      const failures = [], dimensions = {}, opaqueSprites = [];
      for (let i = 0; i < files.length; i += 12) await Promise.all(files.slice(i, i + 12).map(async file => {
        const image = new Image(); image.src = file;
        try {
          await image.decode();
          dimensions[file] = [image.naturalWidth, image.naturalHeight];
          if (image.naturalWidth < 16 || image.naturalHeight < 16) failures.push(file + ': too small');
          const canvas = document.createElement('canvas'); canvas.width = 32; canvas.height = 32;
          const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0, 32, 32);
          const pixels = ctx.getImageData(0, 0, 32, 32).data;
          let visible = false, transparency = false;
          for (let j = 3; j < pixels.length; j += 4) { if (pixels[j] > 0) visible = true; if (pixels[j] < 255) transparency = true; }
          if (!visible) failures.push(file + ': fully transparent image');
          if (/assets\/(hero|foe|items)\//.test(file) && !transparency) opaqueSprites.push(file);
        }
        catch { failures.push(file + ': decode failed'); }
      }));
      return { failures, dimensions, opaqueSprites };
    }, images);
    assert.deepEqual(imageAudit.failures, [], 'Every raster asset must decode offline at a usable size and contain visible pixels');
    const hashes = new Map();
    for (const file of images) {
      const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
      if (!hashes.has(hash)) hashes.set(hash, []); hashes.get(hash).push(file);
    }
    const duplicateFiles = [...hashes.values()].filter(group => group.length > 1);
    const missingRuntimeArt = await page.evaluate(async () => {
      const urls = new Set();
      for (const id of Object.keys(G.D.CLASSES)) urls.add(G.ART.hero(id));
      for (const id of Object.keys(G.D.ENEMIES)) urls.add(G.ART.foe({ id }));
      for (const id of Object.keys(G.D.BASES)) urls.add(G.ART.item({ base: id }));
      for (const id of Object.keys(G.D.UNIQUES)) urls.add(G.ART.item({ unique: id }));
      for (const [table, fn] of Object.entries({ CONS: 'cons', MATS: 'mat', QITEMS: 'qitem' })) for (const id in G.D[table]) urls.add(G.ART[fn](id));
      for (const z of Object.values(G.D.ZONES)) urls.add(`assets/img/${z.img}.jpg`);
      for (const id in G.D.RUNES) urls.add(`assets/items/r_${id}.webp`);
      for (const slide of [...G.D.INTRO3, ...Object.values(G.D.ENDINGS).flatMap(e => e.slides)]) urls.add(`assets/img/${slide.img}.jpg`);
      const missing = [];
      for (const file of urls) if (!(await caches.match(new URL(file, location.href)))) missing.push(file);
      return missing;
    });
    assert.deepEqual(missingRuntimeArt, [], 'Every dynamic artwork reference must be cached');
    await page.evaluate(() => {
      const p = G.Engine.newGame({ cls: 'sunforger', bg: Object.keys(G.D.BACKGROUNDS)[0], name: 'Offline QA', slot: 1 });
      p.flags.forge = true; p.flags.act3 = true; p.flags.sunforge = true; p.level = 60;
      G.Engine.save(); G.UI.go('loc', { k: 'forge', tab: 'craft', cat: 'rune' });
    });
    assert(await page.locator('[data-a="forgeCraft"]').count() > 0, 'Forge must render offline');
    assert.deepEqual(errors, [], 'No uncaught browser errors');
    assert.deepEqual(badResponses, [], 'No HTTP failures');
    const out = path.join(root, 'docs', 'qa'); fs.mkdirSync(out, { recursive: true });
    await page.screenshot({ path: path.join(out, 'act3-offline-forge.png'), animations: 'disabled' });
    Object.assign(result, { status: 'PASS', offlineFilesRead: manifest.files.length, offlineImagesDecoded: images.length, controller: true, serverStopped: true });
    fs.writeFileSync(path.join(out, 'raster-audit.json'), JSON.stringify({ dimensions: imageAudit.dimensions, opaqueSprites: imageAudit.opaqueSprites, duplicateFiles, note: 'Opaque sprites and identical files are review findings, not automatic failures.' }, null, 2) + '\n');
    fs.writeFileSync(path.join(out, 'offline-results.json'), JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await context.close(); await browser.close(); if (server.listening) await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error.stack); if (server.listening) server.close(); process.exitCode = 1; });
