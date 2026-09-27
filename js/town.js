/* Candlemere town hub and its locations */
(() => {
const S = G.Screens, U = G.U, E = G.Engine;

const LOCS = {
  hall: { n: 'Wardens\' Hall', ic: 'shield', npc: 'maelis', d: 'Main quests and the bounty board.' },
  inn: { n: 'The Guttering Candle', ic: 'mug', npc: 'hesk', d: 'Rest, rumors, side work and your stash.' },
  smith: { n: 'Anvil & Ash', ic: 'anvil', npc: 'orla', d: 'Buy, sell, upgrade and salvage gear.' },
  apoth: { n: 'Bitterroot & Bone', ic: 'mortar', npc: 'wren', d: 'Draughts, tonics, oil and supplies.' },
  chapel: { n: 'Chapel of the Wick', ic: 'chapel', npc: 'caddoc', d: 'Cleanse Dread, receive blessings, respec.' },
  curio: { n: 'Osk\'s Curios', ic: 'coinbag', npc: 'osk', d: 'Rare relics from the deep. Expensive.', req: () => G.S.flags.osk_free },
  well: { n: 'The Old Well', ic: 'drop', npc: 'anselle', d: 'A widow keeps vigil here.', req: () => E.qDone('m2') || G.S.quests.s_locket },
  gate: { n: 'The Gloam Gate', ic: 'gate', d: 'Leave the light behind. Begin an expedition.' },
};

// An NPC only shows as a quest giver once unlocked (e.g. Scribe Marrow arrives after the Cantor falls)
function npcOpen(npc) {
  const n = G.D.NPCS[npc];
  return n && (!n.req || G.S.flags[n.req]);
}
function npcQuests(npc) {
  if (!npcOpen(npc)) return [];
  return Object.keys(G.D.QUESTS).filter(id => G.D.QUESTS[id].giver === npc && (E.qAvailable(id) || E.qState(id) === 'active'));
}
// Extra NPCs a location can host beyond its resident (here: Scribe Marrow at the Inn after Act I)
const LOCNPCS = { inn: () => ['hesk'].concat(npcOpen('marrow') ? ['marrow'] : []) };
function locBadge(k) {
  const L = LOCS[k];
  if (!L.npc && !LOCNPCS[k]) return '';
  const givers = LOCNPCS[k] ? LOCNPCS[k]() : npcOpen(L.npc) ? [L.npc] : [];
  const qs = Object.keys(G.D.QUESTS).filter(id => givers.includes(G.D.QUESTS[id].giver));
  if (qs.some(id => E.qReady(id)) || (k === 'hall' && G.S.bounties.active.some(b => b.prog >= b.n))) return '<span class="badge">Turn in</span>';
  if (qs.some(id => E.qAvailable(id))) return '<span class="badge">New quest</span>';
  return '';
}

S.town = {
  render() {
    const p = G.S;
    const keys = Object.keys(LOCS).filter(k => !LOCS[k].req || LOCS[k].req());
    const next = Object.keys(G.D.QUESTS).find(id => G.D.QUESTS[id].type === 'main' && (E.qState(id) === 'active' || E.qAvailable(id)));
    let hint = '';
    if (next) {
      const q = G.D.QUESTS[next];
      hint = E.qAvailable(next) ? `Speak with ${G.D.NPCS[q.giver].n} at the Wardens' Hall.` : E.qReady(next) ? `Report to ${G.D.NPCS[q.giver].n}: ${q.n}.` : q.desc;
    } else if (p.flags.ended2) hint = 'The dark is quiet. The Reach endures, and so do you.';
    else if (p.flags.ended) hint = 'The Endless Undercroft awaits beneath the Cathedral.';
    return `${G.UI.hud()}
    <div class="scroll grow">
      <div class="banner"><img class="hero-img" src="assets/img/town.jpg" alt=""><div class="cap"><h2>Candlemere</h2><div class="muted small">The last lit town. The Wick burns low.</div></div></div>
      <div class="pad" style="padding-top:4px">
        ${hint ? `<div class="card tip small mb" data-a="nav" data-t="journal"><div class="hd" style="margin:0">${G.icon('journal')} <span>${hint}</span></div></div>` : ''}
        ${keys.map(k => { const L = LOCS[k]; return `<div class="card tap" data-a="goLoc" data-k="${k}" ${k === 'gate' ? 'style="border-color:#8a5a1c;background:linear-gradient(180deg,#2a1d10,#16110b)"' : ''}>
          <div class="loc"><div class="glyph">${G.icon(L.ic, 'lg')}</div><div class="grow"><div class="t">${L.n}${locBadge(k)}</div><div class="d">${L.npc ? G.D.NPCS[L.npc].n + ' · ' : ''}${L.d}</div></div></div></div>`; }).join('')}
      </div>
    </div>
    ${G.nav('home')}`;
  },
  after() {
    G.Audio.ambient('town');
    S.tip('town');
    S.checkLevel();
  },
};
G.A.goLoc = d => G.UI.go('loc', { k: d.k, tab: null });

S.loc = {
  render(prm) {
    const L = LOCS[prm.k], npc = L.npc ? G.D.NPCS[L.npc] : null;
    if (!prm.greet && npc) prm.greet = U.pick(npc.greet);
    const body = LOCBODY[prm.k](prm);
    return `${G.UI.hud()}
    <div class="topbar" style="padding-top:8px"><div class="row"><button class="iconbtn" data-a="toTown">${G.icon('back')}</button>
      <div class="grow"><div class="name">${L.n}</div>${npc ? `<div class="tiny muted">${npc.n}, ${npc.title}</div>` : ''}</div><span class="gold">${G.icon(L.ic, 'lg')}</span></div></div>
    <div class="scroll grow pad">
      ${npc ? `<p class="lore-q" style="margin-top:0">${prm.greet}</p>` : ''}
      ${body}
      <div style="height:20px"></div>
    </div>
    ${G.nav('home')}`;
  },
  after(prm) { if (prm.k === 'smith') S.tip('smith'); if (prm.k === 'gate') S.tip('gate'); S.checkLevel(); },
};
G.A.toTown = () => G.UI.go('town');

function questSection(npc) {
  const qs = npcQuests(npc);
  if (!qs.length) return '';
  return '<h3>Quests</h3>' + qs.map(id => {
    const st = E.qState(id);
    let btn = '';
    if (!st) btn = `<button class="btn small primary mt block" data-a="qOffer" data-q="${id}">Hear them out</button>`;
    else if (E.qReady(id)) btn = `<button class="btn small primary mt block" data-a="qTurnIn" data-q="${id}">Turn in</button>`;
    return !st ? `<div class="card quest ${G.D.QUESTS[id].type}"><div class="row between"><b>${G.D.QUESTS[id].n}</b><span class="badge">New</span></div><div class="obj">Recommended level ${G.D.QUESTS[id].lvl}</div>${btn}</div>` : S.questCard(id, btn);
  }).join('');
}
G.A.qOffer = d => {
  const q = G.D.QUESTS[d.q];
  G.UI.modal(`<h2>${q.n}</h2><div class="body mt"><p style="line-height:1.6">${q.offer}</p><div class="card small"><b>Objective:</b> ${q.desc}</div></div>
    <div class="foot btn-grid"><button class="btn ghost" data-a="closeModal">Not now</button><button class="btn primary" data-a="qAccept" data-q="${d.q}">Accept</button></div>`, { center: true });
};
G.A.qAccept = d => { G.UI.closeModal(); E.accept(d.q); G.UI.refresh(); };
G.A.qTurnIn = d => {
  const q = G.D.QUESTS[d.q];
  const res = E.turnIn(d.q);
  if (!res) return;
  G.UI.refresh();
  G.UI.alert(`${G.icon('star')} ${q.n}`, `<p style="line-height:1.6">${q.done}</p><div class="outcome">${res.lines.join('')}</div>`);
  S.checkLevel();
};

// ---------------- Location bodies ----------------
const LOCBODY = {
  hall(prm) {
    const p = G.S, b = p.bounties;
    let h = questSection('maelis');
    h += `<h3>Bounty Board</h3><p class="tiny muted">Up to 3 active bounties. The board refreshes after each expedition.</p>`;
    h += b.active.map(x => S.bountyCard(x, x.prog >= x.n ? `<button class="btn small primary mt block" data-a="bountyClaim" data-id="${x.id}">Claim reward</button>` : `<button class="btn small ghost mt block" data-a="bountyDrop" data-id="${x.id}">Abandon</button>`)).join('');
    h += b.offers.map(x => S.bountyCard(Object.assign({}, x, { prog: null }), `<button class="btn small mt block" data-a="bountyTake" data-id="${x.id}" ${b.active.length >= 3 ? 'disabled' : ''}>Take bounty</button>`)).join('');
    return h;
  },
  inn(prm) {
    const p = G.S, cost = restCost();
    let h = `<div class="btn-col">
      <button class="btn primary" data-a="innRest" ${p.gold < cost ? 'disabled' : ''}>${G.icon('moon')} Rent a room (${cost} gold)<span class="sub">&nbsp;Full HP & Focus, -25 Dread</span></button>
      <button class="btn" data-a="innRumor">${G.icon('mug')} Buy a round and listen (5 gold)</button>
      <button class="btn" data-a="openStash">${G.icon('treasure')} Your stash (${p.stash.length} / 60)</button>
    </div>`;
    if (prm.rumor) h += `<div class="card mt small lore-q" style="font-style:normal">${prm.rumor}</div>`;
    h += LOCNPCS.inn().map(npc => questSection(npc)).join('');
    return h;
  },
  smith(prm) {
    const p = G.S, t = prm.tab || 'buy';
    let h = `<div class="tabs" style="margin:0 -14px 12px">${[['buy', 'Buy'], ['sell', 'Sell'], ['upgrade', 'Upgrade'], ['salvage', 'Salvage']].map(([k, n]) => `<button class="${t === k ? 'on' : ''}" data-a="locTab" data-t="${k}">${n}</button>`).join('')}</div>`;
    h += `<div class="row wrap mb" style="gap:6px"><span class="chip">${G.icon('hammer')} Scrap ${p.mats.scrap}</span><span class="chip">${G.icon('rune')} Shards ${p.mats.shard}</span><span class="chip">Bag ${p.bag.length}/${E.BAG_SIZE}</span></div>`;
    if (t === 'buy') {
      h += p.shops.smith.length ? p.shops.smith.map(it => S.itemRow(it, { act: 'shopView', label: `<span class="gold">${E.buyPrice(it)}g</span>` }).replace('data-u=', 'data-shop="smith" data-u=')).join('') : '<p class="muted">Sold out until your next expedition.</p>';
    } else if (t === 'sell') {
      h += p.bag.length ? `<button class="btn small ghost block mb" data-a="sellCommon">Sell all Common items</button>` + p.bag.map(it => S.itemRow(it, { act: 'sellView', label: `<span class="gold">${E.sellPrice(it)}g</span>` })).join('') : '<p class="muted">Nothing to sell.</p>';
    } else if (t === 'upgrade') {
      h += `<p class="tiny muted">Each upgrade adds +8% to an item's damage or armor. Max +${E.maxUpgrade()}${p.flags.hammer ? '' : ' (Orla needs her lost hammer to go beyond +3)'}.</p>`;
      const items = [...Object.values(p.equip).filter(Boolean), ...p.bag].filter(i => i.dmg || i.armor);
      h += items.map(it => {
        const c = E.upgradeCost(it), max = (it.up || 0) >= E.maxUpgrade();
        return S.itemRow(it, { act: 'upView', label: max ? '<span class="muted">Max</span>' : `<span class="gold">${c.gold}g</span><br><span class="muted">${c.scrap} scrap${c.shard ? ' · ' + c.shard + ' shard' : ''}</span>` });
      }).join('');
    } else {
      h += `<p class="tiny muted">Break items down into Iron Scrap and, for rare items, Gloam Shards.</p>`;
      h += p.bag.length ? `<button class="btn small ghost block mb" data-a="salvageCommon">Salvage all Common items</button>` + p.bag.map(it => { const y = E.salvageYield(it); return S.itemRow(it, { act: 'salvView', label: `<span class="muted">${y.scrap} scrap${y.shard ? '<br>' + y.shard + ' shard' : ''}</span>` }); }).join('') : '<p class="muted">Nothing to salvage.</p>';
    }
    h += questSection('orla');
    return h;
  },
  apoth(prm) {
    const p = G.S;
    let h = '<h3>Supplies</h3>';
    h += Object.keys(G.D.CONS).filter(id => E.consUnlocked(id)).map(id => {
      const c = G.D.CONS[id];
      return `<div class="item-row" style="cursor:default">${G.UI.artIcon(G.ART.cons(id))}
        <div class="info"><div class="nm">${c.n} <span class="muted">· owned ${p.cons[id] || 0}</span></div><div class="sub">${c.desc}</div></div>
        <button class="btn small" data-a="buyCons" data-k="${id}" ${p.gold < c.price ? 'disabled' : ''}>${c.price}g</button></div>`;
    }).join('');
    if (!p.flags.elixir) h += '<p class="tiny muted mt">Wren could brew stronger remedies with the right ingredients...</p>';
    h += questSection('wren');
    return h;
  },
  chapel(prm) {
    const p = G.S, cc = cleanseCost(), rc = respecCost();
    let h = `<div class="btn-col">
      <button class="btn primary" data-a="cleanse" ${p.gold < cc || p.dread < 1 ? 'disabled' : ''}>${G.icon('flame')} Cleansing Rite (${cc} gold)<span class="sub">&nbsp;Remove all Dread</span></button>
    </div><h3>Blessings</h3><p class="tiny muted">One blessing lasts for your next expedition. Buying another replaces it.</p>`;
    const cur = p.blessings.find(b => b.chapel);
    h += BLESSINGS.map((b, i) => `<div class="item-row" style="cursor:default"><div class="g gold">${G.icon('sparkle')}</div><div class="info"><div class="nm">${b.n} ${cur && cur.n === b.n ? '<span class="badge">Active</span>' : ''}</div><div class="sub">${Object.keys(b.stats).map(k => E.statLine(k, scaleBless(b.stats[k], k))).join(', ')}</div></div>
      <button class="btn small" data-a="bless" data-i="${i}" ${p.gold < blessCost() ? 'disabled' : ''}>${blessCost()}g</button></div>`).join('');
    h += `<h3>Penance</h3><button class="btn block" data-a="respec" ${p.gold < rc ? 'disabled' : ''}>${G.icon('rune')} Rite of Unmaking (${rc} gold)<span class="sub">&nbsp;Reset attributes & skills</span></button>`;
    h += questSection('caddoc');
    return h;
  },
  curio(prm) {
    const p = G.S;
    let h = `<h3>Relics</h3>`;
    h += p.shops.osk.length ? p.shops.osk.map(it => S.itemRow(it, { act: 'shopView', label: `<span class="gold">${E.buyPrice(it, 1.6)}g</span>` }).replace('data-u=', 'data-shop="osk" data-u=')).join('') : '<p class="muted">"All gone! Come back after your next trip."</p>';
    h += `<h3>Materials</h3><div class="item-row" style="cursor:default"><div class="g">${G.icon('rune')}</div><div class="info"><div class="nm">Gloam Shard <span class="muted">· owned ${p.mats.shard}</span></div><div class="sub">Needed for +4 and +5 upgrades.</div></div><button class="btn small" data-a="buyShard" ${p.gold < 120 ? 'disabled' : ''}>120g</button></div>`;
    h += `<div class="item-row" style="cursor:default"><div class="g">${G.icon('hammer')}</div><div class="info"><div class="nm">Iron Scrap ×3</div><div class="sub">Upgrade material.</div></div><button class="btn small" data-a="buyScrap" ${p.gold < 45 ? 'disabled' : ''}>45g</button></div>`;
    return h;
  },
  well(prm) { return questSection('anselle') || '<p class="muted">Anselle watches the water in silence.</p>'; },
  gate(prm) {
    const p = G.S;
    const camps = npcOpen('tamsin') && npcQuests('tamsin').length ? `<h3>Hunter's Camp</h3><div class="card small mb"><div class="loc"><div class="glyph">${G.icon('bolt')}</div><div class="grow"><div class="t">${G.D.NPCS.tamsin.n}</div><div class="d">${G.D.NPCS.tamsin.title || ''}</div></div></div><p class="small lore-q" style="margin:8px 0 0">${G.U.pick(G.D.NPCS.tamsin.greet)}</p></div>${questSection('tamsin')}` : '';
    return `${camps}<p class="muted small" style="margin-top:0">The Vigil wardens raise the portcullis for Lanternbearers only. Prepare well: you cannot shop in the dark (usually).</p>
      <div class="row wrap mb" style="gap:6px"><span class="chip">${G.icon('potion')} Draughts ${p.cons.potion || 0}</span><span class="chip">${G.icon('lantern')} Oil ${p.cons.oil || 0}</span><span class="chip">${G.icon('sparkle')} Ash ${p.cons.ash || 0}</span><span class="chip">${G.icon('camp')} Camp ${p.cons.campkit || 0}</span></div>
      ${E.zoneOrder().map(z => {
        const Z = G.D.ZONES[z], un = E.zoneUnlocked(z), deep = (p.zp[z] || { deepest: 0 }).deepest;
        if (!un && Z.endless) return '';
        const maxStart = Z.endless ? Math.max(1, deep) : Math.min(Z.floors, Math.max(1, deep));
        const floors = Z.endless ? [...new Set([1, Math.max(1, deep - 5), Math.max(1, deep - 2), maxStart])].filter(f => f <= maxStart) : Array.from({ length: maxStart }, (_, i) => i + 1);
        const lv = Z.endless ? '18+' : Z.lvls[0] + '-' + (Z.lvls[Z.lvls.length - 1] + 1);
        return `<div class="card" style="padding:0;overflow:hidden;${un ? '' : 'opacity:.5'}">
          <img src="assets/img/${Z.img}.jpg" style="width:100%;height:96px;object-fit:cover;display:block;filter:brightness(.7)${un ? '' : ' grayscale(1)'}" alt="">
          <div class="pad"><div class="row between"><b class="gold">${Z.n}</b><span class="chip">Lv ${lv}</span></div>
          <div class="tiny muted mt">${Z.desc}</div>
          ${un ? `<div class="tiny mt">${Z.endless ? `Deepest floor: ${deep || 0}` : `Floors reached: ${deep} / ${Z.floors}${p.flags['boss_' + Z.boss] ? ' · <span class="good">Boss slain</span>' : ''}`}</div>
            <div class="row wrap mt" style="gap:6px">${floors.map(f => `<button class="btn small ${f === maxStart ? 'primary' : ''}" data-a="startExp" data-z="${z}" data-f="${f}">Floor ${f}</button>`).join('')}</div>`
            : `<div class="tiny bad mt">Sealed. ${E.zoneReqText(z)}</div>`}</div></div>`;
      }).join('')}`;
  },
};

// ---------------- Actions ----------------
const restCost = () => 10 + G.S.level * 3;
const cleanseCost = () => 15 + G.S.level * 5;
const respecCost = () => 40 * G.S.level;
const blessCost = () => 25 + G.S.level * 8;
const BLESSINGS = [
  { n: 'Blessing of the Wick', stats: { dmg: 10 } },
  { n: 'Warden\'s Aegis', stats: { armor: 6 } },
  { n: 'Saint Ivel\'s Calm', stats: { resolve: 25, lightEff: 15 } },
  { n: 'Ember of Vigor', stats: { hp: 20, regen: 1 } },
];
function scaleBless(v, k) { return ['armor', 'hp', 'resolve'].includes(k) ? Math.round(v * (1 + G.S.level / 10)) : v; }

G.A.locTab = d => { G.UI.cur.params.tab = d.t; G.UI.refresh(); };
G.A.innRest = () => {
  const p = G.S, c = restCost(); if (p.gold < c) return;
  p.gold -= c; const s = E.stats(); p.hp = s.maxHp; p.focus = s.maxFocus; E.addDread(-25);
  G.Audio.sfx('heal'); G.UI.toast('You sleep, and do not dream. HP and Focus restored.', 'good'); E.save(); G.UI.refresh();
};
G.A.innRumor = () => {
  const p = G.S; if (p.gold < 5) { G.UI.toast('Not enough gold.', 'bad'); return; }
  p.gold -= 5; G.UI.cur.params.rumor = U.pick(G.D.RUMORS); E.save(); G.UI.refresh();
};
G.A.openStash = () => {
  const p = G.S;
  const html = `<h2>${G.icon('treasure')} Stash</h2><p class="tiny muted">Items in your stash are safe, even if you fall in the dark. Tap to move items.</p>
    <div class="body"><h3>Stash (${p.stash.length}/60)</h3>${p.stash.map(it => S.itemRow(it, { act: 'stashOut', label: '<span class="muted">Take</span>' })).join('') || '<p class="muted small">Empty.</p>'}
    <h3>Backpack (${p.bag.length}/${E.BAG_SIZE})</h3>${p.bag.map(it => S.itemRow(it, { act: 'stashIn', label: '<span class="muted">Store</span>' })).join('') || '<p class="muted small">Empty.</p>'}</div>
    <div class="foot"><button class="btn block" data-a="closeModal">Close</button></div>`;
  if (G.UI.hasModal()) G.UI.updateModal(html); else G.UI.modal(html);
};
G.A.stashIn = d => {
  const p = G.S; if (p.stash.length >= 60) { G.UI.toast('Stash is full.', 'bad'); return; }
  const i = E.findBag(d.u); if (i < 0) return; const it = p.bag.splice(i, 1)[0]; it.isNew = false; p.stash.push(it); E.save(); G.A.openStash();
};
G.A.stashOut = d => {
  const p = G.S; if (E.bagFull()) { G.UI.toast('Backpack is full.', 'bad'); return; }
  const i = p.stash.findIndex(x => x.uid === d.u); if (i < 0) return; p.bag.push(p.stash.splice(i, 1)[0]); E.save(); G.A.openStash();
};
G.A.shopView = d => {
  const p = G.S, list = p.shops[d.shop], it = list.find(i => i.uid === d.u); if (!it) return;
  const price = E.buyPrice(it, d.shop === 'osk' ? 1.6 : 1.3);
  G.UI.modal(S.itemDetail(it, `<button class="btn ghost" data-a="closeModal">Close</button><button class="btn primary" data-a="buyItem" data-shop="${d.shop}" data-u="${it.uid}" ${p.gold < price ? 'disabled' : ''}>Buy · ${price}g</button>`));
};
G.A.buyItem = d => {
  const p = G.S, list = p.shops[d.shop], i = list.findIndex(x => x.uid === d.u); if (i < 0) return;
  const it = list[i], price = E.buyPrice(it, d.shop === 'osk' ? 1.6 : 1.3);
  if (p.gold < price) return;
  if (E.bagFull()) { G.UI.toast('Backpack is full.', 'bad'); return; }
  p.gold -= price; list.splice(i, 1); it.fresh = false; E.addItem(it);
  G.Audio.sfx('buy'); G.UI.closeModal(); G.UI.toast(`Bought ${it.n}`, 'gold'); E.save(); G.UI.refresh();
};
G.A.sellView = d => {
  const it = G.S.bag.find(i => i.uid === d.u); if (!it) return;
  G.UI.modal(S.itemDetail(it, `<button class="btn ghost" data-a="closeModal">Keep</button><button class="btn primary" data-a="sellItem" data-u="${it.uid}">Sell · ${E.sellPrice(it)}g</button>`));
};
G.A.sellItem = d => {
  const p = G.S, i = E.findBag(d.u); if (i < 0) return;
  const it = p.bag.splice(i, 1)[0], v = E.sellPrice(it); p.gold += v; p.stats.gold += v;
  G.Audio.sfx('gold'); G.UI.closeModal(); G.UI.toast(`Sold for ${v} gold`, 'gold'); E.save(); G.UI.refresh();
};
G.A.sellCommon = () => {
  const p = G.S, c = p.bag.filter(i => i.rarity === 0); if (!c.length) { G.UI.toast('No Common items.'); return; }
  const v = c.reduce((s, i) => s + E.sellPrice(i), 0);
  G.UI.confirm('Sell all Common?', `Sell ${c.length} items for ${v} gold?`, 'Sell', () => { p.bag = p.bag.filter(i => i.rarity > 0); p.gold += v; p.stats.gold += v; G.Audio.sfx('gold'); E.save(); G.UI.refresh(); });
};
G.A.upView = d => {
  const p = G.S, it = [...Object.values(p.equip).filter(Boolean), ...p.bag].find(i => i.uid === d.u); if (!it) return;
  const c = E.upgradeCost(it), max = (it.up || 0) >= E.maxUpgrade();
  const ok = !max && p.gold >= c.gold && p.mats.scrap >= c.scrap && p.mats.shard >= c.shard;
  G.UI.modal(S.itemDetail(it, `<button class="btn ghost" data-a="closeModal">Close</button><button class="btn primary" data-a="doUpgrade" data-u="${it.uid}" ${ok ? '' : 'disabled'}>${max ? 'Maxed' : `Upgrade to +${(it.up || 0) + 1}`}</button>`)
    .replace('<div class="foot', `<div class="small mt ${ok ? '' : 'bad'}">${max ? 'This item cannot be improved further.' : `Cost: ${c.gold} gold, ${c.scrap} Iron Scrap${c.shard ? ', ' + c.shard + ' Gloam Shard' : ''}`}</div><div class="foot`));
};
G.A.doUpgrade = d => {
  const p = G.S, it = [...Object.values(p.equip).filter(Boolean), ...p.bag].find(i => i.uid === d.u); if (!it) return;
  const c = E.upgradeCost(it);
  if ((it.up || 0) >= E.maxUpgrade() || p.gold < c.gold || p.mats.scrap < c.scrap || p.mats.shard < c.shard) return;
  p.gold -= c.gold; p.mats.scrap -= c.scrap; p.mats.shard -= c.shard; it.up = (it.up || 0) + 1;
  G.Audio.sfx('forge'); G.U.vibrate(40); G.UI.closeModal(); G.UI.toast(`${it.n} is now +${it.up}!`, 'gold'); E.clampVitals(); E.save(); G.UI.refresh();
};
G.A.salvView = d => {
  const it = G.S.bag.find(i => i.uid === d.u); if (!it) return; const y = E.salvageYield(it);
  G.UI.modal(S.itemDetail(it, `<button class="btn ghost" data-a="closeModal">Keep</button><button class="btn danger" data-a="doSalvage" data-u="${it.uid}">Salvage (${y.scrap} scrap${y.shard ? ', ' + y.shard + ' shard' : ''})</button>`));
};
G.A.doSalvage = d => {
  const p = G.S, i = E.findBag(d.u); if (i < 0) return;
  const it = p.bag.splice(i, 1)[0], y = E.salvageYield(it);
  p.mats.scrap += y.scrap; p.mats.shard += y.shard;
  G.Audio.sfx('forge'); G.UI.closeModal(); G.UI.toast(`Salvaged: +${y.scrap} scrap${y.shard ? ', +' + y.shard + ' shard' : ''}`, 'gold'); E.save(); G.UI.refresh();
};
G.A.salvageCommon = () => {
  const p = G.S, c = p.bag.filter(i => i.rarity === 0); if (!c.length) { G.UI.toast('No Common items.'); return; }
  G.UI.confirm('Salvage all Common?', `Break down ${c.length} items into scrap?`, 'Salvage', () => {
    let sc = 0; c.forEach(it => { const y = E.salvageYield(it); sc += y.scrap; p.mats.shard += y.shard; });
    p.mats.scrap += sc; p.bag = p.bag.filter(i => i.rarity > 0); G.Audio.sfx('forge'); G.UI.toast(`+${sc} Iron Scrap`, 'gold'); E.save(); G.UI.refresh();
  });
};
G.A.buyCons = d => {
  const p = G.S, c = G.D.CONS[d.k]; if (p.gold < c.price) return;
  p.gold -= c.price; E.addCons(d.k, 1); G.Audio.sfx('buy'); E.save(); G.UI.refresh();
};
G.A.cleanse = () => {
  const p = G.S, c = cleanseCost(); if (p.gold < c) return;
  p.gold -= c; p.dread = 0; G.Audio.sfx('holy'); G.UI.toast('The Wick burns the whispers from your mind.', 'good'); E.save(); G.UI.refresh();
};
G.A.bless = d => {
  const p = G.S, c = blessCost(); if (p.gold < c) return;
  const b = BLESSINGS[+d.i], stats = {};
  for (const k in b.stats) stats[k] = scaleBless(b.stats[k], k);
  p.gold -= c; p.blessings = p.blessings.filter(x => !x.chapel); p.blessings.push({ n: b.n, stats, chapel: true });
  G.Audio.sfx('holy'); G.UI.toast(`${b.n} will guard your next expedition.`, 'gold'); E.clampVitals(); E.save(); G.UI.refresh();
};
G.A.respec = () => {
  const p = G.S, c = respecCost(); if (p.gold < c) return;
  G.UI.confirm('Rite of Unmaking', 'All attribute points and skills will be refunded so you can rebuild your Lanternbearer.', `Pay ${c} gold`, () => {
    p.gold -= c;
    p.attrs = Object.assign({}, p.baseAttrs); for (const k in p.perm) p.attrs[k] += p.perm[k];
    p.ap = (p.level - 1) * 3;
    const first = G.D.CLASSES[p.cls].skills[0];
    p.skills = { [first]: 1 }; p.sp = p.spTotal - 1;
    E.clampVitals(); G.Audio.sfx('holy'); E.save(); G.UI.refresh(); G.UI.toast('You are unmade, and remade.', 'gold');
  });
};
G.A.buyShard = () => { const p = G.S; if (p.gold < 120) return; p.gold -= 120; p.mats.shard++; G.Audio.sfx('buy'); E.save(); G.UI.refresh(); };
G.A.buyScrap = () => { const p = G.S; if (p.gold < 45) return; p.gold -= 45; p.mats.scrap += 3; G.Audio.sfx('buy'); E.save(); G.UI.refresh(); };
G.A.bountyTake = d => {
  const b = G.S.bounties; if (b.active.length >= 3) return;
  const i = b.offers.findIndex(o => o.id === d.id); if (i < 0) return;
  const o = b.offers.splice(i, 1)[0]; o.prog = 0; b.active.push(o); G.UI.toast('Bounty accepted.', 'gold'); E.save(); G.UI.refresh();
};
G.A.bountyDrop = d => { const b = G.S.bounties; b.active = b.active.filter(x => x.id !== d.id); E.save(); G.UI.refresh(); };
G.A.bountyClaim = d => {
  const b = G.S.bounties, x = b.active.find(o => o.id === d.id); if (!x || x.prog < x.n) return;
  b.active = b.active.filter(o => o.id !== d.id);
  const res = E.applyFx({ gold: x.gold, xp: x.xp });
  if (U.chance(40)) { const it = E.genItem(G.S.level, 1); it.fresh = false; if (E.addItem(it)) res.lines.push(`<div class="fxline">Bonus: ${E.itemName(it)}</div>`); }
  E.save(); G.UI.refresh(); G.UI.alert('Bounty Claimed', `<div class="outcome">${res.lines.join('')}</div>`); S.checkLevel();
};
G.A.startExp = d => {
  const p = G.S;
  const go = () => G.Dungeon.enter(+d.z, +d.f);
  if (!p.cons.potion && !p.cons.elixir) G.UI.confirm('No healing?', 'You have no Red Draughts. The dark is not kind to the unprepared.', 'Go anyway', go);
  else if (p.hp < E.stats().maxHp * 0.5) G.UI.confirm('You are wounded', 'You are below half health. Rest at the inn first?', 'Go anyway', go);
  else go();
};
})();
