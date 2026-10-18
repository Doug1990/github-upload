// Prüft, dass keine Seite außer zelle.html auf zelle.html verweist (href, Skript-String, Navigation, Meta).
// Aufruf: node tests/keine-zell-links.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const WURZEL = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const seiten = fs.readdirSync(WURZEL).filter((f) => f.endsWith('.html') && f !== 'zelle.html').sort();
const fehler = [];
for (const s of seiten) {
  const zeilen = fs.readFileSync(path.join(WURZEL, s), 'utf8').split('\n');
  zeilen.forEach((z, i) => {
    for (const m of z.matchAll(/zelle\.html[^"'\s<>)]*/g)) fehler.push(`${s}, Zeile ${i + 1}: Verweis auf ${m[0]}`);
  });
  console.log(`${s}: geprüft`);
}
if (fehler.length) { console.error('\nFehler (' + fehler.length + '): Die Zell-Seite ist ein getrenntes Projekt, keine andere Seite darf auf zelle.html verweisen.\n' + fehler.map((f) => '  X ' + f).join('\n')); process.exit(1); }
console.log(`\nKeine Verweise auf zelle.html in ${seiten.length} Seiten.`);
