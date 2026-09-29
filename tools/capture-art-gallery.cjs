/* Read-only isolated gallery capture. Usage: node tools/capture-art-gallery.cjs [foe|item|unique|cons|mat|qitem|rune] */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
let playwright;
try { playwright = require('playwright'); }
catch { playwright = require('C:/Users/FAJAR/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'); }
const group = process.argv[2] || 'foe';
assert(['foe', 'item', 'unique', 'cons', 'mat', 'qitem', 'rune'].includes(group));
(async () => {
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 1000 }, serviceWorkers: 'block' });
  const page = await context.newPage();
  try {
    await page.goto((process.env.GLOAM_URL || 'http://localhost:8765') + '/docs/qa/art-gallery.html');
    const section = page.locator('#' + group);
    const result = await section.locator('img').evaluateAll(async images => {
      const failed = [];
      await Promise.all(images.map(async img => { img.loading = 'eager'; try { await img.decode(); } catch { failed.push(img.alt); } }));
      return { total: images.length, failed };
    });
    assert.deepEqual(result.failed, [], 'Gallery has broken or missing images');
    const out = path.resolve(__dirname, '../docs/qa'); fs.mkdirSync(out, { recursive: true });
    const name = group === 'foe' ? 'enemy' : group;
    await section.screenshot({ path: path.join(out, `act3-${name}-gallery.png`) });
    const figures = await section.locator('figure').count();
    for (let i = 0; i < figures; i += 6) {
      await section.evaluate((el, start) => {
        const row = document.createElement('div'); row.id = 'qa-capture-row'; row.className = el.querySelector('.grid').className;
        row.style.gridTemplateColumns = 'repeat(6,minmax(0,1fr))';
        [...el.querySelectorAll('figure')].slice(start, start + 6).forEach(figure => row.appendChild(figure.cloneNode(true)));
        document.body.appendChild(row);
      }, i);
      await page.locator('#qa-capture-row').screenshot({ path: path.join(out, `act3-${name}-gallery-row${1 + i / 6}.png`) });
      await page.locator('#qa-capture-row').evaluate(row => row.remove());
    }
    console.log(JSON.stringify({ ...result, screenshot: path.join(out, `act3-${name}-gallery.png`) }));
  } finally { await context.close(); await browser.close(); }
})().catch(e => { console.error(e.stack); process.exitCode = 1; });
