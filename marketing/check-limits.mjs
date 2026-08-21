/* Verifies the store and landing-page copy against the field limits that
 * actually reject a submission, by reading the fenced blocks out of the
 * markdown rather than keeping a second copy of the text here.
 *
 * Usage: node marketing/check-limits.mjs
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));

/** Nth fenced code block under the heading whose text starts with `heading`. */
function block(markdown, heading, index = 0) {
  const lines = markdown.split('\n');
  const start = lines.findIndex((l) => /^#{2,3} /.test(l) && l.replace(/^#+ /, '').startsWith(heading));
  if (start === -1) throw new Error(`no heading: ${heading}`);
  const end = lines.findIndex((l, i) => i > start && /^#{2,3} /.test(l));
  const section = lines.slice(start, end === -1 ? lines.length : end).join('\n');
  const blocks = [...section.matchAll(/```[a-z]*\n([\s\S]*?)```/g)].map((m) => m[1].trimEnd());
  if (!blocks[index]) throw new Error(`no code block ${index} under: ${heading}`);
  return blocks[index];
}

const store = readFileSync(path.join(here, 'chrome-web-store.md'), 'utf8');
const landing = readFileSync(path.join(here, 'landing-page.md'), 'utf8');

/* The short description is a single line in the store UI; it is wrapped in the
 * markdown source purely for readability, so unwrap before measuring. */
const unwrap = (text) => text.replace(/\s*\n\s*/g, ' ').trim();

const fields = [
  { name: 'extension name', limit: 75, value: block(store, 'Extension name') },
  { name: 'short description', limit: 132, value: unwrap(block(store, 'Short description')) },
  { name: 'detailed description', limit: 16000, value: block(store, 'Detailed description') },
  { name: 'title tag', limit: 60, value: block(landing, 'Meta', 0) },
  { name: 'meta description', limit: 155, value: unwrap(block(landing, 'Meta', 1)) },
];

let failed = false;
for (const field of fields) {
  const used = [...field.value].length;
  const ok = used <= field.limit;
  if (!ok) failed = true;
  const bar = `${used}/${field.limit}`;
  process.stdout.write(`  ${ok ? '✓' : '✗'} ${field.name.padEnd(22)} ${bar.padStart(11)}\n`);
}

/* The summary shown in store search results is the manifest's description
 * field, not anything typed into the dashboard. Easy to write good copy here
 * and ship the old developer-facing string to every search result. */
const manifest = JSON.parse(readFileSync(path.join(here, '..', 'manifest.json'), 'utf8'));
if (manifest.description !== fields[1].value) {
  failed = true;
  process.stdout.write('  ✗ manifest description does not match the short description\n');
  process.stdout.write(`      manifest: ${manifest.description}\n`);
  process.stdout.write(`      listing:  ${fields[1].value}\n`);
} else {
  process.stdout.write('  ✓ manifest description matches the listing\n');
}

/* Store descriptions render as plain text. Markdown in them looks like debris. */
const detailed = fields[2].value;
const stray = ['**', '](', '# ', '- ['].filter((token) => detailed.includes(token));
if (stray.length) {
  failed = true;
  process.stdout.write(`  ✗ detailed description contains markdown: ${stray.join(' ')}\n`);
} else {
  process.stdout.write('  ✓ detailed description is plain text\n');
}

process.stdout.write(failed ? '\n  over limit\n\n' : '\n  all fields fit\n\n');
process.exit(failed ? 1 : 0);
