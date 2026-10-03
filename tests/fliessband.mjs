// Prüft den Fließband-Abschnitt auf der Zell-Seite: Ruhezustand, Engpass mit Rückstau, Endprodukt
// wird nicht abgenommen, Rückkopplung, Reduced Motion (Ergebnis sofort, ohne laufende Schleife).
// Aufruf: node tests/fliessband.mjs [--screens=<ordner>] [--chrome=<pfad>]
// Fehler (Exit-Code 1): ein Szenario weicht vom erwarteten Verhalten ab.
import fs from 'node:fs';
import { start, arg, sleep } from './chrome.mjs';

const SCREENS = arg('screens');
if (SCREENS) fs.mkdirSync(SCREENS, { recursive: true });
const b = await start();
const fehler = [];
const check = (ok, msg) => { if (!ok) fehler.push(msg); };

const setze = (id, v) => b.ev(`(() => { const e = document.getElementById('${id}'); e.value = ${v}; e.dispatchEvent(new Event('input')); })()`);
const zustand = () => b.ev(`(() => { const [q, P] = document.getElementById('fbPanel').getAttribute('data-fb').split('|'); return { q: q.split(',').map(Number), P: Number(P), status: document.getElementById('fbStatus').textContent, band: Number(document.getElementById('fbBand').textContent), konsole: 0 }; })()`);
const sichtbar = () => b.ev(`document.getElementById('fbPanel').scrollIntoView({ block: 'center' })`);
const shot = async (name) => {
  if (!SCREENS) return;
  const s = await b.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${SCREENS}/fliessband-${name}.png`, Buffer.from(s.data, 'base64'));
};

// 1. Normalbetrieb bei 1280 px
await b.open('zelle.html', 1280);
await sichtbar(); await sleep(7000);
let z = await zustand();
check(z.q.every((n) => n <= 3), `Ruhezustand: Schlangen ${z.q} sollten klein sein`);
check(/läuft rund/.test(z.status), `Ruhezustand: Status "${z.status}"`);
await shot('ruhe-1280');

// 2. Engpass an Station 3
await setze('fbE3', 20); await sleep(14000);
z = await zustand();
check(z.q[2] >= 7, `Engpass: Schlange vor Station 3 ist ${z.q[2]}, erwartet mindestens 7`);
check(z.q[1] >= 6, `Engpass: Stau erreicht Station 2 nicht (${z.q[1]})`);
check(/Vor Station 3 staut es sich/.test(z.status), `Engpass: Status "${z.status}"`);
await shot('engpass-1280');

// 3. Engpass lösen, Endprodukt wird nicht abgenommen
await setze('fbE3', 100); await setze('fbIn', 100); await setze('fbOut', 0); await sleep(16000);
z = await zustand();
check(z.P >= 9, `Kein Verbrauch: Pegel ${z.P}, erwartet mindestens 9`);
check(z.band >= 20, `Kein Verbrauch: nur ${z.band} Teile auf dem Band, Rückstau fehlt`);
check(/nicht abgenommen/.test(z.status), `Kein Verbrauch: Status "${z.status}"`);
await shot('ohne-rueckkopplung-1280');

// 4. Neuer Lauf mit Rückkopplung von Anfang an: Rohstoff wartet vorn, hinten bleibt das Band leer
await b.open('zelle.html', 1280); await sichtbar();
await setze('fbIn', 100); await setze('fbOut', 0);
await b.ev(`document.getElementById('fbFb').click()`); await sleep(16000);
z = await zustand();
const an = await b.ev(`document.getElementById('fbFb').getAttribute('aria-pressed') + '|' + document.getElementById('fbFb').textContent`);
check(an === 'true|Rückkopplung: an', `Rückkopplung: Schalter zeigt ${an}`);
check(z.band <= 3, `Rückkopplung: ${z.band} Teile hinter dem Eingang, erwartet höchstens 3`);
check(z.P >= 8 && z.P <= 10, `Rückkopplung: Pegel ${z.P}, erwartet 8 bis 10`);
check(/bremst Station 1/.test(z.status), `Rückkopplung: Status "${z.status}"`);
await shot('rueckkopplung-1280');

// 5. Pause hält die Schleife an
await b.ev(`document.getElementById('fbPause').click()`);
const vor = await b.ev(`document.getElementById('fbPanel').getAttribute('data-fb')`); await sleep(1500);
const nach = await b.ev(`document.getElementById('fbPanel').getAttribute('data-fb')`);
check(vor === nach, 'Pause: Zustand ändert sich weiter');

// 6. Schmale Breite: Layout und Bedienelemente
await b.open('zelle.html', 390); await sichtbar(); await sleep(3000);
const klein = await b.ev(`(() => [...document.querySelectorAll('.fb-controls input, .fb-controls button')].map((e) => ({ id: e.id, h: Math.round(e.getBoundingClientRect().height) })))()`);
klein.forEach((e) => check(e.h >= 44, `390 px: ${e.id} nur ${e.h} px hoch`));
const ueberlauf = await b.ev(`document.documentElement.scrollWidth > innerWidth`);
check(!ueberlauf, '390 px: horizontaler Überlauf');
await shot('390');

// 7. Reduced Motion: kein Dauerlauf, Ergebnis sofort nach Eingabe
await b.open('zelle.html', 1280, { reduce: true }); await sichtbar(); await sleep(800);
await setze('fbE3', 20);
z = await zustand();
check(z.q[2] >= 7, `Reduced Motion: Schlange vor Station 3 ist ${z.q[2]}, Ergebnis sollte sofort stehen`);
const a1 = await b.ev(`document.getElementById('fbPanel').getAttribute('data-fb')`); await sleep(1500);
const a2 = await b.ev(`document.getElementById('fbPanel').getAttribute('data-fb')`);
check(a1 === a2, 'Reduced Motion: Zustand läuft ohne Eingabe weiter');
check(await b.ev(`document.getElementById('fbPause').hidden`), 'Reduced Motion: Pause-Knopf sollte versteckt sein');
await shot('reduced-1280');

b.close();
if (fehler.length) { console.error('\nFehler:\n' + fehler.join('\n')); process.exit(1); }
console.log('Alle Szenarien ok.\n\nKeine Fehler.');
