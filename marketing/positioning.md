# Stylespec — positioning and go-to-market

Internal. Every other file in this folder is derived from this one; if a claim
does not appear here, it should not appear in the copy.

## The problem, stated precisely

Every mainstream assistant has converged on the same house voice: long, hedged,
heavily bulleted, opening with a restatement of your question and closing with
an offer to help further. That is not a bug. It is the rational default when one
voice has to serve a first-time user and a staff engineer at the same time, and
when the training signal rewards answers that *look* thorough.

The cost lands on the returning user, and it is not the cost people name. Users
say "I have to type 'be concise' every time," which sounds like a typing
problem worth a text expander. The real cost is attention: you read 600 words to
find the 40 that mattered, on every prompt, in every tool. The typing is
seconds. The reading is the tax.

What makes it a product opportunity rather than a complaint is the shape of the
cost. It **recurs and never accumulates**. Fixing the voice on this prompt does
nothing for the next one, and nothing at all for the next tool. There is no
artifact, no saved state, no compounding. That is the definition of a job worth
automating.

There is a second job next to it, and it has the same shape. Heavy users do not
use one assistant, they use three, and on anything that matters they ask more
than one. Today that means selecting the prompt, copying it, opening a tab,
pasting it, and sending — per assistant, every time. Also recurring, also
accumulating nothing.

Both jobs live in the same place: the moment after you have finished writing a
prompt and before you have got an answer you trust. That moment is the product.

## Competitive alternatives

Two distinct competitive sets, because the product does two things. Treating
them as one set is how the copy ends up vague.

### For setting the style

Not "competitors" — what people actually do today instead.

| Alternative | Why people use it | Where it breaks |
| --- | --- | --- |
| Type the instruction each time | Free, no setup, works everywhere | Recurs forever; you stop bothering on the prompts that need it most |
| Vendor settings (ChatGPT Custom Instructions, Claude Styles, Gemini Saved Info) | Persistent, official, well-built | One per vendor, so you configure and maintain N copies that drift apart. Account-level, not message-level: being a Socratic tutor for one question and a terse engineer for the next means editing settings between prompts |
| Custom GPTs, Projects, system prompts | Powerful, sharable | Heavyweight — you create and manage an artifact for what should be a toggle. Per-vendor again |
| Text expanders and prompt-manager extensions | General-purpose, mature | Know nothing about AI chats; no curated style library; many read page content or route text through their own servers |

The gap is consistent across all four: **nothing is both message-level and
vendor-neutral.** That intersection is the position.

### For asking more than one assistant

This set is real, and it is crowded. Assuming otherwise was a mistake worth
recording, because it was easy to make: **nobody in the category uses the word
"multiplexer".** Searching the store for it returns nothing, which reads as an
empty category and is not one. The phrases that actually rank are *compare AI
side by side*, *send prompt to multiple AI*, *multi AI chat* and *broadcast
prompt*.

Shipping extensions in this space include Side-by-Side AI, AskAll (22+ provider
presets), Parallel Chat, AiGrid, Bread Prompter, SuperCompare AI and ChatStorm.
On a feature-count comparison, Stylespec loses to most of them: two built-in
targets against twenty-two, no side-by-side pane, no response collection, no
export.

So the multiplexer is **not** a category claim, and the copy must never imply it
is first or only. What it has instead is a different architecture, and two
advantages that fall out of it:

| | The comparison tools | Stylespec |
| --- | --- | --- |
| Where you type | Their sidebar, grid or split-screen | The assistant you already opened |
| What gets sent | What you typed into their box | The prompt you had already written, style block included |
| Comparison validity | Same words, whatever shape each model defaults to | Same words *and* the same style instruction |
| Site access | Broad, across every assistant they embed | 31 named hosts, and opt-in one origin at a time |
| Reading the answers | In their frame, often an iframe | On the assistant's own site, with its own features intact |

**Advantage one: it starts from where you are.** Every competitor is a
destination — you go to their UI and type there, which means abandoning the
assistant you had already opened and the conversation you were already in. Say
What is in-place. It fans out the draft you had already finished writing. The
cost of a second opinion drops to ticking a box before you press Enter.

**Advantage two: the comparison is fair.** This one appears to be genuinely
unclaimed. Comparing two assistants is only informative if the prompt is
identical, and prompt-shape drives answer-shape more than most people credit.
Because Stylespec attaches the same style block to every copy it sends, you are
comparing the models rather than comparing one model's default verbosity against
another's. No competitor normalises the prompt, because none of them has a style
layer to normalise it with.

That second point is the reason the two halves of this product belong in one
product rather than two, and it should be stated in the copy in roughly those
words.

## Positioning statement

> For people who use AI assistants every day and are tired of the default voice,
> **Stylespec** is a browser extension that puts a reusable style library one
> click from every AI chat box — and can send that same styled prompt to a
> second assistant without leaving the first. Unlike per-vendor settings such as
> Custom Instructions or Claude Styles, Stylespec works on every assistant,
> applies per message rather than per account, and shows you exactly what it adds
> before you send.

Category language: a **response style layer** for AI chat, with fan-out
attached. Not a prompt manager, not a chatbot wrapper, not a comparison
dashboard. The nearest honest analogy is a universal remote — one control that
works on everything you own, including the thing you buy next year.

"Response style" is the fixed category phrase and should not be paraphrased.
It appears in the product UI already (the pill reads *Set response style*), in
the store title, in the landing hero and in the presets file, which calls them
`built-in response styleguides`. Consistency across those surfaces is worth more
than variety.

## The name, and the keywords it has to survive

The product is a **style-guide switcher**, not a tone picker. Five of the
presets are named public standards — ASD-STE100, the Microsoft Writing Style
Guide, the Google developer documentation style guide, plainlanguage.gov and
BLUF — and that is the credible, defensible half of the library. `Stylespec`
was chosen to sound like the specifications it applies; ASD-STE100 describes
itself as an international specification, so the brand and the beachhead
keyword reinforce each other.

Two constraints fall out of the keyword set and bind every asset:

- **Microsoft and Google cannot appear in a product name or store title.**
  Google's branding guidelines require written permission, and Microsoft asks
  that a name not begin with its mark. Gemini is covered by the same rule. Both
  guides may be named in body copy with attribution. See the trademark section
  of `chrome-web-store.md` for the exact attribution block.
- **ASD-STE100 has two parts, rules and a controlled dictionary.** The
  extension injects the rules as an instruction and never checks output against
  the dictionary. The copy says *follows the ASD-STE100 writing rules*. It must
  never say *STE compliant*, *certified* or *official*, because a technical
  writer knows the difference and that is the entire beachhead.

Names rejected, recorded so the argument is not relitigated: *Stylespec* pointed
at the user's input rather than the assistant's output and read as a dictation
tool; *Promptman* is a live macOS prompt manager with every domain taken;
*Housestyle* is the better English but is descriptive, unprotectable and already
used by Editor Software in the writing-standards category.

## Pillars

Everything in the copy ladders up to one of these. In priority order, and the
order is deliberate: the style layer leads because it is the daily habit, the
uncontested claim and the thing that makes the multiplexer worth having.

**1. One click, not a paragraph.** 23 built-in style guides, plus stackable
modifiers for length, formality, audience, emoji and 30 target languages. Per
message, so the style can change as fast as the task does. This is the pillar
that earns the install and creates the habit.

**2. Everywhere, not per-vendor.** 31 assistant hosts work on install, and
detection is heuristic-first, so self-hosted and brand-new AI UIs work after one
click to grant that site. Your style library outlives whichever tool you are
loyal to this quarter.

**3. Ask a second assistant without retyping.** Tick a target, send as normal,
and the prompt you already wrote opens in a background tab, style block
included. In-place rather than a destination, and the only fan-out that
normalises the prompt so the comparison is about the models. Built-in targets are
ChatGPT and Claude; anything that accepts a prompt in its URL can be added.

This pillar is promoted from a footnote, where it previously sat. It is the
strongest *differentiator* in the product even though pillar 1 is the strongest
*hook*, and the reason for the ordering is that the multiplexer is a
lower-frequency job. People will use it weekly and the style picker forty times a
day. Lead with the habit, but give the multiplexer real estate in every asset —
a named section, not a bullet — because it is what makes the product hard to
describe as "another tone extension".

**4. It cannot spy on you.** The extension never asks for access to every site
you visit. It loads on 31 named assistants; anything else is opt-in, one origin
at a time. It makes no network requests. Everything it does happens inside the
page and inside `chrome.storage.sync`. The source is public and small enough to
read in an evening.

Pillar 4 is underrated and should be pushed harder than instinct suggests. The
category is full of extensions that read everything you type into an AI chat,
which is among the most sensitive text a person produces. "Structurally
incapable of exfiltration, and here is the manifest" is a claim almost nobody
else in the category can make. It converts the security-conscious segment, and
it is the difference between an IT department blocking this and allowing it. It
also lands directly against the comparison tools, which need broad standing
access across every assistant they embed in order to work at all.

A supporting differentiator, not a pillar: **the instruction lands in your draft,
visibly.** Nothing invisible is bolted onto your prompt. It is a trust feature,
and a teaching one — users learn prompt engineering by watching what gets added.

### Claims the multiplexer copy must not make

Accuracy here is not pedantry: the competing extensions are well reviewed, their
users will arrive in the comments, and one overreaching sentence discredits the
privacy pillar by association.

- **Not** "the first" or "the only" multiplexer, or any phrasing implying the
  category is empty. It is not.
- **Not** "send to every assistant at once". Two are built in. Say "ChatGPT and
  Claude, plus any assistant you add".
- **Not** a side-by-side comparison view. Answers arrive in ordinary tabs, and
  the copy should say tabs, because a reader expecting panes will feel misled.
- **Not** "compare responses automatically". Nothing is collected, scored or
  summarised. Deliberately — collection would require reading page content,
  which is exactly the capability pillar 4 is built on not having.
- Do not promise a specific provider works for ever. URL prompt parameters are
  undocumented on every provider that has one and can change without notice.

The honest frame is narrower and still strong: *one tick before you send, and
the prompt you already wrote is waiting in a second tab.*

### Where the jokes go

The style library has one genuinely funny name in it — "Put the fries in the
bag" — and it is an asset. It is the only preset with a personality, it
describes its behaviour exactly, and distinctiveness is the scarcest resource a
free extension has. Keep it, and do not sand it down.

But keep it out of the hero slots, which means the store screenshots, the store
description's opening, the landing page hero and the Open Graph image. Three
reasons, none of which apply to it sitting in a list:

- **It collides with the beachhead.** The pitch to technical writers is one
  click of enforced ASD-STE100, a real aerospace standard. Someone evaluating
  that seriously, whose first impression is a fast-food meme, quietly downgrades
  how serious the ASD-STE100 claim is.
- **It has a shelf life the product does not.** A style library should read as
  durable infrastructure. A dated hero example dates everything around it, and
  in two years it reads as unmaintained rather than fun.
- **It cannot be translated or searched.** Localised listings are a core part of
  the launch plan, and nobody types "put the fries in the bag" into store
  search. They type *concise*, *shorter answers*, *no preamble*. The hero is
  where the plain words have to be.

So: hero assets name the **behaviour** — "answer first, no preamble". Reddit,
Hacker News, the blog post and the styles list itself get the real name, because
that audience is exactly who it lands with. It should be the thing people
discover and screenshot, not the thing they are first judged on.

## Segments

Ranked by frequency of pain × ease of reach × likelihood of evangelising.

**1. Developers — the volume play.** Highest prompt frequency, lowest tolerance
for preamble. "Put the fries in the bag" and "Terse senior engineer" were
written for them. Reachable through Hacker News, Lobsters, r/ChatGPTCoding,
r/LocalLLaMA. They install extensions without asking permission, and they read
source before trusting it, which makes pillar 4 land. They are also the segment
most likely to already keep three assistants open, which is where the
multiplexer sells itself.

**2. Technical writers and documentation teams — the beachhead.** ASD-STE100,
the Google developer documentation style guide and the Microsoft Writing Style
Guide are not preferences for these people, they are the job. A tool that makes
an assistant obey ASD-STE100 with one click is the only one of its kind, and the
segment is small enough to reach exhaustively (Write the Docs, tekom, STC). This
is the classic beachhead: narrow, acute, uncontested, and quotable.

**3. Non-native English speakers and multilingual teams.** 30 languages, 13 of
them with explicit T–V or honorific register — `tú`/`usted`, `du`/`Sie`,
반말/존댓말. Getting the register wrong is socially costly in a way English
speakers underrate, and no competitor handles it thoughtfully.

**4. People who cross-check answers.** Researchers, analysts, anyone who does
not trust one model on a decision that matters. This is the multiplexer's own
segment and it is reachable through the phrases they already search — *compare
ChatGPT and Claude*, *ask multiple AI at once*. Worth listing separately because
the copy that converts them is not the copy that converts segment 1, and because
they arrive already comparing Stylespec against the seven tools above.

**5. Educators, tutors and parents.** "Explain it like I'm 5" and "Socratic
tutor" sell themselves. Large, diffuse, reachable mostly through store search.

**6. Enterprise brand and communications teams — expansion, not launch.** Shared
style packs mean everyone's AI output sounds like the company. This is where a
business model would live if one were ever wanted. Do not build for it yet.

## Sequencing

Launch to the beachhead and the volume play in the same week, because they
reinforce: technical writers give the credible "only tool that does X" story,
developers give reach and audit the code in public.

1. **Ship quietly.** Store listing live, repo public, landing page up.
2. **Beachhead first.** Write the Docs Slack, tekom, STC forums. The pitch is
   narrow and concrete: one click of enforced ASD-STE100.
3. **Volume second, 48 hours later.** Hacker News with the engineering post, not
   the marketing one. The detection problem is the interesting part; lead with
   it and let the product be the footnote.
4. **Long tail, ongoing.** Store search does the rest. Optimise the listing for
   the phrases people actually type, in both categories: "chatgpt concise",
   "stop bullet points", "explain like I'm 5", "simplified technical english",
   and separately "compare AI side by side", "send prompt to multiple AI".

## Growth loops

- **Content.** Each preset is a post that ranks on its own: what BLUF is, what
  ASD-STE100 is, why AI writes the way it does. Educational intent, product as
  the natural answer. Cheap, compounding, and it never feels like an ad.
- **Contribution.** Presets are a nearly frictionless first pull request. Every
  merged style is a contributor with a reason to tell people.
- **Portability.** The more assistants someone uses, the more the vendor-neutral
  argument bites, and the more the multiplexer is worth. The market trend is
  toward more assistants, not fewer, so both pillars strengthen over time.

## Metrics

Installs are a vanity number for extensions; the store inflates them and they
say nothing about whether the thing is used.

- **North star: styles applied per weekly active user.** This is a habit product
  or it is nothing.
- **Activation: share of installs that apply a style within 24 hours.** If the
  pill never appeared on the user's assistant, this is where it shows up.
- **7-day uninstall rate** (the store reports it). Read it as a direct measure
  of detection failures — the main reason someone bins this on day one is that
  it did not appear where they expected.
- Explicitly **not** tracked in the product: there is no telemetry, by design.
  These come from store analytics only. That constraint is a deliberate trade of
  measurement for trust, and it is the right trade here. It also means the
  multiplexer's usage rate is unmeasurable, so decide its roadmap priority from
  reviews and issues rather than waiting for data that will never arrive.

## Objection handling

**"ChatGPT already has Custom Instructions."** It does, and it is good — inside
ChatGPT, for every message, until you change it. Stylespec is per message and
works on the other assistants too. Most heavy users have three open right now.

**"Why not just type it?"** Because you already do, and you stop bothering
precisely when you are busy, which is when a 600-word answer costs the most.

**"Doesn't a longer prompt cost more tokens?"** A style block is 40–70 words.
It reliably removes several hundred words of output. It nets out cheaper on both
tokens and reading time.

**"AskAll / Parallel Chat / Side-by-Side AI already does the multi-AI thing, and
supports more models."** True, and if a comparison dashboard is what someone
wants, one of those is the better tool — say so, because pretending otherwise
loses the argument with anyone who has tried both. Stylespec is not a dashboard.
It is the assistant you already use, with a tick box that saves you the copy and
paste, and the only one that sends the same style instruction to both sides so
the answers are actually comparable. Also worth naming: those tools need
standing access across every assistant they embed. Stylespec does not.

**"Only two providers?"** Two built in, plus anything you add that takes a
prompt in its URL. It is a deliberate floor rather than a ceiling — every
built-in target is an undocumented URL parameter that can break without notice,
so each one carries a maintenance promise. Expanding the list is cheap and
planned; claiming twenty and shipping four broken ones is not.

**"What can this extension see?"** The assistant sites it is built for, plus any
site you have explicitly turned it on for. Nothing else — it is not permitted to
run anywhere else, so this is not a matter of trust. And it cannot send anything
anywhere: no network calls, no analytics, no remote code. Read `manifest.json` —
it is 92 lines.

**"Will it keep working when ChatGPT redesigns?"** Site-specific selectors are
hints that raise confidence, never gates. Detection is heuristic, so an
assistant that ships tomorrow works today.

## Honest risks

For internal use. None of this belongs in the copy, but pretending it does not
exist is how launches fail.

- **No durable moat.** The presets are copyable and the code is public by
  choice. What is actually hard is the detection layer and the taste in the
  preset library, and neither stops a determined cloner. Distribution and being
  first are the only real defences.
- **The multiplexer is the weakest entrant on a feature comparison.** Anyone
  evaluating it against AskAll or Parallel Chat on capability alone will pick
  them. The in-place and same-prompt arguments are real but they are subtle, and
  subtle arguments lose in store listings. Mitigation: never fight on provider
  count, always fight on where you type and what gets sent.
- **Provider URL parameters are undocumented.** Both built-in targets rely on
  behaviour no vendor has committed to. When one breaks it looks like the
  extension is broken. Mitigation: `confirm` mode already degrades to filling
  the composer, and the failure toast names the provider it could not reach.
- **Platform risk.** Any vendor could ship a per-message style picker; some are
  partway there. The vendor-neutral argument survives that, but the per-message
  one weakens.
- **Maintenance drag.** Heuristics decay. Every assistant redesign is a small
  tax, and an unmaintained detection layer is a dead product.
- **Two value propositions is one more than ideal.** A store listing has about
  four lines above the fold and every line spent on the multiplexer is a line
  not spent on the hook. The resolution is ordering, not balance: style first
  everywhere, multiplexer as a named section immediately after. Resist the pull
  to give them equal weight in the hero.
- **Store review risk.** Largely retired: the content script matches named hosts
  and broad access is optional, which avoids the in-depth review that
  `<all_urls>` reliably triggers. The single-purpose narrative now has to cover
  tab creation as well, so it is written to present the multiplexer as reuse of
  the prompt the user just composed rather than as a second feature. See
  `chrome-web-store.md`.
- **No revenue and no plan for it.** Fine while the maintenance cost is a few
  hours a month; not fine if it succeeds. The honest position is that this stays
  free and small unless the enterprise segment pulls hard enough to justify a
  real business.
