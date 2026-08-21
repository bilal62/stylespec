# Demo script — engineering audience

**Run time:** 3 minutes. **Slides:** none.

The pitch is one sentence: *you already type "be concise" ten times a day, and it
never sticks.* Everything else is proof. Engineers discount claims and trust
artifacts, so the demo is five artifacts in a row: the bad answer, the good
answer, the same thing on a second assistant, two tabs opening by themselves, and
the manifest.

Do not tour the settings page. Do not explain the preset library. One message,
one moment, one ask.

The multiplexer beat is new and it is the one most likely to overrun, because it
is the most fun to talk about. It is thirty seconds. Set a timer in rehearsal.

---

## Pre-flight

Ten minutes before, not during.

- [ ] Extension loaded unpacked, `node scripts/selftest.mjs` green.
- [ ] Settings → Appearance → **Light** (or Dark) to match the assistant's
      theme. A dark pill over a light Claude window reads as broken.
- [ ] ChatGPT and Claude open in two tabs, both logged in, both on a fresh chat.
- [ ] Custom Instructions **off** in ChatGPT. If they are on, your "before" is
      not the before everyone else lives with.
- [ ] **Signed in to Claude in this profile, and confirm the fan-out works
      end to end once.** A logged-out target lands on a sign-in page, which
      demos the exact opposite of the point. This is the single most likely thing
      to break on stage.
- [ ] Close spare tabs. The tab strip is the visual payoff of beat 4 and it does
      not read if there are already fourteen tabs open.
- [ ] Browser zoom at 125% or more. The pill is small on a projector.
- [ ] Fallback ready: `python3 -m http.server 8731` →
      `http://localhost:8731/scripts/ui-harness.html`. Use it only if a live
      site fails; the real sites are the better demo.

---

## Beat 1 — The wall of text (0:00–0:30)

Say nothing about the product yet. Open ChatGPT, already on screen, and type:

```
How do I center a div?
```

Send it. Let it generate for a beat, then scroll the answer.

> "Everybody knows this answer. It's four hundred words. It restates my
> question, it gives me three approaches with the trade-offs, and it offers to
> help me with anything else.
>
> I wanted one line. So I do what all of you do — I go back and add 'be
> concise' to the end of the prompt. Then I do it again on the next one. Then I
> switch to Claude and start over."

**Why this beat:** never open with what the product is. Open with the thing the
room is already annoyed by. Thirty seconds of shared grievance buys you the next
two minutes.

---

## Beat 2 — The moment (0:30–1:15)

New chat. Start typing the same question — slowly, so the room sees it happen.

```
How do I center a div?
```

> "First keystroke."

A **Set response style** pill appears beside the composer. Pause on it. Click
it. The picker opens.

> "Twenty-three of these. This is the one you want."

Pick **Terse senior engineer** (⌨️). The block lands in the draft:

```
How do I center a div?

---
Response style — Terse senior engineer:
Answer like a senior engineer reviewing a pull request under time pressure.
Code, commands, and config first; prose only where it carries information the
code cannot. No tutorials, no explaining language basics, no "first, let us
understand". Assume I know the ecosystem. Flag in one line the failure mode I
am most likely to hit.
```

Point at the draft box, not the picker. **This is the whole demo.**

> "Two things. One, that's not an adjective — it's a paragraph of actual
> instruction, and I'd never type it by hand. Two, look where it is. It's in my
> draft. Not hidden in a system prompt, not buried in a settings page. I can
> read it, edit it, or delete it before I send."

Send it. Let the answer land next to the previous one.

> "Same question. Four lines and the gotcha."

**Why this beat:** the visible block is the differentiator, and it looks like a
downside until you name it as a choice. Engineers distrust anything that
silently rewrites their input. Say "in plain sight" out loud.

---

## Beat 3 — Every assistant (1:15–1:40)

Switch to the Claude tab. Type anything short. The same pill appears.

> "Same pill. Same library. I didn't configure anything here.
>
> ChatGPT has Custom Instructions, Claude has Styles. Both are per-vendor and
> both are always-on. This is per-message, and it's the same twenty-three styles
> across thirty-one assistants — plus whatever you switch to in six months."

Do not demo a third assistant. The point is made; a third is a tour.

**Why this beat:** "it works on ChatGPT" is a feature. "It works on the
assistant you haven't adopted yet" is the position. It also sets up beat 4: the
room is now thinking about having several assistants open.

---

## Beat 4 — Two at once (1:40–2:10)

Back to ChatGPT. New chat. This beat only works if the tab strip is visible, so
make sure it is on screen before you start typing.

```
Is Postgres or SQLite the right default for a new side project?
```

Apply **Devil's advocate**. Then open the **Multiplexer** row in the picker and
tick **Claude**. The pill's badge changes to *Also sending to Claude*.

> "One tick. Now watch the tab bar, not the answer."

Press Enter. A tab slides in to the right, already asking the same question. Do
not switch to it yet — the fact that you did not have to is the point.

> "I never left this tab. That prompt — the whole thing, style block included —
> is already in Claude. Two answers to a question I typed once.
>
> And it disarms itself. My next message is 'what about Turso', and Claude never
> saw the first answer, so it stays here."

Now name the difference, briefly, because a chunk of the room has tried one of
the side-by-side extensions:

> "There are half a dozen extensions that do multi-model comparison, and some are
> good. Every one of them is a destination — you type into their sidebar instead
> of your assistant's box.
>
> This is the other direction. It sends the draft I'd already written, from the
> site I was already on. And it's the only one that sends the same style
> instruction to both, which is the bit that actually matters: if the prompts
> aren't identical you're comparing prompt shapes, not models."

Then switch to the Claude tab for two seconds, show the answer sitting there, and
move on.

**Why this beat:** the value is obvious the moment it is seen and nearly
impossible to convey in a sentence, which is why it is a demo beat rather than a
bullet. Keep it to thirty seconds and resist opening the provider settings.

**Do not say:** "sends to every assistant" (two are built in), or imply a
split-screen view exists. If asked, the honest line is: "two built in, plus
anything that takes a prompt in its URL — and the short list is deliberate,
because those URL parameters are undocumented and I'd rather ship four that work
than twenty that rot."

---

## Beat 5 — Why it holds up (2:10–2:45)

This is the beat that converts engineers specifically. Skip it for any other
audience.

> "Two things you're probably wondering.
>
> **How does it know that's a chat box?** Site selectors rot in weeks, so
> they're only confidence boosts, never gates. Every text box gets scored on
> placeholder text, a send button nearby, size and position, whether it's stuck
> in a login form. Clear a threshold and it has to also clear an evidence gate —
> a 'Stop generating' control, or just the shape of a composer with no email
> field next to it. That's why it works on your internal assistant that's never
> heard of me, without an update. Recognised composers score in the twenties.
> Nearest false positive is a six.
>
> **And how did it know I'd pressed send?** It didn't. There's no event for that
> — Enter might be a newline, a slash-command menu, or an IME candidate. So it
> reads your draft on a plausible Enter and then polls until the composer
> actually goes empty. Only an empty composer counts as a send, because a false
> positive here means tabs you didn't ask for.
>
> **Where do my prompts go?** Nowhere I control. No network calls, no analytics,
> no accounts, no remote code. The content script is declared for thirty-one
> hosts and nothing else. And the fan-out passes prompts in the URL wherever it
> can, so for those targets it injects nothing at all — which is why this doesn't
> need standing access to every assistant, the way a comparison dashboard has
> to."

If someone looks skeptical, open `manifest.json` on screen for five seconds.

> "Ninety-two lines. Zero dependencies. That's not a privacy policy that can
> change next release, it's what the thing is structurally able to do."

---

## Close — the ask (2:45–3:00)

One ask, stated once, with a next action.

> "Not on the Web Store yet — it's in review. Clone it and load unpacked, it's
> five seconds, there's no build step.
>
> What I actually want from this room is presets. If you have a house style you
> already have to follow — an API docs style guide, a commit message convention,
> whatever your team argues about in review — that's a name, an emoji and one
> paragraph in `presets.js`. Best PR I can get."

Then stop. Do not open the settings page.

---

## Q&A prep

Engineers will ask these. Short answers, then move on.

**"Doesn't this pollute my prompt / burn tokens?"**
Yes, about sixty tokens. You were typing "be concise" anyway, and the paragraph
does what the two words don't. Visible is the trade: the alternative is
something silently rewriting what you typed.

**"Why not just use Custom Instructions?"**
Because they're always-on and per-vendor. You don't want "answer like a senior
engineer" on the email you're drafting. Per-message is the feature.

**"Why not a text expander / snippet manager?"**
That's the honest competitor for the style half. Difference is the pill knows
it's in a chat box and puts your styles one click away in it, plus modifiers
stack — length, formality, audience, emoji, thirty languages with correct
register.

**"How is this different from AskAll / Parallel Chat / Side-by-Side AI?"**
The honest answer, and do not get defensive: they're dashboards, several are
good, and they support far more models. If you want every answer collected in one
window, use one of those. This isn't a dashboard — it's the assistant you already
had open with a tick box, and it's the only one that normalises the prompt so the
two answers are comparable. Also: they need standing access to every assistant
they embed. This doesn't.

**"Can it send to Gemini / Perplexity / my internal thing?"**
Add it in Settings — a name and a URL with `{prompt}` in it. If the site has no
URL parameter it opens the site and types into the composer, which needs that
site turned on first.

**"What happens if I'm logged out of the target?"**
You get a sign-in page with your prompt lost. Known rough edge; the prompt is
still in your original tab, so nothing is destroyed.

**"Does it read the answers back to compare them?"**
No, deliberately. That would mean reading page content, and not having that
capability is what the permission story rests on.

**"Does it work on our internal assistant?"**
Popup → **Turn it on here**. Chrome grants that one origin, heuristics take over.
That usually works first time. If it doesn't, **Force it on** bypasses the gate.

**"What if it shows up on a contact form?"**
Occasionally it will — erring toward appearing is deliberate for a tool that
claims to work on assistants it's never seen. **Turn off here** in the popup,
one click, remembered per site.

**"Firefox? Safari?"**
Not yet.

---

## If the live demo breaks

Do not debug on stage. One sentence, then the harness:

> "This is what I get for demoing on someone else's frontend."

`http://localhost:8731/scripts/ui-harness.html` — a fake ProseMirror composer
running the real content scripts. The pill, picker and insertion all work. Run
Beat 2 there and skip Beats 3 and 4.

If only the fan-out fails — a logged-out target, or a provider that changed its
URL parameter this morning — do not retry it live. Say the honest thing and move
to Beat 5:

> "That's an undocumented URL parameter on someone else's site, which is exactly
> why the built-in list is two providers long and not twenty."
