/* Run with node tools/test-gameplay.cjs. No browser or packages required. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const noop = () => {};
const storage = new Map();
const context = { console, setTimeout: noop, clearTimeout: noop, navigator: {}, document: { documentElement: {}, addEventListener: noop }, localStorage: { getItem: k => storage.get(k) || null, setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) } };
context.window = context;
vm.createContext(context);
const load = f => vm.runInContext(fs.readFileSync(path.join(root, 'js', f + '.js'), 'utf8'), context, { filename: f });
load('util');
const G = context.G;
G.Screens = { tip: noop, checkLevel: noop };
G.Audio = { sfx: noop, applyVolumes: noop, ambient: noop };
G.UI = { toast: noop, go: noop, is: () => false, closeAllModals: noop, refresh: noop, modal: noop, itemIcon: () => '' };
G.FX = new Proxy({ skillStart: () => ({ impact: () => 0, fx: {} }) }, { get: (obj, k) => obj[k] || noop });
G.D.SKILL_FX = {}; G.D.FOE_FX = {};
for (const f of ['items', 'skills', 'enemies', 'lore', 'quests', 'events', 'items3', 'skills3', 'enemies3', 'lore3', 'quests3', 'events3']) load('data/' + f);
load('engine'); load('dungeon'); load('combat');
const E = G.Engine, B = G.Combat;
const fresh = (cls = 'sellsword') => E.newGame({ slot: 1, name: 'Test', cls, bg: Object.keys(G.D.BACKGROUNDS)[0] });
const rich = () => {
  G.S.level = 60; G.S.gold = 10000000; G.S.flags.forge = true; G.S.flags.sunforge = true;
  for (const k in G.D.MATS) G.S.mats[k] = 10000;
};
const encounter = id => {
  const enemy = B.makeEnemy(id || 'radiant', 60);
  enemy.hp = enemy.maxHp = 1000000;
  B.C = { en: [enemy], pl: { isPlayer: true, st: {} }, target: enemy.uid, floats: [], log: [], round: 1, busy: false, over: false };
  return enemy;
};

let skillCases = 0;
for (const cls in G.D.CLASSES) {
  fresh(cls);
  assert.ok(Number.isFinite(E.stats().maxHp), cls + ' starting stats');
  for (const id of G.D.CLASSES[cls].skills) {
    const skill = G.D.SKILLS[id];
    for (const rank of [1, skill.max]) {
      fresh(cls); rich(); G.S.skills[id] = rank;
      const stats = E.stats();
      Object.entries(stats).filter(([, v]) => typeof v === 'number').forEach(([k, v]) => assert.ok(Number.isFinite(v), id + ' ' + k));
      G.S.hp = stats.maxHp; G.S.focus = stats.maxFocus;
      const enemy = encounter();
      if (skill.kind === 'active') B.useSkill(id);
      assert.ok(Number.isFinite(enemy.hp) && Number.isFinite(G.S.hp) && Number.isFinite(G.S.focus), id);
      for (const unit of [enemy, B.C.pl]) for (const st of Object.values(unit.st)) assert.ok(Number.isFinite(st.pow) && Number.isFinite(st.turns), id + ' status');
      skillCases++;
    }
  }
}

fresh(); rich();
for (const id in G.D.RECIPES) {
  G.S.bag = [];
  assert.equal(E.canCraft(id), true, id);
  assert.equal(E.craft(id), true, id);
}
const weapon = G.S.equip.weapon;
G.S.runes.embers = 1;
const oldDmg = E.stats().dmgPct;
assert.equal(E.socketRune(weapon.uid, 'embers'), true);
assert.equal(E.stats().dmgPct, oldDmg + 6);
const savedRune = weapon.rune, savedUid = weapon.uid;
weapon.up = 3;
assert.equal(E.reforge(weapon.uid), true);
assert.equal(weapon.uid, savedUid); assert.equal(weapon.up, 3); assert.equal(weapon.rune, savedRune);
assert.equal(E.removeRune(weapon.uid), true);
assert.equal(G.S.runes.embers, 1); assert.equal(E.stats().dmgPct, weapon.stats.dmg || 0);
// Upgrade arrows and the detailed comparison must count rune stats exactly once.
for (const up of [0, 5]) {
  const plain = E.makeItem('sunforged_plate', 60, 3, 0); plain.up = up;
  const runed = JSON.parse(JSON.stringify(plain)); runed.uid = 'comparison-' + up;
  runed.rune = { id: 'iron', n: G.D.RUNES.iron.n, stats: G.D.RUNES.iron.stat };
  assert.equal(E.itemPower(runed) - E.itemPower(plain), 22, 'rune armor and armor% are not upgrade-scaled');
  G.S.equip.chest = plain;
  const details = E.compare(runed);
  assert.ok(details.includes('+8 Armor'), 'flat rune armor appears in comparison');
  assert.ok(details.includes('+3% Armor'), 'percentage armor remains distinct from flat armor');
  assert.equal(E.itemValue(runed), E.itemValue(plain), 'runes do not alter sale economy');
}
G.S.runes.wick = 1;
assert.equal(E.socketRune(weapon.uid, 'wick'), false, 'slot restriction');
G.S.gold = 0;
assert.equal(E.craft('rune_embers'), false);
G.S.gold = 100000;
G.S.bag = Array.from({ length: E.BAG_SIZE }, () => E.makeItem(weapon.base, 1, 0));
assert.equal(E.canCraft('forge_anvil_breaker'), false, 'full bag');

fresh();
G.S.quests.m12 = { st: 'done' };
E.accept('m13');
assert.equal(G.S.flags.act3, true); assert.equal(G.S.flags.forge, true);
for (let n = 13; n <= 20; n++) {
  const id = 'm' + n, q = G.D.QUESTS[id];
  if (n !== 13) E.accept(id);
  if (q.obj.t === 'reach') E.onReach(q.obj.zone, q.obj.floor);
  if (q.obj.t === 'kill') E.onKill(q.obj.id);
  if (q.obj.t === 'item') {
    const d = G.Dungeon.gen(q.ev.zone, q.ev.floors[0]);
    assert.ok(Object.values(d.rooms).some(r => r.ev === q.ev.id), id + ' quest event spawned');
    G.S.qitems[q.obj.id] = 1;
  }
  assert.equal(E.qReady(id), true, id);
  assert.ok(E.turnIn(id), id + ' turn in');
}
assert.equal(G.S.qitems.first_faceplate, 1);
const legacy = JSON.parse(JSON.stringify(G.S));
delete legacy.runes; delete legacy.flags.forge; delete legacy.flags.act3;
assert.ok(E.migrate(legacy).runes); assert.equal(legacy.flags.forge, true); assert.equal(legacy.flags.act3, true);
G.S.level = 59; G.S.xp = 0; E.gainXp(100000000);
assert.equal(G.S.level, 60); assert.equal(G.S.xp, 0);
assert.equal(E.gainXp(100).xp, 0);

fresh('chainwarden'); rich();
G.S.skills.barbed_links = 3; G.S.hp = E.stats().maxHp;
const enemy = encounter('hollowminer');
G.U.chance = n => n >= 100;
enemy.hp = 1; enemy.intent = { n: 'Flurry', t: 'multi', m: 1, hits: 6 };
B.doMove(enemy);
assert.equal(enemy.dead, true);
const hits = B.C.log.filter(line => line.includes('uses Flurry')).length;
assert.equal(hits, 1, 'thorns kill stops enemy multiattack');
G.S.hp = 1; B.C.pl.st = { poison: { turns: 2, pow: 100 }, regen: { turns: 2, pow: 100 } };
B.tickUnit(B.C.pl); assert.equal(G.S.hp, 0, 'regeneration does not resurrect');
fresh(); encounter();
G.S.cons.phoenixash = 1; G.S.hp = 1;
B.damage(B.C.pl, 100000);
assert.equal(G.S.cons.phoenixash, 0); assert.equal(G.S.hp, Math.round(E.stats().maxHp * 0.4));
B.damage(B.C.pl, 100000); assert.equal(G.S.hp, 0);
fresh('chainwarden'); encounter(); G.S.skills.chain_lash = 1; G.S.focus = 100;
B.useSkill('chain_lash'); assert.equal(B.C.en[0].st.vuln.pow, 15, 'ranked Chain Lash debuff');
fresh();
const radiant = B.makeEnemy('radiant', 60);
B.C = { en: [radiant], pl: { isPlayer: true, st: {} }, floats: [], log: [], round: 1 };
B.damage(radiant, Math.round(radiant.maxHp * 0.7));
assert.equal(radiant.p2, true); assert.equal(radiant.p3, true);
const phaseMoves = radiant.moves.length;
B.damage(radiant, 1); assert.equal(radiant.moves.length, phaseMoves, 'phases occur once');
for (const [zone, definition] of Object.entries(G.D.ZONES)) {
  for (let floor = 1; floor <= (definition.endless ? 1 : definition.floors); floor++) {
    const d = G.Dungeon.gen(+zone, floor); G.S.dungeon = d;
    const visited = new Set([d.start]), pending = [d.start];
    while (pending.length) for (const next of G.Dungeon.links(d.edges, pending.shift())) if (!visited.has(next)) { visited.add(next); pending.push(next); }
    assert.equal(visited.size, Object.keys(d.rooms).length, 'connected floor');
    assert.ok(Number.isFinite(d.lvl));
    for (let roll = 0; roll < 20; roll++) for (const foe of G.Dungeon.group()) {
      assert.ok(G.D.ENEMIES[foe.id]);
      if (definition.endless) assert.ok(G.D.ENEMIES[foe.id].lvl <= d.lvl + 5, 'endless depth gating');
    }
  }
}
fresh();
G.S.bag = Array.from({ length: E.BAG_SIZE }, () => E.makeItem(G.S.equip.weapon.base, 1, 0));
B.C = { en: [Object.assign(B.makeEnemy('radiant', 60), { dead: true, hp: 0 })], pl: { isPlayer: true, st: {} }, floats: [], log: [], round: 1, boss: true };
B.victory();
assert.ok(G.S.stash.some(it => it.unique === 'radiant_crown'), 'unique boss reward survives full bag');
fresh('sunforger'); encounter(); G.S.cons.stoneskin = 1; G.S.cons.warelixir = 1;
G.S.skills.temper = 3; G.S.focus = 100;
B.useItem('stoneskin'); B.C.busy = false; B.useItem('warelixir'); B.C.busy = false; B.useSkill('temper');
for (let turn = 0; turn < 3; turn++) B.tickUnit(B.C.pl);
assert.equal(B.C.pl.st.guard, undefined); assert.equal(B.C.pl.st.rage, undefined);
assert.equal(B.C.pl.st.stoneskin.pow, 35); assert.equal(B.C.pl.st.warElixir.pow, 30);
fresh();
B.start({ enemies: [{ id: 'boneknight', lvl: 25 }], boss: true, onFlee: () => assert.fail('boss fight must not flee') });
assert.equal(B.C.boss, true); B.flee();
for (const [zone, choice] of [[3, 'final_choice'], [7, 'heart_choice'], [12, 'sun_choice']]) {
  fresh(); G.S.dungeon = G.Dungeon.gen(zone, 3);
  G.S.dungeon.pos = G.S.dungeon.exit; G.S.dungeon.rooms[G.S.dungeon.pos].t = 'portal';
  const resumed = E.migrate(JSON.parse(JSON.stringify(G.S)));
  assert.equal(resumed.dungeon.pendingEnding, choice, 'unfinished ending survives legacy save');
  G.S = resumed; E.save(); assert.equal(E.load(1), true);
  assert.equal(G.S.dungeon.pendingEnding, choice, 'unfinished ending survives current save');
  const showEvent = G.Dungeon.showEvent;
  let reopened;
  G.Dungeon.showEvent = id => { reopened = id; };
  context.setTimeout = fn => fn(); G.UI.is = screen => screen === 'dungeon';
  G.Screens.dungeon.after({}, false);
  assert.equal(reopened, choice, 'dungeon entry reopens unfinished choice');
  G.Dungeon.showEvent = showEvent; context.setTimeout = noop; G.UI.is = () => false;
}
console.log(`PASS: ${Object.keys(G.D.CLASSES).length} classes, ${skillCases} skill/rank cases, ${Object.keys(G.D.RECIPES).length} recipes, rune/reforge transactions, Act III quest chain, migration, level cap, thorns, DOT death, Phoenix Ash.`);

// Deterministic balance diagnostics: ordinary Relic gear, no affixes or runes,
// legal skill budget, 2 main attributes + 1 VIT per level, and finite town supplies.
if (process.argv.includes('--balance')) {
  let seed = 17;
  const rng = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  G.U.chance = n => rng() * 100 < n;
  G.U.rand = (a, b) => Math.floor(rng() * (b - a + 1)) + a;
  G.U.randf = (a, b) => a + rng() * (b - a);
  const outcomes = [];
  for (const cls of Object.keys(G.D.CLASSES)) for (const bossId of ['orrery', 'kaldrec', 'maelis', 'radiant']) {
    fresh(cls);
    const p = G.S, boss = G.D.ENEMIES[bossId];
    p.level = boss.lvl;
    const starter = G.D.BASES[p.equip.weapon.base], main = cls === 'penitent' ? 'wil' : starter.scale;
    p.attrs[main] += (p.level - 1) * 2; p.attrs.vit += p.level - 1;
    for (const slot of G.D.SLOTS) {
      let bases = Object.keys(G.D.BASES).filter(id => G.D.BASES[id].tier === 5 && G.D.BASES[id].slot === slot);
      if (slot === 'weapon') bases = bases.filter(id => G.D.BASES[id].wt === starter.wt);
      if (slot === 'offhand' && p.equip.offhand) {
        const ot = E.offType(p.equip.offhand.base), preferred = bases.filter(id => E.offType(id) === ot);
        if (preferred.length) bases = preferred;
      }
      bases.sort((a, b) => ((G.D.BASES[b].stats || {})[main === 'int' ? 'spell' : 'hp'] || G.D.BASES[b].armor || 0) - ((G.D.BASES[a].stats || {})[main === 'int' ? 'spell' : 'hp'] || G.D.BASES[a].armor || 0));
      if (bases[0]) p.equip[slot] = E.makeItem(bases[0], p.level, 3, 0);
    }
    let points = p.level + 9;
    p.skills = {};
    const eligible = G.D.CLASSES[cls].skills.filter(id => G.D.SKILLS[id].lvl <= p.level);
    for (const id of eligible.filter(id => G.D.SKILLS[id].kind === 'active').reverse()) if (points >= 3) { p.skills[id] = 3; points -= 3; }
    for (const id of eligible.filter(id => G.D.SKILLS[id].kind === 'passive').reverse()) { const rank = Math.min(points, G.D.SKILLS[id].max); p.skills[id] = rank; points -= rank; }
    const stats = E.stats(); p.hp = stats.maxHp; p.focus = stats.maxFocus;
    p.cons = { greaterdraught: 20, greatersalts: 20, nighttonic: 8, stoneskin: 1, warelixir: 1 };
    const foe = B.makeEnemy(bossId, boss.lvl);
    B.C = { en: [foe], pl: { isPlayer: true, st: {} }, target: foe.uid, floats: [], log: [], round: 1, busy: false, over: false };
    foe.intent = B.chooseIntent(foe);
    let round = 0;
    while (p.hp > 0 && B.alive().length && round++ < 200) {
      B.C.busy = false;
      if (round > 1) { B.tickUnit(B.C.pl); if (stats.regen) B.heal(B.C.pl, stats.regen); p.focus = Math.min(stats.maxFocus, p.focus + stats.focusRegen); }
      if (p.hp <= 0) break;
      if (B.C.pl.st.stun) delete B.C.pl.st.stun;
      else if (p.hp < stats.maxHp * 0.5 && p.cons.greaterdraught) B.useItem('greaterdraught');
      else if (p.dread > 65 && p.cons.nighttonic) B.useItem('nighttonic');
      else if (p.cons.stoneskin) B.useItem('stoneskin');
      else if (p.cons.warelixir) B.useItem('warelixir');
      else {
        const attacks = eligible.filter(id => G.D.SKILLS[id].m && p.skills[id]);
        const score = id => { const sk = G.D.SKILLS[id]; return (sk.dt === 'magic' ? stats.spell * 0.6 + 3 : sk.dt === 'holy' ? stats.holy * 0.6 + 3 : (stats.atkMin + stats.atkMax) / 2) * sk.m[p.skills[id] - 1] * (sk.hits || 1) * (sk.target === 'all' ? B.alive().length : 1); };
        attacks.sort((a, b) => score(b) - score(a));
        const id = attacks[0];
        if (id && p.focus < G.D.SKILLS[id].cost && p.cons.greatersalts) B.useItem('greatersalts');
        else if (id && p.focus >= G.D.SKILLS[id].cost) B.useSkill(id);
        else B.attack();
      }
      for (const enemy of B.alive().slice()) {
        B.tickUnit(enemy); if (enemy.dead) continue;
        if (enemy.st.stun) { delete enemy.st.stun; continue; }
        B.doMove(enemy); if (p.hp <= 0) break;
      }
      B.C.round++; B.C.floats = [];
    }
    outcomes.push({ cls, boss: bossId, win: p.hp > 0 && !B.alive().length, rounds: round, heals: 20 - p.cons.greaterdraught });
  }
  console.table(outcomes);
  console.log(`Balance smoke: ${outcomes.filter(o => o.win).length}/${outcomes.length} boss fights won by a simple attack/heal policy.`);
}

// Generate saves with the committed pre-expansion engine, then load with this engine.
// Optional because release archives may not include Git history.
if (process.argv.includes('--legacy')) {
  const { execFileSync } = require('node:child_process');
  const old = { console, navigator: {}, document: context.document, localStorage: context.localStorage };
  old.window = old; vm.createContext(old);
  const oldLoad = f => vm.runInContext(execFileSync('git', ['show', 'HEAD:js/' + f + '.js'], { cwd: root, encoding: 'utf8' }), old, { filename: 'previous/' + f });
  oldLoad('util');
  old.G.Audio = G.Audio; old.G.UI = G.UI; old.G.Screens = G.Screens;
  for (const f of ['items', 'skills', 'enemies', 'lore', 'quests', 'events']) oldLoad('data/' + f);
  oldLoad('engine');
  for (const cls of Object.keys(old.G.D.CLASSES)) {
    for (const stage of ['fresh', 'act2-complete']) {
      old.G.Engine.newGame({ slot: 1, name: 'Legacy', cls, bg: Object.keys(old.G.D.BACKGROUNDS)[0] });
      if (stage === 'act2-complete') {
        old.G.Engine.gainXp(10000000);
        for (let n = 1; n <= 12; n++) old.G.S.quests['m' + n] = { st: 'done', prog: 1 };
        Object.assign(old.G.S.flags, { boss_ivel: true, ended: 'ring', ended2: 'ember' });
        old.G.S.zp[7] = { deepest: 3 };
      }
      old.G.Engine.save();
      const before = JSON.parse(JSON.stringify(old.G.S));
      assert.equal(E.load(1), true, cls + ' ' + stage + ' load');
      for (const key of ['name', 'cls', 'level', 'xp', 'gold', 'sp', 'ap']) assert.equal(G.S[key], before[key], key + ' preserved');
      assert.equal(JSON.stringify(G.S.equip), JSON.stringify(before.equip));
      assert.ok(G.S.runes && G.S.zp[12] && G.S.zp[14]);
      if (stage === 'act2-complete') {
        assert.equal(E.qAvailable('m13'), true); assert.ok(E.zoneUnlocked(9));
        E.accept('m13'); assert.equal(G.S.flags.forge, true);
        assert.equal(E.consUnlocked('greaterdraught'), true);
        const level = G.S.level;
        E.gainXp(E.xpNeed(level)); assert.equal(G.S.level, level + 1, 'previous cap can advance');
      }
    }
  }
  console.log(`PASS: ${Object.keys(old.G.D.CLASSES).length * 2} saves generated by the committed engine preserve progression and unlock Act III.`);
}
