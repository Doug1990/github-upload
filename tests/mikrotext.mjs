// Mikrotexte in SVG-Schemata: misst die wirksame Schriftgröße jedes sichtbaren SVG-Textes bei schmaler Breite
// (Schriftgröße im Bild mal Skalierung der Zeichenfläche), auch nach Klicks (Zustände aus chrome.mjs).
// Grenze: 11 px. Altlasten stehen in tests/mikrotext-basis.json (je Seite und Zeichenfläche: Anzahl der Texte
// unter der Grenze und kleinster Wert). Fehler (Exit-Code 1) gibt es nur, wenn eine Zeichenfläche mehr Texte
// unter der Grenze hat oder einen kleineren Wert als in der Basis. Wer Altlasten behebt, schreibt die Basis
// mit --basis-schreiben neu, so wird die Liste Schritt für Schritt kürzer. Ziel ist eine leere Basis.
// Aufruf: node tests/mikrotext.mjs [--breite=390] [--grenze=11] [--seite=zelle.html] [--ohne-zustaende]
//         [--basis-schreiben] [--liste] [--chrome=<pfad>]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { start, arg, sleep, zustandsSchritte } from './chrome.mjs';

const BASIS = path.join(path.dirname(fileURLToPath(import.meta.url)), 'mikrotext-basis.json');
const width = Number(arg('breite') || 390);
const limit = Number(arg('grenze') || 11);
const only = arg('seite');
const schreiben = process.argv.includes('--basis-schreiben');
const basis = fs.existsSync(BASIS) ? JSON.parse(fs.readFileSync(BASIS, 'utf8')) : {};
const b = await start();

const MEASURE = `(() => {
  const out = [];
  for (const t of document.querySelectorAll('svg text')) {
    if (!t.textContent.trim()) continue;
    if (!t.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
    const svg = t.ownerSVGElement; if (!svg) continue;
    const r = t.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
    const ctm = t.getScreenCTM(); if (!ctm) continue;
    const size = parseFloat(getComputedStyle(t).fontSize) * Math.hypot(ctm.a, ctm.b);
    const id = svg.id || (svg.getAttribute('class') || '').split(' ')[0] || 'svg';
    out.push({ svg: id, text: t.textContent.replace(/\\s+/g, ' ').trim().slice(0, 36), px: Math.round(size * 10) / 10 });
  }
  return out;
})()`;

const aktuell = {}; let total = 0;
const page2 = [];
for (const page of b.pages) {
  if (only && page !== only) continue;
  page2.push(page);
  await b.open(page, width);
  const seen = new Map();
  const take = (list, label) => {
    total += 0;
    for (const v of list) {
      if (v.px >= limit) continue;
      const key = v.svg + '|' + v.text;
      const alt = seen.get(key);
      if (!alt || v.px < alt.px) seen.set(key, { ...v, label: alt ? alt.label : label });
    }
  };
  take(await b.ev(MEASURE), '');
  if (!process.argv.includes('--ohne-zustaende')) {
    for (const s of await zustandsSchritte(b)) { await s.run(); await sleep(500); take(await b.ev(MEASURE), 'nach: ' + s.name); }
  }
  for (const v of seen.values()) {
    const k = page + '|' + v.svg;
    const a = aktuell[k] || (aktuell[k] = { n: 0, min: Infinity, texte: [] });
    a.n++; a.min = Math.min(a.min, v.px); a.texte.push(`"${v.text}" ${v.px}px${v.label ? ' [' + v.label + ']' : ''}`);
  }
}

if (schreiben) {
  const neu = { ...basis };
  for (const p of page2) for (const k of Object.keys(neu)) if (k.startsWith(p + '|')) delete neu[k];
  for (const [k, a] of Object.entries(aktuell)) neu[k] = { n: a.n, min: a.min };
  const sortiert = Object.fromEntries(Object.entries(neu).sort(([x], [y]) => x.localeCompare(y)));
  fs.writeFileSync(BASIS, JSON.stringify(sortiert, null, 2) + '\n');
  console.log(`Basis geschrieben: ${Object.keys(sortiert).length} Zeichenflächen mit Altlasten.`);
  b.close(); process.exit(0);
}

let fehler = 0, altlast = 0, behoben = 0;
if (process.argv.includes('--liste')) for (const [k, a] of Object.entries(aktuell)) { console.log(`  ${k}: ${a.n} Texte, kleinster ${a.min} px`); a.texte.forEach((x) => console.log('      ' + x)); }
for (const [k, a] of Object.entries(aktuell)) {
  const bs = basis[k] || { n: 0, min: Infinity };
  altlast += Math.min(a.n, bs.n);
  if (a.n > bs.n || a.min < bs.min - 0.05) {
    fehler++;
    console.log(`  X ${k} @${width}px: ${a.n} Texte unter ${limit} px (Basis ${bs.n}), kleinster Wert ${a.min} px (Basis ${bs.min === Infinity ? '-' : bs.min})`);
    a.texte.forEach((t) => console.log('      ' + t));
  }
}
for (const [k, bs] of Object.entries(basis)) {
  if (only && !k.startsWith(only + '|')) continue;
  const a = aktuell[k];
  if (!a || a.n < bs.n) behoben += bs.n - (a ? a.n : 0);
}
console.log(`\nSVG-Texte unter ${limit} px bei ${width} px: ${altlast} bekannte Altlasten laut Basis, ${behoben} seit der Basis behoben.`);
if (behoben) console.log('Tipp: node tests/mikrotext.mjs --basis-schreiben, um die Basis zu kürzen.');
console.log(fehler ? `${fehler} Zeichenflächen schlechter als die Basis.` : 'Keine neuen oder schlechteren Fälle.');
b.close();
process.exit(fehler ? 1 : 0);
