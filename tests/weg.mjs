// Prüft den Abschnitt "Kurze Wege treibt die Natur, lange der Motor." (#weg) auf der Zell-Seite.
// Aufruf: node tests/weg.mjs [--chrome=<pfad>]
// Fehler (Exit-Code 1): falsche Zeiten (10 µm: Diffusion 0,5 s, Motor 10 s; 1 mm: 1 h und 17 min), falscher Sieger (kurz Diffusion, lang Motor),
// Regler ohne label, Überlauf bei 390 px.
import { start } from './chrome.mjs';

const b = await start();
const fehler = [];
for (const w of [1280, 390]) {
  await b.open('zelle.html', w);
  const r = await b.ev(`(() => {
    const $ = (id) => document.getElementById(id); if (!$('wegS')) return null;
    const s = (v) => { $('wegS').value = v; $('wegS').dispatchEvent(new Event('input', { bubbles: true })); };
    const st = () => ({ d: $('wegDO').textContent, m: $('wegMO').textContent, t: $('wegStatus').textContent, dSchnell: $('wegD').closest('.weg-row').classList.contains('schnell') });
    const o = {};
    for (const i of [0, 1, 2, 3, 4, 5]) { s(i); o['s' + i] = st(); }
    o.label = !!document.querySelector('label[for=wegS]');
    o.ueber = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    return o;
  })()`);
  if (!r) { fehler.push(`@${w}px: #wegS fehlt`); continue; }
  const j = JSON.stringify;
  if (r.s1.d !== '0,5 s' || r.s1.m !== '10 s') fehler.push(`@${w}px 10 µm: ${j(r.s1)}`);
  if (r.s3.d !== '1 h' || r.s3.m !== '17 min') fehler.push(`@${w}px 1 mm: ${j(r.s3)}`);
  if (!r.s0.dSchnell || !r.s1.dSchnell) fehler.push(`@${w}px kurze Strecken: Diffusion sollte schneller sein`);
  if (r.s3.dSchnell || r.s4.dSchnell || r.s5.dSchnell) fehler.push(`@${w}px lange Strecken: Motor sollte schneller sein`);
  if (!/Motor lohnt sich noch nicht/.test(r.s0.t) || !/Motor schneller/.test(r.s5.t)) fehler.push(`@${w}px Statustexte passen nicht`);
  if (!/Jahre/.test(r.s5.d)) fehler.push(`@${w}px 1 m: Diffusion ${r.s5.d}, erwartet Jahre`);
  if (!r.label) fehler.push(`@${w}px Regler ohne label`);
  if (w === 390 && r.ueber > 0) fehler.push(`@390px horizontaler Überlauf ${r.ueber} px`);
}
await b.close();
if (fehler.length) { console.log('Fehler (' + fehler.length + '):'); fehler.forEach((f) => console.log('  X ' + f)); process.exit(1); }
console.log('Weg: keine Fehler.');
