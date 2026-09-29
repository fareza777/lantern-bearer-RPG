/* Isolated browser smoke test; never connects to a user's browser or saves. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
let playwright;
try { playwright = require('playwright'); }
catch { playwright = require('C:/Users/FAJAR/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'); }

(async () => {
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  const page = await context.newPage(), errors = [], missing = new Set();
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.status() >= 400) missing.add(r.url()); });
  const out = path.resolve(__dirname, '../docs/qa'); fs.mkdirSync(out, { recursive: true });
  const click = (a, extra = '') => page.locator(`[data-a="${a}"]${extra}`).first().click();
  const audit = async () => {
    const unbound = await page.locator('[data-a]').evaluateAll(els => [...new Set(els.map(e => e.dataset.a).filter(a => typeof G.A[a] !== 'function'))]);
    assert.deepEqual(unbound, [], 'All rendered action buttons have handlers');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No viewport overflow');
  };
  const shot = async name => { await audit(); await page.waitForTimeout(350); await page.screenshot({ path: path.join(out, name + '.png'), animations: 'disabled' }); };
  try {
    await page.addInitScript(() => localStorage.setItem('gloamreach_settings', JSON.stringify({ introSeen: true, tips: false, music: 0, sfx: 0 })));
    await page.goto(process.env.GLOAM_URL || 'http://localhost:8765', { waitUntil: 'networkidle' });
    await click('splashTap'); await click('newGame');
    for (const cls of ['sunforger', 'starseer', 'veilwalker', 'chainwarden']) { await click('pickCls', `[data-k="${cls}"]`); await audit(); }
    await click('pickCls', '[data-k="sunforger"]'); await page.locator('#cname').fill('QA Lantern');
    await shot('act3-create-mobile'); await click('beginGame'); await click('onbDone');
    await page.waitForTimeout(500); await page.evaluate(() => G.UI.closeAllModals());
    await page.evaluate(() => { G.S.quests.m12 = { st: 'done', prog: 0 }; G.UI.go('loc', { k: 'hall' }); });
    await click('qOffer', '[data-q="m13"]'); await click('qAccept', '[data-q="m13"]');
    assert.equal(await page.evaluate(() => G.UI.cur.name), 'cine');
    assert(await page.evaluate(() => G.S.flags.intro3Seen && G.S.flags.act3 && G.S.flags.forge));
    await shot('act3-prologue-mobile'); await click('cineSkip');
    assert.equal(await page.evaluate(() => G.UI.cur.params.k), 'hall');
    await page.evaluate(() => { G.Engine.load(G.S.slot); G.A.qAccept({ q: 'm13' }); });
    assert(await page.evaluate(() => G.S.flags.intro3Seen && G.S.quests.m13.st === 'active' && G.UI.cur.name === 'loc'));
    await page.evaluate(() => {
      G.S.level = 60; G.S.gold = 999999; Object.assign(G.S.flags, { forge: true, act3: true, sunforge: true });
      for (const k in G.D.MATS) G.S.mats[k] = 999;
      G.UI.go('town');
    });
    await click('goLoc', '[data-k="forge"]');
    for (const cat of ['weapon', 'armor', 'jewel', 'lantern', 'consumable', 'rune']) { await click('forgeCategory', `[data-k="${cat}"]`); await audit(); }
    await shot('act3-forge-recipes-mobile');
    await click('forgeCraft', '[data-k="rune_embers"]');
    assert.equal(await page.evaluate(() => G.S.runes.embers), 1);
    await click('locTab', '[data-t="runes"]');
    const uid = await page.evaluate(() => G.S.equip.weapon.uid);
    await click('forgeSocketView', `[data-u="${uid}"]`); await shot('act3-forge-socket-mobile');
    await click('forgeSocket', '[data-k="embers"]');
    assert.equal(await page.evaluate(() => G.S.equip.weapon.rune.id), 'embers');
    await click('locTab', '[data-t="reforge"]'); await click('forgeReforgeView', `[data-u="${uid}"]`);
    await shot('act3-forge-reforge-mobile'); await click('forgeReforge');
    assert(await page.evaluate(() => G.S.flags.reforged && G.S.equip.weapon.rune.id === 'embers'));
    await click('closeModal'); await click('locTab', '[data-t="runes"]'); await click('forgeSocketView', `[data-u="${uid}"]`); await click('forgeRemoveRune');
    assert.equal(await page.evaluate(() => G.S.runes.embers), 1);
    await click('nav', '[data-t="bag"]'); await click('bagTab', '[data-t="mats"]'); await shot('act3-materials-mobile');
    for (const width of [320, 360, 430]) {
      await page.setViewportSize({ width, height: 844 }); await audit();
      for (const tab of ['craft', 'runes', 'reforge']) { await page.evaluate(t => G.UI.go('loc', { k: 'forge', tab: t }), tab); await audit(); }
      await page.evaluate(() => G.UI.go('bag', { tab: 'mats' }));
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await click('nav', '[data-t="skills"]'); await shot('act3-skills-mobile');
    await click('nav', '[data-t="journal"]'); await audit();
    for (const kind of ['everlight', 'longnight', 'sunface']) {
      await page.evaluate(k => G.Screens.playEnding(k), kind);
      await page.waitForTimeout(300); await audit(); await click('cineSkip');
      assert.equal(await page.evaluate(() => G.UI.cur.name), 'credits');
      assert.equal(await page.evaluate(() => G.S.flags.ended3), kind); await audit();
      await click('afterCredits');
    }
    await page.evaluate(() => {
      G.Dungeon.enter(9, 3);
      G.S.skills.red_hot_brand = 1; G.S.skills.temper = 1;
      G.S.attrs.vit = 150;
      const s = G.Engine.stats(); G.S.hp = s.maxHp; G.S.focus = s.maxFocus;
      G.Combat.start({ enemies: [{ id: 'orrery', lvl: 46 }], boss: true });
    });
    await page.waitForTimeout(1200); await shot('act3-orrery-combat-mobile');
    await click('cAttack'); await page.waitForFunction(() => !G.Combat.C.busy && G.Combat.C.round > 1);
    await click('cSkills'); await audit(); await click('cUseSkill', '[data-k="red_hot_brand"]');
    await page.waitForFunction(() => !G.Combat.C.busy && G.Combat.C.round > 2);
    await shot('act3-sunforger-spell-mobile');
    assert.deepEqual(errors, [], 'No JavaScript page errors');
    const result = { passed: true, screenshots: out, pageErrors: errors, missingAssets: [...missing] };
    fs.writeFileSync(path.join(out, 'browser-results.json'), JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify(result, null, 2));
  } finally { await context.close(); await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
