// Prüft "Drei Fragen zum Schluss" auf der Zell-Seite: geschlossen beim Start, per Tastatur zu öffnen,
// Tippflächen mindestens 44 px, Links führen zu vorhandenen Ankern und Seiten, Kontrast im geöffneten
// Zustand, kein Überlauf bei 390 px, Reduced Motion ohne Animation.
// Aufruf: node tests/fragen.mjs [--screens=<ordner>] [--chrome=<pfad>]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { start, arg, sleep } from './chrome.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SCREENS = arg('screens');
if (SCREENS) fs.mkdirSync(SCREENS, { recursive: true });
const b = await start();
const fehler = [];
const check = (ok, msg) => { if (!ok) fehler.push(msg); };
const shot = async (name) => {
  if (!SCREENS) return;
  const s = await b.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${SCREENS}/fragen-${name}.png`, Buffer.from(s.data, 'base64'));
};
const zeige = () => b.ev(`(() => { document.documentElement.style.scrollBehavior = 'auto'; document.getElementById('fragen').scrollIntoView({ block: 'start' }); })()`);
const taste = async (key, code, vk, text) => {
  await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: vk, text });
  await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk });
};

for (const w of [1280, 390]) {
  await b.open('zelle.html', w); await zeige(); await sleep(400);
  const n = await b.ev(`document.querySelectorAll('#fragen .frage').length`);
  check(n === 3, `${w} px: ${n} Fragen, erwartet 3`);
  check(await b.ev(`[...document.querySelectorAll('#fragen .frage')].every((d) => !d.open)`), `${w} px: Fragen sind beim Start nicht alle geschlossen`);
  const hs = await b.ev(`[...document.querySelectorAll('#fragen summary')].map((e) => Math.round(e.getBoundingClientRect().height))`);
  hs.forEach((h, i) => check(h >= 44, `${w} px: Frage ${i + 1} nur ${h} px hoch`));

  // Tastatur: erste Frage fokussieren, Enter öffnet, Enter schließt wieder
  await b.ev(`document.querySelector('#fragen summary').focus()`);
  await taste('Enter', 'Enter', 13, '\r'); await sleep(200);
  check(await b.ev(`document.querySelector('#fragen .frage').open`), `${w} px: Enter öffnet die erste Frage nicht`);
  await taste('Enter', 'Enter', 13, '\r'); await sleep(200);
  check(!(await b.ev(`document.querySelector('#fragen .frage').open`)), `${w} px: Enter schließt die erste Frage nicht`);

  // Alle öffnen: Überlauf, Link-Höhe, Kontrast
  await b.ev(`document.querySelectorAll('#fragen .frage').forEach((d) => { d.open = true; })`); await sleep(500);
  check(!(await b.ev(`document.documentElement.scrollWidth > innerWidth`)), `${w} px: horizontaler Überlauf bei offenen Antworten`);
  const lh = await b.ev(`[...document.querySelectorAll('#fragen .frage-links a')].map((a) => ({ t: a.textContent, h: Math.round(a.getBoundingClientRect().height) }))`);
  lh.forEach((l) => check(l.h >= 44, `${w} px: Link "${l.t}" nur ${l.h} px hoch`));
  const kont = await b.ev(`(() => {
    const lum = (c) => { const [r, g, bl] = c.match(/\\d+(\\.\\d+)?/g).slice(0, 3).map(Number).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * r + 0.7152 * g + 0.0722 * bl; };
    const bg = lum('rgb(22,38,31)');
    return [...document.querySelectorAll('#fragen .frage-body p, #fragen .frage-links a, #fragen summary')].map((e) => {
      const l = lum(getComputedStyle(e).color); return { t: e.textContent.slice(0, 30), r: (Math.max(l, bg) + 0.05) / (Math.min(l, bg) + 0.05) };
    });
  })()`);
  kont.forEach((k) => check(k.r >= 4.5, `${w} px: Kontrast ${k.r.toFixed(2)} bei "${k.t}"`));
  await shot(String(w));
  if (w === 1280) {
    // Links: Anker vorhanden, Seiten vorhanden
    const links = await b.ev(`[...document.querySelectorAll('#fragen .frage-links a')].map((a) => a.getAttribute('href'))`);
    for (const h of links) {
      if (h.startsWith('#')) check(await b.ev(`!!document.getElementById('${h.slice(1)}')`), `Link ${h}: Anker fehlt`);
      else check(fs.existsSync(path.join(ROOT, h)), `Link ${h}: Datei fehlt`);
    }
    check(links.length === 9, `${links.length} Links, erwartet 9`);
  }
}

// Reduced Motion: keine Animation beim Öffnen
await b.open('zelle.html', 1280, { reduce: true }); await zeige();
await b.ev(`document.querySelector('#fragen .frage').open = true`); await sleep(100);
const an = await b.ev(`getComputedStyle(document.querySelector('#fragen .frage-body')).animationName`);
check(an === 'none' || await b.ev(`parseFloat(getComputedStyle(document.querySelector('#fragen .frage-body')).animationDuration) < 0.001`), `Reduced Motion: Animation "${an}"`);

b.close();
if (fehler.length) { console.error('\nFehler:\n' + fehler.join('\n')); process.exit(1); }
console.log('Alle Fälle ok.\n\nKeine Fehler.');
