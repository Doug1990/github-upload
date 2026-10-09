// Prüft den Abschnitt "Nachbarn halten sich über Wasser." (#verbund) auf der Zell-Seite.
// Aufruf: node tests/verbund.mjs [--chrome=<pfad>]
// Fehler (Exit-Code 1): falsche Versorgung (alles verbunden: 12 mit Versorgung, mittleres Viertel getrennt: 4 ohne, linkes getrennt: 1 ohne),
// Tippflächen unter 44 px bei 390 px, Überlauf.
import { start } from './chrome.mjs';

const b = await start();
const fehler = [];
for (const w of [1280, 390]) {
  await b.open('zelle.html', w);
  const r = await b.ev(`(() => {
    const $ = (id) => document.getElementById(id); if (!$('verbGrid')) return null;
    const btn = [...document.querySelectorAll('#verbSeg button')];
    const st = () => ({ ohne: +$('verbNull').textContent, gut: $('verbGut').textContent, knapp: +$('verbKnapp').textContent });
    const o = { zellen: $('verbGrid').children.length, tasten: btn.length };
    o.start = st();
    btn[1].click(); o.mitte = st(); btn[1].click();
    btn[0].click(); o.links = st(); btn[0].click();
    btn[2].click(); o.rechts = st(); btn[2].click();
    btn.forEach((x) => x.click()); o.alle = st(); btn.forEach((x) => x.click()); o.zurueck = st();
    o.klein = btn.map((e) => { const r = e.getBoundingClientRect(); return [e.textContent, Math.round(r.width), Math.round(r.height)]; }).filter((x) => x[1] < 44 || x[2] < 44);
    o.ueber = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    return o;
  })()`);
  if (!r) { fehler.push(`@${w}px: #verbGrid fehlt`); continue; }
  if (r.zellen !== 12 || r.tasten !== 3) fehler.push(`@${w}px ${r.zellen} Zellen, ${r.tasten} Knöpfe statt 12 und 3`);
  if (r.start.ohne !== 0) fehler.push(`@${w}px alles verbunden: ${r.start.ohne} ohne Versorgung`);
  if (r.mitte.ohne !== 4) fehler.push(`@${w}px mittleres Viertel getrennt: ${r.mitte.ohne} ohne Versorgung statt 4`);
  if (r.links.ohne !== 1) fehler.push(`@${w}px linkes Viertel getrennt: ${r.links.ohne} ohne Versorgung statt 1`);
  if (r.rechts.ohne !== 1) fehler.push(`@${w}px rechtes Viertel getrennt: ${r.rechts.ohne} ohne Versorgung statt 1`);
  if (r.alle.ohne !== 4) fehler.push(`@${w}px alle getrennt: ${r.alle.ohne} ohne Versorgung statt 4`);
  if (JSON.stringify(r.zurueck) !== JSON.stringify(r.start)) fehler.push(`@${w}px zurück zum Start weicht ab`);
  if (w === 390) { for (const k of r.klein) fehler.push(`@390px Tippfläche unter 44 px: ${JSON.stringify(k)}`); if (r.ueber > 0) fehler.push(`@390px horizontaler Überlauf ${r.ueber} px`); }
}
await b.close();
if (fehler.length) { console.log('Fehler (' + fehler.length + '):'); fehler.forEach((f) => console.log('  X ' + f)); process.exit(1); }
console.log('Zellen im Verbund: keine Fehler.');
