# Every AI assistant has the same voice

*A universal response-style control for AI chat, and two problems that turned
out to be harder than the feature: finding a text box, and noticing that someone
pressed send.*

---

There is a particular sentence I have typed several thousand times.

> ...and be concise.

Sometimes it is "no bullet points." Sometimes "just give me the code." Always at
the end of a prompt, always as an afterthought, and always again on the next
one. I have typed it into ChatGPT, into Claude, into Gemini, into a self-hosted
thing on a laptop with no internet. It never sticks, because there is nowhere
for it to stick to.

So I built the button. It is called Stylespec, it is a Chrome extension, it is
open source, and this is the story of why the interesting parts turned out to be
nothing to do with prompts.

## The default voice is not an accident

Every mainstream assistant writes the same way. Long, hedged, bulleted, opening
by restating your question and closing with an offer to help further. It is easy
to read that as laziness. It is not.

That voice is the correct answer to an impossible constraint. One default has to
serve someone who has never used a chatbot and someone on their fortieth prompt
of the day. It has to look thorough, because the humans who rated these outputs
during training rewarded answers that looked thorough. Nobody is going to fix
this, because from the vendor's side it is not broken.

The cost lands entirely on the returning user, and it is not the cost people
name. We say "I have to type 'be concise' every time," which sounds like a
typing problem — the kind a text expander solves. The actual cost is reading six
hundred words to find the forty that mattered. The typing is three seconds. The
reading is the tax, and you pay it on every single answer.

## Why the built-in settings do not close this

The obvious objection: ChatGPT has Custom Instructions, Claude has Styles,
Gemini has Saved Info. All true, all good, and none of them solve the problem
for two structural reasons.

**They are per vendor.** Configure three tools, maintain three copies, watch
them drift apart. I have three assistants open right now and so, I suspect, do
you.

**They are per account, not per message.** My style depends on the task, not on
who I am. I want a Socratic tutor when I am learning something, a terse engineer
when I am debugging, and plain language when I am writing for someone else — and
I want to switch between those three inside one session. Account-level settings
make that a trip to a settings page.

The gap is the intersection: nothing is both message-level and vendor-neutral.
That is the whole product.

## What it does

You start typing in an AI chat. A small pill appears next to the box. You click
it, pick a style, and the instruction is appended to your draft:

```
How do I center a div?

---
Response style — Put the fries in the bag:
Skip the preamble, the restatement of my question, and the compliments. Lead
with the answer or the code on the very first line. No hedging, and no "it
depends" unless you immediately say what it depends on. No summary paragraph at
the end and no offer of further help. When you have answered, stop.
```

It lands in the draft, visibly, where you can edit or delete it before sending.
That was a deliberate choice over the slicker option of injecting it invisibly.
Partly trust — an extension that silently modifies your prompts is a thing you
should be nervous about. Partly education: after a week you start noticing which
phrasings actually change the output, which is the fastest prompt-engineering
lesson I know.

Twenty-three styles ship with it. Some are real standards — ASD-STE100 Simplified
Technical English, plainlanguage.gov, the Google developer documentation style
guide, the Microsoft Writing Style Guide. Some are the ones I actually wanted:
"No LLM tells" bans em dashes, "delve", "tapestry" and the closing paragraph
that summarises the paragraph above it. "Put the fries in the bag" is the one I
use forty times a day.

On top of any style you can stack length, formality, audience, emoji and one of
thirty output languages. The languages carry an explicit register where the
language has one, so you get `usted` rather than `tú`, `Sie` rather than `du`,
존댓말 rather than 반말. Ask any non-native speaker how much that matters.

That is the product. It took a weekend. Now the interesting parts.

## The hard problem: finding the text box

To put text into a chat composer, you must first find the chat composer. I
assumed this was an afternoon of CSS selectors. It is the bulk of the codebase
and the only part I expect to still be working on next year.

The naive approach fails immediately:

```js
document.querySelector('#prompt-textarea')  // works until Tuesday
```

Site-specific selectors rot. These apps ship constantly, their class names are
compiler output, and every redesign silently breaks you. Worse, a selector list
is a permanent commitment to the assistants that already exist. Someone running
a self-hosted front-end, or an internal company assistant, or something that
launched last week, gets nothing — and those users are exactly the ones a
vendor-neutral tool is *for*.

So detection is heuristic-first. Site rules exist for about twenty-six
assistants, but only as confidence boosts. They can never be the thing that
gates a decision. Strip them all out and the extension still works.

Instead every candidate element gets scored on evidence:

```js
if (kind === 'contenteditable' || kind === 'textarea') value += 3;
if (strong) value += 5; else if (weak) value += 2;
if (sendButton) value += 3;
if (rect.bottom > window.innerHeight * 0.5) value += 2;
if (rect.width > window.innerWidth * 0.3) value += 1;
if (inLoginForm(el)) value -= 5;
if (inChrome(el)) value -= 3;
```

Placeholder text, a nearby send button, position on the page, size, whether it
is trapped in a login form or a navigation bar. Clears eight, it is a chat box.

## The part I got wrong twice

Scoring alone does not work, and the reason is annoying: **a contact form looks
exactly like a chat composer.** Multi-line box, adjacent button, sensible
placeholder. My first version put a "Set response style" pill on the contact
page of every company on the internet.

So I added a second gate. Score high *and* produce evidence the site is actually
an AI product — a known host, an unmistakable placeholder, or an AI-ish word in
the page title. That killed the false positives.

It also, I discovered this week, killed a real assistant.

Someone sent me a page where the pill never appeared. The app is a genuine AI
product, and it failed the gate because:

- the hostname contains no AI word,
- it is a single-page app whose served HTML has no `<title>` at all,
- and the composer's placeholder is an ordinary sentence about what you want to
  do.

Nothing about that product announces itself as AI, because it does not need to.
Its users know. My gate was testing whether a site was *branded* as AI, which is
a proxy for the thing I actually cared about, and proxies fail at the edges.

I guessed at a fix, shipped it, and it did not work either. So I stopped
guessing. The page renders client-side, so there is no markup to read — but the
markup has to come from somewhere, and that somewhere is a JavaScript bundle you
can just download:

```
curl -s https://[the-app]/_next/static/chunks/pages/[...].js | rg -o '.{300}"textarea".{200}'
```

Two minutes later I had the component. A bare `<textarea rows={1}>`, no
`aria-label`, no `id`, no `name`, nothing but a placeholder passed in as a prop.
No wonder the hint patterns found nothing. But the same bundle also had this:

```
"aria-label":"Stop generating"
"aria-label":"Open chat history"
"aria-label":"Jump to latest"
"aria-label":"Search chats"
```

Which is the answer. I had been asking what the page *calls itself* when I
should have been asking what it *does*. No contact form offers to stop
generating. No marketing site has a "jump to latest". These controls are
worthless outside a conversation UI, which makes them near-perfect evidence —
and they are matched against accessible names only, so an article about chatbots
stays inert.

The second half of the fix was deleting a line I had been quietly proud of. My
composer-shape rule required the box to sit in the bottom half of the window,
which is true of every chat app right up until the moment it isn't: the *empty
state* of most assistants, ChatGPT included, centres the composer. That is
exactly the screen someone is looking at when they install this. Position went
back to being a scoring bonus rather than a requirement.

That left the hole it had been plugging — a contact form is still a multi-line
box with a button. What actually separates the two is not position but company:
a contact form stands among name, email and subject fields, and a chat composer
stands alone. So that became the test, and it works whether or not there is a
`<form>` wrapping it, because half of them are built from divs.

Which caught something else. Writing the test for it, I found that my existing
"contact form on an AI company's site" case had been passing for the wrong
reason: the runner grabbed the first editable element in the fixture, which was
the *name field*, not the textarea. Point it at the right element and the case
had been failing all along, scoring exactly 8 against a threshold of 8. A test
that asserts the right answer about the wrong thing is worse than no test,
because it tells you to stop looking.

The scores now separate cleanly: real composers 11 to 21, the worst false
positive 6.

I want to be honest that this remains a heuristic with a tuning knob, not a
solved problem. It will misfire. A standalone feedback widget with a Send button
still qualifies, and I decided that is the right side to be wrong on — a tool
whose entire pitch is "works on assistants I have never heard of" should fail
toward showing up, and one click turns it off per site. The interesting question
was never "how do I detect AI chats". It was "which direction should my errors
point", and that is a product decision wearing an engineering costume.

## The second hard problem: noticing that you pressed send

The other thing I wanted was smaller and turned out to be just as awkward.

If you have three assistants open, the questions worth asking twice are the ones
you care most about, and asking twice is entirely clerical: select the prompt,
copy it, open a tab, paste, send. So: a tick box in the picker. Tick ChatGPT,
send your prompt as usual, and it also opens in a background tab, already asking
the same thing.

I assumed the hard part would be the other providers. It was the word "send".

**There is no event for "the user submitted a prompt".** There is no
`beforesubmit` on a div. Enter might insert a newline. It might dismiss a
slash-command menu. It might accept an IME candidate — and if you have ever
watched someone type Japanese into a chat box, Enter is load-bearing several
times per sentence before anything gets sent. Plenty of composers want Cmd+Enter
instead. Meanwhile the send button is a `div` with an SVG in it, half the time
disabled until the draft is non-empty, and it is not always in the event path you
expect.

Guessing wrong here is not a cosmetic bug. A false positive opens tabs nobody
asked for, which is roughly the worst thing a browser extension can do to you.

The fix was to stop trying to detect the send at all, and instead detect its
consequence:

```js
if (!gone && SayWhat.insertText.isEmptyDraft(el)) {
  done(true);
  return;
}
```

A plausible-looking Enter, or a click on something send-shaped, only causes the
draft to be *read and remembered*. Then it polls, every 60ms for a second and a
half, waiting to see whether the composer actually emptied. An empty composer is
the only thing that counts as a send. Enter in the middle of an IME candidate
leaves your text sitting there, the poll times out, and nothing happens.

Which is when ChatGPT taught me the exception. Sending your first message there
navigates from `/` to `/c/<id>`, and React can rebuild the composer rather than
clear it. The element I was polling was no longer connected to the document, so
my check never fired — on the single most common send there is.

So "cleared" has a second definition: the element is gone *and* a fresh, empty
composer has taken its place. That one needs a guard, because "the element
vanished and there is now an empty text box" also describes navigating to a page
with a search field in it. The replacement has to pass the same detection the
original did, on its own merits.

## Handing a prompt to someone else's web app

Delivery had its own version of the same problem: you cannot know what the other
end is going to do.

ChatGPT and Claude both accept a prompt in the URL — `?q=`, undocumented, in
place since early 2024. Convenient, and it means the fan-out injects nothing at
all into those pages: navigate and walk away. But some providers auto-submit a
URL prompt and some merely fill the box, and the behaviour has been reported both
ways for the same provider at different times.

Rather than maintain a per-provider table of a behaviour nobody has documented, I
made the receiving side check what it finds:

- **`confirm` mode** — the prompt travelled in the URL. Press send only if the
  composer is still holding that text. If the provider already submitted, the box
  is empty and there is nothing to do.
- **`fill` mode** — for providers with no URL parameter, and for prompts long
  enough that the query string risks being truncated. Type it in, but only into a
  composer that is empty.

`confirm` never inserts and `fill` never touches a composer with content in it,
so neither path can double-post. That property is what makes it safe for a
provider to boot the content script twice, or to submit on its own schedule.

One more thing that looked trivial and was not: deciding whether the text in the
box is the text you sent. You cannot compare it literally. A prompt with a style
block is multi-line, and rich editors model each line as its own block element,
so reading it back gives you a blank line everywhere you sent a single newline.
Comparing on collapsed whitespace keeps the guarantee that actually matters —
this is our text, not something the user has started typing — without encoding
assumptions about how any given editor represents a paragraph.

Finally, the multiplexer disarms itself after one prompt. This is not a
convenience; it is the difference between a feature and a mess. Your follow-up is
"make it shorter", and that means nothing to an assistant that never saw the
first answer. Staying armed would turn one conversation into a wall of tabs.

## Three smaller fights

**Writing into the box.** You cannot set `element.value` on a React input.
React installs its own property descriptor and your assignment vanishes at the
next render. You have to reach past it for the native setter:

```js
const proto = HTMLTextAreaElement.prototype;
const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
descriptor.set.call(el, value);
el.dispatchEvent(new Event('input', { bubbles: true }));
```

Rich editors ignore even that. ChatGPT and Claude run ProseMirror, Gemini runs
Quill, Meta AI runs Lexical, and all of them maintain a document model that the
DOM merely reflects. They only accept input they believe came from a human, so
the reliable route is to forge a paste event with a `DataTransfer`. The tell
that it worked is subtle: an editor that handles a paste calls
`preventDefault()`, so `dispatchEvent` returning false means it took ownership.
I originally diffed the content afterwards instead, which double-inserted the
text on any editor that applied the change asynchronously.

**Claude blocked my stylesheet.** The UI lives in a shadow root, and I styled it
by appending a `<style>` element. On Claude, nothing rendered. Their Content
Security Policy blocks injected style elements, and it blocks fetching the CSS
at runtime too. The way through is a constructed stylesheet, which is not
subject to `style-src` because no parser is involved:

```js
const sheet = new CSSStyleSheet();
sheet.replaceSync(SayWhat.UI_CSS);
shadow.adoptedStyleSheets = [sheet];
```

The CSS is now bundled into a JS string at build time, with a test that fails if
the two drift apart.

**Testing something that only exists in a browser.** Detection logic is exactly
the kind of code that quietly rots, and mine could only be exercised by opening
a fixture page and looking at it. So I wrote about 130 lines of fake DOM — a
selector matcher covering only the grammar the detector actually uses, elements
with real geometry, a stub `window` — and now the scoring rules run in `node
scripts/selftest.mjs` alongside everything else. It caught two regressions while
I was writing this post. The lesson I keep relearning: a test you have to
remember to run is not a test.

## What it cannot do

It does not make the model smarter. It changes the shape the answer arrives in,
not its substance, and anything claiming otherwise is selling something.

It will miss composers. When it does, the toolbar popup can force detection on
for that site — which, embarrassingly, did not work until this week, because
forcing bypassed the denylist but not the evidence gate sitting behind it. An
escape hatch you never test is not an escape hatch.

The multiplexer is not a comparison dashboard. Answers land in ordinary tabs and
nothing is collected, scored or summarised for you, which is a real limitation
next to the several extensions that do exactly that. It is also deliberate:
reading your answers back would mean reading page content, and not having that
capability is the whole basis of the privacy claim below. I would rather be
narrower and keep the claim.

On which — I spent a while convinced this feature was unusual, because searching
the extension store for "multiplexer" returns nothing. That turns out to say
more about the word than the market. Search "compare AI side by side" and there
are half a dozen good tools. A vocabulary gap is not a market gap, and I nearly
wrote a launch around one.

And it has no moat, which I am relaxed about. The presets are copyable and the
code is public on purpose. If a vendor ships a per-message style picker
tomorrow, good — I would use it, and the cross-vendor argument survives anyway.

## The permission thing

The first version of this ran a content script on `<all_urls>`, which is how you
get a tool that works on an assistant nobody has heard of yet. It is also how
you get Chrome to tell every prospective user that this extension can "read and
change all your data on all websites" — at the exact moment they are deciding,
right after reading my paragraph about how private it is.

So I gave that up. The content script is declared for 31 assistant hosts and
nothing else. Everything beyond that list is opt-in, one origin at a time: you
open the popup on a site, hit **Turn it on here**, and Chrome asks about that
single domain. The extension never touches an origin you have not approved.

It costs a click on the rare site I do not already know about, and I went back
and forth on it, because "works on anything, no setup" was the pitch. But the
honest version of a privacy claim is not a promise in a README, it is a
capability you do not have. No network requests, no analytics, no accounts, no
remote code, and now no standing access to your browsing either — checkable in
about ninety seconds by reading a ninety-two-line manifest.

This is also why the fan-out passes prompts in the URL wherever it can. Sending
one prompt to several assistants would normally require standing access to all of
them; passing it in the address bar means injecting nothing into those pages at
all.

I care about this more than is strictly proportionate, because of what an AI
chat log actually is. Half-formed ideas, code that has not shipped, medical
questions, things you would not ask a colleague. An extension sitting on top of
that with permission to phone home is a genuinely serious thing to install, and
the category is full of them. The right response is not a trust badge. It is not
having the capability.

## Try it

[Chrome Web Store] · [Source]

It is free, there is no paid tier planned, and there is nothing to sign up for.
If it does not appear on an assistant you use, open an issue — a miss is a bug,
and fixing one usually fixes a whole class of them.

If you want to contribute, the easiest useful thing is a preset. It is a
name, an emoji and a paragraph of instruction, and I would particularly like
house style guides from people who have to follow one for a living.
