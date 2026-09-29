/* Gloamreach - utilities and shared namespace */
window.G = window.G || {};
G.VERSION = '3.0.0';
G.PKG = 'com.hollowlantern.gloamreach';
G.D = {};
G.A = {};

G.U = {
  rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; },
  randf(a, b) { return Math.random() * (b - a) + a; },
  chance(p) { return Math.random() * 100 < p; },
  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  clamp(v, a, b) { return Math.max(a, Math.min(b, v)); },
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  },
  weighted(list, wf) {
    const ws = list.map(wf || (x => x.w || 1));
    let t = ws.reduce((s, w) => s + w, 0), r = Math.random() * t;
    for (let i = 0; i < list.length; i++) { r -= ws[i]; if (r <= 0) return list[i]; }
    return list[list.length - 1];
  },
  uid() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4); },
  esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); },
  cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; },
  pct(v, m) { return m > 0 ? G.U.clamp(v / m * 100, 0, 100) : 0; },
  deep(o) { return JSON.parse(JSON.stringify(o)); },
  fmtTime(sec) {
    sec = Math.floor(sec || 0);
    const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60);
    return h ? `${h}h ${m}m` : `${m}m`;
  },
  vibrate(ms) { try { if (G.settings && G.settings.vibrate && navigator.vibrate) navigator.vibrate(ms); } catch (e) {} },
  wait(ms) { return new Promise(r => setTimeout(r, ms)); },
};

/* Stroke-based SVG icon set (24x24) */
G.ICONS = {
  sword: 'M14.5 3.5L20 3l-.5 5.5L9 19l-4-4zM4 20l3-3M5.5 14.5l4 4',
  axe: 'M14 4c4 0 6 3 6 6l-6-1zM14 4L4 20M14 9l-2-1',
  dagger: 'M15 3l6 0 0 6-10 10-6-6zM3 21l3-3M8 13l3 3',
  mace: 'M15 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10zM11 11L3 21M15 1v2M21 8h2M19.5 3.5l1.5-1.5',
  staff: 'M6 21L17 7M17 7a3 3 0 1 1 3-4 3 3 0 0 1-3 4zM15 4l-1-2M21 8l2 1',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
  tome: 'M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2zM5 18a2 2 0 0 1 2-2h11M9 8h5',
  censer: 'M12 2v4M8 10h8l-1 6H9zM7 10a5 3 0 0 1 10 0M10 16l-1 5h6l-1-5M6 6c0 1 1 1 1 2M17 6c0 1 1 1 1 2',
  helm: 'M5 14a7 7 0 0 1 14 0v6h-4v-5H9v5H5zM12 7v5',
  chest: 'M8 3l-5 3 2 5 2-1v11h10V10l2 1 2-5-5-3-2 2h-4z',
  gloves: 'M7 21v-8L5 9a1.2 1.2 0 0 1 2-1.2L9 10V5a1 1 0 0 1 2 0v5-6a1 1 0 0 1 2 0v6-5a1 1 0 0 1 2 0v5-3a1 1 0 0 1 2 0v8a6 6 0 0 1-2 4v3z',
  boots: 'M7 3h6v10l6 3v5H5v-4l2-2zM5 18h14',
  amulet: 'M6 3c0 5 3 8 6 9 3-1 6-4 6-9M12 12a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  ring: 'M12 9a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM9 4h6l-3 5z',
  lantern: 'M9 3h6M12 3v2M7 7h10l-1 11H8zM7 7l1-2h8l1 2M9 21h6M8 18l1 3M16 18l-1 3M12 10c.9 1.2 1.7 1.9 1.7 3a1.7 1.7 0 0 1-3.4 0c0-1.1.8-1.8 1.7-3z',
  skull: 'M12 3a8 8 0 0 0-8 8c0 3 1.5 4.5 3 5.5V20h10v-3.5c1.5-1 3-2.5 3-5.5a8 8 0 0 0-8-8zM9 10.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM15 10.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM10 20v-2M14 20v-2',
  treasure: 'M3 10h18v10H3zM3 10a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4M11 12h2v3h-2zM3 14h8M13 14h8',
  stairs: 'M3 20h5v-4h4v-4h4V8h5',
  entrance: 'M5 21V10a7 7 0 0 1 14 0v11M9 21v-6h6v6',
  question: 'M9 9a3 3 0 1 1 4 2.8c-.7.3-1 1-1 1.7V15M12 18.5v.2',
  flame: 'M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-6 1 1 2 2 3 1-1-2 0-4 0-5z',
  trap: 'M3 20l3-9 3 9 3-9 3 9 3-9 3 9zM2 20h20',
  crown: 'M3 18h18l-2-10-4 4-3-7-3 7-4-4zM3 21h18',
  horns: 'M12 21a6 6 0 0 1-6-6c0-3 2-5 6-5s6 2 6 5a6 6 0 0 1-6 6zM6 12C3 10 3 6 4 3c1 3 3 5 5 6M18 12c3-2 3-6 2-9-1 3-3 5-5 6M9.5 15h.1M14.5 15h.1',
  coinbag: 'M9 7h6l-1.5-3h-3zM6 12c0-3 3-5 6-5s6 2 6 5v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4zM12 11v7M10 13.5h3.5a1 1 0 0 1 0 2h-3',
  camp: 'M3 20L12 4l9 16zM9 20l3-6 3 6',
  bag: 'M6 8h12l1 13H5zM9 8V6a3 3 0 0 1 6 0v2',
  hero: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  journal: 'M5 3h12a2 2 0 0 1 2 2v16H7a2 2 0 0 1-2-2zM9 8h6M9 12h6M5 19a2 2 0 0 1 2-2h12',
  star: 'M12 2.5l2.9 6.2 6.6.8-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.3 1.3-6.6L2.5 9.5l6.6-.8z',
  rune: 'M12 2l8 5v10l-8 5-8-5V7zM12 7v10M8 10l4 3 4-3',
  town: 'M3 11l9-8 9 8M5 9v12h14V9M10 21v-6h4v6',
  gear: 'M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1',
  potion: 'M9 3h6M10 3v5L5 17a3 3 0 0 0 2.6 4.5h8.8A3 3 0 0 0 19 17l-5-9V3M7 15h10',
  heart: 'M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3c0 6-8 11-8 11z',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
  coin: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v10M14.5 9.5h-4a1.5 1.5 0 0 0 0 3h3a1.5 1.5 0 0 1 0 3h-4',
  flee: 'M5 12h13M13 6l6 6-6 6',
  back: 'M15 5l-7 7 7 7',
  close: 'M6 6l12 12M18 6L6 18',
  map: 'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15',
  anvil: 'M4 8h13a3 3 0 0 1-3 3h-2v3h3v3H7v-3h3v-3H6a2 2 0 0 1-2-2zM17 8h4',
  chapel: 'M12 2v6M9.5 4.5h5M5 21V12l7-4 7 4v9M10 21v-5a2 2 0 0 1 4 0v5',
  mug: 'M5 8h11v10a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3zM16 11h2a2 2 0 0 1 0 4h-2M8 4c0 1 1 1 1 2M12 4c0 1 1 1 1 2',
  gate: 'M3 21V9l9-6 9 6v12M7 21v-8a5 5 0 0 1 10 0v8M12 8v13',
  mortar: 'M4 11h16a8 8 0 0 1-16 0zM8 21h8M14 11l5-8',
  share: 'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v6M12 7.5v.2',
  play: 'M7 4l13 8-13 8z',
  folder: 'M3 6h6l2 2h10v11H3z',
  plus: 'M12 5v14M5 12h14',
  dot: 'M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4z',
  swords: 'M4 4l10 10M4 4h3l10 10M4 4v3l10 10M20 4L10 14M20 4h-3M20 4v3M14 14l3 3M10 14l-3 3M17 17l2 2M7 17l-2 2',
  scroll: 'M7 3h11a2 2 0 0 1 2 2v2h-4M7 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7M7 3a2 2 0 0 1 2 2v2M9 11h6M9 15h6',
  hammer: 'M14 4l6 6-3 3-6-6zM11 7L3 15l3 3 8-8',
  sparkle: 'M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3',
  moon: 'M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4M12 3v2M13 9l-2 4 2 1-1 3',
  wisp: 'M12 21c-4 0-6-3-6-6 0-4 4-5 4-9 2 2 3 4 3 6 1-1 1-2 1-3 2 2 4 4 4 6 0 3-2 6-6 6z',
  leaf: 'M5 19C5 10 10 5 20 4c-1 10-6 15-15 15zM5 19l8-8',
  drop: 'M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z',
  mirror: 'M12 2a6 7 0 1 0 0 14 6 7 0 0 0 0-14zM12 16v6M8 22h8',
  cage: 'M6 21V9a6 6 0 0 1 12 0v12M4 21h16M10 21V5M14 21V5M6 13h12',
};
G.icon = function (name, cls) {
  const d = G.ICONS[name] || G.ICONS.dot;
  return `<svg class="ic ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
};
