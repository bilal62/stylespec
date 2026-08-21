/* Stylespec — write text into a chat composer so the host app actually sees it.
 *
 * Plain fields need the native value setter (React installs its own property
 * descriptor and ignores direct assignment). Rich editors (ProseMirror on
 * ChatGPT and Claude, Quill on Gemini, Lexical on Meta AI) ignore both, and
 * only respond to input they believe came from the user.
 */
(function () {
  const SayWhat = (globalThis.SayWhat = globalThis.SayWhat || {});

  function getDraft(el) {
    if (!el) return '';
    if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') return el.value || '';
    return el.innerText || '';
  }

  function isEmptyDraft(el) {
    return getDraft(el).trim().length === 0;
  }

  function nativeSetValue(el, value) {
    const proto =
      el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
    if (descriptor && descriptor.set) descriptor.set.call(el, value);
    else el.value = value;
  }

  function insertIntoField(el, block, mode) {
    const next = SayWhat.applyToDraft(el.value || '', block, mode);
    nativeSetValue(el, next);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    try {
      const caret = mode === 'prepend' ? block.length : next.length;
      el.setSelectionRange(caret, caret);
    } catch {
      /* input types without a text selection API */
    }
    return el.value === next;
  }

  function moveCaret(el, toStart) {
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(!!toStart);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  /* Rich editors all implement paste handling properly, including multi-line
   * text, which insertText does not reliably preserve in ProseMirror.
   *
   * An editor that handles a paste calls preventDefault, so a cancelled event
   * means it took ownership. Trusting that rather than diffing the content
   * afterwards matters: an editor that applies the change asynchronously would
   * otherwise look like a failure and get the text inserted a second time. */
  function tryPaste(el, text) {
    try {
      const data = new DataTransfer();
      data.setData('text/plain', text);
      const event = new ClipboardEvent('paste', {
        clipboardData: data,
        bubbles: true,
        cancelable: true,
      });
      return !el.dispatchEvent(event);
    } catch {
      return false;
    }
  }

  function tryExecCommand(text) {
    try {
      return document.execCommand('insertText', false, text);
    } catch {
      return false;
    }
  }

  function tryManualNodes(el, text, toStart) {
    try {
      const fragment = document.createDocumentFragment();
      const lines = text.split('\n');
      lines.forEach((line, index) => {
        if (index > 0) fragment.appendChild(document.createElement('br'));
        fragment.appendChild(document.createTextNode(line));
      });
      if (toStart) el.insertBefore(fragment, el.firstChild);
      else el.appendChild(fragment);
      el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text }));
      return true;
    } catch {
      return false;
    }
  }

  function insertIntoRichEditor(el, block, mode) {
    const prepend = mode === 'prepend';
    const empty = isEmptyDraft(el);
    const text = empty ? block : prepend ? `${block}\n\n` : `\n\n${block}`;

    el.focus();
    moveCaret(el, prepend);

    const before = getDraft(el);
    const changed = () => getDraft(el) !== before;

    if (tryPaste(el, text) || changed()) return true;
    if (tryExecCommand(text) && changed()) return true;
    if (tryManualNodes(el, text, prepend) && changed()) return true;
    return false;
  }

  /** Insert `block` into `el`. Returns true if the composer content changed. */
  function insert(el, block, mode) {
    if (!el || !block) return false;
    const kind = SayWhat.detect.editorKind(el);
    el.focus();
    if (kind === 'textarea' || kind === 'input') return insertIntoField(el, block, mode);
    if (kind === 'contenteditable') return insertIntoRichEditor(el, block, mode);
    return false;
  }

  SayWhat.insertText = { insert, getDraft, isEmptyDraft };
})();
