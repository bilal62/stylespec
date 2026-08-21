/* Stylespec — turns a chosen style plus modifiers into the text appended to a prompt. */
(function () {
  const SayWhat = (globalThis.SayWhat = globalThis.SayWhat || {});

  const MODIFIERS = [
    {
      id: 'length',
      label: 'Length',
      options: [
        { id: 'default', label: 'Default', instruction: null },
        {
          id: 'terse',
          label: 'Terse',
          instruction: 'Keep it as short as it can be while still being complete.',
        },
        {
          id: 'medium',
          label: 'Medium',
          instruction: 'Aim for a medium-length answer: complete, but nothing padded.',
        },
        {
          id: 'thorough',
          label: 'Thorough',
          instruction: 'Be thorough. Cover the edge cases and the reasoning behind the answer.',
        },
      ],
    },
    {
      id: 'formality',
      label: 'Formality',
      options: [
        { id: 'default', label: 'Default', instruction: null },
        { id: 'casual', label: 'Casual', instruction: 'Use a casual, conversational tone.' },
        { id: 'neutral', label: 'Neutral', instruction: 'Use a neutral, professional tone.' },
        { id: 'formal', label: 'Formal', instruction: 'Use a formal tone.' },
      ],
    },
    {
      id: 'level',
      label: 'Audience',
      options: [
        { id: 'default', label: 'Default', instruction: null },
        { id: 'child', label: 'Beginner', instruction: 'Target roughly a 10-year-old reading level.' },
        { id: 'general', label: 'General', instruction: 'Assume an interested non-specialist audience.' },
        {
          id: 'expert',
          label: 'Expert',
          instruction: 'Assume domain expertise. Do not explain fundamentals.',
        },
      ],
    },
    {
      id: 'emoji',
      label: 'Emoji',
      options: [
        { id: 'default', label: 'Default', instruction: null },
        { id: 'none', label: 'None', summary: 'no emoji', instruction: 'Do not use emoji.' },
        {
          id: 'some',
          label: 'Sparing',
          summary: 'sparing emoji',
          instruction: 'Use emoji sparingly, only where they add clarity.',
        },
      ],
    },
  ];

  /* Languages with a meaningful T-V or honorific distinction carry explicit
   * register hints, since "formal" alone is ambiguous to translate. */
  const LANGUAGES = [
    { code: 'auto', name: 'Same as my message' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish', informal: 'tú', formal: 'usted' },
    { code: 'fr', name: 'French', informal: 'tu', formal: 'vous' },
    { code: 'de', name: 'German', informal: 'du', formal: 'Sie' },
    { code: 'it', name: 'Italian', informal: 'tu', formal: 'Lei' },
    { code: 'pt', name: 'Portuguese', informal: 'tu', formal: 'o senhor / a senhora' },
    { code: 'nl', name: 'Dutch', informal: 'je', formal: 'u' },
    { code: 'pl', name: 'Polish', informal: 'ty', formal: 'Pan / Pani' },
    { code: 'ru', name: 'Russian', informal: 'ты', formal: 'вы' },
    { code: 'uk', name: 'Ukrainian', informal: 'ти', formal: 'ви' },
    { code: 'cs', name: 'Czech', informal: 'ty', formal: 'vy' },
    { code: 'tr', name: 'Turkish', informal: 'sen', formal: 'siz' },
    { code: 'ja', name: 'Japanese', informal: 'casual / タメ口', formal: 'keigo / 敬語' },
    { code: 'ko', name: 'Korean', informal: '반말', formal: '존댓말' },
    { code: 'zh-Hans', name: 'Chinese (Simplified)' },
    { code: 'zh-Hant', name: 'Chinese (Traditional)' },
    { code: 'ar', name: 'Arabic' },
    { code: 'he', name: 'Hebrew' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ur', name: 'Urdu' },
    { code: 'id', name: 'Indonesian' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'th', name: 'Thai' },
    { code: 'sv', name: 'Swedish' },
    { code: 'no', name: 'Norwegian' },
    { code: 'da', name: 'Danish' },
    { code: 'fi', name: 'Finnish' },
    { code: 'el', name: 'Greek' },
    { code: 'ro', name: 'Romanian' },
    { code: 'hu', name: 'Hungarian' },
  ];

  const DEFAULT_MODIFIERS = {
    length: 'default',
    formality: 'default',
    level: 'default',
    emoji: 'default',
    language: 'auto',
    languageRegister: 'default',
  };

  function getModifier(id) {
    return MODIFIERS.find((m) => m.id === id) || null;
  }

  function getLanguage(code) {
    return LANGUAGES.find((l) => l.code === code) || null;
  }

  function languageInstruction(mods) {
    const lang = getLanguage(mods.language);
    if (!lang || lang.code === 'auto') return null;
    const register = mods.languageRegister;
    if (register && register !== 'default' && lang[register]) {
      return `Reply in ${lang.name}, using the ${register} register (${lang[register]}).`;
    }
    return `Reply in ${lang.name}.`;
  }

  /* Short parenthetical shown in the header line, e.g. "(terse, no emoji)". */
  function modifierSummary(mods) {
    const bits = [];
    for (const mod of MODIFIERS) {
      const chosen = mods[mod.id];
      if (!chosen || chosen === 'default') continue;
      const opt = mod.options.find((o) => o.id === chosen);
      if (!opt) continue;
      bits.push(opt.summary || opt.label.toLowerCase());
    }
    const lang = getLanguage(mods.language);
    if (lang && lang.code !== 'auto') bits.push(`in ${lang.name}`);
    return bits;
  }

  function modifierInstructions(mods) {
    const out = [];
    for (const mod of MODIFIERS) {
      const chosen = mods[mod.id];
      if (!chosen || chosen === 'default') continue;
      const opt = mod.options.find((o) => o.id === chosen);
      if (opt && opt.instruction) out.push(opt.instruction);
    }
    const lang = languageInstruction(mods);
    if (lang) out.push(lang);
    return out;
  }

  /**
   * Build the block appended to (or prepended to) the user's prompt.
   * `style` is a preset or custom style: { name, instruction }.
   */
  function composePostfix(style, modifiers, options) {
    const mods = Object.assign({}, DEFAULT_MODIFIERS, modifiers || {});
    const opts = Object.assign({ divider: true }, options || {});

    const summary = modifierSummary(mods);
    const extras = modifierInstructions(mods);

    const lines = [];
    if (opts.divider) lines.push('---');

    const name = (style && style.name) || 'Custom';
    const suffix = summary.length ? ` (${summary.join(', ')})` : '';
    lines.push(`Response style — ${name}${suffix}:`);

    const instruction = ((style && style.instruction) || '').trim();
    if (instruction) lines.push(instruction);
    if (extras.length) lines.push(extras.join(' '));

    return lines.join('\n');
  }

  /** Join the block onto an existing draft without doubling up whitespace. */
  function applyToDraft(draft, block, mode) {
    const body = (draft || '').replace(/\s+$/, '');
    if (mode === 'prepend') {
      return body ? `${block}\n\n${body}` : block;
    }
    return body ? `${body}\n\n${block}` : block;
  }

  SayWhat.MODIFIERS = MODIFIERS;
  SayWhat.LANGUAGES = LANGUAGES;
  SayWhat.DEFAULT_MODIFIERS = DEFAULT_MODIFIERS;
  SayWhat.getModifier = getModifier;
  SayWhat.getLanguage = getLanguage;
  SayWhat.composePostfix = composePostfix;
  SayWhat.applyToDraft = applyToDraft;
})();
