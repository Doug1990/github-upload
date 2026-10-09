// Prüft die Abschlussseite abschluss.html: fünf Fragen mit je vier Antworten (Düsseldorf, Zelle, Körper, Internet), vier Felder "Wo das Bild hinkt",
// Links zu den anderen Seiten, Überlauf und Lesbarkeit bei 390 px.
// Aufruf: node tests/abschluss.mjs [--chrome=<pfad>]
import { start } from './chrome.mjs';

const b = await start();
const fehler = [];
for (const w of [1280, 390]) {
  await b.open('abschluss.html', w);
  const r = await b.ev(`(() => {
    const fr = [...document.querySelectorAll('.abs-frage')].filter((f) => f.querySelector('.abs-grid'));
    const o = { fragen: fr.length, karten: fr.map((f) => f.querySelectorAll('.abs-karte').length), namen: [...fr[0].querySelectorAll('.abs-karte b')].map((e) => e.textContent), hinkt: document.querySelectorAll('.abs-hinkt').length, links: [...document.querySelectorAll('main a')].map((a) => a.getAttribute('href')) };
    o.ueber = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    o.klein = [...document.querySelectorAll('.abs-karte p')].filter((p) => parseFloat(getComputedStyle(p).fontSize) < 15).length;
    o.leer = [...document.querySelectorAll('.abs-karte p')].filter((p) => p.textContent.trim().length < 30).length;
    return o;
  })()`);
  const j = JSON.stringify;
  if (r.fragen !== 5 || r.karten.some((k) => k !== 4)) fehler.push(`@${w}px ${r.fragen} Fragen, Antworten je Frage ${j(r.karten)}`);
  if (j(r.namen) !== '["Düsseldorf","Zelle","Körper","Internet"]') fehler.push(`@${w}px Spalten: ${j(r.namen)}`);
  if (r.hinkt !== 4) fehler.push(`@${w}px ${r.hinkt} Felder "Wo das Bild hinkt" statt 4`);
  for (const l of ['index.html', 'zelle.html', 'karte-skizze.html', 'glossar.html']) if (!r.links.includes(l)) fehler.push(`@${w}px Link zu ${l} fehlt`);
  if (r.leer) fehler.push(`@${w}px ${r.leer} sehr kurze Antworten`);
  if (w === 390 && r.ueber > 0) fehler.push(`@390px horizontaler Überlauf ${r.ueber} px`);
  if (w === 390 && r.klein) fehler.push(`@390px ${r.klein} Antworten unter 15 px`);
}
await b.close();
if (fehler.length) { console.log('Fehler (' + fehler.length + '):'); fehler.forEach((f) => console.log('  X ' + f)); process.exit(1); }
console.log('Abschlussseite: keine Fehler.');
