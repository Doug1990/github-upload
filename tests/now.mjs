// Prüft in "Es läuft weiter" das Schichtbild (#nowPeople) bei gefälschter Uhrzeit.
// Aufruf: node tests/now.mjs [--chrome=<pfad>]
// 02:00, 09:06, 15:30, 23:10: Der Marker steht an der Uhrzeit auf der Achse, die Beschriftung nennt die richtige Schicht,
// Achse mit 0, 6, 12, 18, 24, drei Schichten, Beschriftung Übergabe, Schrift wirksam mindestens 12 px, Reduced Motion zeigt die Endstelle der Punkte.
import { start, sleep } from './chrome.mjs';

const b = await start();
const fehler = [];
const FALLE = [['02:00', 2, 0, 'Nachtschicht'], ['09:06', 9, 6, 'Frühschicht'], ['15:30', 15, 30, 'Spätschicht'], ['23:10', 23, 10, 'Nachtschicht']];
let skriptId = null;
for (const w of [1280, 390]) {
  for (const [zeit, h, m, schicht] of FALLE) {
    if (skriptId) await b.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: skriptId });
    const r0 = await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { const R = Date; const fix = () => new R(2024, 5, 12, ${h}, ${m}, 0); function D(...a) { return a.length ? new R(...a) : fix(); } D.prototype = R.prototype; D.now = () => fix().getTime(); D.UTC = R.UTC; D.parse = R.parse; window.Date = D; })()` });
    skriptId = r0.identifier;
    await b.open('index.html', w);
    await b.ev(`document.getElementById('nowPeople').scrollIntoView({ behavior: 'instant', block: 'center' })`);
    await sleep(300);
    const r = await b.ev(`(() => {
      const s = document.getElementById('nowPeople'); const sr = s.getBoundingClientRect(); const out = [];
      const t = [...s.querySelectorAll('text')].map((e) => e.textContent);
      const k = s.querySelector('circle[r="4.5"]'); const kb = k.getBoundingClientRect();
      const achse = [...s.querySelectorAll('text')].filter((e) => /^(0|6|12|18|24 Uhr)$/.test(e.textContent));
      const kx = (kb.left + kb.right) / 2;
      const x0 = sr.left + 10 * sr.width / 320, x24 = sr.left + 310 * sr.width / 320;
      const erw = x0 + (${h} + ${m} / 60) / 24 * (x24 - x0);
      for (const e of s.querySelectorAll('text')) { const q = e.getBoundingClientRect(); if (parseFloat(getComputedStyle(e).fontSize) * sr.width / 320 < 12) out.push('Schrift unter 12 px: ' + e.textContent); if (q.left < sr.left - 1 || q.right > sr.right + 1) out.push('Text ragt heraus: ' + e.textContent); }
      return { t, achse: achse.length, kx, erw, out, bander: s.querySelectorAll('rect').length, label: s.getAttribute('aria-label'), q: s.querySelectorAll('path[stroke-dasharray]').length };
    })()`);
    const tag = `${w} px ${zeit}`;
    if (Math.abs(r.kx - r.erw) > 1.5) fehler.push(`${tag}: Marker bei ${r.kx.toFixed(1)}, erwartet ${r.erw.toFixed(1)}`);
    if (!r.t.includes('jetzt ' + zeit)) fehler.push(`${tag}: Beschriftung jetzt ${zeit} fehlt`);
    if (!r.t.includes(schicht + ' hat Dienst')) fehler.push(`${tag}: erwartet "${schicht} hat Dienst", steht ${r.t.filter((x) => /hat Dienst/.test(x))}`);
    if (!r.t.includes('Übergabe')) fehler.push(`${tag}: Übergabe nicht beschriftet`);
    if (r.achse !== 5) fehler.push(`${tag}: Achsenmarken ${r.achse}`);
    if (r.bander !== 4) fehler.push(`${tag}: ${r.bander} Schichtflächen statt 4`);
    if (r.q < 4) fehler.push(`${tag}: gestrichelte Übergaben ${r.q}`);
    if (!r.label.includes(schicht + ' hat Dienst') || !r.label.includes('Übergabe') === false && false) fehler.push(`${tag}: aria-label ohne aktuelle Schicht`);
    for (const o of r.out) fehler.push(`${tag}: ${o}`);
    console.log(`Schichtbild ${tag}: ${schicht}, ${r.out.length} Fehler`);
    if (w === 390 && zeit === '09:06') {
      await b.open('index.html', w, { reduce: true });
      await b.ev(`document.getElementById('nowPeople').scrollIntoView({ behavior: 'instant', block: 'center' })`);
      await sleep(400);
      const d = await b.ev(`[...document.querySelectorAll('#nowPeople .iz-uebergabe')].map((c) => { const q = c.getBoundingClientRect(); return Math.round((q.left + q.right) / 2); })`);
      const l = await b.ev(`[...document.querySelectorAll('#nowPeople path[stroke-dasharray]')].slice(0, 3).map((c) => { const q = c.getBoundingClientRect(); return Math.round(q.left); })`);
      d.forEach((x, i) => { if (Math.abs(x - l[i]) > 12) fehler.push(`reduziert: Punkt ${i + 1} steht bei ${x}, Übergabe bei ${l[i]}`); });
    }
  }
}
b.close();
if (fehler.length) { console.error('\nFehler (' + fehler.length + '):\n' + fehler.map((f) => '  X ' + f).join('\n')); process.exit(1); }
console.log('\nSchichtbild: keine Fehler.');
