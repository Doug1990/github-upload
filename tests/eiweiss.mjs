// Prüft den Abschnitt "Gebaut ist noch nicht geliefert." (#eiweiss) auf der Zell-Seite.
// Aufruf: node tests/eiweiss.mjs [--chrome=<pfad>]
// Fehler (Exit-Code 1): falsche Zahlen (normal 18 von 20 brauchbar, Faltung gestört 12, Kontrolle gestört 2 defekt, Versand gestört 0 und Stau),
// Tippflächen unter 44 px bei 390 px, Überlauf.
import { start } from './chrome.mjs';

const b = await start();
const fehler = [];
for (const w of [1280, 390]) {
  await b.open('zelle.html', w);
  const r = await b.ev(`(() => {
    const $ = (id) => document.getElementById(id); if (!$('eiwSeg')) return null;
    const btn = [...document.querySelectorAll('#eiwSeg button')];
    const st = () => ({ gut: $('eiwGut').textContent, def: +$('eiwDef').textContent, abb: +$('eiwAbb').textContent, stau: +$('eiwStau').textContent });
    const o = { tasten: btn.length, start: st() };
    btn[0].click(); o.falten = st(); btn[1].click(); o.beide = st(); btn[0].click(); o.pruefen = st(); btn[1].click();
    btn[2].click(); o.versand = st(); btn[2].click(); o.zurueck = st();
    o.klein = btn.map((e) => { const r = e.getBoundingClientRect(); return [e.textContent, Math.round(r.width), Math.round(r.height)]; }).filter((x) => x[1] < 44 || x[2] < 44);
    o.ueber = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    return o;
  })()`);
  if (!r) { fehler.push(`@${w}px: #eiwSeg fehlt`); continue; }
  const j = JSON.stringify;
  if (r.tasten !== 3) fehler.push(`@${w}px ${r.tasten} Knöpfe statt 3`);
  if (r.start.gut !== '18 von 20' || r.start.def !== 0 || r.start.abb !== 2 || r.start.stau !== 0) fehler.push(`@${w}px normal: ${j(r.start)}`);
  if (r.falten.gut !== '12 von 20' || r.falten.abb !== 8) fehler.push(`@${w}px Faltung gestört: ${j(r.falten)}`);
  if (r.beide.gut !== '12 von 20' || r.beide.def !== 8 || r.beide.abb !== 0) fehler.push(`@${w}px Faltung und Kontrolle gestört: ${j(r.beide)}`);
  if (r.pruefen.gut !== '18 von 20' || r.pruefen.def !== 2) fehler.push(`@${w}px Kontrolle gestört: ${j(r.pruefen)}`);
  if (r.versand.gut !== '0 von 20' || r.versand.stau !== 18) fehler.push(`@${w}px Versand gestört: ${j(r.versand)}`);
  if (j(r.zurueck) !== j(r.start)) fehler.push(`@${w}px zurück zum Start weicht ab`);
  if (w === 390) { for (const k of r.klein) fehler.push(`@390px Tippfläche unter 44 px: ${j(k)}`); if (r.ueber > 0) fehler.push(`@390px horizontaler Überlauf ${r.ueber} px`); }
}
await b.close();
if (fehler.length) { console.log('Fehler (' + fehler.length + '):'); fehler.forEach((f) => console.log('  X ' + f)); process.exit(1); }
console.log('Eiweiß: keine Fehler.');
