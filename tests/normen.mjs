// Prüft den Abschnitt "Alles hängt an Standards" (#normen) auf abschluss.html.
// Aufruf: node tests/normen.mjs [--chrome=<pfad>]
// Fehler (Exit-Code 1): drei Paare, Start mit keinem passenden Paar, Wechseln der Variante, "Norm einführen" lässt alle passen, "Wieder mischen",
// Tippflächen unter 44 px bei 390 px, Überlauf.
import { start } from './chrome.mjs';

const b = await start();
const fehler = [];
for (const w of [1280, 390]) {
  await b.open('abschluss.html', w);
  const r = await b.ev(`(() => {
    const $ = (id) => document.getElementById(id); if (!$('nm')) return null;
    const z = [...document.querySelectorAll('.nm-zeile')];
    const st = () => ({ passt: z.filter((e) => e.classList.contains('passt')).length, t: $('nmStand').textContent, l0: z[0].querySelectorAll('.nm-b')[0].textContent, r0: z[0].querySelectorAll('.nm-b')[1].textContent });
    const o = { zeilen: z.length, start: st() };
    z[0].querySelectorAll('.nm-b')[1].click(); z[0].querySelectorAll('.nm-b')[1].click(); o.eins = st();
    $('nmNorm').click(); o.norm = st();
    $('nmMisch').click(); o.misch = st();
    o.klein = [...document.querySelectorAll('.nm-b')].map((e) => { const r = e.getBoundingClientRect(); return [e.textContent.slice(0, 18), Math.round(r.width), Math.round(r.height)]; }).filter((x) => x[2] < 44);
    o.ueber = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    return o;
  })()`);
  if (!r) { fehler.push(`@${w}px: #nm fehlt`); continue; }
  const j = JSON.stringify;
  if (r.zeilen !== 3) fehler.push(`@${w}px ${r.zeilen} Paare statt 3`);
  if (r.start.passt !== 0 || !/0 von 3 Paaren passen/.test(r.start.t)) fehler.push(`@${w}px Start: ${j(r.start)}`);
  if (r.eins.passt !== 1 || r.eins.r0 !== r.eins.l0) fehler.push(`@${w}px nach zwei Klicks: ${j(r.eins)}`);
  if (r.norm.passt !== 3 || !/gemeinsamen Norm/.test(r.norm.t)) fehler.push(`@${w}px Norm: ${j(r.norm)}`);
  if (r.misch.passt !== 0) fehler.push(`@${w}px nach dem Mischen: ${j(r.misch)}`);
  if (w === 390) { for (const k of r.klein) fehler.push(`@390px Tippfläche unter 44 px: ${j(k)}`); if (r.ueber > 0) fehler.push(`@390px horizontaler Überlauf ${r.ueber} px`); }
}
await b.close();
if (fehler.length) { console.log('Fehler (' + fehler.length + '):'); fehler.forEach((f) => console.log('  X ' + f)); process.exit(1); }
console.log('Normen: keine Fehler.');
