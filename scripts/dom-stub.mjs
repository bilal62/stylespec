/* A hand-rolled sliver of the DOM, just wide enough to run detect.js.
 *
 * The detection heuristics are the part of Stylespec most likely to drift, and
 * scripts/detect-fixtures.html can only be run by hand in a browser. This lets
 * the same scenarios run in `node scripts/selftest.mjs`. It supports exactly
 * the selector grammar detect.js uses and nothing more — anything fancier
 * should go in the browser fixtures instead of growing this file.
 */

const VIEWPORT = { width: 1200, height: 800 };

/* Handles `tag`, `.class`, `[attr]`, `[attr="v"]`, `[attr*="v" i]` and any
 * concatenation of those, plus comma-separated alternatives. */
function matchesOne(node, selector) {
  const parts = selector.trim().match(/^[a-z]+|\.[\w-]+|\[[^\]]+\]/gi) || [];
  if (!parts.length) return false;
  return parts.every((part) => {
    if (part.startsWith('.')) {
      const classes = (node.attrs.class || '').split(/\s+/);
      return classes.includes(part.slice(1));
    }
    if (part.startsWith('[')) {
      const m = part.slice(1, -1).match(/^([\w-]+)(?:([*^$]?=)"([^"]*)"(\s+i)?)?$/);
      if (!m) return false;
      const [, name, op, want, insensitive] = m;
      const value = node.attrs[name];
      if (value == null) return false;
      if (!op) return true;
      const haystack = insensitive ? value.toLowerCase() : value;
      const needle = insensitive ? want.toLowerCase() : want;
      if (op === '*=') return haystack.includes(needle);
      if (op === '^=') return haystack.startsWith(needle);
      if (op === '$=') return haystack.endsWith(needle);
      return haystack === needle;
    }
    return node.tag.toLowerCase() === part.toLowerCase();
  });
}

function matches(node, selector) {
  return selector.split(',').some((one) => matchesOne(node, one));
}

function descendants(node, out = []) {
  for (const kid of node.kids) {
    out.push(kid);
    descendants(kid, out);
  }
  return out;
}

/**
 * @param {object} spec `{ tag, attrs, rect, text, contentEditable, kids }`
 *   where `rect` is `{ top, left, width, height }` in viewport coordinates.
 */
export function node(spec) {
  const self = {
    nodeType: 1,
    tag: (spec.tag || 'div').toUpperCase(),
    attrs: spec.attrs || {},
    text: spec.text || '',
    kids: [],
    parentElement: null,
  };

  const rect = spec.rect || { top: 0, left: 0, width: 0, height: 0 };
  self.tagName = self.tag;
  self.id = self.attrs.id || '';
  self.disabled = !!spec.disabled;
  self.readOnly = !!spec.readOnly;
  self.isContentEditable = !!spec.contentEditable;
  self.getAttribute = (name) => (name in self.attrs ? self.attrs[name] : null);
  self.getBoundingClientRect = () => ({
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
    bottom: rect.top + rect.height,
    right: rect.left + rect.width,
  });
  self.matches = (selector) => matches(self, selector);
  self.querySelectorAll = (selector) => descendants(self).filter((n) => matches(n, selector));
  self.querySelector = (selector) => self.querySelectorAll(selector)[0] || null;
  self.closest = (selector) => {
    let cur = self;
    while (cur) {
      if (matches(cur, selector)) return cur;
      cur = cur.parentElement;
    }
    return null;
  };

  Object.defineProperty(self, 'textContent', {
    get: () => self.text + descendants(self).map((n) => n.text).join(''),
  });

  for (const kid of spec.kids || []) {
    kid.parentElement = self;
    self.kids.push(kid);
  }

  return self;
}

/** Installs `document`, `window`, `location` and friends onto a vm sandbox. */
export function installDom(sandbox, { title = '', host = 'example.test', path = '/' } = {}) {
  let root = node({ tag: 'body' });

  const doc = {
    title,
    get body() {
      return root;
    },
    querySelector: (selector) => root.querySelector(selector),
    querySelectorAll: (selector) => root.querySelectorAll(selector),
    getElementById: (id) => root.querySelectorAll(`[id="${id}"]`)[0] || null,
  };

  sandbox.document = doc;
  sandbox.location = { hostname: host, pathname: path };
  sandbox.window = { innerWidth: VIEWPORT.width, innerHeight: VIEWPORT.height };
  sandbox.innerWidth = VIEWPORT.width;
  sandbox.innerHeight = VIEWPORT.height;
  sandbox.getComputedStyle = () => ({ display: 'block', visibility: 'visible', opacity: '1' });

  return {
    viewport: VIEWPORT,
    setTitle(next) {
      doc.title = next;
    },
    setLocation(nextHost, nextPath = '/') {
      sandbox.location.hostname = nextHost;
      sandbox.location.pathname = nextPath;
    },
    mount(tree) {
      root = node({ tag: 'body', kids: [tree] });
    },
  };
}
