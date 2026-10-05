/* Native monetization bridge. The browser build stays fully playable without it. */
G.Monetization = (() => {
  const REMOVE_ADS_KEY = 'gloamreach_remove_ads';
  const disabledScreens = new Set(['splash', 'menu', 'cine', 'create', 'load', 'settings', 'about']);
  let native = null, initialized = false;
  const plugin = () => native || (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.GloamMonetization) || null;
  const removed = () => localStorage.getItem(REMOVE_ADS_KEY) === '1';
  const markRemoved = () => { localStorage.setItem(REMOVE_ADS_KEY, '1'); };
  const status = () => ({ removeAds: removed(), native: !!plugin() });
  async function init() {
    if (initialized) return status();
    initialized = true;
    native = plugin();
    if (!native) return status();
    try {
      const result = await native.initialize();
      if (result && result.removeAds) markRemoved();
      native.addListener?.('statusChanged', result => { if (result && result.removeAds) markRemoved(); sync(); });
    } catch (err) { console.warn('Monetization unavailable', err); }
    sync();
    return status();
  }
  function sync() {
    const p = plugin();
    if (!p || removed() || !G.UI?.cur || disabledScreens.has(G.UI.cur.name)) { p?.hideBanner?.().catch?.(() => {}); return; }
    p.showBanner?.().catch?.(() => {});
  }
  async function purchase() {
    const p = plugin();
    if (!p) { G.UI.toast('Remove Ads is available in the Android app.', 'muted'); return; }
    try {
      const result = await p.purchaseRemoveAds();
      if (result?.removeAds) { markRemoved(); G.UI.toast('Ads removed. Thank you for supporting Gloamreach.', 'good'); G.UI.refresh(); }
      else if (result?.pending) G.UI.toast('Purchase pending. Ads will disappear after Google Play confirms it.', 'muted');
    } catch (err) { G.UI.toast(err?.message || 'Purchase could not be completed.', 'bad'); }
  }
  async function restore() {
    const p = plugin();
    if (!p) { G.UI.toast('Restore is available in the Android app.', 'muted'); return; }
    try {
      const result = await p.restorePurchases();
      if (result?.removeAds) { markRemoved(); G.UI.toast('Your Remove Ads purchase was restored.', 'good'); G.UI.refresh(); }
      else G.UI.toast('No Remove Ads purchase was found for this Google Play account.', 'muted');
    } catch (err) { G.UI.toast(err?.message || 'Restore could not be completed.', 'bad'); }
  }
  return { init, sync, purchase, restore, removed, isNative: () => !!plugin(), status };
})();
