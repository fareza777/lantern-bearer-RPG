/* Bootstrap */
(() => {
  G.Engine.loadSettings();

  // Play-time tracking and periodic autosave
  setInterval(() => {
    if (G.S && !document.hidden) G.S.playtime = (G.S.playtime || 0) + 5;
  }, 5000);
  setInterval(() => { if (G.S) G.Engine.save(); }, 60000);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (G.S) G.Engine.save(); if (G.Audio.ctx) G.Audio.ctx.suspend(); }
    else if (G.Audio.ctx) G.Audio.ctx.resume();
  });
  window.addEventListener('pagehide', () => { if (G.S) G.Engine.save(); });

  // Hardware back button (Android / Escape): close modals first, then navigate back
  const back = () => {
    const top = document.querySelector('#modal-root .modal-bg:last-child');
    if (top) { if (!top.querySelector('[data-a="evChoice"],[data-a="evGo"],[data-a="cWin"],[data-a="cLose"],[data-a="bossFight"]')) G.UI.closeModal(); return true; }
    const cur = G.UI.cur && G.UI.cur.name;
    if (['hero', 'bag', 'skills', 'journal', 'loc'].includes(cur)) { G.UI.go(G.S && G.S.dungeon ? 'dungeon' : 'town'); return true; }
    if (['settings', 'about', 'load', 'create'].includes(cur)) { G.A[cur === 'settings' ? 'settingsBack' : cur === 'about' ? 'aboutBack' : 'toMenu'](); return true; }
    if (['town', 'dungeon'].includes(cur)) { G.A.openGameMenu(); return true; }
    return false;
  };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') back(); });
  if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
    window.Capacitor.Plugins.App.addListener('backButton', () => { if (!back()) window.Capacitor.Plugins.App.exitApp(); });
  }

  // Prevent double-tap zoom and context menu on long-press
  document.addEventListener('contextmenu', e => e.preventDefault());
  let lastTouch = 0;
  document.addEventListener('touchend', e => { const n = Date.now(); if (n - lastTouch < 300 && !e.target.closest('input,textarea')) e.preventDefault(); lastTouch = n; }, { passive: false });

  window.addEventListener('error', e => console.error('Gloamreach error:', e.message));

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  G.UI.go('splash');
})();
