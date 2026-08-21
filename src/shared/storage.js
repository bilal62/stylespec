/* Stylespec — chrome.storage.sync wrapper with defaults and schema versioning.
 * Keys are kept separate at the top level so the 8 KB per-item sync quota
 * applies to each one independently rather than to a single blob.
 */
(function () {
  const SayWhat = (globalThis.SayWhat = globalThis.SayWhat || {});

  const SCHEMA_VERSION = 1;

  const DEFAULTS = {
    schemaVersion: SCHEMA_VERSION,
    enabled: true,
    disabledSites: [],
    /* Sites on the built-in "this is a chat, but not an AI chat" denylist that
     * the user has explicitly opted back in from the popup. */
    forceSites: [],
    customStyles: [],
    /* Extra multiplexer targets. Built-ins live in providers.js, the same way
     * built-in styles live in presets.js. */
    customProviders: [],
    hiddenBuiltins: [],
    /* The first screen of a brand-new install, pinned to the top of both the
     * picker and the popup, so every entry has to be legible from its name
     * alone. That rules out the two most interesting styles in the library:
     * "Simplified Technical English" means nothing outside documentation, and
     * "Put the fries in the bag" means nothing outside a particular corner of
     * the internet. Both are one search away in the picker for the people who
     * want them, which is the right place for a style you have to be in on.
     *
     * Ordered by what a new user is most likely to want first: shorter answers,
     * then simpler ones. */
    favorites: ['bluf', 'eli5', 'plain', 'no-tells', 'checklist'],
    order: [],
    lastUsedId: null,
    modifiers: Object.assign({}, SayWhat.DEFAULT_MODIFIERS),
    rememberModifiers: true,
    siteDefaults: {},
    insertMode: 'append',
    showDivider: true,
    pillEnabled: true,
    theme: 'auto',
  };

  function migrate(raw) {
    const settings = Object.assign({}, DEFAULTS, raw || {});
    settings.modifiers = Object.assign({}, DEFAULTS.modifiers, raw && raw.modifiers);
    settings.schemaVersion = SCHEMA_VERSION;
    return settings;
  }

  async function getSettings() {
    try {
      const raw = await chrome.storage.sync.get(null);
      return migrate(raw);
    } catch (err) {
      console.warn('[Stylespec] could not read settings, using defaults', err);
      return migrate(null);
    }
  }

  async function setSettings(patch) {
    await chrome.storage.sync.set(patch);
  }

  function normalizeHost(input) {
    if (!input) return '';
    try {
      const url = input.includes('://') ? new URL(input) : null;
      return (url ? url.hostname : String(input)).replace(/^www\./, '').toLowerCase();
    } catch {
      return String(input).replace(/^www\./, '').toLowerCase();
    }
  }

  function isSiteEnabled(settings, host) {
    if (!settings.enabled) return false;
    const h = normalizeHost(host);
    return !(settings.disabledSites || []).some((s) => normalizeHost(s) === h);
  }

  /** Built-ins (minus hidden) plus custom styles, in the user's saved order. */
  function allStyles(settings) {
    const hidden = new Set(settings.hiddenBuiltins || []);
    const builtins = (SayWhat.PRESETS || [])
      .filter((p) => !hidden.has(p.id))
      .map((p) => Object.assign({}, p, { builtin: true }));
    const custom = (settings.customStyles || []).map((s) =>
      Object.assign({ group: 'custom', emoji: '✨' }, s, { builtin: false })
    );

    const merged = builtins.concat(custom);
    const order = settings.order || [];
    if (!order.length) return merged;

    const rank = new Map(order.map((id, i) => [id, i]));
    return merged.slice().sort((a, b) => {
      const ra = rank.has(a.id) ? rank.get(a.id) : Number.MAX_SAFE_INTEGER;
      const rb = rank.has(b.id) ? rank.get(b.id) : Number.MAX_SAFE_INTEGER;
      return ra - rb;
    });
  }

  function resolveStyle(settings, id) {
    return allStyles(settings).find((s) => s.id === id) || null;
  }

  /** Favorites first (in favorite order), then everything else. */
  function sortedForPicker(settings) {
    const styles = allStyles(settings);
    const favs = settings.favorites || [];
    const favRank = new Map(favs.map((id, i) => [id, i]));
    const favorites = styles
      .filter((s) => favRank.has(s.id))
      .sort((a, b) => favRank.get(a.id) - favRank.get(b.id));
    const rest = styles.filter((s) => !favRank.has(s.id));
    return { favorites, rest, all: styles };
  }

  function newStyleId() {
    return 'custom-' + Math.random().toString(36).slice(2, 9);
  }

  /* Ask the browser what the shortcut actually is rather than hardcoding it.
   * That keeps the UI honest across platforms (Chrome reports the macOS
   * binding as symbols like ⌘⇧Y) and after the user rebinds it. */
  async function getCommandShortcut(name) {
    try {
      const commands = await chrome.commands.getAll();
      const command = commands.find((c) => c.name === name);
      return (command && command.shortcut) || '';
    } catch {
      return '';
    }
  }

  function shortcutKeys(shortcut) {
    if (!shortcut) return [];
    return shortcut.includes('+') ? shortcut.split('+') : Array.from(shortcut);
  }

  function onChanged(callback) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'sync') callback(changes);
    });
  }

  SayWhat.SCHEMA_VERSION = SCHEMA_VERSION;
  SayWhat.DEFAULTS = DEFAULTS;
  SayWhat.getSettings = getSettings;
  SayWhat.setSettings = setSettings;
  SayWhat.normalizeHost = normalizeHost;
  SayWhat.isSiteEnabled = isSiteEnabled;
  SayWhat.allStyles = allStyles;
  SayWhat.resolveStyle = resolveStyle;
  SayWhat.sortedForPicker = sortedForPicker;
  SayWhat.newStyleId = newStyleId;
  SayWhat.getCommandShortcut = getCommandShortcut;
  SayWhat.shortcutKeys = shortcutKeys;
  SayWhat.onChanged = onChanged;
})();
