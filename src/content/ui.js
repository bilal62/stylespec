/* Stylespec — the in-page pill and style picker.
 *
 * Everything lives inside a shadow root on a full-viewport, pointer-events:none
 * overlay. Nothing is inserted into the host page's own tree, so React
 * reconciliation cannot tear it out and site CSS cannot reach it.
 */
(function () {
  const SayWhat = (globalThis.SayWhat = globalThis.SayWhat || {});

  const ICONS = {
    mark: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3C6.9 3 3 6.3 3 10.4c0 2.3 1.2 4.3 3.2 5.7L5.4 20l3.9-2a11 11 0 0 0 2.7.3c5.1 0 9-3.3 9-7.4S17.1 3 12 3Z"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4L2.6 9.4l6.5-.9L12 2.6Z"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m20 6-11 11-5-5"/></svg>',
  };

  /* A constructed stylesheet is not part of the page's DOM, so a strict
   * style-src CSP cannot reject it the way it rejects an appended <style>. */
  function applyStyles(shadow) {
    const css = SayWhat.UI_CSS || '';
    try {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(css);
      shadow.adoptedStyleSheets = [sheet];
      return;
    } catch {
      const style = document.createElement('style');
      style.textContent = css;
      shadow.appendChild(style);
    }
  }

  const state = {
    host: null,
    shadow: null,
    root: null,
    pill: null,
    panel: null,
    toast: null,
    toastTimer: null,
    open: false,
    /* The composer's rect, kept so the panel can avoid covering it. */
    anchorRect: null,
    query: '',
    activeIndex: 0,
    rows: [],
    modsOpen: false,
    muxOpen: false,
    /* Provider ids armed for the next prompt. Deliberately not persisted: a
     * remembered selection would fan out every follow-up turn, and a follow-up
     * like "make it shorter" means nothing to an assistant that never saw the
     * conversation it refers to. */
    armed: new Set(),
    settings: null,
    handlers: {},
  };

  function el(tag, className, html) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html != null) node.innerHTML = html;
    return node;
  }

  function mount() {
    if (state.host) {
      /* Some SPAs replace document.body wholesale. */
      if (!state.host.isConnected) {
        (document.body || document.documentElement).appendChild(state.host);
      }
      return;
    }

    const host = document.createElement('stylespec-root');
    const shadow = host.attachShadow({ mode: 'open' });
    applyStyles(shadow);

    const root = el('div', 'sw-root');
    root.dataset.theme = (state.settings && state.settings.theme) || 'auto';
    shadow.appendChild(root);

    const pill = el(
      'button',
      'sw-pill',
      `<span class="sw-pill__mark">${ICONS.mark}</span><span class="sw-pill__label">Set response style</span><span class="sw-pill__badge" hidden></span>`
    );
    pill.type = 'button';
    pill.setAttribute('aria-haspopup', 'dialog');
    pill.addEventListener('mousedown', (e) => e.preventDefault());
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      togglePanel();
    });
    root.appendChild(pill);

    const panel = el('div', 'sw-panel');
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Stylespec response style picker');
    root.appendChild(panel);

    const toast = el('div', 'sw-toast');
    toast.hidden = true;
    root.appendChild(toast);

    (document.body || document.documentElement).appendChild(host);

    state.host = host;
    state.shadow = shadow;
    state.root = root;
    state.pill = pill;
    state.panel = panel;
    state.toast = toast;
  }

  /* ------------------------------------------------------------- pill --- */

  function positionPill(rect) {
    const pill = state.pill;
    if (!pill) return;
    const width = pill.offsetWidth || 150;
    const height = pill.offsetHeight || 28;
    const gap = 6;

    let top = rect.top - height - gap;
    if (top < 8) top = Math.min(rect.top + gap, window.innerHeight - height - 8);

    let left = rect.right - width;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));

    pill.style.top = `${Math.round(top)}px`;
    pill.style.left = `${Math.round(left)}px`;
  }

  function showPill(rect, activeStyleName) {
    mount();
    const label = state.pill.querySelector('.sw-pill__label');
    if (activeStyleName) {
      label.textContent = `Style: ${activeStyleName}`;
      label.classList.add('sw-pill__active');
      state.pill.title = `Stylespec — ${activeStyleName} is attached. Click to change.`;
    } else {
      label.textContent = 'Set response style';
      label.classList.remove('sw-pill__active');
      state.pill.title = 'Stylespec — set the tone and style of the reply';
    }
    updatePillBadge();
    state.anchorRect = rect;
    positionPill(rect);
    state.pill.setAttribute('data-visible', 'true');
    /* The composer may have moved since the panel was placed, and the panel is
     * sized around where the composer is. */
    if (state.open) positionPanel();
  }

  /* The picker closes as soon as a style is applied, so without this the only
   * evidence that tabs are about to open would be gone by the time you send. */
  function updatePillBadge() {
    if (!state.pill) return;
    const badge = state.pill.querySelector('.sw-pill__badge');
    if (!badge) return;
    const names = armedProviders().map((p) => p.name);
    badge.hidden = names.length === 0;
    badge.textContent = names.length ? `+${names.length}` : '';
    if (names.length) badge.title = `Also sending to ${names.join(', ')}`;
  }

  function hidePill() {
    if (!state.pill) return;
    state.pill.removeAttribute('data-visible');
    closePanel();
  }

  function reposition(rect) {
    if (!state.pill || !rect) return;
    state.anchorRect = rect;
    positionPill(rect);
    if (state.open) positionPanel();
  }

  /* ------------------------------------------------------------ panel --- */

  const PANEL_MAX_H = 462;
  /* Below this the picker is not worth showing, so in a viewport with no good
   * gap we accept some overlap rather than a sliver. */
  const PANEL_MIN_H = 220;
  const PANEL_GAP = 8;
  const PANEL_MARGIN = 8;

  /**
   * Where to put a panel `height` tall so that it clears both the pill and the
   * composer.
   *
   * Clearing the composer is the part that is easy to get wrong. On a chat with
   * messages the composer is docked at the bottom, there is always room above
   * it, and the question never comes up. On an empty chat it sits in the middle
   * of the screen, the panel does not fit above it, and falling back to "just
   * below the pill" lands squarely on the composer — covering the site's own
   * send button, which is the next control the user needs.
   *
   * So it goes against the taller of the two gaps around the composer, capped
   * to fit. A shorter panel costs a little scrolling in a list that already
   * scrolls; covering the send button costs a click.
   */
  function panelPlacement(pillRect, anchorRect, viewportHeight, height) {
    const clearsAbove = Math.min(pillRect.top, anchorRect.top) - PANEL_GAP;
    const clearsBelow = Math.max(pillRect.bottom, anchorRect.bottom) + PANEL_GAP;
    const roomAbove = clearsAbove - PANEL_MARGIN;
    const roomBelow = viewportHeight - PANEL_MARGIN - clearsBelow;

    const above = roomAbove >= roomBelow;
    const maxHeight = Math.round(
      Math.min(PANEL_MAX_H, Math.max(above ? roomAbove : roomBelow, PANEL_MIN_H))
    );

    const fitted = Math.min(height, maxHeight);
    const top = above
      ? Math.max(PANEL_MARGIN, clearsAbove - fitted)
      : Math.min(clearsBelow, viewportHeight - PANEL_MARGIN - fitted);

    return { above, maxHeight, top: Math.round(top) };
  }

  function positionPanel() {
    const panel = state.panel;
    const pillRect = state.pill.getBoundingClientRect();
    const anchor = state.anchorRect || pillRect;

    const cap = panelPlacement(pillRect, anchor, window.innerHeight, PANEL_MAX_H);
    panel.style.maxHeight = `${cap.maxHeight}px`;

    /* Measured after the cap is applied, so a clamped panel is placed by its
     * real height rather than the one it would have had. */
    const height = panel.offsetHeight || 400;
    const width = panel.offsetWidth || 344;
    const placed = panelPlacement(pillRect, anchor, window.innerHeight, height);

    let left = pillRect.right - width;
    left = Math.max(PANEL_MARGIN, Math.min(left, window.innerWidth - width - PANEL_MARGIN));

    panel.style.top = `${placed.top}px`;
    panel.style.left = `${Math.round(left)}px`;
  }

  function togglePanel() {
    if (state.open) closePanel();
    else openPanel();
  }

  function openPanel() {
    mount();
    state.open = true;
    state.query = '';
    state.activeIndex = 0;
    renderPanel();
    state.panel.hidden = false;
    positionPanel();
    requestAnimationFrame(() => {
      if (!state.open) return;
      state.panel.setAttribute('data-visible', 'true');
      positionPanel();
      const search = state.panel.querySelector('.sw-search input');
      if (search) search.focus({ preventScroll: true });
    });
  }

  function closePanel() {
    if (!state.open) return;
    state.open = false;
    state.panel.removeAttribute('data-visible');
    state.panel.hidden = true;
    if (state.handlers.onClose) state.handlers.onClose();
  }

  function matchesQuery(style, query) {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      style.name.toLowerCase().includes(q) ||
      (style.blurb || '').toLowerCase().includes(q) ||
      (style.instruction || '').toLowerCase().includes(q)
    );
  }

  function buildItem(style, isFavorite) {
    const item = el('button', 'sw-item');
    item.type = 'button';
    item.dataset.styleId = style.id;
    item.title = style.instruction || '';

    const emoji = el('span', 'sw-item__emoji');
    emoji.textContent = style.emoji || '✨';

    const text = el('div', 'sw-item__text');
    const name = el('div', 'sw-item__name');
    name.textContent = style.name;
    const blurb = el('div', 'sw-item__blurb');
    blurb.textContent = style.blurb || '';
    text.append(name, blurb);

    item.append(emoji, text);
    if (isFavorite) item.appendChild(el('span', 'sw-item__star', ICONS.star));

    item.addEventListener('mousedown', (e) => e.preventDefault());
    item.addEventListener('click', () => apply(style.id));
    item.addEventListener('mouseenter', () => {
      const index = state.rows.indexOf(item);
      if (index >= 0) setActiveIndex(index);
    });
    return item;
  }

  function renderList(container) {
    container.textContent = '';
    state.rows = [];

    const { favorites, rest } = SayWhat.sortedForPicker(state.settings);
    const favMatches = favorites.filter((s) => matchesQuery(s, state.query));
    const restMatches = rest.filter((s) => matchesQuery(s, state.query));

    if (!favMatches.length && !restMatches.length) {
      const empty = el('div', 'sw-empty');
      empty.textContent = `No style matches "${state.query}"`;
      container.appendChild(empty);
      return;
    }

    if (favMatches.length) {
      container.appendChild(withText(el('div', 'sw-group'), 'Favorites'));
      favMatches.forEach((style) => {
        const item = buildItem(style, true);
        state.rows.push(item);
        container.appendChild(item);
      });
    }

    const groups = (SayWhat.GROUPS || []).concat([{ id: 'custom', name: 'Your styles' }]);
    for (const group of groups) {
      const inGroup = restMatches.filter((s) => (s.group || 'custom') === group.id);
      if (!inGroup.length) continue;
      container.appendChild(withText(el('div', 'sw-group'), group.name));
      inGroup.forEach((style) => {
        const item = buildItem(style, false);
        state.rows.push(item);
        container.appendChild(item);
      });
    }

    setActiveIndex(Math.min(state.activeIndex, state.rows.length - 1));
  }

  function withText(node, text) {
    node.textContent = text;
    return node;
  }

  function setActiveIndex(index) {
    state.activeIndex = Math.max(0, index);
    state.rows.forEach((row, i) => {
      if (i === state.activeIndex) row.setAttribute('data-active', 'true');
      else row.removeAttribute('data-active');
    });
  }

  function modifierSummaryText() {
    const mods = state.settings.modifiers || {};
    const bits = [];
    for (const mod of SayWhat.MODIFIERS) {
      const chosen = mods[mod.id];
      if (!chosen || chosen === 'default') continue;
      const opt = mod.options.find((o) => o.id === chosen);
      if (opt) bits.push(opt.summary || opt.label);
    }
    const lang = SayWhat.getLanguage(mods.language);
    if (lang && lang.code !== 'auto') bits.push(lang.name);
    return bits.length ? bits.join(', ') : 'Default';
  }

  function renderModifiers(container) {
    container.textContent = '';
    container.dataset.open = state.modsOpen ? 'true' : 'false';

    const toggle = el(
      'button',
      'sw-mods__toggle',
      `<span class="sw-mods__chevron">${ICONS.chevron}</span><span>Fine-tune</span>`
    );
    toggle.type = 'button';
    const summary = el('span', 'sw-mods__summary');
    summary.textContent = modifierSummaryText();
    toggle.appendChild(summary);
    toggle.addEventListener('mousedown', (e) => e.preventDefault());
    toggle.addEventListener('click', () => {
      state.modsOpen = !state.modsOpen;
      container.dataset.open = state.modsOpen ? 'true' : 'false';
      requestAnimationFrame(positionPanel);
    });
    container.appendChild(toggle);

    const body = el('div', 'sw-mods__body');

    for (const mod of SayWhat.MODIFIERS) {
      const row = el('div', 'sw-mod-row');
      row.appendChild(withText(el('span', 'sw-mod-row__label'), mod.label));
      const chips = el('div', 'sw-chips');
      for (const opt of mod.options) {
        const chip = el('button', 'sw-chip');
        chip.type = 'button';
        chip.textContent = opt.label;
        if ((state.settings.modifiers || {})[mod.id] === opt.id) chip.dataset.selected = 'true';
        chip.addEventListener('mousedown', (e) => e.preventDefault());
        chip.addEventListener('click', () => updateModifier(mod.id, opt.id));
        chips.appendChild(chip);
      }
      row.appendChild(chips);
      body.appendChild(row);
    }

    const langRow = el('div', 'sw-mod-row');
    langRow.appendChild(withText(el('span', 'sw-mod-row__label'), 'Language'));
    const langSelect = el('select', 'sw-select');
    for (const lang of SayWhat.LANGUAGES) {
      const option = document.createElement('option');
      option.value = lang.code;
      option.textContent = lang.name;
      if ((state.settings.modifiers || {}).language === lang.code) option.selected = true;
      langSelect.appendChild(option);
    }
    langSelect.addEventListener('change', () => updateModifier('language', langSelect.value));
    langRow.appendChild(langSelect);

    const active = SayWhat.getLanguage((state.settings.modifiers || {}).language);
    if (active && (active.informal || active.formal)) {
      const registerSelect = el('select', 'sw-select');
      const options = [
        { id: 'default', label: 'Any register' },
        { id: 'informal', label: `Informal (${active.informal})` },
        { id: 'formal', label: `Formal (${active.formal})` },
      ];
      for (const opt of options) {
        const option = document.createElement('option');
        option.value = opt.id;
        option.textContent = opt.label;
        if ((state.settings.modifiers || {}).languageRegister === opt.id) option.selected = true;
        registerSelect.appendChild(option);
      }
      registerSelect.addEventListener('change', () =>
        updateModifier('languageRegister', registerSelect.value)
      );
      langRow.appendChild(registerSelect);
    }

    body.appendChild(langRow);
    container.appendChild(body);
  }

  function updateModifier(key, value) {
    const mods = Object.assign({}, state.settings.modifiers, { [key]: value });
    if (key === 'language') mods.languageRegister = 'default';
    state.settings.modifiers = mods;
    if (state.handlers.onModifiersChange) state.handlers.onModifiersChange(mods);
    renderModifiers(state.panel.querySelector('.sw-mods'));
    requestAnimationFrame(positionPanel);
  }

  /* ------------------------------------------------------ multiplexer --- */

  function armedProviders() {
    if (!state.settings) return [];
    return SayWhat.allProviders(state.settings).filter((p) => state.armed.has(p.id));
  }

  function muxSummaryText() {
    const armed = armedProviders();
    return armed.length ? armed.map((p) => p.name).join(', ') : 'Off';
  }

  function toggleArmed(id) {
    if (state.armed.has(id)) state.armed.delete(id);
    else state.armed.add(id);
    const container = state.panel && state.panel.querySelector('.sw-mux');
    if (container) renderMultiplexer(container);
    updatePillBadge();
    requestAnimationFrame(positionPanel);
  }

  function renderMultiplexer(container) {
    container.textContent = '';
    container.dataset.open = state.muxOpen ? 'true' : 'false';

    const toggle = el(
      'button',
      'sw-mods__toggle',
      `<span class="sw-mods__chevron">${ICONS.chevron}</span><span>Multiplexer</span>`
    );
    toggle.type = 'button';
    const summary = el('span', 'sw-mods__summary');
    summary.textContent = muxSummaryText();
    toggle.appendChild(summary);
    toggle.addEventListener('mousedown', (e) => e.preventDefault());
    toggle.addEventListener('click', () => {
      state.muxOpen = !state.muxOpen;
      container.dataset.open = state.muxOpen ? 'true' : 'false';
      requestAnimationFrame(positionPanel);
    });
    container.appendChild(toggle);

    const body = el('div', 'sw-mods__body');
    const here = SayWhat.detect.currentHost();
    const chips = el('div', 'sw-chips');

    for (const provider of SayWhat.allProviders(state.settings)) {
      const chip = el('button', 'sw-chip');
      chip.type = 'button';
      chip.textContent = provider.name;

      if (SayWhat.providerHost(provider) === here) {
        chip.disabled = true;
        chip.dataset.here = 'true';
        chip.title = 'You are already on this one';
      } else {
        if (state.armed.has(provider.id)) chip.dataset.selected = 'true';
        chip.addEventListener('mousedown', (e) => e.preventDefault());
        chip.addEventListener('click', () => toggleArmed(provider.id));
      }
      chips.appendChild(chip);
    }
    body.appendChild(chips);

    const hint = el('div', 'sw-mux__hint');
    hint.textContent = state.armed.size
      ? 'Each opens in a background tab when you send, then this switches itself off.'
      : 'Send this same prompt to another assistant as well.';
    body.appendChild(hint);

    const add = el('button', 'sw-mux__add');
    add.type = 'button';
    add.textContent = 'Add a provider';
    add.addEventListener('mousedown', (e) => e.preventDefault());
    add.addEventListener('click', () => {
      if (state.handlers.onOpenOptions) state.handlers.onOpenOptions();
      closePanel();
    });
    body.appendChild(add);

    container.appendChild(body);
  }

  function renderPanel() {
    const panel = state.panel;
    panel.textContent = '';

    const head = el('div', 'sw-head');
    const title = el('div', 'sw-head__title', '<span>Response style</span>');
    const sub = document.createElement('small');
    sub.textContent = 'Appended to your prompt when you pick one';
    title.appendChild(sub);
    head.appendChild(title);

    const settingsBtn = el('button', 'sw-icon-btn', ICONS.gear);
    settingsBtn.type = 'button';
    settingsBtn.title = 'Manage styles';
    settingsBtn.addEventListener('mousedown', (e) => e.preventDefault());
    settingsBtn.addEventListener('click', () => {
      if (state.handlers.onOpenOptions) state.handlers.onOpenOptions();
      closePanel();
    });

    const closeBtn = el('button', 'sw-icon-btn', ICONS.close);
    closeBtn.type = 'button';
    closeBtn.title = 'Close';
    closeBtn.addEventListener('mousedown', (e) => e.preventDefault());
    closeBtn.addEventListener('click', closePanel);

    head.append(settingsBtn, closeBtn);
    panel.appendChild(head);

    const search = el('div', 'sw-search');
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Search styles';
    input.setAttribute('aria-label', 'Search styles');
    input.value = state.query;
    input.addEventListener('input', () => {
      state.query = input.value;
      state.activeIndex = 0;
      renderList(panel.querySelector('.sw-list'));
    });
    input.addEventListener('keydown', onSearchKeydown);
    search.appendChild(input);
    panel.appendChild(search);

    const list = el('div', 'sw-list');
    panel.appendChild(list);
    renderList(list);

    const mods = el('div', 'sw-mods');
    panel.appendChild(mods);
    renderModifiers(mods);

    const mux = el('div', 'sw-mods sw-mux');
    panel.appendChild(mux);
    renderMultiplexer(mux);
  }

  function onSearchKeydown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex(Math.min(state.activeIndex + 1, state.rows.length - 1));
      scrollActiveIntoView();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex(Math.max(state.activeIndex - 1, 0));
      scrollActiveIntoView();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const row = state.rows[state.activeIndex];
      if (row) apply(row.dataset.styleId);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closePanel();
      if (state.handlers.onEscape) state.handlers.onEscape();
    }
  }

  function scrollActiveIntoView() {
    const row = state.rows[state.activeIndex];
    if (row) row.scrollIntoView({ block: 'nearest' });
  }

  function apply(styleId) {
    closePanel();
    if (state.handlers.onApply) state.handlers.onApply(styleId);
  }

  /* ------------------------------------------------------------ toast --- */

  function toast(message, rect) {
    mount();
    const node = state.toast;
    node.textContent = '';
    node.appendChild(el('span', null, ICONS.check));
    node.appendChild(withText(document.createElement('span'), message));
    node.hidden = false;

    const width = node.offsetWidth || 180;
    const anchor = rect || (state.pill ? state.pill.getBoundingClientRect() : null);
    const top = anchor ? Math.max(8, anchor.top - 44) : window.innerHeight - 80;
    const left = anchor
      ? Math.max(8, Math.min(anchor.right - width, window.innerWidth - width - 8))
      : (window.innerWidth - width) / 2;
    node.style.top = `${Math.round(top)}px`;
    node.style.left = `${Math.round(left)}px`;

    requestAnimationFrame(() => node.setAttribute('data-visible', 'true'));
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => {
      node.removeAttribute('data-visible');
      setTimeout(() => {
        node.hidden = true;
      }, 220);
    }, 1900);
  }

  /* Node.contains does not cross the shadow boundary, so an element inside our
   * own picker would otherwise look like page content. */
  function contains(node) {
    if (!state.host || !node) return false;
    if (state.host === node || state.host.contains(node)) return true;
    return !!(node.getRootNode && node.getRootNode() === state.shadow);
  }

  SayWhat.ui = {
    panelPlacement,
    init(handlers) {
      state.handlers = handlers || {};
    },
    setSettings(settings) {
      state.settings = settings;
      if (state.root) state.root.dataset.theme = settings.theme || 'auto';
      if (!state.open) return;
      /* A settings write echoes back through storage.onChanged; rebuild the
       * panel without yanking focus out of the search box. */
      renderPanel();
      positionPanel();
      const search = state.panel.querySelector('.sw-search input');
      if (search) {
        search.focus({ preventScroll: true });
        search.setSelectionRange(search.value.length, search.value.length);
      }
    },
    /** Provider ids armed for the next prompt, in selection order. */
    armed: () => Array.from(state.armed),
    disarm() {
      if (!state.armed.size) return;
      state.armed.clear();
      updatePillBadge();
      const container = state.panel && state.panel.querySelector('.sw-mux');
      if (container) renderMultiplexer(container);
    },
    mount,
    showPill,
    hidePill,
    reposition,
    openPanel,
    closePanel,
    togglePanel,
    isOpen: () => state.open,
    toast,
    contains,
    host: () => state.host,
  };
})();
