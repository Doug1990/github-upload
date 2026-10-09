// Prüft den Abschnitt "Gleicher Name, anderer Mechanismus" (#skalen) auf abschluss.html.
// Aufruf: node tests/skalen.mjs [--chrome=<pfad>]
// Fehler (Exit-Code 1): sechs Wörter, Schieber mit drei Stufen (nur Düsseldorf, beides, nur Zelle), Feld "Anders" immer sichtbar, ohne Skript beides sichtbar,
// Regler ohne label, Überlauf bei 390 px.
import { start } from './chrome.mjs';

const b = await start();
const fehler = [];
for (const w of [1280, 390]) {
  await b.open('abschluss.html', w);
  const r = await b.ev(`(() => {
    const $ = (id) => document.getElementById(id); if (!$('skS')) return null;
    const v = (x) => { $('skS').value = x; $('skS').dispatchEvent(new Event('input', { bubbles: true })); };
    const sicht = (sel) => [...document.querySelectorAll(sel)].filter((e) => e.getBoundingClientRect().height > 0).length;
    const st = () => ({ a: sicht('.sk-a'), b: sicht('.sk-b'), an: sicht('.sk-anders'), t: $('skO').textContent, vt: $('skS').getAttribute('aria-valuetext') });
    const o = { zeilen: document.querySelectorAll('.sk-zeile').length };
    v(0); o.s0 = st(); v(1); o.s1 = st(); v(2); o.s2 = st();
    o.label = !!document.querySelector('label[for=skS]');
    o.ueber = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    return o;
  })()`);
  if (!r) { fehler.push(`@${w}px: #skS fehlt`); continue; }
  const j = JSON.stringify;
  if (r.zeilen !== 6) fehler.push(`@${w}px ${r.zeilen} Wörter statt 6`);
  if (r.s0.a !== 6 || r.s0.b !== 0 || r.s0.t !== 'Nur Düsseldorf') fehler.push(`@${w}px Stufe 0: ${j(r.s0)}`);
  if (r.s1.a !== 6 || r.s1.b !== 6 || r.s1.t !== 'Beides') fehler.push(`@${w}px Stufe 1: ${j(r.s1)}`);
  if (r.s2.a !== 0 || r.s2.b !== 6 || r.s2.t !== 'Nur die Zelle') fehler.push(`@${w}px Stufe 2: ${j(r.s2)}`);
  for (const [k, x] of [['0', r.s0], ['1', r.s1], ['2', r.s2]]) if (x.an !== 6 || x.vt !== x.t) fehler.push(`@${w}px Stufe ${k}: Feld Anders ${x.an}, aria-valuetext ${x.vt}`);
  if (!r.label) fehler.push(`@${w}px Regler ohne label`);
  if (w === 390 && r.ueber > 0) fehler.push(`@390px horizontaler Überlauf ${r.ueber} px`);
}
// Ohne Skript sind beide Spalten sichtbar
await b.send('Emulation.setScriptExecutionDisabled', { value: true });
await b.send('Page.navigate', { url: `${b.BASE}/abschluss.html` });
await new Promise((r) => setTimeout(r, 900));
const ohne = await b.ev(`[...document.querySelectorAll('.sk-a, .sk-b')].filter((e) => e.getBoundingClientRect().height > 0).length`);
if (ohne !== 12) fehler.push(`ohne Skript sind ${ohne} von 12 Kästen sichtbar`);
await b.close();
if (fehler.length) { console.log('Fehler (' + fehler.length + '):'); fehler.forEach((f) => console.log('  X ' + f)); process.exit(1); }
console.log('Skalen: keine Fehler.');
