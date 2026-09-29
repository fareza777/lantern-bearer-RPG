#!/usr/bin/env node
/* No dependencies: validate the shipped browser script order and every content reference.
 * node tools/verify-content.cjs [--allow-missing-voice] [--allow-missing-art] [--manifest]
 * --manifest writes the remaining art worklist to tools/missing-art.json.
 * This checks content integration in a VM; it does not replace browser interaction tests.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const errors = [];
let assertions = 0;
const check = (condition, message) => { assertions++; if (!condition) errors.push(message); };
const html = read('index.html');
const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(m => m[1]);
check(new Set(scripts).size === scripts.length, 'index.html has duplicate scripts');
for (const stem of ['items', 'skills', 'enemies', 'lore', 'quests', 'events']) {
  const file = `js/data/${stem}3.js`, i = scripts.indexOf(file);
  check(i > scripts.indexOf('js/fx.js') && i < scripts.indexOf('js/screens.js'), `${file} must load after fx.js and before screens.js`);
  check(scripts.indexOf(`js/data/${stem}.js`) >= 0 && scripts.indexOf(`js/data/${stem}.js`) < i, `${file} must load after its base table`);
}
const storage = new Map();
const node = () => ({ style: {}, classList: { add() {}, remove() {} }, appendChild() {}, remove() {}, setAttribute() {}, querySelector: () => null, querySelectorAll: () => [], innerHTML: '' });
const ctx = {
  console, navigator: {}, location: { protocol: 'file:' },
  document: { hidden: false, documentElement: node(), body: node(), addEventListener() {}, getElementById: node, querySelector: () => null, querySelectorAll: () => [], createElement: node },
  localStorage: { getItem: k => storage.get(k) || null, setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) },
  setTimeout() {}, clearTimeout() {}, setInterval() {}, clearInterval() {}, requestAnimationFrame() {}, cancelAnimationFrame() {},
  addEventListener() {}, performance: { now: () => 0 },
};
ctx.window = ctx;
vm.createContext(ctx);
for (const file of scripts) {
  try { vm.runInContext(read(file), ctx, { filename: file, timeout: 5000 }); }
  catch (e) { errors.push(`${file}: ${e.stack}`); }
}
const G = ctx.G, D = G && G.D;
if (!D || !D.RECIPES || !D.ZONES[14]) {
  console.error(errors.join('\n') || 'Act III data did not load'); process.exit(1);
}
const ref = (table, id, where) => check(id != null && Object.hasOwn(D[table] || {}, id), `${where}: unknown ${table} '${id}'`);
const entries = table => Object.entries(D[table] || {});
const walk = (value, visit, p = '') => {
  if (!value || typeof value !== 'object') return;
  visit(value, p);
  for (const [k, v] of Object.entries(value)) walk(v, visit, `${p}.${k}`);
};
walk(D, (v, p) => { if (v.ic) check(!!G.ICONS[v.ic], `${p}: unknown icon '${v.ic}'`); });
for (const [id, c] of entries('CLASSES')) {
  for (const [slot, base] of Object.entries(c.gear)) { ref('BASES', base, `class ${id}`); check(D.BASES[base]?.slot === slot, `${id}: ${base} in incorrect ${slot} slot`); }
  c.skills.forEach(sk => ref('SKILLS', sk, `class ${id}`));
  check(new Set(c.skills).size === c.skills.length, `${id}: duplicate skills`);
}
for (const [id, u] of entries('UNIQUES')) ref('BASES', u.base, `unique ${id}`);
for (const [id, z] of entries('ZONES')) {
  if (z.boss) ref('ENEMIES', z.boss, `zone ${id}`);
  if (z.elite) ref('ENEMIES', z.elite, `zone ${id}`);
  z.pool.forEach(([e, weight]) => { ref('ENEMIES', e, `zone ${id} pool`); check(weight > 0, `zone ${id}: nonpositive weight`); });
  if (z.req?.startsWith('boss_')) ref('ENEMIES', z.req.slice(5), `zone ${id} gate`);
  check(z.floors > 0 && z.rooms.length > 0, `zone ${id}: missing floors/rooms`);
}
for (const [id, e] of entries('ENEMIES')) {
  if (e.unique) ref('UNIQUES', e.unique, `enemy ${id}`);
  if (e.drop) { ref('QUESTS', e.drop.q, `enemy ${id} drop`); ref('QITEMS', e.drop.item, `enemy ${id} drop`); }
  check(!!D.FOE_FX[id], `enemy ${id}: no visual profile`);
  walk(e, (v, p) => { if (v.summon) ref('ENEMIES', v.summon, `enemy ${id}${p}`); });
}
const effects = (fx, where, zone = 1) => {
  if (typeof fx === 'function') { try { fx = fx(zone); } catch (e) { check(false, `${where}: effect throws: ${e.message}`); return; } }
  if (!fx) return;
  for (const [key, table] of Object.entries({ cons: 'CONS', mats: 'MATS' })) if (fx[key]) Object.keys(fx[key]).forEach(id => ref(table, id, where));
  for (const [key, table] of Object.entries({ qitem: 'QITEMS', codex: 'CODEX', end: 'ENDINGS', unique: 'UNIQUES' })) if (fx[key] && !(key === 'codex' && fx[key] === 'random')) ref(table, fx[key], where);
  if (Array.isArray(fx.fight)) fx.fight.forEach(id => ref('ENEMIES', id, where));
  else if (fx.fight) check(fx.fight === 'zone', `${where}: invalid fight pool '${fx.fight}'`);
};
for (const [id, q] of entries('QUESTS')) {
  ref('NPCS', q.giver, `quest ${id}`);
  if (q.pre) ref('QUESTS', q.pre, `quest ${id} prerequisite`);
  if (q.codex) ref('CODEX', q.codex, `quest ${id}`);
  if (q.obj.t === 'kill') ref('ENEMIES', q.obj.id, `quest ${id} objective`);
  if (q.obj.t === 'item') ref('QITEMS', q.obj.id, `quest ${id} objective`);
  if (q.obj.zone) ref('ZONES', q.obj.zone, `quest ${id}`);
  if (q.ev) { ref('EVENTS', q.ev.id, `quest ${id}`); ref('ZONES', q.ev.zone, `quest ${id}`); check(q.ev.floors.every(f => f > 0 && f <= D.ZONES[q.ev.zone]?.floors), `quest ${id}: event floor out of bounds`); }
  effects(q.reward, `quest ${id} reward`);
  const seen = new Set([id]); let pre = q.pre;
  while (pre && D.QUESTS[pre]) { if (seen.has(pre)) { check(false, `quest ${id}: prerequisite cycle`); break; } seen.add(pre); pre = D.QUESTS[pre].pre; }
}
let outcomes = 0;
for (const [id, ev] of entries('EVENTS')) {
  (ev.zones || []).forEach(z => ref('ZONES', z, `event ${id}`));
  check(ev.choices?.length > 0, `event ${id}: no choices`);
  for (const [i, choice] of (ev.choices || []).entries()) {
    if (choice.req?.cls) ref('CLASSES', choice.req.cls, `event ${id}`);
    if (choice.req?.cons) ref('CONS', choice.req.cons, `event ${id}`);
    for (const branch of ['out', 'ok', 'no']) if (choice[branch]) {
      outcomes++;
      for (const z of ev.zones || [1, 14]) effects(choice[branch].fx, `event ${id} choice ${i} ${branch}`, z);
    }
    check(choice.out || (choice.check && choice.ok && choice.no), `event ${id} choice ${i}: incomplete branches`);
  }
}
for (const [id, r] of entries('RECIPES')) {
  Object.keys(r.mats).forEach(mat => ref('MATS', mat, `recipe ${id}`));
  check(Object.values(r.mats).every(n => n > 0) && r.gold >= 0 && r.lvl > 0, `recipe ${id}: invalid costs`);
  for (const [key, table] of Object.entries({ base: 'BASES', cons: 'CONS', rune: 'RUNES' })) if (r.out[key]) ref(table, r.out[key], `recipe ${id}`);
  check(['base', 'cons', 'rune'].filter(k => r.out[k]).length === 1, `recipe ${id}: ambiguous output`);
}
for (const drop of D.MAT_DROPS) { ref('MATS', drop.mat, 'material drop'); check(drop.chance > 0 && drop.chance <= 1, `${drop.mat}: invalid drop probability`); }
// Exercise real constructors, rendering, crafting and quest rewards using in-memory saves.
// UI animation/audio are isolated; gameplay methods and screen templates remain real.
G.UI.toast = () => {}; G.Audio.sfx = () => {};
const smoke = (name, fn) => { try { fn(); } catch (e) { check(false, `${name}: ${e.stack}`); } };
for (const [cls] of entries('CLASSES')) for (const [bg] of entries('BACKGROUNDS')) smoke(`new game ${cls}/${bg}`, () => {
  const p = G.Engine.newGame({ cls, bg, name: 'Content audit', slot: 1 });
  check(Number.isFinite(p.hp) && p.hp > 0 && Number.isFinite(p.focus), `${cls}/${bg}: invalid starting vitals`);
  check(Object.keys(p.zp).length === entries('ZONES').length, `${cls}/${bg}: missing zone progress`);
});
smoke('Act III forge and screens', () => {
  const p = G.Engine.newGame({ cls: 'sunforger', bg: Object.keys(D.BACKGROUNDS)[0], name: 'Forge audit', slot: 1 });
  p.level = 60; p.flags.forge = true; p.flags.sunforge = true; p.gold = 10000000;
  for (const [id] of entries('MATS')) p.mats[id] = 10000;
  for (const [id, r] of entries('RECIPES')) {
    p.bag = [];
    const gold = p.gold, matBefore = { ...p.mats }, consBefore = p.cons[r.out.cons] || 0, runeBefore = p.runes[r.out.rune] || 0;
    check(G.Engine.craft(id) === true, `craft ${id}: failed with fulfilled requirements`);
    check(p.gold === gold - r.gold, `craft ${id}: incorrect gold cost`);
    for (const [mat, n] of Object.entries(r.mats)) check(p.mats[mat] === matBefore[mat] - n, `craft ${id}: incorrect ${mat} cost`);
    if (r.out.base) check(p.bag.length === 1 && p.bag[0].base === r.out.base, `craft ${id}: incorrect gear output`);
    if (r.out.cons) check(p.cons[r.out.cons] === consBefore + (r.out.n || 1), `craft ${id}: incorrect consumable output`);
    if (r.out.rune) check(p.runes[r.out.rune] === runeBefore + 1, `craft ${id}: incorrect rune output`);
  }
  for (const [id, rune] of entries('RUNES')) {
    const base = entries('BASES').find(([, b]) => rune.slots.includes(b.slot))[0];
    const it = G.Engine.makeItem(base, 60, 2); p.bag = [it]; p.runes[id] = 1;
    check(G.Engine.socketRune(it.uid, id) && p.runes[id] === 0 && it.rune.id === id, `rune ${id}: socket failed`);
    check(G.Engine.removeRune(it.uid) && p.runes[id] === 1 && !it.rune, `rune ${id}: removal did not conserve inventory`);
  }
  const rendered = [];
  for (const cat of ['weapon', 'armor', 'jewel', 'lantern', 'consumable', 'rune']) rendered.push(G.Screens.loc.render({ k: 'forge', tab: 'craft', cat }));
  for (const tab of ['runes', 'reforge']) rendered.push(G.Screens.loc.render({ k: 'forge', tab }));
  for (const tab of ['gear', 'items', 'mats']) rendered.push(G.Screens.bag.render({ tab }));
  rendered.push(G.Screens.town.render());
  for (const html of rendered) {
    check(typeof html === 'string' && !html.includes('NaN'), 'screen returned invalid content');
    for (const match of html.matchAll(/data-a="([^"]+)"/g)) check(typeof G.A[match[1]] === 'function', `rendered action '${match[1]}' has no handler`);
  }
});
smoke('Act III quest chain', () => {
  const p = G.Engine.newGame({ cls: 'starseer', bg: Object.keys(D.BACKGROUNDS)[0], name: 'Quest audit', slot: 1 });
  p.level = 60; p.quests.m12 = { st: 'done' };
  for (let n = 13; n <= 20; n++) {
    const id = 'm' + n, q = D.QUESTS[id];
    check(G.Engine.qAvailable(id), `${id}: unavailable after previous turn-in`);
    G.Engine.accept(id);
    if (n === 13) check(p.flags.act3 && p.flags.forge, 'm13 must unlock Act III and forge on acceptance');
    if (q.obj.t === 'reach') p.zp[q.obj.zone].deepest = q.obj.floor;
    if (q.obj.t === 'item') p.qitems[q.obj.id] = 1;
    if (q.obj.t === 'kill') p.quests[id].prog = q.obj.n;
    check(G.Engine.qReady(id), `${id}: objective did not satisfy quest`);
    check(!!G.Engine.turnIn(id) && p.quests[id].st === 'done', `${id}: turn-in failed`);
    if (n === 17) check(p.flags.sunforge && p.qitems.first_faceplate, 'm17 must award Sunforge and First Faceplate');
  }
});
const assets = new Map();
const plannedVoice = JSON.parse(read('tools/vo_lines.json').replace(/^\uFEFF/, ''));
const optionalVoice = new Set([...Array.from({ length: 5 }, (_, i) => `intro3_${i + 1}`), ...['everlight', 'longnight', 'sunface'].flatMap(k => Array.from({ length: 4 }, (_, i) => `end_${k}${i + 1}`))]);
const voiceMeta = JSON.parse(read('assets/vo/meta.json'));
const checkNarration = (id, slide) => {
  check(JSON.stringify(plannedVoice[id]) === JSON.stringify(slide.lines), `${id}: narration script differs from cinematic lines`);
  const file = path.join(root, `assets/vo/${id}.mp3`);
  if (fs.existsSync(file)) {
    const clip = D.VO[id];
    check(clip && clip.d > 0 && clip.t?.length === slide.lines.length, `${id}: missing or invalid runtime duration/subtitle timing`);
    check(JSON.stringify(voiceMeta[id]?.lines) === JSON.stringify(slide.lines), `${id}: recorded narration text differs from cinematic lines`);
    if (clip?.t) check(clip.t.every((t, i) => Number.isFinite(t) && t >= 0 && t < clip.d && (!i || t >= clip.t[i - 1])), `${id}: invalid subtitle start times`);
  }
};
D.INTRO3.forEach((slide, i) => checkNarration(`intro3_${i + 1}`, slide));
for (const ending of ['everlight', 'longnight', 'sunface']) D.ENDINGS[ending].slides.forEach((slide, i) => checkNarration(`end_${ending}${i + 1}`, slide));
const asset = (file, kind, id, data = {}) => {
  if (!assets.has(file)) assets.set(file, { path: file, kind, type: kind, key: id, id, slot: data.slot || data.slots || null, name: data.n || data.title || data.t || id, description: data.desc || data.lore || (data.lines || []).join(' '), source: data });
};
for (const [id, c] of entries('CLASSES')) asset(G.ART.hero(id), 'hero', id, c);
for (const [id, e] of entries('ENEMIES')) if (id !== 'reflection') asset(G.ART.foe({ id }), 'foe', id, e);
for (const [id, b] of entries('BASES')) asset(G.ART.item({ base: id }), 'item', id, b);
for (const [id, u] of entries('UNIQUES')) asset(G.ART.item({ unique: id }), 'unique', id, u);
for (const [table, fn] of Object.entries({ CONS: 'cons', MATS: 'mat', QITEMS: 'qitem' })) for (const [id, value] of entries(table)) asset(G.ART[fn](id), fn, id, value);
for (const [id, value] of entries('RUNES')) asset(`assets/items/r_${id}.webp`, 'rune', id, value);
for (const [id, z] of entries('ZONES')) asset(`assets/img/${z.img}.jpg`, 'zone', id, z);
walk(D, (v, p) => { if (v.img && v.lines) asset(`assets/img/${v.img}.jpg`, 'cinematic', p, v); if (v.vo) asset(`assets/vo/${v.vo}.mp3`, 'audio', v.vo); });
for (const ids of Object.values(G.Screens.ENDING_VO || {})) for (const id of ids) asset(`assets/vo/${id}.mp3`, 'audio', id);
for (const id of optionalVoice) asset(`assets/vo/${id}.mp3`, 'audio', id);
const sourceFiles = [...scripts, 'index.html', 'css/style.css', 'manifest.webmanifest'];
for (const file of sourceFiles) for (const match of read(file).matchAll(/assets\/[a-zA-Z0-9_./-]+\.(?:jpg|png|webp|mp3|ogg|woff2)/g)) asset(match[0], 'static', file);
// All icon-rendered misc images requested by literal helper calls.
for (const file of scripts) for (const m of read(file).matchAll(/(?:ART\.misc|miscIcon)\(['"]([^'"]+)['"]/g)) asset(G.ART.misc(m[1]), 'misc', m[1]);
const missing = [...assets.values()].filter(a => !fs.existsSync(path.join(root, a.path))).sort((a, b) => a.path.localeCompare(b.path));
if (process.argv.includes('--manifest')) fs.writeFileSync(path.join(__dirname, 'missing-art.json'), JSON.stringify({ note: 'Generated by node tools/verify-content.cjs --manifest; only absent referenced assets are listed.', assets: missing }, null, 2) + '\n');
const unavailableVoice = missing.filter(a => a.kind === 'audio' && optionalVoice.has(a.id) && !D.VO[a.id]);
const brokenAssets = missing.filter(a => !unavailableVoice.includes(a));
if (!process.argv.includes('--allow-missing-art')) for (const a of missing) {
  if (process.argv.includes('--allow-missing-voice') && unavailableVoice.includes(a)) continue;
  check(false, `missing asset: ${a.path}`);
}
console.log(`Content: ${entries('CLASSES').length} classes, ${entries('SKILLS').length} skills, ${entries('ZONES').length} zones, ${entries('ENEMIES').length} enemies, ${entries('QUESTS').length} quests, ${entries('EVENTS').length} events (${outcomes} outcomes), ${entries('RECIPES').length} recipes.`);
console.log(`Checked ${scripts.length} scripts, ${assertions} assertions, ${assets.size} referenced assets; ${missing.length} missing assets.`);
console.log(`Asset split: ${brokenAssets.length} broken required assets; ${unavailableVoice.length} unrecorded optional Act III narration clips.`);
if (unavailableVoice.length) console.warn('Unrecorded narration (timed text fallback): ' + unavailableVoice.map(a => a.id).join(', '));
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log('PASS: content references and script integration' + (missing.length ? ' (missing assets explicitly allowed)' : ', including asset files'));
