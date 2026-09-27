/* Front-end screens: splash, cinematic, main menu, load, settings, about, creation, onboarding, tips, level-up, ending */
(() => {
const S = G.Screens, U = G.U;

// ---------------- Splash ----------------
S.splash = {
  render() {
    return `<div class="splash" data-a="splashTap">
      <div class="logo">
        <img class="logo-mark" src="assets/icons/icon-192.png" alt="">
        <div class="gametitle">Gloamreach</div>
        <div class="gamesub">Chronicle of the Last Lantern</div>
        <div class="tap-hint">TAP TO BEGIN</div>
      </div>
      <div class="studio">Hollow Lantern Games</div>
    </div>`;
  },
};
G.A.splashTap = () => {
  G.Audio.init();
  G.Audio.sfx('bell');
  if (!G.settings.introSeen) S.playIntro(() => { G.settings.introSeen = true; G.Engine.saveSettings(); G.UI.go('menu'); });
  else G.UI.go('menu');
};

// ---------------- Cinematic ----------------
// S.cine, cineTap, cineSkip, playIntro and playEnding are implemented in js/cine.js (loaded after this file).

// ---------------- Main menu ----------------
S.menu = {
  render() {
    const last = G.settings.lastSlot && G.Engine.slots().find(s => s.slot === G.settings.lastSlot && !s.empty);
    const embers = Array.from({ length: 18 }, () => `<i style="left:${U.rand(0, 100)}%;animation-duration:${U.rand(7, 15)}s;animation-delay:${U.rand(0, 10)}s"></i>`).join('');
    return `<div class="keyart" style="background-image:url(assets/img/keyart.jpg)"></div>
    <div class="embers">${embers}</div>
    <div class="menu">
      <div class="titleblock">
        <div class="gametitle" style="font-size:2.6em">Gloamreach</div>
        <div class="gamesub">Chronicle of the Last Lantern</div>
      </div>
      <div class="btn-col">
        ${last ? `<button class="btn primary" data-a="continueGame">${G.icon('play')} Continue<span class="sub">&nbsp;· ${U.esc(last.name)}, Lv ${last.level}</span></button>` : ''}
        <button class="btn ${last ? '' : 'primary'}" data-a="newGame">${G.icon('plus')} New Game</button>
        <button class="btn" data-a="loadGame">${G.icon('folder')} Load Game</button>
        <div class="btn-grid">
          <button class="btn" data-a="openSettings">${G.icon('gear')} Settings</button>
          <button class="btn" data-a="openAbout">${G.icon('info')} About</button>
        </div>
      </div>
      <div class="menu-foot">
        <button class="iconbtn" data-a="share" title="Share">${G.icon('share')}</button>
        <button class="iconbtn" data-a="rate" title="Rate">${G.icon('star')}</button>
        <button class="iconbtn" data-a="watchIntro" title="Intro">${G.icon('moon')}</button>
      </div>
      <div class="center tiny dim mt">v${G.VERSION} · Offline · Saves locally</div>
    </div>`;
  },
  after() { G.Audio.ambient('menu'); },
};
G.A.continueGame = () => { if (G.Engine.load(G.settings.lastSlot)) S.enterGame(); else G.UI.toast('Save not found', 'bad'); };
G.A.watchIntro = () => S.playIntro(() => G.UI.go('menu'));
G.A.newGame = () => {
  const slots = G.Engine.slots(), free = slots.find(s => s.empty);
  if (free) { G.UI.go('create', { slot: free.slot }); return; }
  G.UI.go('load', { mode: 'new' });
};
G.A.loadGame = () => G.UI.go('load', { mode: 'load' });
S.enterGame = () => {
  G.UI.closeAllModals();
  if (G.S.dungeon) G.UI.go('dungeon'); else G.UI.go('town');
};

// ---------------- Load / slots ----------------
S.load = {
  render(p) {
    const slots = G.Engine.slots();
    const isNew = p.mode === 'new';
    return `<div class="topbar"><div class="row"><button class="iconbtn" data-a="toMenu">${G.icon('back')}</button><h2>${isNew ? 'Choose a Slot' : 'Load Game'}</h2></div></div>
    <div class="scroll grow pad">
      ${isNew ? '<p class="muted small">All slots are in use. Choose a slot to overwrite.</p>' : ''}
      ${slots.map(s => s.empty ? `<div class="card ${isNew ? 'tap' : ''}" ${isNew ? `data-a="slotNew" data-s="${s.slot}"` : ''}><div class="loc"><div class="glyph">${G.icon('plus')}</div><div><div class="t">Slot ${s.slot}</div><div class="d">Empty</div></div></div></div>` :
        `<div class="card"><div class="loc">
          ${G.UI.portrait(s.cls, 'sm')}
          <div class="grow"><div class="t">${U.esc(s.name)} ${s.hardcore ? '<span class="badge">Hardcore</span>' : ''}${s.ended ? '<span class="badge">Completed</span>' : ''}</div>
          <div class="d">Slot ${s.slot} · Lv ${s.level} ${G.D.CLASSES[s.cls].n} · ${U.fmtTime(s.playtime)}</div>
          <div class="d tiny">${s.saved ? new Date(s.saved).toLocaleString() : ''}</div></div></div>
          <div class="btn-grid mt">
            ${isNew ? `<button class="btn small danger" data-a="slotNew" data-s="${s.slot}">Overwrite</button>` : `<button class="btn small primary" data-a="slotLoad" data-s="${s.slot}">Load</button>`}
            <button class="btn small ghost" data-a="slotDel" data-s="${s.slot}">Delete</button>
          </div></div>`).join('')}
    </div>`;
  },
};
G.A.toMenu = () => G.UI.go('menu');
G.A.slotLoad = d => { if (G.Engine.load(+d.s)) S.enterGame(); };
G.A.slotNew = d => {
  const s = G.Engine.slots().find(x => x.slot === +d.s);
  if (s && !s.empty) G.UI.confirm('Overwrite save?', `${U.esc(s.name)} (Lv ${s.level}) will be lost forever.`, 'Overwrite', () => { G.Engine.del(+d.s); G.UI.go('create', { slot: +d.s }); }, true);
  else G.UI.go('create', { slot: +d.s });
};
G.A.slotDel = d => G.UI.confirm('Delete save?', 'This chronicle will be erased forever.', 'Delete', () => { G.Engine.del(+d.s); G.UI.refresh(); }, true);

// ---------------- Settings ----------------
S.settings = {
  render(p) {
    const s = G.settings, inGame = !!(G.S && p.from !== 'menu');
    const tg = (k, on) => `<div class="toggle ${on ? 'on' : ''}" data-a="setToggle" data-k="${k}"></div>`;
    return `<div class="topbar"><div class="row"><button class="iconbtn" data-a="settingsBack">${G.icon('back')}</button><h2>Settings</h2></div></div>
    <div class="scroll grow pad">
      <h3>Audio</h3>
      <div class="setting"><span>Music</span><input type="range" min="0" max="1" step="0.05" value="${s.music}" data-set="music"></div>
      <div class="setting"><span>Sound Effects</span><input type="range" min="0" max="1" step="0.05" value="${s.sfx}" data-set="sfx"></div>
      <div class="setting"><span>Narration</span><input type="range" min="0" max="1" step="0.05" value="${s.voice != null ? s.voice : 1}" data-set="voice"></div>
      <h3>Gameplay</h3>
      <div class="setting"><span>Vibration</span>${tg('vibrate', s.vibrate)}</div>
      <div class="setting"><div><div>Tutorial Tips</div><div class="tiny muted">Show guidance the first time you see something new</div></div>${tg('tips', s.tips)}</div>
      <div class="setting"><div><div>Fast Combat</div><div class="tiny muted">Shorter pauses between enemy turns</div></div>${tg('fastCombat', s.fastCombat)}</div>
      <div class="setting"><div><div>Screen Shake & Flashes</div><div class="tiny muted">Impact camera effects in combat</div></div>${tg('shake', s.shake !== false)}</div>
      <div class="setting"><span>Text Size</span><div class="seg">${['s', 'm', 'l'].map(z => `<button class="${s.textSize === z ? 'on' : ''}" data-a="setSize" data-z="${z}">${{ s: 'Small', m: 'Medium', l: 'Large' }[z]}</button>`).join('')}</div></div>
      <div class="setting"><span>Language</span><div class="seg"><button class="on">English</button></div></div>
      <h3>Data</h3>
      <div class="btn-col">
        ${inGame ? `<button class="btn" data-a="exportSave">${G.icon('share')} Export current save</button>` : ''}
        <button class="btn" data-a="importSave">${G.icon('folder')} Import a save</button>
        <button class="btn" data-a="resetTips">${G.icon('info')} Show all tutorial tips again</button>
        <button class="btn danger" data-a="wipeAll">Erase ALL data</button>
      </div>
      <p class="tiny dim center mt">Your progress is saved automatically on this device. No account or internet connection is required.</p>
    </div>`;
  },
  after() {
    document.querySelectorAll('[data-set]').forEach(el => el.addEventListener('input', () => {
      G.settings[el.dataset.set] = parseFloat(el.value); G.Engine.saveSettings();
    }));
    document.querySelectorAll('[data-set]').forEach(el => el.addEventListener('change', () => G.Audio.sfx('click')));
  },
};
G.A.openSettings = () => G.UI.go('settings', { from: G.UI.cur ? G.UI.cur.name : 'menu' });
G.A.settingsBack = () => {
  const from = G.UI.cur.params.from;
  if (!from || from === 'menu' || !G.S) G.UI.go('menu'); else S.enterGame();
};
G.A.setToggle = d => { G.settings[d.k] = !G.settings[d.k]; G.Engine.saveSettings(); if (d.k === 'vibrate' && G.settings.vibrate) U.vibrate(40); G.UI.refresh(); };
G.A.setSize = d => { G.settings.textSize = d.z; G.Engine.saveSettings(); G.UI.refresh(); };
G.A.resetTips = () => { if (G.S) { G.S.tips = {}; G.Engine.save(); } G.settings.tips = true; G.Engine.saveSettings(); G.UI.toast('Tutorial tips will be shown again.'); G.UI.refresh(); };
G.A.exportSave = () => {
  const code = G.Engine.exportSave();
  G.UI.modal(`<h2>Export Save</h2><div class="body"><p class="muted small">Copy this code and keep it somewhere safe. You can import it on any device.</p>
    <textarea class="field" style="height:140px;font-size:11px;font-family:monospace" readonly>${code}</textarea></div>
    <div class="foot btn-grid"><button class="btn ghost" data-a="closeModal">Close</button><button class="btn primary" data-a="copyExport">Copy</button></div>`, { center: true });
};
G.A.copyExport = () => {
  const ta = document.querySelector('.sheet textarea');
  ta.select();
  (navigator.clipboard ? navigator.clipboard.writeText(ta.value) : Promise.reject()).then(() => G.UI.toast('Copied!', 'good')).catch(() => { document.execCommand('copy'); G.UI.toast('Copied!', 'good'); });
};
G.A.importSave = () => {
  G.UI.modal(`<h2>Import Save</h2><div class="body"><p class="muted small">Paste a save code. It will be stored in the slot you choose.</p>
    <textarea class="field" id="impcode" style="height:120px;font-size:11px;font-family:monospace"></textarea>
    <div class="seg mt" id="impslot">${[1, 2, 3].map(i => `<button class="${i === 1 ? 'on' : ''}" onclick="document.querySelectorAll('#impslot button').forEach(b=>b.classList.remove('on'));this.classList.add('on')" data-slot="${i}">Slot ${i}</button>`).join('')}</div></div>
    <div class="foot btn-grid"><button class="btn ghost" data-a="closeModal">Cancel</button><button class="btn primary" data-a="doImport">Import</button></div>`, { center: true });
};
G.A.doImport = () => {
  const code = document.getElementById('impcode').value;
  const slot = +document.querySelector('#impslot button.on').dataset.slot;
  try { G.Engine.importSave(code, slot); G.UI.closeModal(); G.UI.toast('Save imported into slot ' + slot, 'good'); }
  catch (e) { G.UI.toast('Invalid save code.', 'bad'); }
};
G.A.wipeAll = () => G.UI.confirm('Erase everything?', 'All save slots and settings will be permanently deleted.', 'Erase', () => {
  Object.keys(localStorage).filter(k => k.startsWith('gloamreach')).forEach(k => localStorage.removeItem(k));
  G.S = null; G.UI.go('menu'); G.UI.toast('All data erased.');
}, true);

// ---------------- About / share / rate ----------------
S.about = {
  render() {
    return `<div class="topbar"><div class="row"><button class="iconbtn" data-a="aboutBack">${G.icon('back')}</button><h2>About</h2></div></div>
    <div class="scroll grow pad center">
      <img class="logo-mark" src="assets/icons/icon-192.png" style="width:96px;height:96px" alt="">
      <div class="gametitle" style="font-size:1.8em">Gloamreach</div>
      <div class="gamesub">Chronicle of the Last Lantern</div>
      <p class="muted small">Version ${G.VERSION}</p>
      <div class="card" style="text-align:left">
        <p style="margin-top:0">A dark fantasy, text-driven dungeon crawler. Carry the last flame of Candlemere into the Gloam, make hard choices, and face the one who broke the dawn.</p>
        <div class="kv"><span>Design & Code</span><span>Hollow Lantern Games</span></div>
        <div class="kv"><span>Art</span><span>Original illustrations</span></div>
        <div class="kv"><span>Music & Sound</span><span>Procedural synthesis</span></div>
        <div class="kv"><span>Platform</span><span>Offline, portrait, one-handed</span></div>
        <p class="small muted">Inspired by the classic genre of text-driven mobile dungeon crawlers. The world, story, characters, names, art and interface of Gloamreach are all original.</p>
        <p class="small muted" style="margin-bottom:0">Privacy: Gloamreach works fully offline. It collects no personal data. Saves are stored only on your device.</p>
      </div>
      <div class="btn-grid mt"><button class="btn" data-a="share">${G.icon('share')} Share</button><button class="btn primary" data-a="rate">${G.icon('star')} Rate</button></div>
      <p class="tiny dim mt">"I will be the lantern when there is no light."</p>
    </div>`;
  },
};
G.A.openAbout = () => G.UI.go('about', { from: G.UI.cur ? G.UI.cur.name : 'menu' });
G.A.aboutBack = () => { if (G.UI.cur.params.from === 'menu' || !G.S) G.UI.go('menu'); else S.enterGame(); };
G.A.share = () => {
  const url = 'https://play.google.com/store/apps/details?id=' + G.PKG;
  const data = { title: 'Gloamreach', text: 'I\'m carrying the last lantern into the Gloam. Can you survive the dark? Play Gloamreach, a dark fantasy dungeon crawler.', url };
  if (navigator.share) navigator.share(data).catch(() => {});
  else {
    const t = data.text + ' ' + url;
    (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => G.UI.toast('Share link copied to clipboard!', 'good')).catch(() => G.UI.alert('Share', `<p class="small">${t}</p>`));
  }
};
G.A.rate = () => {
  G.UI.modal(`<div class="center"><div class="gold" style="font-size:2em">${G.icon('star', 'xl')}</div><h2>Enjoying Gloamreach?</h2>
    <p class="muted">A rating on the Play Store helps the last lantern reach more Lanternbearers.</p></div>
    <div class="foot btn-grid"><button class="btn ghost" data-a="closeModal">Later</button><button class="btn primary" data-a="openStore">Rate now</button></div>`, { center: true });
};
G.A.openStore = () => {
  G.UI.closeModal();
  const web = 'https://play.google.com/store/apps/details?id=' + G.PKG;
  const isAndroidApp = /Android/i.test(navigator.userAgent) && (window.Capacitor || window.cordova);
  window.open(isAndroidApp ? 'market://details?id=' + G.PKG : web, '_blank');
};

// ---------------- Character creation ----------------
S.create = {
  st: null,
  render(p) {
    if (!this.st || this.st.slot !== p.slot) this.st = { slot: p.slot, name: '', cls: 'sellsword', bg: 'wickborn', hardcore: false };
    const st = this.st, C = G.D.CLASSES[st.cls], B = G.D.BACKGROUNDS[st.bg];
    const attrs = Object.assign({}, C.attrs); for (const k in B.attrs) attrs[k] += B.attrs[k];
    return `<div class="topbar"><div class="row"><button class="iconbtn" data-a="toMenu">${G.icon('back')}</button><h2>A New Lanternbearer</h2></div></div>
    <div class="scroll grow pad">
      <h3>Name</h3>
      <input class="field" id="cname" maxlength="16" placeholder="Enter a name" value="${U.esc(st.name)}" autocomplete="off">
      <div class="row mt"><button class="btn small ghost" data-a="randName">Random name</button></div>
      <h3>Origin</h3>
      <div class="opt-grid" style="grid-template-columns:repeat(3,1fr)">${Object.keys(G.D.CLASSES).map(k => { const c = G.D.CLASSES[k]; return `<div class="opt clscard ${st.cls === k ? 'on' : ''}" data-a="pickCls" data-k="${k}">
        ${G.UI.portrait(k)}<div class="t" style="color:${st.cls === k ? c.color : ''}">${c.n}</div></div>`; }).join('')}</div>
      <div class="card mt"><div class="small">${C.desc}</div><div class="tiny muted mt">${C.style}</div>
        <div class="row wrap mt" style="gap:6px">${Object.keys(attrs).map(k => `<span class="chip">${G.D.ATTRS[k].n} <b>${attrs[k]}</b></span>`).join('')}</div>
        <div class="tiny muted mt">Starting skill: <span class="gold">${G.D.SKILLS[C.skills[0]].n}</span>, ${G.D.SKILLS[C.skills[0]].desc(1)}</div>
      </div>
      <h3>Background</h3>
      <div class="opt-grid">${Object.keys(G.D.BACKGROUNDS).map(k => { const b = G.D.BACKGROUNDS[k]; return `<div class="opt ${st.bg === k ? 'on' : ''}" data-a="pickBg" data-k="${k}"><div class="t">${b.n}</div></div>`; }).join('')}</div>
      <div class="card mt small">${B.desc}</div>
      <h3>Challenge</h3>
      <div class="setting"><div><div>Hardcore (Permadeath)</div><div class="tiny muted">Death erases this save. For veterans of the dark.</div></div><div class="toggle ${st.hardcore ? 'on' : ''}" data-a="toggleHc"></div></div>
      <div style="height:80px"></div>
    </div>
    <div class="pad" style="padding-bottom:calc(var(--safe-bot) + 14px);border-top:1px solid var(--line);background:#0d0b12">
      <button class="btn primary block" data-a="beginGame">${G.icon('lantern')} Light the Lantern</button>
    </div>`;
  },
  after() {
    const i = document.getElementById('cname');
    i.addEventListener('input', () => { this.st.name = i.value; });
  },
};
const NAMES = ['Aldis', 'Brennoch', 'Cassia', 'Dunmore', 'Edda', 'Fenwick', 'Galen', 'Hesper', 'Isolde', 'Jorvik', 'Kestrel', 'Lysander', 'Maren', 'Nyx', 'Orrin', 'Perrin', 'Quill', 'Rowan', 'Sabine', 'Tamsin', 'Ulric', 'Vesna', 'Wystan', 'Yara', 'Corvin', 'Elowen', 'Thane', 'Mireille'];
G.A.randName = () => { S.create.st.name = U.pick(NAMES); G.UI.refresh(); };
G.A.pickCls = d => { S.create.st.cls = d.k; G.UI.refresh(); };
G.A.pickBg = d => { S.create.st.bg = d.k; G.UI.refresh(); };
G.A.toggleHc = () => { S.create.st.hardcore = !S.create.st.hardcore; G.UI.refresh(); };
G.A.beginGame = () => {
  const st = S.create.st;
  const name = (st.name || '').trim() || U.pick(NAMES);
  G.Engine.newGame({ slot: st.slot, name: name.slice(0, 16), cls: st.cls, bg: st.bg, hardcore: st.hardcore });
  S.create.st = null;
  G.UI.go('onboard', { i: 0 });
};

// ---------------- Onboarding ----------------
S.onboard = {
  render(p) {
    const i = p.i || 0, o = G.D.ONBOARD[i], last = i === G.D.ONBOARD.length - 1;
    return `<div class="onb">
      <div class="row between"><span class="tiny dim">HOW TO SURVIVE</span><button class="btn small ghost" data-a="onbDone">Skip</button></div>
      <div class="art">${G.icon(o.ic)}</div>
      <h2 class="center">${o.t}</h2>
      <p class="center muted" style="line-height:1.6;min-height:6.5em">${o.d}</p>
      <div class="dots">${G.D.ONBOARD.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
      <div class="btn-grid">
        <button class="btn ghost ${i === 0 ? 'disabled' : ''}" data-a="onbGo" data-i="${i - 1}">Back</button>
        ${last ? '<button class="btn primary" data-a="onbDone">Enter Candlemere</button>' : `<button class="btn primary" data-a="onbGo" data-i="${i + 1}">Next</button>`}
      </div>
    </div>`;
  },
  after() { G.Audio.ambient('menu'); },
};
G.A.onbGo = d => G.UI.go('onboard', { i: +d.i });
G.A.onbDone = () => {
  G.UI.go('town');
  setTimeout(() => G.UI.alert('Welcome to Candlemere', `<p>You wake on the cold pyre-steps beneath the Undying Wick. Your lantern is lit, and you remember only your name: <b>${U.esc(G.S.name)}</b>.</p>
    <p class="muted">A Vigil warden points you toward the <b>Wardens' Hall</b>. "The Keeper wants you. Now."</p>
    <p class="small gold">Tip: You have 1 unspent Skill Point. Open <b>Skills</b> at the bottom when you are ready.</p>`, 'Go'), 400);
};

// ---------------- Tips / level up / game menu ----------------
S.tip = id => {
  if (!G.S || !G.settings.tips || G.S.tips[id]) return;
  const t = G.D.TIPS[id]; if (!t) return;
  G.S.tips[id] = true;
  setTimeout(() => G.UI.modal(`<div class="tip card"><div class="hd">${G.icon('lantern')} <b>${t.t}</b></div><div class="small" style="line-height:1.55">${t.d}</div></div>
    <div class="foot"><button class="btn primary block" data-a="closeModal">Got it</button></div>`, { center: true }), 250);
};
S.checkLevel = () => {
  if (!G.pendingLevel) return;
  const n = G.pendingLevel; G.pendingLevel = 0;
  G.Audio.sfx('levelup');
  G.UI.modal(`<div class="levelup"><div class="gold">${G.icon('star', 'xl')}</div><div class="big">Level ${G.S.level}</div>
    <p class="muted">The Wick's ember burns brighter within you.</p>
    <div class="card"><div class="kv"><span>Attribute Points</span><span class="gold">+${3 * n}</span></div><div class="kv"><span>Skill Points</span><span class="gold">+${n}</span></div><div class="kv"><span>HP & Focus</span><span class="good">Fully restored</span></div></div></div>
    <div class="foot btn-grid"><button class="btn ghost" data-a="closeModal">Later</button><button class="btn primary" data-a="lvlToHero">Spend Points</button></div>`, { center: true });
  S.tip('levelup');
};
G.A.lvlToHero = () => { G.UI.closeAllModals(); G.UI.go('hero'); };
G.A.openGameMenu = () => {
  const inD = !!G.S.dungeon;
  G.UI.modal(`<h2>${G.icon('lantern')} Paused</h2>
    <div class="body mt"><div class="btn-col">
      <button class="btn" data-a="closeModal">${G.icon('play')} Resume</button>
      <button class="btn" data-a="gmCodex">${G.icon('scroll')} Codex & Journal</button>
      <button class="btn" data-a="gmSave">${G.icon('folder')} Save Game</button>
      <button class="btn" data-a="gmSettings">${G.icon('gear')} Settings</button>
      <div class="btn-grid"><button class="btn" data-a="share">${G.icon('share')} Share</button><button class="btn" data-a="rate">${G.icon('star')} Rate</button></div>
      <button class="btn" data-a="gmAbout">${G.icon('info')} About</button>
      <button class="btn danger" data-a="gmQuit">Save & Quit to Menu</button>
    </div>
    <p class="tiny dim center mt">${U.esc(G.S.name)} · Slot ${G.S.slot} · ${U.fmtTime(G.S.playtime)} played${inD ? ' · Your position in the dungeon is saved.' : ''}</p></div>`);
};
G.A.gmCodex = () => { G.UI.closeAllModals(); G.UI.go('journal', { tab: 'codex' }); };
G.A.gmSave = () => { G.Engine.save(); G.UI.closeModal(); G.UI.toast('Game saved.', 'good'); };
G.A.gmSettings = () => { G.UI.closeAllModals(); G.UI.go('settings', { from: 'game' }); };
G.A.gmAbout = () => { G.UI.closeAllModals(); G.UI.go('about', { from: 'game' }); };
G.A.gmQuit = () => { G.Engine.save(); G.UI.go('menu'); };

// ---------------- Ending / game over ----------------
S.playEnding = kind => {
  const E = G.D.ENDINGS[kind];
  if (!E) { G.UI.go('town'); return; }
  // endings beyond the first are tracked in `ended2` so the first ending's flag keeps its old meaning
  if (G.S.flags.ended) G.S.flags.ended2 = kind; else G.S.flags.ended = kind;
  G.Engine.save();
  const slides = E.slides.slice();
  if (kind === 'ring') slides.push({ img: 'keyart', lines: ['...and you wake on the pyre-steps of Candlemere, lantern in hand.', 'Your name is all you remember. Somewhere far below, a new darkness is stirring.'] });
  G.UI.go('cine', { slides, music: 'ending', done: () => G.UI.go('credits', { kind }) });
};
S.credits = {
  render(p) {
    const E = G.D.ENDINGS[p.kind], s = G.S.stats;
    return `<div class="keyart" style="background-image:url(assets/img/keyart.jpg);opacity:.4"></div>
    <div class="menu" style="overflow-y:auto">
      <div class="center"><div class="gamesub">Ending</div><div class="gametitle" style="font-size:1.9em">${E.t}</div></div>
      <div class="card mt">
        <div class="kv"><span>Lanternbearer</span><span>${U.esc(G.S.name)}, Lv ${G.S.level} ${G.D.CLASSES[G.S.cls].n}</span></div>
        <div class="kv"><span>Time in the dark</span><span>${U.fmtTime(G.S.playtime)}</span></div>
        <div class="kv"><span>Foes slain</span><span>${s.kills}</span></div>
        <div class="kv"><span>Expeditions</span><span>${s.expeditions}</span></div>
        <div class="kv"><span>Deaths</span><span>${s.deaths}</span></div>
        <div class="kv"><span>Lore discovered</span><span>${G.S.codex.length} / ${Object.keys(G.D.CODEX).length}</span></div>
      </div>
      <p class="center muted small mt">Thank you for carrying the last lantern.<br>A Hollow Lantern Games production.</p>
      <div class="card tip"><div class="hd">${G.icon('stairs')} <b>The Endless Undercroft is open</b></div><div class="small">Beneath the Cathedral, the dark has no bottom. Your chronicle continues: keep leveling to ${G.Engine.MAX_LEVEL}, hunt bounties, and see how deep you can go.</div></div>
      <div class="btn-col mt"><button class="btn primary" data-a="afterCredits">Continue the Chronicle</button><button class="btn" data-a="share">${G.icon('share')} Share your ending</button></div>
    </div>`;
  },
  after() { G.Audio.ambient('ending'); },
};
G.A.afterCredits = () => G.UI.go('town');
S.gameover = {
  render(p) {
    return `<div class="keyart" style="background-image:url(assets/img/zone1.jpg);opacity:.35;filter:grayscale(1)"></div>
    <div class="menu"><div class="center" style="margin-top:20%"><div class="bad">${G.icon('skull', 'xl')}</div><div class="gametitle" style="font-size:1.8em;color:#e0626a">Your Light Is Gone</div>
      <p class="muted">${U.esc(p.name)} fell in the dark at level ${p.level}. In Hardcore, death is final. Another name will be carved in the Crypt of the Nameless.</p></div>
      <div class="btn-col"><button class="btn primary" data-a="toMenu">Return to Menu</button></div></div>`;
  },
  after() { G.Audio.ambient('menu'); },
};
})();
