/* Stylespec — the other assistants a prompt can be fanned out to.
 *
 * Loaded as a classic script in the content scripts, the options page and the
 * service worker (via importScripts), so it must not touch the DOM.
 *
 * Two ways to hand a prompt to another provider:
 *
 *   confirm  The provider reads the prompt out of the URL. We navigate, then
 *            press send only if the composer is still holding text, because
 *            some providers submit for you and some just fill the box.
 *   fill     The provider has no such URL. We open it and type into the
 *            composer ourselves, which needs a content script on that origin.
 *
 * `confirm` never inserts and `fill` never runs against a composer that
 * already has content, so neither can double-post.
 */
(function () {
  const SayWhat = (globalThis.SayWhat = globalThis.SayWhat || {});

  const PLACEHOLDER = '{prompt}';

  /* Past roughly this much text the providers start truncating the query
   * string. A silently shortened prompt is worse than a slower path, so the
   * worker downgrades to `fill` when it can. */
  const URL_CAP = 1800;

  /* Both of these are undocumented and have been in place since early 2024.
   * ChatGPT submits on load; Claude has been reported doing both. `confirm`
   * covers either behaviour without us having to know which. */
  const PROVIDERS = [
    {
      id: 'openai',
      name: 'ChatGPT',
      url: 'https://chatgpt.com/?q={prompt}',
    },
    {
      id: 'claude',
      name: 'Claude',
      url: 'https://claude.ai/new?q={prompt}',
    },
  ];

  function normalize(input) {
    if (!input) return '';
    return String(input).trim();
  }

  /**
   * Is the text sitting in a composer the prompt we sent it?
   *
   * Whitespace cannot be compared literally. A prompt with a style block is
   * multi-line, and rich editors turn each line into its own block element, so
   * `innerText` reads back a blank line wherever we sent a single newline.
   * Comparing on collapsed whitespace keeps the guarantee that matters — this
   * is our text and not something the user has started typing — without
   * depending on how a given editor models paragraphs.
   */
  function samePrompt(seen, want) {
    const flatten = (text) => String(text || '').replace(/\s+/g, ' ').trim();
    const a = flatten(seen);
    const b = flatten(want);
    if (!a || !b) return false;
    /* A prefix covers a provider that clipped a long prompt on the way in.
     * The floor keeps a stray word or two from counting as a match. */
    return a === b || (a.length >= 40 && b.startsWith(a));
  }

  /** Accepts a bare host, so a custom provider can be added as "example.com". */
  function toAbsolute(url) {
    const raw = normalize(url);
    if (!raw) return '';
    return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  }

  function providerHost(provider) {
    try {
      return new URL(toAbsolute(provider.url).replace(PLACEHOLDER, 'x')).hostname
        .replace(/^www\./, '')
        .toLowerCase();
    } catch {
      return '';
    }
  }

  /** The provider's page without the prompt query — where `fill` mode lands. */
  function baseUrl(provider) {
    const absolute = toAbsolute(provider.url);
    try {
      const url = new URL(absolute.replace(PLACEHOLDER, 'x'));
      return `${url.origin}${url.pathname}`;
    } catch {
      return absolute;
    }
  }

  function usesTemplate(provider) {
    return toAbsolute(provider.url).includes(PLACEHOLDER);
  }

  /** The provider's own URL carrying the prompt, whatever it names the param. */
  function templateUrl(provider, prompt) {
    return toAbsolute(provider.url).replace(PLACEHOLDER, encodeURIComponent(prompt));
  }

  /**
   * Where to send the browser for `prompt`, and what the new tab should do
   * once it gets there.
   */
  function buildTarget(provider, prompt) {
    if (!usesTemplate(provider)) return { url: baseUrl(provider), mode: 'fill' };
    if (encodeURIComponent(prompt).length > URL_CAP) {
      return { url: baseUrl(provider), mode: 'fill' };
    }
    return { url: templateUrl(provider, prompt), mode: 'confirm' };
  }

  /* Host half of a content-script match pattern. Whether a script will run on
   * a host is the question the multiplexer needs answered before it decides
   * between handing the prompt over in the URL and typing it in itself. */
  function hostMatchesPattern(host, pattern) {
    const match = /^[a-z*]+:\/\/([^/]+)/i.exec(pattern);
    if (!match) return false;
    const patternHost = match[1].toLowerCase();
    if (patternHost.startsWith('*.')) {
      const base = patternHost.slice(2);
      return host === base || host.endsWith(`.${base}`);
    }
    return host === patternHost;
  }

  function allProviders(settings) {
    const builtins = PROVIDERS.map((p) => Object.assign({}, p, { builtin: true }));
    const custom = ((settings && settings.customProviders) || [])
      .filter((p) => p && p.name && p.url)
      .map((p) => Object.assign({}, p, { builtin: false }));
    return builtins.concat(custom);
  }

  function resolveProvider(settings, id) {
    return allProviders(settings).find((p) => p.id === id) || null;
  }

  function newProviderId() {
    return 'provider-' + Math.random().toString(36).slice(2, 9);
  }

  SayWhat.PROVIDERS = PROVIDERS;
  SayWhat.PROMPT_PLACEHOLDER = PLACEHOLDER;
  SayWhat.PROMPT_URL_CAP = URL_CAP;
  SayWhat.allProviders = allProviders;
  SayWhat.resolveProvider = resolveProvider;
  SayWhat.providerHost = providerHost;
  SayWhat.hostMatchesPattern = hostMatchesPattern;
  SayWhat.samePrompt = samePrompt;
  SayWhat.providerBaseUrl = baseUrl;
  SayWhat.providerUsesTemplate = usesTemplate;
  SayWhat.providerTemplateUrl = templateUrl;
  SayWhat.buildProviderTarget = buildTarget;
  SayWhat.newProviderId = newProviderId;
})();
