/* Stylespec — capture Chrome Web Store screenshots from the UI harness.
 *
 * Drives headless Chrome over the DevTools Protocol with no dependencies, so
 * store assets can be regenerated after a UI change instead of being re-shot
 * by hand. The store wants exactly 1280x800, which is what the viewport is
 * pinned to; anything cropped afterwards has to be re-cropped to that size.
 *
 * Shots that need a real assistant (a genuine answer, the multiplexer's tab
 * strip, the install prompt) cannot come from here — the harness has no tabs
 * and no network. Those stay manual. See marketing/chrome-web-store.md.
 *
 * Usage:
 *   python3 -m http.server 8731    # from the repo root, in another shell
 *   node scripts/capture-screenshots.mjs
 */

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, 'marketing/screenshots');
const ORIGIN = process.env.ORIGIN || 'http://localhost:8731';
const PORT = 9222;
const WIDTH = 1280;
const HEIGHT = 800;

const CHROME = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((p) => existsSync(p));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function reachable(url, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {
      /* not up yet */
    }
    await sleep(250);
  }
  throw new Error(`not reachable: ${url}`);
}

/* --------------------------------------------------------------- CDP glue -- */

class Session {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener('message', (event) => {
      const msg = JSON.parse(event.data);
      const entry = this.pending.get(msg.id);
      if (!entry) return;
      this.pending.delete(msg.id);
      if (msg.error) entry.reject(new Error(`${entry.method}: ${msg.error.message}`));
      else entry.resolve(msg.result);
    });
  }

  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, method });
      setTimeout(() => {
        if (this.pending.delete(id)) reject(new Error(`${method} timed out`));
      }, 20000);
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.exception?.description || 'evaluate threw');
    }
    return res.result?.value;
  }

  /** Poll an expression until it reports true, so nothing depends on a fixed wait. */
  async until(expression, label, tries = 60) {
    for (let i = 0; i < tries; i++) {
      if (await this.eval(expression)) return;
      await sleep(100);
    }
    throw new Error(`timed out waiting for ${label}`);
  }

  async goto(url) {
    await this.send('Page.navigate', { url });
    await this.until("document.readyState === 'complete'", `${url} to load`);
  }

  /** `clip` captures an exact region regardless of scroll, which is the only
   *  way to hit 1280x800 on a long page without cropping afterwards. */
  async shot(name, clip) {
    const { data } = await this.send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: !!clip,
      ...(clip ? { clip: { ...clip, scale: 1 } } : {}),
    });
    const file = path.join(outDir, name);
    writeFileSync(file, Buffer.from(data, 'base64'));
    process.stdout.write(`  ✓ ${name}\n`);
  }
}

/* ------------------------------------------------------------------ shots -- */

async function run(session) {
  await session.send('Page.enable');
  await session.send('Runtime.enable');
  await session.send('Emulation.setDeviceMetricsOverride', {
    width: WIDTH,
    height: HEIGHT,
    deviceScaleFactor: 1,
    mobile: false,
  });
  /* The extension's theme defaults to following the system, and a dark pill
     floating over a light assistant is exactly the mismatch the settings page
     exists to fix. Pin light so the asset is internally consistent. */
  await session.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-color-scheme', value: 'light' }],
  });

  /* ---- 1 and 2: the extension's own UI, from the harness ---- */

  await session.goto(`${ORIGIN}/scripts/ui-harness.html`);
  await session.until('!!window.harness', 'the harness driver');
  /* The content scripts boot asynchronously off storage. */
  await session.until('!!(window.SayWhat && window.SayWhat.PRESETS)', 'the content scripts');

  /* The harness's debug button and its "fake transcript" label would both end
     up in a store asset, so the page is reduced to what a new conversation
     actually looks like: an empty thread above a composer. */
  await session.eval(
    "document.querySelector('.layout').style.display = 'none';" +
      "document.querySelector('.transcript').textContent = '';" +
      ' true'
  );

  await session.eval("window.harness.type('How do I center a div in CSS?'); true");
  /* The pill fades in over 140ms. Waiting on the attribute alone catches it
     half-transparent, so wait on the computed opacity the same way the panel
     does below. */
  await session.until(
    "(() => { const s = window.harness.shadow(); if (!s) return false;" +
      " const pill = s.querySelector('.sw-pill');" +
      ' return pill && getComputedStyle(pill).opacity === "1"; })()',
    'the pill to finish fading in'
  );
  await session.shot('01-pill.png');

  await session.eval("window.harness.click('.sw-pill'); true");
  /* The panel fades in over 120ms; wait for the transition to finish rather
     than racing it, which is what produced a blank first attempt. */
  await session.until(
    "(() => { const p = window.harness.shadow().querySelector('.sw-panel');" +
      ' return p && getComputedStyle(p).opacity === "1"; })()',
    'the picker to finish fading in'
  );
  await session.shot('02-picker.png');

  /* The panel opens on Favourites, which is five rows and undersells a library
     of 23. Scroll past them so the group headings and the named standards are
     what the caption is actually describing. */
  await session.eval(
    "(() => { const list = window.harness.shadow().querySelector('.sw-list');" +
      " const ste = [...list.querySelectorAll('.sw-item')]" +
      "   .find((n) => n.textContent.includes('Simplified Technical English'));" +
      " if (ste) ste.scrollIntoView({ block: 'center' });" +
      ' return true; })()'
  );
  await sleep(300);
  await session.shot('02b-picker-standards.png');

  /* ---- 3: the before/after comparison, from the landing page ---- */

  await session.goto(`${ORIGIN}/docs/index.html`);
  /* The sticky header would sit across the heading and the following section
     would show through underneath, so both are removed and the region is
     clipped to the block itself. */
  const top = await session.eval(
    "(() => { document.querySelector('header.nav').style.display = 'none';" +
      " const section = document.querySelector('.compare').closest('section');" +
      ' let next = section.nextElementSibling;' +
      " while (next) { next.style.display = 'none'; next = next.nextElementSibling; }" +
      " document.querySelector('footer').style.display = 'none';" +
      ' return section.offsetTop + 78; })()'
  );
  await sleep(300);
  await session.shot('03-before-after.png', { x: 0, y: top, width: WIDTH, height: HEIGHT });
}

/* ------------------------------------------------------------------- main -- */

if (!CHROME) {
  process.stdout.write('\n  ✗ no Chrome or Chromium found\n\n');
  process.exit(1);
}

/* Without this the harness would still "load" — as Chrome's error page, whose
   readyState is also complete — and the run would produce four blank assets. */
try {
  const res = await fetch(`${ORIGIN}/scripts/ui-harness.html`);
  if (!res.ok) throw new Error(String(res.status));
} catch {
  process.stdout.write(
    `\n  ✗ nothing serving at ${ORIGIN}\n` +
      '    run `python3 -m http.server 8731` from the repo root first\n\n'
  );
  process.exit(1);
}

process.stdout.write('\ncapturing\n');

const profile = path.join(os.tmpdir(), `stylespec-shots-${process.pid}`);
mkdirSync(outDir, { recursive: true });

const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    `--window-size=${WIDTH},${HEIGHT}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    'about:blank',
  ],
  { stdio: 'ignore' }
);

let code = 0;
try {
  await reachable(`http://127.0.0.1:${PORT}/json/version`);
  const targets = await reachable(`http://127.0.0.1:${PORT}/json/list`);
  const page = targets.find((t) => t.type === 'page');
  if (!page) throw new Error('no page target');

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', () => reject(new Error('devtools socket failed')), {
      once: true,
    });
  });

  await run(new Session(ws));
  ws.close();
  process.stdout.write(`\n  ${path.relative(root, outDir)}/ — ${WIDTH}x${HEIGHT}\n\n`);
} catch (err) {
  process.stdout.write(`\n  ✗ ${err.message}\n\n`);
  code = 1;
} finally {
  chrome.kill();
  rmSync(profile, { recursive: true, force: true });
}

process.exit(code);
