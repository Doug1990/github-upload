// Prüft "Deine Reise": jede Station jeder Route hat einen Kurzsatz (1 bis 10 Wörter), der beim Durchlauf sichtbar unter dem Stationsnamen steht,
// in der aufgebauten Kette als Titel und versteckter Text mitläuft und bei Reduced Motion in der vollständigen Kette sichtbar ist.
// Aufruf: node tests/journey.mjs [--chrome=<pfad>]
import { start, sleep } from './chrome.mjs';

const b = await start();
const fehler = [];
const wörter = (t) => t.trim().split(/\s+/).filter(Boolean).length;

for (const [w, nurRoute] of [[1280, 99], [390, 2]]) {
  await b.open('index.html', w);
  await b.ev(`document.getElementById('journey').scrollIntoView({ behavior: 'instant', block: 'start' })`);
  await sleep(400);
  const tabs = await b.ev(`[...document.querySelectorAll('#journeyTabs .journey-tab')].map((t) => t.textContent)`);
  let geprueft = 0;
  for (let t = 0; t < Math.min(tabs.length, nurRoute); t++) {
    await b.ev(`document.querySelectorAll('#journeyTabs .journey-tab')[${t}].click()`);
    await sleep(200);
    const n = await b.ev(`document.querySelectorAll('#journeyScene .j-lbl').length`);
    await b.ev(`document.getElementById('journeyBtn').click()`);
    const gesehen = new Map();
    for (let i = 0; i < 80; i++) {
      await sleep(250);
      const s = await b.ev(`(() => { const a = document.getElementById('journeyStationName'), c = document.getElementById('journeyStationWas'); const q = c.getBoundingClientRect(); return { name: a.textContent, was: c.textContent, sichtbar: q.height > 8 && +getComputedStyle(c).opacity > 0.9, f: parseFloat(getComputedStyle(c).fontSize), r: q.right, fertig: !document.getElementById('journeyBtn').disabled }; })()`);
      if (s.sichtbar && s.name) gesehen.set(s.name, s);
      if (s.r > w + 0.5) fehler.push(`${w} px ${tabs[t]}: Satz ragt aus dem Fenster`);
      if (s.fertig && i > 4) break;
    }
    const kette = await b.ev(`[...document.querySelectorAll('#journeyChain .jc-item')].map((e) => ({ n: e.firstChild.textContent, titel: e.title, vh: e.querySelector('.jc-was')?.textContent || '' }))`);
    if (gesehen.size < n) fehler.push(`${w} px ${tabs[t]}: nur ${gesehen.size} von ${n} Stationen mit sichtbarem Satz gesehen`);
    for (const [name, s] of gesehen) {
      if (wörter(s.was) < 1 || wörter(s.was) > 10) fehler.push(`${tabs[t]}/${name}: Satz mit ${wörter(s.was)} Wörtern`);
      if (s.f < 12) fehler.push(`${tabs[t]}/${name}: Schrift ${s.f} px`);
    }
    if (kette.length !== n) fehler.push(`${w} px ${tabs[t]}: Kette hat ${kette.length} von ${n} Gliedern`);
    for (const k of kette) if (!k.titel.includes(':') || !k.vh) fehler.push(`${tabs[t]}/${k.n}: Kettenglied ohne Erläuterung`);
    geprueft += gesehen.size;
  }
  const live = await b.ev(`document.getElementById('journeyStation').getAttribute('aria-live')`);
  if (live !== 'polite') fehler.push('journeyStation ohne aria-live');
  if (await b.ev(`document.documentElement.scrollWidth > innerWidth`)) fehler.push(`${w} px: Querscroll`);
  console.log(`Reise ${w} px: ${geprueft} Stationen mit Satz gesehen`);
}

// Reduced Motion: vollständige Kette mit allen Erläuterungen
for (const w of [1280, 390]) {
  await b.open('index.html', w, { reduce: true });
  await b.ev(`document.getElementById('journey').scrollIntoView({ behavior: 'instant', block: 'start' })`);
  await sleep(400);
  const tabs = await b.ev(`document.querySelectorAll('#journeyTabs .journey-tab').length`);
  for (let t = 0; t < tabs; t++) {
    await b.ev(`document.querySelectorAll('#journeyTabs .journey-tab')[${t}].click()`);
    await sleep(200);
    const r = await b.ev(`[...document.querySelectorAll('#journeyChain .jc-was')].map((e) => { const q = e.getBoundingClientRect(); return { h: q.height, f: parseFloat(getComputedStyle(e).fontSize), r: q.right, t: e.textContent }; })`);
    if (r.length !== 5) fehler.push(`reduziert ${w} px Route ${t}: ${r.length} Erläuterungen`);
    for (const e of r) { if (e.h < 8) fehler.push(`reduziert ${w} px Route ${t}: Erläuterung unsichtbar: ${e.t}`); if (e.f < 12) fehler.push('Schrift unter 12 px'); if (e.r > w) fehler.push('Erläuterung ragt heraus'); }
  }
  console.log(`Reise reduziert ${w} px: ${tabs} Routen mit voller Kette geprüft`);
}
b.close();
if (fehler.length) { console.error('\nFehler (' + fehler.length + '):\n' + fehler.map((f) => '  X ' + f).join('\n')); process.exit(1); }
console.log('\nReise: keine Fehler.');
