// Prüft die Ortsangabe "Du bist hier" in der Zell-Ansicht (#stadt): vor dem Zoomen, beim Hineinzoomen, nach dem Zurück, Zähler der angesehenen Bestandteile.
// Aufruf: node tests/zoomort.mjs [--chrome=<pfad>]
// Fehler (Exit-Code 1): Text passt nicht zum Zustand, Zähler zählt falsch, Zelle/Stadt-Schalter ändert den Namen im Ort nicht, Escape bringt nicht zurück.
import { start } from './chrome.mjs';

const b = await start();
const fehler = [];
for (const w of [1280, 390]) {
  await b.open('zelle.html', w);
  const r = await b.ev(`(() => {
    const $ = (id) => document.getElementById(id); if (!$('zoomOrt')) return null;
    const teile = [...document.querySelectorAll('#csvg .part')];
    const o = { start: $('zoomOrt').textContent, anzahl: teile.length };
    const klick = (e) => e.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    klick(teile.find((e) => e.getAttribute('data-part') === 'golgi')); o.golgi = $('zoomOrt').textContent; o.zurueckSichtbar = !$('zoomBack').hidden;
    $('viewCity').click(); o.stadt = $('zoomOrt').textContent; $('viewBio').click();
    $('zoomBack').click(); o.nachZurueck = $('zoomOrt').textContent;
    klick(teile.find((e) => e.getAttribute('data-part') === 'kern')); klick(teile.find((e) => e.getAttribute('data-part') === 'kern')); o.kern = $('zoomOrt').textContent;
    klick(teile.find((e) => e.getAttribute('data-part') === 'lyso')); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); o.escape = $('zoomOrt').textContent;
    return o;
  })()`);
  if (!r) { fehler.push(`@${w}px: #zoomOrt fehlt`); continue; }
  const j = JSON.stringify;
  if (!/^Du bist hier: Ganze Zelle\. Angesehen: 0 von 6 Bestandteilen\.$/.test(r.start)) fehler.push(`@${w}px Start: ${r.start}`);
  if (!/Ganze Zelle › Golgi-Apparat/.test(r.golgi) || !r.zurueckSichtbar) fehler.push(`@${w}px Golgi: ${r.golgi}`);
  if (!/Ganze Zelle › Paketzentrum/.test(r.stadt)) fehler.push(`@${w}px Stadtansicht: ${r.stadt}`);
  if (!/Angesehen: 1 von 6/.test(r.nachZurueck)) fehler.push(`@${w}px nach Zurück: ${r.nachZurueck}`);
  if (!/Angesehen: 2 von 6/.test(r.kern)) fehler.push(`@${w}px Kern (an, aus): ${r.kern}`);
  if (!/Angesehen: 3 von 6/.test(r.escape)) fehler.push(`@${w}px Escape: ${r.escape}`);
  if (r.anzahl < 6) fehler.push(`@${w}px nur ${r.anzahl} Bestandteile`);
}
await b.close();
if (fehler.length) { console.log('Fehler (' + fehler.length + '):'); fehler.forEach((f) => console.log('  X ' + f)); process.exit(1); }
console.log('Zoom-Ort: keine Fehler.');
