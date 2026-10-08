// Prüft den Abschnitt "Das Gerüst ist auch die Straße." (#skelett) auf der Zell-Seite.
// Aufruf: node tests/skelett.mjs [--chrome=<pfad>]
// Fehler (Exit-Code 1): falsche Rechnung (ohne Abbau kommen alle an, bei 100 Prozent keiner), Fracht passiert kein fehlendes Stück,
// Zurücksetzen, Tippflächen unter 44 px bei 390 px, Überlauf, Regler ohne label.
import { start } from './chrome.mjs';

const b = await start();
const fehler = [];
for (const w of [1280, 390]) {
  await b.open('zelle.html', w);
  const r = await b.ev(`(() => {
    const $ = (id) => document.getElementById(id); if (!$('skelAb')) return null;
    const ab = (v) => { $('skelAb').value = v; $('skelAb').dispatchEvent(new Event('input', { bubbles: true })); };
    const st = () => ({ an: $('skelAn').textContent, fehl: $('skelFehl').textContent, schr: +$('skelSchr').textContent, status: $('skelStatus').textContent });
    const o = {};
    $('skelReset').click(); $('skelEnde').click(); o.frei = st();
    $('skelReset').click(); ab(100); $('skelEnde').click(); o.alles = st();
    $('skelReset').click(); ab(50); $('skelEnde').click(); o.halb = st();
    $('skelReset').click(); $('skelSchritt').click(); $('skelSchritt').click(); o.zwei = st();
    ab(30); $('skelEnde').click(); o.nachher = st();
    $('skelReset').click(); o.reset = st(); o.resetAb = $('skelAb').value;
    o.segmente = document.querySelectorAll('#skelSvg .seg').length; o.fracht = document.querySelectorAll('#skelSvg .fracht').length;
    o.label = !!document.querySelector('label[for=skelAb]');
    o.klein = [...document.querySelectorAll('#skelSchritt,#skelEnde,#skelReset')].map((e) => { const r = e.getBoundingClientRect(); return [e.id, Math.round(r.width), Math.round(r.height)]; }).filter((x) => x[1] < 44 || x[2] < 44);
    o.ueber = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    return o;
  })()`);
  if (!r) { fehler.push(`@${w}px: #skelAb fehlt`); continue; }
  if (r.segmente !== 30 || r.fracht !== 5) fehler.push(`@${w}px ${r.segmente} Wegstücke, ${r.fracht} Frachtstücke statt 30 und 5`);
  if (r.frei.an !== '5 von 5' || r.frei.schr !== 6) fehler.push(`@${w}px ohne Abbau: ${r.frei.an} nach ${r.frei.schr} Schritten, erwartet 5 von 5 nach 6`);
  if (r.alles.an !== '0 von 5' || r.alles.fehl !== '30 von 30') fehler.push(`@${w}px Abbau 100: ${r.alles.an}, fehlt ${r.alles.fehl}`);
  const halbAn = parseInt(r.halb.an, 10);
  if (halbAn >= 5 || r.halb.fehl !== '15 von 30') fehler.push(`@${w}px Abbau 50: ${r.halb.an}, fehlt ${r.halb.fehl}`);
  if (parseInt(r.nachher.an, 10) > parseInt(r.frei.an, 10)) fehler.push(`@${w}px Abbau nach zwei Schritten: mehr angekommen als ohne Abbau`);
  if (r.reset.schr !== 0 || r.reset.an !== '0 von 5' || r.resetAb !== '0') fehler.push(`@${w}px Zurücksetzen unvollständig`);
  if (!r.label) fehler.push(`@${w}px Regler ohne label`);
  if (w === 390) { for (const k of r.klein) fehler.push(`@390px Tippfläche unter 44 px: ${JSON.stringify(k)}`); if (r.ueber > 0) fehler.push(`@390px horizontaler Überlauf ${r.ueber} px`); }
}
await b.close();
if (fehler.length) { console.log('Fehler (' + fehler.length + '):'); fehler.forEach((f) => console.log('  X ' + f)); process.exit(1); }
console.log('Zellskelett: keine Fehler.');
