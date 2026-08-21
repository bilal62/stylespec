/* Stylespec — background service worker.
 *
 * The content script is declared only for assistants we know by name, which
 * keeps the install warning specific and the store review short. Everything
 * else is opt-in: the user grants a single origin from the popup, and this
 * worker registers a content script for it that persists across sessions.
 */

importScripts('/src/shared/providers.js');

const MANIFEST_SCRIPTS = chrome.runtime.getManifest().content_scripts[0];
const CONTENT_FILES = MANIFEST_SCRIPTS.js;
const DECLARED_MATCHES = MANIFEST_SCRIPTS.matches;
const FORCED_PREFIX = 'forced:';

const scriptId = (host) => `${FORCED_PREFIX}${host}`;
const originPattern = (host) => `*://${host}/*`;

/* Injects into a tab we can already reach — either because a permission was
 * just granted, or because activeTab was handed to us by a user gesture. */
async function injectNow(tabId) {
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: CONTENT_FILES });
    return true;
  } catch {
    /* Restricted page: the web store, chrome://, a PDF viewer. */
    return false;
  }
}

async function registeredHosts() {
  try {
    const scripts = await chrome.scripting.getRegisteredContentScripts();
    return new Set(
      scripts
        .filter((s) => s.id.startsWith(FORCED_PREFIX))
        .map((s) => s.id.slice(FORCED_PREFIX.length))
    );
  } catch {
    return new Set();
  }
}

async function register(host) {
  if (!(await registeredHosts()).has(host)) {
    try {
      await chrome.scripting.registerContentScripts([
        {
          id: scriptId(host),
          matches: [originPattern(host)],
          js: CONTENT_FILES,
          runAt: 'document_idle',
          allFrames: false,
          persistAcrossSessions: true,
        },
      ]);
    } catch (err) {
      console.warn('[Stylespec] could not register', host, err);
      return;
    }
  }

  /* Registration only affects future loads, and the tab the user is looking at
   * is already loaded. Chrome also tends to close the popup to show the
   * permission prompt, so this often runs with nobody left to ask. */
  try {
    const tabs = await chrome.tabs.query({ url: originPattern(host) });
    await Promise.all(tabs.filter((t) => t.id != null).map((t) => injectNow(t.id)));
  } catch {
    /* Nothing open on that host. */
  }
}

async function unregister(host) {
  try {
    await chrome.scripting.unregisterContentScripts({ ids: [scriptId(host)] });
  } catch {
    /* Already gone. */
  }
}

/* Registrations, granted origins and the stored site list drift apart whenever
 * one of them changes while the worker is asleep — a permission revoked from
 * chrome://extensions, or forceSites arriving over storage sync from another
 * machine. Settle all three against each other. */
async function reconcile() {
  const stored = await chrome.storage.sync.get('forceSites');
  const wanted = new Set(stored.forceSites || []);
  const registered = await registeredHosts();

  for (const host of registered) {
    if (!wanted.has(host)) await unregister(host);
  }

  for (const host of wanted) {
    if (registered.has(host)) continue;
    const granted = await chrome.permissions.contains({ origins: [originPattern(host)] });
    if (granted) await register(host);
  }
}

chrome.runtime.onStartup.addListener(reconcile);
chrome.runtime.onInstalled.addListener((details) => {
  reconcile();
  if (details.reason === 'install') chrome.runtime.openOptionsPage();
});
chrome.permissions.onAdded.addListener(reconcile);
chrome.permissions.onRemoved.addListener(reconcile);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.forceSites) reconcile();
});

/* ---------------------------------------------------------- multiplexer -- */

/* Relay instructions for tabs we are about to open. Kept in session storage
 * rather than a worker variable because the worker is very likely to be torn
 * down between opening the tab and that tab's content script asking for its
 * job. Jobs are keyed by tab id and expire, so a stale one cannot fire against
 * a later navigation in a recycled tab. */
const RELAY_KEY = 'relayJobs';
const RELAY_TTL_MS = 90000;

async function readJobs() {
  try {
    const stored = await chrome.storage.session.get(RELAY_KEY);
    const jobs = stored[RELAY_KEY] || {};
    const now = Date.now();
    const live = {};
    for (const [tabId, job] of Object.entries(jobs)) {
      if (now - job.at < RELAY_TTL_MS) live[tabId] = job;
    }
    return live;
  } catch {
    return {};
  }
}

async function writeJobs(jobs) {
  try {
    await chrome.storage.session.set({ [RELAY_KEY]: jobs });
  } catch {
    /* Session storage is unavailable; direct-URL providers still work. */
  }
}

/* Asking chrome.permissions is the wrong question here: what matters is
 * whether a content script will actually run on that host, which is true for
 * a declared match and for anything the user has granted from the popup. */
async function canInject(host) {
  if (DECLARED_MATCHES.some((pattern) => SayWhat.hostMatchesPattern(host, pattern))) return true;
  return (await registeredHosts()).has(host);
}

/**
 * Decides how each provider should receive the prompt. Returns one entry per
 * provider we can actually reach, plus the names we had to skip.
 */
async function planFanOut(providers, prompt, sourceHost) {
  const plans = [];
  const skipped = [];

  for (const provider of providers) {
    const host = SayWhat.providerHost(provider);
    /* Opening a second tab of the assistant you are already talking to is
     * never what "also send this elsewhere" meant. */
    if (!host || host === sourceHost) continue;

    const injectable = await canInject(host);
    const target = SayWhat.buildProviderTarget(provider, prompt);

    if (target.mode === 'fill' && !injectable) {
      /* A provider with a template can still take the prompt through the URL,
       * even if we only downgraded to fill because the prompt is long enough
       * to risk truncation. Without a template there is nothing to try. */
      if (!SayWhat.providerUsesTemplate(provider)) {
        skipped.push(provider.name);
        continue;
      }
      plans.push({
        name: provider.name,
        host,
        url: SayWhat.providerTemplateUrl(provider, prompt),
        job: null,
      });
      continue;
    }

    plans.push({
      name: provider.name,
      host,
      url: target.url,
      /* Without a content script there is no one to run the job, but a
       * `confirm` target can still submit itself from the URL. */
      job: injectable ? { prompt, mode: target.mode, host } : null,
    });
  }

  return { plans, skipped };
}

async function fanOut(sourceTab, prompt, providerIds, sourceHost) {
  const stored = await chrome.storage.sync.get('customProviders');
  const providers = SayWhat.allProviders(stored)
    .filter((p) => providerIds.includes(p.id))
    /* Selection order, so the tabs land left to right in the order picked. */
    .sort((a, b) => providerIds.indexOf(a.id) - providerIds.indexOf(b.id));

  const { plans, skipped } = await planFanOut(providers, prompt, sourceHost);
  const jobs = await readJobs();
  const opened = [];

  /* Sequential rather than Promise.all: the index is what puts these to the
   * right of the source tab in order, and parallel creates race each other. */
  for (let i = 0; i < plans.length; i += 1) {
    const plan = plans[i];
    try {
      const tab = await chrome.tabs.create({
        url: plan.url,
        active: false,
        index: sourceTab.index + 1 + i,
        openerTabId: sourceTab.id,
      });
      if (plan.job && tab.id != null) jobs[tab.id] = Object.assign({ at: Date.now() }, plan.job);
      opened.push(plan.name);
    } catch (err) {
      console.warn('[Stylespec] could not open', plan.url, err);
      skipped.push(plan.name);
    }
  }

  await writeJobs(jobs);
  return { opened, skipped };
}

/* Running the command is a user gesture, so activeTab lets the picker open on
 * any page the user asks for, including ones never granted a permission. */
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'open-picker') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || tab.id == null) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'sw:open-picker' });
  } catch {
    if (await injectNow(tab.id)) {
      try {
        await chrome.tabs.sendMessage(tab.id, { type: 'sw:open-picker' });
      } catch {
        /* Injected but not ready; the next press will find it. */
      }
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message) return undefined;

  if (message.type === 'sw:open-options') {
    chrome.runtime.openOptionsPage();
    sendResponse({ ok: true });
    return true;
  }

  if (message.type === 'sw:enable-site') {
    (async () => {
      await register(message.host);
      const injected = message.tabId != null ? await injectNow(message.tabId) : false;
      sendResponse({ ok: true, injected });
    })();
    return true;
  }

  if (message.type === 'sw:disable-site') {
    (async () => {
      await unregister(message.host);
      sendResponse({ ok: true });
    })();
    return true;
  }

  if (message.type === 'sw:inject') {
    (async () => sendResponse({ ok: await injectNow(message.tabId) }))();
    return true;
  }

  if (message.type === 'sw:multiplex') {
    (async () => {
      const tab = sender.tab;
      if (!tab || tab.id == null || !message.prompt) {
        sendResponse({ opened: [], skipped: [] });
        return;
      }
      sendResponse(await fanOut(tab, message.prompt, message.providerIds || [], message.host));
    })();
    return true;
  }

  /* Claiming does not consume the job. A provider that bounces through a login
   * screen boots the content script more than once, and the run that finally
   * lands on the composer is the one that matters. */
  if (message.type === 'sw:claim-relay') {
    (async () => {
      const tabId = sender.tab && sender.tab.id;
      const jobs = await readJobs();
      await writeJobs(jobs);
      sendResponse({ job: (tabId != null && jobs[tabId]) || null });
    })();
    return true;
  }

  if (message.type === 'sw:relay-done') {
    (async () => {
      const tabId = sender.tab && sender.tab.id;
      const jobs = await readJobs();
      if (tabId != null) delete jobs[tabId];
      await writeJobs(jobs);
      sendResponse({ ok: true });
    })();
    return true;
  }

  return undefined;
});
