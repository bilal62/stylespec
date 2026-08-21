/* Stylespec — settings page. */
(function () {
  const SayWhat = globalThis.SayWhat;

  const ICON_STAR =
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4L2.6 9.4l6.5-.9L12 2.6Z"/></svg>';
  const ICON_GRIP =
    '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>';

  const SAMPLE_DRAFT = 'How do I center a div?';

  const dom = {
    styleList: document.getElementById('styleList'),
    pane: document.getElementById('pane'),
    filter: document.getElementById('filter'),
    newStyle: document.getElementById('newStyle'),
    prefsBtn: document.getElementById('prefsBtn'),
    saveState: document.getElementById('saveState'),
  };

  let settings = null;
  let view = { kind: 'style', id: 'ste' };
  let filterText = '';
  let pending = {};
  let saveTimer = null;

  /* ------------------------------------------------------------ helpers -- */

  function h(tag, props, ...kids) {
    const node = document.createElement(tag);
    const p = props || {};
    for (const key of Object.keys(p)) {
      const value = p[key];
      if (value == null || value === false) continue;
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else if (key === 'html') node.innerHTML = value;
      else if (key === 'value' || key === 'checked' || key === 'disabled' || key === 'draggable')
        node[key] = value;
      else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
      else node.setAttribute(key, value === true ? '' : value);
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      node.append(kid);
    }
    return node;
  }

  function setSaveState(text, tone) {
    dom.saveState.textContent = text || '';
    if (tone) dom.saveState.dataset.tone = tone;
    else delete dom.saveState.dataset.tone;
  }

  function queueSave(patch) {
    Object.assign(settings, patch);
    Object.assign(pending, patch);
    setSaveState('Saving…');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(flush, 350);
  }

  async function flush() {
    const patch = pending;
    pending = {};
    if (!Object.keys(patch).length) return;
    try {
      await SayWhat.setSettings(patch);
      setSaveState('Saved');
      setTimeout(() => {
        if (dom.saveState.textContent === 'Saved') setSaveState('');
      }, 1600);
    } catch (err) {
      console.warn('[Stylespec] save failed', err);
      setSaveState('Could not save — sync storage is full', 'error');
    }
  }

  /** Options shows hidden built-ins too, so they can be brought back. */
  function allForOptions() {
    const hidden = new Set(settings.hiddenBuiltins || []);
    const builtins = SayWhat.PRESETS.map((p) =>
      Object.assign({}, p, { builtin: true, hidden: hidden.has(p.id) })
    );
    const custom = (settings.customStyles || []).map((s) =>
      Object.assign({ group: 'custom', emoji: '✨' }, s, { builtin: false, hidden: false })
    );
    const merged = builtins.concat(custom);
    const order = settings.order || [];
    if (!order.length) return merged;
    const rank = new Map(order.map((id, i) => [id, i]));
    return merged.slice().sort((a, b) => {
      const ra = rank.has(a.id) ? rank.get(a.id) : Number.MAX_SAFE_INTEGER;
      const rb = rank.has(b.id) ? rank.get(b.id) : Number.MAX_SAFE_INTEGER;
      return ra - rb;
    });
  }

  function findStyle(id) {
    return allForOptions().find((s) => s.id === id) || null;
  }

  function isFavorite(id) {
    return (settings.favorites || []).includes(id);
  }

  function toggleFavorite(id) {
    const favorites = settings.favorites || [];
    const next = favorites.includes(id)
      ? favorites.filter((f) => f !== id)
      : favorites.concat([id]);
    queueSave({ favorites: next });
    render();
  }

  /* -------------------------------------------------------------- list --- */

  function renderList() {
    dom.styleList.textContent = '';
    const query = filterText.trim().toLowerCase();
    const styles = allForOptions().filter(
      (s) =>
        !query ||
        s.name.toLowerCase().includes(query) ||
        (s.blurb || '').toLowerCase().includes(query) ||
        (s.instruction || '').toLowerCase().includes(query)
    );

    if (!styles.length) {
      dom.styleList.append(h('div', { class: 'empty', text: 'No styles match that filter' }));
      return;
    }

    const draggable = !query;

    for (const style of styles) {
      const star = h('button', {
        class: 'row__star',
        type: 'button',
        html: ICON_STAR,
        title: isFavorite(style.id) ? 'Remove from favorites' : 'Show first in the picker',
        'data-on': isFavorite(style.id) ? 'true' : 'false',
        onclick: (e) => {
          e.stopPropagation();
          toggleFavorite(style.id);
        },
      });

      const row = h(
        'div',
        {
          class: 'row',
          'data-style-id': style.id,
          'data-selected': view.kind === 'style' && view.id === style.id ? 'true' : 'false',
          'data-hidden': style.hidden ? 'true' : 'false',
          draggable,
          onclick: () => {
            view = { kind: 'style', id: style.id };
            render();
          },
        },
        h('span', { class: 'row__grip', html: ICON_GRIP }),
        h('span', { class: 'row__emoji', text: style.emoji || '✨' }),
        h(
          'div',
          { class: 'row__body' },
          h('div', { class: 'row__name', text: style.name }),
          h('div', { class: 'row__blurb', text: style.blurb || '' })
        ),
        star
      );

      if (draggable) attachDragHandlers(row);
      dom.styleList.append(row);
    }
  }

  let dragged = null;

  function attachDragHandlers(row) {
    row.addEventListener('dragstart', (e) => {
      dragged = row;
      row.dataset.dragging = 'true';
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', row.dataset.styleId);
    });
    row.addEventListener('dragend', () => {
      delete row.dataset.dragging;
      dragged = null;
      const order = Array.from(dom.styleList.querySelectorAll('[data-style-id]')).map(
        (n) => n.dataset.styleId
      );
      queueSave({ order });
    });
    row.addEventListener('dragover', (e) => {
      if (!dragged || dragged === row) return;
      e.preventDefault();
      const rect = row.getBoundingClientRect();
      const after = e.clientY > rect.top + rect.height / 2;
      row.parentNode.insertBefore(dragged, after ? row.nextSibling : row);
    });
  }

  /* -------------------------------------------------------------- panes -- */

  function previewCard(style) {
    const block = SayWhat.composePostfix(style, settings.modifiers, {
      divider: settings.showDivider !== false,
    });
    const prepend = settings.insertMode === 'prepend';
    const parts = prepend
      ? [h('span', { text: block + '\n\n' }), h('span', { class: 'preview__draft', text: SAMPLE_DRAFT })]
      : [h('span', { class: 'preview__draft', text: SAMPLE_DRAFT + '\n\n' }), h('span', { text: block })];

    return h(
      'div',
      { class: 'card' },
      h('p', { class: 'card__title', text: 'Preview' }),
      h('p', {
        class: 'card__hint',
        text: 'What lands in the chat box. Your draft is greyed out; the added block is not.',
      }),
      h('div', { class: 'preview' }, parts)
    );
  }

  function renderStylePane(style) {
    dom.pane.textContent = '';

    const actions = [];
    actions.push(
      h('button', {
        class: 'btn',
        type: 'button',
        text: isFavorite(style.id) ? 'Unfavorite' : 'Favorite',
        onclick: () => toggleFavorite(style.id),
      })
    );
    actions.push(
      h('button', {
        class: 'btn',
        type: 'button',
        text: style.builtin ? 'Duplicate & edit' : 'Duplicate',
        onclick: () => duplicateStyle(style),
      })
    );
    if (style.builtin) {
      actions.push(
        h('button', {
          class: 'btn',
          type: 'button',
          text: style.hidden ? 'Show in picker' : 'Hide from picker',
          onclick: () => toggleHidden(style.id),
        })
      );
    } else {
      actions.push(
        h('button', {
          class: 'btn btn--danger',
          type: 'button',
          text: 'Delete',
          onclick: () => deleteStyle(style.id),
        })
      );
    }

    dom.pane.append(
      h(
        'div',
        { class: 'pane__head' },
        h(
          'div',
          null,
          h('h2', { text: `${style.emoji || '✨'}  ${style.name}` }),
          h('p', {
            text: style.builtin
              ? 'Built-in style. Duplicate it to make your own version.'
              : 'Your style. Edits save automatically.',
          })
        ),
        h('div', { class: 'pane__head-actions' }, actions)
      )
    );

    if (style.builtin) {
      dom.pane.append(
        h(
          'div',
          { class: 'card' },
          h('p', { class: 'card__title' }, h('span', { class: 'badge', text: 'Built-in' })),
          h(
            'div',
            { class: 'field' },
            h('label', { text: 'Description' }),
            h('input', { type: 'text', value: style.blurb || '', disabled: true })
          ),
          h(
            'div',
            { class: 'field' },
            h('label', { text: 'Instruction sent to the AI' }),
            h('textarea', { disabled: true, value: style.instruction })
          )
        )
      );
    } else {
      const update = (patch) => {
        const customStyles = (settings.customStyles || []).map((s) =>
          s.id === style.id ? Object.assign({}, s, patch) : s
        );
        queueSave({ customStyles });
        Object.assign(style, patch);
        refreshPreview(style);
        renderList();
      };

      dom.pane.append(
        h(
          'div',
          { class: 'card' },
          h(
            'div',
            { class: 'field-row' },
            h(
              'div',
              { class: 'field field--narrow' },
              h('label', { text: 'Icon' }),
              h('input', {
                type: 'text',
                value: style.emoji || '✨',
                maxlength: '4',
                oninput: (e) => update({ emoji: e.target.value }),
              })
            ),
            h(
              'div',
              { class: 'field' },
              h('label', { text: 'Name' }),
              h('input', {
                type: 'text',
                value: style.name,
                oninput: (e) => update({ name: e.target.value }),
              })
            )
          ),
          h(
            'div',
            { class: 'field' },
            h('label', { text: 'Description' }),
            h('input', {
              type: 'text',
              value: style.blurb || '',
              placeholder: 'One line shown under the name in the picker',
              oninput: (e) => update({ blurb: e.target.value }),
            })
          ),
          h(
            'div',
            { class: 'field' },
            h('label', { text: 'Instruction sent to the AI' }),
            h('textarea', {
              value: style.instruction || '',
              placeholder: 'Write in short declarative sentences. Do not use jargon...',
              oninput: (e) => update({ instruction: e.target.value }),
            }),
            h('div', {
              class: 'field__hint',
              text: 'Write it as a direct instruction. This text is appended to your prompt verbatim.',
            })
          )
        )
      );
    }

    dom.pane.append(previewCard(style));
  }

  function refreshPreview(style) {
    const old = dom.pane.querySelector('.preview');
    if (!old) return;
    const fresh = previewCard(style).querySelector('.preview');
    old.replaceWith(fresh);
  }

  /* --------------------------------------------------------------- prefs -- */

  function toggle(label, description, checked, onChange) {
    return h(
      'label',
      { class: 'toggle' },
      h('input', { type: 'checkbox', checked, onchange: (e) => onChange(e.target.checked) }),
      h(
        'span',
        { class: 'toggle__text' },
        h('strong', { text: label }),
        h('span', { text: description })
      )
    );
  }

  function chipGroup(options, selected, onPick) {
    return h(
      'div',
      { class: 'chips' },
      options.map((opt) =>
        h('button', {
          class: 'chip',
          type: 'button',
          text: opt.label,
          'data-selected': selected === opt.id ? 'true' : 'false',
          onclick: () => onPick(opt.id),
        })
      )
    );
  }

  function siteSection(title, hint, key, placeholder) {
    const list = h(
      'div',
      { class: 'sitelist' },
      (settings[key] || []).map((site) =>
        h(
          'span',
          { class: 'sitetag' },
          h('span', { text: site }),
          h('button', {
            type: 'button',
            text: '×',
            title: `Remove ${site}`,
            onclick: () => {
              queueSave({ [key]: (settings[key] || []).filter((s) => s !== site) });
              renderPrefsPane();
            },
          })
        )
      )
    );

    const input = h('input', { type: 'text', placeholder });
    const add = () => {
      const host = SayWhat.normalizeHost(input.value.trim());
      if (!host) return;
      if ((settings[key] || []).includes(host)) {
        input.value = '';
        return;
      }
      queueSave({ [key]: (settings[key] || []).concat([host]) });
      renderPrefsPane();
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') add();
    });

    return h(
      'div',
      { class: 'card' },
      h('p', { class: 'card__title', text: title }),
      h('p', { class: 'card__hint', text: hint }),
      list,
      h(
        'div',
        { class: 'inline-form' },
        input,
        h('button', { class: 'btn', type: 'button', text: 'Add', onclick: add })
      )
    );
  }

  function providerSection() {
    const custom = settings.customProviders || [];

    const list = h(
      'div',
      { class: 'sitelist' },
      SayWhat.allProviders(settings).map((provider) => {
        const tag = h('span', { class: 'sitetag' }, h('span', { text: provider.name }));
        if (!provider.builtin) {
          tag.append(
            h('button', {
              type: 'button',
              text: '×',
              title: `Remove ${provider.name}`,
              onclick: () => {
                queueSave({ customProviders: custom.filter((p) => p.id !== provider.id) });
                renderPrefsPane();
              },
            })
          );
        }
        return tag;
      })
    );

    const error = h('p', { class: 'card__hint' });
    const name = h('input', { type: 'text', placeholder: 'Name' });
    const url = h('input', { type: 'text', placeholder: 'https://example.com/?q={prompt}' });

    const add = () => {
      const providerName = name.value.trim();
      const providerUrl = url.value.trim();
      if (!providerName || !providerUrl) {
        error.textContent = 'Both a name and an address are needed.';
        return;
      }
      if (!SayWhat.providerHost({ url: providerUrl })) {
        error.textContent = `"${providerUrl}" is not an address Stylespec can open.`;
        return;
      }
      queueSave({
        customProviders: custom.concat([
          { id: SayWhat.newProviderId(), name: providerName, url: providerUrl },
        ]),
      });
      renderPrefsPane();
    };

    for (const input of [name, url]) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') add();
      });
    }

    return h(
      'div',
      { class: 'card' },
      h('p', { class: 'card__title', text: 'Multiplexer providers' }),
      h('p', {
        class: 'card__hint',
        text:
          'Assistants you can send the same prompt to from the picker. Include {prompt} in the address if the site accepts a prompt in its URL, which is the more reliable route. Without it, Stylespec opens the site and types the prompt into the composer, which needs that site turned on first.',
      }),
      list,
      h('div', { class: 'inline-form' }, name, url, h('button', { class: 'btn', type: 'button', text: 'Add', onclick: add })),
      error
    );
  }

  function renderPrefsPane() {
    dom.pane.textContent = '';
    const mods = settings.modifiers || {};

    dom.pane.append(
      h(
        'div',
        { class: 'pane__head' },
        h(
          'div',
          null,
          h('h2', { text: 'Preferences' }),
          h('p', { text: 'How Stylespec behaves and what it adds to your prompts.' })
        )
      )
    );

    dom.pane.append(
      h(
        'div',
        { class: 'card' },
        h('p', { class: 'card__title', text: 'Behavior' }),
        h('p', { class: 'card__hint', text: 'Applies everywhere unless a site is turned off below.' }),
        toggle('Enabled', 'Turn Stylespec off everywhere without uninstalling it.', settings.enabled !== false, (v) =>
          queueSave({ enabled: v })
        ),
        toggle(
          'Show the pill when I start typing',
          'Off means the picker only opens from the toolbar or the keyboard shortcut.',
          settings.pillEnabled !== false,
          (v) => queueSave({ pillEnabled: v })
        ),
        toggle(
          'Separate with a divider line',
          'Adds --- above the style block so it reads as instructions, not part of your question.',
          settings.showDivider !== false,
          (v) => {
            queueSave({ showDivider: v });
            renderPrefsPane();
          }
        ),
        toggle(
          'Remember fine-tuning',
          'Keeps your length, tone and language choices between chats.',
          settings.rememberModifiers !== false,
          (v) => queueSave({ rememberModifiers: v })
        )
      )
    );

    dom.pane.append(
      h(
        'div',
        { class: 'card' },
        h('p', { class: 'card__title', text: 'Appearance' }),
        h('p', {
          class: 'card__hint',
          text: 'Applies to the picker, this page and the toolbar popup. Pick Light if your system is dark but the AI sites you use are not.',
        }),
        chipGroup(
          [
            { id: 'auto', label: 'Match system' },
            { id: 'light', label: 'Light' },
            { id: 'dark', label: 'Dark' },
          ],
          settings.theme || 'auto',
          (id) => {
            queueSave({ theme: id });
            SayWhat.applyTheme(id);
            renderPrefsPane();
          }
        )
      )
    );

    dom.pane.append(
      h(
        'div',
        { class: 'card' },
        h('p', { class: 'card__title', text: 'Where the instruction goes' }),
        h('p', {
          class: 'card__hint',
          text: 'Most models weigh the end of the prompt heavily, so appending is usually best.',
        }),
        chipGroup(
          [
            { id: 'append', label: 'After my prompt' },
            { id: 'prepend', label: 'Before my prompt' },
          ],
          settings.insertMode || 'append',
          (id) => {
            queueSave({ insertMode: id });
            renderPrefsPane();
          }
        )
      )
    );

    const modCard = h(
      'div',
      { class: 'card' },
      h('p', { class: 'card__title', text: 'Default fine-tuning' }),
      h('p', {
        class: 'card__hint',
        text: 'Stacked on top of whichever style you pick. Change these per chat from the picker too.',
      })
    );

    for (const mod of SayWhat.MODIFIERS) {
      modCard.append(
        h(
          'div',
          { class: 'field' },
          h('label', { text: mod.label }),
          chipGroup(mod.options, mods[mod.id] || 'default', (id) => {
            queueSave({ modifiers: Object.assign({}, mods, { [mod.id]: id }) });
            renderPrefsPane();
          })
        )
      );
    }

    const langSelect = h(
      'select',
      {
        onchange: (e) => {
          queueSave({
            modifiers: Object.assign({}, mods, {
              language: e.target.value,
              languageRegister: 'default',
            }),
          });
          renderPrefsPane();
        },
      },
      SayWhat.LANGUAGES.map((lang) =>
        h('option', { value: lang.code, text: lang.name, selected: mods.language === lang.code })
      )
    );

    const langField = h('div', { class: 'field' }, h('label', { text: 'Language' }), langSelect);

    const activeLang = SayWhat.getLanguage(mods.language);
    if (activeLang && (activeLang.informal || activeLang.formal)) {
      langField.append(
        h(
          'select',
          {
            style: 'margin-top:8px',
            onchange: (e) => {
              queueSave({
                modifiers: Object.assign({}, mods, { languageRegister: e.target.value }),
              });
              renderPrefsPane();
            },
          },
          [
            { id: 'default', label: 'Any register' },
            { id: 'informal', label: `Informal (${activeLang.informal})` },
            { id: 'formal', label: `Formal (${activeLang.formal})` },
          ].map((opt) =>
            h('option', {
              value: opt.id,
              text: opt.label,
              selected: (mods.languageRegister || 'default') === opt.id,
            })
          )
        )
      );
    }

    modCard.append(langField);
    dom.pane.append(modCard);

    dom.pane.append(providerSection());

    dom.pane.append(
      siteSection(
        'Turned off on these sites',
        'Stylespec stays quiet here. You can also toggle the current site from the toolbar popup.',
        'disabledSites',
        'example.com'
      )
    );

    dom.pane.append(
      siteSection(
        'Forced on for these sites',
        'Stylespec skips chat apps that are not AI, like Slack and Discord. Add a host here to override that.',
        'forceSites',
        'discord.com'
      )
    );

    const shortcutHint = h('p', { class: 'card__hint', text: 'Checking…' });
    dom.pane.append(
      h(
        'div',
        { class: 'card' },
        h('p', { class: 'card__title', text: 'Keyboard shortcut' }),
        shortcutHint
      )
    );

    /* Read the live binding rather than printing the manifest default, so this
     * stays right on every platform and after a rebind. */
    SayWhat.getCommandShortcut('open-picker').then((shortcut) => {
      shortcutHint.textContent = '';
      if (!shortcut) {
        shortcutHint.append(
          'No shortcut is bound right now. Set one at brave://extensions/shortcuts (paste that into the address bar).'
        );
        return;
      }
      shortcutHint.append('Press ');
      for (const key of SayWhat.shortcutKeys(shortcut)) {
        shortcutHint.append(h('kbd', { text: key }));
      }
      shortcutHint.append(
        ' to open the picker on the focused chat box. Change it at brave://extensions/shortcuts (paste that into the address bar).'
      );
    });

    dom.pane.append(
      h(
        'div',
        { class: 'card' },
        h('p', { class: 'card__title', text: 'Reset' }),
        h('p', {
          class: 'card__hint',
          text: 'Restores every preference and deletes your custom styles. This cannot be undone.',
        }),
        h('button', {
          class: 'btn btn--danger',
          type: 'button',
          text: 'Reset everything',
          onclick: async () => {
            if (!confirm('Reset all Stylespec settings and delete your custom styles?')) return;
            await chrome.storage.sync.clear();
            settings = await SayWhat.getSettings();
            SayWhat.applyTheme(settings.theme);
            view = { kind: 'style', id: 'ste' };
            setSaveState('Reset');
            render();
          },
        })
      )
    );
  }

  /* ------------------------------------------------------------ mutation -- */

  function duplicateStyle(style) {
    const id = SayWhat.newStyleId();
    const copy = {
      id,
      name: `${style.name} (copy)`,
      emoji: style.emoji || '✨',
      blurb: style.blurb || '',
      instruction: style.instruction || '',
    };
    queueSave({ customStyles: (settings.customStyles || []).concat([copy]) });
    view = { kind: 'style', id };
    render();
  }

  function deleteStyle(id) {
    const style = findStyle(id);
    if (!style) return;
    if (!confirm(`Delete "${style.name}"?`)) return;
    queueSave({
      customStyles: (settings.customStyles || []).filter((s) => s.id !== id),
      favorites: (settings.favorites || []).filter((f) => f !== id),
      order: (settings.order || []).filter((o) => o !== id),
    });
    view = { kind: 'prefs' };
    render();
  }

  function toggleHidden(id) {
    const hidden = settings.hiddenBuiltins || [];
    queueSave({
      hiddenBuiltins: hidden.includes(id) ? hidden.filter((x) => x !== id) : hidden.concat([id]),
    });
    render();
  }

  function createStyle() {
    const id = SayWhat.newStyleId();
    const style = {
      id,
      name: 'New style',
      emoji: '✨',
      blurb: '',
      instruction: '',
    };
    queueSave({ customStyles: (settings.customStyles || []).concat([style]) });
    view = { kind: 'style', id };
    render();
    const nameInput = dom.pane.querySelector('input[type="text"]:not([maxlength])');
    if (nameInput) nameInput.select();
  }

  /* --------------------------------------------------------------- boot --- */

  function render() {
    renderList();
    dom.prefsBtn.dataset.selected = view.kind === 'prefs' ? 'true' : 'false';

    if (view.kind === 'prefs') {
      renderPrefsPane();
      return;
    }
    const style = findStyle(view.id) || allForOptions()[0];
    if (!style) {
      dom.pane.textContent = '';
      dom.pane.append(h('div', { class: 'empty', text: 'No styles yet. Create one to get started.' }));
      return;
    }
    view.id = style.id;
    renderStylePane(style);
  }

  dom.filter.addEventListener('input', (e) => {
    filterText = e.target.value;
    renderList();
  });

  dom.newStyle.addEventListener('click', createStyle);

  dom.prefsBtn.addEventListener('click', () => {
    view = { kind: 'prefs' };
    render();
  });

  SayWhat.onChanged(() => {
    /* Skip while the user is mid-edit so a sync echo cannot clobber typing. */
    if (Object.keys(pending).length) return;
    const active = document.activeElement;
    if (active && /INPUT|TEXTAREA|SELECT/.test(active.tagName)) return;
    SayWhat.getSettings().then((fresh) => {
      settings = fresh;
      SayWhat.applyTheme(settings.theme);
      render();
    });
  });

  SayWhat.getSettings().then((loaded) => {
    settings = loaded;
    SayWhat.applyTheme(settings.theme);
    render();
  });
})();
