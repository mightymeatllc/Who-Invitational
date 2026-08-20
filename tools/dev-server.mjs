/*
 * Local harness for verification only — not deployed, not part of the site.
 * Runs the real Worker from site/src/index.js against an in-memory KV and a
 * filesystem-backed ASSETS binding so every page can be rendered and checked
 * before anything goes near Cloudflare.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import worker from '../site/src/index.js';

const ROOT = new URL('../site/public/', import.meta.url).pathname;
const PORT = Number(process.env.PORT || 8788);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2'
};

const ASSETS = {
  async fetch(request) {
    const url = new URL(request.url);
    let p = decodeURIComponent(url.pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = join(ROOT, normalize(p).replace(/^(\.\.[/\\])+/, ''));
    try {
      await stat(file);
      const body = await readFile(file);
      return new Response(body, { headers: { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' } });
    } catch {
      return new Response('not found', { status: 404 });
    }
  }
};

const store = new Map();
const SCORES = {
  async get(k) { return store.has(k) ? store.get(k) : null; },
  async put(k, v) { store.set(k, v); },
  async delete(k) { store.delete(k); },
  async list({ prefix = '' } = {}) {
    return { keys: [...store.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true };
  }
};

const env = { ASSETS, SCORES, SCORER_KEY: 'who29' };

createServer(async (req, res) => {
  const body = ['GET', 'HEAD'].includes(req.method)
    ? undefined
    : await new Promise((r) => { const c = []; req.on('data', (d) => c.push(d)); req.on('end', () => r(Buffer.concat(c))); });

  const request = new Request(`http://localhost:${PORT}${req.url}`, { method: req.method, headers: req.headers, body });
  const out = await worker.fetch(request, env, {});
  res.writeHead(out.status, Object.fromEntries(out.headers));
  res.end(Buffer.from(await out.arrayBuffer()));
}).listen(PORT, () => console.log(`dev harness on http://localhost:${PORT}`));
