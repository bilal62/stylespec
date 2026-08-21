/* Stylespec — content script entry point.
 * Watches for typing in an AI chat composer, shows the pill, and applies the
 * chosen style to the draft.
 */
(function () {
  const SayWhat = globalThis.SayWhat;
  if (!SayWhat || !SayWhat.detect) return;

  /* Re-scoring on every keystroke is wasteful, but a "no" decided before the
   * page finished laying out should not be permanent. */
  const RECHECK_MS = 1500;
  const decisions = new WeakMap();

  let settings = null;
  let target = null;
  let lastFocused = null;
  let appliedStyleName = null;
  let resizeObserver = null;
  let framePending = false;
  /* Bumped whenever settings change, so cached verdicts made under the old
   * settings (force-on in particular) are discarded instead of lingering. */
  let generation = 0;

  function siteForced() {
    const host = SayWhat.detect.currentHost();
    return (settings.forceSites || []).some((s) => SayWhat.normalizeHost(s) === host);
  }

  function siteEnabled() {
    return (
      settings &&
      settings.pillEnabled !== false &&
      SayWhat.isSiteEnabled(settings, SayWhat.detect.currentHost())
    );
  }

  function decide(el) {
    const cached = decisions.get(el);
    const now = Date.now();
    if (cached && cached.gen === generation && (cached.value || now - cached.at < RECHECK_MS)) {
      return cached.value;
    }
    const value = SayWhat.detect.isChatInput(el, { forced: siteForced() });
    decisions.set(el, { value, at: now, gen: generation });
    return value;
  }

  /* --------------------------------------------------------- pill state --- */

  /* A detached node still answers getBoundingClientRect, with zeros, which
   * would park a toast in the corner after a composer gets replaced. */
  function targetRect() {
    return target && target.isConnected ? target.getBoundingClientRect() : null;
  }

  function updatePill() {
    if (!target) return;
    if (!target.isConnected) {
      clearTarget();
      return;
    }
    if (!siteEnabled()) {
      SayWhat.ui.hidePill();
      return;
    }
    if (SayWhat.insertText.isEmptyDraft(target)) {
      appliedStyleName = null;
      SayWhat.ui.hidePill();
      return;
    }
    if (!SayWhat.detect.isVisible(target)) {
      SayWhat.ui.hidePill();
      return;
    }
    SayWhat.ui.showPill(targetRect(), appliedStyleName);
  }

  function setTarget(el) {
    if (target === el) {
      updatePill();
      return;
    }
    detachObserver();
    target = el;
    appliedStyleName = null;
    resizeObserver = new ResizeObserver(scheduleReposition);
    resizeObserver.observe(el);
    updatePill();
  }

  function detachObserver() {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
  }

  function clearTarget() {
    detachObserver();
    target = null;
    appliedStyleName = null;
    SayWhat.ui.hidePill();
  }

  function scheduleReposition() {
    if (framePending) return;
    framePending = true;
    requestAnimationFrame(() => {
      framePending = false;
      if (!target) return;
      if (!target.isConnected) {
        clearTarget();
        return;
      }
      SayWhat.ui.reposition(targetRect());
    });
  }

  /* ------------------------------------------------------------- apply --- */

  function applyStyle(styleId) {
    const style = SayWhat.resolveStyle(settings, styleId);
    if (!style) return false;

    const el = target && target.isConnected ? target : lastFocused;
    if (!el || !el.isConnected) {
      SayWhat.ui.toast('No chat box found', null);
      return false;
    }

    const block = SayWhat.composePostfix(style, settings.modifiers, {
      divider: settings.showDivider !== false,
    });
    const inserted = SayWhat.insertText.insert(el, block, settings.insertMode);

    settings.lastUsedId = styleId;
    SayWhat.setSettings({ lastUsedId: styleId }).catch(() => {});

    if (inserted) {
      setTarget(el);
      appliedStyleName = style.name;
      updatePill();
      SayWhat.ui.toast(`${style.name} added`, el.getBoundingClientRect());
    } else {
      SayWhat.ui.toast('Could not edit this box', el.getBoundingClientRect());
    }
    return inserted;
  }

  /* ------------------------------------------------------- multiplexer --- */

  function fanOut(prompt) {
    if (!siteEnabled()) return;
    const providerIds = SayWhat.ui.armed();
    if (!providerIds.length) return;

    /* Disarm first. The selection is for one prompt, and a slow round trip
     * should not leave a window where a second send fires it again. */
    SayWhat.ui.disarm();

    const rect = targetRect();
    chrome.runtime
      .sendMessage({
        type: 'sw:multiplex',
        prompt,
        providerIds,
        host: SayWhat.detect.currentHost(),
      })
      .then((result) => {
        if (!result) return;
        const parts = [];
        if (result.opened && result.opened.length) {
          parts.push(`Also sent to ${result.opened.join(', ')}`);
        }
        if (result.skipped && result.skipped.length) {
          parts.push(`could not reach ${result.skipped.join(', ')}`);
        }
        if (parts.length) SayWhat.ui.toast(parts.join(' — '), rect);
      })
      .catch(() => {});
  }

  function openPicker() {
    if (target && target.isConnected) {
      SayWhat.ui.showPill(targetRect(), appliedStyleName);
      SayWhat.ui.openPanel();
      return true;
    }
    if (lastFocused && lastFocused.isConnected && SayWhat.detect.editorKind(lastFocused)) {
      setTarget(lastFocused);
      SayWhat.ui.showPill(targetRect(), appliedStyleName);
      SayWhat.ui.openPanel();
      return true;
    }
    SayWhat.ui.toast('Click into a chat box first', null);
    return false;
  }

  /* ----------------------------------------------------------- listeners -- */

  function onInput(event) {
    if (!settings || !siteEnabled()) return;
    const path = event.composedPath ? event.composedPath() : [event.target];
    const el = path[0];
    if (!el || el.nodeType !== 1) return;
    if (SayWhat.ui.contains(el)) return;
    if (!SayWhat.detect.editorKind(el)) return;
    if (!decide(el)) return;
    setTarget(el);
  }

  function onFocusIn(event) {
    const path = event.composedPath ? event.composedPath() : [event.target];
    const el = path[0];
    if (!el || el.nodeType !== 1) return;
    if (SayWhat.ui.contains(el)) return;
    if (SayWhat.detect.editorKind(el)) lastFocused = el;
    if (target && el !== target && !SayWhat.ui.isOpen()) {
      /* Moved to a different composer entirely; re-evaluate on next keystroke. */
      if (SayWhat.detect.editorKind(el) && decide(el)) setTarget(el);
    }
  }

  function onPointerDown(event) {
    if (!SayWhat.ui.isOpen()) return;
    const path = event.composedPath ? event.composedPath() : [event.target];
    if (path.some((node) => node instanceof Element && SayWhat.ui.contains(node))) return;
    SayWhat.ui.closePanel();
  }

  function onKeyDown(event) {
    if (event.key === 'Escape' && SayWhat.ui.isOpen()) {
      event.stopPropagation();
      SayWhat.ui.closePanel();
      if (target && target.isConnected) target.focus();
    }
  }

  function attachListeners() {
    document.addEventListener('input', onInput, true);
    document.addEventListener('focusin', onFocusIn, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('scroll', scheduleReposition, { capture: true, passive: true });
    window.addEventListener('resize', scheduleReposition, { passive: true });
  }

  function handleMessage(message, _sender, sendResponse) {
    if (!message || !message.type) return undefined;

    if (message.type === 'sw:context') {
      sendResponse({
        host: SayWhat.detect.currentHost(),
        hasTarget: !!(target && target.isConnected),
        denied: SayWhat.detect.isDeniedSite() && !siteForced(),
      });
      return true;
    }

    if (message.type === 'sw:apply') {
      if (!target && lastFocused) setTarget(lastFocused);
      sendResponse({ ok: applyStyle(message.styleId) });
      return true;
    }

    if (message.type === 'sw:open-picker') {
      sendResponse({ ok: openPicker() });
      return true;
    }

    return undefined;
  }

  async function reloadSettings() {
    settings = await SayWhat.getSettings();
    generation += 1;
    SayWhat.ui.setSettings(settings);
    if (!siteEnabled()) clearTarget();
    else if (target) updatePill();
  }

  async function init() {
    settings = await SayWhat.getSettings();

    SayWhat.ui.init({
      onApply: applyStyle,
      onOpenOptions: () => chrome.runtime.sendMessage({ type: 'sw:open-options' }),
      onModifiersChange: (modifiers) => {
        settings.modifiers = modifiers;
        if (settings.rememberModifiers !== false) {
          SayWhat.setSettings({ modifiers }).catch(() => {});
        }
      },
      onClose: () => {
        if (target && target.isConnected) target.focus();
      },
    });
    SayWhat.ui.setSettings(settings);

    attachListeners();
    SayWhat.submit.watch({
      getTarget: () => (target && target.isConnected ? target : null),
      onSubmit: fanOut,
    });
    chrome.runtime.onMessage.addListener(handleMessage);
    SayWhat.onChanged(() => {
      reloadSettings().catch(() => {});
    });
  }

  init().catch((err) => console.warn('[Stylespec] failed to start', err));
})();
