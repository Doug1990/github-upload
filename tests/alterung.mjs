// Prüft den Zusatzfall "Alterung und Reparatur" (#alt) im Ausfall-Abschnitt der Zell-Seite.
// Aufruf: node tests/alterung.mjs [--chrome=<pfad>]
// Fehler (Exit-Code 1): Reparatur nicht besser als ohne, Werte steigen nicht mit dem Alter, Überlauf bei 390 px, Regler ohne label.
import { start } from './chrome.mjs';

const b = await start();
const fehler = [];
for (const w of [1280, 390]) {
  await b.open('zelle.html', w);
  const r = await b.ev(`(() => {
    const a = document.getElementById('altAge'); if (!a) return null;
    const setze = (v) => { a.value = v; a.dispatchEvent(new Event('input', { bubbles: true })); };
    const z = () => ({ ohne: +document.getElementById('altOhneO').textContent, mit: +document.getElementById('altMitO').textContent, st: document.getElementById('altStatus').textContent });
    const out = {};
    setze(0); out.n0 = z(); setze(20); out.n20 = z(); setze(50); out.n50 = z(); setze(80); out.n80 = z();
    out.label = !!document.querySelector('label[for=altAge]');
    out.ueber = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    return out;
  })()`);
  if (!r) { fehler.push(`@${w}px: #altAge fehlt`); continue; }
  if (r.n0.ohne !== 0 || r.n0.mit !== 0) fehler.push(`@${w}px Alter 0: ${r.n0.ohne} und ${r.n0.mit} statt 0`);
  const reihe = [r.n20, r.n50, r.n80];
  reihe.forEach((x, i) => { if (x.mit >= x.ohne) fehler.push(`@${w}px Stufe ${i + 1}: mit Reparatur (${x.mit}) nicht kleiner als ohne (${x.ohne})`); });
  if (!(r.n20.mit < r.n50.mit && r.n50.mit < r.n80.mit)) fehler.push(`@${w}px Schäden mit Reparatur steigen nicht mit dem Alter`);
  if (r.n80.ohne !== 100) fehler.push(`@${w}px Alter 80 ohne Reparatur: ${r.n80.ohne} statt 100`);
  if (!r.label) fehler.push(`@${w}px Regler ohne label`);
  if (w === 390 && r.ueber > 0) fehler.push(`@390px horizontaler Überlauf ${r.ueber} px`);
}
await b.close();
if (fehler.length) { console.log('Fehler (' + fehler.length + '):'); fehler.forEach((f) => console.log('  X ' + f)); process.exit(1); }
console.log('Alterung und Reparatur: keine Fehler.');
