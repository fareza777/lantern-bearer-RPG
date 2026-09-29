/* Art lookup, animation profiles, and the combat visual-effects engine */
(() => {
const U = G.U;

// ---------------- Art ----------------
G.ART = {
  foe: e => e.id === 'reflection' ? `assets/hero/${G.S ? G.S.cls : 'sellsword'}.webp` : `assets/foe/${e.id}.webp`,
  hero: cls => `assets/hero/${cls}.webp`,
  item: it => `assets/items/${it.unique ? 'u_' + it.unique : it.base}.webp`,
  cons: id => `assets/items/c_${id}.webp`,
  mat: id => `assets/items/m_${id}.webp`,
  qitem: id => `assets/items/q_${id}.webp`,
  rune: id => `assets/items/r_${id}.webp`,
  misc: k => `assets/items/x_${k}.webp`,
};

G.UI.itemIcon = (it, opt) => {
  opt = opt || {};
  const c = `ii r${it.rarity}${it.unique ? ' uq' : ''}${opt.cls ? ' ' + opt.cls : ''}`;
  return `<div class="${c}"><img src="${G.ART.item(it)}" alt="" draggable="false">${it.up ? `<b class="up">+${it.up}</b>` : ''}</div>`;
};
G.UI.artIcon = (src, cls) => `<div class="ii plain ${cls || ''}"><img src="${src}" alt="" draggable="false"></div>`;
G.UI.portrait = (cls, extra) => `<div class="portrait ${extra || ''}" style="--cc:${G.D.CLASSES[cls].color}"><img src="${G.ART.hero(cls)}" alt="" draggable="false"></div>`;

/* Per-enemy animation profile.
 idle: looping body motion   atk: melee VFX on the hero   mag: projectile kind
 death: death animation      pt: ambient particles         sz: sprite scale
 aura: glow colour behind bosses/elites */
const P = (idle, atk, death, pt, sz, mag, aura) => ({ idle, atk, death, pt, sz: sz || 1, mag: mag || 'void', aura });
G.D.FOE_FX = {
  rat: P('scuttle', 'bite', 'collapse', 'dust', 0.82),
  bones: P('rattle', 'blade', 'crumble', 'dust', 1),
  leech: P('pulse', 'bite', 'collapse', 'drip', 0.82),
  acolyte: P('sway', 'blade', 'fall', 'void', 0.95, 'void'),
  ghoul: P('crouch', 'claw', 'collapse', null, 0.95),
  boneknight: P('heavy', 'heavy', 'crumble', 'blue', 1.08, 'void', '#5a8cff'),
  grevald: P('regal', 'blunt', 'boss', 'blue', 1.15, 'frost', '#4d7dff'),
  lurker: P('crouch', 'claw', 'collapse', 'drip', 1),
  pilgrim: P('sway', 'blunt', 'crumble', 'drip', 0.98),
  crows: P('flock', 'peck', 'scatter', 'feather', 1),
  moth: P('hover', 'claw', 'dissipate', 'spore', 1, 'spore'),
  boar: P('snort', 'heavy', 'collapse', 'steam', 1.05),
  weepknight: P('heavy', 'blade', 'crumble', 'drip', 1.08, 'void', '#6aa0d8'),
  brine: P('sway', 'lash', 'boss', 'drip', 1.15, 'brine', '#4fae6a'),
  wraith: P('hover', 'claw', 'dissipate', 'mist', 1, 'frost'),
  golem: P('heavy', 'blunt', 'shatter', 'ember', 1.08),
  stalker: P('flicker', 'claw', 'dissipate', 'void', 1),
  husk: P('twitch', 'lash', 'crumble', null, 0.98),
  fcantor: P('sway', 'blade', 'crumble', null, 0.98, 'sonic'),
  seraph: P('hover', 'fireblade', 'shatter', 'ember', 1.12, 'fire', '#ff7a2a'),
  cantor: P('hover', 'blunt', 'boss', 'mote', 1.18, 'sonic', '#e8d58a'),
  mimic: P('chomp', 'bite', 'shatter', null, 0.9),
  robber: P('crouch', 'stab', 'fall', null, 0.95),
  reflection: P('mirror', 'blade', 'dissipate', 'void', 0.95, 'void'),
  // Act II
  candlewight: P('sway', 'claw', 'collapse', 'ember', 1, 'fire'),
  tombweaver: P('crouch', 'bite', 'collapse', 'dust', 1.05),
  bogsister: P('sway', 'lash', 'fall', 'drip', 1, 'brine'),
  gulleteel: P('pulse', 'bite', 'collapse', 'drip', 1),
  bellringer: P('heavy', 'blunt', 'fall', null, 1.08, 'sonic'),
  snuffer: P('hover', 'claw', 'dissipate', 'void', 1.05, 'void'),
  hangedman: P('sway', 'claw', 'crumble', null, 1),
  wickerman: P('twitch', 'blunt', 'collapse', 'ember', 1.05, 'fire'),
  gloamwolf: P('crouch', 'bite', 'collapse', 'void', 1),
  witchlight: P('hover', 'claw', 'dissipate', 'mist', 0.9, 'frost'),
  gallowcrow: P('flock', 'peck', 'scatter', 'feather', 1.1),
  gibbet: P('heavy', 'bite', 'collapse', null, 1.1, 'void', '#8a6a3a'),
  shepherd: P('sway', 'lash', 'boss', 'void', 1.15, 'sonic', '#6a8ab8'),
  inkling: P('pulse', 'claw', 'dissipate', 'void', 0.85),
  burnedscribe: P('sway', 'blade', 'crumble', 'ember', 1, 'fire'),
  bookwyrm: P('scuttle', 'bite', 'collapse', 'dust', 1.05),
  censor: P('sway', 'lash', 'fall', 'void', 1, 'void'),
  cinderauto: P('heavy', 'blunt', 'shatter', 'ember', 1.08),
  folio: P('heavy', 'blade', 'shatter', 'dust', 1.1, 'void', '#c9a86a'),
  quillon: P('hover', 'lash', 'boss', 'mote', 1.18, 'void', '#d8c26a'),
  courtier: P('sway', 'claw', 'fall', null, 1),
  handmaiden: P('hover', 'claw', 'dissipate', 'mist', 1, 'frost'),
  jester: P('twitch', 'stab', 'fall', null, 0.98),
  rimegargoyle: P('crouch', 'claw', 'shatter', null, 1.1),
  bloodthrall: P('crouch', 'claw', 'collapse', null, 0.98),
  executioner: P('heavy', 'heavy', 'fall', null, 1.12, 'void', '#7a94b8'),
  isolde: P('regal', 'claw', 'boss', 'mist', 1.15, 'frost', '#a8d4f0'),
  gnashmaw: P('pulse', 'bite', 'collapse', 'void', 1.05),
  eyeless: P('sway', 'claw', 'dissipate', 'void', 1.08),
  hollowed: P('sway', 'blade', 'fall', 'mote', 1),
  veincrawler: P('scuttle', 'bite', 'collapse', null, 1),
  choirecho: P('hover', 'blunt', 'dissipate', 'mote', 1, 'sonic'),
  mawwarden: P('heavy', 'bite', 'boss', 'void', 1.15, 'void', '#8a5adf'),
  ivel: P('hover', 'lash', 'boss', 'mote', 1.2, 'void', '#e8c86a'),
};
G.foeFx = id => G.D.FOE_FX[id] || P('breath', 'claw', 'collapse', null, 1);

const DEATH_MS = { collapse: 800, crumble: 1000, fall: 800, dissipate: 1000, scatter: 900, shatter: 900, boss: 1900 };

/* Skill VFX. st: strike style on target, proj: projectile, self: effect on hero,
 all: hits every foe, pre: build-up before impact, shake: screen shake level */
G.D.SKILL_FX = {
  heavy_blow: { st: 'heavy', shake: 2, lunge: 'big' },
  cleave: { st: 'sweep', all: true, shake: 1, lunge: 'big' },
  iron_stance: { self: 'guard' },
  sunder: { st: 'sunder', shake: 2, burst: 'shard' },
  bloodrage: { self: 'rage' },
  execute: { st: 'execute', pre: 'dim', shake: 3, lunge: 'big' },
  twin_fang: { st: 'stab', gap: 170 },
  venom_edge: { st: 'blade', color: '#8fe06a', burst: 'poison' },
  shadowstep: { self: 'shadow' },
  garrote: { st: 'garrote', burst: 'blood' },
  fan_knives: { proj: 'knife', all: true },
  assassinate: { st: 'assassinate', pre: 'dim', shake: 2 },
  cinder_bolt: { proj: 'fire', burst: 'ember', shake: 1 },
  frost_shackle: { proj: 'frost', burst: 'frost' },
  ember_ward: { self: 'ward' },
  pyre: { st: 'pyre', all: true, shake: 2, burst: 'ember' },
  siphon: { proj: 'void', burst: 'void', after: 'siphon' },
  sunflare: { st: 'sunflare', pre: 'glow', shake: 3, flash: '#fff1c4' },
  chastise: { st: 'beam', burst: 'holy' },
  mend: { self: 'heal' },
  litany: { self: 'litany' },
  brand: { st: 'brand', burst: 'holy' },
  sanctuary: { self: 'sanctuary' },
  wrath: { st: 'beam', all: true, shake: 2, flash: '#ffe9a0', burst: 'holy' },
  whirlwind: { st: 'sweep', all: true, shake: 2, lunge: 'big' },
  death_blossom: { st: 'blade', all: true, burst: 'poison', gap: 140 },
  cataclysm: { st: 'pyre', all: true, pre: 'glow', shake: 3, flash: '#ffb27a', burst: 'ember' },
  dawnbreaker: { st: 'beam', all: true, shake: 2, flash: '#ffe9a0', burst: 'holy' },
  bone_spike: { st: 'sunder', burst: 'bone' },
  wither: { proj: 'void', burst: 'poison', color: '#8fe06a' },
  bone_armor: { self: 'ward' },
  soul_harvest: { proj: 'void', burst: 'void', after: 'siphon' },
  plague: { st: 'pyre', all: true, color: '#9fe870', burst: 'poison' },
  death_knell: { st: 'execute', pre: 'dim', shake: 2 },
  lich_form: { self: 'ward' },
  aimed_shot: { proj: 'knife', color: '#cfe2ff' },
  hunters_mark: { st: 'blade', color: '#8fb8ff' },
  volley: { proj: 'knife', all: true, gap: 120 },
  snare: { st: 'garrote', burst: 'dust' },
  flare: { proj: 'fire', all: true, burst: 'spark', flash: '#fff1c4' },
  deadeye: { st: 'assassinate', pre: 'dim', shake: 2, color: '#cfe2ff' },
  rain_of_bolts: { proj: 'knife', all: true, gap: 110, shake: 1 },
};

const COL = {
  blood: ['#ff4a4a', '#b3121f', '#ff8a7a'], spark: ['#fff6c8', '#ffcf5a', '#ffffff'], ember: ['#ffb347', '#ff6a1a', '#ffd27a'],
  holy: ['#fff2b0', '#ffd45a', '#ffffff'], poison: ['#9fe870', '#4fae3a', '#d6ff9a'], frost: ['#bff0ff', '#6ac8ff', '#ffffff'],
  void: ['#b98cff', '#6a3ad0', '#e2c8ff'], dust: ['#bfb6a6', '#8d8476', '#e0d8c8'], bone: ['#efe6cf', '#c9bb98', '#fffaf0'],
  shard: ['#d8a458', '#9a6a2a', '#ffe0a0'], heal: ['#9cf58a', '#5fcf6a', '#e0ffd0'], water: ['#8ac6d8', '#3f7e96', '#d0f0ff'],
  feather: ['#2a2530', '#4a4252', '#15121a'], sonic: ['#ffe0c0', '#ff9a7a', '#fff'], gold: ['#ffe28a', '#d9a441', '#fff6d0'],
};
const TAG_BURST = { undead: 'bone', beast: 'blood', human: 'blood', construct: 'shard', gloam: 'void' };

// ---------------- Engine ----------------
G.FX = {
  live: {},
  now: () => performance.now(),
  on() { return G.settings.shake !== false; },
  app() { return document.getElementById('app'); },
  layer() {
    let l = document.getElementById('fx-layer');
    if (!l) { l = document.createElement('div'); l.id = 'fx-layer'; this.app().appendChild(l); }
    return l;
  },
  clear() { const l = document.getElementById('fx-layer'); if (l) l.innerHTML = ''; this.live = {}; },
  el(uid) { return document.getElementById(uid === 'pl' ? 'pl-por' : 'foe-' + uid); },
  // Sprite element of a unit (falls back to the unit container)
  spr(uid) { const e = this.el(uid); return e ? (e.querySelector('.fw') || e) : null; },
  rect(el) {
    if (!el) return null;
    const r = el.getBoundingClientRect(), a = this.app().getBoundingClientRect();
    return { x: r.left - a.left, y: r.top - a.top, w: r.width, h: r.height, cx: r.left - a.left + r.width / 2, cy: r.top - a.top + r.height / 2 };
  },
  later(ms, fn) { setTimeout(() => { try { fn(); } catch (e) { console.error(e); } }, Math.max(0, ms)); },

  /* Transient per-unit animation that survives screen re-renders: the renderer reads the mark and
     re-applies the class with a negative delay so the animation continues from where it was. */
  mark(uid, ch, cls, dur, delay) {
    const m = { c: cls, t: this.now() + (delay || 0), d: dur };
    (this.live[uid] = this.live[uid] || {})[ch] = m;
    const el = this.el(uid);
    const node = el && el.querySelector(ch === 'move' ? '.fw' : '.fi');
    if (node) this.applyTo(node, ch, m);
  },
  applyTo(node, ch, m) {
    const base = ch === 'move' ? 'fw' : 'fi';
    node.className = node.className.split(' ').filter(c => c === base || !c.startsWith('a-')).join(' ');
    void node.offsetWidth; // restart the animation even if the same class is applied twice in a row
    node.classList.add('a-' + m.c);
    node.style.animationDelay = (m.t - this.now()) + 'ms';
    node.style.animationDuration = m.d + 'ms';
  },
  // Returns ` a-cls" style="..."` fragment for templates
  attr(uid, ch) {
    const m = this.live[uid] && this.live[uid][ch];
    if (!m) return { c: '', s: '' };
    const el = this.now() - m.t;
    if (el > m.d) { delete this.live[uid][ch]; return { c: '', s: '' }; }
    return { c: ' a-' + m.c, s: `animation-delay:${-el}ms;animation-duration:${m.d}ms;` };
  },
  dying(uid) { const m = this.live[uid] && this.live[uid].move; return !!(m && m.c.startsWith('d-') && this.now() - m.t <= m.d); },
  deathMs(e) { return DEATH_MS[e.rank === 'boss' ? 'boss' : G.foeFx(e.id).death] || 900; },

  // Global phase so looping idle animations stay continuous across re-renders
  phase() { return `--ph:${-(this.now() / 1000).toFixed(3)}s`; },

  // ---------- primitives ----------
  add(cls, x, y, w, h, life, html) {
    const d = document.createElement('div');
    d.className = 'vx ' + cls;
    d.style.cssText = `left:${x - w / 2}px;top:${y - h / 2}px;width:${w}px;height:${h}px`;
    if (html) d.innerHTML = html;
    this.layer().appendChild(d);
    setTimeout(() => d.remove(), life || 800);
    return d;
  },
  shake(level) {
    if (!this.on() || !level) return;
    const s = document.getElementById('screen'), a = [0, 3, 6, 11][level];
    const k = [];
    for (let i = 0; i < 7; i++) k.push({ transform: `translate(${U.randf(-a, a).toFixed(1)}px,${U.randf(-a * 0.7, a * 0.7).toFixed(1)}px)` });
    k.push({ transform: 'none' });
    s.animate(k, { duration: 160 + level * 90, easing: 'ease-out' });
  },
  flash(color, dur, op) {
    if (!this.on()) return;
    const d = document.createElement('div');
    d.className = 'vx vflash';
    d.style.background = color;
    this.layer().appendChild(d);
    d.animate([{ opacity: op || 0.55 }, { opacity: 0 }], { duration: dur || 260, easing: 'ease-out' }).onfinish = () => d.remove();
  },
  dim(dur) {
    if (!this.on()) return;
    const d = document.createElement('div');
    d.className = 'vx vflash';
    d.style.background = 'radial-gradient(circle at 50% 30%, #0000 10%, #000 75%)';
    this.layer().appendChild(d);
    d.animate([{ opacity: 0 }, { opacity: 0.85, offset: 0.35 }, { opacity: 0.85, offset: 0.6 }, { opacity: 0 }], { duration: dur || 700 }).onfinish = () => d.remove();
  },
  burst(el, kind, n, spread) {
    const r = this.rect(el); if (!r) return;
    const c = COL[kind] || COL.spark;
    const heavy = ['blood', 'bone', 'shard', 'water', 'dust'].includes(kind);
    n = n || 12; spread = spread || 1;
    for (let i = 0; i < n; i++) {
      const s = U.randf(3, heavy ? 7 : 5);
      const p = this.add('vp' + (kind === 'feather' ? ' fe' : ''), r.cx + U.randf(-r.w * 0.12, r.w * 0.12), r.cy + U.randf(-r.h * 0.12, r.h * 0.12), s, kind === 'feather' ? s * 2.2 : s, 1100);
      p.style.background = U.pick(c);
      if (!heavy) p.style.boxShadow = `0 0 6px ${c[0]}`;
      const ang = U.randf(0, Math.PI * 2), dist = U.randf(24, 70) * spread;
      const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist * 0.8;
      const g = heavy ? U.randf(30, 70) : U.randf(-30, 10);
      p.animate([
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${dx * 0.7}px,${dy * 0.7}px) scale(1) rotate(${U.rand(0, 360)}deg)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${dx}px,${dy + g}px) scale(.4) rotate(${U.rand(0, 720)}deg)`, opacity: 0 },
      ], { duration: U.rand(500, 900), easing: 'cubic-bezier(.2,.7,.4,1)' });
    }
  },
  motes(el, kind, n, up) {
    const r = this.rect(el); if (!r) return;
    const c = COL[kind] || COL.gold;
    for (let i = 0; i < (n || 10); i++) {
      const s = U.randf(3, 6);
      const p = this.add('vp', r.x + U.randf(0.15, 0.85) * r.w, r.y + r.h * U.randf(0.55, 0.95), s, s, 1500);
      p.style.background = U.pick(c); p.style.boxShadow = `0 0 8px ${c[0]}`;
      p.animate([{ transform: 'translate(0,0)', opacity: 0 }, { opacity: 1, offset: 0.2 },
        { transform: `translate(${U.randf(-14, 14)}px,${-(up || 60) - U.randf(0, 30)}px)`, opacity: 0 }],
        { duration: U.rand(800, 1300), delay: i * 45, easing: 'ease-out', fill: 'both' });
    }
  },
  stream(fromEl, toEl, kind, n) {
    const a = this.rect(fromEl), b = this.rect(toEl); if (!a || !b) return;
    const c = COL[kind] || COL.gold;
    for (let i = 0; i < (n || 12); i++) {
      const s = U.randf(3, 6);
      const x0 = a.cx + U.randf(-a.w * 0.2, a.w * 0.2), y0 = a.cy + U.randf(-a.h * 0.2, a.h * 0.2);
      const p = this.add('vp', x0, y0, s, s, 1600);
      p.style.background = U.pick(c); p.style.boxShadow = `0 0 8px ${c[0]}`;
      const mx = (b.cx - x0) / 2 + U.randf(-40, 40), my = (b.cy - y0) / 2 + U.randf(-30, 30);
      p.animate([{ transform: 'translate(0,0)', opacity: 0 }, { transform: `translate(${mx}px,${my}px)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${b.cx - x0}px,${b.cy - y0}px) scale(.5)`, opacity: 0 }],
        { duration: 650, delay: i * 40, easing: 'ease-in', fill: 'both' });
    }
  },
  ring(el, color, size, dur) {
    const r = this.rect(el); if (!r) return;
    const s = size || Math.max(r.w, r.h) * 0.8;
    const d = this.add('vring', r.cx, r.cy, s, s, (dur || 500) + 50);
    d.style.borderColor = color; d.style.boxShadow = `0 0 14px ${color}, inset 0 0 14px ${color}`;
    d.animate([{ transform: 'scale(.2)', opacity: 1 }, { transform: 'scale(1.25)', opacity: 0 }], { duration: dur || 500, easing: 'ease-out' });
  },
  sigil(el, color, size, dur, y) {
    const r = this.rect(el); if (!r) return;
    const s = size || Math.min(r.w, r.h) * 0.95;
    const d = this.add('vsigil', r.cx, y != null ? r.y + r.h * y : r.cy, s, s, (dur || 900) + 50, SIGIL);
    d.style.color = color;
    d.animate([{ transform: 'scale(.4) rotate(0)', opacity: 0 }, { transform: 'scale(1) rotate(60deg)', opacity: 1, offset: 0.3 },
      { transform: 'scale(1.05) rotate(140deg)', opacity: 0.9, offset: 0.75 }, { transform: 'scale(1.2) rotate(180deg)', opacity: 0 }], { duration: dur || 900, easing: 'ease-out' });
  },
  beam(el, color, dur) {
    const r = this.rect(el); if (!r) return;
    const top = 0, h = r.y + r.h * 0.85 - top;
    const d = this.add('vbeam', r.cx, top + h / 2, Math.max(34, r.w * 0.38), h, (dur || 650) + 50);
    d.style.setProperty('--c', color);
    d.animate([{ transform: 'scaleX(.1)', opacity: 0 }, { transform: 'scaleX(1.2)', opacity: 1, offset: 0.25 }, { transform: 'scaleX(.8)', opacity: 0.9, offset: 0.6 }, { transform: 'scaleX(0)', opacity: 0 }], { duration: dur || 650, easing: 'ease-out' });
    this.ring({ getBoundingClientRect: () => { const a = this.app().getBoundingClientRect(); return { left: a.left + r.cx - 30, top: a.top + r.y + r.h * 0.85 - 12, width: 60, height: 24 }; } }, color, r.w * 0.9, 600);
  },
  flames(el, n) {
    const r = this.rect(el); if (!r) return;
    for (let i = 0; i < (n || 7); i++) {
      const w = U.randf(14, 26), h = w * 2.1;
      const d = this.add('vflame', r.x + r.w * U.randf(0.15, 0.85), r.y + r.h * U.randf(0.72, 0.92), w, h, 1100);
      d.animate([{ transform: 'translateY(10px) scale(.3)', opacity: 0 }, { transform: 'translateY(-6px) scale(1.1)', opacity: 1, offset: 0.3 },
        { transform: `translateY(-${U.rand(30, 60)}px) scale(.4)`, opacity: 0 }], { duration: U.rand(650, 950), delay: i * 50, easing: 'ease-out', fill: 'both' });
    }
  },
  // Stroke-drawn slash/claw/bite marks over the target
  strike(el, style, color, opt) {
    const r = this.rect(el); if (!r) return;
    opt = opt || {};
    const paths = STRIKES[style] || STRIKES.blade;
    const size = Math.max(70, Math.min(r.w, r.h) * (opt.big ? 1.25 : 0.95));
    const flip = opt.flip != null ? opt.flip : U.chance(50);
    const rot = opt.rot != null ? opt.rot : U.rand(-18, 18);
    const svg = `<svg viewBox="0 0 100 100" style="transform:scaleX(${flip ? -1 : 1}) rotate(${rot}deg)">${paths.map((p, i) =>
      `<path d="${p}" class="sg" style="animation-delay:${i * (opt.stagger || 40)}ms"/><path d="${p}" class="sc" style="animation-delay:${i * (opt.stagger || 40)}ms"/>`).join('')}</svg>`;
    const d = this.add('vstrike ' + style, r.cx + (opt.dx || 0), r.cy + (opt.dy || 0), size, size, 700, svg);
    d.style.setProperty('--c', color || '#fff');
    d.style.setProperty('--w', (opt.w || 7) + 'px');
  },
  impact(el, color, big) {
    const r = this.rect(el); if (!r) return;
    const s = Math.min(r.w, r.h) * (big ? 0.9 : 0.6);
    const d = this.add('vimpact', r.cx, r.cy, s, s, 450);
    d.style.setProperty('--c', color || '#fff');
    d.animate([{ transform: 'scale(.3)', opacity: 1 }, { transform: 'scale(1.1)', opacity: 0 }], { duration: 380, easing: 'ease-out' });
  },
  proj(fromEl, toEl, kind, dur, opt) {
    const a = this.rect(fromEl), b = this.rect(toEl); if (!a || !b) return;
    opt = opt || {};
    dur = dur || 380;
    const x0 = a.cx + (opt.ox || 0), y0 = a.cy + (opt.oy || 0), dx = b.cx - x0, dy = b.cy - y0;
    const ang = Math.atan2(dy, dx) * 180 / Math.PI;
    const isKnife = kind === 'knife';
    const d = this.add('vorb ' + kind, x0, y0, isKnife ? 30 : 22, isKnife ? 10 : 22, dur + 60, isKnife ? KNIFE : '<i></i>');
    const arc = opt.arc != null ? opt.arc : -30;
    d.animate([{ transform: `translate(0,0) rotate(${ang}deg) scale(.5)` },
      { transform: `translate(${dx / 2}px,${dy / 2 + arc}px) rotate(${ang}deg) scale(1)`, offset: 0.5 },
      { transform: `translate(${dx}px,${dy}px) rotate(${ang}deg) scale(1.15)` }], { duration: dur, easing: 'cubic-bezier(.45,.05,.8,.5)', fill: 'forwards' });
    if (!isKnife) {
      const c = COL[{ fire: 'ember', frost: 'frost', void: 'void', holy: 'holy', spore: 'poison', brine: 'water', sonic: 'sonic', arcane: 'void' }[kind] || 'ember'];
      const t0 = this.now();
      const iv = setInterval(() => {
        const k = (this.now() - t0) / dur;
        if (k >= 1) { clearInterval(iv); return; }
        const e = k < 0.5 ? k * 2 : 1, ar = arc * Math.sin(Math.PI * k);
        const p = this.add('vp', x0 + dx * k, y0 + dy * k + ar, 5, 5, 500);
        p.style.background = U.pick(c); p.style.boxShadow = `0 0 6px ${c[0]}`;
        p.animate([{ opacity: 0.9, transform: 'scale(1)' }, { opacity: 0, transform: `translate(${U.randf(-6, 6)}px,${U.randf(-8, 4)}px) scale(.2)` }], { duration: 420 * e + 80 });
      }, 28);
    }
  },
  sonic(fromEl, toEl, dur) {
    const a = this.rect(fromEl), b = this.rect(toEl); if (!a || !b) return;
    for (let i = 0; i < 3; i++) {
      const d = this.add('vring', a.cx, a.cy, 30, 30, (dur || 450) + 200);
      d.style.borderColor = '#ffd0b0'; d.style.boxShadow = '0 0 10px #ff9a7a';
      d.animate([{ transform: 'translate(0,0) scale(.5)', opacity: 0.9 }, { transform: `translate(${b.cx - a.cx}px,${b.cy - a.cy}px) scale(2.2)`, opacity: 0 }],
        { duration: dur || 450, delay: i * 90, easing: 'ease-in', fill: 'both' });
    }
  },
  banner(title, sub) {
    const d = document.createElement('div');
    d.className = 'vx vbanner';
    d.innerHTML = `<div class="bl"></div><div class="bt">${title}</div>${sub ? `<div class="bs">${sub}</div>` : ''}<div class="bl"></div>`;
    this.layer().appendChild(d);
    d.animate([{ opacity: 0, transform: 'scale(1.3)', filter: 'blur(6px)' }, { opacity: 1, transform: 'scale(1)', filter: 'blur(0)', offset: 0.15 },
      { opacity: 1, transform: 'scale(.98)', offset: 0.8 }, { opacity: 0, transform: 'scale(.95)', filter: 'blur(4px)' }], { duration: 2300, easing: 'ease-out' }).onfinish = () => d.remove();
  },
  text(el, txt, color) {
    const r = this.rect(el); if (!r) return;
    const d = this.add('vword', r.cx, r.y + r.h * 0.3, 200, 30, 1200);
    d.textContent = txt; d.style.color = color || '#fff';
    d.animate([{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1.1)', offset: 0.2 }, { opacity: 1, transform: 'scale(1) translateY(-10px)', offset: 0.7 }, { opacity: 0, transform: 'translateY(-24px)' }], { duration: 1100 });
  },
};

const SIGIL = `<svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="50" cy="50" r="46"/><circle cx="50" cy="50" r="38" stroke-dasharray="4 3"/>
<path d="M50 12 L83 69 L17 69 Z"/><path d="M50 88 L17 31 L83 31 Z" opacity=".6"/><circle cx="50" cy="50" r="10"/>
${Array.from({ length: 12 }, (_, i) => { const a = i * Math.PI / 6; return `<line x1="${50 + Math.cos(a) * 42}" y1="${50 + Math.sin(a) * 42}" x2="${50 + Math.cos(a) * 46}" y2="${50 + Math.sin(a) * 46}"/>`; }).join('')}</svg>`;
const KNIFE = '<svg viewBox="0 0 30 10"><path d="M0 5 L6 2 L7 4 L28 5 L7 6 L6 8 Z" fill="#dfe6ee" stroke="#8fe06a" stroke-width=".6"/></svg>';
const STRIKES = {
  blade: ['M14,80 Q40,22 90,14'],
  fireblade: ['M14,80 Q40,22 90,14', 'M22,88 Q52,38 94,30'],
  heavy: ['M86,10 L16,88', 'M92,20 L28,94'],
  stab: ['M24,76 L80,22'],
  claw: ['M26,12 Q36,50 20,88', 'M48,10 Q58,50 42,90', 'M70,12 Q80,50 64,88'],
  peck: ['M30,30 L42,44', 'M58,24 L68,40', 'M40,60 L52,72', 'M66,58 L76,70'],
  bite: ['M12,34 Q50,74 88,34', 'M12,72 Q50,32 88,72'],
  lash: ['M4,62 C24,18 42,92 62,40 S88,26 96,50'],
  sweep: ['M2,64 Q50,14 98,64'],
  sunder: ['M20,20 L80,80', 'M80,22 L22,80', 'M50,8 L50,92'],
  execute: ['M50,2 L50,98'],
  assassinate: ['M16,16 L84,84', 'M84,16 L16,84'],
  garrote: ['M18,46 A32,12 0 1 0 82,46 A32,12 0 1 0 18,46'],
  blunt: ['M50,50 m-28,0 a28,28 0 1,0 56,0 a28,28 0 1,0 -56,0'],
};

// ---------------- High-level combat choreography ----------------
const heroWeaponStyle = () => {
  const w = G.S.equip.weapon;
  const wt = w ? (G.D.BASES[w.base] || {}).wt : null;
  return { sword: 'blade', axe: 'heavy', dagger: 'stab', mace: 'blunt', staff: 'arcane', sickle: 'lash', crossbow: 'arcane', hammer: 'heavy', astrolabe: 'arcane', claw: 'claw', flail: 'lash' }[wt] || 'blunt';
};
const rarityCol = r => ['#f4eee0', '#bff5b0', '#a8d0ff', '#e0b8ff', '#ffd27a'][r || 0];

G.FX.heroAttack = (t, res, delay) => {
  const F = G.FX, st = heroWeaponStyle(), w = G.S.equip.weapon, col = rarityCol(w ? w.rarity : 0);
  const impact = st === 'arcane' ? 360 : 130;
  F.mark('pl', 'move', st === 'arcane' ? 'p-cast' : 'p-lunge', 380, delay);
  F.later(delay + (st === 'arcane' ? 40 : 60), () => {
    if (st === 'arcane') F.proj(F.el('pl'), F.spr(t.uid), 'arcane', 320);
  });
  F.later(delay + impact, () => F.onHit(t, res, st === 'arcane' ? 'arcane' : st, col));
  return impact;
};

// Visuals for a resolved hit on a foe (or the hero when t.isPlayer)
G.FX.onHit = (t, res, style, color, extra) => {
  const F = G.FX, uid = t.isPlayer ? 'pl' : t.uid, sp = F.spr(uid);
  if (!sp) return;
  extra = extra || {};
  if (res.miss) { F.mark(uid, 'move', 'dodge', 360); return; }
  if (style === 'blunt' || style === 'arcane') F.impact(sp, style === 'arcane' ? '#c9a8ff' : color, res.crit);
  if (style !== 'arcane' && style !== 'none') F.strike(sp, style, color, { big: res.crit || extra.big, w: res.crit ? 10 : 7 });
  F.mark(uid, 'tint', res.crit ? 'hit-crit' : 'hit', res.crit ? 420 : 300);
  F.mark(uid, 'move', res.crit ? 'recoil-big' : 'recoil', res.crit ? 460 : 320);
  if (!t.isPlayer) F.burst(sp, extra.burst || TAG_BURST[(t.tags || [])[0]] || 'blood', res.crit ? 20 : 11, res.crit ? 1.4 : 1);
  else F.burst(sp, 'blood', res.crit ? 14 : 7);
  if (res.crit) { F.shake(2); F.flash('#fff', 140, 0.35); }
  else if (extra.shake) F.shake(extra.shake);
};

G.FX.enemyAct = (e, m) => {
  const F = G.FX, fx = G.foeFx(e.id), pl = () => F.el('pl'), me = () => F.spr(e.uid);
  switch (m.t) {
    case 'atk': case 'multi':
      F.mark(e.uid, 'move', 'e-lunge', 420);
      return 190;
    case 'release':
      F.mark(e.uid, 'move', 'e-lunge-big', 560);
      F.later(80, () => F.flash('#b3121f', 260, 0.35));
      return 240;
    case 'mag':
      F.mark(e.uid, 'move', 'e-cast', 520);
      F.mark(e.uid, 'tint', 'glow-' + fx.mag, 520);
      F.later(150, () => fx.mag === 'sonic' ? F.sonic(me(), pl(), 360) : F.proj(me(), pl(), fx.mag, 340, { arc: 20 }));
      return 480;
    case 'dread':
      F.mark(e.uid, 'move', 'e-loom', 800);
      F.later(60, () => { F.flash('radial-gradient(circle, #0000 20%, #5a2a9a 100%)', 700, 0.8); F.stream(me(), pl(), 'void', 10); });
      return 420;
    case 'debuff':
      F.mark(e.uid, 'move', 'e-cast', 520);
      F.later(120, () => F.stream(me(), pl(), 'void', 12));
      return 460;
    case 'buff':
      F.mark(e.uid, 'tint', 'buff-' + m.self.id, 700);
      F.later(40, () => { F.ring(me(), m.self.id === 'rage' ? '#ff5040' : m.self.id === 'evasive' ? '#b98cff' : m.self.id === 'regen' ? '#9cf58a' : '#a8c8ff'); if (m.self.id === 'regen') F.motes(me(), 'heal', 10); });
      return 300;
    case 'heal':
      F.mark(e.uid, 'move', 'e-cast', 520);
      return 200;
    case 'summon':
      F.mark(e.uid, 'move', 'e-cast', 600);
      F.later(80, () => F.sigil(me(), '#b98cff', null, 900, 0.8));
      return 300;
    case 'drain':
      F.mark(e.uid, 'move', 'e-cast', 520);
      F.later(80, () => F.stream(pl(), me(), 'gold', 16));
      return 450;
    case 'charge':
      F.mark(e.uid, 'move', 'e-charge', 700);
      F.later(40, () => { F.ring(me(), '#ff4030', null, 700); F.text(me(), 'CHARGING', '#ff8a7a'); });
      return 300;
  }
  return 200;
};
G.FX.enemyHitStyle = e => G.foeFx(e.id).atk;

G.FX.heroSelf = kind => {
  const F = G.FX, pl = F.el('pl');
  F.mark('pl', 'move', 'p-cast', 520);
  switch (kind) {
    case 'guard': F.mark('pl', 'tint', 'buff-guard', 800); F.ring(pl, '#a8c8ff', 110); F.sigil(pl, '#a8c8ff', 100, 800); break;
    case 'rage': F.mark('pl', 'tint', 'buff-rage', 900); F.burst(pl, 'blood', 14); F.ring(pl, '#ff4030', 110); break;
    case 'shadow': F.mark('pl', 'tint', 'buff-evasive', 900); F.motes(pl, 'void', 14, 40); break;
    case 'ward': F.sigil(pl, '#ff9a3a', 120, 1000); F.motes(pl, 'ember', 12); break;
    case 'heal': F.mark('pl', 'tint', 'heal', 800); F.motes(pl, 'heal', 18); F.ring(pl, '#9cf58a', 100); break;
    case 'litany': F.mark('pl', 'tint', 'holy', 800); F.motes(pl, 'holy', 18); F.sigil(pl, '#ffd45a', 120, 1000); break;
    case 'sanctuary': F.mark('pl', 'tint', 'holy', 900); F.sigil(pl, '#fff2b0', 130, 1100); F.ring(pl, '#ffd45a', 140, 800); F.motes(pl, 'holy', 12); break;
    case 'defend': F.mark('pl', 'tint', 'buff-guard', 600); F.ring(pl, '#a8c8ff', 90, 420); break;
  }
};

// Returns the impact delay (ms) for hit index h on target index ti
G.FX.skillStart = (id, targets) => {
  const F = G.FX, fx = G.D.SKILL_FX[id] || { st: 'blade' };
  let lead = 0;
  if (fx.pre === 'dim') { F.dim(800); lead = 320; }
  if (fx.pre === 'glow') { F.mark('pl', 'tint', 'holy', 700); F.flash('radial-gradient(circle at 50% 80%, #fff1c4 0%, #0000 60%)', 600, 0.7); lead = 300; }
  if (fx.self) { F.heroSelf(fx.self); return { fx, impact: () => 0 }; }
  F.mark('pl', 'move', fx.proj ? 'p-cast' : fx.lunge === 'big' ? 'p-lunge-big' : 'p-lunge', 420, lead);
  if (fx.flash) F.later(lead + 180, () => F.flash(fx.flash, 380, 0.6));
  if (fx.st === 'sweep') F.later(lead + 110, () => F.strike(document.querySelector('.foes'), 'sweep', '#f4eee0', { flip: false, rot: 0, big: true, w: 9 }));
  const base = lead + (fx.proj ? 380 : fx.st === 'beam' || fx.st === 'brand' || fx.st === 'sunflare' ? 260 : fx.st === 'pyre' ? 200 : 140);
  return { fx, impact: (h, ti) => base + h * (fx.gap || 150) + (fx.all ? ti * 70 : 0) };
};
G.FX.skillHit = (id, fx, t, res, at, ti) => {
  const F = G.FX, sp = () => F.spr(t.uid), col = fx.color || '#f4eee0';
  const pre = at - (fx.proj ? 340 : 0);
  if (fx.proj) F.later(pre, () => F.proj(F.el('pl'), sp(), fx.proj, 320, { arc: fx.proj === 'knife' ? -10 + ti * 10 : -30 }));
  F.later(at - 60, () => {
    const s = sp(); if (!s) return;
    if (fx.st === 'beam') F.beam(s, '#ffe9a0', 600);
    if (fx.st === 'brand') F.sigil(s, '#ffd45a', null, 900);
    if (fx.st === 'sunflare') { F.beam(s, '#fff6d8', 800); F.ring(s, '#fff1c4', null, 700); }
    if (fx.st === 'pyre') F.flames(s, 9);
  });
  F.later(at, () => {
    const style = fx.proj ? 'none' : { beam: 'none', brand: 'none', sunflare: 'none', pyre: 'none', sweep: 'none' }[fx.st] || fx.st;
    F.onHit(t, res, style, col, { burst: fx.burst, big: fx.st === 'execute' || fx.st === 'heavy', shake: fx.shake });
    if (fx.proj === 'fire' || fx.proj === 'frost' || fx.proj === 'void') F.impact(sp(), fx.proj === 'fire' ? '#ffb347' : fx.proj === 'frost' ? '#bff0ff' : '#b98cff', true);
    if (fx.after === 'siphon' && !res.miss) F.later(120, () => F.stream(sp(), F.el('pl'), 'blood', 12));
  });
};

G.FX.statusFx = (uid, id, at) => {
  const F = G.FX;
  F.later(at || 0, () => {
    const s = F.spr(uid); if (!s) return;
    const k = { bleed: 'blood', poison: 'poison', burn: 'ember', stun: 'spark', weak: 'dust', vuln: 'void' }[id];
    if (k) F.burst(s, k, 8, 0.7);
    if (id === 'stun') F.text(s, 'STUNNED', '#ffe28a');
  });
};

G.FX.death = (e, at) => {
  const F = G.FX, fx = G.foeFx(e.id), style = e.rank === 'boss' ? 'boss' : fx.death, dur = DEATH_MS[style] || 900;
  F.mark(e.uid, 'move', 'd-' + style, dur, at);
  F.later(at + 60, () => {
    const s = F.spr(e.uid); if (!s) return;
    const k = { crumble: 'bone', collapse: 'blood', shatter: 'shard', dissipate: 'void', scatter: 'feather', fall: 'dust', boss: 'spark' }[style];
    F.burst(s, k, style === 'boss' ? 30 : 16, 1.3);
    if (style === 'boss') {
      F.shake(3); F.flash('#fff', 500, 0.6);
      F.later(500, () => { F.ring(s, '#fff1c4', 260, 900); F.burst(s, 'gold', 30, 2); F.shake(2); });
      F.later(1100, () => { F.flash('#fff6d8', 700, 0.7); F.burst(s, 'spark', 40, 2.4); });
    } else if (style === 'dissipate') F.motes(s, 'void', 14, 80);
    else if (style === 'crumble') F.later(250, () => F.burst(s, 'dust', 14, 1));
  });
  return dur;
};

G.FX.spawn = (e, at, portal) => {
  const F = G.FX;
  F.mark(e.uid, 'move', 'spawn', 700, at);
  if (portal) F.later(at + 20, () => { const s = F.spr(e.uid); if (s) { F.sigil(s, '#b98cff', null, 900, 0.85); F.motes(s, 'void', 12); } });
};

G.FX.phase2 = e => {
  const F = G.FX;
  F.mark(e.uid, 'move', 'phase', 1000, 150);
  F.later(150, () => {
    const s = F.spr(e.uid);
    F.flash('#b3121f', 700, 0.6); F.shake(3);
    if (s) { F.ring(s, G.foeFx(e.id).aura || '#ff4030', 300, 900); F.burst(s, 'ember', 26, 2); }
  });
};
})();
