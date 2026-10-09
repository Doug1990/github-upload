// Prüft die Länge der Sätze im sichtbaren und zugeklappten Text: kein Satz soll länger als 28 Wörter sein.
// Aufruf: node tests/saetze.mjs [--grenze=28] [--chrome=<pfad>]
// Gelesen werden Absätze, Listenpunkte, Beschreibungen, Spalten und Überschriften (nicht die Texte, die erst nach Klicks erscheinen).
// Fehler (Exit-Code 1): ein Satz hat mehr Wörter als die Grenze. Ziel: Texte, die auch Menschen ohne Fachwissen gut lesen können.
import { start, arg } from './chrome.mjs';

const GRENZE = parseInt(arg('grenze'), 10) || 28;
const b = await start();
const fehler = [];
for (const seite of b.pages) {
  await b.open(seite, 1280);
  const lang = await b.ev(`(() => {
    const aus = new Set();
    for (const e of document.querySelectorAll('p, li, dd, .col, summary, .lead')) {
      if (e.closest('script, style, svg, nav, footer') || e.querySelector('p, li, .col, dd')) continue;
      const t = e.textContent.replace(/\\s+/g, ' ').trim();
      for (const s of t.split(/(?<=[.!?])\\s+/)) { const n = s.split(' ').length; if (n > ${GRENZE}) aus.add(n + '|' + s.slice(0, 140)); }
    }
    return [...aus];
  })()`);
  for (const x of lang) { const [n, s] = x.split('|'); fehler.push(`${seite}: Satz mit ${n} Wörtern: "${s}"`); }
}
await b.close();
if (fehler.length) { console.log('Fehler (' + fehler.length + '):'); fehler.forEach((f) => console.log('  X ' + f)); process.exit(1); }
console.log(`Sätze: keiner länger als ${GRENZE} Wörter.`);
