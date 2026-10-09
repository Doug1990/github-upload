// Prüft den Abschnitt "Das Herz liefert, die Gefäße verteilen." (#kreislauf) auf der Zell-Seite.
// Aufruf: node tests/kreislauf.mjs [--chrome=<pfad>]
// Fehler (Exit-Code 1): falsche Zahlen (Ruhe 60 Schläge, volle Anstrengung 180 und Muskeln 180; verengt 72), Engstelle in Ruhe (8 statt 20),
// Tippfläche unter 44 px bei 390 px, Überlauf, Regler ohne label.
import { start } from './chrome.mjs';

const b = await start();
const fehler = [];
for (const w of [1280, 390]) {
  await b.open('zelle.html', w);
  const r = await b.ev(`(() => {
    const $ = (id) => document.getElementById(id); if (!$('kreE')) return null;
    const e = (v) => { $('kreE').value = v; $('kreE').dispatchEvent(new Event('input', { bubbles: true })); };
    const st = () => ({ hz: $('kreHz').textContent, f: $('kreF').textContent, w: [...document.querySelectorAll('#kreRows output')].map((x) => +x.textContent), knapp: document.querySelectorAll('#kreRows i.knapp').length, t: $('kreStatus').textContent });
    const o = { zeilen: $('kreRows').children.length };
    e(0); o.ruhe = st(); e(100); o.voll = st();
    $('kreEng').click(); o.eng = st(); e(0); o.engRuhe = st(); e(100); $('kreEng').click(); o.zurueck = st();
    o.label = !!document.querySelector('label[for=kreE]');
    const r = $('kreEng').getBoundingClientRect(); o.klein = r.height < 44 ? Math.round(r.height) : 0;
    o.ueber = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    return o;
  })()`);
  if (!r) { fehler.push(`@${w}px: #kreE fehlt`); continue; }
  const j = JSON.stringify;
  if (r.zeilen !== 5) fehler.push(`@${w}px ${r.zeilen} Organe statt 5`);
  if (r.ruhe.hz !== '60' || r.ruhe.f !== '1 fach' || j(r.ruhe.w) !== '[20,20,25,20,15]') fehler.push(`@${w}px Ruhe: ${j(r.ruhe)}`);
  if (r.voll.hz !== '180' || r.voll.w[1] !== 180 || r.voll.knapp !== 0) fehler.push(`@${w}px volle Anstrengung: ${j(r.voll)}`);
  if (r.eng.w[1] !== 72 || r.eng.knapp !== 1 || !/72 statt 180/.test(r.eng.t)) fehler.push(`@${w}px verengt bei voller Anstrengung: ${j(r.eng)}`);
  if (r.engRuhe.knapp !== 1 || r.engRuhe.w[1] !== 8 || !/In Ruhe bekommen die Muskeln 8 statt 20/.test(r.engRuhe.t)) fehler.push(`@${w}px verengt in Ruhe: ${j(r.engRuhe)}`);
  if (r.zurueck.w[1] !== 180) fehler.push(`@${w}px zurück zur freien Bahn: ${j(r.zurueck)}`);
  if (!r.label) fehler.push(`@${w}px Regler ohne label`);
  if (w === 390) { if (r.klein) fehler.push(`@390px Engstellen-Knopf nur ${r.klein} px hoch`); if (r.ueber > 0) fehler.push(`@390px horizontaler Überlauf ${r.ueber} px`); }
}
await b.close();
if (fehler.length) { console.log('Fehler (' + fehler.length + '):'); fehler.forEach((f) => console.log('  X ' + f)); process.exit(1); }
console.log('Kreislauf: keine Fehler.');
