// Prüft den Abschnitt "Was nimmst du mit?" (#rueckblick) auf der Zell-Seite.
// Aufruf: node tests/rueckblick.mjs [--chrome=<pfad>]
// Fehler (Exit-Code 1): nicht sechs Aussagen mit je drei Knöpfen, falsche Rückmeldung (passende Zuordnung, abweichende Zuordnung), Schlusstext,
// Speichern (localStorage bleibt unverändert), Tippflächen unter 44 px bei 390 px, Überlauf.
import { start } from './chrome.mjs';

const b = await start();
const fehler = [];
for (const w of [1280, 390]) {
  await b.open('zelle.html', w);
  const r = await b.ev(`(() => {
    const $ = (id) => document.getElementById(id); if (!$('rbListe')) return null;
    const items = [...$('rbListe').children]; const o = { n: items.length, knoepfe: items.map((i) => i.querySelectorAll('button').length) };
    const vorher = Object.keys(localStorage).length;
    items[0].querySelector('button[data-k=beide]').click(); o.a0 = $('rba0').textContent;
    items[1].querySelector('button[data-k=zelle]').click(); o.a1 = $('rba1').textContent;
    o.st1 = $('rbStatus').textContent;
    for (let i = 2; i < 6; i++) items[i].querySelector('button[data-k=beide]').click();
    o.st6 = $('rbStatus').textContent;
    o.gedrueckt = items[0].querySelector('button[data-k=beide]').getAttribute('aria-pressed');
    o.gespeichert = Object.keys(localStorage).length - vorher;
    o.klein = [...$('rbListe').querySelectorAll('button')].map((e) => { const r = e.getBoundingClientRect(); return [e.textContent, Math.round(r.width), Math.round(r.height)]; }).filter((x) => x[1] < 44 || x[2] < 44);
    o.ueber = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    return o;
  })()`);
  if (!r) { fehler.push(`@${w}px: #rbListe fehlt`); continue; }
  if (r.n !== 6 || r.knoepfe.some((k) => k !== 3)) fehler.push(`@${w}px ${r.n} Aussagen, Knöpfe je Aussage ${r.knoepfe}`);
  if (!/^Gleiche Zuordnung/.test(r.a0)) fehler.push(`@${w}px Aussage 1 mit passender Zuordnung: ${r.a0.slice(0, 40)}`);
  if (!/^Hier steht eine andere/.test(r.a1)) fehler.push(`@${w}px Aussage 2 mit abweichender Zuordnung: ${r.a1.slice(0, 40)}`);
  if (!/2 von 6 beantwortet/.test(r.st1)) fehler.push(`@${w}px Status nach zwei Antworten: ${r.st1}`);
  if (!/von 6 hast du dieselbe Zuordnung/.test(r.st6)) fehler.push(`@${w}px Schlusstext: ${r.st6}`);
  if (r.gedrueckt !== 'true') fehler.push(`@${w}px Knopf nicht als gewählt markiert`);
  if (r.gespeichert !== 0) fehler.push(`@${w}px es wurde gespeichert (${r.gespeichert} Einträge)`);
  if (w === 390) { for (const k of r.klein) fehler.push(`@390px Tippfläche unter 44 px: ${JSON.stringify(k)}`); if (r.ueber > 0) fehler.push(`@390px horizontaler Überlauf ${r.ueber} px`); }
}
await b.close();
if (fehler.length) { console.log('Fehler (' + fehler.length + '):'); fehler.forEach((f) => console.log('  X ' + f)); process.exit(1); }
console.log('Rückblick: keine Fehler.');
