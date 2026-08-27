# Landing page copy

Section-by-section copy for stylespec.com. Everything in
brackets is a build note rather than copy. The page has one job — get the
install — so there is exactly one call to action, repeated, and no navigation
that leads away from it.

**Built and live** at https://bilal62.github.io/stylespec/, served by GitHub
Pages from `docs/` on `main`. The implementation is `docs/index.html`, a single
dependency-free file matching the extension's own palette, plus
`docs/privacy.html` for the policy the store requires. Repoint both at the
custom domain once it is registered. The copy below stays the source of truth:
edit here first, then the HTML.

Section order matters here and is not arbitrary. The style layer carries the
hero because it is the hook; the multiplexer sits directly after the
portability section, while the reader is already thinking about using several
assistants, and before the objection-handling section. See `positioning.md`.

---

## Hero

**Headline**

> Stop retyping "be concise".

**Subhead**

> Stylespec puts your response style one click from every AI chat box — real
> style guides, not moods — and sends the same styled prompt to a second
> assistant when one answer is not enough.

**Primary CTA:** `Add to Chrome — free`
**Secondary, quieter, underneath:** `View the source` → GitHub

**Trust line under the buttons**

> No broad site access. No network requests. No accounts. Open source.

[Hero visual: a looping 6-second screen capture, no audio, no chrome around it.
Type a question into ChatGPT, the pill fades in, one click, the style block
lands in the draft. The whole loop should read without a caption. This does more
work than the headline; budget accordingly.

Keep the multiplexer out of this loop. It needs the tab strip to make sense,
which means either a wider crop or a longer loop, and both cost the clarity that
makes this asset work. It gets its own video further down.]

---

## The problem

> ### Every assistant has the same voice
>
> Long. Hedged. Bulleted. It repeats your question back to you, then offers to
> help further.
>
> That is the right default when one voice has to serve everybody. It is the
> wrong one for you, on the fortieth prompt of the day, when you already know
> what you asked.
>
> So you type "be concise" at the end. And "no bullet points". And "just the
> code". Every time, in every tool, and never once does it stick.

[Side-by-side panel. Left: a real 600-word answer, scrollable, slightly faded.
Right: the same answer in four lines. Label them *Default* and *Answer first*.
Nothing sells this faster than the shape of the two blocks of text next to each
other.

Label the style by its behaviour here, not by its name. The style doing the work
is "Put the fries in the bag", and that name is an asset in the styles list and
on Reddit — but the hero has to stay legible to someone evaluating this for
professional writing, and has to survive translation. See the messaging note in
`positioning.md`.]

---

## How it works

> ### Three seconds, once
>
> **1. Type your question.** Anywhere. The pill appears next to the box on your
> first keystroke.
>
> **2. Pick a style.** 23 built in, or write your own. Stack length, formality,
> audience, emoji and language on top.
>
> **3. Send.** The instruction lands in your draft, in plain sight, where you
> can still edit it.

**Callout, set apart:**

> Nothing is added behind your back. You see every word before it goes.

---

## Styles

> ### The style guides you actually wanted
>
> **Simplified Technical English** — Real ASD-STE100. One approved meaning per
> word, sentences under twenty words, one instruction per sentence.
>
> **Explain it like I'm 5** — Everyday words and one concrete analogy, held all
> the way through.
>
> **No LLM tells** — No em dashes. No "delve", no "tapestry", no "testament to".
> No closing paragraph summarising the paragraph above it.
>
> **BLUF** — Bottom line up front, at most three supporting bullets, under 150
> words.
>
> **Put the fries in the bag** — Answer first. No preamble, no restatement, no
> "great question". When it has answered, it stops.
>
> **Terse senior engineer** — Code and commands first. Prose only where it
> carries something the code cannot.
>
> **Devil's advocate** — Assumes your idea is flawed and finds the strongest
> reasons why. Leads with the failure most likely to actually happen.
>
> **Socratic tutor** — Refuses to answer. Asks the one question that moves you
> forward, and waits.
>
> Plus Plain language, Feynman, Hemingway, Google and Microsoft house styles,
> Academic, Legalese, Checklist, Bullets only, Table first — and Pirate,
> Shakespearean, Corporate LinkedIn and Gen Z, which stay accurate underneath
> the accent.

**Below the grid:**

> Write your own in thirty seconds. Name it, type the instruction, star it to
> pin it to the top.

---

## Everywhere

> ### Your styles outlive your favourite assistant
>
> ChatGPT · Claude · Gemini · Copilot · Perplexity · Grok · DeepSeek · Mistral ·
> Poe · Meta AI · Kimi · Qwen · Groq · Together · LMArena · Hugging Face Chat ·
> Phind · You.com · OpenRouter · AI Studio · NotebookLM · T3 Chat · Open WebUI ·
> LibreChat
>
> Those are the ones recognised by name. Stylespec finds chat boxes by how they
> look and behave, not by a list of domains — so your company's internal
> assistant, your self-hosted front-end, and whatever launches next month
> generally work on day one.

[Logo wall, greyscale, no hover states. Keep it calm.]

---

## Multiplexer

The section that has to earn its place. Everything before it is about one
assistant, and the reader arrives here already holding the thought "I use three
of these". Lead with the manual labour it removes, then immediately separate it
from the comparison dashboards, because a meaningful share of this audience has
tried one.

> ### One tick, and a second assistant is already answering
>
> Some questions deserve more than one answer, and getting a second one means
> selecting your prompt, copying it, opening a tab, pasting it, sending. Every
> time.
>
> Tick ChatGPT or Claude in the picker and just send. Each opens in a background
> tab to the right, already asking your question, with your style instruction
> attached. You never leave the tab you were in.
>
> It arms for one prompt and switches itself off, so a conversation never turns
> into a wall of tabs.

**Two-up, immediately below. This is the differentiation and it should not be
buried in prose:**

> **It starts where you already are.**
> The side-by-side tools are a destination — you type into their box instead of
> your assistant's, abandoning the conversation you were already in. Stylespec
> works the other way round. It sends the draft you had already written, from
> the site you were already on.
>
> **The comparison is actually fair.**
> Two answers are only comparable if the prompt was identical, and prompt shape
> drives answer shape more than people expect. The same style instruction goes
> to both, so you are comparing the models — not one model's default verbosity
> against another's.

**Quieter, underneath, in smaller type:**

> ChatGPT and Claude built in; add any assistant that takes a prompt in its
> address, including an internal one. Answers arrive in normal tabs on each
> assistant's own site — there is no split-screen pane, and nothing is read back
> or scored for you.

[Screen recording, muted, looping: hit Enter, two tabs slide in to the right,
the original never loses focus. This one sells itself in motion and reads as
nothing in a static image, so it has to be video. Frame it wide enough that the
tab strip is legible, because the tab strip is the whole story.

Do not stage a split-screen or a grid of answers in any asset on this page. It is
the single easiest way to make an accurate product look like it under-delivers.]

---

## Against the alternative

> ### "Doesn't ChatGPT already do this?"
>
> It does, inside ChatGPT, for every message, until you go and change it. Which
> is genuinely useful, and not the same thing.

| | Vendor settings | Stylespec |
| --- | --- | --- |
| Works on | One assistant | Every assistant |
| Applies | To every message | To this message |
| Switching style | Open settings, edit, save | One click |
| Keeping them in sync | Three tools, three copies | One library |
| What it adds | Hidden in the system prompt | Visible in your draft |

> Most people reading this have three assistants open right now. That is the
> whole argument.

---

## Privacy

> ### It cannot run where you have not let it
>
> Install almost any extension like this and Chrome warns you it can "read and
> change all your data on all websites". Stylespec never asks for that.
>
> It runs on the assistant sites you would expect, and nowhere else. Anything
> beyond that is one explicit click, granting one site at a time.
>
> That is unusual for anything that talks to several assistants at once, which
> normally needs standing access to all of them. Stylespec passes the prompt in
> the address bar instead, so for most targets it injects nothing at all.
>
> No network requests. No analytics, no telemetry, no accounts, no remote code.
> Your prompts are read by the site you typed them into and by nothing else.
> Your styles sit in your browser's own sync storage.
>
> Your AI chats are among the most revealing text you produce — half-formed
> ideas, code you have not shipped, things you would not ask a colleague. An
> extension that watches that is a serious thing to install. This one is
> incapable of it, and you do not have to take that on faith.

**CTA:** `Read the manifest — it's 92 lines`

[Worth an inline visual: a screenshot of the actual Chrome install prompt,
naming the AI sites. The competitor comparison makes itself and needs no
caption.]

---

## FAQ

> **Does this make the AI smarter?**
> No, and anything claiming otherwise is selling something. The substance stays
> the model's. Stylespec changes the shape it arrives in — which, most days, is
> the part costing you time.
>
> **How is the Multiplexer different from the side-by-side comparison
> extensions?**
> Those are dashboards, and several are good. If you want every model in one
> window with the answers collected for you, use one of them. Stylespec is the
> assistant you already had open, plus a tick box that saves you the copy and
> paste — and it is the only one that sends the same style instruction to both
> sides, which is what makes two answers comparable at all.
>
> **Can it send to Gemini, Perplexity or Grok?**
> Add them in Settings, along with anything else that takes a prompt in its
> address. The built-in list is short deliberately: those addresses are
> undocumented and can change without warning, so each one we ship is a
> maintenance promise rather than a line on a feature list.
>
> **Will it break when ChatGPT redesigns?**
> Probably not. Site-specific rules are only confidence boosts; the detection
> underneath looks at the shape of the page. That is why unreleased assistants
> tend to work already.
>
> **It didn't appear on my assistant.**
> Open the toolbar popup and hit **Turn it on here**. Chrome will ask permission
> for that one site, and detection takes over from there. Then please open an
> issue — a miss is a bug worth fixing, and fixing one usually fixes a class.
>
> **Why doesn't it just work everywhere?**
> Because working everywhere means asking, on install, for permission to read
> every website you visit. We would rather cost you one click on the rare site
> we do not already know.
>
> **Doesn't a longer prompt cost more tokens?**
> A style block is 40 to 70 words and removes several hundred words of output.
> It nets out cheaper, in tokens and in reading time.
>
> **Can I use it for work?**
> Yes. No data leaves the machine, so there is nothing for a security review to
> object to. Point them at the source.
>
> **Firefox? Safari?**
> Not yet. The code is standard Manifest V3, so a Firefox build is mostly
> packaging. Open an issue if you want it and it moves up the list.
>
> **What does it cost?**
> Nothing. No paid tier is planned, no accounts, no upsell.

---

## Closing

> ### Set the style once. Use it everywhere.

**CTA:** `Add to Chrome — free`

**Under it:** `Open source · No broad site access · No tracking`

---

## Meta

**Title tag** (60 chars max)

```
Stylespec — set the response style of any AI chat
```

**Meta description** (155 chars max)

```
One click sets the response style of ChatGPT, Claude, Gemini or any AI chat:
ASD-STE100, BLUF, plain language. 23 style guides, no tracking.
```

**Open Graph image:** the before-and-after panel from the problem section. It is
the most legible asset at thumbnail size and needs no reading to understand.

**Target phrases** — these are the queries people actually type, and each one
deserves its own post rather than being stuffed in here.

Style intent: *make ChatGPT concise*, *stop ChatGPT using bullet points*,
*ChatGPT tone of voice extension*, *AI response style*, *explain like I'm 5
extension*, *remove AI em dashes*.

Standards intent — the beachhead, and the cheapest traffic on this list because
nothing in the extension category is competing for it. Nobody has claimed
*apply a named style guide to a live AI chat*: the only results today are
GitHub agent-skill files and standalone dictionary checkers. Phrases: *simplified
technical english tool*, *ASD-STE100 checker*, *BLUF writing*, *plain language
AI*, *Microsoft writing style guide AI*, *Google developer documentation style
AI*. Each deserves its own post, and the last two carry the attribution
requirement in the trademark section of `chrome-web-store.md`.

Fan-out intent: *compare AI side by side*, *send prompt to multiple AI*, *ask
ChatGPT and Claude the same question*, *multi AI chat extension*. Higher
competition than the style phrases and a different reader — someone comparing
tools rather than nursing a grievance. Landing pages for these should open on the
in-place argument, not on the style library, and should not pretend to be a
dashboard. Note that nobody searches "multiplexer"; it is a good product name and
a useless keyword.
