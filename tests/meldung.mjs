// Prüft den Abschnitt "Eine Meldung, drei Geschwindigkeiten." (#meldung) auf der Zell-Seite.
// Aufruf: node tests/meldung.mjs [--chrome=<pfad>]
// Fehler (Exit-Code 1): drei Strecken, falsche Zeiten (Körper: 1 min, 20 ms; Stadt: 1 Tag, 50 µs, 33 µs), Funk im Körper nicht vorhanden,
// Tippflächen unter 44 px bei 390 px, Überlauf.
import { start } from './chrome.mjs';

const b = await start();
const fehler = [];
for (const w of [1280, 390]) {
  await b.open('zelle.html', w);
  const r = await b.ev(`(() => {
    const $ = (id) => document.getElementById(id); if (!$('melSeg')) return null;
    const btn = [...document.querySelectorAll('#melSeg button')];
    const st = () => ({ o: [0, 1, 2].map((i) => $('melR' + i).querySelector('output').textContent), t: $('melStatus').textContent, breite: [0, 1, 2].map((i) => parseFloat($('melR' + i).querySelector('i').style.width)) });
    const o = { tasten: btn.length };
    btn[0].click(); o.z = st(); btn[1].click(); o.k = st(); btn[2].click(); o.s = st();
    o.klein = btn.map((e) => { const r = e.getBoundingClientRect(); return [e.textContent, Math.round(r.width), Math.round(r.height)]; }).filter((x) => x[1] < 44 || x[2] < 44);
    o.ueber = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    return o;
  })()`);
  if (!r) { fehler.push(`@${w}px: #melSeg fehlt`); continue; }
  const j = JSON.stringify;
  if (r.tasten !== 3) fehler.push(`@${w}px ${r.tasten} Strecken statt 3`);
  if (j(r.k.o) !== '["1 min","20 ms","gibt es nicht"]') fehler.push(`@${w}px Körper: ${j(r.k.o)}`);
  if (j(r.s.o) !== '["1 Tag","50 µs","33 µs"]') fehler.push(`@${w}px Stadt: ${j(r.s.o)}`);
  if (r.z.o[2] !== 'gibt es nicht' || r.z.breite[2] !== 0) fehler.push(`@${w}px Nachbarzelle: Funk ${j(r.z)}`);
  if (!/Funk gibt es für Meldungen im Körper nicht/.test(r.k.t) || /Funk gibt es/.test(r.s.t)) fehler.push(`@${w}px Statustexte passen nicht`);
  if (!(r.s.breite[0] > r.s.breite[1] && r.s.breite[1] > r.s.breite[2])) fehler.push(`@${w}px Stadt: Balken nicht absteigend ${j(r.s.breite)}`);
  if (w === 390) { for (const k of r.klein) fehler.push(`@390px Tippfläche unter 44 px: ${j(k)}`); if (r.ueber > 0) fehler.push(`@390px horizontaler Überlauf ${r.ueber} px`); }
}
await b.close();
if (fehler.length) { console.log('Fehler (' + fehler.length + '):'); fehler.forEach((f) => console.log('  X ' + f)); process.exit(1); }
console.log('Meldung: keine Fehler.');
