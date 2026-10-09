// Misst das Gewicht jeder Seite und prüft es gegen ein Budget.
// Aufruf: node tests/gewicht.mjs [--budget=<KB gzip>] [--chrome=<pfad>]
// Gemessen werden Bytes roh und gzip (Seite plus lokal eingebundene Stile und Skripte, Schriften getrennt) und die Zahl der Anfragen beim Laden.
// Fehler (Exit-Code 1): gzip-Gewicht je Seite über dem Budget (Vorgabe 150 KB ohne Schriften). Warnung ab 85 Prozent des Budgets.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { start, arg, sleep } from './chrome.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUDGET = (parseFloat(arg('budget')) || 150) * 1024;
const kb = (n) => (n / 1024).toFixed(1).replace('.', ',') + ' KB';
const gz = (buf) => zlib.gzipSync(buf, { level: 9 }).length;

const b = await start();
const fehler = [], warnungen = [];
console.log(`Budget: ${kb(BUDGET)} gzip je Seite, ohne Schriften\n`);
console.log('Seite                 roh          gzip         Schriften    Anfragen');
for (const seite of b.pages) {
  const html = fs.readFileSync(path.join(ROOT, seite));
  let roh = html.length, zip = gz(html), schriften = 0;
  const text = html.toString('utf8');
  const lokal = new Set();
  for (const [, u] of text.matchAll(/(?:href|src)="([^"#?:]+\.(?:css|js|mjs))"/g)) lokal.add(u);
  const schriftDateien = new Set();
  const schriftIn = (inhalt, basis) => { for (const [, u] of inhalt.matchAll(/url\(['"]?([^'")]+\.(?:woff2?|ttf|otf))['"]?\)/g)) schriftDateien.add(path.join(basis, u)); };
  for (const u of lokal) {
    const f = path.join(ROOT, u);
    if (!fs.existsSync(f)) continue;
    const d = fs.readFileSync(f); roh += d.length; zip += gz(d);
    if (f.endsWith('.css')) schriftIn(d.toString('utf8'), path.dirname(f));
  }
  schriftIn(text, ROOT);
  for (const f of schriftDateien) if (fs.existsSync(f)) schriften += fs.statSync(f).size;
  await b.open(seite, 390);
  const anfragen = await b.ev(`performance.getEntriesByType('resource').length + 1`);
  console.log(`${seite.padEnd(20)} ${kb(roh).padStart(10)} ${kb(zip).padStart(12)} ${kb(schriften).padStart(12)} ${String(anfragen).padStart(10)}`);
  if (zip > BUDGET) fehler.push(`${seite}: ${kb(zip)} gzip, Budget ${kb(BUDGET)}`);
  else if (zip > BUDGET * 0.85) warnungen.push(`${seite}: ${kb(zip)} gzip, schon ${Math.round(zip / BUDGET * 100)} Prozent des Budgets`);
}
await b.close();
if (warnungen.length) { console.log(`\nWarnungen (${warnungen.length}):`); warnungen.forEach((w) => console.log('  ! ' + w)); }
if (fehler.length) { console.log(`\nFehler (${fehler.length}):`); fehler.forEach((f) => console.log('  X ' + f)); process.exit(1); }
console.log('\nBudget eingehalten.');
