<div align="center">

# Stylespec

**Set the response style of any AI chat. Then ask a second assistant the same
thing.**

[![Manifest V3](https://img.shields.io/badge/manifest-v3-4c5bd4)](manifest.json)
[![No broad host access](https://img.shields.io/badge/host%20access-opt--in-2f9e5f)](manifest.json)
[![No dependencies](https://img.shields.io/badge/dependencies-none-2f9e5f)](#development)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

[Install](#install) · [Multiplexer](#ask-a-second-assistant) · [How it works](#how-it-works) · [Privacy](#privacy) · [Contributing](CONTRIBUTING.md)

</div>

---

Every assistant has the same voice: long, hedged, bulleted, opening by
restating your question. So you type "be concise" at the end of your prompt.
Again. And tomorrow, in a different tool, again.

Stylespec turns that into a button. Start typing in any AI chat and a **Set
response style** pill appears next to the box. Pick a style and the instruction
lands in your draft — visibly, where you can still read and edit it before you
send.

<!-- TODO: replace with a 6-second capture: type, pill appears, click, block lands. -->
<div align="center"><em>[demo gif]</em></div>

Unlike ChatGPT's Custom Instructions or Claude's Styles, this is **per message**
and **assistant-agnostic**: one library that works everywhere and switches as
fast as your task does.

And because the prompt is finished and sitting in front of you, it may as well go
somewhere else too. Tick a target before you send and the same styled prompt
opens in a background tab, already asking — see
[the multiplexer](#ask-a-second-assistant).

## Install

**From the Chrome Web Store** — [link pending review]. Works in Chrome, Brave,
Edge, Arc and other Chromium browsers.

**From source** — there is no build step, so the folder loads as-is:

1. Clone the repo.
2. Open `chrome://extensions` (or `brave://extensions`).
3. Turn on **Developer mode**, top right.
4. Click **Load unpacked** and choose the folder.

Repeat per browser profile.

## Using it

- **Pill** — appears on your first keystroke in a detected chat box. Click it to
  open the picker.
- **Keyboard** — <kbd>⌘</kbd><kbd>⇧</kbd><kbd>Y</kbd> on macOS,
  <kbd>Alt</kbd><kbd>Shift</kbd><kbd>S</kbd> elsewhere. Rebind at
  `chrome://extensions/shortcuts`. The popup and settings page read the live
  binding from the browser rather than printing the default, so what they show
  is always what is actually bound.
- **Toolbar popup** — apply a favourite without leaving the keyboard, or turn
  the extension off for the current site.
- **Modifiers** — stack length, formality, audience, emoji and target language
  on top of whichever style you pick.
- **Multiplexer** — tick a second assistant and your prompt goes there too. See
  [below](#ask-a-second-assistant).
- **Theme** — Settings → Appearance offers Match system, Light or Dark. Worth
  setting explicitly: your system preference and the AI site's theme often
  disagree, and a dark pill floating over a light Claude window looks out of
  place.

What gets appended:

```
How do I center a div?

---
Response style — Simplified Technical English (terse, no emoji):
Use one approved meaning per word, and never swap in a synonym for a concept you
have already named. Keep sentences under 20 words. ...
Keep it as short as it can be while still being complete. Do not use emoji.
```

## Styles

23 built in, across six groups. Five of them are published standards rather
than preferences — ASD-STE100 Simplified Technical English, BLUF,
plainlanguage.gov, and the house styles Google and Microsoft maintain for their
own documentation. Those apply the written *rules* of each guide; ASD-STE100's
controlled dictionary is not checked, so this is not a compliance tool.

| Group | Styles |
| --- | --- |
| **Clarity** | Explain it like I'm 5 · Put the fries in the bag · Plain language · Feynman technique · Socratic tutor · Hemingway · No LLM tells |
| **Technical** | Simplified Technical English (ASD-STE100) · Google developer docs · Terse senior engineer |
| **Professional** | BLUF / executive summary · Microsoft writing style · Academic · Legalese · Financial analyst |
| **Format** | Actionable checklist · Bullets only · Table first |
| **Critique** | Devil's advocate |
| **For fun** | Pirate · Shakespearean · Corporate LinkedIn · Gen Z |

Add your own from Settings → **New style**: a name, an icon, and the instruction
text, which is appended verbatim. The preview pane shows exactly what will land
in the chat box. Star a style to pin it to the top of the picker and the popup.
Built-ins cannot be edited, but **Duplicate & edit** gives you a copy that can.

**Modifiers** stack on top of any style: length (terse / medium / thorough),
formality, audience, emoji, and 30 output languages. Languages with a T-V or
honorific distinction carry an explicit register, so you get `usted` rather than
`tú` and 존댓말 rather than 반말.

## Where it works

Recognised by name: ChatGPT, Claude, Gemini, Copilot, Perplexity, Grok,
DeepSeek, Mistral, Poe, Meta AI, Kimi, Qwen, Groq, Together, LMArena, Hugging
Face Chat, Phind, You.com, OpenRouter, AI Studio, NotebookLM, T3 Chat, Open
WebUI and LibreChat.

The extension loads automatically on those. For anything else — a self-hosted
front-end, an internal company assistant, a tool that launched last week — open
the popup and hit **Turn it on here**. Chrome asks for permission to that one
site, and the same heuristics take over from there, so unknown AI UIs generally
work first time without an update.

That one click is the deliberate price of not requesting access to every website
you visit at install time. See [Privacy](#privacy).

## Ask a second assistant

Some questions deserve more than one answer, and getting a second one is pure
clerical work: select the prompt, copy it, open a tab, paste, send.

Open the **Multiplexer** in the picker, tick a target, and send the way you
normally would. Each target opens in a background tab to the right of the one
you are in, already asking your question, with the style block attached. You stay
where you are. It arms for one prompt and then switches itself off, because a
follow-up like "make it shorter" means nothing to an assistant that never saw
what came before it.

Two things make this different from the several side-by-side comparison
extensions that already exist:

- **It starts where you already are.** Those tools are a destination — you type
  into their sidebar or grid instead of your assistant's box, which means leaving
  the conversation you were in. This sends the draft you had already written,
  from the site you were already on.
- **The comparison is fair.** Two answers are only comparable if the prompt was
  identical, and prompt shape drives answer shape more than people expect.
  Because the same style block goes to every target, you are comparing the models
  rather than one model's default verbosity against another's.

What it deliberately is not: there is no split-screen pane, and nothing is read
back, collected or scored for you. Answers arrive in ordinary tabs on each
assistant's own site. Collecting them would mean reading page content, which is
the one capability this extension is built around not having.

ChatGPT and Claude are built in. Add anything else from Settings →
**Multiplexer**: a name and an address, with `{prompt}` where the prompt goes.
With that placeholder the prompt travels in the URL and nothing is injected;
without it, Stylespec opens the site and types into the composer, which needs that
site turned on first. The built-in list stays short on purpose — every provider
URL parameter here is undocumented and can change without notice, so each one
shipped is a maintenance promise rather than a line on a feature list.

## How it works

### Detection

Site-specific selectors rot within weeks, so they are only ever confidence
boosts — never gates. Any `textarea` or rich-text editor is scored on its
placeholder text, a nearby send button, its position and size on the page, and
whether it is trapped in a login form or a nav bar. Clear a threshold of 8 and
it is a chat box.

Scoring alone is not enough, because a contact form and a chat composer look
alike on paper. An element also has to clear an evidence gate, satisfied by any
one of:

- a known AI host,
- an unmistakable placeholder,
- an AI word in the page title or metadata,
- **controls only a conversation UI has** — Stop generating, Regenerate, New
  chat, chat history — matched against accessible names, never body text,
- or **the shape of a composer** — a multi-line box spanning a good part of the
  window, with a send control beside it and no name or email fields for company.

The last two routes are what carry AI products whose name and copy never mention
AI, and they are deliberately independent: asking what a page *does* works when
asking what it *calls itself* fails. Neither says anything about vertical
position, because the empty state of most assistants centres the composer, and
that is exactly when someone first tries this.

Company is what separates a composer from a contact form, so a box sitting among
name, email or subject fields is both barred from the shape route and penalised
in scoring. A standalone feedback widget with a Send button will still occasionally
qualify; **Turn off here** in the popup deals with that. Erring toward appearing
is deliberate for a tool whose pitch is working on assistants it has never heard
of.

Chat apps that are not AI — Slack, Discord, Gmail, X, LinkedIn — are suppressed
by a denylist. When nothing is detected on a page that really is an AI chat,
**Force it on** in the popup bypasses both the denylist and the evidence gate
for that site.

### Insertion

Plain fields need the native value setter, because React installs its own
property descriptor and silently drops direct assignment. Rich editors
(ProseMirror on ChatGPT and Claude, Quill on Gemini, Lexical on Meta AI) ignore
even that — they only accept input they believe came from a human, so the
reliable route is a forged paste event carrying a `DataTransfer`, falling back
to `execCommand('insertText')` and then to manual nodes.

### The multiplexer

Two problems, and both are solved by refusing to guess.

Browsers have no "the user submitted a prompt" event. Enter might insert a
newline, dismiss a slash-command menu or accept an IME candidate, and plenty of
composers want Cmd+Enter instead. So a likely-looking Enter or a click on a
send-shaped button only causes the draft to be read; the fan-out waits until
the composer actually goes empty. A missed send is a far better failure than a
burst of tabs nobody asked for.

Delivering the prompt then takes whichever of two routes the target supports.
ChatGPT and Claude accept a prompt in the URL, so they simply get navigated to
and left alone. Everything else — including anything you add yourself — needs
the prompt typed into its composer by the content script already running on
that origin. The receiving half never inserts into a composer that has text and
never presses send on one that is empty, which is what makes it safe for a
provider to boot the script twice or submit on its own.

### Styling under a strict CSP

The UI lives in a shadow root. Claude and others block both a runtime `fetch` of
a stylesheet and any `<style>` element a content script appends, so the CSS is
bundled into a JS string at build time and handed to a constructed
`CSSStyleSheet`, which `style-src` cannot reject. The self-test fails if
`ui.css` and `ui.css.js` drift apart.

## Privacy

Stylespec cannot run on a site unless you have said so.

The content script is declared for the 31 assistant hosts listed above and
nowhere else. Anything beyond that list is opt-in: **Turn it on here** in the
popup asks Chrome for permission to that one origin, and the extension gets
access to that origin only. There are no mandatory host permissions, so the
install prompt names the AI sites rather than saying "all your data on all
websites".

Beyond that: no network requests of its own, no analytics, no telemetry, no
accounts, no remote code. Your prompts are read by the page you typed them into
and nowhere else; your styles live in `chrome.storage.sync`.

The one exception is the multiplexer, and only for the prompt you send while it
is armed: that prompt goes to the assistants you ticked, and nowhere else. It
travels either in the target's own URL or through the content script already
running on that origin — the same route as pasting it in yourself.

The permissions are `storage` for your styles, `activeTab` so the popup can see
which site you are on when you ask it to, and `scripting` to register the
content script for an origin you have granted. Opening tabs needs none.

This is not a policy that could quietly change next release — it is what the
extension is structurally able to do, and [`manifest.json`](manifest.json) is 92
lines if you want to check.

## Development

No dependencies and no build step for the extension itself. Shared modules are
classic scripts hanging off a `SayWhat` global rather than ES modules, because
MV3 content scripts cannot use `import`.

```bash
node scripts/selftest.mjs      # syntax, manifest wiring, css bundle, theming, detection, presets
node scripts/build-css.mjs     # regenerate src/content/ui.css.js after editing ui.css
python3 scripts/make-icons.py  # regenerate icons/
node scripts/package.mjs       # build dist/stylespec-<version>.zip for the Chrome Web Store
node marketing/check-limits.mjs # store copy against the field limits that reject a submission
```

`package.mjs` ships only runtime files — no harnesses, scripts or marketing
copy — because Google states that the amount of code in a submission affects
review time, and none of it would ever run in a browser.

`scripts/dom-stub.mjs` fakes just enough DOM for the self-test to run the
detection heuristics headlessly, so the scoring rules are covered on every run
rather than only when someone remembers to open a browser.

Two harnesses cover what needs a real DOM. Serve the folder with
`python3 -m http.server 8731` and open:

- `/scripts/detect-fixtures.html` — scores realistic chat, search, login,
  contact and comment markup and asserts each verdict. Against a threshold of 8,
  recognised composers score in the twenties, unbranded ones 11, and the nearest
  false positive 6.
- `/scripts/ui-harness.html` — a fake ProseMirror chat that loads the real
  content scripts against a stubbed `chrome` API, so the pill, picker and text
  insertion can be driven by hand.

### Layout

```
manifest.json                 MV3, narrow matches, opt-in host access
src/shared/presets.js         built-in styleguides
src/shared/compose.js         modifiers, languages, postfix assembly
src/shared/storage.js         chrome.storage.sync wrapper, defaults, migrations
src/shared/theme.js           light/dark/auto for the extension's own pages
src/shared/providers.js       multiplexer targets and how each takes a prompt
src/content/detect.js         is this element an AI chat composer?
src/content/insert.js         writing text into React and rich-text editors
src/content/submit.js         spotting a send, and performing one
src/content/ui.css            picker styles (source of truth)
src/content/ui.css.js         generated bundle of the above
src/content/ui.js             shadow-DOM pill and picker
src/content/relay.js          delivering a prompt into a tab we opened
src/content/index.js          content script orchestration
src/options/                  settings page
src/popup/                    toolbar popup
src/background/               shortcut routing, granted origins, fan-out
scripts/                      self-test, css bundler, icon generator, harnesses
marketing/                    positioning, store listing, launch copy
```

## Contributing

The easiest useful contribution is **a preset**: a name, an emoji, a one-line
blurb and a paragraph of instruction in
[`src/shared/presets.js`](src/shared/presets.js). House style guides from people
who have to follow one for a living are especially welcome.

The second most useful is **a detection bug**. If the pill does not appear on an
assistant you use, open an issue with the page and, if you can, the composer's
markup (right-click the input → Inspect → Copy element). One fix usually covers
a whole class of sites.

Run `node scripts/selftest.mjs` before opening a pull request. See
[CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT. See [LICENSE](LICENSE).
