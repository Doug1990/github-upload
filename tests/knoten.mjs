// Prüft "Du gehörst dazu": Abhängigkeiten der zehn Leitungen (GRAPH) beim Ausschalten und Wiedereinschalten.
// Aufruf: node tests/knoten.mjs [--chrome=<pfad>]
// Je Leitung einzeln ausschalten: die Menge der mitausfallenden Leitungen entspricht GRAPH (transitiv, aus index.html gelesen).
// Gebühren hat mindestens drei Folgen. Mitausgefallene tragen die Klasse cascaded, ihr Knopf heißt "Erst die Ursache beheben".
// Wiedereinschalten stellt alles her, mehrere gleichzeitig aus und wieder an bleibt konsistent.
import fs from 'node:fs';
import { start, sleep } from './chrome.mjs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const GRAPH = new Function('return ' + html.match(/const GRAPH = (\{[\s\S]*?\n  \});/)[1])();
const IDS = ['wasser', 'energie', 'netz', 'wege', 'betreuung', 'gebuehren', 'steuern', 'umlage', 'arbeit', 'mitmachen'];
const fehler = [];
const folge = (start) => { const aus = new Set(), q = [start]; while (q.length) { const x = q.pop(); for (const n of GRAPH[x] || []) if (!aus.has(n) && n !== start) { aus.add(n); q.push(n); } } return aus; };
const erwartet = (manuell) => { const alle = new Set(manuell); for (const m of manuell) for (const n of folge(m)) alle.add(n); return [...alle].sort().join(','); };
if ((GRAPH.gebuehren || []).length < 3) fehler.push('GRAPH.gebuehren hat weniger als drei Folgen');

const b = await start();
for (const w of [1280, 390]) {
  await b.open('index.html', w);
  await b.ev(`document.getElementById('knoten').scrollIntoView({ behavior: 'instant', block: 'center' })`);
  await sleep(500);
  const IDX = JSON.stringify(IDS);
  const kit = `(() => { const g = [...document.querySelectorAll('#knoten g[role=button]')]; const ids = ${IDX};
    return { g, ids,
      zustand: () => g.map((e, i) => ({ id: ids[i], down: e.classList.contains('down'), cas: e.classList.contains('cascaded') })),
      umschalten: (i) => { g[i].dispatchEvent(new MouseEvent('click', { bubbles: true })); const k = document.querySelector('#knotenActions button'); const t = k ? k.textContent : ''; const dis = k ? k.disabled : null; if (k && !k.disabled) k.click(); g[i].dispatchEvent(new MouseEvent('click', { bubbles: true })); return { t, dis }; } }; })()`;
  const n = await b.ev(`document.querySelectorAll('#knoten g[role=button]').length`);
  if (n !== 10) { fehler.push(`${w} px: ${n} Leitungen statt 10`); continue; }
  const lauf = async (js) => b.ev(`(() => { const K = ${kit}; ${js} })()`);
  const zustand = async () => (await lauf(`return K.zustand();`));
  const menge = (z) => z.filter((e) => e.down).map((e) => e.id).sort().join(',');
  for (let i = 0; i < 10; i++) {
    const r = await lauf(`return K.umschalten(${i});`);
    const z = await zustand();
    const e = erwartet([IDS[i]]);
    if (menge(z) !== e) fehler.push(`${w} px ${IDS[i]} aus: ausgefallen ${menge(z)}, erwartet ${e}`);
    const casIds = z.filter((x) => x.cas).map((x) => x.id).sort().join(',');
    const casErw = e.split(',').filter((x) => x !== IDS[i]).sort().join(',');
    if (casIds !== casErw) fehler.push(`${w} px ${IDS[i]} aus: mitausgefallen (cascaded) ${casIds}, erwartet ${casErw}`);
    // Mitausgefallene: Knopf "Erst die Ursache beheben"
    for (const c of casErw ? casErw.split(',') : []) {
      const k = await lauf(`g = K.g[${IDS.indexOf(c)}]; g.dispatchEvent(new MouseEvent('click', { bubbles: true })); const kn = document.querySelector('#knotenActions button'); const o = { t: kn && kn.textContent, d: kn && kn.disabled }; g.dispatchEvent(new MouseEvent('click', { bubbles: true })); return o;`.replace('g = ', 'const g = '));
      if (!k.t || !k.t.includes('Erst die Ursache beheben') || !k.d) fehler.push(`${w} px ${IDS[i]} aus, ${c}: Knopf "${k.t}"`);
    }
    // wieder einschalten
    await lauf(`K.umschalten(${i}); return 0;`);
    const z2 = await zustand();
    if (menge(z2) !== '') fehler.push(`${w} px ${IDS[i]} wieder an: noch aus ${menge(z2)}`);
  }
  // Gebühren: mindestens drei Folgen sichtbar
  await lauf(`K.umschalten(5); return 0;`);
  const zg = await zustand();
  if (zg.filter((x) => x.cas).length < 3) fehler.push(`${w} px Gebühren aus: nur ${zg.filter((x) => x.cas).length} Folgen`);
  await lauf(`K.umschalten(5); return 0;`);
  // mehrere gleichzeitig
  const mehr = [5, 3, 8];
  for (const i of mehr) await lauf(`K.umschalten(${i}); return 0;`);
  const zm = await zustand();
  if (menge(zm) !== erwartet(mehr.map((i) => IDS[i]))) fehler.push(`${w} px mehrere aus: ${menge(zm)}, erwartet ${erwartet(mehr.map((i) => IDS[i]))}`);
  await lauf(`K.umschalten(3); return 0;`);
  const zm2 = await zustand();
  if (menge(zm2) !== erwartet([IDS[5], IDS[8]])) fehler.push(`${w} px nach Wege an: ${menge(zm2)}`);
  for (const i of [5, 8]) await lauf(`K.umschalten(${i}); return 0;`);
  if (menge(await zustand()) !== '') fehler.push(`${w} px nach allem wieder an: noch aus ${menge(await zustand())}`);
  console.log(`Knoten ${w} px: 10 Leitungen geprüft`);
}
b.close();
if (fehler.length) { console.error('\nFehler (' + fehler.length + '):\n' + fehler.map((f) => '  X ' + f).join('\n')); process.exit(1); }
console.log('\nKnoten: keine Fehler.');
