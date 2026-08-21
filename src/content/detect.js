/* Stylespec — decide whether an element is an AI chat composer.
 *
 * Site-specific selectors for ChatGPT, Claude and friends rot within weeks, so
 * scoring is heuristic-first: adapters can only boost confidence, never gate it.
 * That way self-hosted and unknown AI UIs work out of the box too.
 */
(function () {
  const SayWhat = (globalThis.SayWhat = globalThis.SayWhat || {});

  const THRESHOLD = 8;

  const STRONG_HINT_RE =
    /(ask (me|anything|a question|about|follow)|message\s|send a message|type (a|your) (message|prompt)|enter a prompt|your prompt|chat with|talk to|how can i help|what (do you want to know|can i help|would you like)|reply to|write a (message|reply)|ask (anything|away))/i;
  const WEAK_HINT_RE = /\b(ask|message|prompt|chat|reply|compose|conversation)\b/i;
  const AI_HINT_RE =
    /\b(ai|a\.i\.|gpt|chatgpt|claude|gemini|copilot|assistant|llm|bot|grok|perplexity|mistral|deepseek|llama|qwen|openai|anthropic)\b/i;
  const NEGATIVE_RE =
    /\b(search|find|filter|url|e-?mail|username|user name|password|phone|zip|postcode|postal|address|card number|coupon|promo|subject|first name|last name|caption|tags?)\b/i;
  /* Deliberately excludes "submit": it is the standard label on ordinary web
   * forms and rare on chat composers, which say "Send" or use an icon. */
  const SEND_RE = /\b(send|ask|generate|run)\b/i;

  const KNOWN_EDITOR_SELECTOR =
    '.ProseMirror, .ql-editor, [data-lexical-editor], [data-slate-editor], [data-testid*="composer" i]';

  /* Hosts whose chat boxes are real chats but not AI chats. Detection is
   * suppressed here unless the path matches `unless`, or the user force-enables
   * the site from the popup. */
  const NON_AI_HOSTS = [
    { host: /(^|\.)discord\.com$/ },
    { host: /(^|\.)slack\.com$/ },
    { host: /(^|\.)whatsapp\.com$/ },
    { host: /(^|\.)telegram\.org$/ },
    { host: /(^|\.)messenger\.com$/ },
    { host: /(^|\.)facebook\.com$/ },
    { host: /(^|\.)instagram\.com$/ },
    { host: /(^|\.)teams\.(microsoft|live)\.com$/ },
    { host: /(^|\.)mail\.google\.com$/ },
    { host: /(^|\.)outlook\.(com|office\.com|live\.com)$/ },
    { host: /(^|\.)linkedin\.com$/ },
    { host: /(^|\.)reddit\.com$/ },
    { host: /(^|\.)(twitter|x)\.com$/, unless: /^\/i\/grok/ },
    { host: /(^|\.)github\.com$/, unless: /copilot/i },
    { host: /(^|\.)notion\.so$/ },
    { host: /(^|\.)zoom\.us$/ },
  ];

  /* Hints only. A missing or stale selector costs nothing; the heuristic still runs. */
  const ADAPTERS = [
    { host: /(^|\.)(chatgpt\.com|chat\.openai\.com)$/, selector: '#prompt-textarea, div[contenteditable="true"].ProseMirror' },
    { host: /(^|\.)claude\.ai$/, selector: 'div[contenteditable="true"].ProseMirror' },
    { host: /(^|\.)gemini\.google\.com$/, selector: 'rich-textarea div.ql-editor[contenteditable="true"]' },
    { host: /(^|\.)aistudio\.google\.com$/, selector: 'textarea' },
    { host: /(^|\.)notebooklm\.google\.com$/, selector: 'textarea' },
    { host: /(^|\.)perplexity\.ai$/, selector: '#ask-input, textarea[placeholder], div[contenteditable="true"]' },
    { host: /(^|\.)grok\.com$/, selector: 'textarea' },
    { host: /(^|\.)(twitter|x)\.com$/, path: /^\/i\/grok/, selector: 'textarea, div[contenteditable="true"]' },
    { host: /(^|\.)copilot\.microsoft\.com$/, selector: 'textarea#userInput, textarea' },
    { host: /(^|\.)bing\.com$/, path: /^\/chat/, selector: 'textarea' },
    { host: /(^|\.)chat\.deepseek\.com$/, selector: 'textarea#chat-input, textarea' },
    { host: /(^|\.)chat\.mistral\.ai$/, selector: 'textarea, div[contenteditable="true"]' },
    { host: /(^|\.)poe\.com$/, selector: 'textarea' },
    { host: /(^|\.)meta\.ai$/, selector: 'div[contenteditable="true"]' },
    { host: /(^|\.)t3\.chat$/, selector: 'textarea' },
    { host: /(^|\.)openrouter\.ai$/, selector: 'textarea' },
    { host: /(^|\.)huggingface\.co$/, path: /^\/chat/, selector: 'textarea' },
    { host: /(^|\.)you\.com$/, selector: 'textarea, div[contenteditable="true"]' },
    { host: /(^|\.)phind\.com$/, selector: 'textarea' },
    { host: /(^|\.)kimi\.(com|moonshot\.cn)$/, selector: 'div[contenteditable="true"], textarea' },
    { host: /(^|\.)(chat\.)?qwen\.ai$/, selector: 'textarea, div[contenteditable="true"]' },
    { host: /(^|\.)groq\.com$/, selector: 'textarea' },
    { host: /(^|\.)togetherai\.link$|(^|\.)together\.ai$/, selector: 'textarea' },
    { host: /(^|\.)lmarena\.ai$|(^|\.)chat\.lmsys\.org$/, selector: 'textarea' },
    { host: /(^|\.)openwebui\.com$|(^|\.)open-webui\./, selector: '#chat-input, textarea' },
    { host: /(^|\.)librechat\.ai$/, selector: 'textarea' },
  ];

  function currentHost() {
    return location.hostname.replace(/^www\./, '').toLowerCase();
  }

  const META_NAMES = ['description', 'application-name', 'og:site_name', 'og:title'];

  /* Controls that only a conversation UI offers. Asking what a page *does* beats
   * asking what it calls itself: plenty of AI products never print the word "AI"
   * anywhere a machine can find it, but every one of them lets you send a
   * message and start a new chat. Matched against the accessible names of
   * controls only, never body text, so an article about chatbots stays inert. */
  /* Every entry has to be near-worthless outside a conversation UI. "Send
   * message" was here and had to go: it is the most common label on a contact
   * form's submit button, which is precisely the page this gate exists to keep
   * out. */
  const CHAT_UI_RE =
    /\b(stop generating|stop responding|regenerate|new chat|new conversation|clear conversation|chat history|search chats|jump to latest)\b/i;

  const CONTROL_SELECTOR = 'button, [role="button"], a[href]';
  const CONTROL_LIMIT = 150;

  let pageEvidence = null;

  /* Cached per URL, because both halves walk the document and the answer only
   * changes on navigation. The title is part of the key because single-page apps
   * rewrite it long after load, often without touching the path. */
  function pageLooksAI() {
    const key = `${currentHost()}${location.pathname}\n${document.title}`;
    if (pageEvidence && pageEvidence.key === key) return pageEvidence.value;

    const described = [document.title];
    for (const name of META_NAMES) {
      const node = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
      if (node) described.push(node.getAttribute('content'));
    }

    let value = AI_HINT_RE.test(described.filter(Boolean).join(' ').slice(0, 600));

    if (!value) {
      const controls = document.querySelectorAll(CONTROL_SELECTOR);
      const count = Math.min(controls.length, CONTROL_LIMIT);
      for (let i = 0; i < count; i += 1) {
        const control = controls[i];
        const label = [
          control.getAttribute('aria-label'),
          control.getAttribute('title'),
          control.textContent,
        ]
          .filter(Boolean)
          .join(' ')
          .slice(0, 80);
        if (CHAT_UI_RE.test(label)) {
          value = true;
          break;
        }
      }
    }

    pageEvidence = { key, value };
    return value;
  }

  const FIELD_TYPES = ['text', 'email', 'tel', 'url', 'number'];

  function isDataEntryField(node) {
    if (node.tagName === 'SELECT') return true;
    return FIELD_TYPES.includes((node.getAttribute('type') || 'text').toLowerCase());
  }

  /* A contact form is the one thing that really does look like a composer: a
   * multi-line box with a button. What separates them is company. A contact form
   * stands among name, email and subject fields; a chat composer stands alone.
   *
   * The enclosing <form> is the reliable boundary when there is one, but plenty
   * of contact sections are built from plain divs, so fall back to walking a few
   * ancestors. Three levels stays inside the composer panel on every AI UI
   * checked, and still reaches the sibling fields of a div-built form. */
  function hasFormNeighbours(el) {
    const scopes = [];
    const form = el.closest && el.closest('form');
    if (form) {
      scopes.push(form);
    } else {
      let node = el;
      for (let depth = 0; depth < 3 && node.parentElement; depth += 1) {
        node = node.parentElement;
        scopes.push(node);
      }
    }
    for (const scope of scopes) {
      for (const node of scope.querySelectorAll('input, select')) {
        if (isDataEntryField(node)) return true;
      }
    }
    return false;
  }

  /* The shape of a chat composer: a multi-line box spanning a good part of the
   * window with a send control beside it, keeping its own company.
   *
   * Deliberately says nothing about vertical position. Composers do sit at the
   * bottom once a conversation is going, but the empty state of most assistants
   * — ChatGPT's included — centres them, and that empty state is exactly when
   * someone tries this extension for the first time. */
  function hasComposerShape(el, kind, sendButton) {
    if (kind !== 'textarea' && kind !== 'contenteditable') return false;
    if (!sendButton) return false;
    if (inLoginForm(el) || inChrome(el) || hasFormNeighbours(el)) return false;
    return el.getBoundingClientRect().width > window.innerWidth * 0.28;
  }

  function siteAdapter() {
    const host = currentHost();
    const path = location.pathname;
    return (
      ADAPTERS.find((a) => a.host.test(host) && (!a.path || a.path.test(path))) || null
    );
  }

  function isDeniedSite() {
    const host = currentHost();
    const path = location.pathname;
    const rule = NON_AI_HOSTS.find((r) => r.host.test(host));
    if (!rule) return false;
    if (rule.unless && rule.unless.test(path)) return false;
    return true;
  }

  function editorKind(el) {
    if (!el || el.nodeType !== 1) return null;
    const tag = el.tagName;
    if (tag === 'TEXTAREA') return 'textarea';
    if (tag === 'INPUT') {
      const type = (el.getAttribute('type') || 'text').toLowerCase();
      return type === 'text' || type === 'search' ? 'input' : null;
    }
    if (el.isContentEditable) return 'contenteditable';
    return null;
  }

  function isVisible(el) {
    const rect = el.getBoundingClientRect();
    if (rect.width < 80 || rect.height < 18) return false;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    if (parseFloat(cs.opacity || '1') < 0.1) return false;
    return true;
  }

  /** Every scrap of text that describes what the field is for. */
  function hintText(el) {
    const parts = [
      el.getAttribute('placeholder'),
      el.getAttribute('aria-label'),
      el.getAttribute('aria-placeholder'),
      el.getAttribute('data-placeholder'),
      el.getAttribute('title'),
      el.getAttribute('name'),
      el.id,
    ];

    const labelledBy = el.getAttribute('aria-labelledby');
    if (labelledBy) {
      for (const id of labelledBy.split(/\s+/)) {
        const node = document.getElementById(id);
        if (node) parts.push(node.textContent);
      }
    }

    /* Rich editors render the placeholder on an inner node. */
    const inner = el.querySelector && el.querySelector('[data-placeholder], [aria-placeholder]');
    if (inner) {
      parts.push(inner.getAttribute('data-placeholder'), inner.getAttribute('aria-placeholder'));
    }

    return parts.filter(Boolean).join(' ').slice(0, 400);
  }

  function looksLikeSend(btn) {
    const testid = btn.getAttribute('data-testid') || '';
    if (/send|submit/i.test(testid)) return true;
    const label = [btn.getAttribute('aria-label'), btn.getAttribute('title'), btn.textContent]
      .filter(Boolean)
      .join(' ')
      .slice(0, 120);
    return SEND_RE.test(label);
  }

  /* Walks outward from the composer because the send button is a sibling of it
   * far more often than a descendant. Returns the button so the multiplexer can
   * press it, not just count it. */
  function findSendButton(el) {
    let node = el;
    for (let depth = 0; depth < 6 && node; depth += 1) {
      node = node.parentElement;
      if (!node) break;
      const buttons = node.querySelectorAll('button, [role="button"], input[type="submit"]');
      if (buttons.length > 24) continue;
      for (const btn of buttons) {
        if (looksLikeSend(btn)) return btn;
      }
    }
    return null;
  }

  function hasSendButton(el) {
    return !!findSendButton(el);
  }

  function inLoginForm(el) {
    const form = el.closest && el.closest('form');
    if (!form) return false;
    return !!form.querySelector('input[type="password"], input[type="email"]');
  }

  function inChrome(el) {
    return !!(el.closest && el.closest('header, nav, [role="banner"], [role="navigation"]'));
  }

  function score(el, options) {
    const opts = options || {};
    const kind = editorKind(el);
    if (!kind) return { kind: null, score: -Infinity, aiEvidence: false };
    if (el.disabled || el.readOnly) return { kind, score: -Infinity, aiEvidence: false };
    if (!isVisible(el)) return { kind, score: -Infinity, aiEvidence: false };

    const adapter = siteAdapter();
    const hint = hintText(el);

    const strong = STRONG_HINT_RE.test(hint);
    const weak = WEAK_HINT_RE.test(hint);
    const aiish = AI_HINT_RE.test(`${hint} ${currentHost()}`) || pageLooksAI();
    const adapterMatch = !!adapter && (!adapter.selector || safeMatches(el, adapter.selector));
    const sendButton = hasSendButton(el);
    const composer = hasComposerShape(el, kind, sendButton);

    let denied = isDeniedSite();
    if (denied && opts.forced) denied = false;
    const aiEvidence =
      opts.forced || (!denied && (adapterMatch || strong || aiish || composer));

    let value = 0;
    if (kind === 'contenteditable' || kind === 'textarea') value += 3;

    if (strong) value += 5;
    else if (weak) value += 2;
    if (!strong && NEGATIVE_RE.test(hint)) value -= 4;

    if (aiish) value += 2;
    if (adapter) value += 3;
    if (adapterMatch) value += 5;

    if (sendButton) value += 3;
    if (composer) value += 2;
    if (el.getAttribute('role') === 'textbox') value += 1;
    if (safeMatches(el, KNOWN_EDITOR_SELECTOR)) value += 2;
    if (/^(send|enter|go)$/i.test(el.getAttribute('enterkeyhint') || '')) value += 2;

    const rect = el.getBoundingClientRect();
    if (rect.bottom > window.innerHeight * 0.5) value += 2;
    if (rect.width > window.innerWidth * 0.3) value += 1;

    if (inLoginForm(el)) value -= 5;
    if (inChrome(el)) value -= 3;
    /* Company matters as much for scoring as it does for the evidence gate: a
     * box surrounded by name and email fields is a form field, however chat-like
     * it looks on its own. Catches the contact page of an AI company, which
     * otherwise collects enough points from the hostname alone. */
    if (hasFormNeighbours(el)) value -= 3;

    const maxLength = parseInt(el.getAttribute('maxlength') || '0', 10);
    if (maxLength > 0 && maxLength < 200) value -= 3;

    return { kind, score: value, aiEvidence, adapter, hint };
  }

  function safeMatches(el, selector) {
    try {
      return el.matches(selector);
    } catch {
      return false;
    }
  }

  function isChatInput(el, options) {
    const result = score(el, options);
    return result.aiEvidence && result.score >= THRESHOLD;
  }

  const CANDIDATE_SELECTOR =
    'textarea, input[type="text"], input[type="search"], [contenteditable="true"], [contenteditable=""]';

  /**
   * The most chat-like composer on the page, or null. querySelectorAll does not
   * cross shadow boundaries, so our own picker is out of reach by construction.
   */
  function findComposer(options) {
    let best = null;
    let bestScore = -Infinity;
    for (const el of document.querySelectorAll(CANDIDATE_SELECTOR)) {
      if (!editorKind(el)) continue;
      if (!isVisible(el)) continue;
      const result = score(el, options);
      if (!result.aiEvidence || result.score <= bestScore) continue;
      bestScore = result.score;
      best = el;
    }
    return bestScore >= THRESHOLD ? best : null;
  }

  SayWhat.detect = {
    THRESHOLD,
    editorKind,
    isVisible,
    hintText,
    score,
    isChatInput,
    findComposer,
    looksLikeSend,
    findSendButton,
    siteAdapter,
    isDeniedSite,
    currentHost,
  };
})();
