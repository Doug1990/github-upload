// Prüft den Abschnitt "Jemand muss es bezahlen." (#kosten) auf der Startseite.
// Aufruf: node tests/kosten.mjs [--chrome=<pfad>]
// Fehler (Exit-Code 1): falsche Beträge (Gebühr bei 100 Prozent 194, 484, 97 Euro; bei 60 Prozent 323, 806, 161; Steuer unabhängig von der Zahl;
// Preis bei 100 Prozent 223, 556, 111), Tippflächen unter 44 px bei 390 px, Überlauf.
import { start } from './chrome.mjs';

const b = await start();
const fehler = [];
for (const w of [1280, 390]) {
  await b.open('index.html', w);
  const r = await b.ev(`(() => {
    const $ = (id) => document.getElementById(id); if (!$('kostN')) return null;
    const btn = [...document.querySelectorAll('#kostSeg button')];
    const n = (v) => { $('kostN').value = v; $('kostN').dispatchEvent(new Event('input', { bubbles: true })); };
    const werte = () => [...document.querySelectorAll('#kostRows output')].map((e) => parseInt(e.textContent.replace(/\\./g, ''), 10));
    const o = { tasten: btn.length };
    btn[0].click(); n(100); o.g100 = werte(); n(60); o.g60 = werte();
    btn[1].click(); n(100); o.s100 = werte(); n(20); o.s20 = werte(); o.sTxt = $('kostStatus').textContent;
    btn[2].click(); n(100); o.p100 = werte();
    const vg = () => [...document.querySelectorAll('#kostVgl .kost-c')].map((c) => parseInt(c.querySelector('output').textContent.replace(/\\./g, ''), 10));
    const an = () => [...document.querySelectorAll('#kostVgl .kost-c')].map((c) => c.classList.contains('an') && c.textContent.includes('gewählt') ? 1 : 0).join('');
    o.summe = $('kostSumme').textContent; o.f = parseFloat(getComputedStyle($('kostSumme')).fontSize); o.cap = $('kostViz').textContent.includes('gefüllt zahlt, gestrichelt zahlt nicht'); o.alt = !!document.querySelector('#kosten > svg.bild:not(#kostViz)');
    o.vgl = {}; o.an = {};
    for (const [k, m] of [[0, 'g'], [1, 's'], [2, 'p']]) { btn[k].click(); o.an[m] = an(); for (const pct of [60, 100, 10]) { n(pct); o.vgl[m + pct] = vg(); } }
    o.vf = Math.min(...[...document.querySelectorAll('#kostVgl .kost-cn, #kostVgl output, #kostVgl .kost-sel')].map((e) => parseFloat(getComputedStyle(e).fontSize)));
    o.klein = btn.map((e) => { const r = e.getBoundingClientRect(); return [e.textContent, Math.round(r.width), Math.round(r.height)]; }).filter((x) => x[1] < 44 || x[2] < 44);
    o.ueber = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    return o;
  })()`);
  if (!r) { fehler.push(`@${w}px: #kostN fehlt`); continue; }
  const j = JSON.stringify;
  if (r.tasten !== 3) fehler.push(`@${w}px ${r.tasten} Knöpfe statt 3`);
  if (j(r.g100) !== '[194,484,97]') fehler.push(`@${w}px Gebühr bei 100 Prozent: ${j(r.g100)}`);
  if (j(r.g60) !== '[323,806,161]') fehler.push(`@${w}px Gebühr bei 60 Prozent: ${j(r.g60)}`);
  if (j(r.s100) !== '[194,484,97]' || j(r.s20) !== '[194,484,97]') fehler.push(`@${w}px Steuer hängt von der Zahl ab: ${j(r.s100)} und ${j(r.s20)}`);
  if (!/für alle gleich/.test(r.sTxt)) fehler.push(`@${w}px Steuer: Statustext passt nicht`);
  if (j(r.p100) !== '[223,556,111]') fehler.push(`@${w}px Preis bei 100 Prozent: ${j(r.p100)}`);
  if (r.summe !== '480 Mio. € im Jahr') fehler.push(`@${w}px Summe: ${r.summe}`);
  if (r.f < 16) fehler.push(`@${w}px Summe nur ${r.f} px groß`);
  if (!r.cap) fehler.push(`@${w}px Beschriftung unter den Kreisen fehlt`);
  if (r.alt) fehler.push(`@${w}px oberes Bild ist noch da`);
  if (r.vf < 14) fehler.push(`@${w}px Vergleichsschrift ${r.vf} px`);
  // erwartete Summen je Modus: Gebühr 1290 (60), 775 (100), 7742 (10); Steuer 775; Preis 891 (100)
  const sumG = { 60: 1290, 100: 775, 10: 7742 };
  for (const pct of [60, 100, 10]) {
    const v = r.vgl['g' + pct]; const e = [Math.round(120e6 / (620000 * pct / 100)), Math.round(300e6 / (620000 * pct / 100)), Math.round(60e6 / (620000 * pct / 100))];
    if (Math.abs(v[0] - sumG[pct]) > 3) fehler.push(`@${w}px Gebühr ${pct}%: ${v[0]} statt etwa ${sumG[pct]}`);
    if (Math.abs(v[1] - 775) > 2) fehler.push(`@${w}px Steuer ${pct}%: ${v[1]}`);
    if (Math.abs(v[2] - Math.round(sumG[pct] * 1.15)) > 4) fehler.push(`@${w}px Preis ${pct}%: ${v[2]}`);
  }
  if (r.an.g !== '100' || r.an.s !== '010' || r.an.p !== '001') fehler.push(`@${w}px Hervorhebung: ${j(r.an)}`);
  if (w === 390) { for (const k of r.klein) fehler.push(`@390px Tippfläche unter 44 px: ${j(k)}`); if (r.ueber > 0) fehler.push(`@390px horizontaler Überlauf ${r.ueber} px`); }
}
await b.close();
if (fehler.length) { console.log('Fehler (' + fehler.length + '):'); fehler.forEach((f) => console.log('  X ' + f)); process.exit(1); }
console.log('Kosten: keine Fehler.');
