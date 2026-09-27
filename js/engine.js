/* Core game engine: settings, saves, stats, items, quests, effects */
G.SETTINGS_KEY = 'gloamreach_settings';
G.settings = { music: 0.6, sfx: 0.8, vibrate: true, textSize: 'm', tips: true, fastCombat: false, shake: true, introSeen: false, lastSlot: null };
G.S = null;
const MAX_LEVEL = 40, BAG_SIZE = 30, SLOT_COUNT = 3;
const START_CODEX = ['wick', 'candlemere'];
const TIER_MIN = [1, 6, 12, 20];
// Kill-unlocked lore whose codex id differs from the enemy id
const KILL_CODEX = { weepknight: 'aldric', ivel: 'ivel_truth' };
const ACT2_CONS = ['sunwater', 'smokebomb', 'whetstone', 'frostvial'];
// Loot preferences per class: weapon types, off-hand types, and an optional armor filter
const CLASS_PREF = {
  sellsword: { wt: ['sword', 'axe', 'mace'], off: ['shield'] },
  nightblade: { wt: ['dagger'], off: [] },
  ashwright: { wt: ['staff'], off: ['tome'] },
  penitent: { wt: ['mace'], off: ['censer'] },
  gravecaller: { wt: ['sickle'], off: ['fetish'], armor: b => (b.stats || {}).spell > 0 },
  duskwarden: { wt: ['crossbow'], off: ['quiver'], armor: b => (b.stats || {}).dodge > 0 || (b.stats || {}).crit > 0 || /jerkin|leather|hood|boots/.test(b.n.toLowerCase()) },
};

G.Engine = {
  // ---------------- settings ----------------
  loadSettings() {
    try { Object.assign(G.settings, JSON.parse(localStorage.getItem(G.SETTINGS_KEY) || '{}')); } catch (e) {}
    this.applySettings();
  },
  saveSettings() { try { localStorage.setItem(G.SETTINGS_KEY, JSON.stringify(G.settings)); } catch (e) {} this.applySettings(); },
  applySettings() {
    document.documentElement.className = 'fs-' + G.settings.textSize;
    G.Audio.applyVolumes();
  },

  // ---------------- saves ----------------
  key(slot) { return 'gloamreach_slot_' + slot; },
  save() {
    if (!G.S) return;
    G.S.saved = Date.now();
    try { localStorage.setItem(this.key(G.S.slot), JSON.stringify(G.S)); G.settings.lastSlot = G.S.slot; this.saveSettings(); }
    catch (e) { G.UI.toast('Could not save: storage full?', 'bad'); }
  },
  load(slot) {
    try {
      const d = JSON.parse(localStorage.getItem(this.key(slot)));
      if (!d) return false;
      G.S = this.migrate(d);
      G.settings.lastSlot = slot; this.saveSettings();
      return true;
    } catch (e) { console.error(e); return false; }
  },
  migrate(p) {
    p.cons = p.cons || {}; p.mats = p.mats || {}; p.qitems = p.qitems || {}; p.flags = p.flags || {};
    p.codex = p.codex || []; p.kills = p.kills || {}; p.blessings = p.blessings || []; p.tips = p.tips || {};
    p.bounties = p.bounties || { offers: [], active: [] }; p.shops = p.shops || {}; p.perm = p.perm || {};
    p.stash = p.stash || [];
    p.zp = p.zp || {};
    for (const z in G.D.ZONES) if (!p.zp[z]) p.zp[z] = { deepest: 0 };
    if (p.quests.m7) p.flags.act2 = true;
    return p;
  },
  slots() {
    const out = [];
    for (let i = 1; i <= SLOT_COUNT; i++) {
      try {
        const d = JSON.parse(localStorage.getItem(this.key(i)));
        out.push(d ? { slot: i, name: d.name, level: d.level, cls: d.cls, playtime: d.playtime, saved: d.saved, hardcore: d.hardcore, ended: d.flags && d.flags.ended } : { slot: i, empty: true });
      } catch (e) { out.push({ slot: i, empty: true }); }
    }
    return out;
  },
  del(slot) { localStorage.removeItem(this.key(slot)); if (G.settings.lastSlot === slot) { G.settings.lastSlot = null; this.saveSettings(); } },
  exportSave() { return G.S ? btoa(unescape(encodeURIComponent(JSON.stringify(G.S)))) : ''; },
  importSave(str, slot) {
    const d = JSON.parse(decodeURIComponent(escape(atob(str.trim()))));
    if (!d || !d.cls || !d.name) throw new Error('Invalid save data');
    d.slot = slot; localStorage.setItem(this.key(slot), JSON.stringify(d));
  },

  // ---------------- new game ----------------
  newGame(o) {
    const c = G.D.CLASSES[o.cls], b = G.D.BACKGROUNDS[o.bg];
    const attrs = Object.assign({}, c.attrs);
    for (const k in b.attrs) attrs[k] += b.attrs[k];
    const p = {
      v: 1, slot: o.slot, name: o.name, cls: o.cls, bg: o.bg, hardcore: !!o.hardcore,
      level: 1, xp: 0, attrs, baseAttrs: Object.assign({}, attrs), perm: {}, ap: 0,
      skills: { [c.skills[0]]: 1 }, sp: 1, spTotal: 2,
      hp: 1, focus: 1, dread: 0, light: 100, gold: 40 + (b.gold || 0),
      equip: {}, bag: [], stash: [],
      cons: Object.assign({ potion: 3, oil: 2, antidote: 1 }), mats: { scrap: 0, shard: 0, gloamcap: 0 }, qitems: {},
      quests: {}, flags: {}, codex: START_CODEX.slice(), kills: {},
      zp: {},
      stats: { kills: 0, deaths: 0, gold: 0, expeditions: 0, bosses: 0, events: 0 },
      bounties: { offers: [], active: [] }, shops: {}, blessings: [], tips: {}, dungeon: null,
      playtime: 0, created: Date.now(), saved: Date.now(),
    };
    for (const k in (b.cons || {})) p.cons[k] = (p.cons[k] || 0) + b.cons[k];
    for (const k in (b.mats || {})) p.mats[k] = (p.mats[k] || 0) + b.mats[k];
    for (const z in G.D.ZONES) p.zp[z] = { deepest: 0 };
    G.S = p;
    for (const slot in c.gear) {
      const it = this.makeItem(c.gear[slot], 1, slot === 'weapon' && b.fineWeapon ? 1 : 0);
      it.fresh = false;
      p.equip[slot] = it;
    }
    const st = this.stats();
    p.hp = st.maxHp; p.focus = st.maxFocus; p.light = st.lightMax;
    this.refreshBounties(); this.refreshShops();
    this.save();
    return p;
  },

  // ---------------- stats ----------------
  passives(p) {
    const ps = {};
    for (const id in p.skills) {
      const s = G.D.SKILLS[id];
      if (s && s.kind === 'passive' && p.skills[id] > 0) {
        const o = s.ps(p.skills[id]);
        for (const k in o) ps[k] = (ps[k] || 0) + o[k];
      }
    }
    return ps;
  },
  gearBonus(p) {
    const b = { armor: 0 };
    for (const slot of G.D.SLOTS) {
      const it = p.equip[slot];
      if (!it) continue;
      const um = 1 + 0.08 * (it.up || 0);
      if (it.armor) b.armor += Math.round(it.armor * um);
      for (const k in (it.stats || {})) b[k] = (b[k] || 0) + it.stats[k];
    }
    for (const bl of (p.blessings || [])) for (const k in bl.stats) b[k] = (b[k] || 0) + bl.stats[k];
    return b;
  },
  stats(p) {
    p = p || G.S;
    const b = this.gearBonus(p), ps = this.passives(p), bg = G.D.BACKGROUNDS[p.bg] || {};
    const A = {};
    for (const k of ['str', 'agi', 'int', 'wil', 'vit']) A[k] = p.attrs[k] + (b[k] || 0);
    const w = p.equip.weapon, base = w ? G.D.BASES[w.base] : null;
    const scale = base ? base.scale : 'str';
    const um = w ? 1 + 0.08 * (w.up || 0) : 1;
    const wd = w ? [Math.round(w.dmg[0] * um), Math.round(w.dmg[1] * um)] : [1, 3];
    const sv = A[scale];
    const atkBonus = Math.floor(sv * (scale === 'int' ? 0.3 : 0.6));
    const s = {
      A, scale, wtype: base ? base.wt : 'fist',
      maxHp: Math.round((30 + A.vit * 6 + A.str + p.level * 4 + (b.hp || 0)) * (1 + (ps.hpPct || 0) / 100)),
      maxFocus: Math.round((10 + A.int * 1.5 + A.wil * 0.7 + p.level * 0.5 + (b.focus || 0)) * (1 + (ps.focusPct || 0) / 100)),
      atkMin: wd[0] + atkBonus, atkMax: wd[1] + atkBonus,
      dmgPct: (b.dmg || 0),
      spell: Math.round((A.int * 1.3 + (b.spell || 0) + p.level) * (1 + (ps.spellPct || 0) / 100)),
      holy: Math.round((A.wil * 1.2 + (b.holy || 0) + p.level) * (1 + (ps.holyPct || 0) / 100)),
      armor: Math.round(b.armor * (1 + (ps.armorPct || 0) / 100)),
      crit: Math.min(75, 5 + A.agi * 0.5 + (b.crit || 0) + (ps.crit || 0)),
      critDmg: 150 + (b.critDmg || 0) + (ps.critDmg || 0),
      dodge: Math.max(0, Math.min(60, 3 + A.agi * 0.5 + (b.dodge || 0) + (ps.dodge || 0))),
      res: Math.min(60, Math.round(A.wil * 0.8 + A.int * 0.4)),
      resolve: Math.round(A.wil * 2 + (b.resolve || 0) + (ps.resolve || 0)),
      dreadRes: Math.min(60, (b.dreadRes || 0) + (ps.dreadRes || 0) + (bg.dreadRes || 0)),
      lightMax: b.lightMax || 60,
      lightEff: Math.min(70, (b.lightEff || 0) + (ps.lightEff || 0)),
      regen: (b.regen || 0) + (ps.regen || 0),
      lifesteal: (b.lifesteal || 0) + (ps.lifesteal || 0),
      focusRegen: 1 + Math.floor(A.wil / 8) + (b.focusRegen || 0) + (ps.focusRegen || 0),
      acc: 90 + A.agi * 0.3,
      dotPct: (b.dotPct || 0) + (ps.dotPct || 0), dmgStatus: (b.dmgStatus || 0) + (ps.dmgStatus || 0),
      lowHpRegen: ps.lowHpRegen || 0, ambushRes: ps.ambushRes || 0,
      cheatDeath: (b.cheatDeath || 0) + (ps.cheatDeath || 0), firstStrike: (b.firstStrike || 0) + (ps.firstStrike || 0),
      xpPct: (bg.xpPct || 0) + (b.xpPct || 0),
    };
    s.atkMin = Math.max(1, s.atkMin); s.atkMax = Math.max(s.atkMin, s.atkMax);
    return s;
  },
  clampVitals() {
    const p = G.S, s = this.stats();
    p.hp = G.U.clamp(p.hp, 0, s.maxHp); p.focus = G.U.clamp(p.focus, 0, s.maxFocus);
    p.light = G.U.clamp(p.light, 0, s.lightMax); p.dread = G.U.clamp(p.dread, 0, 100);
  },
  dreadTier(d) {
    d = d == null ? (G.S ? G.S.dread : 0) : d;
    if (d >= 100) return { n: 'Broken', lvl: 3, acc: 15, dmg: 20 };
    if (d >= 70) return { n: 'Haunted', lvl: 2, acc: 10, dmg: 10 };
    if (d >= 40) return { n: 'Uneasy', lvl: 1, acc: 5, dmg: 0 };
    return { n: '', lvl: 0, acc: 0, dmg: 0 };
  },
  addDread(n) {
    const p = G.S, s = this.stats();
    if (n > 0) n = n * 100 / (100 + s.resolve) * (1 - s.dreadRes / 100);
    const before = this.dreadTier().lvl;
    p.dread = G.U.clamp(p.dread + n, 0, 100);
    const after = this.dreadTier().lvl;
    if (after > before) { G.Audio.sfx('dread'); if (after >= 1) G.Screens.tip('dread'); }
    return Math.round(n);
  },

  // ---------------- XP ----------------
  xpNeed(l) { return Math.floor(30 * Math.pow(l, 1.45)); },
  gainXp(n) {
    const p = G.S, s = this.stats();
    n = Math.round(n * (1 + s.xpPct / 100));
    if (p.level >= MAX_LEVEL) return { xp: 0, levels: 0 };
    p.xp += n;
    let lv = 0;
    while (p.level < MAX_LEVEL && p.xp >= this.xpNeed(p.level)) {
      p.xp -= this.xpNeed(p.level); p.level++; lv++;
      p.ap += 3; p.sp += 1; p.spTotal += 1;
    }
    if (p.level >= MAX_LEVEL) p.xp = 0;
    if (lv) {
      const st = this.stats(); p.hp = st.maxHp; p.focus = st.maxFocus;
      G.pendingLevel = (G.pendingLevel || 0) + lv;
    }
    return { xp: n, levels: lv };
  },

  // ---------------- items ----------------
  tierOf(ilvl) { return ilvl <= 5 ? 1 : ilvl <= 11 ? 2 : ilvl <= 19 ? 3 : 4; },
  rollRarity(bonus) {
    bonus = bonus || 0;
    const ws = G.D.RARITY.map((r, i) => r.w * (i === 0 ? Math.max(0.2, 1 - bonus / 60) : 1 + bonus * i / 25));
    let t = ws.reduce((a, b) => a + b, 0), r = Math.random() * t;
    for (let i = 0; i < ws.length; i++) { r -= ws[i]; if (r <= 0) return i; }
    return 0;
  },
  makeItem(baseId, ilvl, rarity, forceAff) {
    const base = G.D.BASES[baseId];
    const R = G.D.RARITY[rarity];
    const tier = base.tier, tmin = TIER_MIN[tier - 1] || 1;
    const f = (1 + Math.max(0, ilvl - tmin) * 0.06) * R.mult;
    const it = { uid: G.U.uid(), base: baseId, slot: base.slot, ic: base.ic, rarity, ilvl, up: 0, stats: {}, fresh: true };
    if (base.dmg) it.dmg = [Math.round(base.dmg[0] * f), Math.round(base.dmg[1] * f)];
    if (base.armor) it.armor = Math.max(1, Math.round(base.armor * f));
    for (const k in (base.stats || {})) {
      const v = base.stats[k];
      it.stats[k] = (k === 'lightMax' || k === 'lightEff' || v < 0) ? v : Math.round(v * f);
    }
    const nAff = forceAff != null ? forceAff : R.aff;
    const pool = G.D.AFFIX.filter(a => {
      if (a.slots) return a.slots.includes(base.slot);
      if (base.slot === 'lantern') return ['resolve', 'focus', 'wil', 'hp'].includes(a.k);
      return true;
    });
    const chosen = G.U.shuffle(pool).slice(0, nAff);
    chosen.forEach(a => {
      const v = Math.max(1, Math.round(a.v(ilvl) * G.U.randf(0.8, 1.2)));
      it.stats[a.k] = (it.stats[a.k] || 0) + v;
    });
    it.aff = chosen.map(a => a.k);
    let n = base.n;
    if (chosen[0]) n = chosen[0].p + ' ' + n;
    if (chosen[1]) n = n + ' ' + chosen[1].s;
    it.n = n;
    return it;
  },
  makeUnique(id) {
    const u = G.D.UNIQUES[id];
    const it = this.makeItem(u.base, u.ilvl, 4, 0);
    it.n = u.n; it.unique = id; it.stats = Object.assign({}, u.stats); it.lore = u.lore;
    if (u.dmg) it.dmg = u.dmg.slice();
    if (u.armor != null) it.armor = u.armor + (it.armor || 0);
    return it;
  },
  genItem(ilvl, minR, opts) {
    opts = opts || {};
    ilvl = G.U.clamp(Math.round(ilvl), 1, MAX_LEVEL + 10);
    let rarity = opts.rarity != null ? opts.rarity : Math.max(minR || 0, this.rollRarity(opts.bonus || 0));
    rarity = Math.min(4, rarity);
    if (rarity === 4 && !opts.slot && G.U.chance(50)) {
      const owned = this.ownedUniques(), bossU = this.bossUniques();
      const ids = Object.keys(G.D.UNIQUES).filter(id => G.D.UNIQUES[id].ilvl <= ilvl + 3 && !owned.includes(id) && !bossU.includes(id));
      if (ids.length) return this.makeUnique(G.U.pick(ids));
    }
    let tier = this.tierOf(ilvl), bases = [];
    const ofTier = t => Object.keys(G.D.BASES).filter(k => G.D.BASES[k].tier === t && (!opts.slot || G.D.BASES[k].slot === opts.slot));
    for (; tier >= 1 && !bases.length; tier--) bases = ofTier(tier);
    tier++;
    if (!opts.slot && G.S && G.U.chance(35)) {
      const pref = this.preferredBases(tier);
      if (pref.length) bases = pref;
    }
    return this.makeItem(G.U.pick(bases), ilvl, rarity);
  },
  bossUniques() {
    const out = Object.keys(G.D.UNIQUES).filter(id => G.D.UNIQUES[id].boss);
    for (const id in G.D.ENEMIES) if (G.D.ENEMIES[id].unique) out.push(G.D.ENEMIES[id].unique);
    return out;
  },
  // Off-hands have no type field, so fall back to the base id when the icon is shared
  offType(id) {
    const b = G.D.BASES[id];
    if (b.wt || b.ot) return b.wt || b.ot;
    if (/quiver/.test(id)) return 'quiver';
    if (/fetish|totem/.test(id)) return 'fetish';
    return b.ic;
  },
  preferredBases(tier) {
    const pr = CLASS_PREF[G.S.cls];
    if (!pr) return [];
    return Object.keys(G.D.BASES).filter(k => {
      const b = G.D.BASES[k];
      if (b.tier !== tier) return false;
      if (b.slot === 'weapon') return pr.wt.includes(b.wt);
      if (b.slot === 'offhand') return pr.off.includes(this.offType(k));
      if (pr.armor && ['head', 'chest', 'hands', 'feet'].includes(b.slot)) return pr.armor(b);
      return false;
    });
  },
  ownedUniques() {
    const p = G.S, all = [...p.bag, ...p.stash, ...Object.values(p.equip)];
    return all.filter(Boolean).filter(i => i.unique).map(i => i.unique);
  },
  itemValue(it) {
    return Math.round((10 + it.ilvl * 6) * [1, 1.8, 3, 5, 9][it.rarity] * (1 + (it.up || 0) * 0.2));
  },
  sellPrice(it) { return Math.max(1, Math.floor(this.itemValue(it) * 0.4)); },
  buyPrice(it, mul) { return Math.round(this.itemValue(it) * (mul || 1.3)); },
  itemName(it) { return `<span class="r${it.rarity}">${G.U.esc(it.n)}${it.up ? ' +' + it.up : ''}</span>`; },
  statLine(k, v) {
    const sn = G.D.STAT_NAMES[k] || [k, ''];
    return `${v > 0 ? '+' : ''}${v}${sn[1]} ${sn[0]}`;
  },
  itemLines(it) {
    const um = 1 + 0.08 * (it.up || 0), L = [];
    if (it.dmg) L.push(`<b>${Math.round(it.dmg[0] * um)}-${Math.round(it.dmg[1] * um)}</b> Damage <span class="muted">(${G.D.ATTRS[G.D.BASES[it.base].scale].n} scaling)</span>`);
    if (it.armor) L.push(`<b>${Math.round(it.armor * um)}</b> Armor`);
    for (const k in it.stats) L.push(this.statLine(k, it.stats[k]));
    return L;
  },
  itemPower(it) {
    if (!it) return 0;
    const um = 1 + 0.08 * (it.up || 0);
    let s = 0;
    if (it.dmg) s += (it.dmg[0] + it.dmg[1]) / 2 * um * 3;
    if (it.armor) s += it.armor * um * 2;
    const W = { str: 3, agi: 3, int: 3, wil: 3, vit: 3, hp: 0.4, armor: 2, crit: 2, dodge: 2, spell: 1.6, holy: 1.6, lifesteal: 3, resolve: 0.5, focus: 0.8, dmg: 2, lightEff: 0.7, lightMax: 0.25, regen: 3, critDmg: 1, dotPct: 1, dreadRes: 1.2, focusRegen: 6 };
    for (const k in it.stats) s += (W[k] || 1) * it.stats[k];
    return Math.round(s);
  },
  compare(it) {
    const cur = G.S.equip[it.slot];
    if (!cur || cur.uid === it.uid) return '';
    const a = {}, b = {};
    const um = x => 1 + 0.08 * (x.up || 0);
    const fill = (o, x) => {
      if (x.dmg) o['Avg Damage'] = Math.round((x.dmg[0] + x.dmg[1]) / 2 * um(x));
      if (x.armor) o.Armor = Math.round(x.armor * um(x));
      for (const k in x.stats) o[(G.D.STAT_NAMES[k] || [k])[0]] = x.stats[k];
    };
    fill(a, it); fill(b, cur);
    const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
    const lines = keys.map(k => {
      const d = (a[k] || 0) - (b[k] || 0);
      if (!d) return '';
      return `<div class="fxline ${d > 0 ? 'cmp-up' : 'cmp-down'}">${d > 0 ? '▲ +' : '▼ '}${d} ${k}</div>`;
    }).join('');
    return lines ? `<div class="mt small muted">Compared to ${this.itemName(cur)}:</div>${lines}` : '';
  },
  addItem(it) {
    const p = G.S;
    if (p.bag.length >= BAG_SIZE) {
      G.UI.toast('Your bag is full! ' + it.n + ' was left behind.', 'bad');
      return false;
    }
    it.isNew = true;
    p.bag.push(it);
    return true;
  },
  bagFull() { return G.S.bag.length >= BAG_SIZE; },
  BAG_SIZE, MAX_LEVEL,
  findBag(uid) { return G.S.bag.findIndex(i => i.uid === uid); },
  equip(uid) {
    const p = G.S, i = this.findBag(uid);
    if (i < 0) return;
    const it = p.bag[i];
    const old = p.equip[it.slot];
    p.bag.splice(i, 1);
    if (old) { old.isNew = false; p.bag.push(old); }
    it.isNew = false; it.fresh = false;
    p.equip[it.slot] = it;
    this.clampVitals();
  },
  unequip(slot) {
    const p = G.S, it = p.equip[slot];
    if (!it) return;
    if (this.bagFull()) { G.UI.toast('Your bag is full.', 'bad'); return; }
    delete p.equip[slot]; p.bag.push(it); this.clampVitals();
  },
  salvageYield(it) {
    const m = { scrap: [1, 2, 3, 5, 8][it.rarity] + Math.floor(it.ilvl / 6), shard: 0 };
    if (it.rarity >= 3) m.shard = it.rarity === 4 ? 3 : 1;
    else if (it.rarity === 2 && G.U.chance(35)) m.shard = 1;
    return m;
  },
  upgradeCost(it) {
    const u = it.up || 0;
    return { gold: Math.round((30 + it.ilvl * 12) * (u + 1) * (1 + it.rarity * 0.25)), scrap: 2 + u * 2, shard: u >= 3 ? u - 2 : 0 };
  },
  maxUpgrade() { return G.S.flags.hammer ? 5 : 3; },

  // ---------------- consumables ----------------
  addCons(id, n) { G.S.cons[id] = Math.max(0, (G.S.cons[id] || 0) + n); },
  useCons(id, ctx) {
    const p = G.S, c = G.D.CONS[id], s = this.stats();
    if (!p.cons[id]) return null;
    let msg = '';
    switch (id) {
      case 'potion': { const h = Math.round(s.maxHp * 0.35); p.hp = Math.min(s.maxHp, p.hp + h); msg = `You drink a Red Draught. +${h} HP.`; G.Audio.sfx('heal'); break; }
      case 'elixir': { const h = Math.round(s.maxHp * 0.7); p.hp = Math.min(s.maxHp, p.hp + h); msg = `The Crimson Elixir burns going down. +${h} HP, ailments cured.`; G.Audio.sfx('heal'); if (ctx && ctx.cure) ctx.cure(); break; }
      case 'salts': { const f = Math.round(s.maxFocus * 0.5); p.focus = Math.min(s.maxFocus, p.focus + f); msg = `Sharp salts clear your head. +${f} Focus.`; G.Audio.sfx('spell'); break; }
      case 'oil': { if (!p.dungeon) return null; const b = p.light; p.light = Math.min(s.lightMax, p.light + 50); msg = `You refill your lantern. +${Math.round(p.light - b)} Light.`; G.Audio.sfx('fire'); break; }
      case 'tonic': { this.addDread(-25); msg = 'The Hushleaf Tonic dulls the whispers. -25 Dread.'; G.Audio.sfx('heal'); break; }
      case 'antidote': { msg = 'Bitter, but it works. Ailments cured.'; if (ctx && ctx.cure) ctx.cure(); G.Audio.sfx('heal'); break; }
      case 'sunwater': {
        const h = Math.round(s.maxHp * 0.2); p.hp = Math.min(s.maxHp, p.hp + h); const v = this.addDread(-40);
        msg = `The Sunwater tastes of a morning you never saw. +${h} HP, ${v} Dread, ailments cured.`; if (ctx && ctx.cure) ctx.cure(true); G.Audio.sfx('holy'); break;
      }
      default: if (c.combatOnly) return null; msg = c.n + ' used.';
    }
    p.cons[id]--;
    return msg;
  },
  consUnlocked(id) {
    const c = G.D.CONS[id], f = G.S.flags;
    if (!c) return false;
    const act2 = f.act2 || f.boss_cantor;
    if (c.unlock) return !!(f[c.unlock] || (c.unlock === 'act2' && act2));
    return !ACT2_CONS.includes(id) || !!act2;
  },

  // ---------------- checks & effects ----------------
  zone() { return G.S.dungeon ? G.S.dungeon.zone : 1; },
  floorLevel() {
    const d = G.S.dungeon;
    if (!d) return G.S.level;
    return d.lvl;
  },
  // Difficulty rank from the current floor level (zone ids are not ordered by difficulty): 1 in town/Barrows, ~4 by Act II
  zonePow() {
    const d = G.S && G.S.dungeon;
    return d ? Math.max(1, 1 + Math.floor(d.lvl / 6)) : 1;
  },
  zoneOrder() {
    return Object.keys(G.D.ZONES).map(Number).sort((a, b) => (G.D.ZONES[a].ord || a) - (G.D.ZONES[b].ord || b));
  },
  endlessZone() { return this.zoneOrder().find(z => G.D.ZONES[z].endless); },
  zoneReqText(z) {
    const Z = G.D.ZONES[z];
    if (!Z.req) return '';
    if (Z.reqText) return Z.reqText;
    const m = /^boss_(\w+)$/.exec(Z.req), e = m && G.D.ENEMIES[m[1]];
    return e ? `Defeat ${e.n}.` : '';
  },
  checkChance(attr, d) {
    const s = this.stats(), z = Math.min(4, this.zonePow());
    const tier = this.dreadTier();
    return Math.round(G.U.clamp(70 - d - (z - 1) * 6 + s.A[attr] * 3 + G.S.level - tier.lvl * 5, 5, 95));
  },
  applyFx(fx) {
    const p = G.S, z = this.zonePow();
    if (typeof fx === 'function') fx = fx(z, p);
    fx = fx || {};
    const res = { lines: [], fight: null, shop: null, end: null, reveal: false };
    const s = this.stats();
    const L = (t, c) => res.lines.push(`<div class="fxline ${c || ''}">${t}</div>`);
    if (fx.hpPct) {
      const v = Math.round(s.maxHp * fx.hpPct / 100);
      if (v < 0) { const dmg = Math.min(-v, p.hp - 1); p.hp -= dmg; L(`-${dmg} HP`, 'bad'); G.U.vibrate(60); }
      else { const b = p.hp; p.hp = Math.min(s.maxHp, p.hp + v); L(`+${Math.round(p.hp - b)} HP`, 'good'); }
    }
    if (fx.focusPct) { const v = Math.round(s.maxFocus * fx.focusPct / 100); p.focus = G.U.clamp(p.focus + v, 0, s.maxFocus); L(`${v > 0 ? '+' : ''}${v} Focus`, v > 0 ? 'good' : 'bad'); }
    if (fx.dread) { const v = this.addDread(fx.dread); if (v) L(`${v > 0 ? '+' : ''}${v} Dread`, v > 0 ? 'bad' : 'good'); }
    if (fx.light && p.dungeon) { const b = p.light; p.light = G.U.clamp(p.light + fx.light, 0, s.lightMax); const d = Math.round(p.light - b); if (d) L(`${d > 0 ? '+' : ''}${d} Light`, d > 0 ? 'good' : 'bad'); }
    if (fx.gold) { const v = Math.max(-p.gold, fx.gold); p.gold += v; if (v > 0) { p.stats.gold += v; G.Audio.sfx('gold'); } L(`${v > 0 ? '+' : ''}${v} gold`, 'gold'); }
    if (fx.xp) { const r = this.gainXp(fx.xp); L(`+${r.xp} XP`, 'good'); }
    if (fx.cons) for (const k in fx.cons) { this.addCons(k, fx.cons[k]); L(`${fx.cons[k] > 0 ? '+' : ''}${fx.cons[k]} ${G.D.CONS[k].n}`, fx.cons[k] > 0 ? 'good' : 'muted'); }
    if (fx.mats) for (const k in fx.mats) { p.mats[k] = Math.max(0, (p.mats[k] || 0) + fx.mats[k]); L(`${fx.mats[k] > 0 ? '+' : ''}${fx.mats[k]} ${G.D.MATS[k].n}`, fx.mats[k] > 0 ? 'good' : 'muted'); }
    if (fx.item != null) {
      const it = this.genItem(this.floorLevel(), fx.item, { bonus: z * 2 });
      if (this.addItem(it)) { L(`Found: ${this.itemName(it)}`); G.Audio.sfx(it.rarity >= 2 ? 'rare' : 'loot'); }
    }
    if (fx.qitem) { p.qitems[fx.qitem] = 1; L(`Quest item: <b>${G.D.QITEMS[fx.qitem].n}</b>`, 'gold'); G.Audio.sfx('rare'); }
    if (fx.flag) { p.flags[fx.flag] = true; }
    if (fx.codex) { const id = fx.codex === 'random' ? this.randomCodex() : fx.codex; if (id && this.unlockCodex(id)) L(`New lore: <b>${G.D.CODEX[id].n}</b>`, 'gold'); }
    if (fx.bless) { p.blessings.push(G.U.deep(fx.bless)); L(`Boon gained: <b>${fx.bless.n}</b> (${Object.keys(fx.bless.stats).map(k => this.statLine(k, fx.bless.stats[k])).join(', ')}) until you return to town`, 'gold'); }
    if (fx.perm) for (const k in fx.perm) { p.attrs[k] += fx.perm[k]; p.perm[k] = (p.perm[k] || 0) + fx.perm[k]; L(`Permanently +${fx.perm[k]} ${G.D.ATTRS[k].full}!`, 'gold'); }
    if (fx.sp) { p.sp += fx.sp; p.spTotal += fx.sp; L(`+${fx.sp} Skill Point`, 'gold'); }
    if (fx.fight) res.fight = fx.fight;
    if (fx.shop) res.shop = fx.shop;
    if (fx.reveal) res.reveal = true;
    if (fx.end) res.end = fx.end;
    this.clampVitals();
    return res;
  },

  // ---------------- codex ----------------
  unlockCodex(id) {
    const p = G.S;
    if (!G.D.CODEX[id] || p.codex.includes(id)) return false;
    p.codex.push(id);
    G.UI.toast(`${G.icon('scroll')} New lore: ${G.D.CODEX[id].n}`, 'gold');
    return true;
  },
  killCodex(eid) {
    const e = G.D.ENEMIES[eid] || {};
    const c = [e.codex, KILL_CODEX[eid], e.rank === 'boss' ? eid : null].find(k => k && G.D.CODEX[k]);
    return c || null;
  },
  // General lore only: skip starting entries, Secrets, and anything granted by quests, quest events or kills
  codexPool() {
    if (this._codexPool) return this._codexPool;
    const skip = new Set(START_CODEX);
    for (const id in G.D.QUESTS) if (G.D.QUESTS[id].codex) skip.add(G.D.QUESTS[id].codex);
    for (const id in G.D.ENEMIES) { const c = this.killCodex(id); if (c && (G.D.ENEMIES[id].rank === 'boss' || G.D.ENEMIES[id].codex || KILL_CODEX[id])) skip.add(c); }
    for (const id in G.D.EVENTS) {
      const ev = G.D.EVENTS[id];
      if (!ev.quest) continue;
      (ev.choices || []).forEach(ch => [ch.out, ch.ok, ch.no].forEach(o => {
        if (!o || !o.fx) return;
        const src = typeof o.fx === 'function' ? o.fx.toString() : JSON.stringify(o.fx);
        src.replace(/codex["']?\s*:\s*["'](\w+)["']/g, (_, k) => { skip.add(k); return _; });
      }));
    }
    return (this._codexPool = Object.keys(G.D.CODEX).filter(id => {
      const c = G.D.CODEX[id];
      return !skip.has(id) && !c.quest && !c.fixed && c.cat !== 'Secrets';
    }));
  },
  randomCodex() {
    const pool = this.codexPool().filter(id => !G.S.codex.includes(id));
    return pool.length ? G.U.pick(pool) : null;
  },

  // ---------------- quests ----------------
  qState(id) { const q = G.S.quests[id]; return q ? q.st : null; },
  qDone(id) { return this.qState(id) === 'done'; },
  qAvailable(id) {
    const q = G.D.QUESTS[id];
    return !G.S.quests[id] && (!q.pre || this.qDone(q.pre));
  },
  accept(id) {
    const q = G.D.QUESTS[id];
    G.S.quests[id] = { st: 'active', prog: 0 };
    if (q.grant && q.grant.unique) {
      const it = this.makeUnique(q.grant.unique); it.fresh = false;
      if (!this.addItem(it)) G.S.stash.push(it);
      G.UI.toast(`Received ${it.n}`, 'gold');
    }
    if (q.grant && q.grant.flag) G.S.flags[q.grant.flag] = true;
    G.UI.toast(`Quest accepted: ${q.n}`, 'gold');
    this.save();
  },
  qProgress(id) {
    const q = G.D.QUESTS[id], p = G.S, o = q.obj, st = p.quests[id];
    let cur = 0, need = o.n || 1;
    switch (o.t) {
      case 'reach': cur = (p.zp[o.zone] || { deepest: 0 }).deepest >= o.floor ? 1 : 0; break;
      case 'kill': cur = st ? st.prog : 0; break;
      case 'item': cur = p.qitems[o.id] ? 1 : 0; break;
      case 'mats': cur = Math.min(p.mats[o.id] || 0, need); break;
      case 'codex': cur = Math.min(p.codex.length, need); break;
      case 'flag': cur = p.flags[o.id] ? 1 : 0; break;
    }
    return { cur, need, done: cur >= need };
  },
  qReady(id) { return this.qState(id) === 'active' && this.qProgress(id).done; },
  turnIn(id) {
    const q = G.D.QUESTS[id], p = G.S, r = q.reward || {};
    if (!this.qReady(id)) return null;
    if (q.obj.t === 'item') delete p.qitems[q.obj.id];
    if (q.obj.t === 'mats') p.mats[q.obj.id] -= q.obj.n;
    p.quests[id].st = 'done';
    const fx = { gold: r.gold, xp: r.xp, cons: r.cons, sp: r.sp, flag: r.flag, codex: q.codex };
    const res = this.applyFx(fx);
    if (r.item != null) {
      const il = Math.max(p.level, 2, r.ilvl || 0, r.tier ? TIER_MIN[r.tier - 1] || 0 : 0);
      const it = this.genItem(il, r.item, { rarity: r.item, slot: r.itemSlot });
      it.fresh = false;
      if (this.addItem(it)) res.lines.push(`<div class="fxline">Reward: ${this.itemName(it)}</div>`);
      else { p.stash.push(it); res.lines.push(`<div class="fxline">Reward sent to your stash: ${this.itemName(it)}</div>`); }
    }
    G.Audio.sfx('levelup');
    this.save();
    return res;
  },
  onKill(eid) {
    const p = G.S;
    p.kills[eid] = (p.kills[eid] || 0) + 1; p.stats.kills++;
    for (const id in p.quests) {
      const q = G.D.QUESTS[id], st = p.quests[id];
      if (st.st === 'active' && q.obj.t === 'kill' && q.obj.id === eid && st.prog < q.obj.n) {
        st.prog++;
        if (st.prog >= q.obj.n) G.UI.toast(`Quest complete: ${q.n}. Return to ${G.D.NPCS[q.giver].n}.`, 'gold');
      }
    }
    for (const b of p.bounties.active) {
      if (b.enemy === eid && b.prog < b.n) { b.prog++; if (b.prog >= b.n) G.UI.toast(`Bounty complete: ${G.D.ENEMIES[eid].n}`, 'gold'); }
    }
  },
  onReach(zone, floor) {
    const zp = G.S.zp[zone] = G.S.zp[zone] || { deepest: 0 };
    if (floor > zp.deepest) {
      zp.deepest = floor;
      for (const id in G.S.quests) {
        const q = G.D.QUESTS[id];
        if (G.S.quests[id].st === 'active' && q.obj.t === 'reach' && q.obj.zone === zone && q.obj.floor === floor)
          G.UI.toast(`Quest complete: ${q.n}. Return to ${G.D.NPCS[q.giver].n}.`, 'gold');
      }
    }
  },
  activeQuestEvents(zone, floor) {
    const out = [];
    for (const id in G.S.quests) {
      const q = G.D.QUESTS[id];
      if (G.S.quests[id].st === 'active' && q.ev && q.ev.zone === zone && q.ev.floors.includes(floor) && !this.qProgress(id).done) out.push(q.ev.id);
    }
    return out;
  },
  zoneUnlocked(z) { const Z = G.D.ZONES[z]; return !Z.req || G.S.flags[Z.req]; },

  // ---------------- bounties ----------------
  makeBounty() {
    // Zones whose level band sits closest to the hero, so the board stays relevant at any level
    const pl = G.S.level;
    const zLvl = z => { const Z = G.D.ZONES[z]; return Z.endless ? 17 + Math.max(1, G.S.zp[z] ? G.S.zp[z].deepest : 1) : Z.lvls[0]; };
    const zs = this.zoneOrder().filter(z => this.zoneUnlocked(z) && (G.D.ZONES[z].pool || []).length)
      .sort((a, b) => Math.abs(zLvl(a) + 2 - pl) - Math.abs(zLvl(b) + 2 - pl));
    const z = zs[zs.length > 1 && G.U.chance(35) ? 1 : 0] || 1;
    const Z = G.D.ZONES[z];
    const eid = G.U.pick(Z.pool)[0];
    const e = G.D.ENEMIES[eid];
    const n = G.U.rand(3, 6);
    const lvl = Z.endless ? Math.max(20, e.lvl + 2) : e.lvl + 2;
    return { id: G.U.uid(), enemy: eid, zone: z, n, prog: 0, gold: Math.round((15 + lvl * 7) * n / 3), xp: Math.round((10 + lvl * 6) * n / 2) };
  },
  refreshBounties() {
    const b = G.S.bounties;
    b.offers = b.offers.filter(o => !b.active.find(a => a.id === o.id));
    while (b.offers.length < 3) b.offers.push(this.makeBounty());
  },

  // ---------------- shops ----------------
  refreshShops() {
    const p = G.S, lvl = Math.max(1, p.level);
    const smith = [];
    for (let i = 0; i < 6; i++) smith.push(this.genItem(lvl + G.U.rand(0, 1), 0, { rarity: G.U.pick([0, 0, 1, 1, 1, 2]) }));
    p.shops.smith = smith;
    const osk = [];
    for (let i = 0; i < 4; i++) osk.push(this.genItem(lvl + 2, 0, { rarity: G.U.pick([2, 2, 3, 3, 4]) }));
    p.shops.osk = osk;
    [...smith, ...osk].forEach(i => { i.fresh = false; });
  },

  // ---------------- town transitions ----------------
  returnToTown(kind) {
    const p = G.S, s = this.stats();
    p.bag.forEach(i => { i.fresh = false; });
    p.blessings = [];
    p.dungeon = null;
    p.light = this.stats().lightMax;
    p.stats.expeditions++;
    this.refreshBounties();
    this.refreshShops();
    this.clampVitals();
    this.save();
  },
  die() {
    const p = G.S;
    p.stats.deaths++;
    if (p.hardcore) { this.del(p.slot); return { hardcore: true }; }
    const lost = Math.floor(p.gold * 0.3);
    p.gold -= lost;
    const lostItems = p.bag.filter(i => i.fresh);
    p.bag = p.bag.filter(i => !i.fresh);
    p.blessings = []; p.dungeon = null;
    const s = this.stats();
    p.hp = Math.round(s.maxHp * 0.5); p.focus = s.maxFocus; p.light = s.lightMax;
    p.dread = Math.max(p.dread, 35);
    p.dread = Math.min(p.dread, 80);
    this.refreshBounties(); this.refreshShops();
    this.save();
    return { gold: lost, items: lostItems.length };
  },
};
