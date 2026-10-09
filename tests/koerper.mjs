// Prüft den Abschnitt "Der Körper ist ein Netz aus Netzen." (#koerper) auf der Zell-Seite.
// Aufruf: node tests/koerper.mjs [--chrome=<pfad>]
// Fehler (Exit-Code 1): drei Knöpfe, Netze lassen sich einzeln und zusammen einblenden, Karten mit Düsseldorf-Bezug, Status, Tippflächen und Überlauf bei 390 px.
import { start } from './chrome.mjs';

const b = await start();
const fehler = [];
for (const w of [1280, 390]) {
  await b.open('zelle.html', w);
  const r = await b.ev(`(() => {
    const $ = (id) => document.getElementById(id); if (!$('korSeg')) return null;
    const btn = [...document.querySelectorAll('#korSeg button')];
    const an = () => document.querySelectorAll('.kor-netz.an').length;
    const o = { tasten: btn.length, start: an(), karten0: $('korKarten').children.length };
    btn[0].click(); o.eins = an(); o.k1 = $('korKarten').textContent; o.st1 = $('korStatus').textContent;
    btn[1].click(); btn[2].click(); o.drei = an(); o.k3 = $('korKarten').children.length; o.st3 = $('korStatus').textContent;
    btn[0].click(); o.zwei = an(); btn[1].click(); btn[2].click(); o.null = an();
    o.pressed = btn.map((e) => e.getAttribute('aria-pressed'));
    o.klein = btn.map((e) => { const r = e.getBoundingClientRect(); return [e.textContent, Math.round(r.width), Math.round(r.height)]; }).filter((x) => x[1] < 44 || x[2] < 44);
    o.ueber = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    return o;
  })()`);
  if (!r) { fehler.push(`@${w}px: #korSeg fehlt`); continue; }
  const j = JSON.stringify;
  if (r.tasten !== 3 || r.start !== 0 || r.karten0 !== 0) fehler.push(`@${w}px Start: ${r.tasten} Knöpfe, ${r.start} Netze, ${r.karten0} Karten`);
  if (r.eins !== 1 || !/In Düsseldorf/.test(r.k1) || !/Blutkreislauf/.test(r.k1)) fehler.push(`@${w}px Blutkreislauf: ${r.eins} Netze, Karte ${r.k1.slice(0, 50)}`);
  if (!/Ein Netz ist eingeblendet/.test(r.st1)) fehler.push(`@${w}px Status bei einem Netz: ${r.st1}`);
  if (r.drei !== 3 || r.k3 !== 3 || !/3 Netze/.test(r.st3)) fehler.push(`@${w}px drei Netze: ${r.drei}, ${r.k3} Karten, ${r.st3}`);
  if (r.zwei !== 2 || r.null !== 0 || r.pressed.some((x) => x !== 'false')) fehler.push(`@${w}px Ausblenden: zwei ${r.zwei}, null ${r.null}, ${j(r.pressed)}`);
  if (w === 390) { for (const k of r.klein) fehler.push(`@390px Tippfläche unter 44 px: ${j(k)}`); if (r.ueber > 0) fehler.push(`@390px horizontaler Überlauf ${r.ueber} px`); }
}
await b.close();
if (fehler.length) { console.log('Fehler (' + fehler.length + '):'); fehler.forEach((f) => console.log('  X ' + f)); process.exit(1); }
console.log('Körper: keine Fehler.');
