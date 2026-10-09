// Prüft die Erklärung in vier Schritten im Abschnitt #kraftwerk der Zell-Seite.
// Aufruf: node tests/kraftwerk.mjs [--chrome=<pfad>]
// Fehler (Exit-Code 1): Schritte 1 bis 4 setzen data-step am SVG und einen Text, Zurück geht schrittweise zum Start, "Alles zeigen" und der Start entfernen die Hervorhebung,
// die Simulation bleibt unberührt (#power, #o2btn, #tstatus, #sLevel, #sRate, #sTotal vorhanden, Sauerstoff-Knopf funktioniert), Tippflächen unter 44 px, Überlauf.
import { start } from './chrome.mjs';

const b = await start();
const fehler = [];
for (const w of [1280, 390]) {
  await b.open('zelle.html', w);
  const r = await b.ev(`(() => {
    const $ = (id) => document.getElementById(id); if (!$('kwWeit')) return null;
    const svg = $('tsvg'), st = () => ({ d: svg.getAttribute('data-step'), t: $('tstep').textContent, zur: $('kwZur').disabled, frei: $('kwFrei').hidden, w: $('kwWeit').textContent });
    const o = { start: st(), ids: ['power', 'o2btn', 'tstatus', 'sLevel', 'sRate', 'sTotal'].map((i) => !!$(i)) };
    $('kwWeit').click(); o.s1 = st(); $('kwWeit').click(); o.s2 = st(); $('kwWeit').click(); o.s3 = st(); $('kwWeit').click(); o.s4 = st();
    $('kwWeit').click(); o.nochmal = st();
    $('kwZur').click(); o.zurueck = st(); $('kwZur').click(); o.zurueck0 = st();
    $('kwWeit').click(); $('kwWeit').click(); $('kwFrei').click(); o.frei = st();
    const vor = $('o2btn').className; $('o2btn').click(); o.o2 = [vor, $('o2btn').className];
    o.klein = ['kwZur', 'kwWeit', 'kwFrei'].map((i) => { const e = $(i); e.hidden = false; const r = e.getBoundingClientRect(); return [i, Math.round(r.height)]; }).filter((x) => x[1] < 44);
    o.ueber = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    return o;
  })()`);
  if (!r) { fehler.push(`@${w}px: #kwWeit fehlt`); continue; }
  const j = JSON.stringify;
  if (r.start.d !== null || r.start.t !== '' || r.start.frei !== true) fehler.push(`@${w}px Start: ${j(r.start)}`);
  if (r.ids.some((x) => !x)) fehler.push(`@${w}px Simulation: IDs fehlen ${j(r.ids)}`);
  [r.s1, r.s2, r.s3, r.s4].forEach((x, i) => { if (x.d !== String(i + 1) || !x.t.startsWith(`Schritt ${i + 1} von 4:`) || x.frei) fehler.push(`@${w}px Schritt ${i + 1}: ${j(x)}`); });
  if (r.s4.w !== 'Noch einmal von vorn' || r.nochmal.d !== '1') fehler.push(`@${w}px Schritt 4 und danach: ${j(r.s4)} ${j(r.nochmal)}`);
  if (r.zurueck.d !== null || r.zurueck0.d !== null) fehler.push(`@${w}px Zurück: ${j(r.zurueck)} ${j(r.zurueck0)}`);
  if (r.frei.d !== null || r.frei.t !== '') fehler.push(`@${w}px Alles zeigen: ${j(r.frei)}`);
  if (r.o2[0] === r.o2[1]) fehler.push(`@${w}px Sauerstoff-Knopf ändert nichts: ${j(r.o2)}`);
  if (w === 390) { for (const k of r.klein) fehler.push(`@390px Tippfläche unter 44 px: ${j(k)}`); if (r.ueber > 0) fehler.push(`@390px horizontaler Überlauf ${r.ueber} px`); }
}
await b.close();
if (fehler.length) { console.log('Fehler (' + fehler.length + '):'); fehler.forEach((f) => console.log('  X ' + f)); process.exit(1); }
console.log('Kraftwerk: keine Fehler.');
