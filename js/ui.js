/* Screen manager, modals, toasts, and the global tap-action dispatcher */
G.Screens = {};
G.UI = {
  cur: null,
  go(name, params) {
    const scr = G.Screens[name];
    if (!scr) { console.error('No screen', name); return; }
    if (this.cur && G.Screens[this.cur.name] && G.Screens[this.cur.name].leave) G.Screens[this.cur.name].leave();
    this.cur = { name, params: params || {} };
    this.closeAllModals();
    document.getElementById('screen').innerHTML = scr.render(this.cur.params);
    const sc = document.querySelector('#screen .scroll');
    if (sc) sc.scrollTop = 0;
    if (scr.after) scr.after(this.cur.params);
    G.Monetization?.sync();
  },
  refresh() {
    if (!this.cur) return;
    const scr = G.Screens[this.cur.name];
    if (scr.morph) {
      // Patch in place so animated sprites keep their <img> nodes (re-creating them makes art blink)
      this.morph(document.getElementById('screen'), scr.render(this.cur.params));
      if (scr.after) scr.after(this.cur.params, true);
      G.Monetization?.sync();
      return;
    }
    const scs = [...document.querySelectorAll('#screen .scroll')].map(e => e.scrollTop);
    document.getElementById('screen').innerHTML = scr.render(this.cur.params);
    document.querySelectorAll('#screen .scroll').forEach((e, i) => { if (scs[i] != null) e.scrollTop = scs[i]; });
    if (scr.after) scr.after(this.cur.params, true);
    G.Monetization?.sync();
  },
  is(name) { return this.cur && this.cur.name === name; },

  morph(root, html) {
    const tpl = document.createElement('div');
    tpl.innerHTML = html;
    const same = (a, b) => a.nodeType === b.nodeType && (a.nodeType !== 1 || (a.tagName === b.tagName && (a.id || '') === (b.id || '')));
    // Templates re-emit animation phase offsets on every render; re-applying them to a node whose
    // animation is already running would shift its timeline, so ignore those when the class is unchanged.
    const timing = s => (s || '').replace(/(animation-delay|--ph)\s*:[^;]*;?/g, '').trim();
    const patch = (a, b) => {
      if (a.nodeType !== 1) { if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue; return; }
      const sameCls = a.getAttribute('class') === b.getAttribute('class');
      for (const at of b.attributes) {
        const v = a.getAttribute(at.name);
        if (v === at.value) continue;
        if (at.name === 'style' && sameCls && timing(v) === timing(at.value)) continue;
        a.setAttribute(at.name, at.value);
      }
      for (let i = a.attributes.length - 1; i >= 0; i--) { const n = a.attributes[i].name; if (!b.hasAttribute(n)) a.removeAttribute(n); }
      if (a.tagName === 'BUTTON' || a.tagName === 'INPUT') a.disabled = b.disabled;
      kids(a, b);
    };
    const kids = (a, b) => {
      const bc = [...b.childNodes];
      bc.forEach((t, i) => {
        let cur = a.childNodes[i];
        if (t.nodeType === 1 && t.id) {
          const m = [...a.children].find(c => c.id === t.id);
          if (m && m !== cur) { a.insertBefore(m, cur || null); cur = m; }
        }
        if (cur && same(cur, t)) patch(cur, t);
        else a.insertBefore(t, cur || null);
      });
      while (a.childNodes.length > bc.length) a.removeChild(a.lastChild);
    };
    kids(root, tpl);
  },

  modal(html, opts) {
    opts = opts || {};
    const root = document.getElementById('modal-root');
    const bg = document.createElement('div');
    bg.className = 'modal-bg' + (opts.center ? ' centered' : '');
    bg.innerHTML = `<div class="sheet ${opts.cls || ''}">${opts.center ? '' : '<div class="grab"></div>'}${html}</div>`;
    if (!opts.locked) bg.addEventListener('click', e => { if (e.target === bg) this.closeModal(); });
    bg._onclose = opts.onClose;
    root.appendChild(bg);
    return bg;
  },
  updateModal(html) {
    const root = document.getElementById('modal-root');
    const top = root.lastElementChild;
    if (!top) return;
    const sheet = top.querySelector('.sheet');
    const body = sheet.querySelector('.body');
    const st = body ? body.scrollTop : 0;
    const grab = sheet.querySelector('.grab') ? '<div class="grab"></div>' : '';
    sheet.innerHTML = grab + html;
    const nb = sheet.querySelector('.body'); if (nb) nb.scrollTop = st;
  },
  closeModal() {
    const root = document.getElementById('modal-root');
    const top = root.lastElementChild;
    if (top) { const cb = top._onclose; top.remove(); if (cb) cb(); }
  },
  closeAllModals() { document.getElementById('modal-root').innerHTML = ''; },
  hasModal() { return !!document.getElementById('modal-root').lastElementChild; },

  toast(msg, type) {
    const root = document.getElementById('toast-root');
    const t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    t.innerHTML = msg;
    root.appendChild(t);
    while (root.children.length > 4) root.firstChild.remove();
    setTimeout(() => t.remove(), 2700);
  },

  confirm(title, text, yesLabel, onYes, danger) {
    G._confirmYes = onYes;
    this.modal(`<h2>${title}</h2><div class="body"><p class="muted">${text}</p></div>
      <div class="foot btn-grid"><button class="btn ghost" data-a="closeModal">Cancel</button>
      <button class="btn ${danger ? 'danger' : 'primary'}" data-a="confirmYes">${yesLabel}</button></div>`, { center: true });
  },

  alert(title, html, btn) {
    this.modal(`<h2>${title}</h2><div class="body mt">${html}</div><div class="foot"><button class="btn primary block" data-a="closeModal">${btn || 'Continue'}</button></div>`, { center: true });
  },

  bar(cls, v, m, label) {
    return `<div class="bar ${cls}"><i style="width:${G.U.pct(v, m)}%"></i><span>${label != null ? label : Math.ceil(v) + ' / ' + Math.ceil(m)}</span></div>`;
  },

  hud(opts) {
    const p = G.S, st = G.Engine.stats();
    opts = opts || {};
    const dun = !!p.dungeon;
    return `<div class="topbar">
      <div class="row between">
        <div class="row"><span class="name">${G.U.esc(p.name)}</span><span class="chip">Lv ${p.level} ${G.D.CLASSES[p.cls].n}</span></div>
        <div class="row"><span class="chip gold">${G.icon('coin')} ${p.gold}</span>${opts.menu !== false ? `<button class="iconbtn" style="width:36px;height:36px" data-a="openGameMenu">${G.icon('gear')}</button>` : ''}</div>
      </div>
      <div class="hud">
        ${this.bar('hp', p.hp, st.maxHp, 'HP ' + Math.ceil(p.hp) + '/' + st.maxHp)}
        ${this.bar('fo', p.focus, st.maxFocus, 'Focus ' + Math.floor(p.focus) + '/' + st.maxFocus)}
        ${this.bar('dr', p.dread, 100, 'Dread ' + Math.floor(p.dread) + (G.Engine.dreadTier().n ? ' · ' + G.Engine.dreadTier().n : ''))}
        ${dun ? this.bar('li', p.light, st.lightMax, 'Light ' + Math.floor(p.light) + '/' + st.lightMax) : this.bar('xp', p.xp, G.Engine.xpNeed(p.level), 'XP ' + p.xp + '/' + G.Engine.xpNeed(p.level))}
      </div>
    </div>`;
  },

  floatText(el, text, color) {
    if (!el) return;
    const r = el.getBoundingClientRect(), app = document.getElementById('app').getBoundingClientRect();
    const f = document.createElement('div');
    f.className = 'float';
    f.style.left = (r.left - app.left + r.width / 2 - 20 + G.U.rand(-12, 12)) + 'px';
    f.style.top = (r.top - app.top + r.height / 3) + 'px';
    f.style.color = color || '#fff';
    f.textContent = text;
    document.getElementById('app').appendChild(f);
    setTimeout(() => f.remove(), 1000);
  },
};

G.A.closeModal = () => G.UI.closeModal();
G.A.confirmYes = () => { G.UI.closeModal(); if (G._confirmYes) G._confirmYes(); };

document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]');
  if (!el) return;
  const fn = G.A[el.dataset.a];
  if (!fn) { console.warn('No action', el.dataset.a); return; }
  if (!el.dataset.silent) G.Audio.sfx('click');
  try { fn(el.dataset, el, e); } catch (err) { console.error(err); G.UI.toast('Error: ' + err.message, 'bad'); }
});
