// Prüft "Wer hält es instand" auf der Startseite: Start, drei Strategien über die Jahre, Zeitraffer,
// Tastatur am Regler, 390 px, Reduced Motion (kein Zeitraffer-Knopf).
// Aufruf: node tests/instand.mjs [--screens=<ordner>] [--chrome=<pfad>]
import fs from 'node:fs';
import { start, arg, sleep } from './chrome.mjs';

const SCREENS = arg('screens');
if (SCREENS) fs.mkdirSync(SCREENS, { recursive: true });
const b = await start();
const fehler = [];
const check = (ok, msg) => { if (!ok) fehler.push(msg); };
const klick = (id) => b.ev(`document.getElementById('${id}').click()`);
const jahr = (y) => b.ev(`(() => { const e = document.getElementById('instJahr'); e.value = ${y}; e.dispatchEvent(new Event('input')); })()`);
const neu = () => b.ev(`[...document.querySelectorAll('#instNets .inst-net')].map((n) => n.querySelectorAll('.inst-cell[data-s="neu"]').length)`);
const werte = async () => { const [y, def, alt, aus, ern] = (await b.ev(`document.getElementById('instPanel').getAttribute('data-inst')`)).split('|').map(Number); return { y, def, alt, aus, ern }; };
const zeige = () => b.ev(`(() => { document.documentElement.style.scrollBehavior = 'auto'; document.getElementById('instand').scrollIntoView({ block: 'start' }); })()`);
const shot = async (name) => {
  if (!SCREENS) return;
  const s = await b.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`${SCREENS}/instand-${name}.png`, Buffer.from(s.data, 'base64'));
};

await b.open('index.html', 1280); await zeige(); await sleep(300);
check(await b.ev(`document.querySelectorAll('#instNets .inst-cell').length`) === 60, 'Start: nicht 60 Kästchen');
check(await b.ev(`document.getElementById('instA').getAttribute('aria-pressed')`) === 'true', 'Start: "Laufend erneuern" nicht gewählt');
let w = await werte();
check(w.y === 0 && w.def === 0 && w.aus === 0, `Start: ${JSON.stringify(w)}`);
check((await b.ev(`document.getElementById('instStatus').textContent`)).includes('Heute'), 'Start: Status fehlt');

// A: laufend erneuern, nie etwas überfällig, keine Ausfälle
await klick('instA');
for (const y of [10, 20, 30, 40]) { await jahr(y); w = await werte(); check(w.def === 0, `Laufend, Jahr ${y}: ${w.def} überfällig`); }
check(w.aus === 0, `Laufend, Jahr 40: ${w.aus} Ausfälle, erwartet 0`);
check(w.ern >= 50, `Laufend, Jahr 40: nur ${w.ern} Erneuerungen`);
const aErn = w.ern;
await shot('laufend-40-1280');

// B: aufschieben, Rückstau in der Mitte, viele Ausfälle
await klick('instB'); await jahr(10); w = await werte();
check(w.def >= 8, `Aufschieben, Jahr 10: ${w.def} überfällig, erwartet mindestens 8`);
check((await b.ev(`document.querySelectorAll('#instNets .inst-cell[data-s="def"]').length`)) === w.def, 'Aufschieben: überfällige Kästchen passen nicht zur Zahl');
check((await b.ev(`document.getElementById('instStatus').textContent`)).includes('überfällig'), 'Aufschieben: Status nennt keine überfälligen Abschnitte');
await shot('aufschieben-10-1280');
await jahr(40); w = await werte();
check(w.aus >= 30, `Aufschieben, Jahr 40: ${w.aus} Ausfälle, erwartet mindestens 30`);

// B nach Jahr 20: erneuerte Abschnitte (Rohre 3, Gleise 6, Kabel 5) mit Kennzeichnung und Zählung
await jahr(20);
check((await neu()).join() === '3,6,5', 'Aufschieben, Jahr 20: erneuert ' + (await neu()).join() + ', erwartet 3,6,5');
check((await b.ev(`getComputedStyle(document.querySelector('#instNets .inst-cell[data-s="neu"]'), '::after').content`)).includes('↻'), 'Erneuerte Kästchen ohne Kreispfeil');
check((await b.ev(`document.querySelector('#instN-rohre .inst-count').textContent`)).includes('erneuert 3'), 'Zählung "erneuert 3" fehlt bei den Rohren');
check((await b.ev(`document.querySelector('#instN-rohre .inst-count').textContent`)).endsWith('zusammen 20'), 'Zählung nennt die Summe nicht');
await klick('instA'); await jahr(20);
const na = await neu(); check(na.every((n, i) => n > [3, 6, 5][i]), 'Laufend, Jahr 20: mehr erneuert als beim Aufschieben erwartet, ist ' + na.join());
await klick('instC'); await jahr(20);
const nc = await neu(); check(nc.every((n) => n >= 0) && nc.join() !== '0,0,0', 'Bei Schaden, Jahr 20: erneuert ' + nc.join());
await klick('instB');
check(await b.ev(`document.querySelectorAll('.inst-legend-bild span').length`) === 5 && (await b.ev(`document.querySelector('.inst-legend-bild').textContent`)).includes('erneuert, wieder neu'), 'Legende unter dem Bild unvollständig');
check((await b.ev(`document.querySelector('.inst-lese').textContent`)).startsWith('Links die jüngsten'), 'Erklärzeile über den Netzen fehlt');
check(!(await b.ev(`document.querySelector('.inst-bild').textContent`)).includes('Lücke') && (await b.ev(`document.querySelector('.inst-bild').textContent`)).includes('altert im Zeitraffer'), 'Bild: Beschriftung altert im Zeitraffer fehlt');
await jahr(10);
// C: erst bei Schaden, nie überfällig am Jahresende, aber die meisten Ausfälle
await klick('instC'); await jahr(20); w = await werte();
check(w.def === 0, `Bei Schaden, Jahr 20: ${w.def} überfällig`);
await jahr(40); w = await werte();
check(w.aus >= 40, `Bei Schaden, Jahr 40: ${w.aus} Ausfälle, erwartet mindestens 40`);
check(w.aus > 0 && aErn > 0, 'Vergleich: Werte fehlen');

// Tastatur am Regler: Pfeil nach links ändert das Jahr
await b.ev(`document.getElementById('instJahr').focus()`);
await b.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 });
await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowLeft', code: 'ArrowLeft', windowsVirtualKeyCode: 37 });
await sleep(200); w = await werte();
check(w.y === 39, `Tastatur: Jahr ${w.y}, erwartet 39`);

// Zeitraffer läuft und hält an
await klick('instA'); await jahr(0);
await klick('instPlay'); await sleep(1700);
w = await werte();
check(w.y >= 3 && w.y <= 8, `Zeitraffer: Jahr ${w.y} nach 1,7 s, erwartet 3 bis 8`);
await klick('instPlay'); const y1 = (await werte()).y; await sleep(900);
check((await werte()).y === y1, 'Zeitraffer: hält nach "Anhalten" nicht an');

// 390 px
await b.open('index.html', 390); await zeige(); await sleep(300);
const hs = await b.ev(`[...document.querySelectorAll('#instand button, #instand input')].map((e) => ({ id: e.id, h: Math.round(e.getBoundingClientRect().height) }))`);
hs.forEach((e) => check(e.h >= 44, `390 px: ${e.id} nur ${e.h} px hoch`));
check(!(await b.ev(`document.documentElement.scrollWidth > innerWidth`)), '390 px: horizontaler Überlauf');
const cw = await b.ev(`Math.round(document.querySelector('#instNets .inst-cell').getBoundingClientRect().width)`);
check(cw >= 8, `390 px: Kästchen nur ${cw} px breit`);
await klick('instB'); await jahr(10); await sleep(300);
await shot('390');

// Reduced Motion: kein Zeitraffer-Knopf
await b.open('index.html', 1280, { reduce: true });
check(await b.ev(`document.getElementById('instPlay').hidden`), 'Reduced Motion: Zeitraffer-Knopf sollte versteckt sein');

b.close();
if (fehler.length) { console.error('\nFehler:\n' + fehler.join('\n')); process.exit(1); }
console.log('Alle Fälle ok.\n\nKeine Fehler.');
