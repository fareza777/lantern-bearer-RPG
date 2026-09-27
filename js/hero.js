/* Character screens: hero sheet, bag, skills, journal (quests, bounties, codex, records) */
(() => {
const S = G.Screens, U = G.U, E = G.Engine;

G.nav = active => {
  const p = G.S, inD = !!p.dungeon;
  const newItems = p.bag.some(i => i.isNew);
  const ready = Object.keys(p.quests).some(id => E.qReady(id)) || p.bounties.active.some(b => b.prog >= b.n);
  const items = [
    inD ? ['home', 'map', 'Map', false] : ['home', 'town', 'Town', false],
    ['hero', 'hero', 'Hero', p.ap > 0],
    ['bag', 'bag', 'Bag', newItems],
    ['skills', 'star', 'Skills', p.sp > 0 && hasLearnable()],
    ['journal', 'journal', 'Journal', ready && !inD],
  ];
  return `<div class="bottomnav">${items.map(([k, ic, n, dot]) => `<button class="${active === k ? 'on' : ''}" data-a="nav" data-t="${k}">${G.icon(ic)}${n}${dot ? '<span class="dot"></span>' : ''}</button>`).join('')}</div>`;
};
G.A.nav = d => {
  if (d.t === 'home') G.UI.go(G.S.dungeon ? 'dungeon' : 'town');
  else G.UI.go(d.t);
};
function hasLearnable() {
  const p = G.S;
  return G.D.CLASSES[p.cls].skills.some(id => canLearn(id));
}
function canLearn(id) {
  const p = G.S, s = G.D.SKILLS[id], r = p.skills[id] || 0;
  return p.sp > 0 && r < s.max && p.level >= reqLevel(id, r);
}
function reqLevel(id, rank) { return G.D.SKILLS[id].lvl + rank * 3; }
S.page = (active, title, body) => `${G.UI.hud()}
  <div class="scroll grow pad">${title ? `<h2 class="mb">${title}</h2>` : ''}${body}<div style="height:16px"></div></div>
  ${G.nav(active)}`;

// ---------------- Hero ----------------
S.hero = {
  render() {
    const p = G.S, s = E.stats(), C = G.D.CLASSES[p.cls], B = G.D.BACKGROUNDS[p.bg], dt = E.dreadTier();
    const attrs = Object.keys(G.D.ATTRS).map(k => {
      const a = G.D.ATTRS[k], bonus = s.A[k] - p.attrs[k];
      return `<div class="attr"><span class="ab">${a.n}</span><span class="desc">${a.d}</span>
        <span class="val">${s.A[k]}${bonus ? `<div class="tiny good">+${bonus}</div>` : ''}</span>
        <button class="plus" data-a="addAttr" data-k="${k}" ${p.ap > 0 ? '' : 'disabled'}>+</button></div>`;
    }).join('');
    const kv = (k, v) => `<div class="kv"><span>${k}</span><span>${v}</span></div>`;
    return S.page('hero', '', `
      <div class="card"><div class="loc">${G.UI.portrait(p.cls)}
        <div class="grow"><div class="t">${U.esc(p.name)} ${p.hardcore ? '<span class="badge">Hardcore</span>' : ''}</div><div class="d">Level ${p.level} ${C.n} · ${B.n}</div>
        <div class="mt">${G.UI.bar('xp thin', p.xp, E.xpNeed(p.level), '')}</div><div class="tiny muted">${p.level >= E.MAX_LEVEL ? 'Max level' : `${p.xp} / ${E.xpNeed(p.level)} XP`}</div></div></div></div>
      <h3>Attributes ${p.ap > 0 ? `<span class="badge">${p.ap} points</span>` : ''}</h3>
      <div class="card">${attrs}</div>
      <h3>Combat</h3>
      <div class="card statgrid">
        ${kv('Max HP', s.maxHp)}${kv('Max Focus', s.maxFocus)}
        ${kv('Weapon Dmg', s.atkMin + '-' + s.atkMax)}${kv('Damage Bonus', '+' + s.dmgPct + '%')}
        ${kv('Spell Power', s.spell)}${kv('Holy Power', s.holy)}
        ${kv('Armor', s.armor)}${kv('Magic Resist', s.res + '%')}
        ${kv('Crit', s.crit.toFixed(1) + '%')}${kv('Crit Dmg', s.critDmg + '%')}
        ${kv('Dodge', s.dodge.toFixed(1) + '%')}${kv('Accuracy', Math.round(s.acc) + '%')}
        ${kv('Lifesteal', s.lifesteal + '%')}${kv('HP Regen', s.regen + '/turn')}
        ${kv('Focus Regen', s.focusRegen + '/turn')}${kv('Resolve', s.resolve)}
        ${s.dotPct ? kv('Ailment Dmg', '+' + s.dotPct + '%') : ''}${s.dmgStatus ? kv('Vs Afflicted', '+' + s.dmgStatus + '%') : ''}
        ${s.firstStrike ? kv('First Strike', '+' + s.firstStrike + '%') : ''}${s.cheatDeath ? kv('Deathless', 'Once per fight') : ''}
      </div>
      <h3>Survival</h3>
      <div class="card statgrid">
        ${kv('Dread', Math.floor(p.dread) + (dt.n ? ' (' + dt.n + ')' : ''))}${kv('Dread Resist', s.dreadRes + '%')}
        ${kv('Lantern', s.lightMax + ' Light')}${kv('Light Efficiency', s.lightEff + '%')}
      </div>
      ${dt.lvl ? `<div class="card mt small bad">${dt.n}: -${dt.acc}% accuracy${dt.dmg ? `, -${dt.dmg}% damage` : ''}${dt.lvl >= 3 ? ', and you may freeze in terror' : ''}.</div>` : ''}
      ${p.blessings.length ? `<h3>Boons (this expedition)</h3>${p.blessings.map(b => `<div class="card small"><b class="gold">${b.n}</b>: ${Object.keys(b.stats).map(k => E.statLine(k, b.stats[k])).join(', ')}</div>`).join('')}` : ''}
    `);
  },
};
G.A.addAttr = d => {
  const p = G.S; if (p.ap <= 0) return;
  const before = E.stats();
  p.attrs[d.k]++; p.ap--;
  const after = E.stats();
  p.hp += Math.max(0, after.maxHp - before.maxHp); p.focus += Math.max(0, after.maxFocus - before.maxFocus);
  E.clampVitals(); E.save(); G.UI.refresh();
};

// ---------------- Bag ----------------
S.bag = {
  tab: 'gear',
  render(p) {
    if (p && p.tab) this.tab = p.tab;
    const P = G.S, t = this.tab;
    const tabs = `<div class="tabs" style="margin:-14px -14px 12px">${[['gear', 'Equipment'], ['items', 'Supplies'], ['mats', 'Materials']].map(([k, n]) => `<button class="${t === k ? 'on' : ''}" data-a="bagTab" data-t="${k}">${n}</button>`).join('')}</div>`;
    let body = '';
    if (t === 'gear') {
      body += `<div class="slots">${G.D.SLOTS.map(sl => {
        const it = P.equip[sl], si = G.D.SLOT_INFO[sl];
        return `<div class="slot ${it ? 'has' : ''}" ${it ? `data-a="itemInfo" data-u="${it.uid}" data-eq="1"` : ''}><div class="sl">${G.icon(si.ic)} ${si.n}</div>
          ${it ? G.UI.itemIcon(it) : ''}<div class="nm">${it ? E.itemName(it) : '<span class="dim">Empty</span>'}</div></div>`;
      }).join('')}</div>`;
      const bag = P.bag.slice().sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0) || b.rarity - a.rarity || b.ilvl - a.ilvl);
      body += `<h3 class="row between"><span>Backpack</span><span class="${P.bag.length >= E.BAG_SIZE ? 'bad' : 'muted'}">${P.bag.length} / ${E.BAG_SIZE}</span></h3>`;
      body += bag.length ? bag.map(it => itemRow(it)).join('') : '<p class="muted small center">Your backpack is empty. The dark is full of things worth carrying.</p>';
    } else if (t === 'items') {
      const ids = Object.keys(G.D.CONS).filter(id => P.cons[id] > 0);
      body += ids.length ? ids.map(id => {
        const c = G.D.CONS[id];
        const usable = canUseHere(id);
        return `<div class="item-row" style="cursor:default">${G.UI.artIcon(G.ART.cons(id))}<div class="info"><div class="nm">${c.n} <span class="muted">×${P.cons[id]}</span></div><div class="sub">${c.desc}</div></div>
          ${usable ? `<button class="btn small" data-a="useCons" data-k="${id}">Use</button>` : ''}</div>`;
      }).join('') : '<p class="muted small center">No supplies. Visit Wren\'s apothecary in town.</p>';
      if (P.dungeon) body += '<p class="tiny muted mt">Camp Kits and Homeward Ash are used from the dungeon action bar.</p>';
    } else {
      body += Object.keys(G.D.MATS).map(id => { const m = G.D.MATS[id]; return `<div class="item-row" style="cursor:default">${G.UI.artIcon(G.ART.mat(id))}<div class="info"><div class="nm">${m.n} <span class="muted">×${P.mats[id] || 0}</span></div><div class="sub">${m.desc}</div></div></div>`; }).join('');
      const q = Object.keys(P.qitems).filter(k => P.qitems[k]);
      body += '<h3>Quest Items</h3>' + (q.length ? q.map(id => `<div class="item-row" style="cursor:default">${G.UI.artIcon(G.ART.qitem(id))}<div class="info"><div class="nm gold">${G.D.QITEMS[id].n}</div><div class="sub">${G.D.QITEMS[id].desc}</div></div></div>`).join('') : '<p class="muted small">None.</p>');
    }
    return S.page('bag', '', tabs + body);
  },
  leave() { if (G.S) G.S.bag.forEach(i => { i.isNew = false; }); },
};
function canUseHere(id) {
  const p = G.S;
  if (['ash', 'campkit'].includes(id) || G.D.CONS[id].combatOnly) return false;
  if (id === 'oil') return !!p.dungeon;
  return true;
}
function itemRow(it, right) {
  const si = G.D.SLOT_INFO[it.slot];
  const cur = G.S.equip[it.slot];
  const diff = E.itemPower(it) - E.itemPower(cur);
  const arrow = !cur ? '<span class="cmp-up tiny">new slot</span>' : diff > 0 ? `<span class="cmp-up tiny">▲ ${diff}</span>` : diff < 0 ? `<span class="cmp-down tiny">▼ ${-diff}</span>` : '<span class="tiny muted">=</span>';
  return `<div class="item-row ${it.isNew ? 'new' : ''}" data-a="${right ? right.act : 'itemInfo'}" data-u="${it.uid}">
    ${G.UI.itemIcon(it)}
    <div class="info"><div class="nm">${E.itemName(it)}</div><div class="sub">${G.D.RARITY[it.rarity].n} ${si.n} · iLvl ${it.ilvl} ${it.fresh && G.S.dungeon ? '· <span class="gold">found this trip</span>' : ''}</div></div>
    <div class="tiny" style="text-align:right">${right ? right.label : arrow}</div></div>`;
}
S.itemRow = itemRow;
S.itemDetail = (it, buttons) => `<div class="row">${G.UI.itemIcon(it, { cls: 'lg' })}
    <div><div style="font-size:1.1em">${E.itemName(it)}</div><div class="tiny muted">${G.D.RARITY[it.rarity].n} ${G.D.SLOT_INFO[it.slot].n} · Item level ${it.ilvl}${it.up ? ' · Upgraded +' + it.up : ''}</div></div></div>
  <div class="body mt">${E.itemLines(it).map(l => `<div class="fxline" style="padding:2px 0">${l}</div>`).join('')}
    ${it.lore ? `<div class="lore-q">${it.lore}</div>` : ''}
    ${E.compare(it)}
    <div class="tiny dim mt">Sells for ${E.sellPrice(it)} gold</div></div>
  <div class="foot btn-grid">${buttons}</div>`;
G.A.bagTab = d => { S.bag.tab = d.t; G.UI.refresh(); };
G.A.itemInfo = d => {
  const p = G.S;
  const eq = d.eq === '1';
  const it = eq ? Object.values(p.equip).find(i => i && i.uid === d.u) : p.bag.find(i => i.uid === d.u);
  if (!it) return;
  it.isNew = false;
  const btns = eq ? `<button class="btn ghost" data-a="closeModal">Close</button><button class="btn" data-a="unequip" data-s="${it.slot}">Unequip</button>`
    : `<button class="btn danger" data-a="discard" data-u="${it.uid}">Discard</button><button class="btn primary" data-a="equip" data-u="${it.uid}">Equip</button>`;
  G.UI.modal(S.itemDetail(it, btns));
};
G.A.equip = d => { E.equip(d.u); G.Audio.sfx('forge'); G.UI.closeModal(); E.save(); G.UI.refresh(); };
G.A.unequip = d => { E.unequip(d.s); G.UI.closeModal(); E.save(); G.UI.refresh(); };
G.A.discard = d => {
  const it = G.S.bag.find(i => i.uid === d.u);
  G.UI.closeModal();
  G.UI.confirm('Discard item?', `${E.itemName(it)} will be lost. You could sell or salvage it in town instead.`, 'Discard', () => {
    G.S.bag = G.S.bag.filter(i => i.uid !== d.u); E.save(); G.UI.refresh();
  }, true);
};
G.A.useCons = d => {
  const msg = E.useCons(d.k, { cure: () => {} });
  if (msg) { G.UI.toast(msg, 'good'); E.save(); G.UI.refresh(); }
};

// ---------------- Skills ----------------
S.skills = {
  render() {
    const p = G.S, C = G.D.CLASSES[p.cls];
    const card = id => {
      const s = G.D.SKILLS[id], r = p.skills[id] || 0, req = reqLevel(id, r);
      const locked = r === 0 && p.level < s.lvl;
      const can = canLearn(id);
      return `<div class="skill ${locked ? 'locked' : ''}"><div class="hd">
        <span class="${s.kind === 'active' ? 'gold' : 'muted'}">${G.icon(s.kind === 'active' ? 'bolt' : 'rune')}</span>
        <span class="nm">${s.n}</span><div class="pips">${Array.from({ length: s.max }, (_, k) => `<i class="${k < r ? 'on' : ''}"></i>`).join('')}</div></div>
        <div class="tiny muted mt">${s.kind === 'active' ? `Active · ${s.cost} Focus · ${s.target === 'all' ? 'All enemies' : s.target === 'self' ? 'Self' : 'Single target'}` : 'Passive'}${r < s.max ? ` · ${r ? 'Next rank' : 'Requires'} Lv ${req}` : ' · Mastered'}</div>
        <div class="small mt">${s.desc(Math.max(1, r))}</div>
        ${r > 0 && r < s.max ? `<div class="tiny good mt">Next: ${s.desc(r + 1)}</div>` : ''}
        ${r < s.max ? `<button class="btn small ${can ? 'primary' : ''} mt block" data-a="learn" data-k="${id}" ${can ? '' : 'disabled'}>${r ? 'Rank Up' : 'Learn'} (1 point)</button>` : ''}
      </div>`;
    };
    // Split into sections once a class grows past 10 skills (mastery skills at lvl 15+)
    const master = id => G.D.SKILLS[id].lvl >= 15;
    let list = '';
    const grp = (title, ids) => { if (ids.length) list += (title ? `<h3>${title}</h3>` : '') + ids.map(card).join(''); };
    if (C.skills.some(master)) {
      const early = C.skills.filter(id => !master(id));
      grp('', early.filter(id => G.D.SKILLS[id].kind === 'active'));
      grp('Passives', early.filter(id => G.D.SKILLS[id].kind === 'passive'));
      grp('Mastery', C.skills.filter(master));
    } else list = C.skills.map(card).join('');
    return S.page('skills', '', `<div class="row between mb"><h2>${C.n} Skills</h2><span class="chip gold">${p.sp} points</span></div>
      <p class="tiny muted">You earn 1 skill point per level and from some quests. Each rank requires 3 more levels than the last. Respec at the Chapel.</p>${list}`);
  },
};
G.A.learn = d => {
  const p = G.S;
  if (!canLearn(d.k)) return;
  const before = E.stats();
  p.skills[d.k] = (p.skills[d.k] || 0) + 1; p.sp--;
  const after = E.stats();
  p.hp += Math.max(0, after.maxHp - before.maxHp); p.focus += Math.max(0, after.maxFocus - before.maxFocus);
  E.clampVitals();
  G.Audio.sfx('levelup'); G.UI.toast(`${G.D.SKILLS[d.k].n} is now rank ${p.skills[d.k]}`, 'gold');
  E.save(); G.UI.refresh();
};

// ---------------- Journal ----------------
S.journal = {
  tab: 'quests',
  render(prm) {
    if (prm && prm.tab) { this.tab = prm.tab; prm.tab = null; }
    const p = G.S, t = this.tab;
    const tabs = `<div class="tabs" style="margin:-14px -14px 12px">${[['quests', 'Quests'], ['bounty', 'Bounties'], ['codex', 'Codex'], ['records', 'Records']].map(([k, n]) => `<button class="${t === k ? 'on' : ''}" data-a="jTab" data-t="${k}">${n}</button>`).join('')}</div>`;
    let body = '';
    if (t === 'quests') {
      const ids = Object.keys(p.quests);
      const active = ids.filter(id => p.quests[id].st === 'active').sort((a, b) => (G.D.QUESTS[a].type === 'main' ? -1 : 1));
      const done = ids.filter(id => p.quests[id].st === 'done');
      const avail = Object.keys(G.D.QUESTS).filter(id => E.qAvailable(id));
      body += active.length ? active.map(id => S.questCard(id)).join('') : '<p class="muted small">No active quests.</p>';
      if (avail.length) body += `<h3>Available in town</h3>` + avail.map(id => { const q = G.D.QUESTS[id]; return `<div class="card quest ${q.type} small"><b>${q.n}</b> <span class="muted">· ${G.D.NPCS[q.giver].n}, rec. Lv ${q.lvl}</span></div>`; }).join('');
      if (done.length) body += `<h3>Completed</h3>` + done.map(id => `<div class="card quest done small">${G.D.QUESTS[id].n}</div>`).join('');
    } else if (t === 'bounty') {
      body += p.bounties.active.length ? p.bounties.active.map(b => S.bountyCard(b)).join('') : '<p class="muted small">No active bounties. Take them from the board in the Wardens\' Hall.</p>';
    } else if (t === 'codex') {
      const cats = {};
      Object.keys(G.D.CODEX).forEach(id => { const c = G.D.CODEX[id]; (cats[c.cat] = cats[c.cat] || []).push(id); });
      body += `<p class="tiny muted">${p.codex.length} of ${Object.keys(G.D.CODEX).length} entries discovered.</p>`;
      for (const c in cats) body += `<h3>${c}</h3>` + cats[c].map(id => p.codex.includes(id) ? `<div class="item-row" data-a="readCodex" data-k="${id}"><div class="g gold">${G.icon('scroll')}</div><div class="info"><div class="nm">${G.D.CODEX[id].n}</div></div></div>` : `<div class="item-row" style="opacity:.4;cursor:default"><div class="g">${G.icon('question')}</div><div class="info"><div class="nm">Undiscovered</div></div></div>`).join('');
    } else {
      const s = p.stats;
      const kv = (k, v) => `<div class="kv"><span>${k}</span><span>${v}</span></div>`;
      body += `<div class="card">${kv('Time played', U.fmtTime(p.playtime))}${kv('Expeditions', s.expeditions)}${kv('Foes slain', s.kills)}${kv('Bosses slain', s.bosses)}${kv('Events faced', s.events)}${kv('Deaths', s.deaths)}${kv('Gold earned', s.gold)}${kv('Deepest Undercroft floor', (p.zp[E.endlessZone()] || {}).deepest || '-')}</div>`;
      body += '<h3>Bestiary</h3>' + Object.keys(G.D.ENEMIES).map(id => {
        const e = G.D.ENEMIES[id], k = p.kills[id] || 0;
        return k ? `<div class="card small"><div class="row"><img src="${G.ART.foe({ id })}" style="width:52px;height:52px;object-fit:contain;flex:none" alt=""><div class="grow"><div class="row between"><b class="${e.rank === 'boss' ? 'bad' : e.rank === 'elite' ? 'r3' : ''}">${e.n}</b><span class="muted">Slain ×${k}</span></div><div class="tiny muted mt">${e.desc}</div></div></div></div>` : '';
      }).join('') || '<p class="muted small">Nothing slain yet.</p>';
    }
    return S.page('journal', '', tabs + body);
  },
};
S.questCard = (id, withBtn) => {
  const q = G.D.QUESTS[id], pr = E.qProgress(id), st = E.qState(id), r = q.reward || {};
  const rw = [r.gold ? r.gold + ' gold' : '', r.xp ? r.xp + ' XP' : '', r.sp ? r.sp + ' skill pt' : '', r.item != null ? G.D.RARITY[r.item].n + ' item' : '', r.flag === 'hammer' ? 'Smith +5 upgrades' : '', r.flag === 'elixir' ? 'Unlocks Crimson Elixir' : '', r.cons ? Object.keys(r.cons).map(k => r.cons[k] + '× ' + G.D.CONS[k].n).join(', ') : ''].filter(Boolean).join(' · ');
  return `<div class="card quest ${q.type}">
    <div class="row between"><b>${q.n}</b><span class="tiny muted">${q.type === 'main' ? 'Main' : 'Side'}</span></div>
    <div class="obj">${q.desc}</div>
    ${st === 'active' ? `<div class="obj ${pr.done ? 'good' : ''}">${pr.done ? `Complete! Return to ${G.D.NPCS[q.giver].n}.` : `Progress: ${pr.cur} / ${pr.need}`}</div>` : ''}
    <div class="reward">${G.icon('coin')} ${rw}</div>
    ${withBtn || ''}</div>`;
};
S.bountyCard = (b, btn) => {
  const e = G.D.ENEMIES[b.enemy];
  return `<div class="card quest bounty"><div class="row between"><b>Bounty: ${e.n}</b><span class="tiny muted">${G.D.ZONES[b.zone].short}</span></div>
    <div class="obj">Slay ${b.n} ${e.n}. ${b.prog != null ? `<span class="${b.prog >= b.n ? 'good' : ''}">(${Math.min(b.prog, b.n)} / ${b.n})</span>` : ''}</div>
    <div class="reward">${G.icon('coin')} ${b.gold} gold · ${b.xp} XP</div>${btn || ''}</div>`;
};
G.A.jTab = d => { S.journal.tab = d.t; G.UI.refresh(); };
G.A.readCodex = d => { const c = G.D.CODEX[d.k]; G.UI.alert(c.n, `<div class="tiny gold mb">${c.cat}</div><p style="line-height:1.65">${c.txt}</p>`, 'Close'); };
})();
