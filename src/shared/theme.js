/* Stylespec — theme handling for the extension's own pages.
 *
 * Loaded synchronously in <head> so the first paint is already correct.
 * chrome.storage is async, which would show a flash of the wrong theme on
 * every popup open, so the last known choice is mirrored into localStorage
 * (per extension origin) and read back before anything renders.
 */
(function () {
  const SayWhat = (globalThis.SayWhat = globalThis.SayWhat || {});
  const CACHE_KEY = 'sw-theme';

  function readCache() {
    try {
      return localStorage.getItem(CACHE_KEY) || 'auto';
    } catch {
      return 'auto';
    }
  }

  function applyTheme(theme) {
    const value = theme === 'light' || theme === 'dark' ? theme : 'auto';
    document.documentElement.dataset.theme = value;
    try {
      localStorage.setItem(CACHE_KEY, value);
    } catch {
      /* Storage can be unavailable; the theme still applies for this page. */
    }
    return value;
  }

  document.documentElement.dataset.theme = readCache();

  SayWhat.applyTheme = applyTheme;
})();
