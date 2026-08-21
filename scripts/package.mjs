/* Stylespec — build a submittable Chrome Web Store zip.
 *
 * Ships only what the extension needs at runtime. Test harnesses, marketing
 * copy and build scripts are excluded deliberately: Google states that the
 * amount of code in a submission affects how long review takes, and none of it
 * would ever execute in a user's browser.
 *
 * Usage: node scripts/package.mjs
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist = path.join(root, 'dist');

/* manifest.json must sit at the root of the zip, not inside a folder. */
const SHIP = ['manifest.json', 'icons', 'src', 'LICENSE'];

const problems = [];
function require_(label, condition, detail) {
  if (!condition) problems.push(detail ? `${label} — ${detail}` : label);
}

/* ------------------------------------------------------------- preflight -- */

process.stdout.write('\npreflight\n');

try {
  execFileSync(process.execPath, [path.join(root, 'scripts/selftest.mjs')], { stdio: 'pipe' });
  process.stdout.write('  ✓ self-test passes\n');
} catch {
  problems.push('self-test fails — run `node scripts/selftest.mjs` and fix it first');
}

const manifest = JSON.parse(readFileSync(path.join(root, 'manifest.json'), 'utf8'));

/* Both are hard store limits, and the dashboard rejects rather than truncates. */
require_(
  'name is within 75 characters',
  [...manifest.name].length <= 75,
  `${[...manifest.name].length} characters`
);
require_(
  'description is within 132 characters',
  [...manifest.description].length <= 132,
  `${[...manifest.description].length} characters`
);
require_('version is a dotted number', /^\d+(\.\d+){0,3}$/.test(manifest.version), manifest.version);
require_('has a 128px icon', !!(manifest.icons && manifest.icons['128']));

for (const entry of SHIP) {
  require_(`${entry} exists`, existsSync(path.join(root, entry)));
}

/* Anything the store would reject on sight. */
/* --others --exclude-standard so this works before the first commit too. */
const staged = execFileSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard', '--', ...SHIP],
  { cwd: root, encoding: 'utf8' }
)
  .split('\n')
  .filter(Boolean);
require_('tracked files found to ship', staged.length > 0);
require_(
  'no .DS_Store in the package',
  !staged.some((f) => f.endsWith('.DS_Store')),
  staged.filter((f) => f.endsWith('.DS_Store')).join(' ')
);

if (problems.length) {
  process.stdout.write('\nblocked\n');
  for (const problem of problems) process.stdout.write(`  ✗ ${problem}\n`);
  process.stdout.write('\n');
  process.exit(1);
}

process.stdout.write(`  ✓ ${manifest.name}\n`);
process.stdout.write(`  ✓ version ${manifest.version}, ${staged.length} files\n`);

/* ----------------------------------------------------------------- build -- */

const zipName = `stylespec-${manifest.version}.zip`;
const zipPath = path.join(dist, zipName);

mkdirSync(dist, { recursive: true });
rmSync(zipPath, { force: true });

/* -X drops the macOS resource forks that otherwise arrive as __MACOSX noise. */
execFileSync('zip', ['-q', '-r', '-X', zipPath, ...SHIP, '-x', '*.DS_Store'], { cwd: root });

const size = statSync(zipPath).size;
process.stdout.write('\npackaged\n');
process.stdout.write(`  ${path.relative(root, zipPath)}  (${(size / 1024).toFixed(0)} KB)\n\n`);
process.stdout.write('  Upload at https://chrome.google.com/webstore/devconsole\n');
process.stdout.write('  Listing copy: marketing/chrome-web-store.md\n\n');
