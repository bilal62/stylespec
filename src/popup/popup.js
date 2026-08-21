/* Stylespec — toolbar popup. */
(function () {
  const SayWhat = globalThis.SayWhat;

  const dom = {
    siteLabel: document.getElementById('siteLabel'),
    masterToggle: document.getElementById('masterToggle'),
    notice: document.getElementById('notice'),
    favorites: document.getElementById('favorites'),
    siteToggle: document.getElementById('siteToggle'),
    manage: document.getElementById('manage'),
    shortcutHint: document.getElementById('shortcutHint'),
  };

  let settings = null;
  let tabId = null;
  let tabUrl = '';
  let context = null;

  const originPattern = (host) => `*://${host}/*`;

  function h(tag, props, ...kids) {
    const node = document.createElement(tag);
    const p = props || {};
    for (const key of Object.keys(p)) {
      const value = p[key];
      if (value == null || value === false) continue;
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else if (key === 'disabled') node.disabled = value;
      else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
      else node.setAttribute(key, value === true ? '' : value);
    }
    for (const kid of kids.flat()) if (kid != null) node.append(kid);
    return node;
  }

  /* No answer means the content script is not running here, which is the normal
   * state for any site outside the built-in match list. Opening the popup is a
   * user gesture, so activeTab gives us the URL needed to offer to turn it on. */
  async function loadContext() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || tab.id == null) return null;
    tabId = tab.id;
    tabUrl = tab.url || '';
    try {
      return await chrome.tabs.sendMessage(tab.id, { type: 'sw:context' });
    } catch {
      return null;
    }
  }

  /** The current tab's host, or null if it is a page no extension may touch. */
  function tabHost() {
    try {
      const url = new URL(tabUrl);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
      return SayWhat.normalizeHost(url.hostname);
    } catch {
      return null;
    }
  }

  async function enableHere(host) {
    /* Recorded before the prompt because Chrome usually closes the popup to
     * show it, killing this function mid-await. The worker watches for the
     * grant and finishes the job; if the user declines instead, the entry is
     * inert, since nothing registers without the permission. */
    const list = settings.forceSites || [];
    if (!list.includes(host)) await SayWhat.setSettings({ forceSites: list.concat([host]) });

    let granted = false;
    try {
      granted = await chrome.permissions.request({ origins: [originPattern(host)] });
    } catch {
      granted = false;
    }

    if (!granted) {
      await SayWhat.setSettings({ forceSites: (settings.forceSites || []).filter((s) => s !== host) });
      await refresh();
      setNotice(`Stylespec needs permission for ${host} to run there.`);
      return;
    }

    await chrome.runtime.sendMessage({ type: 'sw:enable-site', host, tabId });
    window.close();
  }

  async function disableHere(host) {
    await SayWhat.setSettings({
      forceSites: (settings.forceSites || []).filter((s) => s !== host),
    });
    await chrome.runtime.sendMessage({ type: 'sw:disable-site', host });
    try {
      await chrome.permissions.remove({ origins: [originPattern(host)] });
    } catch {
      /* Built-in match, or already gone. Either way there is nothing to drop. */
    }
    await refresh();
  }

  function setNotice(text, action) {
    dom.notice.textContent = '';
    if (!text) {
      dom.notice.hidden = true;
      return;
    }
    dom.notice.hidden = false;
    dom.notice.append(h('span', { text }));
    if (action) {
      dom.notice.append(
        h('button', {
          class: 'notice__action',
          type: 'button',
          text: action.label,
          onclick: action.onClick,
        })
      );
    }
  }

  function renderFavorites() {
    dom.favorites.textContent = '';
    const { favorites, all } = SayWhat.sortedForPicker(settings);
    const list = favorites.length ? favorites : all.slice(0, 6);

    if (!list.length) {
      dom.favorites.append(h('div', { class: 'empty', text: 'No styles yet.' }));
      return;
    }

    const usable = !!context && settings.enabled !== false;
    for (const style of list) {
      dom.favorites.append(
        h(
          'button',
          {
            class: 'fav',
            type: 'button',
            disabled: !usable,
            title: style.instruction || '',
            onclick: () => applyStyle(style.id),
          },
          h('span', { class: 'fav__emoji', text: style.emoji || '✨' }),
          h(
            'span',
            { class: 'fav__body' },
            h('span', { class: 'fav__name', text: style.name }),
            h('span', { class: 'fav__blurb', text: style.blurb || '' })
          )
        )
      );
    }
  }

  async function applyStyle(styleId) {
    if (tabId == null) return;
    try {
      const result = await chrome.tabs.sendMessage(tabId, { type: 'sw:apply', styleId });
      if (result && result.ok) window.close();
      else setNotice('Could not find a chat box on this page. Click into one first.');
    } catch {
      setNotice('Stylespec is not running on this page.');
    }
  }

  function renderSiteState() {
    if (!context) {
      const pending = tabHost();
      dom.siteToggle.hidden = true;
      if (!pending) {
        dom.siteLabel.textContent = 'Not available on this page';
        setNotice(
          'Stylespec only runs on regular web pages, so browser and extension pages are out.'
        );
        return;
      }
      dom.siteLabel.textContent = pending;
      setNotice(
        settings.enabled === false
          ? 'Stylespec is off everywhere. Use the switch above to turn it back on.'
          : `Stylespec does not run on ${pending} yet. Turn it on if this is an AI chat.`,
        settings.enabled === false
          ? null
          : { label: 'Turn it on here', onClick: () => enableHere(pending) }
      );
      return;
    }

    const host = context.host;
    dom.siteLabel.textContent = host;

    const enabledHere = SayWhat.isSiteEnabled(settings, host);
    const forced = (settings.forceSites || []).includes(host);

    const setForced = async (next) => {
      const list = settings.forceSites || [];
      await SayWhat.setSettings({
        forceSites: next ? list.concat([host]) : list.filter((s) => s !== host),
      });
      await refresh();
    };
    const forceAction = { label: 'Force it on', onClick: () => setForced(true) };
    /* Undo goes through disableHere so a site the user granted also loses its
     * registration and its permission, rather than just its lenient detection. */
    const unforceAction = { label: 'Undo', onClick: () => disableHere(host) };

    if (settings.enabled === false) {
      setNotice('Stylespec is off everywhere. Use the switch above to turn it back on.');
    } else if (!enabledHere) {
      setNotice(`Turned off on ${host}.`);
    } else if (forced) {
      setNotice(`Forced on for ${host}, so every text box here counts as a chat.`, unforceAction);
    } else if (context.denied) {
      setNotice(
        `${host} looks like a chat app rather than an AI chat, so the pill stays hidden.`,
        forceAction
      );
    } else if (!context.hasTarget) {
      /* Forcing is the escape hatch for AI apps the heuristics do not recognise,
       * so it has to be reachable when nothing was detected — not just on the
       * denylist. */
      setNotice(
        'No chat box detected yet. Start typing in one, or force it on if this is an AI chat.',
        forceAction
      );
    } else {
      setNotice('');
    }

    /* The host is already in the header, so the button says "here" — the full
     * name does not fit in half a 316px popup. */
    dom.siteToggle.hidden = false;
    dom.siteToggle.textContent = enabledHere ? 'Turn off here' : 'Turn on here';
    dom.siteToggle.title = enabledHere
      ? `Turn Stylespec off on ${host}`
      : `Turn Stylespec on for ${host}`;
    dom.siteToggle.onclick = async () => {
      const list = settings.disabledSites || [];
      await SayWhat.setSettings({
        disabledSites: enabledHere ? list.concat([host]) : list.filter((s) => s !== host),
      });
      await refresh();
    };
  }

  async function renderShortcut() {
    const shortcut = await SayWhat.getCommandShortcut('open-picker');
    dom.shortcutHint.textContent = '';
    if (!shortcut) {
      dom.shortcutHint.textContent = 'No keyboard shortcut is set for the picker.';
      return;
    }
    dom.shortcutHint.append('Or press ');
    for (const key of SayWhat.shortcutKeys(shortcut)) {
      dom.shortcutHint.append(h('kbd', { text: key }));
    }
    dom.shortcutHint.append(' in any chat box');
  }

  async function refresh() {
    settings = await SayWhat.getSettings();
    SayWhat.applyTheme(settings.theme);
    dom.masterToggle.checked = settings.enabled !== false;
    renderSiteState();
    renderFavorites();
  }

  dom.masterToggle.addEventListener('change', async () => {
    await SayWhat.setSettings({ enabled: dom.masterToggle.checked });
    await refresh();
  });

  dom.manage.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
    window.close();
  });

  (async function init() {
    context = await loadContext();
    await refresh();
    await renderShortcut();
  })();
})();
