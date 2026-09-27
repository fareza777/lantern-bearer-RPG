/* Turn-based combat: intents, statuses, skills, charges, boss phases, loot */
(() => {
const S = G.Screens, U = G.U, E = G.Engine;
const DOTS = ['bleed', 'poison', 'burn'];
const AILMENTS = ['bleed', 'poison', 'burn', 'stun', 'weak', 'vuln'];
// Whetstone bonus is kept apart from Rage so the two do not merge into a permanent Bloodrage
G.D.STATUS.honed = G.D.STATUS.honed || { n: 'Honed', c: 'o', desc: 'Deals more damage for the rest of the fight.' };

G.Combat = {
  C: null,

  makeEnemy(id, lvl) {
    const b = G.D.ENEMIES[id], dl = lvl - b.lvl;
    const fh = Math.max(0.5, 1 + 0.14 * dl), fa = Math.max(0.5, 1 + 0.11 * dl);
    const hp = Math.round(b.hp * fh);
    return {
      uid: U.uid(), id, n: b.n, ic: b.ic, lvl, rank: b.rank || 'normal', hp, maxHp: hp,
      atk: [Math.max(1, Math.round(b.atk[0] * fa)), Math.max(1, Math.round(b.atk[1] * fa))],
      armor: Math.round(b.armor + Math.max(0, dl) * 0.8), res: b.res, dodge: b.dodge, crit: b.crit, tags: b.tags || [],
      moves: U.deep(b.moves), st: {}, intent: null, charged: false, phase2: b.phase2 ? U.deep(b.phase2) : null, p2: false, summons: 0, dead: false,
    };
  },

  start(opts) {
    const C = this.C = {
      opts, round: 1, log: [], busy: false, over: false, defend: false, floats: [],
      en: opts.enemies.map(e => this.makeEnemy(e.id, e.lvl)),
      pl: { isPlayer: true, st: {} },
    };
    C.target = C.en[0].uid;
    C.en.forEach(e => { e.intent = this.chooseIntent(e); });
    const boss = C.en.some(e => e.rank === 'boss');
    C.boss = boss;
    this.log(opts.ambush ? '<span class="bad">You are ambushed! The enemy strikes first.</span>' : boss ? `<span class="bad"><b>${C.en[0].n}</b> rises to face you.</span>` : 'Battle begins. Choose your action.');
    G.FX.clear();
    G.UI.go('combat');
    C.en.forEach((e, i) => G.FX.spawn(e, (opts.ambush ? 0 : 120) + i * 170, false));
    if (boss) {
      const b = C.en.find(e => e.rank === 'boss');
      G.FX.later(500, () => { G.FX.banner(U.esc(b.n), G.S.dungeon ? U.esc(G.D.ZONES[G.S.dungeon.zone].n) : ''); G.FX.shake(2); });
    }
    S.tip('combat');
    if (opts.ambush) { C.busy = true; setTimeout(() => this.enemyPhase(), 700); }
    else this.playerTurnStart(true);
  },

  // ---------------- helpers ----------------
  alive() { return this.C.en.filter(e => !e.dead); },
  tgt() {
    const C = this.C;
    let t = C.en.find(e => e.uid === C.target && !e.dead);
    if (!t) { t = this.alive()[0]; if (t) C.target = t.uid; }
    return t;
  },
  log(h) { const C = this.C; C.log.unshift(h); if (C.log.length > 40) C.log.length = 40; },
  float(uid, text, color) { this.C.floats.push([uid, text, color]); },
  delay() { return G.settings.fastCombat ? 260 : 620; },
  hpOf(u) { return u.isPlayer ? G.S.hp : u.hp; },
  maxOf(u) { return u.isPlayer ? E.stats().maxHp : u.maxHp; },
  nameOf(u) { return u.isPlayer ? 'You' : u.n; },
  addSt(u, id, turns, pow) {
    const cur = u.st[id];
    if (id === 'ward') { u.st.ward = { turns: Math.max(turns, cur ? cur.turns : 0), pow: (cur ? cur.pow : 0) + pow }; return; }
    u.st[id] = cur ? { turns: Math.max(cur.turns, turns), pow: Math.max(cur.pow || 0, pow || 0) } : { turns, pow: pow || 0 };
    if (id === 'stun' && !u.isPlayer && u.charged) {
      u.charged = false; u.intent = this.chooseIntent(u);
      this.log(`<span class="good">${u.n}'s attack is interrupted!</span>`);
    }
  },
  hasAilment(u) { return AILMENTS.some(a => u.st[a]); },
  heal(u, n) {
    n = Math.max(0, Math.round(n));
    if (u.isPlayer) { const m = E.stats().maxHp; const b = G.S.hp; G.S.hp = Math.min(m, G.S.hp + n); n = Math.round(G.S.hp - b); }
    else { const b = u.hp; u.hp = Math.min(u.maxHp, u.hp + n); n = u.hp - b; }
    if (n > 0) this.float(u.isPlayer ? 'pl' : u.uid, '+' + n, '#7cc47a');
    return n;
  },
  damage(u, n) {
    if (u.isPlayer) {
      const s = E.stats();
      let hp = G.S.hp - n;
      if (hp <= 0 && s.cheatDeath && !this.C.deathless) {
        hp = 1; this.C.deathless = true;
        this.float('pl', 'Deathless!', '#ffd27a');
        this.log('<span class="gold"><b>Deathless!</b> You refuse to fall, and stand with 1 HP.</span>');
        G.Audio.sfx('holy');
      }
      G.S.hp = Math.max(0, hp);
      U.vibrate(n > s.maxHp * 0.15 ? 120 : 40);
    } else {
      u.hp = Math.max(0, u.hp - n);
      if (u.phase2 && !u.p2 && u.hp > 0 && u.hp / u.maxHp * 100 <= u.phase2.at) {
        u.p2 = true;
        if (u.phase2.self) this.addSt(u, u.phase2.self.id, u.phase2.self.turns, u.phase2.self.pow);
        u.moves.push(...u.phase2.add);
        this.log(`<span class="bad"><b>${u.phase2.txt}</b></span>`);
        G.Audio.sfx('bell'); G.Audio.sfx('dread');
        this.C.flash = true;
        G.FX.phase2(u);
      }
      if (u.hp <= 0 && !u.dead) {
        u.dead = true;
        this.log(`<span class="gold">${u.n} falls.</span>`);
        E.onKill(u.id);
        u.st = {};
        this.C.lastDeath = G.FX.death(u, 40);
      }
    }
  },
  baseDmg(dt) {
    const s = E.stats();
    if (dt === 'magic') return s.spell * 0.6 + U.rand(2, 4);
    if (dt === 'holy') return s.holy * 0.6 + U.rand(2, 4);
    return U.rand(s.atkMin, s.atkMax);
  },

  hit(src, tgt, base, dt, o) {
    o = o || {};
    const P = !!src.isPlayer, s = E.stats(), dtier = E.dreadTier();
    let dodge = tgt.isPlayer ? s.dodge : tgt.dodge;
    if (tgt.st.evasive) dodge += tgt.st.evasive.pow;
    const acc = P ? s.acc - dtier.acc : 90 + src.lvl * 0.3;
    let miss = U.clamp(dodge - (acc - 90), 0, 80);
    if (dt !== 'phys') miss *= 0.5;
    if (o.noMiss) miss = 0;
    if (U.chance(miss)) {
      this.float(tgt.isPlayer ? 'pl' : tgt.uid, 'Miss', '#aaa');
      G.Audio.sfx('miss');
      return { miss: true, dmg: 0 };
    }
    let crit = false;
    if (P && this.C.pl.st.poised && !o.noPoise) { crit = true; delete this.C.pl.st.poised; }
    else crit = U.chance((P ? s.crit : src.crit) + (o.critBonus || 0));
    let d = base;
    if (crit) d *= P ? s.critDmg / 100 : 1.5;
    if (src.st.rage) d *= 1 + src.st.rage.pow / 100;
    if (src.st.honed) d *= 1 + src.st.honed.pow / 100;
    if (src.st.weak) d *= 1 - src.st.weak.pow / 100;
    if (P) {
      d *= 1 + s.dmgPct / 100;
      if (s.firstStrike && this.C.round === 1) d *= 1 + s.firstStrike / 100;
      d *= 1 - dtier.dmg / 100;
      if (s.dmgStatus && this.hasAilment(tgt)) d *= 1 + s.dmgStatus / 100;
    }
    if (tgt.st.vuln) d *= 1 + tgt.st.vuln.pow / 100;
    if (tgt.st.guard) d *= 1 - tgt.st.guard.pow / 100;
    if (tgt.isPlayer && this.C.defend) d *= 0.5;
    const lvl = P ? G.S.level : src.lvl;
    if (dt === 'phys') { const ar = tgt.isPlayer ? s.armor : tgt.armor; d *= 1 - Math.min(0.75, ar / (ar + 25 + 5 * lvl)); }
    else { const r = tgt.isPlayer ? s.res : tgt.res; d *= 1 - (dt === 'holy' ? r / 2 : r) / 100; }
    d = Math.max(1, Math.round(d * U.randf(0.92, 1.08)));
    let absorbed = 0;
    if (tgt.st.ward) {
      absorbed = Math.min(tgt.st.ward.pow, d); tgt.st.ward.pow -= absorbed; d -= absorbed;
      if (tgt.st.ward.pow <= 0) delete tgt.st.ward;
    }
    if (d > 0) this.damage(tgt, d);
    this.float(tgt.isPlayer ? 'pl' : tgt.uid, (crit ? 'CRIT ' : '') + (d > 0 ? d : 'Absorbed'), tgt.isPlayer ? '#ff7070' : crit ? '#ffcf5a' : '#fff');
    G.Audio.sfx(crit ? 'crit' : tgt.isPlayer ? 'hurt' : dt === 'magic' ? 'spell' : dt === 'holy' ? 'holy' : 'hit');
    if (P && s.lifesteal && d > 0) this.heal(this.C.pl, d * s.lifesteal / 100);
    return { dmg: d, crit, absorbed };
  },

  dotPow(spec, rank) {
    const s = E.stats();
    let v;
    if (spec === 'agiDot') v = 2 + s.A.agi * 0.35 + rank * 2;
    else if (spec === 'intDot') v = 2 + s.spell * 0.22 + rank * 2;
    else if (spec === 'wilDot') v = 2 + s.holy * 0.22 + rank * 2;
    else return Array.isArray(spec) ? spec[rank - 1] : (spec || 0);
    return Math.round(v * (1 + s.dotPct / 100));
  },

  // ---------------- player turn ----------------
  tickUnit(u) {
    for (const id of Object.keys(u.st)) {
      const st = u.st[id];
      if (id === 'stun') continue;
      if (DOTS.includes(id)) {
        const d = Math.max(1, Math.round(st.pow));
        this.damage(u, d);
        this.float(u.isPlayer ? 'pl' : u.uid, '-' + d, id === 'poison' ? '#8fd46a' : id === 'burn' ? '#ff9a40' : '#ff5a5a');
        this.log(`<span class="muted">${this.nameOf(u)} ${u.isPlayer ? 'suffer' : 'suffers'} ${d} ${G.D.STATUS[id].n.toLowerCase()} damage.</span>`);
      }
      if (id === 'regen') this.heal(u, st.pow);
      st.turns--;
      if (st.turns <= 0) delete u.st[id];
    }
  },
  playerTurnStart(first) {
    const C = this.C, p = G.S, s = E.stats();
    C.busy = false; C.defend = false;
    if (!first) {
      this.tickUnit(C.pl);
      if (s.regen) this.heal(C.pl, s.regen);
      if (s.lowHpRegen && p.hp > 0 && p.hp < s.maxHp * 0.35) this.heal(C.pl, s.maxHp * s.lowHpRegen / 100);
      p.focus = Math.min(s.maxFocus, p.focus + s.focusRegen);
      if (p.hp <= 0) { this.refresh(); return this.defeat(); }
    }
    if (C.pl.st.stun) {
      delete C.pl.st.stun;
      this.log('<span class="bad">You are stunned and lose your turn!</span>');
      C.busy = true; this.refresh();
      setTimeout(() => this.enemyPhase(), this.delay());
      return;
    }
    if (p.dread >= 100 && U.chance(20)) {
      this.log('<span class="bad" style="color:#b080e0">Terror grips you. You cannot move!</span>');
      C.busy = true; this.refresh();
      setTimeout(() => this.enemyPhase(), this.delay());
      return;
    }
    this.refresh();
  },
  canAct() { const C = this.C; return C && !C.busy && !C.over; },
  endPlayerTurn() {
    const C = this.C;
    C.busy = true;
    this.refresh();
    if (!this.alive().length) { setTimeout(() => this.victory(), Math.max(this.delay(), (C.lastDeath || 0) * 0.55)); C.lastDeath = 0; return; }
    if (G.S.hp <= 0) return this.defeat();
    setTimeout(() => this.enemyPhase(), this.delay());
  },
  attack() {
    if (!this.canAct()) return;
    const C = this.C, t = this.tgt(); if (!t) return;
    C.busy = true;
    const r = this.hit(C.pl, t, this.baseDmg('phys'), 'phys');
    this.log(r.miss ? `You attack ${t.n}, but miss.` : `You strike ${t.n} for <b>${r.dmg}</b>${r.crit ? ' <span class="gold">(critical!)</span>' : ''}.`);
    const impact = G.FX.heroAttack(t, r, 0);
    setTimeout(() => this.endPlayerTurn(), Math.max(this.delay() * 0.6, impact + 230));
  },
  defend() {
    if (!this.canAct()) return;
    const s = E.stats();
    this.C.defend = true;
    G.S.focus = Math.min(s.maxFocus, G.S.focus + 2);
    this.log('You raise your guard. <span class="muted">(Damage halved until your next turn, +2 Focus)</span>');
    G.Audio.sfx('forge');
    G.FX.heroSelf('defend');
    this.C.busy = true;
    setTimeout(() => this.endPlayerTurn(), 380);
  },
  flee() {
    if (!this.canAct()) return;
    const C = this.C;
    if (C.boss) { G.UI.toast('There is no escape from this fight.', 'bad'); return; }
    const s = E.stats(), elite = C.en.some(e => e.rank === 'elite' && !e.dead);
    const ch = U.clamp(40 + s.A.agi * 2 - (elite ? 20 : 0) - (G.S.light <= 0 ? 10 : 0), 10, 90);
    if (U.chance(ch)) {
      C.over = true; G.Audio.sfx('step');
      G.UI.toast(`You escaped! (${ch}%)`);
      C.opts.onFlee();
    } else {
      this.log(`<span class="bad">You try to flee, but they cut you off! (${ch}%)</span>`);
      this.endPlayerTurn();
    }
  },
  useSkill(id) {
    if (!this.canAct()) return;
    const C = this.C, p = G.S, sk = G.D.SKILLS[id], r = p.skills[id], s = E.stats();
    if (!r || p.focus < sk.cost) return;
    G.UI.closeAllModals();
    p.focus -= sk.cost;
    const ri = r - 1;
    let msg = `You use <b class="gold">${sk.n}</b>.`;
    if (sk.sp === 'bloodrage' || sk.sp === 'lichform') { const c = Math.round(p.hp * 0.1); p.hp = Math.max(1, p.hp - c); this.float('pl', '-' + c, '#ff7070'); }
    const targets = sk.target === 'all' ? this.alive() : sk.target === 'enemy' ? [this.tgt()].filter(Boolean) : [];
    const parts = [];
    const hitsArr = [];
    let reaped = false;
    targets.forEach((t, ti) => {
      for (let h = 0; h < (sk.hits || 1); h++) {
        if (t.dead) break;
        let base = this.baseDmg(sk.dt) * (sk.m ? sk.m[ri] : 1);
        if (sk.sp === 'execute' && t.hp / t.maxHp < 0.3) base *= 2;
        if (sk.sp === 'undead' && t.tags.includes('undead')) base *= 1.5;
        const res = this.hit(C.pl, t, base, sk.dt, { critBonus: sk.sp === 'assassinate' ? 50 : 0 });
        parts.push(res.miss ? `${t.n} dodges` : `${t.n} takes <b>${res.dmg}</b>${res.crit ? ' (crit)' : ''}`);
        if (sk.sp === 'harvest' && t.dead && !reaped) {
          reaped = true;
          const hv = this.heal(C.pl, s.maxHp * 0.15); p.focus = Math.min(s.maxFocus, p.focus + 3);
          parts.push(`you reap its soul (+${hv} HP, +3 Focus)`);
        }
        const rec = { t, res, h, ti, sts: [] };
        hitsArr.push(rec);
        if (!res.miss && !t.dead) {
          [sk.st, sk.st2].filter(Boolean).forEach(st => {
            const ch = Array.isArray(st.ch) ? st.ch[ri] : st.ch;
            if (U.chance(ch)) { this.addSt(t, st.id, st.turns, this.dotPow(st.pow, r)); rec.sts.push(st.id); parts.push(`${t.n} is ${G.D.STATUS[st.id].n.toLowerCase()}`); }
          });
        }
        if (sk.sp === 'siphon' && res.dmg) { const hv = this.heal(C.pl, res.dmg * 0.5); if (hv) parts.push(`you drain ${hv} HP`); }
      }
    });
    if (sk.self) this.addSt(C.pl, sk.self.id, sk.self.turns, Array.isArray(sk.self.pow) ? sk.self.pow[ri] : sk.self.pow);
    switch (sk.sp) {
      case 'ward': { const w = Math.round(s.spell * [2.5, 3, 3.5][ri]); this.addSt(C.pl, 'ward', 4, w); parts.push(`a ward absorbs the next ${w} damage`); G.Audio.sfx('fire'); break; }
      case 'mend': { const hv = this.heal(C.pl, s.maxHp * [0.18, 0.23, 0.28][ri] + s.holy * 1.2); delete C.pl.st.bleed; parts.push(`you heal ${hv} HP`); G.Audio.sfx('heal'); break; }
      case 'litany': { const v = E.addDread(-[10, 14, 18][ri]); parts.push(`Dread ${v}`); G.Audio.sfx('holy'); break; }
      case 'sanctuary': this.addSt(C.pl, 'regen', 3, Math.round(s.maxHp * 0.06)); G.Audio.sfx('holy'); break;
      case 'poised': this.addSt(C.pl, 'poised', 3, 1); break;
      case 'regenFocus': p.focus = Math.min(s.maxFocus, p.focus + 2); break;
      case 'bloodrage': G.Audio.sfx('hurt'); break;
      case 'bonearmor': {
        const w = Math.round(s.spell * (sk.ward || [2, 2.5, 3])[ri]);
        this.addSt(C.pl, 'ward', 4, w); this.addSt(C.pl, 'guard', 2, 20);
        parts.push(`bone plates absorb the next ${w} damage`); G.Audio.sfx('forge'); break;
      }
      case 'lichform': {
        const w = Math.round(s.spell * (sk.ward ? sk.ward[ri] : 2));
        this.addSt(C.pl, 'ward', 4, w); this.addSt(C.pl, 'rage', 3, sk.rage ? sk.rage[ri] : 30);
        parts.push(`death wraps you in a ${w}-point ward`); G.Audio.sfx('dread'); break;
      }
      case 'flare': {
        if (p.dungeon) { const b = p.light; p.light = Math.min(s.lightMax, p.light + 20); const lg = Math.round(p.light - b); if (lg) parts.push(`+${lg} Light`); }
        const v = E.addDread(-8); if (v) parts.push(`Dread ${v}`);
        G.Audio.sfx('fire'); break;
      }
    }
    this.log(msg + (parts.length ? ' ' + parts.join(', ') + '.' : ''));
    // Choreograph the visuals, then end the turn once they land
    C.busy = true;
    const start = G.FX.skillStart(id, targets);
    let last = 0;
    hitsArr.forEach(rec => {
      const at = start.impact(rec.h, rec.ti);
      G.FX.skillHit(id, start.fx, rec.t, rec.res, at, rec.ti);
      rec.sts.forEach(stid => G.FX.statusFx(rec.t.uid, stid, at + 80));
      last = Math.max(last, at);
    });
    this.refresh();
    setTimeout(() => this.endPlayerTurn(), Math.max(this.delay() * 0.7, last + 280));
  },
  useItem(id) {
    if (!this.canAct()) return;
    const C = this.C, p = G.S;
    if (!p.cons[id]) return;
    if (id === 'smokebomb') {
      if (C.boss) { G.UI.toast('There is no escape from this fight.', 'bad'); return; }
      G.UI.closeAllModals();
      p.cons.smokebomb--;
      C.over = true; G.Audio.sfx('step');
      G.UI.toast('You vanish in a cloud of choking smoke.');
      if (C.opts.onFlee) C.opts.onFlee(); else G.UI.go('town');
      return;
    }
    G.UI.closeAllModals();
    if (id === 'whetstone') {
      p.cons.whetstone--;
      this.addSt(C.pl, 'honed', 99, 25);
      this.log('You draw the blackstone along your weapon. <span class="gold">+25% damage for the rest of the fight.</span>');
      G.Audio.sfx('forge'); G.FX.heroSelf('rage');
      C.busy = true;
      setTimeout(() => this.endPlayerTurn(), 480);
    } else if (id === 'bomb' || id === 'frostvial') {
      const frost = id === 'frostvial';
      p.cons[id]--;
      const base = (frost ? 18 : 15) + p.level * 3;
      const parts = this.alive().map(t => {
        const r = this.hit(C.pl, t, base, 'magic', { noMiss: true, noPoise: true });
        if (!t.dead) { if (frost) { if (U.chance(50)) { this.addSt(t, 'stun', 1); G.FX.statusFx(t.uid, 'stun', 300); } } else this.addSt(t, 'burn', 3, 3 + Math.round(p.level * 0.8)); }
        return `${t.n} ${r.dmg}`;
      });
      G.Audio.sfx(frost ? 'spell' : 'fire');
      this.log(frost ? `You shatter a Frost Vial! Grave-cold bites your foes: ${parts.join(', ')}.` : `You hurl an Ashpot! Flames engulf your foes: ${parts.join(', ')}.`);
      C.busy = true;
      G.FX.mark('pl', 'move', 'p-cast', 380, 0);
      this.alive().forEach((t, ti) => {
        if (!frost) G.FX.later(120 + ti * 70, () => { const s = G.FX.spr(t.uid); if (s) G.FX.flames(s, 8); });
        G.FX.later(240 + ti * 70, () => G.FX.onHit(t, { dmg: 1 }, 'none', frost ? '#a8e0ff' : '#ffb347', { burst: frost ? 'frost' : 'ember', shake: ti === 0 ? 2 : 0 }));
      });
      this.refresh();
      setTimeout(() => this.endPlayerTurn(), 620 + this.alive().length * 70);
    } else {
      const msg = E.useCons(id, { cure: all => { (all ? AILMENTS : DOTS).forEach(d => delete C.pl.st[d]); } });
      if (!msg) return;
      this.log(msg);
      G.FX.heroSelf(id === 'potion' || id === 'elixir' ? 'heal' : id === 'tonic' ? 'litany' : 'ward');
      C.busy = true;
      setTimeout(() => this.endPlayerTurn(), 480);
    }
  },

  // ---------------- enemy AI ----------------
  chooseIntent(e) {
    const al = this.C ? this.alive() : [e];
    const cand = e.moves.filter(m => {
      if (m.t === 'heal') return al.some(a => a.hp < a.maxHp * 0.7);
      if (m.t === 'summon') return al.length < 3 && e.summons < 3;
      if (m.t === 'buff') return !e.st[m.self.id];
      return true;
    });
    return U.deep(U.weighted(cand.length ? cand : e.moves));
  },
  intentHtml(e) {
    const m = e.intent; if (!m || e.dead) return '';
    const rng = mult => `${Math.round(e.atk[0] * mult)}-${Math.round(e.atk[1] * mult)}`;
    let ic = 'sword', t = '', hvy = false;
    switch (m.t) {
      case 'atk': t = `${m.n}: ${rng(m.m)}`; break;
      case 'multi': t = `${m.n}: ${m.hits}× ${rng(m.m)}`; break;
      case 'mag': ic = 'sparkle'; t = `${m.n}: ${rng(m.m)} magic`; break;
      case 'dread': ic = 'eye'; t = `${m.n}: terrify`; break;
      case 'buff': ic = 'shield'; t = `${m.n}: ${G.D.STATUS[m.self.id].n}`; break;
      case 'debuff': ic = 'eye'; t = `${m.n}: curse`; break;
      case 'heal': ic = 'heart'; t = `${m.n}: heal`; break;
      case 'summon': ic = 'skull'; t = `${m.n}: summon`; break;
      case 'drain': ic = 'lantern'; t = `${m.n}: steal light`; break;
      case 'charge': ic = 'bolt'; t = `Preparing ${m.n}...`; hvy = true; break;
      case 'release': ic = 'bolt'; t = `${m.n}: ${rng(m.m)}! DEFEND!`; hvy = true; break;
    }
    return `<div class="intent ${hvy ? 'hvy' : ''}">${G.icon(ic)} ${t}</div>`;
  },
  applyMoveSt(m, target, at) {
    [m.st, m.st2].filter(Boolean).forEach(st => {
      if (U.chance(st.ch)) {
        const pow = DOTS.includes(st.id) ? Math.round(st.pow * (1 + this.curE.lvl * 0.08)) : st.pow;
        this.addSt(target, st.id, st.turns, pow);
        this.log(`<span class="bad">You are ${G.D.STATUS[st.id].n.toLowerCase()}!</span>`);
        G.FX.statusFx('pl', st.id, (at || 0) + 60);
      }
    });
  },
  doMove(e) {
    const C = this.C, pl = C.pl, m = e.intent, p = G.S;
    this.curE = e;
    const raw = mult => U.rand(e.atk[0], e.atk[1]) * mult;
    const strike = (mult, dt, label, at) => {
      const r = this.hit(e, pl, raw(mult), dt);
      this.log(r.miss ? `${e.n}'s ${label || m.n} misses you.` : `${e.n} uses ${label || m.n}: <span class="bad">${r.dmg} damage</span>${r.crit ? ' (critical)' : ''}${r.absorbed ? ` <span class="muted">(${r.absorbed} absorbed)</span>` : ''}.`);
      G.FX.later(at || 0, () => G.FX.onHit(pl, r, dt === 'phys' ? G.FX.enemyHitStyle(e) : 'none', null, { shake: m.t === 'release' ? 2 : 0, burst: dt === 'magic' ? 'void' : null }));
      return r;
    };
    let next = null;
    switch (m.t) {
      case 'atk': { const r = strike(m.m, 'phys'); if (!r.miss) { this.applyMoveSt(m, pl); if (m.leech) { this.heal(e, r.dmg * m.leech / 100); G.FX.later(150, () => G.FX.stream(G.FX.el('pl'), G.FX.spr(e.uid), 'blood', 10)); } } break; }
      case 'multi': for (let i = 0; i < m.hits && p.hp > 0; i++) { const r = strike(m.m, 'phys', null, i * 150); if (!r.miss) this.applyMoveSt(m, pl, i * 150); } break;
      case 'mag': { const r = strike(m.m, 'magic'); if (!r.miss) this.applyMoveSt(m, pl); if (m.dread) { const v = E.addDread(m.dread); if (v) this.log(`<span style="color:#b080e0">+${v} Dread</span>`); } break; }
      case 'dread': {
        const v = E.addDread(m.dread);
        this.log(`${e.n} uses ${m.n}. <span style="color:#b080e0">Terror claws at your mind (+${v} Dread).</span>`);
        G.Audio.sfx('dread');
        if (m.m) strike(m.m, 'magic', m.n);
        break;
      }
      case 'buff':
        this.addSt(e, m.self.id, m.self.turns, m.self.pow);
        if (m.hpCost) { const c = Math.round(e.maxHp * m.hpCost / 100); e.hp = Math.max(1, e.hp - c); }
        this.log(`${e.n} uses ${m.n} and gains ${G.D.STATUS[m.self.id].n}.`);
        break;
      case 'debuff': {
        this.log(`${e.n} uses ${m.n}.`);
        this.applyMoveSt(m, pl);
        if (m.dread) { const v = E.addDread(m.dread); this.log(`<span style="color:#b080e0">+${v} Dread</span>`); }
        if (m.focusDrain) { p.focus = Math.max(0, p.focus - m.focusDrain); this.log(`<span class="bad">You lose ${m.focusDrain} Focus.</span>`); }
        G.Audio.sfx('dread');
        break;
      }
      case 'heal': {
        const t = this.alive().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
        const hv = this.heal(t, t.maxHp * m.heal / 100);
        this.log(`${e.n} uses ${m.n}. ${t === e ? 'It' : t.n} recovers ${hv} HP.`);
        break;
      }
      case 'summon': {
        if (this.alive().length < 3) {
          C.en = C.en.filter(x => !x.dead || x.rank === 'boss');
          const ne = this.makeEnemy(m.summon, Math.max(1, e.lvl - 2));
          ne.intent = this.chooseIntent(ne);
          C.en.push(ne); e.summons++;
          this.log(`<span class="bad">${e.n} uses ${m.n}! ${ne.n} joins the fight.</span>`);
          G.Audio.sfx('dread');
          G.FX.spawn(ne, 60, true);
        } else strike(1, 'phys', 'a heavy blow');
        break;
      }
      case 'drain': {
        if (p.dungeon) { const b = p.light; p.light = Math.max(0, p.light - m.drain); this.log(`<span class="bad">${e.n} drinks your lantern's light (-${Math.round(b - p.light)} Light).</span>`); }
        if (m.m) strike(m.m, 'phys');
        break;
      }
      case 'charge':
        e.charged = true;
        this.log(`<span class="bad"><b>${e.n} is preparing ${m.n}!</b> Defend or stun it!</span>`);
        next = { n: m.n, t: 'release', m: m.m };
        break;
      case 'release':
        e.charged = false;
        strike(m.m, 'phys');
        G.U.vibrate(200);
        break;
    }
    e.intent = next || this.chooseIntent(e);
  },
  async enemyPhase() {
    const C = this.C;
    if (!C || C.over) return;
    C.busy = true;
    const list = C.en.slice();
    for (const e of list) {
      if (C.over) return;
      if (e.dead) continue;
      await U.wait(this.delay());
      if (this.C !== C || C.over) return;
      this.tickUnit(e);
      if (e.dead) { this.refresh(); await U.wait(450); if (this.C !== C || C.over) return; continue; }
      if (e.st.stun) {
        delete e.st.stun;
        this.log(`<span class="good">${e.n} is stunned and cannot act.</span>`);
        G.FX.statusFx(e.uid, 'stun', 0);
        this.refresh(); continue;
      }
      const windup = G.FX.enemyAct(e, e.intent);
      await U.wait(Math.min(windup, 420) * (G.settings.fastCombat ? 0.62 : 1));
      if (this.C !== C || C.over) return;
      this.doMove(e);
      this.refresh();
      if (G.S.hp <= 0) { await U.wait(this.delay() + 350); return this.defeat(); }
    }
    if (!this.alive().length) { await U.wait(Math.max(this.delay(), (C.lastDeath || 0) * 0.55)); C.lastDeath = 0; return this.victory(); }
    C.round++;
    await U.wait(Math.round(this.delay() / 2));
    if (this.C !== C || C.over) return;
    this.playerTurnStart();
  },

  // ---------------- end of battle ----------------
  victory() {
    const C = this.C, p = G.S;
    if (C.over) return;
    C.over = true;
    const z = E.zonePow();
    let xp = 0, gold = 0;
    const items = [], lines = [], mats = {}, cons = {};
    C.en.forEach(e => {
      const b = G.D.ENEMIES[e.id];
      xp += (6 + e.lvl * 6) * (b.xp || 1);
      gold += Math.round(U.rand(b.gold[0], b.gold[1]) * (1 + e.lvl * 0.1));
      const boss = e.rank === 'boss', elite = e.rank === 'elite';
      const bonus = z * 2 + (elite ? 10 : 0) + (boss ? 20 : 0);
      if (boss) {
        items.push(E.genItem(e.lvl, 3, { bonus }), E.genItem(e.lvl, 2, { bonus }));
        if (b.unique && !p.flags['uniq_' + e.id]) { p.flags['uniq_' + e.id] = true; items.unshift(E.makeUnique(b.unique)); }
        p.flags['boss_' + e.id] = true; p.stats.bosses++;
        mats.shard = (mats.shard || 0) + U.rand(2, 3);
        const cx = E.killCodex(e.id); if (cx) E.unlockCodex(cx);
      } else if (elite) {
        items.push(E.genItem(e.lvl, 2, { bonus }));
        if (U.chance(50)) mats.shard = (mats.shard || 0) + 1;
        const cx = E.killCodex(e.id); if (cx) E.unlockCodex(cx);
      } else {
        if (U.chance(22)) items.push(E.genItem(e.lvl, 0, { bonus }));
        if (b.codex) E.unlockCodex(b.codex);
      }
      if (U.chance(30)) mats.scrap = (mats.scrap || 0) + U.rand(1, 2);
      if (z >= 3 && U.chance(10)) mats.shard = (mats.shard || 0) + 1;
      if (E.qState('s_herbs') === 'active' && U.chance(18)) mats.gloamcap = (mats.gloamcap || 0) + 1;
      if (U.chance(10)) { const c = U.pick(['potion', 'oil', 'salts']); cons[c] = (cons[c] || 0) + 1; }
      if (b.drop && E.qState(b.drop.q) === 'active' && !p.qitems[b.drop.item] && U.chance(b.drop.ch)) {
        p.qitems[b.drop.item] = 1; lines.push(`<div class="fxline gold">Quest item: <b>${G.D.QITEMS[b.drop.item].n}</b></div>`);
        G.UI.toast(`Found ${G.D.QITEMS[b.drop.item].n}! Return to ${G.D.NPCS[G.D.QUESTS[b.drop.q].giver].n}.`, 'gold');
      }
    });
    const res = E.applyFx({ xp: Math.round(xp), gold, mats: Object.keys(mats).length ? mats : null, cons: Object.keys(cons).length ? cons : null });
    lines.unshift(...res.lines);
    items.forEach(it => { if (E.addItem(it)) lines.push(`<div class="fxline">${G.UI.itemIcon(it, { cls: 'sm' })} ${E.itemName(it)} <span class="tiny muted">${G.D.RARITY[it.rarity].n}</span></div>`); });
    if (items.some(i => i.rarity >= 2)) G.Audio.sfx('rare'); else G.Audio.sfx('loot');
    E.save();
    const title = C.boss ? `${G.icon('crown')} ${C.en.find(e => e.rank === 'boss').n} is defeated!` : `${G.icon('swords')} Victory`;
    G.UI.modal(`<h2 class="${C.boss ? 'gold' : ''}">${title}</h2><div class="body mt"><div class="outcome">${lines.join('')}</div>
      ${E.bagFull() ? '<p class="tiny bad">Your backpack is full. Sell or salvage items in town.</p>' : ''}</div>
      <div class="foot"><button class="btn primary block" data-a="cWin">Continue</button></div>`, { locked: true, center: true });
  },
  defeat() {
    const C = this.C;
    if (C.over) return;
    C.over = true;
    G.Audio.sfx('death'); G.Audio.sfx('bell'); U.vibrate([200, 100, 400]);
    G.FX.shake(3); G.FX.flash('#5a0d14', 900, 0.75);
    G.FX.mark('pl', 'move', 'd-collapse', 1200, 0);
    this.refresh();
    const hc = G.S.hardcore;
    G.UI.modal(`<div class="center"><div class="bad">${G.icon('skull', 'xl')}</div><h2 class="bad">You Have Fallen</h2>
      <p class="muted" style="line-height:1.6">Your lantern rolls from your hand. The dark rushes in, cold and patient.${hc ? ' In Hardcore, there is no return.' : ' Somewhere far above, the Vigil feels the ember go out and sends wardens to drag you home.'}</p></div>
      <div class="foot"><button class="btn danger block" data-a="cLose">${hc ? 'Accept your fate' : 'Awaken in Candlemere'}</button></div>`, { locked: true, center: true });
  },

  // ---------------- UI ----------------
  refresh() {
    if (!G.UI.is('combat')) return;
    G.UI.refresh();
    const C = this.C;
    const floats = C.floats; C.floats = [];
    floats.forEach(([uid, t, c], i) => setTimeout(() => {
      const el = document.getElementById(uid === 'pl' ? 'pl-panel' : 'foe-' + uid);
      G.UI.floatText(el, t, c);
      if (el && uid !== 'pl' && c !== '#aaa' && c !== '#7cc47a') { el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
      if (el && uid === 'pl' && c === '#ff7070') { const s = document.getElementById('screen'); s.classList.remove('flash-red'); void s.offsetWidth; s.classList.add('flash-red'); }
    }, i * 120));
    if (C.flash) { C.flash = false; const s = document.getElementById('screen'); s.classList.add('flash-red'); setTimeout(() => s.classList.remove('flash-red'), 500); }
  },
};

const stChips = u => Object.keys(u.st).map(id => `<span class="st ${G.D.STATUS[id].c}">${G.D.STATUS[id].n}${id === 'ward' ? ' ' + u.st[id].pow : ''}${u.st[id].turns < 50 && id !== 'ward' ? ' ' + u.st[id].turns : ''}</span>`).join('');

S.combat = {
  morph: true,
  render() {
    const C = G.Combat.C, p = G.S, s = E.stats(), F = G.FX;
    const t = G.Combat.tgt();
    const foes = C.en.map(e => {
      const f = G.foeFx(e.id);
      const dying = e.dead && F.dying(e.uid);
      const mv = F.attr(e.uid, 'move'), tn = F.attr(e.uid, 'tint');
      const aura = f.aura && !e.dead ? `<div class="aura"></div>` : '';
      return `<div class="foe ${e.rank} ${e.dead && !dying ? 'dead' : ''} ${e.id === 'reflection' ? 'mirror' : ''} ${t && t.uid === e.uid && !e.dead ? 'tgt' : ''}" id="foe-${e.uid}" data-a="cTarget" data-u="${e.uid}" data-silent="1" style="--ac:${f.aura || '#0000'}">
      <div class="fw${mv.c}" style="${mv.s}">${aura}<div class="fshadow"></div><div class="fi${tn.c}" style="${tn.s}"><div class="fs i-${f.idle}"><img class="fimg" src="${G.ART.foe(e)}" style="width:${Math.round(f.sz * 100)}%" alt="" draggable="false"></div></div></div>
      <div class="fn">${e.n}</div><div class="lv">Lv ${e.lvl}${e.rank !== 'normal' ? ' · ' + U.cap(e.rank) : ''}${e.tags.includes('undead') ? ' · Undead' : ''}</div>
      ${G.UI.bar('hp', e.hp, e.maxHp, e.hp + '/' + e.maxHp)}
      <div class="sts">${stChips(e)}</div>
      ${G.Combat.intentHtml(e)}</div>`;
    }).join('');
    const mv = F.attr('pl', 'move'), tn = F.attr('pl', 'tint');
    const dis = !G.Combat.canAct();
    const dt = E.dreadTier();
    return `<div class="topbar"><div class="row between"><span class="name">${C.boss ? 'Boss Battle' : 'Battle'}</span><span class="chip">Round ${C.round}</span></div></div>
      <div class="stage ${C.boss ? 'boss' : ''}" style="${F.phase()}"><div class="foes">${foes}</div></div>
      <div class="scroll grow clog">${C.log.map((l, i) => `<p class="${i > 2 ? 'old' : ''}">${l}</p>`).join('')}</div>
      <div class="pl-panel">
        <div class="pl-por" id="pl-por"><div class="pshad"></div><div class="fw${mv.c}" style="${mv.s}"><div class="fi${tn.c}" style="${tn.s}"><div class="fs i-breath"><img src="${G.ART.hero(p.cls)}" alt="" draggable="false"></div></div></div></div>
        <div class="pl-info">
          <div class="row between small"><span>${U.esc(p.name)}${C.defend ? ' <span class="st">Defending</span>' : ''}</span><span class="sts" style="margin:0">${stChips(C.pl)}</span></div>
          <div class="hud">${G.UI.bar('hp', p.hp, s.maxHp, 'HP ' + Math.ceil(p.hp) + '/' + s.maxHp)}${G.UI.bar('fo', p.focus, s.maxFocus, 'Focus ' + Math.floor(p.focus) + '/' + s.maxFocus)}
          ${G.UI.bar('dr', p.dread, 100, 'Dread ' + Math.floor(p.dread) + (dt.n ? ' · ' + dt.n : ''))}${p.dungeon ? G.UI.bar('li', p.light, s.lightMax, 'Light ' + Math.floor(p.light)) : ''}</div>
        </div>
      </div>
      <div class="cact" style="padding-top:8px">
        <button class="btn primary big" data-a="cAttack" ${dis ? 'disabled' : ''}>${G.icon('sword')} Attack<span class="sub" style="color:#e8d0a0">${s.atkMin}-${s.atkMax}</span></button>
        <button class="btn" data-a="cSkills" ${dis ? 'disabled' : ''}>${G.icon('bolt')} Skills</button>
        <button class="btn" data-a="cItems" ${dis ? 'disabled' : ''}>${G.icon('potion')} Items</button>
        <button class="btn" data-a="cDefend" ${dis ? 'disabled' : ''}>${G.icon('shield')} Defend</button>
        <button class="btn" data-a="cFlee" ${dis || C.boss ? 'disabled' : ''}>${G.icon('flee')} Flee</button>
      </div>`;
  },
  after(prm, isRefresh) {
    if (!isRefresh) G.Audio.ambient(G.Combat.C.boss ? 'boss' : 'combat');
  },
  leave() { G.FX.clear(); },
};

G.A.cTarget = d => { const C = G.Combat.C; if (!C || C.over) return; C.target = d.u; G.Audio.sfx('click'); G.UI.refresh(); };
G.A.cAttack = () => G.Combat.attack();
G.A.cDefend = () => G.Combat.defend();
G.A.cFlee = () => G.Combat.flee();
G.A.cSkills = () => {
  const p = G.S, list = G.D.CLASSES[p.cls].skills.filter(id => p.skills[id] && G.D.SKILLS[id].kind === 'active');
  G.UI.modal(`<h2>${G.icon('bolt')} Skills</h2><div class="tiny muted">Focus: ${Math.floor(p.focus)} · Target: ${G.Combat.tgt() ? G.Combat.tgt().n : '-'}</div>
    <div class="body mt">${list.map(id => { const s = G.D.SKILLS[id], ok = p.focus >= s.cost;
      return `<button class="btn block choice mb" data-a="cUseSkill" data-k="${id}" ${ok ? '' : 'disabled'} style="flex-direction:column;align-items:flex-start;gap:2px">
        <span class="row between" style="width:100%"><b>${s.n}</b><span class="chance" style="color:var(--focus)">${s.cost} Focus</span></span>
        <span class="tiny muted" style="text-align:left">${s.desc(p.skills[id])}</span></button>`; }).join('') || '<p class="muted">No active skills learned yet.</p>'}</div>
    <div class="foot"><button class="btn ghost block" data-a="closeModal">Cancel</button></div>`);
};
G.A.cUseSkill = d => G.Combat.useSkill(d.k);
G.A.cItems = () => {
  const p = G.S, ids = Object.keys(G.D.CONS).filter(id => (G.D.CONS[id].combat || G.D.CONS[id].combatOnly) && p.cons[id] > 0);
  G.UI.modal(`<h2>${G.icon('potion')} Items</h2><div class="body mt">${ids.map(id => { const c = G.D.CONS[id];
    return `<button class="btn block choice mb" data-a="cUseItem" data-k="${id}" style="flex-direction:column;align-items:flex-start;gap:2px">
      <span class="row between" style="width:100%"><b>${c.n}</b><span class="chance">×${p.cons[id]}</span></span><span class="tiny muted">${c.desc}</span></button>`; }).join('') || '<p class="muted">You have no usable items.</p>'}</div>
    <div class="foot"><button class="btn ghost block" data-a="closeModal">Cancel</button></div>`);
};
G.A.cUseItem = d => G.Combat.useItem(d.k);
G.A.cWin = () => { G.UI.closeAllModals(); const C = G.Combat.C; C.opts.onWin(); };
G.A.cLose = () => {
  G.UI.closeAllModals();
  const name = G.S.name, level = G.S.level;
  const res = E.die();
  if (res.hardcore) { G.S = null; G.UI.go('gameover', { name, level }); return; }
  G.UI.go('town');
  G.UI.alert('Dragged Home', `<p class="muted">You wake in the Chapel of the Wick with wardens' mud on your boots and a hollow ache in your chest.</p>
    <div class="outcome"><div class="fxline bad">-${res.gold} gold</div><div class="fxline bad">${res.items} item(s) from this expedition lost</div><div class="fxline muted">Half HP. Your Dread lingers.</div></div>`);
  S.tip('death');
};
})();
