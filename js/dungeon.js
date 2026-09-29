/* Dungeon exploration: floor generation, fog-of-war map, rooms, events, camping, shops */
(() => {
const S = G.Screens, U = G.U, E = G.Engine;
const W = 5, H = 7;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const k = (x, y) => x + ',' + y;
const ek = (a, b) => a < b ? a + '|' + b : b + '|' + a;
const ROOM_IC = { entrance: 'entrance', stairs: 'stairs', combat: 'swords', elite: 'horns', boss: 'crown', event: 'question', treasure: 'treasure', shrine: 'flame', trap: 'trap', camp: 'camp', merchant: 'coinbag', quest: 'star', portal: 'sparkle', empty: 'dot' };

// Room-type events that are never picked at random
Object.assign(G.D.EVENTS, {
  wick_shrine: { quest: true, ic: 'flame', title: 'Shrine of the Wick',
    text: 'A small flame burns in an iron cage on a pillar of black stone, a splinter of the Undying Wick carried here by some long-dead Lanternbearer. No one tends it. It burns anyway.',
    choices: [
      { t: 'Pray before the flame', out: { txt: 'You kneel. The flame leans toward you like a friend. Your fear and your wounds both ease.', fx: { dread: -18, hpPct: 20 } } },
      { t: 'Kindle your lantern from it', out: { txt: 'You open your lantern and the two flames kiss. Yours burns bright again.', fx: { light: 45 } } },
      { t: 'Leave it burning', out: { txt: 'It is not yours to take.', fx: {} } },
    ] },
  safe_camp: { quest: true, ic: 'camp', title: 'A Sheltered Alcove',
    text: 'A dry alcove with a single narrow entrance. Old ashes in a ring of stones: someone has camped here before. It is as safe as anywhere in the dark.',
    choices: [
      { t: 'Rest a while', out: { txt: 'You sit with your back to the wall and close your eyes, just for a moment.', fx: z => U.chance(15) ? { hpPct: 25, focusPct: 25, fight: 'zone' } : { hpPct: 40, focusPct: 40, dread: -10 } } },
      { t: 'Move on', out: { txt: 'No time to rest. Not here.', fx: {} } },
    ] },
});

G.Dungeon = {
  pend: null, ev: null,

  lvlFor(zone, floor) {
    const Z = G.D.ZONES[zone];
    return Z.endless ? 17 + floor : Z.lvls[floor - 1];
  },
  isBossFloor(zone, floor) {
    const Z = G.D.ZONES[zone];
    return Z.endless ? floor % 5 === 0 : floor === Z.floors;
  },

  gen(zone, floor) {
    const Z = G.D.ZONES[zone];
    const count = Z.endless ? 16 + Math.min(6, Math.floor(floor / 3)) : 13 + floor * 2;
    const rooms = {}, edges = {};
    const start = k(2, 6);
    rooms[start] = { x: 2, y: 6 };
    const list = [start];
    let guard = 0;
    while (list.length < count && guard++ < 2000) {
      const from = list[Math.random() < 0.4 ? list.length - 1 : U.rand(0, list.length - 1)];
      const r = rooms[from], d = U.pick(DIRS), nx = r.x + d[0], ny = r.y + d[1];
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const nk = k(nx, ny);
      if (!rooms[nk]) { rooms[nk] = { x: nx, y: ny }; list.push(nk); edges[ek(from, nk)] = 1; }
    }
    list.forEach(a => DIRS.forEach(d => {
      const r = rooms[a], b = k(r.x + d[0], r.y + d[1]);
      if (rooms[b] && !edges[ek(a, b)] && Math.random() < 0.18) edges[ek(a, b)] = 1;
    }));
    const dist = { [start]: 0 }, q = [start];
    while (q.length) {
      const a = q.shift();
      this.links(edges, a).forEach(b => { if (dist[b] == null) { dist[b] = dist[a] + 1; q.push(b); } });
    }
    const exit = list.slice().sort((a, b) => dist[b] - dist[a])[0];
    list.forEach(a => { Object.assign(rooms[a], { t: 'empty', seen: false, known: false, vis: false, clr: false }); });
    rooms[start].t = 'entrance';
    const boss = this.isBossFloor(zone, floor);
    rooms[exit].t = boss ? 'boss' : 'stairs';
    const rest = U.shuffle(list.filter(a => a !== start && a !== exit));
    let i = 0;
    const take = (t, extra) => { if (i < rest.length) Object.assign(rooms[rest[i++]], { t }, extra || {}); };
    E.activeQuestEvents(zone, floor).forEach(ev => take('quest', { ev }));
    if (floor >= 2 || Z.endless) take('elite');
    take('treasure'); if (U.chance(50)) take('treasure');
    if (U.chance(60)) take('shrine');
    take('camp');
    if (U.chance(35)) take('merchant');
    while (i < rest.length) take(U.weighted([['combat', 40], ['event', 32], ['empty', 18], ['trap', 10]], x => x[1])[0]);
    return { zone, floor, lvl: this.lvlFor(zone, floor), rooms, edges, pos: start, prev: start, start, exit, log: [], usedEv: [] };
  },
  links(edges, a) {
    const out = [];
    for (const e in edges) { const [x, y] = e.split('|'); if (x === a) out.push(y); else if (y === a) out.push(x); }
    return out;
  },
  d() { return G.S.dungeon; },
  here() { const d = this.d(); return d.rooms[d.pos]; },
  log(html) { const d = this.d(); d.log.unshift(html); if (d.log.length > 30) d.log.length = 30; },

  enter(zone, floor) {
    const p = G.S, Z = G.D.ZONES[zone];
    p.dungeon = this.gen(zone, floor);
    p.dungeon.trip = { gold0: p.stats.gold, kills0: p.stats.kills, floors: 1, startFloor: floor };
    this.reveal(p.dungeon.pos, true);
    p.dungeon.rooms[p.dungeon.pos].vis = true;
    this.log(`<span class="rt">${Z.n} · Floor ${floor}</span><br>${Z.enter}`);
    E.onReach(zone, floor);
    E.save();
    G.Audio.sfx('door');
    G.UI.go('dungeon');
    S.tip('dungeon');
  },
  reveal(pos, first) {
    const d = this.d(), p = G.S, s = E.stats();
    const lightPct = p.light / s.lightMax;
    this.links(d.edges, pos).forEach(b => {
      const r = d.rooms[b];
      r.seen = true;
      if (!r.known && p.light > 0 && (lightPct >= 0.3 || U.chance(55) || first)) r.known = true;
      if (r.t === 'boss' || r.t === 'stairs' || r.t === 'entrance') r.known = r.known || p.light > 0;
    });
  },
  revealAll() {
    const d = this.d();
    Object.values(d.rooms).forEach(r => { r.seen = true; r.known = true; });
    this.log('<span class="gold">The layout of this floor is now clear to you.</span>');
  },

  move(key) {
    const d = this.d(), p = G.S;
    if (!this.links(d.edges, d.pos).includes(key)) return;
    const s = E.stats();
    const Z = G.D.ZONES[d.zone];
    const cost = Math.max(0.5, (Z.lightCost || (Z.endless ? 4 : 3)) * (1 - s.lightEff / 100));
    const wasLit = p.light > 0;
    p.light = Math.max(0, p.light - cost);
    p.focus = Math.min(s.maxFocus, p.focus + 1);
    if (s.regen) p.hp = Math.min(s.maxHp, p.hp + s.regen);
    d.prev = d.pos; d.pos = key;
    const r = d.rooms[key];
    const first = !r.vis;
    r.vis = true; r.seen = true; r.known = true;
    G.Audio.sfx('step');
    if (p.light <= 0) {
      const v = E.addDread(3 + Math.min(4, E.zonePow()));
      if (wasLit) { this.log('<span class="bad">Your lantern gutters and dies. Darkness closes in.</span>'); S.tip('light'); }
      else if (U.chance(30)) this.log(`<span class="muted">${U.pick(['Something brushes past you in the dark.', 'You hear breathing that is not yours.', 'The walls feel closer than before.', 'Whispers follow your footsteps.'])} (+${v} Dread)</span>`);
    } else if (p.light < s.lightMax * 0.2 && U.chance(25)) this.log('<span class="muted">Your lantern flickers. Oil is running low.</span>');
    if (p.dread >= 70 && U.chance(15)) this.log(`<span class="muted" style="color:#a080d0">${U.pick(['You see yourself standing at the end of the corridor.', 'A bell rings. No, it doesn\'t.', 'Your lantern light is the wrong colour.', 'Someone says your name from inside the wall.'])}</span>`);
    this.reveal(key);
    this.enterRoom(r, first);
    E.save();
    if (G.UI.is('dungeon')) G.UI.refresh();
  },

  enterRoom(r, first) {
    const d = this.d(), Z = G.D.ZONES[d.zone], p = G.S;
    if (first) this.log(`You enter ${U.pick(Z.rooms)}.`);
    if (r.clr || r.t === 'empty') {
      r.clr = true;
      const s = E.stats();
      const ch = (p.light > 0 ? 3 : 22) - s.ambushRes;
      if (r.t !== 'entrance' && U.chance(ch)) { this.log('<span class="bad">Ambush! Something lunges from the shadows!</span>'); this.fight(this.group(), { ambush: true }); }
      else if (first && r.t === 'empty') this.log('<span class="muted">It is empty. For now.</span>');
      return;
    }
    switch (r.t) {
      case 'entrance': if (!first) this.promptAscend(); break;
      case 'stairs': this.log('Worn stairs spiral down into deeper darkness.'); this.promptDescend(); break;
      case 'portal': this.promptPortal(); break;
      case 'combat': {
        const g = this.group();
        this.log(`<span class="bad">${g.length > 1 ? 'Enemies' : 'An enemy'} ${g.length > 1 ? 'block' : 'blocks'} your path: ${g.map(x => G.D.ENEMIES[x.id].n).join(', ')}.</span>`);
        this.fight(g, {}, r); break;
      }
      case 'elite': {
        const id = Z.endless ? U.pick(this.endlessFoes('elite')) : Z.elite;
        const g = [{ id, lvl: d.lvl + 1 }];
        if (d.floor >= 3 || Z.endless) g.push(this.group()[0]);
        this.log(`<span class="bad">A powerful foe stands guard: ${G.D.ENEMIES[id].n}.</span>`);
        this.fight(g, {}, r); break;
      }
      case 'boss': this.promptBoss(r); break;
      case 'event': { const id = this.pickEvent(); r.ev = id; this.showEvent(id, r); break; }
      case 'quest': this.showEvent(r.ev, r); break;
      case 'shrine': this.showEvent('wick_shrine', r); break;
      case 'camp': this.showEvent('safe_camp', r); break;
      case 'merchant': if (r.met) this.openTobin(r); else { r.met = true; this.showEvent('peddler', r); } break;
      case 'treasure': this.treasure(r); break;
      case 'trap': this.trap(r); break;
    }
  },

  group() {
    const d = this.d(), Z = G.D.ZONES[d.zone];
    const sizes = [[1, 1, 2], [1, 2, 2, 3], [2, 2, 3]];
    const n = Z.endless ? U.rand(2, 3) : U.pick(sizes[U.clamp(d.floor, 1, sizes.length) - 1]);
    const eligible = Z.endless ? Z.pool.filter(([id]) => G.D.ENEMIES[id].lvl <= d.lvl + 5) : Z.pool;
    const pool = eligible.length ? eligible : Z.pool;
    return Array.from({ length: n }, () => ({ id: U.weighted(pool, x => x[1])[0], lvl: d.lvl + U.rand(0, 1) }));
  },
  // Elites or bosses of the story zones the hero has opened, near the current depth
  endlessFoes(kind) {
    const d = this.d(), ids = [];
    E.zoneOrder().forEach(z => {
      const Z = G.D.ZONES[z], id = Z[kind];
      if (Z.endless || !id || !G.D.ENEMIES[id] || !E.zoneUnlocked(z)) return;
      const e = G.D.ENEMIES[id];
      if (e.final || e.final2 || e.final3 || e.lvl > d.lvl + 5 || ids.includes(id)) return;
      ids.push(id);
    });
    if (kind === 'boss' && ids.length < 3) this.endlessFoes('elite').forEach(id => { if (!ids.includes(id)) ids.push(id); });
    return ids.length ? ids : [G.D.ZONES[1][kind] || 'boneknight'];
  },
  fight(group, opts, room) {
    const d = this.d();
    opts = opts || {};
    G.Combat.start({
      enemies: group, ambush: opts.ambush, boss: opts.boss,
      onWin: () => {
        if (room) room.clr = true;
        if (opts.onWin) opts.onWin();
        E.save();
        if (!opts.noReturn) G.UI.go('dungeon');
      },
      onFlee: () => {
        d.pos = d.prev;
        this.log('<span class="muted">You flee back the way you came.</span>');
        E.save(); G.UI.go('dungeon');
      },
    });
  },

  pickEvent() {
    const d = this.d(), p = G.S;
    const ok = Object.keys(G.D.EVENTS).filter(id => {
      const e = G.D.EVENTS[id];
      if (e.quest || !e.zones.includes(d.zone)) return false;
      if (e.once && p.flags['ev_' + id]) return false;
      if (e.minDread && p.dread < e.minDread) return false;
      return !d.usedEv.includes(id);
    });
    const id = ok.length ? U.pick(ok) : 'abandoned_pack';
    d.usedEv.push(id);
    return id;
  },
  reqMet(req) {
    if (!req) return { ok: true };
    const p = G.S;
    if (req.gold && p.gold < req.gold) return { ok: false, why: `${req.gold} gold` };
    if (req.cons && !p.cons[req.cons]) return { ok: false, why: G.D.CONS[req.cons].n };
    if (req.mats && !p.mats[req.mats]) return { ok: false, why: G.D.MATS[req.mats].n };
    if (req.cls && p.cls !== req.cls) return { ok: false, why: G.D.CLASSES[req.cls].n + ' only', hide: true };
    if (req.light && p.light < req.light) return { ok: false, why: 'more Light' };
    return { ok: true };
  },
  showEvent(id, room) {
    const ev = G.D.EVENTS[id], d = this.d();
    this.ev = { id, room };
    const choices = ev.choices.map((c, i) => {
      const r = this.reqMet(c.req);
      if (!r.ok && r.hide) return '';
      const chance = c.check ? `<span class="chance">${G.D.ATTRS[c.check.s].n} ${E.checkChance(c.check.s, c.check.d)}%</span>` : '';
      return `<button class="btn choice" data-a="evChoice" data-i="${i}" ${r.ok ? '' : 'disabled'}><span>${c.t}${r.ok ? '' : ` <span class="tiny">(needs ${r.why})</span>`}</span>${chance}</button>`;
    }).join('');
    G.UI.modal(`<img class="event-art" src="assets/img/${G.D.ZONES[d.zone].img}.jpg" alt="">
      <h2>${G.icon(ev.ic || 'question')} ${ev.title}</h2>
      <div class="body mt"><div class="event-text">${ev.text}</div></div>
      <div class="foot btn-col">${choices}</div>`, { locked: true });
    S.tip('event');
  },
  choose(i) {
    const { id, room } = this.ev, ev = G.D.EVENTS[id], c = ev.choices[i], p = G.S, d = this.d();
    if (!this.reqMet(c.req).ok) return;
    let br = c.out, head = '';
    if (c.check) {
      const ch = E.checkChance(c.check.s, c.check.d), win = Math.random() * 100 < ch;
      br = win ? c.ok : c.no;
      head = win ? `<div class="good small">${G.D.ATTRS[c.check.s].n} check succeeded (${ch}%)</div>` : `<div class="bad small">${G.D.ATTRS[c.check.s].n} check failed (${ch}%)</div>`;
      G.Audio.sfx(win ? 'loot' : 'hurt');
    }
    const res = E.applyFx(br.fx);
    p.stats.events++;
    if (ev.once) p.flags['ev_' + id] = true;
    if (room && !res.shop && !res.fight) room.clr = true;
    if (res.reveal) this.revealAll();
    this.pend = res;
    this.log(`<b>${ev.title}:</b> ${br.txt}`);
    const btn = res.fight ? `<button class="btn danger block" data-a="evGo">${G.icon('swords')} Fight!</button>`
      : res.shop ? `<button class="btn primary block" data-a="evGo">${G.icon('coinbag')} Trade</button>`
      : `<button class="btn primary block" data-a="evGo">Continue</button>`;
    G.UI.updateModal(`<img class="event-art" src="assets/img/${G.D.ZONES[d.zone].img}.jpg" alt="">
      <h2>${G.icon(ev.ic || 'question')} ${ev.title}</h2>
      <div class="body mt">${head}<div class="event-text">${br.txt}</div>${res.lines.length ? `<div class="outcome">${res.lines.join('')}</div>` : ''}</div>
      <div class="foot">${btn}</div>`);
    E.save();
  },
  after() {
    const res = this.pend, room = this.ev && this.ev.room;
    this.pend = null;
    G.UI.closeAllModals();
    if (!res) return;
    if (res.end) { E.returnToTown(); S.playEnding(res.end); return; }
    if (res.fight) {
      const g = res.fight === 'zone' ? this.group() : res.fight.map(id => ({ id, lvl: this.d().lvl }));
      this.fight(g, {}, room);
      return;
    }
    if (res.shop) { this.openTobin(room); return; }
    G.UI.refresh();
    S.checkLevel();
  },

  treasure(r) {
    const d = this.d(), p = G.S, z = E.zonePow();
    if (U.chance(12)) {
      this.log('<span class="bad">The chest opens its lid... and it has teeth!</span>');
      this.fight([{ id: 'mimic', lvl: d.lvl + 1 }], {}, r);
      return;
    }
    const fx = { gold: Math.round(U.rand(8, 18) * z * (1 + d.floor * 0.2)), item: U.chance(25) ? 2 : 1 };
    if (U.chance(40)) fx.cons = { [U.pick(['potion', 'oil', 'salts', 'potion'])]: 1 };
    if (U.chance(30)) fx.mats = { scrap: U.rand(1, 2) };
    const res = E.applyFx(fx);
    r.clr = true;
    this.log(`<span class="gold">You find a chest and pry it open.</span>`);
    G.UI.modal(`<h2>${G.icon('treasure')} Treasure</h2><div class="body mt"><p class="muted">Inside, wrapped in rotting velvet:</p><div class="outcome">${res.lines.join('')}</div></div>
      <div class="foot"><button class="btn primary block" data-a="closeModal">Take it all</button></div>`, { center: true });
  },
  trap(r) {
    const d = this.d(), ch = E.checkChance('agi', 25);
    r.clr = true;
    if (Math.random() * 100 < ch) {
      E.applyFx({ xp: 5 * E.zonePow() + d.floor * 2 });
      this.log(`<span class="good">You spot a hidden trap and step around it. (AGI ${ch}%)</span>`);
      return;
    }
    const kind = U.pick([
      ['Spikes burst from the floor!', { hpPct: -14 }],
      ['A cloud of grave-gas hisses from the walls!', { hpPct: -7, dread: 12 }],
      ['A dart shatters your lantern glass!', { light: -18, hpPct: -5 }],
      ['The floor gives way beneath you!', { hpPct: -10, light: -8 }],
    ]);
    const res = E.applyFx(kind[1]);
    G.Audio.sfx('hurt'); U.vibrate(120);
    this.log(`<span class="bad">Trap! ${kind[0]} (AGI ${ch}%)</span> ${res.lines.map(l => l.replace(/<[^>]+>/g, '')).join(', ')}`);
  },

  promptDescend() {
    const d = this.d();
    G.UI.modal(`<h2>${G.icon('stairs')} Descend?</h2><div class="body mt"><p class="muted">The stairs lead down to <b>Floor ${d.floor + 1}</b>. The deeper you go, the deadlier it becomes and the better the rewards. You cannot return to this floor.</p></div>
      <div class="foot btn-grid"><button class="btn ghost" data-a="closeModal">Stay</button><button class="btn primary" data-a="descend">Descend</button></div>`, { center: true });
  },
  descend() {
    const p = G.S, d = this.d();
    const trip = d.trip, nf = d.floor + 1;
    p.dungeon = this.gen(d.zone, nf);
    p.dungeon.trip = trip; trip.floors++;
    this.reveal(p.dungeon.pos, true); p.dungeon.rooms[p.dungeon.pos].vis = true;
    this.log(`<span class="rt">${G.D.ZONES[d.zone].n} · Floor ${nf}</span><br>You descend. The air grows colder${this.isBossFloor(d.zone, nf) ? ', and something vast is waiting at the bottom of this level' : ''}.`);
    E.onReach(d.zone, nf);
    G.Audio.sfx('door');
    E.save(); G.UI.closeAllModals(); G.UI.go('dungeon');
  },
  promptAscend() {
    G.UI.modal(`<h2>${G.icon('entrance')} Return to Candlemere?</h2><div class="body mt"><p class="muted">A Vigil rope-lift waits here. You can ride it back to town, keeping everything you found.</p></div>
      <div class="foot btn-grid"><button class="btn ghost" data-a="closeModal">Stay</button><button class="btn primary" data-a="goHome">Return</button></div>`, { center: true });
  },
  promptPortal() {
    G.UI.modal(`<h2>${G.icon('sparkle')} The Way Home</h2><div class="body mt"><p class="muted">With the master of this place fallen, a hidden Vigil passage opens back to Candlemere.</p></div>
      <div class="foot btn-grid"><button class="btn ghost" data-a="closeModal">Stay</button><button class="btn primary" data-a="goHome">Return</button></div>`, { center: true });
  },
  promptBoss(r) {
    const d = this.d(), Z = G.D.ZONES[d.zone];
    const id = Z.endless ? (r.boss = r.boss || U.pick(this.endlessFoes('boss'))) : Z.boss;
    const e = G.D.ENEMIES[id];
    G.UI.modal(`<img class="event-art" src="assets/img/${Z.img}.jpg" alt="" style="filter:brightness(.45) sepia(.4) hue-rotate(-30deg)">
      <h2 class="bad">${G.icon('crown')} ${e.n}</h2><div class="body mt"><p class="event-text">${e.desc}</p><p class="small muted">This is a boss battle. You cannot flee once it begins. Make sure your HP, Focus and supplies are ready.</p></div>
      <div class="foot btn-grid"><button class="btn ghost" data-a="bossRetreat">Retreat</button><button class="btn danger" data-a="bossFight">Face it</button></div>`, { locked: true });
    this.bossId = id;
  },
  bossFight() {
    const d = this.d(), r = this.here(), id = this.bossId, Z = G.D.ZONES[d.zone];
    G.UI.closeAllModals();
    const lvl = Z.endless ? d.lvl + 2 : G.D.ENEMIES[id].lvl;
    this.fight([{ id, lvl }], {
      boss: true, noReturn: true,
      onWin: () => {
        r.t = Z.endless ? 'stairs' : 'portal'; r.clr = false;
        const e = G.D.ENEMIES[id], f = G.S.flags;
        const choice = e.final && !f.ended ? 'final_choice' : e.final2 && !f.ended2 ? 'heart_choice' : e.final3 && !f.ended3 ? 'sun_choice' : null;
        if (choice && G.D.EVENTS[choice]) { d.pendingEnding = choice; E.save(); G.UI.go('dungeon'); return; }
        E.save(); G.UI.go('dungeon');
        setTimeout(() => Z.endless ? this.promptDescend() : this.promptPortal(), 400);
      },
    }, null);
  },
  bossRetreat() {
    const d = this.d();
    G.UI.closeAllModals();
    d.pos = d.prev; this.log('<span class="muted">You back away. It will wait. It has waited for a very long time.</span>');
    E.save(); G.UI.refresh();
  },
  goHome() {
    const p = G.S, d = this.d(), t = d.trip || {};
    const gold = p.stats.gold - (t.gold0 || 0), kills = p.stats.kills - (t.kills0 || 0);
    const found = p.bag.filter(i => i.fresh).length;
    E.returnToTown();
    G.UI.go('town');
    G.UI.alert(`${G.icon('town')} Back in Candlemere`, `<p class="muted">The Wick's warmth greets you like an old friend. Your lantern is refilled free of charge by the Vigil.</p>
      <div class="card"><div class="kv"><span>Foes slain</span><span>${kills}</span></div><div class="kv"><span>Gold earned</span><span class="gold">${gold}</span></div><div class="kv"><span>Items found</span><span>${found}</span></div><div class="kv"><span>Floors explored</span><span>${t.floors || 1}</span></div></div>
      <p class="tiny muted">Shops have restocked and new bounties are posted.</p>`);
  },

  // ----- action bar -----
  useOil() {
    const p = G.S;
    if (!p.cons.oil) { G.UI.toast('No Wick Oil left.', 'bad'); return; }
    if (p.light >= E.stats().lightMax) { G.UI.toast('Your lantern is already full.'); return; }
    const m = E.useCons('oil'); this.log(`<span class="gold">${m}</span>`); E.save(); G.UI.refresh();
  },
  useCamp() {
    const p = G.S;
    if (!p.cons.campkit) { G.UI.toast('You have no Camp Kit. Buy them from Wren.', 'bad'); return; }
    G.UI.confirm('Make camp?', 'Use a Camp Kit to rest here: restore 50% HP and Focus and ease your Dread. Something may find you while you sleep (25%).', 'Make camp', () => {
      p.cons.campkit--;
      if (U.chance(25)) {
        E.applyFx({ hpPct: 20, focusPct: 20 });
        this.log('<span class="bad">You wake to claws scraping stone. You are not alone!</span>');
        this.fight(this.group(), { ambush: true });
      } else {
        const res = E.applyFx({ hpPct: 50, focusPct: 50, dread: -10 });
        this.log(`<span class="good">You rest by a small fire. ${res.lines.map(l => l.replace(/<[^>]+>/g, '')).join(', ')}</span>`);
        E.save(); G.UI.refresh();
      }
    });
  },
  useAsh() {
    const p = G.S;
    if (!p.cons.ash) { G.UI.toast('No Homeward Ash. Buy some from Wren.', 'bad'); return; }
    G.UI.confirm('Scatter Homeward Ash?', 'You will return to Candlemere immediately, keeping everything you found.', 'Go home', () => { p.cons.ash--; this.goHome(); });
  },

  // ----- Mad Tobin's shop -----
  openTobin(room) {
    const d = this.d(), p = G.S;
    room = room || this.here();
    if (!room.stock) {
      room.stock = [0, 1, 2].map(() => { const it = E.genItem(d.lvl + 1, 1, { rarity: U.pick([1, 1, 2, 2, 3]) }); it.fresh = true; return it; });
      room.cons = { potion: 3, oil: 3, tonic: 2, salts: 2, ash: 1 };
      if (E.consUnlocked('sunwater')) room.cons.sunwater = 1;
    }
    this.shopRoom = room;
    const html = `<h2>${G.icon('coinbag')} Mad Tobin's Wares</h2><p class="tiny muted">"Everything costs a little more down here. Supply and demand, and I\'m the only supply!"</p>
      <div class="body"><h3>Curiosities</h3>${room.stock.length ? room.stock.map(it => S.itemRow(it, { act: 'tobinView', label: `<span class="gold">${E.buyPrice(it, 1.5)}g</span>` })).join('') : '<p class="muted small">Sold out.</p>'}
      <h3>Supplies</h3>${Object.keys(room.cons).map(id => { const c = G.D.CONS[id], pr = Math.round(c.price * 1.5); return `<div class="item-row" style="cursor:default">${G.UI.artIcon(G.ART.cons(id))}<div class="info"><div class="nm">${c.n} <span class="muted">· ${room.cons[id]} left · you have ${p.cons[id] || 0}</span></div><div class="sub">${c.desc}</div></div><button class="btn small" data-a="tobinCons" data-k="${id}" ${p.gold < pr || !room.cons[id] ? 'disabled' : ''}>${pr}g</button></div>`; }).join('')}
      <h3>Sell</h3><p class="tiny muted">Tobin pays half the usual price.</p>${p.bag.map(it => S.itemRow(it, { act: 'tobinSell', label: `<span class="gold">${Math.floor(E.sellPrice(it) / 2)}g</span>` })).join('') || '<p class="muted small">Nothing to sell.</p>'}</div>
      <div class="foot"><button class="btn block" data-a="tobinClose">Leave</button></div>`;
    if (G.UI.hasModal()) G.UI.updateModal(html); else G.UI.modal(html, { locked: true });
  },
};

// ---------------- Dungeon screen ----------------
S.dungeon = {
  render() {
    const p = G.S, d = p.dungeon;
    if (!d) return '';
    const Z = G.D.ZONES[d.zone], s = E.stats();
    const vw = Math.min(480, window.innerWidth), vh = window.innerHeight;
    const gap = 6, cell = Math.floor(Math.min((vw - 24 - (W - 1) * gap) / W, (vh * 0.4 - (H - 1) * gap) / H, 58));
    const mw = W * cell + (W - 1) * gap, mh = H * cell + (H - 1) * gap;
    const pos = (r) => [r.x * (cell + gap), r.y * (cell + gap)];
    const adj = G.Dungeon.links(d.edges, d.pos);
    let lines = '';
    for (const e in d.edges) {
      const [a, b] = e.split('|'), ra = d.rooms[a], rb = d.rooms[b];
      if (!(ra.seen || ra.vis) || !(rb.seen || rb.vis)) continue;
      const [ax, ay] = pos(ra), [bx, by] = pos(rb);
      const lit = ra.vis && rb.vis;
      lines += `<line x1="${ax + cell / 2}" y1="${ay + cell / 2}" x2="${bx + cell / 2}" y2="${by + cell / 2}" stroke="${lit ? '#6a5a3a' : '#2e2839'}" stroke-width="${lit ? 4 : 3}" stroke-linecap="round"/>`;
    }
    let cells = '';
    for (const key in d.rooms) {
      const r = d.rooms[key];
      if (!r.seen && !r.vis) continue;
      const [x, y] = pos(r);
      const here = key === d.pos, can = adj.includes(key);
      let ic = 'dot', cls = 'seen';
      if (r.known || r.vis) {
        cls += ' known';
        ic = ROOM_IC[r.t] || 'dot';
        if (r.clr && ['combat', 'elite', 'event', 'treasure', 'trap', 'shrine', 'camp', 'quest'].includes(r.t)) { ic = 'dot'; cls += ' cleared'; }
        if (['combat', 'elite', 'trap'].includes(r.t) && !r.clr) cls += ' danger';
        if (r.t === 'boss') cls += ' boss';
      }
      if (r.vis) cls += ' visited';
      if (p.light <= 0 && !r.vis) cls += ' gloom';
      if (here) cls += ' here';
      if (can) cls += ' can';
      cells += `<div class="cell ${cls}" style="left:${x}px;top:${y}px;width:${cell}px;height:${cell}px" ${can ? `data-a="dMove" data-k="${key}"` : ''}>${here ? G.icon('lantern', 'lg') : G.icon(ic, cell > 48 ? 'lg' : '')}</div>`;
    }
    const r = d.rooms[d.pos];
    const ctx = r.t === 'stairs' ? ['dDescend', 'stairs', 'Descend', false] : r.t === 'entrance' ? ['dAscend', 'entrance', 'Go Up', false] : r.t === 'portal' ? ['dPortal', 'sparkle', 'Go Home', false] : ['dAsh', 'sparkle', `Ash (${p.cons.ash || 0})`, !p.cons.ash];
    const dim = U.clamp(1 - p.light / s.lightMax, 0, 1);
    return `${G.UI.hud()}
      <div class="row between" style="padding:6px 14px;border-bottom:1px solid var(--line);font-size:.8em"><span class="gold">${Z.n}</span><span class="muted">Floor ${d.floor} · Lv ${d.lvl}</span></div>
      <div class="scroll grow dlog ${p.dread >= 70 ? 'dread-fx' : ''}">${d.log.map((l, i) => `<p class="${i ? 'old' : ''}">${l}</p>`).join('')}</div>
      <div class="mapwrap"><div class="vignette" style="opacity:${0.25 + dim * 0.75}"></div>
        <div class="map" style="width:${mw}px;height:${mh}px"><svg class="links" width="${mw}" height="${mh}">${lines}</svg>${cells}</div></div>
      <div class="dactions">
        <button data-a="dBag">${G.icon('bag')}Bag</button>
        <button data-a="dHero">${G.icon('hero')}Hero${p.ap > 0 || p.sp > 0 ? '<span class="dot" style="right:calc(50% - 18px)"></span>' : ''}</button>
        <button data-a="dOil" ${p.cons.oil ? '' : 'disabled'}>${G.icon('lantern')}Oil (${p.cons.oil || 0})</button>
        <button data-a="dCamp" ${p.cons.campkit ? '' : 'disabled'}>${G.icon('camp')}Camp (${p.cons.campkit || 0})</button>
        <button data-a="${ctx[0]}" ${ctx[3] ? 'disabled' : ''}>${G.icon(ctx[1])}${ctx[2]}</button>
      </div>`;
  },
  after(prm, isRefresh) {
    G.Audio.ambient('dungeon');
    const d = G.S.dungeon;
    if (!isRefresh && d && d.pendingEnding && G.D.EVENTS[d.pendingEnding]) {
      setTimeout(() => { if (G.S.dungeon === d && G.UI.is('dungeon')) G.Dungeon.showEvent(d.pendingEnding, null); }, 300);
      return;
    }
    if (!isRefresh) S.checkLevel();
  },
};

G.A.dMove = d => G.Dungeon.move(d.k);
G.A.dBag = () => G.UI.go('bag');
G.A.dHero = () => G.UI.go('hero');
G.A.dOil = () => G.Dungeon.useOil();
G.A.dCamp = () => G.Dungeon.useCamp();
G.A.dAsh = () => G.Dungeon.useAsh();
G.A.dDescend = () => G.Dungeon.promptDescend();
G.A.dAscend = () => G.Dungeon.promptAscend();
G.A.dPortal = () => G.Dungeon.promptPortal();
G.A.descend = () => G.Dungeon.descend();
G.A.goHome = () => { G.UI.closeAllModals(); G.Dungeon.goHome(); };
G.A.evChoice = d => G.Dungeon.choose(+d.i);
G.A.evGo = () => G.Dungeon.after();
G.A.bossFight = () => G.Dungeon.bossFight();
G.A.bossRetreat = () => G.Dungeon.bossRetreat();
G.A.tobinClose = () => { G.UI.closeAllModals(); E.save(); G.UI.refresh(); };
G.A.tobinView = d => {
  const room = G.Dungeon.shopRoom, it = room.stock.find(i => i.uid === d.u); if (!it) return;
  const pr = E.buyPrice(it, 1.5);
  G.UI.modal(S.itemDetail(it, `<button class="btn ghost" data-a="closeModal">Back</button><button class="btn primary" data-a="tobinBuy" data-u="${it.uid}" ${G.S.gold < pr ? 'disabled' : ''}>Buy · ${pr}g</button>`));
};
G.A.tobinBuy = d => {
  const room = G.Dungeon.shopRoom, p = G.S, i = room.stock.findIndex(x => x.uid === d.u); if (i < 0) return;
  const it = room.stock[i], pr = E.buyPrice(it, 1.5);
  if (p.gold < pr) return; if (E.bagFull()) { G.UI.toast('Backpack is full.', 'bad'); return; }
  p.gold -= pr; room.stock.splice(i, 1); E.addItem(it); G.Audio.sfx('buy');
  G.UI.closeModal(); G.Dungeon.openTobin(room);
};
G.A.tobinCons = d => {
  const room = G.Dungeon.shopRoom, p = G.S, c = G.D.CONS[d.k], pr = Math.round(c.price * 1.5);
  if (p.gold < pr || !room.cons[d.k]) return;
  p.gold -= pr; room.cons[d.k]--; E.addCons(d.k, 1); G.Audio.sfx('buy'); G.Dungeon.openTobin(room);
};
G.A.tobinSell = d => {
  const p = G.S, i = E.findBag(d.u); if (i < 0) return;
  const it = p.bag.splice(i, 1)[0], v = Math.floor(E.sellPrice(it) / 2); p.gold += v; p.stats.gold += v;
  G.Audio.sfx('gold'); G.Dungeon.openTobin();
};
})();
