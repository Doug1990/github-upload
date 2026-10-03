// Prüft "Wenn es hakt" auf der Startseite: Ruhezustand, Ausbreitung nach dem Abschalten (erste Stunden und
// nach Tagen), einzelne Leitungen, Reset, Tastatur, Reduced Motion (Ergebnis sofort) und 390 px.
// Aufruf: node tests/stoerung.mjs [--screens=<ordner>] [--chrome=<pfad>]
import fs from 'node:fs';
import { start, arg, sleep } from './chrome.mjs';

const SCREENS = arg('screens');
if (SCREENS) fs.mkdirSync(SCREENS, { recursive: true });
const b = await start();
const fehler = [];
const check = (ok, msg) => { if (!ok) fehler.push(msg); };
const klick = (id) => b.ev(`document.getElementById('${id}').click()`);
const zustand = () => b.ev(`(() => { const o = {}; document.querySelectorAll('#stoerGrid .st-card').forEach((c) => { o[c.dataset.id] = c.dataset.status + ':' + c.dataset.stufe; }); return { o, status: document.getElementById('stoerStatus').textContent }; })()`);
const zeige = () => b.ev(`(() => { document.documentElement.style.scrollBehavior = 'auto'; document.getElementById('stoerung').scrollIntoView({ block: 'start' }); })()`);
const shot = async (name) => {
  if (!SCREENS) return;
  const s = await b.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${SCREENS}/stoerung-${name}.png`, Buffer.from(s.data, 'base64'));
};
const erwarte = (z, soll, label) => {
  for (const [id, v] of Object.entries(soll)) check(z.o[id] && z.o[id].split(':')[0] === v, `${label}: ${id} ist ${z.o[id]}, erwartet ${v}`);
};

await b.open('index.html', 1280); await zeige(); await sleep(400);
let z = await zustand();
check(Object.keys(z.o).length === 8, `${Object.keys(z.o).length} Karten, erwartet 8`);
erwarte(z, { strom: 'ok', wasser: 'ok', daten: 'ok', verkehr: 'ok', klaer: 'ok', klinik: 'ok', laden: 'ok', muell: 'ok' }, 'Start');
check(/Alles läuft/.test(z.status), `Start: Status "${z.status}"`);

// Strom ab, erste Stunden: zwei Stufen
await klick('stoerSw-strom'); await sleep(1100);
z = await zustand();
check(z.o.muell.startsWith('ok'), 'Stufe 1: Müllabfuhr darf noch nicht ausgefallen sein');
erwarte(z, { strom: 'src', verkehr: 'out', laden: 'out' }, 'Strom, Stufe 1');
await sleep(2000); z = await zustand();
erwarte(z, { strom: 'src', wasser: 'res', daten: 'res', klaer: 'res', klinik: 'res', verkehr: 'out', laden: 'out', muell: 'out' }, 'Strom, Stunden');
check(z.o.muell.endsWith(':2'), `Müllabfuhr: Stufe ${z.o.muell}, erwartet 2`);
check(/Strom fällt aus/.test(z.status) && /Müllabfuhr/.test(z.status) && /Ersatz trägt nur eine Weile/.test(z.status), `Strom: Status "${z.status}"`);
await shot('strom-stunden-1280');

// Nach Tagen: Ersatz trägt nicht mehr
await klick('stoerD'); await sleep(3200); z = await zustand();
erwarte(z, { strom: 'src', wasser: 'out', daten: 'out', klaer: 'out', klinik: 'out', verkehr: 'out', laden: 'out', muell: 'out' }, 'Strom, Tage');
check(!/Ersatz trägt nur eine Weile/.test(z.status), 'Tage: Hinweis auf begrenzten Ersatz sollte entfallen');
await shot('strom-tage-1280');

// Reset
await klick('stoerReset'); await sleep(300); z = await zustand();
erwarte(z, { strom: 'ok', wasser: 'ok', klinik: 'ok', muell: 'ok' }, 'Reset');
check(await b.ev(`document.getElementById('stoerSw-strom').getAttribute('aria-pressed')`) === 'false', 'Reset: Schalter noch gedrückt');

// Datennetz allein, erste Stunden: nur Ersatz, nichts fällt aus
await klick('stoerH'); await klick('stoerSw-daten'); await sleep(2200); z = await zustand();
erwarte(z, { daten: 'src', verkehr: 'res', laden: 'res', muell: 'res', klinik: 'res', strom: 'ok', wasser: 'ok' }, 'Datennetz');
check(/Sonst fällt nichts aus/.test(z.status), `Datennetz: Status "${z.status}"`);
await klick('stoerReset');

// Verkehr allein: nur die Müllabfuhr fällt aus
await klick('stoerSw-verkehr'); await sleep(2200); z = await zustand();
erwarte(z, { verkehr: 'src', muell: 'out', strom: 'ok', klinik: 'ok' }, 'Verkehr');
await klick('stoerReset');

// Tastatur: Schalter ist ein Button und per Enter bedienbar
await b.ev(`document.getElementById('stoerSw-wasser').focus()`);
await b.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' });
await b.send('Input.dispatchKeyEvent', { type: 'char', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' });
await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
await sleep(1800); z = await zustand();
erwarte(z, { wasser: 'src', klinik: 'res' }, 'Tastatur Wasser');

// 390 px
await b.open('index.html', 390); await zeige(); await sleep(400);
const hs = await b.ev(`[...document.querySelectorAll('#stoerung button')].map((e) => ({ id: e.id, h: Math.round(e.getBoundingClientRect().height) }))`);
hs.forEach((e) => check(e.h >= 44, `390 px: ${e.id} nur ${e.h} px hoch`));
check(!(await b.ev(`document.documentElement.scrollWidth > innerWidth`)), '390 px: horizontaler Überlauf');
await klick('stoerSw-strom'); await sleep(3000);
await shot('390');

// Reduced Motion: Ergebnis sofort
await b.open('index.html', 1280, { reduce: true }); await zeige(); await sleep(300);
await klick('stoerSw-strom'); await sleep(150); z = await zustand();
erwarte(z, { strom: 'src', muell: 'out', klinik: 'res' }, 'Reduced Motion');
check(/Müllabfuhr/.test(z.status), `Reduced Motion: Status "${z.status}"`);

b.close();
if (fehler.length) { console.error('\nFehler:\n' + fehler.join('\n')); process.exit(1); }
console.log('Alle Szenarien ok.\n\nKeine Fehler.');
