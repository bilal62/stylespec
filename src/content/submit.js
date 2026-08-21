/* Stylespec — noticing that a prompt was sent, and sending one ourselves.
 *
 * There is no event for "the user submitted a prompt". Enter might insert a
 * newline, open a slash-command menu, or accept an IME candidate, and plenty of
 * composers want Cmd+Enter instead. So rather than trusting the keystroke, we
 * read the draft when a submit *looks* likely and then wait to see whether the
 * composer actually emptied. Only that counts as a send.
 *
 * The cost of a false positive here is a burst of unwanted tabs, so the check
 * errs towards missing a send rather than inventing one.
 */
(function () {
  const SayWhat = (globalThis.SayWhat = globalThis.SayWhat || {});

  const POLL_MS = 60;
  const CONFIRM_MS = 1500;

  const CONTROL_SELECTOR = 'button, [role="button"], input[type="submit"]';

  let pending = false;

  function isSubmitKey(event) {
    if (event.key !== 'Enter') return false;
    /* Shift+Enter is a newline everywhere. Alt+Enter is nothing. */
    if (event.shiftKey || event.altKey) return false;
    /* 229 is the keyCode browsers report while an IME candidate window is
     * open, where Enter accepts the candidate instead of sending. */
    if (event.isComposing || event.keyCode === 229) return false;
    return true;
  }

  function sendControlIn(path) {
    for (const node of path) {
      if (!(node instanceof Element)) continue;
      if (!node.matches || !node.matches(CONTROL_SELECTOR)) continue;
      if (SayWhat.detect.looksLikeSend(node)) return node;
    }
    return null;
  }

  function isDisabled(node) {
    return !!node.disabled || node.getAttribute('aria-disabled') === 'true';
  }

  /* The composer going empty is the signal. Polling rather than waiting a fixed
   * beat because apps clear it anywhere between the same frame and a few
   * hundred milliseconds later.
   *
   * Sometimes it is not cleared but replaced: ChatGPT's first message navigates
   * from / to /c/<id> and React can rebuild the composer. That is the most
   * common send there is, so falling back to "a fresh empty composer has taken
   * its place" matters. It has to be a composer that passes detection on its
   * own merits, or navigating to a page with a search box would qualify. */
  function confirmCleared(el, draft, onSubmit) {
    pending = true;
    const deadline = Date.now() + CONFIRM_MS;

    const done = (submitted) => {
      pending = false;
      if (submitted) onSubmit(draft);
    };

    const tick = () => {
      const gone = !el.isConnected;
      const replacement = gone ? SayWhat.detect.findComposer() : null;

      if (gone && replacement && SayWhat.insertText.isEmptyDraft(replacement)) {
        done(true);
        return;
      }
      if (!gone && SayWhat.insertText.isEmptyDraft(el)) {
        done(true);
        return;
      }
      if (Date.now() > deadline) {
        done(false);
        return;
      }
      setTimeout(tick, POLL_MS);
    };

    setTimeout(tick, POLL_MS);
  }

  /**
   * Calls `onSubmit(promptText)` once per confirmed send from the element
   * returned by `getTarget`.
   */
  function watch(options) {
    const getTarget = options.getTarget;
    const onSubmit = options.onSubmit;

    function attempt(el) {
      if (pending || !el || !el.isConnected) return;
      const draft = SayWhat.insertText.getDraft(el).trim();
      if (!draft) return;
      confirmCleared(el, draft, onSubmit);
    }

    function pathOf(event) {
      return event.composedPath ? event.composedPath() : [event.target];
    }

    document.addEventListener(
      'keydown',
      (event) => {
        if (!isSubmitKey(event)) return;
        const el = getTarget();
        if (!el) return;
        if (!pathOf(event).includes(el)) return;
        attempt(el);
      },
      true
    );

    document.addEventListener(
      'pointerdown',
      (event) => {
        const el = getTarget();
        if (!el) return;
        const path = pathOf(event);
        if (SayWhat.ui && SayWhat.ui.contains && SayWhat.ui.contains(path[0])) return;
        if (!sendControlIn(path)) return;
        attempt(el);
      },
      true
    );
  }

  /** Submit whatever is in `el`. Returns true if we found a way to try. */
  function pressSend(el) {
    const button = SayWhat.detect.findSendButton(el);
    if (button && !isDisabled(button)) {
      button.click();
      return true;
    }

    try {
      el.focus();
      const init = {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true,
      };
      el.dispatchEvent(new KeyboardEvent('keydown', init));
      el.dispatchEvent(new KeyboardEvent('keyup', init));
      return true;
    } catch {
      return false;
    }
  }

  SayWhat.submit = { watch, pressSend, isSubmitKey };
})();
