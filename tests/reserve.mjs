// Prüft den Abschnitt "Ein Lager macht Ausfälle erträglich." (#reserve) auf der Zell-Seite.
// Aufruf: node tests/reserve.mjs [--chrome=<pfad>]
// Fehler (Exit-Code 1): falsche Rechnung (Muskelzelle 6 plus 30 Stunden, Nervenzelle 0,5 Stunden, Glykogen zuerst), Zurücksetzen der Anzeige,
// Tippflächen unter 44 px bei 390 px, Überlauf, Regler ohne label.
import { start } from './chrome.mjs';

const b = await start();
const fehler = [];
for (const w of [1280, 390]) {
  await b.open('zelle.html', w);
  const r = await b.ev(`(() => {
    const $ = (id) => document.getElementById(id); if (!$('resH')) return null;
    const h = (v) => { $('resH').value = v; $('resH').dispatchEvent(new Event('input', { bubbles: true })); };
    const st = () => ({ g: $('resGlykO').textContent, f: $('resFettO').textContent, ges: $('resGes').textContent, rest: $('resRest').textContent, t: $('resStatus').textContent });
    const seg = [...document.querySelectorAll('#resSeg button')];
    const o = { n: seg.length };
    seg[0].click(); h(0); o.m0 = st(); h(6); o.m6 = st(); h(21); o.m21 = st(); h(120); o.m120 = st();
    seg[1].click(); h(0); o.n0 = st(); h(1); o.n1 = st();
    seg[2].click(); h(120); o.f120 = st();
    o.klein = seg.map((e) => { const r = e.getBoundingClientRect(); return [e.textContent, Math.round(r.width), Math.round(r.height)]; }).filter((x) => x[1] < 44 || x[2] < 44);
    o.label = !!document.querySelector('label[for=resH]');
    o.ueber = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    return o;
  })()`);
  if (!r) { fehler.push(`@${w}px: #resH fehlt`); continue; }
  if (r.n !== 3) fehler.push(`@${w}px ${r.n} Zelltypen statt 3`);
  if (r.m0.ges !== '36 h' || r.m0.g !== '100 %' || r.m0.f !== '100 %') fehler.push(`@${w}px Muskelzelle bei 0 h: ${JSON.stringify(r.m0)}`);
  if (r.m6.g !== '0 %' || r.m6.f !== '100 %') fehler.push(`@${w}px Muskelzelle nach 6 h: Glykogen ${r.m6.g}, Fett ${r.m6.f}, erwartet 0 und 100`);
  if (r.m21.g !== '0 %' || r.m21.f !== '50 %' || r.m21.rest !== '15 h') fehler.push(`@${w}px Muskelzelle nach 21 h: Fett ${r.m21.f}, übrig ${r.m21.rest}, erwartet 50 und 15 h`);
  if (r.m120.rest !== '0 h' || !/aufgebraucht/.test(r.m120.t)) fehler.push(`@${w}px Muskelzelle nach 120 h: ${r.m120.rest}, Text: ${r.m120.t}`);
  if (r.n0.ges !== '0,5 h') fehler.push(`@${w}px Nervenzelle gesamt ${r.n0.ges} statt 0,5 h`);
  if (r.n1.rest !== '0 h') fehler.push(`@${w}px Nervenzelle nach 1 h: übrig ${r.n1.rest}`);
  if (r.f120.f !== '0 %' && r.f120.rest !== '0 h') { /* Fettzelle hat 102 h, nach 120 h leer */ fehler.push(`@${w}px Fettzelle nach 120 h nicht leer: ${JSON.stringify(r.f120)}`); }
  if (!r.label) fehler.push(`@${w}px Regler ohne label`);
  if (w === 390) { for (const k of r.klein) fehler.push(`@390px Tippfläche unter 44 px: ${JSON.stringify(k)}`); if (r.ueber > 0) fehler.push(`@390px horizontaler Überlauf ${r.ueber} px`); }
}
await b.close();
if (fehler.length) { console.log('Fehler (' + fehler.length + '):'); fehler.forEach((f) => console.log('  X ' + f)); process.exit(1); }
console.log('Reserven: keine Fehler.');
