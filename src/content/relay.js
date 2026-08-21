/* Stylespec — the receiving half of the multiplexer.
 *
 * Runs on every page the content script covers and asks the worker whether
 * this tab was opened to carry a prompt. Almost always the answer is no.
 *
 * Two jobs, and the split matters because it is what makes double-posting
 * impossible:
 *
 *   confirm  The prompt travelled in the URL. Press send only if the composer
 *            is still holding text, so a provider that submits for itself gets
 *            left alone.
 *   fill     Type the prompt in ourselves, and only into an empty composer, so
 *            a second boot cannot append it twice.
 */
(function () {
  const SayWhat = globalThis.SayWhat;
  if (!SayWhat || !SayWhat.detect || !SayWhat.submit) return;

  const POLL_MS = 250;
  /* Assistants routinely take several seconds to render a composer behind auth
   * checks and code splitting, well past document_idle. Generous because these
   * tabs load in the background, where the browser throttles timers and the
   * poll interval stretches towards a second. */
  const COMPOSER_TIMEOUT_MS = 25000;
  /* Long enough for a provider that auto-submits to have cleared the box. */
  const SETTLE_MS = 800;
  const ENABLE_MS = 250;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  /* The user picked this provider by hand, so detection runs forced, the same
   * allowance the popup's "Turn it on here" gives. The score threshold still
   * applies, so we will not start typing into a site search box. */
  function findComposer() {
    return SayWhat.detect.findComposer({ forced: true });
  }

  async function waitFor(predicate) {
    const deadline = Date.now() + COMPOSER_TIMEOUT_MS;
    for (;;) {
      const value = predicate();
      if (value) return value;
      if (Date.now() > deadline) return null;
      await sleep(POLL_MS);
    }
  }

  function holdsPrompt(el, prompt) {
    return !!el && SayWhat.samePrompt(SayWhat.insertText.getDraft(el), prompt);
  }

  function emptyComposer() {
    const el = findComposer();
    return el && SayWhat.insertText.isEmptyDraft(el) ? el : null;
  }

  /* Matching the exact prompt rather than "there is some text here" is what
   * makes this safe to leave running in a background tab. If the provider
   * submitted the prompt itself and the user then switched over and started
   * typing, pressing send on whatever they had got half-written would be a
   * genuinely bad outcome. */
  async function runConfirm(prompt) {
    const el = await waitFor(() => {
      const composer = findComposer();
      return holdsPrompt(composer, prompt) ? composer : null;
    });
    /* The prompt never showed up in the box, so the provider submitted it on
     * arrival. Nothing left to do. */
    if (!el) return;

    await sleep(SETTLE_MS);
    if (!el.isConnected || !holdsPrompt(el, prompt)) return;
    if (!SayWhat.submit.pressSend(el)) {
      console.warn('[Stylespec] found the prompt but could not submit it');
    }
  }

  async function runFill(prompt) {
    const el = await waitFor(emptyComposer);
    if (!el) return false;
    if (!SayWhat.insertText.insert(el, prompt, 'append')) return false;

    /* Send is usually disabled until the app has processed the input event. */
    await sleep(ENABLE_MS);
    if (!el.isConnected || SayWhat.insertText.isEmptyDraft(el)) return true;
    SayWhat.submit.pressSend(el);
    return true;
  }

  async function main() {
    let job = null;
    try {
      const response = await chrome.runtime.sendMessage({ type: 'sw:claim-relay' });
      job = response && response.job;
    } catch {
      return;
    }
    if (!job || !job.prompt) return;

    /* Bounced to a login domain. Leave the job unclaimed so the boot that
     * happens after signing in can still pick it up. */
    if (job.host && job.host !== SayWhat.detect.currentHost()) return;

    if (job.mode === 'fill') {
      if (!(await runFill(job.prompt))) return;
    } else {
      await runConfirm(job.prompt);
    }

    chrome.runtime.sendMessage({ type: 'sw:relay-done' }).catch(() => {});
  }

  /* Loud on purpose. Everything here happens in a tab the user is not looking
   * at, so a silent give-up is indistinguishable from the feature not existing. */
  main().catch((err) => console.warn('[Stylespec] relay failed', err));
})();
