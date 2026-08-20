/*
 * Renders every page at phone and desktop widths and fails loudly on console
 * errors, failed requests, horizontal overflow, or an empty render target.
 *   node tools/dev-server.mjs &   node tools/screenshot.mjs ./shots
 *
 * Note: full-page screenshots of very tall pages can stitch with images blank.
 * That is the capture, not the page — verify with an element screenshot before
 * chasing it.
 */
import { chromium } from 'playwright';
const out = process.argv[2];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
const pages = [
  ['index.html', '/'],
  ['teams.html', '/teams.html'],
  ['duels.html', '/duels.html'],
  ['rap-sheet.html', '/rap-sheet.html'],
  ['scoreboard.html', '/scoreboard.html'],
  ['enter.html', '/enter.html']
];
const errs = [];
for (const [name, path] of pages) {
  for (const [tag, vp] of [['phone', { width: 390, height: 844 }], ['desk', { width: 1280, height: 900 }]]) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 2 });
    const p = await ctx.newPage();
    p.on('console', (m) => { if (m.type() === 'error') errs.push(`${name} [${tag}] console: ${m.text()}`); });
    p.on('pageerror', (e) => errs.push(`${name} [${tag}] pageerror: ${e.message}`));
    p.on('requestfailed', (r) => errs.push(`${name} [${tag}] failed: ${r.url()}`));
    await p.goto('http://localhost:8788' + path, { waitUntil: 'networkidle' });
    await p.waitForTimeout(900);
    // horizontal overflow check — the page body must never scroll sideways
    const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (over > 1) errs.push(`${name} [${tag}] HORIZONTAL OVERFLOW ${over}px`);
    const empty = await p.evaluate(() =>
      [...document.querySelectorAll('[data-teams],[data-sheet],[data-duels],[data-units],[data-winners],[data-drops],[data-facts],[data-carts],[data-tape]')]
        .filter((e) => !e.innerHTML.trim()).map((e) => e.dataset ? Object.keys(e.dataset)[0] : '?'));
    if (empty.length) errs.push(`${name} [${tag}] EMPTY TARGETS: ${empty.join(',')}`);
    await p.screenshot({ path: `${out}/${name.replace('.html','')}-${tag}.png`, fullPage: true });
    await ctx.close();
  }
}
await b.close();
console.log(errs.length ? 'ISSUES:\n' + errs.join('\n') : 'clean: no console errors, no failed requests, no overflow, no empty render targets');
