// Prüft die festgelegte Schreibweise der Leitbegriffe (siehe BEGRIFFE.md).
// Aufruf: node tests/begriffe.mjs
// Fehler (Exit-Code 1): eine unerwünschte Variante aus tests/begriffe.json steht in einer HTML-Seite.
// Keine Abhängigkeiten, kein Chrome.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const regeln = JSON.parse(fs.readFileSync(path.join(root, 'tests', 'begriffe.json'), 'utf8'));
const seiten = fs.readdirSync(root).filter(f => f.endsWith('.html'));
let fehler = 0;
for (const seite of seiten) {
  const zeilen = fs.readFileSync(path.join(root, seite), 'utf8').split('\n');
  for (const [muster, besser] of Object.entries(regeln)) {
    const re = new RegExp(muster);
    zeilen.forEach((z, i) => {
      const m = z.match(re);
      if (m) { fehler++; console.log(`FEHLER ${seite}:${i + 1} "${m[0]}" statt "${besser}"`); }
    });
  }
}
console.log(fehler ? `${fehler} unerwünschte Schreibweisen` : `Begriffe in Ordnung (${seiten.length} Seiten)`);
process.exit(fehler ? 1 : 0);
