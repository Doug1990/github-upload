// Prüfskript: öffnet jede HTML-Seite im Repo in Headless-Chrome bei mehreren Breiten.
// Aufruf: node tests/check.mjs [--screens=<ordner>] [--chrome=<pfad>] [--langsam] [--ohne-extern]
// --langsam: Ladezeit bei gedrosseltem Netz (3G). Externe Links werden per HEAD geprüft (nur Warnung), --ohne-extern überspringt das.
// Keine Abhängigkeiten, nur Node 22 (eingebauter WebSocket) und ein lokales Chrome.
// Fehler (Exit-Code 1): Konsolenfehler, Ausnahmen, fehlgeschlagene Requests, horizontaler Überlauf,
// tote interne Links und Anker, fehlender title, fehlende Beschreibung, falsches oder fehlendes canonical, og:title ohne og:image,
// ungültiges JSON-LD, tote Adressen in der sitemap.xml. Warnungen (Exit-Code 0): Tippflächen unter 44 px bei schmaler Breite.
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

// Geteilter Browser: Setzt alle.mjs CHROME_PORT, öffnet check.mjs nur einen eigenen Tab im bereits laufenden Chrome.
const geteilt = process.env.CHROME_PORT;
let profile = null, chrome = null, port, target;
if (geteilt) {
  port = geteilt;
  target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
} else {
  profile = fs.mkdtempSync(path.join(os.tmpdir(), 'check-'));
  chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--mute-audio', ...(process.env.CI ? ['--no-sandbox'] : []), '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
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
      if (m.method === 'Network.requestWillBeSent' && /^https?:/.test(m.params.request.url) && !m.params.request.url.startsWith(BASE) && m.params.type !== 'Document') err(page, w, 'Request an fremde Herkunft: ' + m.params.request.url.slice(0, 120));
    }
    const r = await ev(`(()=>{
      const sel=e=>e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(e.className&&typeof e.className==='string'?'.'+e.className.trim().split(/\\s+/).slice(0,2).join('.'):'');
      const over=[...document.querySelectorAll('body *')].filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&(b.right>innerWidth+1||b.left<-1)&&!['fixed','sticky'].includes(getComputedStyle(e).position)&&!e.closest('svg')&&!e.closest('[style*="overflow"]')&&!/auto|scroll/.test(getComputedStyle(e.parentElement||e).overflowX)}).slice(0,4).map(sel);
      const small=[...document.querySelectorAll('button,a[href],[role=button],input:not([type=range]):not([type=hidden])')].filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&b.height>0&&(b.height<40||b.width<40)&&!e.closest('svg')&&!e.closest('footer')&&getComputedStyle(e).display!=='inline'}).slice(0,6).map(e=>sel(e)+' '+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height));
      const noName=[...document.querySelectorAll('button')].filter(b=>!b.textContent.trim()&&!b.getAttribute('aria-label')&&!b.getAttribute('title')).map(sel).slice(0,4);
      const fl=[...document.querySelectorAll('p,li,dd,blockquote')].filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&!e.closest('svg')&&!e.closest('footer')&&!e.closest('nav')&&e.children.length<3&&e.textContent.trim().length>60});
      const lh=e=>{const c=getComputedStyle(e);return parseFloat(c.lineHeight)||parseFloat(c.fontSize)*1.2};
      const lang=fl.filter(e=>{const n=Math.max(1,Math.round(e.getBoundingClientRect().height/lh(e)));return n>1&&e.textContent.trim().length/n>80}).slice(0,3).map(e=>sel(e)+' ca. '+Math.round(e.textContent.trim().length/Math.max(1,Math.round(e.getBoundingClientRect().height/lh(e))))+' Zeichen/Zeile');
      const klein=fl.filter(e=>parseFloat(getComputedStyle(e).fontSize)<16).length;
      const eng=fl.filter(e=>{const c=getComputedStyle(e);return lh(e)/parseFloat(c.fontSize)<1.45}).slice(0,3).map(sel);
      return {sw:document.documentElement.scrollWidth,iw:innerWidth,over,small,noName,lang,klein,eng,nfl:fl.length};})()`);
    if (r.sw > r.iw + 1) err(page, w, `horizontaler Überlauf (${r.sw} > ${r.iw}): ${r.over.join(', ') || 'Verursacher unklar'}`);
    if (w <= 390 && r.small.length) warn(page, w, 'Tippflächen unter 40 px: ' + r.small.join('; '));
    if (r.lang.length) err(page, w, 'Zeilen über 80 Zeichen: ' + r.lang.join('; '));
    if (w <= 390 && r.klein) err(page, w, `Fließtext unter 16 px: ${r.klein} von ${r.nfl} Absätzen`);
    if (r.eng.length) err(page, w, 'Zeilenabstand unter 1,45: ' + r.eng.join('; '));
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

// Meta-Angaben je Seite: title, Beschreibung, canonical (muss auf die eigene Pages-Adresse zeigen), og:image (lokal vorhanden,
// Pflicht bei Seiten mit og:title), dazu Gedankenstriche im sichtbaren Text. Die Pages-URL wird auf den lokalen Server abgebildet.
const PAGES_URL = 'https://doug1990.github.io/github-upload/';
for (const page of pages) {
  await send('Page.navigate', { url: `${BASE}/${page}` }); await sleep(600);
  const meta = await ev(`({d:document.querySelector('meta[name=description]')?.content||'',img:document.querySelector('meta[property="og:image"]')?.content||'',ogt:!!document.querySelector('meta[property="og:title"]'),can:[...document.querySelectorAll('link[rel=canonical]')].map(l=>l.href),t:document.title.trim(),ld:[...document.querySelectorAll('script[type="application/ld+json"]')].map(s=>s.textContent),txt:document.body.innerText})`);
  if (!meta.t) err(page, '-', 'kein title');
  if (!meta.d) err(page, '-', 'keine Meta-Beschreibung');
  else if (meta.d.length > 200) warn(page, '-', `Meta-Beschreibung mit ${meta.d.length} Zeichen (Suchmaschinen kürzen ab etwa 160)`);
  const soll = PAGES_URL + (page === 'index.html' ? '' : page);
  if (meta.can.length !== 1) err(page, '-', `canonical: ${meta.can.length} Angaben, erwartet genau eine`);
  else if (meta.can[0] !== soll) err(page, '-', `canonical zeigt auf ${meta.can[0]}, erwartet ${soll}`);
  if (meta.ogt && !meta.img) err(page, '-', 'og:title ohne og:image');
  for (const j of meta.ld) { try { JSON.parse(j); } catch { err(page, '-', 'JSON-LD ist kein gültiges JSON'); } }
  if (meta.img) {
    const local = meta.img.startsWith(PAGES_URL) ? meta.img.slice(PAGES_URL.length) : null;
    if (!local) err(page, '-', 'og:image zeigt nicht auf die Pages-Adresse: ' + meta.img);
    else { const r = await fetch(`${BASE}/${local}`); if (r.status !== 200) err(page, '-', `og:image fehlt (${r.status}): ${local}`); else if ((await r.arrayBuffer()).byteLength > 300000) warn(page, '-', 'og:image größer als 300 KB: ' + local); }
  }
  const strich = meta.txt.match(/[^\n]{0,24}[\u2014\u2013][^\n]{0,24}/g) || [];
  for (const z of strich.slice(0, 3)) warn(page, '-', 'Gedankenstrich im sichtbaren Text: "' + z.trim() + '"');
}

// Druckansicht: hell, ohne Bedienknöpfe, nichts unsichtbar (Einblendungen), Text bleibt in der Seitenbreite.
await send('Emulation.setEmulatedMedia', { media: 'print' });
await send('Emulation.setDeviceMetricsOverride', { width: 794, height: 1123, deviceScaleFactor: 1, mobile: false });
for (const page of pages) {
  await send('Page.navigate', { url: `${BASE}/${page}` }); await sleep(1200);
  const r = await ev(`(() => {
    const rgb = (c) => (c.match(/[0-9.]+/g) || [0, 0, 0]).slice(0, 3).map(Number);
    const hell = (c) => { const [r, g, b] = rgb(c); return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; };
    const bg = getComputedStyle(document.body).backgroundColor, fg = getComputedStyle(document.body).color;
    const knoepfe = [...document.querySelectorAll('button, input, select')].filter((e) => !e.closest('svg') && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0).length;
    const unsichtbar = [...document.querySelectorAll('.reveal')].filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.9).length;
    return { bg: hell(bg), fg: hell(fg), knoepfe, unsichtbar, sw: document.documentElement.scrollWidth };
  })()`);
  if (r.bg < 0.9) err(page, 'Druck', 'Hintergrund nicht hell');
  if (r.fg > 0.3) err(page, 'Druck', 'Textfarbe nicht dunkel');
  if (r.knoepfe) err(page, 'Druck', `${r.knoepfe} Bedienelemente bleiben sichtbar`);
  if (r.unsichtbar) err(page, 'Druck', `${r.unsichtbar} Abschnitte unsichtbar`);
  if (r.sw > 800) err(page, 'Druck', `Seite breiter als das Blatt (${r.sw} px)`);
}
await send('Emulation.setEmulatedMedia', { media: '' });

// Ohne JavaScript: Text bleibt lesbar (nichts steckt hinter einer per Skript gesetzten Einblendung), Hinweis ist da.
await send('Emulation.setScriptExecutionDisabled', { value: true });
for (const page of pages) {
  await send('Page.navigate', { url: `${BASE}/${page}` }); await sleep(900);
  const r = await ev(`(() => ({ hinweis: !!document.querySelector('.nojs-note') && document.querySelector('.nojs-note').offsetHeight > 0, text: document.body.innerText.length, verborgen: [...document.querySelectorAll('section[id], .sec, main')].filter((e) => e.getBoundingClientRect().height > 60 && parseFloat(getComputedStyle(e).opacity) < 0.5).length }))()`);
  if (!r.hinweis) err(page, '-', 'ohne JavaScript: kein sichtbarer Hinweis (noscript)');
  if (r.text < 400) err(page, '-', `ohne JavaScript: nur ${r.text} Zeichen sichtbarer Text`);
  if (r.verborgen) err(page, '-', `ohne JavaScript: ${r.verborgen} Abschnitte unsichtbar (Opacity unter 0,5)`);
}
await send('Emulation.setScriptExecutionDisabled', { value: false });

// Externe Links: HEAD-Anfrage (bei 405 oder 403 ein GET), nur Warnung. Ohne Netz oder mit --ohne-extern wird übersprungen.
if (!process.argv.includes('--ohne-extern')) {
  const ext = new Map();
  for (const page of pages) {
    const src = fs.readFileSync(path.join(ROOT, page), 'utf8');
    for (const [, u] of src.matchAll(/href="(https?:\/\/[^"#]+)/g)) if (!u.startsWith('https://doug1990.github.io/github-upload')) (ext.get(u) || ext.set(u, []).get(u)).push(page);
  }
  const pruefe = async (u) => {
    const versuch = async (method) => { const c = new AbortController(); const t = setTimeout(() => c.abort(), 8000); try { return (await fetch(u, { method, redirect: 'follow', signal: c.signal, headers: { 'user-agent': 'Mozilla/5.0 (Linkprüfung)' } })).status; } finally { clearTimeout(t); } };
    try { let s = await versuch('HEAD'); if (s === 405 || s === 403 || s === 501) s = await versuch('GET'); return s; } catch { return 0; }
  };
  const ergebnisse = await Promise.all([...ext.keys()].map(async (u) => [u, await pruefe(u)]));
  const keinNetz = ergebnisse.length > 0 && ergebnisse.every(([, s]) => s === 0);
  if (keinNetz) warnings.push('externe Links nicht geprüft (kein Netz erreichbar)');
  else for (const [u, s] of ergebnisse) if (s === 0 || s >= 400) warnings.push(`${ext.get(u)[0]}: externer Link ${u} antwortet ${s || 'nicht'}`);
}

// Ladetest mit --langsam: gedrosselt auf etwa 3G (400 ms Latenz, 400 kbit/s), meldet Zeit bis zum ersten Text und bis load.
if (process.argv.includes('--langsam')) {
  await send('Network.emulateNetworkConditions', { offline: false, latency: 400, downloadThroughput: 50000, uploadThroughput: 12500 });
  console.log('\nLadezeit bei 3G (400 ms Latenz, 400 kbit/s):');
  for (const page of pages) {
    await send('Page.navigate', { url: `${BASE}/${page}` });
    await sleep(500);
    let r = null;
    for (let i = 0; i < 90 && !(r && r.load); i++) { await sleep(1000); r = await ev(`(() => { const n = performance.getEntriesByType('navigation')[0]; const fcp = performance.getEntriesByName('first-contentful-paint')[0]; return { load: n && n.loadEventEnd > 0 ? Math.round(n.loadEventEnd) : 0, fcp: fcp ? Math.round(fcp.startTime) : 0, kb: Math.round(performance.getEntriesByType('resource').reduce((a, e) => a + (e.transferSize || 0), 0) / 1024) }; })()`); }
    console.log(`  ${page.padEnd(20)} erster Text ${r && r.fcp ? (r.fcp / 1000).toFixed(1) + ' s' : '?'}, load ${r && r.load ? (r.load / 1000).toFixed(1) + ' s' : 'nicht fertig'}, ${r ? r.kb : '?'} KB Unterressourcen`);
    if (r && r.fcp > 5000) warn(page, '-', `erster Text erst nach ${(r.fcp / 1000).toFixed(1)} s bei 3G`);
  }
  await send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
}

// sitemap.xml und robots.txt: jede gelistete Adresse muss auf eine vorhandene Seite zeigen
if (fs.existsSync(path.join(ROOT, 'sitemap.xml'))) {
  const sm = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  for (const [, u] of sm.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const f = u.startsWith(PAGES_URL) ? (u.slice(PAGES_URL.length) || 'index.html') : null;
    if (!f || !fs.existsSync(path.join(ROOT, f))) errors.push(`sitemap.xml: ${u} zeigt auf keine vorhandene Seite`);
  }
} else warnings.push('sitemap.xml fehlt');
if (!fs.existsSync(path.join(ROOT, 'robots.txt'))) warnings.push('robots.txt fehlt');

// Wartbarkeit der großen Dateien: doppelte IDs, Skriptblöcke ohne Kommentarkopf, doppelt vergebene Namen auf oberster
// Ebene (außerhalb von Funktionsblöcken, dort kollidiert nichts) und Sections mit id, die im Inhaltsverzeichnis fehlen.
for (const page of pages) {
  const src = fs.readFileSync(path.join(ROOT, page), 'utf8');
  const count = {};
  for (const [, id] of src.matchAll(/\sid="([^"]+)"/g)) count[id] = (count[id] || 0) + 1;
  for (const [id, n] of Object.entries(count)) if (n > 1) errors.push(`${page}: id="${id}" ist ${n}-mal vergeben`);
  const blocks = [...src.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*type="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const names = {};
  blocks.forEach((b, i) => {
    if (!/^\s*(\/\/|\/\*)/.test(b)) warnings.push(`${page}: Skriptblock ${i + 1} ohne Kommentarkopf`);
    for (const m of b.matchAll(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)|^(?:const|let|var)\s+([A-Za-z_$][\w$]*)/gm)) (names[m[1] || m[2]] ||= new Set()).add(i + 1);
  });
  for (const [n, set] of Object.entries(names)) if (set.size > 1) errors.push(`${page}: Name "${n}" steht auf oberster Ebene in den Skriptblöcken ${[...set].join(' und ')}`);
  const toc = (src.match(/<!-- Inhaltsverzeichnis[\s\S]*?-->/) || [''])[0];
  if (toc) for (const [, id] of src.matchAll(/<section[^>]*\bid="([^"]+)"/g)) if (!toc.includes('#' + id)) warnings.push(`${page}: Section #${id} fehlt im Inhaltsverzeichnis`);
}

ws.close(); server.close();
if (geteilt) { await fetch(`http://127.0.0.1:${port}/json/close/${target.id}`).catch(() => {}); } else { chrome.kill(); try { fs.rmSync(profile, { recursive: true, force: true }); } catch {} }
const uniq = (a) => [...new Set(a)];
console.log(`${pages.length} Seiten bei ${WIDTHS.join(', ')} px geprüft.`);
if (warnings.length) { console.log(`\nWarnungen (${uniq(warnings).length}):`); uniq(warnings).forEach((w) => console.log('  ! ' + w)); }
if (errors.length) { console.log(`\nFehler (${uniq(errors).length}):`); uniq(errors).forEach((e) => console.log('  X ' + e)); process.exit(1); }
console.log('\nKeine Fehler.');
