// Prüft "Dein Tag in einer Zelle" auf der Zell-Seite: Phasen, Balkenwörter, Texte, Zeitmarke,
// Bedienbarkeit bei 390 px, Reduced Motion (keine Übergänge).
// Aufruf: node tests/tag.mjs [--screens=<ordner>] [--chrome=<pfad>]
import fs from 'node:fs';
import { start, arg, sleep } from './chrome.mjs';

const SCREENS = arg('screens');
if (SCREENS) fs.mkdirSync(SCREENS, { recursive: true });
const b = await start();
const fehler = [];
const check = (ok, msg) => { if (!ok) fehler.push(msg); };
const setze = (h) => b.ev(`(() => { const e = document.getElementById('tagH'); e.value = ${h}; e.dispatchEvent(new Event('input')); })()`);
const lies = () => b.ev(`(() => ({
  zeit: document.getElementById('tagT').textContent, phase: document.getElementById('tagPh').textContent,
  w: [0, 1, 2, 3].map((i) => document.getElementById('tagW' + i).textContent),
  z: document.getElementById('tagZ').textContent, s: document.getElementById('tagS').textContent,
  vt: document.getElementById('tagH').getAttribute('aria-valuetext'), links: document.getElementById('tagM').style.left }))()`);
const shot = async (name) => {
  if (!SCREENS) return;
  const s = await b.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${SCREENS}/tag-${name}.png`, Buffer.from(s.data, 'base64'));
};
const zeige = () => b.ev(`document.getElementById('tagPanel').scrollIntoView({ block: 'center' })`);

await b.open('zelle.html', 1280); await zeige();
let r = await lies();
check(r.zeit === '7 Uhr' && r.phase === 'Morgen', `Start: ${r.zeit} / ${r.phase}`);
check(r.z.length > 20 && r.s.length > 20, 'Start: Texte fehlen');

const faelle = [[3, 'Nacht', 'wenig', 'viel'], [8, 'Morgen', 'viel', 'mittel'], [11, 'Tag', 'viel', 'wenig'], [16, 'Nachmittag', 'viel', 'mittel'], [20, 'Abend', 'mittel', 'mittel'], [23, 'Nacht', 'wenig', 'viel']];
const gesehen = new Set();
for (const [h, ph, energie, aufraeumen] of faelle) {
  await setze(h); r = await lies();
  check(r.phase === ph, `${h} Uhr: Phase ${r.phase}, erwartet ${ph}`);
  check(r.zeit === `${h} Uhr`, `${h} Uhr: Anzeige ${r.zeit}`);
  check(r.w[0] === energie, `${h} Uhr: Energie ${r.w[0]}, erwartet ${energie}`);
  check(r.w[2] === aufraeumen, `${h} Uhr: Aufräumen ${r.w[2]}, erwartet ${aufraeumen}`);
  check(r.vt === `${h} Uhr, ${ph}`, `${h} Uhr: aria-valuetext "${r.vt}"`);
  gesehen.add(r.z);
}
check(gesehen.size === 5, `Fünf verschiedene Zelltexte erwartet, gesehen ${gesehen.size}`);
await setze(0); r = await lies(); check(parseFloat(r.links) === 0, `Marke bei 0 Uhr: ${r.links}`);
await setze(23); r = await lies(); check(parseFloat(r.links) === 100, `Marke bei 23 Uhr: ${r.links}`);
await setze(12);
// Tastatur: Pfeil rechts über den Regler
await b.ev(`document.getElementById('tagH').focus()`);
await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39 });
await sleep(200); r = await lies();
check(r.zeit === '13 Uhr', `Tastatur: Pfeil rechts ergibt ${r.zeit}, erwartet 13 Uhr`);
await shot('1280');

// Link zur Düsseldorf-Seite
const link = await b.ev(`document.querySelector('#tag .lead a').getAttribute('href')`);
check(link === 'index.html', `Link zur Startseite: ${link}`);

// 390 px
await b.open('zelle.html', 390); await zeige(); await sleep(500);
const h = await b.ev(`Math.round(document.getElementById('tagH').getBoundingClientRect().height)`);
check(h >= 44, `390 px: Regler ${h} px hoch`);
check(!(await b.ev(`document.documentElement.scrollWidth > innerWidth`)), '390 px: horizontaler Überlauf');
await shot('390');

// Reduced Motion
await b.open('zelle.html', 1280, { reduce: true });
const d = await b.ev(`[getComputedStyle(document.getElementById('tagB0')).transitionDuration, getComputedStyle(document.getElementById('tagM')).transitionDuration]`);
check(d.every((x) => parseFloat(x) < 0.001), `Reduced Motion: Übergänge ${d.join(' und ')}`);

b.close();
if (fehler.length) { console.error('\nFehler:\n' + fehler.join('\n')); process.exit(1); }
console.log('Alle Fälle ok.\n\nKeine Fehler.');
