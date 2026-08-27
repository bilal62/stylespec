# Chrome Web Store listing

Copy-paste source for the Developer Dashboard. Store fields render as **plain
text** — line breaks survive, markdown does not — so the description below uses
no formatting characters beyond `•` and capitals. Character counts are noted
against each limit and verified by `node marketing/check-limits.mjs`.

Ordering follows the pillars in `positioning.md`: the style layer leads because
it is the hook and the daily habit, and the multiplexer gets its own named
section immediately after the portability claim. It is deliberately not in the
first line — see the risk note about spending above-the-fold lines on the
lower-frequency job.

---

## Extension name

Limit 75 characters, and the single strongest ranking signal in store search.
The brand leads, the category phrase follows, and the remaining budget goes to
the two standards that are free to use anywhere — see the trademark section
below for why Microsoft, Google and Gemini are not in this line.

```
Stylespec — AI Response Style: Simplified Technical English, BLUF
```

65 characters, so there is room to swap a keyword later without a rewrite.
`Stylespec — AI Response Style for ChatGPT: Simplified Technical English` (71)
is the alternative if brand-name search volume turns out to matter more than
BLUF; it uses the "for" construction the vendors require, and it costs the
standards keyword that nothing else in the category is competing for.

## Trademarks in the listing

The four marketing keywords are not equivalent, and treating them as one set is
how a listing gets rejected.

**Free to use anywhere**, because they are open standards rather than anyone's
product: Simplified Technical English, ASD-STE100, BLUF, plain language,
plainlanguage.gov.

**Description only, with attribution**: the Microsoft Writing Style Guide and
the Google developer documentation style guide. Google's branding guidelines
forbid using its marks in an extension name without written permission and
require the "for" / "for use with" / "compatible with" construction plus a ™
elsewhere; Microsoft asks at minimum that a product name not begin with its
mark. The same rule covers **Gemini**, which is a Google product name — it was
in the old title and should not go back in.

Assistant names used to say where the extension runs (ChatGPT, Claude, Gemini,
Copilot) are nominative and belong in the description, not the title.

Add this line at the foot of the detailed description:

```
Simplified Technical English and ASD-STE100 are specifications of ASD. Microsoft
is a trademark of Microsoft Corporation. Google and Gemini are trademarks of
Google LLC. ChatGPT is a trademark of OpenAI. Claude is a trademark of
Anthropic. This extension is not affiliated with, endorsed by or authorised by
any of them.
```

Two words that must never appear next to a vendor guide: **official** and
**certified**. Both imply a licence that does not exist.

## Short description

Limit 132 characters. Appears in search results and under the icon, and does
more conversion work than the long description ever will.

It has to name both jobs, which costs the privacy line that used to close it.
That is the right trade: privacy converts a reader who is already interested and
has a whole section below, whereas this sentence is competing for the click.
`ASD-STE100` rather than the spelled-out phrase because the title already
carries the words, and the spec number is what the beachhead segment types.

```
One click sets the response style of ChatGPT, Claude or any AI chat: ASD-STE100,
BLUF, plain language. Ask two at once.
```

## Category and language

- Primary category: **Productivity → Workflow & Planning**
- Language: English (add localised listings for Spanish, German, French and
  Japanese once install data shows where the demand is — the extension already
  ships 30 output languages, so the audience is there)

## Detailed description

Limit 16,000 characters; this uses roughly 5,300. Front-loaded, because the
store collapses everything after about the fourth line behind a "read more"
fold, and most readers never open it.

```
Every AI assistant has the same voice. Long, hedged, wrapped in bullet points,
opening by repeating your question back to you and closing with an offer to
help further. So you type "be concise" at the end of your prompt. Again. And
tomorrow, in a different tool, again.

Stylespec turns that into a button.

Start typing in any AI chat and a small "Set response style" pill appears next
to the box. Click it, pick a style, and the instruction is added to your draft
— visibly, where you can read and edit it before you hit send. Nothing is added
behind your back.

The library is not a list of moods. Alongside the everyday ones it carries the
writing standards people are actually held to: ASD-STE100 Simplified Technical
English, BLUF, plain language, and the house styles Google and Microsoft
publish for their own documentation.


WORKS ON EVERY ASSISTANT, NOT JUST ONE

ChatGPT, Claude, Gemini, Copilot, Perplexity, Grok, DeepSeek, Mistral, Poe,
Meta AI, Kimi, Qwen, Groq, Together, LMArena, Hugging Face Chat, Phind, You.com,
OpenRouter, AI Studio, NotebookLM, T3 Chat, Open WebUI, LibreChat and more.

Those are the ones recognised by name. Stylespec identifies chat boxes by how
they look and behave rather than by hard-coded site rules, so self-hosted
front-ends and assistants that launched last week generally work with no
update at all.

This is the part per-vendor settings cannot do. ChatGPT's Custom Instructions
are excellent — inside ChatGPT. Claude has Styles. Gemini has Saved Info. Set
up three tools, maintain three copies, watch them drift. Your Stylespec library
follows you everywhere and outlives whichever assistant you prefer this year.


ASK A SECOND ASSISTANT WITHOUT RETYPING ANYTHING

Some questions are worth more than one answer. Getting a second one normally
means selecting your prompt, copying it, opening a tab, pasting it and sending
— every time.

Open the Multiplexer in the picker, tick ChatGPT or Claude, and send the way you
always do. Each one opens in a background tab to the right of the one you are
in, already asking your question, with the style instruction attached. You never
leave the tab you were in, and you read the answers whenever you are ready.

Two things make this different from the comparison tools you may have tried.

It starts where you already are. Those tools are a destination: you type into
their sidebar or their grid instead of into your assistant, which means leaving
the conversation you were already having. Stylespec works the other way round. It
sends the draft you had already finished writing, from the site you were already
on.

The comparison is actually fair. Answers are only comparable if the prompt was
identical, and the shape of a prompt drives the shape of an answer more than
most people expect. Because the same style instruction goes to both assistants,
you are comparing the models rather than comparing one model's default
verbosity against another's.

The details worth knowing before you rely on it:

• ChatGPT and Claude are built in. Any other assistant that accepts a prompt in
  its address can be added in Settings, including an internal or self-hosted one
• Answers arrive in ordinary browser tabs, on each assistant's own site. There
  is no split-screen pane and nothing is embedded
• Nothing is collected, scored or summarised for you. Reading your answers back
  would mean reading page content, which is the one thing this extension is
  built not to do
• It arms for one prompt and then switches itself off, so a long conversation
  never turns into a wall of tabs
• Tabs open in the background and inactive. You keep your place


23 STYLE GUIDES, READY TO USE

Clarity
• Explain it like I'm 5 — everyday words and one concrete analogy
• Plain language — plainlanguage.gov: short words, active voice
• Feynman technique — first principles, and it flags what it hand-waves
• Socratic tutor — questions instead of answers, one at a time
• Hemingway — short declarative sentences, no adverbs
• No LLM tells — no em dashes, no "delve", no wrap-up paragraph
• Put the fries in the bag — answer first, zero preamble, then stop

Technical
• Simplified Technical English — ASD-STE100: one meaning per word, under 20
  words per sentence
• Google developer documentation style
• Terse senior engineer — code first, prose only where it carries weight

Professional
• BLUF / executive summary — bottom line up front, three bullets, done
• Microsoft Writing Style Guide
• Academic — formal register, hedged claims, no invented citations
• Legalese — defined terms, numbered clauses, shall and may
• Financial analyst — numbers first, assumptions stated, units labelled

Format
• Actionable checklist — numbered, verifiable, with the exact commands
• Bullets only
• Table first — lead with the comparison, explain underneath

Critique
• Devil's advocate — strongest objections first, no encouraging closer

For fun
• Pirate, Shakespearean, Corporate LinkedIn, Gen Z — accurate underneath the
  accent

Write your own too. Name it, give it an icon, type the instruction, and it sits
alongside the built-ins. The preview pane shows exactly what will land in the
chat box.


STACK MODIFIERS ON TOP

Any style can be adjusted without editing it:

• Length — terse, medium or thorough
• Formality — casual, neutral or formal
• Audience — beginner, general or expert
• Emoji — none or sparing
• Language — 30 languages, with the right register

That last one matters more than it sounds. Spanish, French, German, Italian,
Portuguese, Dutch, Polish, Russian, Ukrainian, Czech, Turkish, Japanese and
Korean carry an explicit formal or informal register, so you get usted rather
than tú, Sie rather than du, 존댓말 rather than 반말. Getting that wrong in an
email is not a small thing.


BUILT TO STAY OUT OF THE WAY

• The pill appears on your first keystroke and vanishes when you are done
• Keyboard: Command+Shift+Y on macOS, Alt+Shift+S elsewhere, rebindable
• Apply a favourite straight from the toolbar popup
• Light, dark, or match your system — because the AI site's theme and yours
  often disagree
• Turn it off for any site in one click


PRIVATE BY DESIGN, NOT BY PROMISE

Stylespec cannot run on a site unless you have said so.

Most extensions like this ask to "read and change all your data on all
websites" the moment you install them. Stylespec does not, and cannot. It loads
on the assistant sites listed above and nowhere else. Anything beyond that list
is one explicit click: the popup asks Chrome for permission to that single site,
and that is all it ever gets.

This is worth comparing against multi-assistant tools specifically. Sending one
prompt to several assistants normally requires standing access to all of them at
once. Stylespec needs no such thing: for assistants that take a prompt in their
address it passes the prompt that way and injects nothing at all.

Stylespec makes no network requests of its own. No analytics, no tracking, no
remote code, no accounts. Your prompts are read by the page you typed them into
and nowhere else. Your styles live in your browser's own sync storage.

The one time your prompt leaves the page you typed it on is when you tick a
Multiplexer target yourself, and then it goes to that assistant and nowhere
else — the same as if you had pasted it in.

This is not a policy that could quietly change next release. It is what the
extension is structurally able to do, and you can verify it: the source is
public, the manifest is 92 lines, and the whole thing is small enough to read
in an evening.

Open source: https://github.com/bilal62/stylespec


FREQUENTLY ASKED

Does this make the AI better?
No. It makes the AI answer the way you want to read. The substance is the
model's; the shape is yours.

How is the Multiplexer different from the side-by-side comparison extensions?
Those give you a dashboard with every model in it, and if that is what you want,
one of them is the better tool. Stylespec is not a dashboard. It is the assistant
you already had open, with a tick box that saves you the copying and pasting —
and it is the only one that sends the same style instruction to both sides, so
the answers are comparable in the first place.

Can it send to Gemini or Perplexity as well?
Add them in Settings. Anything that accepts a prompt in its address works, and
the built-in list stays short on purpose: those addresses are undocumented and
can change without warning, so each built-in target is a maintenance promise
rather than a line on a feature list.

Does it work with my company's internal assistant?
Yes, for both halves. Open the popup on that site and hit "Turn it on here".
Chrome asks for permission to that one site, and the same detection takes over.
That click is deliberate: it is why Stylespec does not have to ask for access to
every website you visit.

Does a longer prompt cost more tokens?
A style block is 40 to 70 words and reliably removes several hundred words of
output. It nets out cheaper.

Can I see what it adds?
That is the point. The instruction goes into your draft in plain sight and you
can edit or delete it before sending.


Simplified Technical English and ASD-STE100 are specifications of ASD. Microsoft
is a trademark of Microsoft Corporation. Google and Gemini are trademarks of
Google LLC. ChatGPT is a trademark of OpenAI. Claude is a trademark of
Anthropic. This extension is not affiliated with, endorsed by or authorised by
any of them.
```

## Store assets

Screenshots are the highest-leverage asset on the page. Most visitors decide
from images alone, so each one carries a caption burned into the image rather
than relying on the description.

**Screenshots** — 1280×800, five of them, in this order:

1. **The moment of value.** A real ChatGPT window, mid-prompt, with the pill
   showing next to the composer. Caption: *"Start typing. The pill appears."*
2. **The picker open.** Styles visible and grouped, one hovered. Caption:
   *"23 style guides, one click away."*
3. **Before and after, side by side.** The same question, answered at default
   length and then in four lines. This sells the product better than any
   sentence — show a wall of text next to four lines. Label the right-hand panel
   by behaviour (*Answer first*) rather than by the style's name; store search
   and non-English readers both need the plain words. Caption: *"Same model.
   Same question."*
4. **The multiplexer, mid-fan-out.** The picker with two targets ticked and the
   badge reading *Also sending to ChatGPT, Claude*, composited with the two new
   tabs visible in the tab strip to the right. Caption: *"One tick. The same
   question, waiting in the next tab."*

   This has to be a static image that reads instantly, which is hard for a
   feature whose whole charm is motion. Show the tab strip prominently — it is
   the only element that communicates "it already happened" without a caption.
   Do not composite a fake split-screen; implying a comparison pane the product
   does not have is the fastest route to a one-star review.
5. **The install prompt,** showing it naming the AI sites rather than every
   website. Caption: *"It cannot run where you have not let it."*

The previous image four — the same pill on Claude and Gemini, captioned *"One
library, every assistant."* — is cut to make room, and its argument is carried by
image three's caption plus the description. If a sixth slot is ever used, that is
the one to restore.

### What is already captured

`node scripts/capture-screenshots.mjs` regenerates everything that can be
produced without a signed-in assistant. It drives headless Chrome against the
UI harness and the landing page, pins the viewport to 1280×800, and waits on
computed opacity rather than a fixed delay, because both the pill and the panel
fade in and a naive capture catches them half-transparent. Output lands in
`marketing/screenshots/`.

| File | Covers | Real capture? |
| --- | --- | --- |
| `01-pill.png` | Image one, on a neutral composer | Yes, the extension's own UI |
| `02-picker.png` | Image two, picker open on Favourites | Yes |
| `02b-picker-standards.png` | Image two, scrolled to the Technical group so ASD-STE100 and the Google guide are visible | Yes |
| `03-before-after.png` | Image three | No — a rendering of the landing page's comparison panel |

Two honest caveats before these go up. `03` is an illustration of what the
styles do, not a screenshot of a model answering, so it should be replaced with
a genuine capture before submission or it risks reading as a mockup. And `01`
and `02` are shot against the harness, which is an accurate rendering of the
extension but a blank page behind it — the versions worth shipping are the same
two shots taken on a real ChatGPT or Claude window, which is a five-minute job
once the extension is loaded unpacked.

Images four and five cannot be automated at all: the multiplexer shot needs a
real tab strip, and the permission shot needs a clean profile going through the
actual install.

**Small promo tile** — 440×280. Wordmark, the pill, and: *One click. Any AI.
Your tone.*

**Marquee promo tile** — 1400×560. Three chat boxes in a row (ChatGPT, Claude,
Gemini), the same pill on each. Headline: *Stop retyping "be concise".*

## Privacy and compliance fields

Written for the reviewer, not the customer. A content script on `<all_urls>` is
the single most common cause of a rejection or a stalled review, so each answer
names the permission, the reason, and the alternative that was considered.

The single-purpose answer matters more now that the multiplexer has been
promoted in the listing. A reviewer reading the description will see two
features and look for two purposes, so the answer below frames the fan-out as
reuse of the prompt the user has just composed — which is what it is
technically, since it sends that exact string and nothing else.

**Single purpose**

```
Stylespec has one purpose: to give the user control over the prompt they are
composing in an AI chat input. It appends a writing-style instruction the user
picks, and it can hand that same finished prompt to other AI assistants the
user has selected. Every feature serves that one action — the style library,
the picker UI, the detection that finds the input, and the multiplexer, which
introduces no new content of its own and only reuses the prompt the user has
just written.
```

**Justification: `storage`**

```
Stores the user's saved styles, favourites and preferences (theme, keyboard
behaviour, per-site on/off, and any custom multiplexer providers the user has
added). chrome.storage.sync is used so a user's library follows their signed-in
Chrome profile. chrome.storage.session briefly holds a pending multiplexer job
so the destination tab can claim it on load; it is cleared automatically. No
other data is stored, and nothing is transmitted.
```

**Justification: `activeTab`**

```
When the user opens the popup on a site the extension does not yet run on, the
popup needs the tab's host in order to name it in the "Turn it on here" prompt
and to request permission for that exact origin. activeTab supplies that only
in response to the user clicking the toolbar icon. It is also what lets the
keyboard shortcut open the picker on a page the user explicitly invokes it on.
```

**Justification: `scripting`**

```
Used with chrome.scripting.registerContentScripts to add a content script for an
origin the user has just granted, so the extension works on that site on
subsequent visits, and with executeScript to inject into the already-loaded tab
at the moment permission is granted. It is never used to inject into an origin
the user has not explicitly approved.
```

**Note: opening tabs (no permission requested)**

```
The multiplexer opens a tab per assistant the user has ticked, using
chrome.tabs.create, which requires no permission. Tabs open inactive and only
to destinations the user selected. For assistants that accept a prompt in their
own URL the prompt is passed that way and nothing is injected; for the rest,
the existing content script on that origin types it into the composer, and only
into an empty one. No prompt is ever sent to an origin the user has not chosen,
no response is read back, and the extension makes no network requests of its
own.
```

**Justification: `optional_host_permissions: <all_urls>`**

```
The content script is declared statically for 31 assistant hosts, which covers
the large majority of use. But the extension cannot enumerate every AI chat:
new assistants launch constantly and many users run self-hosted front-ends on
private domains that no static list could contain.

Rather than request broad access at install time, broad access is optional and
requested one origin at a time. The user opens the popup on a site they believe
is an AI chat and clicks "Turn it on here"; Chrome then prompts for that single
origin. Nothing is injected, read or registered for any origin the user has not
approved through that prompt.

The content script only observes: it looks for an editable element matching the
profile of a chat composer and does nothing until the user clicks the
extension's own button. It reads no page content, makes no network requests, and
contains no analytics or remote code.
```

**Data usage disclosures** — tick, truthfully:

- Personally identifiable information: **No**
- Health, financial, authentication, personal communications, location, web
  history, user activity: **No** to every one
- Website content: **No.** The extension writes into an input the user has
  focused. It does not read, collect or transmit page content. The multiplexer
  reads only the text of a composer it is about to write into, to confirm it is
  empty or already holds the user's own prompt, and never reads a response.
- Sold to third parties: **No.** Used for unrelated purposes: **No.** Used to
  determine creditworthiness: **No.**
- Remote code: **No.** All code ships in the package.

A privacy policy URL is required whenever any disclosure is ticked and is worth
publishing regardless. Paste this into the dashboard:

```
https://bilal62.github.io/stylespec/privacy.html
```

It is a standalone page rather than an anchor on the landing page, because a
reviewer checking a policy should not have to scroll past marketing to find it.
Source is `docs/privacy.html`; it is versioned in git, so what the policy said
on any given date is public. Move it to the custom domain once one is
registered, and update the dashboard field in the same sitting — a dead privacy
policy URL is grounds for removal, not just rejection.
