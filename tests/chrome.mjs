// Gemeinsame Hilfe für die Prüfskripte kontrast.mjs und tastatur.mjs:
// eigener Server auf das Repo, headless Chrome über das DevTools-Protokoll. Keine Abhängigkeiten.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const arg = (n) => (process.argv.find((a) => a.startsWith('--' + n + '=')) || '').split('=').slice(1).join('=');
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.ico': 'image/x-icon', '.webp': 'image/webp', '.jpg': 'image/jpeg' };

export async function start() {
  const chromePath = arg('chrome') || process.env.CHROME ||
    ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
  if (!chromePath) { console.error('Chrome nicht gefunden. Pfad mit --chrome=... angeben.'); process.exit(2); }
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
  // Geteilter Browser: Setzt alle.mjs CHROME_PORT, öffnet jedes Skript nur einen eigenen Tab im bereits laufenden Chrome.
  const geteilt = process.env.CHROME_PORT;
  let chrome = null, profile = null, port, target;
  if (geteilt) {
    port = geteilt;
    target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  } else {
    profile = fs.mkdtempSync(path.join(os.tmpdir(), 'a11y-'));
    chrome = spawn(chromePath, ['--headless=new', '--disable-gpu', '--mute-audio', ...(process.env.CI ? ['--no-sandbox'] : []), '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
    const wsUrl = await new Promise((resolve, reject) => {
      let buf = '';
      chrome.stderr.on('data', (d) => { buf += d; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) resolve(m[1]); });
      setTimeout(() => reject(new Error('Chrome startet nicht')), 15000);
    });
    port = new URL(wsUrl).port;
    target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === 'page');
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0; const pend = {}; const b = { events: [] };
  ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) pend[m.id](m.result); else if (m.method) b.events.push(m); };
  b.send = (method, params = {}) => new Promise((r) => { pend[++id] = r; ws.send(JSON.stringify({ id, method, params })); });
  b.ev = async (x) => (await b.send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result?.value;
  for (const d of ['Runtime', 'Page', 'Network']) await b.send(d + '.enable');
  await b.send('Network.setCacheDisabled', { cacheDisabled: true });
  b.BASE = BASE; b.pages = pages;
  b.open = async (page, width, opts = {}) => {
    await b.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 500 });
    await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: opts.reduce ? 'reduce' : 'no-preference' }] });
    await b.send('Page.navigate', { url: `${BASE}/${page}` });
    await sleep(2200);
    // Seite einmal durchscrollen, damit sichtbarkeitsgesteuerte Skripte laufen
    await b.ev(`(async()=>{const h=document.documentElement.scrollHeight;for(let y=0;y<h;y+=700){scrollTo(0,y);await new Promise(r=>setTimeout(r,120));}scrollTo(0,0);})()`);
    await sleep(500);
  };
  b.close = () => { ws.close(); if (geteilt) fetch(`http://127.0.0.1:${port}/json/close/${target.id}`).catch(() => {}); else { chrome.kill(); try { fs.rmSync(profile, { recursive: true, force: true }); } catch {} } server.close(); };
  return b;
}

// Zustandstreiber für Kontrast- und Tastaturprüfung: bringt die geladene Seite Schritt für Schritt in Zustände,
// die im Ausgangszustand nicht zu sehen sind. Die Schritte bauen aufeinander auf, ein Fehler wird dem Schritt
// zugeordnet, nach dem er zuerst auftrat. Gedrückt wird nur, was zur Seite gehört: Knöpfe, Tabs, Teile, Chips.
// Ausgelassen sind Knöpfe, die Dateien speichern, Dialoge öffnen oder Eingaben absenden.
const SKIP_IDS = ['exportBtn', 'packBtn', 'packApply', 'packClose', 'submitBtn', 'heroScrollBtn', 'shelfCheckout'];
const KLICK = 'button, [role=button], [role=tab], g.part, .cg-chip, .journey-tab, .now-you-chip, .chain-tag';

export async function zustandsSchritte(b) {
  const parts = await b.ev(`document.querySelectorAll('g.part').length`);
  const themes = await b.ev(`[...document.querySelectorAll('.theme-dot[data-theme]:not(.active)')].map((e) => e.dataset.theme)`);
  const klicke = (nurSchalter) => b.ev(`(async () => {
    const skip = ${JSON.stringify(SKIP_IDS)};
    const ok = (e) => !e.disabled && !skip.includes(e.id) && !e.classList.contains('theme-dot') && !e.closest('[inert]') && e.checkVisibility({ checkVisibilityCSS: true });
    const sel = ${nurSchalter ? "'[aria-pressed=\"false\"]'" : JSON.stringify(KLICK)};
    const liste = [...document.querySelectorAll(sel)].filter(ok);
    for (const e of liste) { if (e.isConnected && ok(e)) e.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); await new Promise((r) => setTimeout(r, 80)); }
    return liste.length;
  })()`);
  const steps = [{ name: 'alle Details offen', run: () => b.ev(`document.querySelectorAll('details').forEach((d) => { d.open = true; })`) }];
  for (let i = 0; i < parts; i++) steps.push({ name: `Bauteil ${i + 1} angetippt`, run: () => b.ev(`(() => { const p = document.querySelectorAll('g.part')[${i}]; if (p) p.dispatchEvent(new MouseEvent('click', { bubbles: true })); })()`) });
  steps.push({ name: 'Schalter umgelegt', run: () => klicke(true) });
  for (const t of themes) steps.push({ name: `Theme ${t}`, run: () => b.ev(`document.querySelector('.theme-dot[data-theme="${t}"]').click()`) });
  if (themes.length) steps.push({ name: 'Theme zurück', run: () => b.ev(`document.querySelector('.theme-dot[data-theme="blue"]').click()`) });
  steps.push({ name: 'alle Knöpfe gedrückt', run: () => klicke(false) });
  return steps;
}
