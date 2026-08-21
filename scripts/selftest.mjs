/* Stylespec — dependency-free sanity checks.
 *
 * Syntax-checks every script, confirms manifest.json points at files that
 * exist, and exercises the preset/compose/storage logic in a bare VM context.
 *
 * Usage: node scripts/selftest.mjs
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import { expected as expectedCssBundle } from './build-css.mjs';
import { installDom, node } from './dom-stub.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const failures = [];
let checks = 0;

function check(label, condition, detail) {
  checks += 1;
  if (!condition) failures.push(detail ? `${label} — ${detail}` : label);
}

function heading(text) {
  process.stdout.write(`\n${text}\n`);
}

/* ------------------------------------------------------------- manifest --- */

heading('manifest');

const manifest = JSON.parse(readFileSync(path.join(root, 'manifest.json'), 'utf8'));
check('manifest_version is 3', manifest.manifest_version === 3);
/* The permission set is a launch-critical constraint, not a detail. A content
 * script on <all_urls> triggers an in-depth store review and shows the worst
 * possible install warning, so broad access has to stay optional and
 * user-granted. */
check(
  'requests only storage, activeTab and scripting',
  JSON.stringify(manifest.permissions) === '["storage","activeTab","scripting"]',
  JSON.stringify(manifest.permissions)
);
check('declares no mandatory host_permissions', !manifest.host_permissions);
check(
  'broad access is optional',
  JSON.stringify(manifest.optional_host_permissions) === '["<all_urls>"]',
  JSON.stringify(manifest.optional_host_permissions)
);

const staticMatches = manifest.content_scripts.flatMap((cs) => cs.matches);
check(
  'no content script matches every site',
  !staticMatches.some((m) => m === '<all_urls>' || /^\*:\/\/\*\/|^https?:\/\/\*\//.test(m)),
  staticMatches.filter((m) => m.includes('://*/')).join(' ')
);

const referenced = [
  ...Object.values(manifest.icons),
  ...Object.values(manifest.action.default_icon),
  manifest.action.default_popup,
  manifest.options_ui.page,
  manifest.background.service_worker,
  ...manifest.content_scripts.flatMap((cs) => [...(cs.js || []), ...(cs.css || [])]),
  ...(manifest.web_accessible_resources || []).flatMap((war) => war.resources),
];

for (const rel of referenced) {
  check(`exists: ${rel}`, existsSync(path.join(root, rel)));
}

check('has the open-picker command', !!manifest.commands['open-picker']);

/* These are plain scripts sharing one global, and some of them read that
 * global at load time rather than on demand. relay.js bails out entirely if
 * detect or submit is missing, so getting the order wrong here silently
 * disables the multiplexer instead of throwing. */
const contentFiles = manifest.content_scripts[0].js;
for (const [dependent, dependency] of [
  ['src/content/relay.js', 'src/content/detect.js'],
  ['src/content/relay.js', 'src/content/submit.js'],
  ['src/content/relay.js', 'src/content/ui.js'],
  ['src/content/ui.js', 'src/shared/providers.js'],
  ['src/content/index.js', 'src/content/submit.js'],
]) {
  const at = contentFiles.indexOf(dependency);
  check(
    `${path.basename(dependent)} loads after ${path.basename(dependency)}`,
    at >= 0 && contentFiles.indexOf(dependent) > at
  );
}

/* The browser harness loads the real content scripts by hand, so it silently
 * rots into a crash the moment a new one is added to the manifest. */
const harness = readFileSync(path.join(root, 'scripts/ui-harness.html'), 'utf8');
for (const rel of contentFiles) {
  check(`ui-harness loads ${path.basename(rel)}`, harness.includes(`"../${rel}"`));
}

/* --------------------------------------------------------------- syntax --- */

heading('syntax');

/* Derived from the manifest so a newly added content script cannot slip in
 * unchecked, plus the surfaces the manifest does not enumerate. */
const scripts = [
  ...new Set([
    ...manifest.content_scripts.flatMap((cs) => cs.js || []),
    'src/shared/theme.js',
    'src/options/options.js',
    'src/popup/popup.js',
    manifest.background.service_worker,
  ]),
];

for (const rel of scripts) {
  try {
    execFileSync(process.execPath, ['--check', path.join(root, rel)], { stdio: 'pipe' });
    check(`parses: ${rel}`, true);
  } catch (err) {
    check(`parses: ${rel}`, false, String(err.stderr || err.message).split('\n')[1] || '');
  }
}

/* ------------------------------------------------------------ css bundle -- */

heading('css bundle');

const bundlePath = path.join(root, 'src/content/ui.css.js');
check(
  'ui.css.js matches ui.css',
  readFileSync(bundlePath, 'utf8') === expectedCssBundle(),
  'run: node scripts/build-css.mjs'
);

const cssSandbox = { globalThis: null };
cssSandbox.globalThis = cssSandbox;
vm.createContext(cssSandbox);
vm.runInContext(readFileSync(bundlePath, 'utf8'), cssSandbox, { filename: 'ui.css.js' });
check('bundle exposes the stylesheet', typeof cssSandbox.SayWhat.UI_CSS === 'string');
check('stylesheet carries the pill rules', cssSandbox.SayWhat.UI_CSS.includes('.sw-pill'));
check(
  'stylesheet survives escaping intact',
  cssSandbox.SayWhat.UI_CSS === readFileSync(path.join(root, 'src/content/ui.css'), 'utf8')
);

/* The picker must not depend on a runtime fetch: strict-CSP sites block it. */
const uiSource = readFileSync(path.join(root, 'src/content/ui.js'), 'utf8');
check('picker does not fetch its stylesheet', !uiSource.includes('fetch('));
check('picker uses a constructed stylesheet', uiSource.includes('adoptedStyleSheets'));
check('manifest needs no web-accessible resources', !manifest.web_accessible_resources);

/* --------------------------------------------------------------- theming -- */

heading('theming');

const uiCss = readFileSync(path.join(root, 'src/content/ui.css'), 'utf8');

/* The button reset uses `color: inherit` and outranks .sw-pill on specificity,
 * so the root must carry a colour or every control renders :host's initial
 * black — invisible on the dark palette. This was a real bug; keep it fixed. */
const rootBlock = uiCss.slice(uiCss.indexOf('.sw-root {'), uiCss.indexOf('.sw-root[data-theme'));
check('picker root sets a foreground colour', /\n\s*color:\s*var\(--sw-fg\)/.test(rootBlock));

for (const [label, file] of [
  ['picker', 'src/content/ui.css'],
  ['options', 'src/options/options.css'],
  ['popup', 'src/popup/popup.css'],
]) {
  const css = readFileSync(path.join(root, file), 'utf8');
  check(`${label} has an explicit dark palette`, css.includes("[data-theme='dark']"));
  check(`${label} still follows the system on auto`, css.includes("[data-theme='auto']"));
  check(`${label} sets color-scheme`, css.includes('color-scheme:'));
  /* An unthemed hard-coded colour is how the unreadable pill happened. */
  check(
    `${label} routes surface colours through variables`,
    !/background:\s*#(fff|ffffff|16181d|1b1d24)\b/i.test(css),
    'hard-coded surface colour found'
  );
}

for (const page of ['src/options/options.html', 'src/popup/popup.html']) {
  const html = readFileSync(path.join(root, page), 'utf8');
  const themeAt = html.indexOf('theme.js');
  check(`${page} loads the theme script`, themeAt !== -1);
  check(`${page} loads it before its stylesheet`, themeAt !== -1 && themeAt < html.indexOf('.css'));
}

/* ----------------------------------------------------------- shared logic -- */

heading('presets, compose and storage');

const sandbox = { console, URL };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
for (const rel of [
  'src/shared/presets.js',
  'src/shared/compose.js',
  'src/shared/storage.js',
  'src/shared/providers.js',
]) {
  vm.runInContext(readFileSync(path.join(root, rel), 'utf8'), sandbox, { filename: rel });
}
const SayWhat = sandbox.SayWhat;

check('exposes presets', Array.isArray(SayWhat.PRESETS) && SayWhat.PRESETS.length >= 20);

const ids = SayWhat.PRESETS.map((p) => p.id);
check('preset ids are unique', new Set(ids).size === ids.length);

const groupIds = new Set(SayWhat.GROUPS.map((g) => g.id));
for (const preset of SayWhat.PRESETS) {
  check(`${preset.id}: complete`, !!(preset.name && preset.blurb && preset.emoji && preset.instruction));
  check(`${preset.id}: known group`, groupIds.has(preset.group), preset.group);
  check(`${preset.id}: instruction has substance`, preset.instruction.length > 60);
}

for (const required of ['ste', 'eli5', 'fries']) {
  check(`ships the ${required} preset`, ids.includes(required));
}

/* Every default favorite must resolve, or the picker opens with dead rows. */
for (const favorite of SayWhat.DEFAULTS.favorites) {
  check(`default favorite resolves: ${favorite}`, ids.includes(favorite));
}

const ste = SayWhat.getPreset('ste');

const plain = SayWhat.composePostfix(ste, SayWhat.DEFAULT_MODIFIERS, { divider: true });
check('postfix opens with the divider', plain.startsWith('---\n'), JSON.stringify(plain.slice(0, 12)));
check('postfix names the style', plain.includes('Response style — Simplified Technical English:'));
check('postfix carries the instruction', plain.includes('ASD-STE100'));

const noDivider = SayWhat.composePostfix(ste, SayWhat.DEFAULT_MODIFIERS, { divider: false });
check('divider can be turned off', !noDivider.includes('---'));

const tuned = SayWhat.composePostfix(
  ste,
  { length: 'terse', emoji: 'none', language: 'es', languageRegister: 'formal' },
  { divider: true }
);
check('summary lists the modifiers', tuned.includes('(terse, no emoji, in Spanish)'), tuned.split('\n')[1]);
check('adds the length instruction', tuned.includes('Keep it as short as it can be'));
check('adds the emoji instruction', tuned.includes('Do not use emoji.'));
check('adds the language and register', tuned.includes('Reply in Spanish, using the formal register (usted).'));

const noRegister = SayWhat.composePostfix(ste, { language: 'th' }, {});
check('languages without a register stay simple', noRegister.includes('Reply in Thai.'));

const langCodes = SayWhat.LANGUAGES.map((l) => l.code);
check('language codes are unique', new Set(langCodes).size === langCodes.length);
check('language list starts with auto', langCodes[0] === 'auto');

const block = 'BLOCK';
check('append joins with a blank line', SayWhat.applyToDraft('hello', block, 'append') === 'hello\n\nBLOCK');
check('append trims trailing space', SayWhat.applyToDraft('hello  \n\n', block, 'append') === 'hello\n\nBLOCK');
check('append to an empty draft has no padding', SayWhat.applyToDraft('', block, 'append') === 'BLOCK');
check('prepend puts the block first', SayWhat.applyToDraft('hello', block, 'prepend') === 'BLOCK\n\nhello');

check('normalizeHost strips www', SayWhat.normalizeHost('www.ChatGPT.com') === 'chatgpt.com');
check('normalizeHost accepts a url', SayWhat.normalizeHost('https://Claude.ai/chat/123') === 'claude.ai');

const defaults = JSON.parse(JSON.stringify(SayWhat.DEFAULTS));
check('enabled by default', SayWhat.isSiteEnabled(defaults, 'chatgpt.com'));
check('respects the master switch', !SayWhat.isSiteEnabled({ ...defaults, enabled: false }, 'chatgpt.com'));
check(
  'respects a disabled site',
  !SayWhat.isSiteEnabled({ ...defaults, disabledSites: ['chatgpt.com'] }, 'www.chatgpt.com')
);

const picker = SayWhat.sortedForPicker(defaults);
check('favorites come first', picker.favorites.map((s) => s.id).join(',') === defaults.favorites.join(','));
check('nothing is listed twice', picker.favorites.length + picker.rest.length === picker.all.length);

const withCustom = {
  ...defaults,
  customStyles: [{ id: 'custom-1', name: 'Mine', instruction: 'Be nice.' }],
  hiddenBuiltins: ['pirate'],
};
const merged = SayWhat.allStyles(withCustom);
check('custom styles are included', merged.some((s) => s.id === 'custom-1'));
check('hidden built-ins are dropped', !merged.some((s) => s.id === 'pirate'));
check('custom styles get a default icon', SayWhat.resolveStyle(withCustom, 'custom-1').emoji === '✨');

const ordered = SayWhat.allStyles({ ...defaults, order: ['genz', 'ste'] });
check('explicit order is honoured', ordered[0].id === 'genz' && ordered[1].id === 'ste');

check('ids are generated distinctly', SayWhat.newStyleId() !== SayWhat.newStyleId());

/* -------------------------------------------------------------- detection -- */

heading('detection');

const domSandbox = { console, URL };
domSandbox.globalThis = domSandbox;
vm.createContext(domSandbox);
const dom = installDom(domSandbox);
vm.runInContext(readFileSync(path.join(root, 'src/content/detect.js'), 'utf8'), domSandbox, {
  filename: 'detect.js',
});
const detect = domSandbox.SayWhat.detect;

const { height: vh, width: vw } = dom.viewport;
const composerRect = { top: vh - 90, left: vw * 0.1, width: vw * 0.8, height: 56 };
const midPageRect = { top: 200, left: 60, width: 520, height: 130 };

const sendButton = (label) => node({ tag: 'button', attrs: { 'aria-label': label } });

/* Each case mirrors one in scripts/detect-fixtures.html. */
const cases = [
  {
    name: 'ChatGPT-style composer',
    expect: true,
    host: 'chatgpt.com',
    tree: () =>
      node({
        tag: 'div',
        kids: [
          node({ tag: 'textarea', attrs: { placeholder: 'Ask anything' }, rect: composerRect }),
          sendButton('Send prompt'),
        ],
      }),
  },
  {
    /* The reason this section exists: an AI product whose hostname, title and
     * placeholder all stay silent about being AI. Only the composer's shape
     * gives it away. */
    name: 'unbranded AI app with a neutral placeholder',
    expect: true,
    host: 'auto.complete.so',
    title: 'Complete',
    tree: () =>
      node({
        tag: 'div',
        kids: [
          node({
            tag: 'textarea',
            attrs: { placeholder: 'Describe what you want to build' },
            rect: composerRect,
          }),
          sendButton('Send'),
        ],
      }),
  },
  {
    /* Reconstructed from auto.complete.so's own bundle: a bare textarea whose
     * only descriptive text is a placeholder matching none of the hint
     * patterns, on a host and title that never say "AI". Nothing identifies it
     * except the chat controls around it. */
    name: 'AI app that never says "AI" anywhere',
    expect: true,
    host: 'auto.complete.so',
    title: 'Autocomplete',
    tree: () =>
      node({
        tag: 'div',
        kids: [
          node({
            tag: 'button',
            attrs: { 'aria-label': 'Open chat history' },
            rect: { top: 12, left: 8, width: 32, height: 32 },
          }),
          node({
            tag: 'div',
            kids: [
              node({
                tag: 'div',
                kids: [
                  node({
                    tag: 'textarea',
                    attrs: {
                      rows: '1',
                      placeholder:
                        'Tell Autocomplete what you want to do, or bring your own data to begin...',
                    },
                    /* Centred, not docked: the empty-state layout. */
                    rect: { top: 360, left: vw * 0.2, width: vw * 0.6, height: 24 },
                  }),
                ],
              }),
              node({
                tag: 'div',
                kids: [
                  node({ tag: 'button', attrs: { 'aria-label': 'Attach files' } }),
                  node({ tag: 'button', attrs: { 'aria-label': 'Send message' } }),
                ],
              }),
            ],
          }),
        ],
      }),
  },
  {
    name: 'bottom-docked box with no send control',
    expect: false,
    host: 'notes.example',
    title: 'Scratchpad',
    tree: () =>
      node({
        tag: 'div',
        kids: [
          node({
            tag: 'textarea',
            attrs: { placeholder: 'Jot something down' },
            rect: composerRect,
          }),
        ],
      }),
  },
  {
    name: 'contact form on an AI company site',
    expect: false,
    selector: 'textarea',
    host: 'anthropic.com',
    title: 'Contact us — Anthropic',
    tree: () =>
      node({
        tag: 'form',
        kids: [
          node({ tag: 'input', attrs: { type: 'text', placeholder: 'Your name' } }),
          node({ tag: 'textarea', attrs: { placeholder: 'Your message' }, rect: midPageRect }),
          node({ tag: 'button', attrs: { type: 'submit' }, text: 'Submit' }),
        ],
      }),
  },
  {
    /* Caught in review: a contact section built from plain divs rather than a
     * <form>, with "Send message" on the button. Reads as a composer on every
     * signal except the name field sitting next to it. */
    name: 'div-built contact block with a Send button',
    expect: false,
    selector: 'textarea',
    host: 'acme.example',
    title: 'Contact us',
    tree: () =>
      node({
        tag: 'div',
        kids: [
          node({ tag: 'input', attrs: { type: 'text', placeholder: 'Your name' } }),
          node({ tag: 'textarea', attrs: { placeholder: 'Your message' }, rect: midPageRect }),
          node({ tag: 'button', attrs: { 'aria-label': 'Send message' } }),
        ],
      }),
  },
  {
    name: 'search box on an AI-branded page',
    expect: false,
    host: 'docs.claude.ai',
    title: 'Claude Docs',
    tree: () =>
      node({
        tag: 'header',
        kids: [
          node({
            tag: 'input',
            attrs: { type: 'search', placeholder: 'Search documentation' },
            rect: { top: 12, left: 40, width: 420, height: 36 },
          }),
        ],
      }),
  },
  {
    name: 'sign-in form',
    expect: false,
    selector: 'input[type="text"]',
    host: 'chatgpt.com',
    tree: () =>
      node({
        tag: 'form',
        kids: [
          node({ tag: 'input', attrs: { type: 'email', placeholder: 'Email' } }),
          node({ tag: 'input', attrs: { type: 'password', placeholder: 'Password' } }),
          node({
            tag: 'input',
            attrs: { type: 'text', placeholder: 'Workspace' },
            rect: midPageRect,
          }),
        ],
      }),
  },
  {
    name: 'Discord composer stays out of the way',
    expect: false,
    host: 'discord.com',
    tree: () =>
      node({
        tag: 'div',
        kids: [
          node({
            tag: 'div',
            attrs: { contenteditable: 'true', 'aria-label': 'Message #general' },
            contentEditable: true,
            rect: composerRect,
          }),
          sendButton('Send'),
        ],
      }),
  },
];

for (const scenario of cases) {
  dom.setLocation(scenario.host, scenario.path || '/');
  dom.setTitle(scenario.title || '');
  const tree = scenario.tree();
  dom.mount(tree);
  /* Name the element under test. Taking the first editable would silently point
   * the form cases at their name field, which fails detection for reasons that
   * have nothing to do with what the case is checking. */
  const el = tree.querySelectorAll(scenario.selector || 'textarea, input, [contenteditable]')[0];
  const result = detect.score(el);
  check(
    `${scenario.name}: ${scenario.expect ? 'detected' : 'ignored'}`,
    detect.isChatInput(el) === scenario.expect,
    `score ${result.score}/${detect.THRESHOLD}, aiEvidence ${result.aiEvidence}`
  );
}

/* Two lists now describe the same set of assistants — the manifest decides
 * where the content script loads, detect.js decides what gets a confidence
 * boost — and nothing stops them drifting apart. A site in the manifest but not
 * in the adapters loses its boost; a site in the adapters but not the manifest
 * never runs at all, which is worse and completely silent. */
const KNOWN_ASSISTANTS = [
  'https://chatgpt.com/',
  'https://chat.openai.com/',
  'https://claude.ai/new',
  'https://gemini.google.com/app',
  'https://aistudio.google.com/prompts',
  'https://notebooklm.google.com/',
  'https://www.perplexity.ai/',
  'https://grok.com/',
  'https://x.com/i/grok',
  'https://copilot.microsoft.com/',
  'https://www.bing.com/chat',
  'https://chat.deepseek.com/',
  'https://chat.mistral.ai/chat',
  'https://poe.com/',
  'https://www.meta.ai/',
  'https://t3.chat/',
  'https://openrouter.ai/chat',
  'https://huggingface.co/chat/',
  'https://you.com/',
  'https://www.phind.com/',
  'https://kimi.com/',
  'https://chat.qwen.ai/',
  'https://groq.com/',
  'https://lmarena.ai/',
];

/** Chrome match-pattern semantics, narrowed to the forms the manifest uses. */
function matchPatternMatches(pattern, url) {
  const parsed = /^(\*|https?):\/\/([^/]+)(\/.*)$/.exec(pattern);
  if (!parsed) return false;
  const [, scheme, host, pathGlob] = parsed;
  if (scheme !== '*' && scheme !== url.protocol.slice(0, -1)) return false;
  if (host.startsWith('*.')) {
    const bare = host.slice(2);
    if (url.hostname !== bare && !url.hostname.endsWith(`.${bare}`)) return false;
  } else if (host !== url.hostname) {
    return false;
  }
  const re = new RegExp(`^${pathGlob.split('*').map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`);
  return re.test(url.pathname + url.search);
}

for (const href of KNOWN_ASSISTANTS) {
  const url = new URL(href);
  check(
    `${url.hostname}: content script loads`,
    staticMatches.some((pattern) => matchPatternMatches(pattern, url))
  );
  dom.setLocation(url.hostname.replace(/^www\./, ''), url.pathname);
  check(`${url.hostname}: has an adapter`, !!detect.siteAdapter());
}

/* Forcing from the popup is the escape hatch for AI apps the heuristics miss,
 * so it has to override the evidence gate, not just the denylist. */
dom.setLocation('unknown-ai.example');
dom.setTitle('Workspace');
const missed = node({
  tag: 'div',
  kids: [
    node({
      tag: 'textarea',
      attrs: { placeholder: 'Type here' },
      rect: { top: 300, left: 60, width: 520, height: 90 },
    }),
  ],
});
dom.mount(missed);
const missedInput = missed.querySelectorAll('textarea')[0];
check('an unrecognised box is ignored by default', detect.isChatInput(missedInput) === false);
check('forcing a site overrides the evidence gate', detect.score(missedInput, { forced: true }).aiEvidence);

/* findComposer backs two paths with no visible failure mode: the relay typing
 * into a tab it just opened, and noticing that a submitted composer was
 * replaced rather than cleared. Picking the wrong box means typing a prompt
 * into a search field. */
dom.setLocation('chatgpt.com', '/');
dom.setTitle('ChatGPT');
const twoBoxes = node({
  tag: 'div',
  kids: [
    node({
      tag: 'input',
      attrs: { type: 'search', placeholder: 'Search chats' },
      rect: { top: 16, left: 16, width: 220, height: 32 },
    }),
    node({
      tag: 'div',
      kids: [
        node({
          tag: 'div',
          attrs: { contenteditable: 'true', 'data-placeholder': 'Message ChatGPT' },
          contentEditable: true,
          rect: { top: 620, left: 200, width: 700, height: 52 },
        }),
        node({
          tag: 'button',
          attrs: { 'data-testid': 'send-button', 'aria-label': 'Send prompt' },
        }),
      ],
    }),
  ],
});
dom.mount(twoBoxes);
check(
  'findComposer prefers the composer over a search box',
  detect.findComposer() === twoBoxes.querySelectorAll('[contenteditable]')[0]
);

/* A page whose only text box is a search field must yield nothing at all,
 * otherwise the relay would type a prompt into it. */
dom.setLocation('example.test', '/');
dom.setTitle('Docs');
const searchOnly = node({
  tag: 'div',
  kids: [
    node({
      tag: 'input',
      attrs: { type: 'search', placeholder: 'Search the docs' },
      rect: { top: 16, left: 16, width: 220, height: 32 },
    }),
  ],
});
dom.mount(searchOnly);
check('findComposer returns nothing on a page with only search', detect.findComposer() === null);
check('and forcing does not conjure one', detect.findComposer({ forced: true }) === null);

/* -------------------------------------------------------- panel placing -- */

heading('panel placement');

/* ui.js touches no DOM until one of its functions runs, so a bare context is
 * enough to reach the placement maths. */
const uiSandbox = { console };
uiSandbox.globalThis = uiSandbox;
vm.createContext(uiSandbox);
vm.runInContext(readFileSync(path.join(root, 'src/content/ui.js'), 'utf8'), uiSandbox, {
  filename: 'ui.js',
});
const placePanel = uiSandbox.SayWhat.ui.panelPlacement;
check('ui.js exposes panelPlacement', typeof placePanel === 'function');

/* The pill is drawn just above the composer, which is what made "fall back to
 * below the pill" land on the composer itself. */
const withPill = (composer) => ({
  composer,
  pill: { top: composer.top - 34, bottom: composer.top - 6, right: composer.right },
});

const layouts = [
  {
    name: 'chat with messages (composer docked at the bottom)',
    ...withPill({ top: 850, bottom: 930, right: 1100 }),
    viewport: 1000,
    expectAbove: true,
  },
  {
    name: 'blank chat (composer centred)',
    ...withPill({ top: 480, bottom: 560, right: 1100 }),
    viewport: 1000,
    expectAbove: true,
  },
  {
    name: 'blank chat in a short viewport',
    ...withPill({ top: 300, bottom: 420, right: 1100 }),
    viewport: 700,
    expectAbove: false,
  },
  {
    name: 'composer near the top of the page',
    ...withPill({ top: 120, bottom: 200, right: 1100 }),
    viewport: 900,
    expectAbove: false,
  },
];

for (const layout of layouts) {
  const cap = placePanel(layout.pill, layout.composer, layout.viewport, 462);
  const height = Math.min(462, cap.maxHeight);
  const placed = placePanel(layout.pill, layout.composer, layout.viewport, height);
  const bottom = placed.top + height;

  /* The bug in full: a panel drawn over the composer hides the site's own send
   * button, so the only fix available to the user is to close the panel. */
  const clearsComposer = bottom <= layout.composer.top || placed.top >= layout.composer.bottom;
  check(`panel clears the composer — ${layout.name}`, clearsComposer);
  check(`panel stays on screen — ${layout.name}`, placed.top >= 8 && bottom <= layout.viewport - 8);
  check(`panel opens ${layout.expectAbove ? 'above' : 'below'} — ${layout.name}`, placed.above === layout.expectAbove);
  check(`panel keeps a usable height — ${layout.name}`, height >= 220);
}

/* ----------------------------------------------------------- multiplexer -- */

heading('multiplexer');

const providerIds = SayWhat.PROVIDERS.map((p) => p.id);
check('provider ids are unique', new Set(providerIds).size === providerIds.length);
for (const required of ['openai', 'claude']) {
  check(`ships the ${required} provider`, providerIds.includes(required));
}

for (const provider of SayWhat.PROVIDERS) {
  const host = SayWhat.providerHost(provider);
  check(`${provider.id}: named`, !!provider.name);
  check(`${provider.id}: resolvable host`, !!host, provider.url);
  /* A built-in has to be reachable without asking for anything: either the
   * site takes the prompt in its URL, or our content script already runs
   * there and can type it in. Otherwise it is a chip that does nothing. */
  check(
    `${provider.id}: reachable out of the box`,
    SayWhat.providerUsesTemplate(provider) ||
      staticMatches.some((pattern) => SayWhat.hostMatchesPattern(host, pattern)),
    host
  );
}

const openai = SayWhat.PROVIDERS.find((p) => p.id === 'openai');

/* A prompt with the characters most likely to break a query string. */
const trickyPrompt = 'a&b=c?d #e\nsecond line 100% "quoted"';
const shortTarget = SayWhat.buildProviderTarget(openai, trickyPrompt);
check('short prompt travels in the URL', shortTarget.mode === 'confirm', shortTarget.mode);
check('placeholder is fully replaced', !shortTarget.url.includes('{prompt}'));
check(
  'prompt survives the round trip intact',
  new URL(shortTarget.url).searchParams.get('q') === trickyPrompt,
  JSON.stringify(new URL(shortTarget.url).searchParams.get('q'))
);

/* Past the cap the query string gets truncated by the provider, and a
 * half-delivered prompt is worse than taking the slower route.
 *
 * The threshold is asserted separately and the fixtures below use a fixed
 * size, because a fixture derived from PROMPT_URL_CAP would follow the
 * constant wherever it went and never fail. */
check(
  'the URL cap is in the range providers actually tolerate',
  SayWhat.PROMPT_URL_CAP >= 500 && SayWhat.PROMPT_URL_CAP <= 4000,
  String(SayWhat.PROMPT_URL_CAP)
);

const longTarget = SayWhat.buildProviderTarget(openai, 'x'.repeat(5000));
check('an oversized prompt falls back to filling', longTarget.mode === 'fill', longTarget.mode);
check('the fallback drops the query string', !longTarget.url.includes('?'), longTarget.url.slice(0, 60));

const customSettings = {
  customProviders: [
    { id: 'p1', name: 'Auto', url: 'auto.complete.so' },
    { id: 'p2', name: 'Templated', url: 'https://example.com/go?prompt={prompt}' },
    { id: 'p3', name: 'No address' },
    { url: 'https://example.org' },
  ],
};

const providerList = SayWhat.allProviders(customSettings);
check(
  'custom providers join the built-ins',
  providerList.length === SayWhat.PROVIDERS.length + 2,
  String(providerList.length)
);
check('built-ins are flagged as such', providerList[0].builtin === true);
check('incomplete custom providers are dropped', !providerList.some((p) => p.id === 'p3'));

const bare = SayWhat.resolveProvider(customSettings, 'p1');
check('a bare host is treated as https', SayWhat.providerHost(bare) === 'auto.complete.so');
const bareTarget = SayWhat.buildProviderTarget(bare, 'hello');
check('a host without a template gets filled in', bareTarget.mode === 'fill', bareTarget.mode);
check('the fill target is the site itself', bareTarget.url === 'https://auto.complete.so/', bareTarget.url);

/* Custom templates are not assumed to spell the parameter "q". */
const templated = SayWhat.buildProviderTarget(SayWhat.resolveProvider(customSettings, 'p2'), 'hi there');
check(
  'a custom template keeps its own parameter name',
  new URL(templated.url).searchParams.get('prompt') === 'hi there',
  templated.url
);

check('garbage addresses resolve to no host', SayWhat.providerHost({ url: 'not a url' }) === '');

/* Recognising our own prompt in the target's composer is what licenses the
 * relay to press send. It cannot be a literal comparison: a prompt carrying a
 * style block is multi-line, and a rich editor makes every line its own block,
 * so innerText reads back a blank line wherever we sent one newline. Getting
 * this wrong is invisible — the tab opens, the prompt sits there, nothing
 * submits. */
const sentPrompt = 'How do I center a div?\n\n---\nResponse style — BLUF:\nBottom line up front.';
const proseMirrorReadback =
  'How do I center a div?\n\n---\n\nResponse style — BLUF:\n\nBottom line up front.';

check('a ProseMirror round trip still matches', SayWhat.samePrompt(proseMirrorReadback, sentPrompt));
check('an exact match still matches', SayWhat.samePrompt(sentPrompt, sentPrompt));
check(
  'a non-breaking space does not break it',
  SayWhat.samePrompt(sentPrompt.replace(/ /g, '\u00a0'), sentPrompt)
);
check(
  'a clipped long prompt still matches',
  SayWhat.samePrompt(sentPrompt.slice(0, 55), sentPrompt)
);

/* And the half that keeps it safe to run in a background tab. */
check('someone else\u2019s text does not match', !SayWhat.samePrompt('what is a monad', sentPrompt));
check('an empty composer does not match', !SayWhat.samePrompt('   \n  ', sentPrompt));
check(
  'a few shared opening words are not enough',
  !SayWhat.samePrompt('How do I', sentPrompt)
);

for (const [host, pattern, want] of [
  ['chatgpt.com', 'https://*.chatgpt.com/*', true],
  ['sub.chatgpt.com', 'https://*.chatgpt.com/*', true],
  ['notchatgpt.com', 'https://*.chatgpt.com/*', false],
  ['x.com', 'https://x.com/i/grok*', true],
  ['evil.com', 'https://x.com/i/grok*', false],
]) {
  check(
    `${host} ${want ? 'matches' : 'does not match'} ${pattern}`,
    SayWhat.hostMatchesPattern(host, pattern) === want
  );
}

/* ------------------------------------------------------------ fan-out ---- */

heading('fan-out');

/* The worker decides, per provider, between handing the prompt over in the URL
 * and typing it in, and whether it can reach the provider at all. Getting that
 * wrong is silent — a chip you tick that never delivers anything — so it is
 * worth running the real function rather than trusting it. */

const registered = [];
let createdTabs = [];
const sessionStore = {};
let onMessage = null;

/* An exception inside one of the worker's async message handlers surfaces as
 * an unhandled rejection and nothing else: sendResponse is simply never
 * called. Recording those turns a silent no-op into a named failure. */
const workerErrors = [];
process.on('unhandledRejection', (err) => workerErrors.push(err));

const listenerStub = { addListener() {} };
const workerSandbox = { console, URL, setTimeout };
workerSandbox.globalThis = workerSandbox;
workerSandbox.chrome = {
  runtime: {
    getManifest: () => manifest,
    onStartup: listenerStub,
    onInstalled: listenerStub,
    onMessage: {
      addListener(fn) {
        onMessage = fn;
      },
    },
  },
  permissions: { onAdded: listenerStub, onRemoved: listenerStub },
  storage: {
    onChanged: listenerStub,
    sync: { get: async () => ({}) },
    session: {
      get: async (key) => ({ [key]: sessionStore[key] }),
      set: async (patch) => {
        Object.assign(sessionStore, patch);
      },
    },
  },
  commands: { onCommand: listenerStub },
  scripting: { getRegisteredContentScripts: async () => registered },
  tabs: {
    create: async (props) => {
      createdTabs.push(props);
      return { id: 900 + createdTabs.length };
    },
  },
};
workerSandbox.importScripts = (rel) => {
  const file = rel.replace(/^\//, '');
  vm.runInContext(readFileSync(path.join(root, file), 'utf8'), workerSandbox, { filename: file });
};
vm.createContext(workerSandbox);
vm.runInContext(
  readFileSync(path.join(root, 'src/background/service-worker.js'), 'utf8'),
  workerSandbox,
  { filename: 'service-worker.js' }
);

check('the worker loads the provider module', typeof workerSandbox.SayWhat === 'object');
check('the worker exposes the fan-out planner', typeof workerSandbox.planFanOut === 'function');

const claude = SayWhat.PROVIDERS.find((p) => p.id === 'claude');
const autoProvider = { id: 'p1', name: 'Auto', url: 'auto.complete.so' };

const fromChatGpt = await workerSandbox.planFanOut([openai, claude], 'hello', 'chatgpt.com');
check(
  'the assistant you are already on is left out',
  fromChatGpt.plans.length === 1 && fromChatGpt.plans[0].name === 'Claude',
  fromChatGpt.plans.map((p) => p.name).join(',')
);
check('a declared host gets a relay job', !!fromChatGpt.plans[0].job);
check('that job confirms rather than fills', fromChatGpt.plans[0].job.mode === 'confirm');

/* No content script on that origin yet, and no template to fall back on. */
const ungranted = await workerSandbox.planFanOut([autoProvider], 'hello', 'chatgpt.com');
check('an unreachable provider is reported, not dropped', ungranted.skipped.includes('Auto'));
check('and no tab is planned for it', ungranted.plans.length === 0);

registered.push({ id: 'forced:auto.complete.so' });
const granted = await workerSandbox.planFanOut([autoProvider], 'hello', 'chatgpt.com');
check('once granted it is reachable', granted.plans.length === 1 && !granted.skipped.length);
check('and the prompt gets typed in', granted.plans[0].job.mode === 'fill');
check('landing on the site itself', granted.plans[0].url === 'https://auto.complete.so/');

const oversized = await workerSandbox.planFanOut([openai], 'x'.repeat(5000), 'claude.ai');
check('an oversized prompt is typed in rather than truncated', oversized.plans[0].job.mode === 'fill');
check('and it does not ride in the query string', !oversized.plans[0].url.includes('?'));

/* Everything above calls the planner directly, which is exactly how a broken
 * message handler goes unnoticed: the tabs are opened from the listener, and a
 * throw in there just means sendResponse is never called. So drive the real
 * listener the way the content script does. */
check('the worker registered a message listener', typeof onMessage === 'function');

async function sendToWorker(message, sender) {
  createdTabs = [];
  return Promise.race([
    new Promise((resolve) => onMessage(message, sender, resolve)),
    new Promise((resolve) => setTimeout(() => resolve(null), 1000)),
  ]);
}

const sourceTab = { id: 42, index: 3 };
const fanned = await sendToWorker(
  { type: 'sw:multiplex', prompt: 'hello there', providerIds: ['openai', 'claude'], host: 'chatgpt.com' },
  { tab: sourceTab }
);

check('the fan-out handler answers', fanned !== null, 'no response before the timeout');
check('it reports what it opened', !!fanned && fanned.opened.join(',') === 'Claude', JSON.stringify(fanned));
check('it opens exactly one tab', createdTabs.length === 1, String(createdTabs.length));
check('the new tab stays in the background', createdTabs[0] && createdTabs[0].active === false);
check('and lands immediately to the right', createdTabs[0] && createdTabs[0].index === 4, JSON.stringify(createdTabs[0]));
check('carrying the prompt', !!createdTabs[0] && createdTabs[0].url.includes('hello%20there'), createdTabs[0] && createdTabs[0].url);

/* Two targets have to land in order rather than racing each other. */
const both = await sendToWorker(
  { type: 'sw:multiplex', prompt: 'hi', providerIds: ['openai', 'claude'], host: 'gemini.google.com' },
  { tab: { id: 7, index: 0 } }
);
check('both targets open when neither is the source', both && both.opened.length === 2, JSON.stringify(both));
check(
  'and they are ordered left to right',
  createdTabs.map((t) => t.index).join(',') === '1,2',
  createdTabs.map((t) => t.index).join(',')
);

const claimed = await sendToWorker({ type: 'sw:claim-relay' }, { tab: { id: 901 } });
check('a relayed tab is handed its job', !!(claimed && claimed.job), JSON.stringify(claimed));

const unrelated = await sendToWorker({ type: 'sw:claim-relay' }, { tab: { id: 5 } });
check('an unrelated tab is handed nothing', !!unrelated && unrelated.job === null, JSON.stringify(unrelated));

check(
  'no message handler threw',
  workerErrors.length === 0,
  workerErrors.map((e) => (e && e.message) || String(e)).join('; ')
);

/* ---------------------------------------------------------------- report -- */

heading(failures.length ? 'FAILURES' : 'result');
for (const failure of failures) process.stdout.write(`  ✗ ${failure}\n`);
process.stdout.write(`  ${checks - failures.length}/${checks} checks passed\n\n`);
process.exit(failures.length ? 1 : 0);
