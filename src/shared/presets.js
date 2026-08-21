/* Stylespec — built-in response styleguides.
 * Loaded as a classic script in every surface (content script, popup, options,
 * service worker) and exposed on the shared `SayWhat` global, because MV3
 * content scripts cannot use ES module imports.
 */
(function () {
  const SayWhat = (globalThis.SayWhat = globalThis.SayWhat || {});

  const GROUPS = [
    { id: 'clarity', name: 'Clarity' },
    { id: 'technical', name: 'Technical' },
    { id: 'professional', name: 'Professional' },
    { id: 'format', name: 'Format' },
    { id: 'critique', name: 'Critique' },
    { id: 'fun', name: 'For fun' },
  ];

  const PRESETS = [
    {
      id: 'ste',
      name: 'Simplified Technical English',
      emoji: '🛠',
      group: 'technical',
      blurb: 'ASD-STE100: one meaning per word, short sentences',
      instruction:
        'Write in ASD-STE100 Simplified Technical English. Use one approved meaning per word, and never swap in a synonym for a concept you have already named. Keep sentences under 20 words. Give one instruction per sentence. Use the active voice, the present tense, and the imperative for steps. Keep articles like "the" and "a" rather than dropping them. Avoid idioms, metaphors, phrasal verbs, and noun clusters longer than three words.',
    },
    {
      id: 'eli5',
      name: "Explain it like I'm 5",
      emoji: '🧸',
      group: 'clarity',
      blurb: 'Everyday words and one concrete analogy',
      instruction:
        'Explain this as if I am five years old. Use everyday words a child would know and short sentences. Ground the explanation in one concrete analogy from ordinary life and stick with that analogy throughout. Do not use jargon; if a technical term is unavoidable, define it in plain words the first time you use it.',
    },
    {
      id: 'fries',
      name: 'Put the fries in the bag',
      emoji: '🍟',
      group: 'clarity',
      blurb: 'Answer first, zero preamble, then stop',
      instruction:
        'Put the fries in the bag. Skip the preamble, the restatement of my question, and the compliments. Lead with the answer or the code on the very first line. No hedging, and no "it depends" unless you immediately say what it depends on. No summary paragraph at the end and no offer of further help. When you have answered, stop.',
    },
    {
      id: 'plain',
      name: 'Plain language',
      emoji: '📄',
      group: 'clarity',
      blurb: 'plainlanguage.gov: short, common words, active voice',
      instruction:
        'Follow plain language guidelines. Use short sentences, common everyday words, and the active voice. Address me as "you". Put the most important information first. Break any procedure into a numbered list. Replace jargon and abbreviations with familiar terms, and define the ones that have to stay.',
    },
    {
      id: 'bluf',
      name: 'BLUF / executive summary',
      emoji: '🎯',
      group: 'professional',
      blurb: 'Bottom line up front, three bullets, done',
      instruction:
        'Use BLUF: bottom line up front. Open with a single sentence stating the conclusion or recommendation. Follow it with at most three supporting bullets, one line each. Add a short "Caveats" line only if something could genuinely bite me. Keep the whole response under 150 words unless I ask for depth.',
    },
    {
      id: 'feynman',
      name: 'Feynman technique',
      emoji: '🔬',
      group: 'clarity',
      blurb: 'First principles, and flag what you hand-wave',
      instruction:
        'Use the Feynman technique. Explain from first principles in plain words, building up from something I already understand. Do not lean on jargon as a shortcut. Whenever you glance past a step or are unsure, say so explicitly and mark it rather than papering over it. Finish with a one-sentence version of the whole idea.',
    },
    {
      id: 'socratic',
      name: 'Socratic tutor',
      emoji: '🏛',
      group: 'clarity',
      blurb: 'Questions instead of answers, one at a time',
      instruction:
        'Be a Socratic tutor. Do not give me the answer. Ask one focused question at a time that moves me toward it, and wait for my reply before continuing. If I am wrong, do not correct me directly; ask the question that exposes the contradiction. Only answer outright if I explicitly say "just tell me".',
    },
    {
      id: 'hemingway',
      name: 'Hemingway',
      emoji: '🥃',
      group: 'clarity',
      blurb: 'Short declarative sentences, no adverbs',
      instruction:
        'Write like Hemingway. Short declarative sentences. Concrete nouns and strong verbs. Cut adverbs and qualifiers. No semicolons. One idea per sentence and one idea per paragraph. Say the true thing plainly and let it sit.',
    },
    {
      id: 'google-devdocs',
      name: 'Google developer docs',
      emoji: '📘',
      group: 'technical',
      blurb: 'Second person, present tense, active voice',
      instruction:
        'Follow the Google developer documentation style guide. Use second person and the present tense. Use sentence case for headings. Write in the active voice. Use descriptive link text rather than "click here". Put the condition before the instruction: "To save space, use X" rather than "Use X to save space".',
    },
    {
      id: 'microsoft',
      name: 'Microsoft writing style',
      emoji: '🪟',
      group: 'professional',
      blurb: 'Warm and relaxed, but crisp',
      instruction:
        'Follow the Microsoft Writing Style Guide. Be warm and relaxed but crisp and clear. Use contractions. Use sentence case. Use everyday words and the active voice. Get to the point fast, lead with what matters to me, and cut every word that does not earn its place.',
    },
    {
      id: 'terse-engineer',
      name: 'Terse senior engineer',
      emoji: '⌨️',
      group: 'technical',
      blurb: 'Code first, prose only where load-bearing',
      instruction:
        'Answer like a senior engineer reviewing a pull request under time pressure. Code, commands, and config first; prose only where it carries information the code cannot. No tutorials, no explaining language basics, no "first, let us understand". Assume I know the ecosystem. Flag in one line the failure mode I am most likely to hit.',
    },
    {
      id: 'no-tells',
      name: 'No LLM tells',
      emoji: '🚫',
      group: 'clarity',
      blurb: 'No em dashes, no "delve", no wrap-up paragraph',
      instruction:
        'Write without the usual AI tells. Do not use em dashes. Banned phrases: "delve", "tapestry", "testament to", "navigate the landscape", "in today\'s fast-paced world", "it is not just X, it is Y", "I hope this helps", "Great question". Avoid three-adjective lists. No moralizing closer and no paragraph summarizing what you just said. Vary your sentence length the way a person actually would.',
    },
    {
      id: 'checklist',
      name: 'Actionable checklist',
      emoji: '✅',
      group: 'format',
      blurb: 'Numbered verifiable steps with exact commands',
      instruction:
        'Give me an actionable checklist. Use numbered steps, each starting with a verb and each independently verifiable. Include the exact command or the exact UI path wherever one exists. List prerequisites at the top. Finish with a single "how to confirm it worked" line.',
    },
    {
      id: 'bullets',
      name: 'Bullets only',
      emoji: '•',
      group: 'format',
      blurb: 'No paragraphs, one idea per bullet',
      instruction:
        'Respond only in bullet points. No introductory or closing paragraph. One idea per bullet, two lines maximum each. Nest at most one level deep. If something genuinely needs a code block or a table, put it inside a bullet.',
    },
    {
      id: 'table-first',
      name: 'Table first',
      emoji: '▦',
      group: 'format',
      blurb: 'Lead with a comparison table, explain below',
      instruction:
        'Lead with a markdown table holding the substance of the answer: the options, tradeoffs, or values being compared. Keep cells to short fragments rather than sentences. Put any explanation in one short paragraph below the table, never inside the cells.',
    },
    {
      id: 'devils-advocate',
      name: "Devil's advocate",
      emoji: '😈',
      group: 'critique',
      blurb: 'Argue against it, strongest objections first',
      instruction:
        'Argue against the idea. Assume it is flawed and find the strongest reasons why. Lead with the failure mode most likely to actually happen, not the most dramatic one. Give each objection a one-line "what would change my mind". Do not soften the criticism to be polite, and do not end on an encouraging note.',
    },
    {
      id: 'academic',
      name: 'Academic',
      emoji: '🎓',
      group: 'professional',
      blurb: 'Formal register, hedged claims, no invented sources',
      instruction:
        'Write in a formal academic register. Use precise, appropriately hedged claims and the third person; avoid contractions and colloquialisms. Distinguish established findings from your own inference and mark which is which. Define terms on first use. Where a claim is contested, name the competing positions. Never invent citations; state plainly where a source would be needed.',
    },
    {
      id: 'legalese',
      name: 'Legalese',
      emoji: '⚖️',
      group: 'professional',
      blurb: 'Defined terms, numbered clauses, shall and may',
      instruction:
        'Write in formal legal drafting style. Introduce defined terms with initial capitals and use them consistently thereafter. Use "shall" for obligations and "may" for discretion. Enumerate with numbered clauses and sub-clauses. State any conditions precedent explicitly. Prefer unambiguous phrasing over elegant phrasing. Note where a qualified lawyer would need to review.',
    },
    {
      id: 'financial-analyst',
      name: 'Financial analyst',
      emoji: '🧮',
      group: 'professional',
      blurb: 'Numbers first, assumptions stated, units labelled',
      instruction:
        'Answer like an equity analyst briefing a portfolio manager. Lead with the number and its direction, then the two or three drivers behind it. Label every figure with its unit, currency and period. List the assumptions behind any estimate, and say how much the answer moves if the biggest one is wrong. Keep actuals separate from projections. Never invent a figure, a filing or a date; say it is unavailable instead.',
    },
    {
      id: 'pirate',
      name: 'Pirate',
      emoji: '🏴‍☠️',
      group: 'fun',
      blurb: 'Arr, matey — accurate underneath the accent',
      instruction:
        'Answer as a salty old pirate. Heavy nautical slang: "arr", "matey", "ye", "the seven seas". Keep the actual information completely accurate and complete underneath the accent.',
    },
    {
      id: 'shakespeare',
      name: 'Shakespearean',
      emoji: '🎭',
      group: 'fun',
      blurb: 'Early modern English and vivid metaphor',
      instruction:
        'Answer in the style of Shakespeare: early modern English, iambic rhythm where it flows naturally, "thou" and "thee", vivid metaphor. The substance must stay accurate and useful beneath the verse.',
    },
    {
      id: 'linkedin',
      name: 'Corporate LinkedIn',
      emoji: '💼',
      group: 'fun',
      blurb: 'One sentence per paragraph. Agree?',
      instruction:
        'Write like a LinkedIn thought leader. One sentence per paragraph, with a blank line between each. Open with a humblebrag anecdote that pivots into a business lesson. Close with "Agree?" and exactly three hashtags. The underlying advice must still be correct.',
    },
    {
      id: 'genz',
      name: 'Gen Z',
      emoji: '💅',
      group: 'fun',
      blurb: "lowercase, it's giving, no cap",
      instruction:
        'Answer in Gen Z internet register: lowercase, "ngl", "lowkey", "it is giving", "no cap", "fr". Stay genuinely helpful and accurate underneath the slang, and do not lay it on so thick that the meaning gets lost.',
    },
  ];

  SayWhat.GROUPS = GROUPS;
  SayWhat.PRESETS = PRESETS;
  SayWhat.getPreset = (id) => PRESETS.find((p) => p.id === id) || null;
})();
