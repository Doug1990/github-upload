// Prüfskript: öffnet jede HTML-Seite im Repo in Headless-Chrome bei mehreren Breiten.
// Aufruf: node tests/check.mjs [--screens=<ordner>] [--chrome=<pfad>]
// Keine Abhängigkeiten, nur Node 22 (eingebauter WebSocket) und ein lokales Chrome.
// Fehler (Exit-Code 1): Konsolenfehler, Ausnahmen, fehlgeschlagene Requests, horizontaler Überlauf,
// tote interne Links und Anker. Warnungen (Exit-Code 0): Tippflächen unter 44 px bei schmaler Breite.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n) => (process.argv.find((a) => a.startsWith('--' + n + '=')) || '').split('=').slice(1).join('=');
const CHROME = arg('chrome') || process.env.CHROME ||
  ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
if (!CHROME) { console.error('Chrome nicht gefunden. Pfad mit --chrome=... angeben.'); process.exit(2); }
const SCREENS = arg('screens');
const WIDTHS = [1280, 768, 390, 360];
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.ico': 'image/x-icon', '.webp': 'image/webp', '.jpg': 'image/jpeg' };

const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html')).sort();
const server = http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  const f = path.join(ROOT, u === '/' ? 'index.html' : u);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('nicht gefunden'); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + server.address().port;

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'check-'));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--mute-audio', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
const wsUrl = await new Promise((resolve, reject) => {
  let buf = '';
  chrome.stderr.on('data', (d) => { buf += d; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) resolve(m[1]); });
  setTimeout(() => reject(new Error('Chrome startet nicht')), 15000);
});
const port = new URL(wsUrl).port;
const target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page');
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));

let id = 0; const pend = {}; let events = [];
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) pend[m.id](m.result); else if (m.method) events.push(m); };
const send = (method, params = {}) => new Promise((r) => { pend[++id] = r; ws.send(JSON.stringify({ id, method, params })); });
const ev = async (x) => (await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result?.value;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (const d of ['Runtime', 'Page', 'Network', 'Log']) await send(d + '.enable');
await send('Network.setCacheDisabled', { cacheDisabled: true });
if (SCREENS) fs.mkdirSync(SCREENS, { recursive: true });

const errors = [], warnings = [];
const err = (p, w, m) => errors.push(`${p} @${w}px: ${m}`);
const warn = (p, w, m) => warnings.push(`${p} @${w}px: ${m}`);

for (const page of pages) {
  for (const w of WIDTHS) {
    events = [];
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 500 });
    await send('Page.navigate', { url: `${BASE}/${page}` });
    await sleep(2200);
    // Seite einmal durchscrollen, damit sichtbarkeitsgesteuerte Skripte laufen
    await ev(`(async()=>{const h=document.documentElement.scrollHeight;for(let y=0;y<h;y+=700){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}scrollTo(0,0);})()`);
    await sleep(500);
    for (const m of events) {
      if (m.method === 'Runtime.exceptionThrown') err(page, w, 'Ausnahme: ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).split('\n')[0]);
      if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') err(page, w, 'Konsolenfehler: ' + m.params.args.map((a) => a.value ?? a.description).join(' ').slice(0, 160));
      if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error' && !/favicon\.ico/.test(m.params.entry.url || '')) err(page, w, `Ladefehler: ${m.params.entry.text} ${m.params.entry.url || ''}`.slice(0, 200));
      if (m.method === 'Network.loadingFailed' && !m.params.canceled) err(page, w, 'Request fehlgeschlagen: ' + m.params.errorText);
    }
    const r = await ev(`(()=>{
      const sel=e=>e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\\s+/).slice(0,2).join('.'):'');
      const over=[...document.querySelectorAll('body *')].filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&(b.right>innerWidth+1||b.left<-1)&&!['fixed','sticky'].includes(getComputedStyle(e).position)&&!e.closest('svg')&&!e.closest('[style*="overflow"]')&&!/auto|scroll/.test(getComputedStyle(e.parentElement||e).overflowX)}).slice(0,4).map(sel);
      const small=[...document.querySelectorAll('button,a[href],[role=button],input:not([type=range]):not([type=hidden])')].filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&b.height>0&&(b.height<40||b.width<40)&&!e.closest('svg')&&!e.closest('footer')&&getComputedStyle(e).display!=='inline'}).slice(0,6).map(e=>sel(e)+' '+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height));
      const noName=[...document.querySelectorAll('button')].filter(b=>!b.textContent.trim()&&!b.getAttribute('aria-label')&&!b.getAttribute('title')).map(sel).slice(0,4);
      return {sw:document.documentElement.scrollWidth,iw:innerWidth,over,small,noName};})()`);
    if (r.sw > r.iw + 1) err(page, w, `horizontaler Überlauf (${r.sw} > ${r.iw}): ${r.over.join(', ') || 'Verursacher unklar'}`);
    if (w <= 390 && r.small.length) warn(page, w, 'Tippflächen unter 40 px: ' + r.small.join('; '));
    if (r.noName.length) warn(page, w, 'Buttons ohne Name: ' + r.noName.join(', '));
    if (SCREENS) { const s = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(path.join(SCREENS, `${page.replace('.html', '')}-${w}.png`), Buffer.from(s.data, 'base64')); }
  }
  // Links und Anker (einmal pro Seite, unabhängig von der Breite)
  await send('Page.navigate', { url: `${BASE}/${page}` }); await sleep(800);
  const links = await ev(`[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href'))`);
  const ids = await ev(`[...document.querySelectorAll('[id]')].map(e=>e.id)`);
  for (const href of new Set(links)) {
    if (/^(https?:|mailto:|tel:|javascript:)/.test(href)) continue;
    if (href.startsWith('#')) { if (href.length > 1 && !ids.includes(href.slice(1))) err(page, '-', `toter Anker ${href}`); continue; }
    const [file, hash] = href.split('#');
    const res = await fetch(`${BASE}/${file}`);
    if (res.status !== 200) { err(page, '-', `toter Link ${href} (${res.status})`); continue; }
    if (hash && file.endsWith('.html')) { const t = await res.text(); if (!t.includes(`id="${hash}"`)) err(page, '-', `toter Anker ${href}`); }
  }
}

// Meta-Angaben: Beschreibung für alle Seiten, og:image muss lokal existieren (Pages-URL auf lokalen Server abgebildet)
const PAGES_URL = 'https://doug1990.github.io/github-upload/';
for (const page of pages) {
  await send('Page.navigate', { url: `${BASE}/${page}` }); await sleep(600);
  const meta = await ev(`({d:document.querySelector('meta[name=description]')?.content||'',img:document.querySelector('meta[property="og:image"]')?.content||'',t:document.title})`);
  if (!meta.d) warn(page, '-', 'keine Meta-Beschreibung');
  if (meta.img) {
    const local = meta.img.startsWith(PAGES_URL) ? meta.img.slice(PAGES_URL.length) : null;
    if (!local) err(page, '-', 'og:image zeigt nicht auf die Pages-Adresse: ' + meta.img);
    else { const r = await fetch(`${BASE}/${local}`); if (r.status !== 200) err(page, '-', `og:image fehlt (${r.status}): ${local}`); else if ((await r.arrayBuffer()).byteLength > 300000) warn(page, '-', 'og:image größer als 300 KB: ' + local); }
  }
}

ws.close(); chrome.kill(); server.close();
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
const uniq = (a) => [...new Set(a)];
console.log(`${pages.length} Seiten bei ${WIDTHS.join(', ')} px geprüft.`);
if (warnings.length) { console.log(`\nWarnungen (${uniq(warnings).length}):`); uniq(warnings).forEach((w) => console.log('  ! ' + w)); }
if (errors.length) { console.log(`\nFehler (${uniq(errors).length}):`); uniq(errors).forEach((e) => console.log('  X ' + e)); process.exit(1); }
console.log('\nKeine Fehler.');
