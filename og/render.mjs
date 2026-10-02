// Erzeugt die Vorschaubilder (1200x630) für Open Graph aus og/vorlage.html.
// Aufruf: node og/render.mjs [--chrome=<pfad>]   Ergebnis: og/index.jpg, og/karte.jpg, og/zelle.jpg
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
import { spawn } from 'node:child_process'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CH = (process.argv.find((a) => a.startsWith('--chrome=')) || '').slice(9) || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => fs.existsSync(p));
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(ROOT) || !fs.existsSync(f)) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const base = 'http://127.0.0.1:' + srv.address().port;
const prof = fs.mkdtempSync(path.join(os.tmpdir(), 'og-'));
const ch = spawn(CH, ['--headless=new', '--disable-gpu', '--remote-debugging-port=0', '--user-data-dir=' + prof, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
const wsUrl = await new Promise((res) => { let b = ''; ch.stderr.on('data', (d) => { b += d; const m = b.match(/listening on (ws:\/\/\S+)/); if (m) res(m[1]); }); });
const port = new URL(wsUrl).port; const t = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((x) => x.type === 'page');
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
let id = 0; const pend = {}; ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) pend[m.id](m.result); };
const send = (method, params = {}) => new Promise((r) => { pend[++id] = r; ws.send(JSON.stringify({ id, method, params })); });
await send('Page.enable'); await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
const BILDER = [
  ['index', { motiv: 'stadt', eyebrow: 'Düsseldorf · in Arbeit', titel: 'Hinter fast allem, was du machst, steckt Infrastruktur.', text: 'Woran ein normaler Tag hängt: Wasser, Strom, Bahnen, Netze und viele Leute, die dafür arbeiten.' }],
  ['karte', { motiv: 'karte', eyebrow: 'Skizze · Düsseldorf', titel: 'Was leuchtet, wenn du etwas tust?', text: 'Tipp an, was du heute gemacht hast, und sieh, was dafür mitläuft.' }],
  ['zelle', { motiv: 'zelle', eyebrow: 'Infrastruktur des Lebens', titel: 'Die Zelle als Stadt.', text: 'Archiv, Fabrik, Müllabfuhr, Stadtgrenze. Zum Anfassen: Zoom, Turbine, Evolution, Teilung.' }]
];
for (const [name, p] of BILDER) {
  await send('Page.navigate', { url: `${base}/og/vorlage.html?${new URLSearchParams(p)}` });
  await new Promise((r) => setTimeout(r, 1500));
  await send('Runtime.evaluate', { expression: 'document.fonts.ready', awaitPromise: true });
  const s = await send('Page.captureScreenshot', { format: 'jpeg', quality: 86 });
  fs.writeFileSync(path.join(ROOT, 'og', name + '.jpg'), Buffer.from(s.data, 'base64')); console.log('og/' + name + '.jpg');
}
ws.close(); ch.kill(); srv.close();
try { fs.rmSync(prof, { recursive: true, force: true }); } catch {}
