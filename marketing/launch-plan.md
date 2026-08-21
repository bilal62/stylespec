# Stylespec — launch plan

Goal: maximise installs. Derived from `positioning.md`; channels and copy come
from `chrome-web-store.md`, `landing-page.md` and `blog-post.md`.

Numbers below labelled *plan against* are planning assumptions, not measured
data. They exist so the gates have something to compare to, and should be
replaced with real figures the week they arrive.

---

## 1. The growth model this plan is shaped around

Almost every extension launch plan optimises the wrong variable. It targets the
size of the launch-day spike, and a spike is a one-off. For extensions, the
compounding channel is **Chrome Web Store search**, and it keeps paying every
month for work done once.

So the model is a flywheel, and the launch is the crank:

```
launch spike  →  installs + ratings + low uninstall rate
                          ↓
                  store search ranking
                          ↓
              organic installs (compounding)
                          ↓
                    more ratings  ──┐
                          ↑          │
                          └──────────┘
```

Everything follows from one conclusion: **the launch is not the goal, it is fuel
for the ranking flywheel.** A 5,000-install spike that produces four ratings and
a 40% uninstall rate is worth less than a 1,500-install launch that produces
sixty ratings and an 8% uninstall rate, because only the second one still pays
in month six.

That reframing sets the priorities:

1. **Ratings volume** is the top conversion lever on the listing and a ranking
   input. It is also the thing a launch spike can buy that nothing else can.
2. **Uninstall rate** is a ranking input and, for this product, is almost
   entirely a detection-quality measure. Someone bins this on day one because
   the pill never appeared on their assistant.
3. **Listing conversion** (impression → install) multiplies every channel at
   once. Screenshots and the permission warning do most of that work.
4. **Spike size** matters last, and only insofar as it feeds the first three.

## 1b. Two search vocabularies, and a mistake worth not repeating

The product does two jobs, and the people searching for each use words that never
overlap. Planning around one set of keywords leaves the other channel unbuilt.

**Style intent** — *chatgpt concise*, *stop bullet points*, *AI tone of voice*,
*explain like I'm 5*, *simplified technical english*. Low competition, high
intent, and the phrases the preset SEO pages are already built for.

**Fan-out intent** — *compare AI side by side*, *send prompt to multiple AI*,
*ask ChatGPT and Claude the same question*, *multi AI chat*. Higher competition
and a different reader: someone comparing tools rather than nursing a grievance.

The mistake, recorded because it was cheap to make and expensive to act on: the
store appears to contain no AI multiplexer, and it does not. Searching for
"multiplexer" returns nothing because **nobody in the category uses that word.**
Search the phrases above and there are at least seven shipping competitors —
Side-by-Side AI, AskAll (22+ providers), Parallel Chat, AiGrid, Bread Prompter,
SuperCompare AI, ChatStorm.

Two consequences for this plan:

- **Never claim the category.** No "first", no "only", no "nobody else does
  this". Those competitors have engaged users who will arrive in the comments,
  and one overreaching claim discredits the privacy story by association. The
  differentiation is architectural and it is written up in `positioning.md`: it
  starts where you already are, and it normalises the prompt so the comparison is
  about the models. Fight there, never on provider count.
- **"Multiplexer" is a good product name and a useless keyword.** Keep it in the
  UI, where it is distinctive and accurate. Keep it out of the store name, the
  short description and page titles, which need the words people type.

## 2. The gating decision: fix the permission model first

> **Status: done.** Implemented before this plan was finished. The content
> script now matches 31 named assistant hosts, `<all_urls>` moved to
> `optional_host_permissions`, and the popup requests a single origin behind
> **Turn it on here**. The rest of this section is kept as the rationale, and
> because the reasoning is what the store listing has to argue.

This is the highest-leverage item in the plan and it is not a marketing task.

Stylespec declares a content script on `<all_urls>`. Two consequences, both
severe:

**It gates the launch date.** Google's own documentation says broad host
permissions take longer, and the developer dashboard warns outright that an
in-depth review "will delay publishing". Reported timelines for `<all_urls>`
run **one to three weeks**, and a new developer account adds to that. Standard
reviews finish in under a day. You cannot pick a launch date until you are
approved, and every day of a launch built on an unapproved listing is a day of
risk.

**It suppresses install conversion, permanently.** At the install prompt,
`<all_urls>` reads *"Read and change all your data on all websites."* That
sentence appears at the exact moment of decision, to an audience that has just
read a pitch about how private the extension is. The irony is total: the most
privacy-respecting extension in its category shows the same warning as the worst
one.

### Recommendation

Split the difference the way the product's own architecture already suggests:

- **Declared content script on the ~26 known assistant hosts.** These cover the
  overwhelming majority of real usage, and it works out of the box with no
  prompt. The warning becomes *"Read and change your data on chatgpt.com,
  claude.ai and 24 other sites"* — specific, legible, and obviously
  proportionate to what the product does.
- **`optional_host_permissions: ["<all_urls>"]`**, requested at runtime when the
  user hits **Force it on** for a site that is not in the list, then injected
  with `chrome.scripting`. The popup already has that button and that mental
  model.

What it buys:

| | Today | Recommended |
| --- | --- | --- |
| Review time | 1–3 weeks, in-depth | Likely days |
| Install warning | All your data on all websites | Named AI sites |
| Privacy story | "Trust the manifest" | "It cannot even run where you have not allowed it" |
| Unknown assistants | Work silently | Work after one click |

What it costs: the "works on an assistant I have never heard of, with no
action" promise becomes "works after one click". That is a real regression to
the core differentiator, and it is worth it. The user who runs a self-hosted
front-end is technical enough to click once, and this converts the permission
model from the pitch's weakest point into its strongest.

**Do this before submitting.** Retrofitting it after launch means a second
in-depth review and a second wait.

## 3. Phases

### Phase 0 — T-30 to T-22: get into the queue

The queue is the long pole. Everything else can be done while waiting.

- [x] Implement the permission split above. Re-run `scripts/selftest.mjs`.
- [ ] Load unpacked in a clean profile and confirm the install prompt names the
      AI sites rather than "all your data on all websites". This is the whole
      point of the change and the only way to verify it is to look.
- [ ] Walk the grant flow end to end on a site outside the match list: popup →
      **Turn it on here** → Chrome prompt → pill appears without a reload.
- [ ] Register `stylespec.com` before anything ships with the name on it, and
      point `responsestyle.com` and `answerstyle.com` at it if they are still
      free — they cost less than a rename and catch the literal searches the
      brand name will not.
- [ ] Set the store name to
      `Stylespec — AI Response Style: Simplified Technical English, BLUF`
      (65/75). Microsoft, Google and Gemini are deliberately absent: vendor
      marks in an extension title need written permission. See the trademark
      section of `chrome-web-store.md`.
- [ ] Submit to the Chrome Web Store. **Submit before the assets are perfect** —
      the listing can be edited during and after review, but the clock only
      starts once.
- [ ] Publish the privacy policy (the landing page privacy section is enough).
- [ ] Ship code unminified. Reviewers explicitly weight hard-to-review code, and
      this codebase has no build step, which is an advantage worth keeping.
- [ ] Set `chrome.runtime.setUninstallURL` to a one-question form: *"What were
      you hoping it would do?"* This is the only honest way to measure churn in a
      product with no telemetry — it fires on uninstall, collects nothing about
      the user, and directly instruments the metric that matters most.

### Phase 1 — T-21 to T-8: soft launch and seed the flywheel

Approved but unannounced. Nobody is looking, which is exactly when to find out
what is broken.

- [ ] **Recruit 30–50 real users.** Friends, colleagues, two or three small
      Slack and Discord communities. Ask each of them directly for a rating.
      This is the single most important pre-launch task: a listing with 40
      ratings converts and ranks dramatically better than one with three, and
      launch-day traffic hitting a zero-rating listing is traffic wasted.
- [ ] **Fix every detection miss they report.** Uninstall rate is the ranking
      input you control least visibly and this is the week to buy it down.
- [ ] Verify the pill on the top ten assistants by traffic, in a clean profile.
- [ ] **Build the public playground** (below) — highest-leverage build task.
- [ ] Publish the preset SEO pages so they have two weeks to get indexed.
- [ ] Line up the beachhead: join Write the Docs Slack, tekom and STC forums now
      and post nothing. Arriving to promote on day one is how you get removed.

### Phase 2 — T-7 to T-1: ammunition

- [ ] Final screenshots, with the before/after as image three and the
      mid-fan-out shot as image four. The tab strip has to be legible in that
      one; it is the only element that says "this already happened" without a
      caption. Do not composite a split-screen that the product does not have.
- [ ] Cut the 6-second hero loop, style only. The fan-out needs its own,
      wider loop for the landing page — it reads as nothing in a still image and
      as obvious in two seconds of video, so it is the one asset worth shooting
      twice.
- [ ] Write every post in full, in advance. Launch day is for responding to
      comments, not drafting.
- [ ] Draft newsletter pitches (TLDR, Ben's Bites, Superhuman, The Rundown).
      Send T-3 so they can schedule.
- [ ] Pre-write the FAQ replies you will be typing forty times: "why not Custom
      Instructions", "what can it see", "Firefox?".

### Phase 3 — launch week

Stagger the channels. Two reasons: each one feeds the next, and if detection
breaks for a large cohort you want to discover it on Tuesday with one channel
spent rather than five.

**Tuesday — Hacker News.** The most important call of the week: **lead with the
engineering post, not the product.** HN is allergic to product launches and
receptive to "here is a hard problem I hit". `blog-post.md` is built for this —
the detection story, reading a minified bundle to find the composer, the test
that was passing for the wrong reason. The extension is the footnote. Post
08:00–10:00 ET. Then stay in the thread all day; the first two hours of comment
response determine whether it survives.

**Wednesday — Reddit, staggered.** Never the same copy twice; each subreddit gets
a post written for it, and several require reading the self-promotion rules
first.

- r/ChatGPT, r/OpenAI — the before/after image carries these
- r/ChatGPTCoding, r/LocalLLaMA — "Put the fries in the bag", terse engineer
- r/technicalwriting — the beachhead, ASD-STE100 angle, highest conversion
- r/chrome_extensions, r/productivity — softer, later in the week

Lead with the style layer in every one of these. The fan-out is a strong second
paragraph and a bad opening: it invites an immediate "AskAll already does this
with 22 models" from someone who is right on the facts, and you then spend the
thread on a comparison instead of on the product. If it comes up anyway — and in
r/ChatGPT it will — concede the feature comparison cheerfully and pivot to the
two architectural points. Never argue provider count.

The one place to lead with the fan-out is a dedicated post about the *fair
comparison* argument: that model comparisons circulating on these subreddits are
usually confounded by prompt shape. That is a genuinely interesting claim, it is
demonstrable with two screenshots, and the product is incidental to it. Worth its
own post a week after launch rather than a launch-day slot.

**Thursday — Product Hunt.** Launches at 00:01 PT. Worth it for extensions:
durable backlink, a second traffic wave, and social proof for the listing.
Needs the gallery, a strong first comment and a hunter lined up in Phase 2.

**Friday — the beachhead, properly.** Write the Docs, tekom, STC. Narrow pitch:
one click of enforced ASD-STE100. Small audience, highest intent, and the source
of the "only tool that does this" quote that everything else can cite.

**Throughout.** Reply to every store review, including the bad ones, especially
the bad ones. Ship a detection fix within 24 hours of each report and say so in
the reply. Publicly fast bug-fixing is itself a conversion asset.

### Phase 4 — T+7 to T+90: the part that compounds

- **Localise the store listing.** Underrated and nearly free. Almost nobody
  localises, so store search in German, Spanish, French, Japanese, Portuguese
  and Russian is uncontested. The product already ships 30 output languages, so
  the audience demonstrably exists. Start with the five largest.
- **Ask for the rating in-product.** After a user has applied a style ten times,
  once, dismissible forever, linking to the review page. Ten applications means
  they are a habitual user and the ask is fair. This is the difference between
  a listing that accrues ratings and one that stalls at launch-week volume.
- **One preset page a week.** "What is BLUF", "What ASD-STE100 actually
  requires", "Why AI writes the way it does". Educational intent, product as the
  natural answer, and each one ranks on its own.
- **A comparison page**: "ChatGPT Custom Instructions alternative". High intent,
  low competition, and it is the objection everyone already has.
- **A second comparison page for the fan-out vocabulary**: "ask ChatGPT and
  Claude the same question". Higher competition, and it has to be written
  honestly — name the dashboard tools, say plainly when one of them is the better
  choice, and make the argument on where you type and what gets sent. A page that
  pretends to win on features loses the reader who has already installed AskAll,
  and that reader is most of this traffic.
- **One post on prompt-shape confounding.** The claim that side-by-side model
  comparisons are usually invalid because the prompts were not normalised is the
  most defensible original thing this product has to say. It ranks on its own
  terms, it makes the multiplexer's design look inevitable rather than minimal,
  and no competitor can publish it.
- **Merge preset pull requests fast.** Every merged style is a contributor with
  a reason to tell people, and it is the cheapest growth loop available.
- **Pursue a Chrome Web Store feature.** Editorial featuring is worth more than
  any single launch channel. The criteria reward exactly what this codebase
  already is: clean UX, minimal permissions, good listing assets.

## 4. Two build tasks worth more than any post

**The public playground.** `scripts/ui-harness.html` is already a fake
ProseMirror chat running the real content scripts against a stubbed `chrome`
API. That is most of a try-before-you-install demo. Polishing it and putting it
on the landing page is the highest-leverage build task in this plan.

Extensions convert badly because install is a heavy ask made before any value
has been demonstrated. A playground inverts that: you feel the product, then
install. It also gives HN and Reddit something to click that is not a store
listing, which reliably outperforms a store link in both traffic and goodwill.

**The before/after image.** One creative does the work of every headline: a
600-word default answer beside the same answer in four lines. It needs no
reading and survives being shrunk to a thumbnail. Use it as store screenshot
three, the Open Graph image, the Product Hunt gallery cover and the lead image
on every Reddit post.

Cut two versions of it, differing only in the label on the right-hand panel:
*Answer first* for the store, the landing page and Product Hunt, and *Put the
fries in the bag* for Reddit and Hacker News. Same asset, ten minutes of extra
work, and it stops the funniest thing in the product from being the first thing
a documentation manager judges it on. See the messaging note in
`positioning.md`.

## 5. Channel expectations

Ranked by expected installs per hour of effort. *Plan against* figures are
order-of-magnitude planning assumptions to size the funnel, nothing more.

| Channel | Effort | Plan against | Why this number |
| --- | --- | --- | --- |
| Store search (ongoing) | High upfront, then zero | Compounding; dominant by month 3 | The only channel that pays rent |
| Hacker News (front page) | 1 day | 500–2,000 | Wide band — mostly out of your control |
| Hacker News (no traction) | 1 day | <100 | The realistic modal outcome; plan for it |
| Reddit, per good post | 2 hours | 100–500 | Depends almost entirely on the image |
| Product Hunt | 1 day | 200–600 | Plus a durable backlink |
| Newsletter pickup | 1 hour to pitch | 300–1,500 each | Low hit rate, excellent when it lands |
| Beachhead communities | 3 hours | 50–150 | Small, but the highest intent and the best quotes |
| Paid ads | — | Skip | No monetisation, so no positive ROI at any CPI |

## 6. Metrics and gates

The product has no telemetry by design, and that stays. Everything below comes
from store analytics or the uninstall survey.

**Weekly:**

- Installs, split by source where the store reports it
- **Uninstall rate within 7 days** — the health metric. Read it as a direct
  measure of detection failures.
- **Ratings count and average** — the flywheel input
- **Impression → install rate** — listing conversion; move it with screenshots
- Uninstall survey responses, read individually, not aggregated

**Gates:**

- *7-day uninstall rate above 25%* → stop all promotion. You are pouring traffic
  into a leaking bucket and burning channels you cannot re-use. Fix detection
  first; the survey responses will say what broke.
- *Under 20 ratings entering launch week* → delay the launch a week and go back
  to Phase 1 recruiting. Launch traffic hitting an unrated listing is spent, not
  invested.
- *HN post does not take* → do not resubmit and do not ask for votes. Move to
  Wednesday and treat Reddit as the primary channel. A second HN attempt, from a
  different angle, is fair after roughly three months.
- *Impression → install below 3%* → the problem is the listing, not the traffic.
  Rework screenshots first, then the short description.

## 7. What to skip

- **Paid acquisition.** Free product, no revenue, no path to positive ROI.
- **A launch-day Twitter thread as a primary channel** unless there is already
  an audience. Support the other channels with it; do not count on it.
- **Review incentives.** Against store policy and grounds for removal.
- **Launching on all channels at once.** The temptation is real and it wastes
  every channel but the first.
- **Waiting for the product to be finished.** It will not be. The gate is
  whether detection holds on the top ten assistants, and nothing else.
- **Racing the comparison tools on provider count.** Shipping eight more
  built-in targets the week before launch to look competitive would mean eight
  undocumented URL parameters to maintain and a wave of "it opened a blank tab"
  reviews, which is a direct hit on the one metric that gates promotion. Expand
  the list steadily after launch, driven by what people ask for in issues.
- **Any claim to have invented the category.** Covered above, and worth
  repeating here because it is the tempting line and the expensive one.
