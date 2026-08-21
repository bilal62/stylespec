# Contributing to Stylespec

There is no build step and no dependencies. Clone it, load it unpacked from
`chrome://extensions`, and you are set up.

```bash
node scripts/selftest.mjs      # run this before opening a pull request
```

## The two most useful contributions

### 1. A preset

The style library is the product, and it improves fastest from people who write
for a living. Add an entry to [`src/shared/presets.js`](src/shared/presets.js):

```js
{
  id: 'kebab-case-id',
  name: 'Human readable name',
  emoji: '📐',
  group: 'clarity',            // clarity | technical | professional | format | critique | fun
  blurb: 'Under 50 characters, shown under the name',
  instruction: 'The text appended verbatim to the prompt.',
}
```

What makes a good instruction:

- **Give rules, not adjectives.** "Keep sentences under 20 words" beats "be
  clear". The model can obey the first one and only guess at the second.
- **Say what to stop doing.** Most of the value in a style is subtraction — no
  preamble, no closing summary, no hedging.
- **Keep it 40–70 words.** Long enough to be specific, short enough that it does
  not crowd the prompt.
- **Protect the substance.** If the style is a voice (Pirate, Gen Z), say
  explicitly that the information stays accurate underneath it.

House style guides you have to follow professionally are especially welcome —
ASD-STE100 and the Google and Microsoft guides are already in, and there are
plenty more.

The self-test checks that every preset has a name, blurb, emoji, a known group
and an instruction with some substance to it.

### 2. A detection bug

If the pill does not appear on an assistant you use, that is a bug worth an
issue, and fixing one usually fixes a whole class of sites.

Include the URL and, if you can, the composer's markup: right-click the input →
**Inspect** → right-click the highlighted node → **Copy** → **Copy element**.
The attributes are what matter — a paste of the page's view-source is usually
useless, because most of these apps render client-side.

Then add the case to both test layers:

- `scripts/selftest.mjs`, in the `detection` section, using the fake DOM from
  `scripts/dom-stub.mjs`
- `scripts/detect-fixtures.html`, so it is visible in a real browser too

Negative cases are as valuable as positive ones. If Stylespec appears somewhere
it should not, that is the same bug pointing the other way.

## House rules

**Detection.** Site-specific selectors may only ever raise confidence, never
gate a decision. Anything that makes the extension stop working on an unknown
AI UI is the wrong fix — the heuristic has to carry the load on its own.

**Permissions.** `storage`, `activeTab` and `scripting`, with broad host access
strictly opt-in via `optional_host_permissions`. Nothing may become a mandatory
host permission: that changes the install warning to "all your data on all
websites" and puts every release into a multi-week store review. Adding a host
to the static match list is fine, and needs a matching adapter in `detect.js` —
the self-test checks both directions. No network requests, no analytics, no
remote code. A change needing a new permission needs a conversation first.

**Dependencies.** None, deliberately. Everything runs in a browser or in plain
Node.

**Styles.** Edit `src/content/ui.css`, then run `node scripts/build-css.mjs` to
regenerate the bundled copy. The self-test fails if the two drift apart. The
bundle exists because sites with a strict CSP block both a runtime `fetch` and
any injected `<style>` element.

**Comments.** Explain constraints and trade-offs, not what the line does. Most
of the existing comments record why something is the way it is, usually because
the obvious approach failed somewhere specific.

## Testing what needs a browser

```bash
python3 -m http.server 8731
```

- `/scripts/detect-fixtures.html` — scores realistic chat, search, login,
  contact and comment markup and asserts each verdict
- `/scripts/ui-harness.html` — a fake ProseMirror chat running the real content
  scripts against a stubbed `chrome` API, for driving the pill and picker by hand

Worth checking any UI change against a real ChatGPT or Claude window too. Those
two have the strictest CSP and the most opinionated editors, so they break first.
