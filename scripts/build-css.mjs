/* Stylespec — bundle src/content/ui.css into a JavaScript string.
 *
 * The picker cannot fetch its stylesheet at runtime: sites with a strict
 * Content Security Policy (Claude among them) block both the request and any
 * <style> element a content script appends. Shipping the CSS as a string and
 * handing it to a constructed stylesheet sidesteps page CSP entirely, and
 * drops the need for web_accessible_resources.
 *
 * src/content/ui.css stays the source of truth. Run this after editing it;
 * scripts/selftest.mjs fails if the two drift apart.
 *
 * Usage: node scripts/build-css.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const SOURCE = path.join(root, 'src/content/ui.css');
const TARGET = path.join(root, 'src/content/ui.css.js');

export function render(css) {
  const escaped = css.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
  return `/* GENERATED — edit src/content/ui.css, then run: node scripts/build-css.mjs */
(function () {
  const SayWhat = (globalThis.SayWhat = globalThis.SayWhat || {});
  SayWhat.UI_CSS = \`${escaped}\`;
})();
`;
}

export function expected() {
  return render(readFileSync(SOURCE, 'utf8'));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  writeFileSync(TARGET, expected(), 'utf8');
  console.log(`wrote ${path.relative(root, TARGET)}`);
}
