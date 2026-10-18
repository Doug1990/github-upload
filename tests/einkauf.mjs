// Prüft im Abschnitt "Du gehst einkaufen" die Leiste "Was dahinter passiert".
// Aufruf: node tests/einkauf.mjs [--chrome=<pfad>]
// Bei 1280 und 390 px: Leiste mit sechs Stationen als Liste (kein aria-hidden), Stationsnamen wirksam mindestens 14 px,
// kein Querscroll; nach dem Antippen eines Produkts leuchten alle Stationen der Reihe nach auf, der Satz steht mit mindestens 16 px da.
// Reduced Motion: alle Stationen mit ihren Sätzen (mindestens 16 px) stehen still sichtbar da.
import { start, sleep } from './chrome.mjs';

const b = await start();
const fehler = [];

for (const [w, reduce] of [[1280, false], [390, false], [390, true], [1280, true]]) {
  const tag = `${w} px${reduce ? ' (Reduced Motion)' : ''}`;
  await b.open('index.html', w, { reduce });
  await b.ev(`document.getElementById('shelfKette').scrollIntoView({ behavior: 'instant', block: 'center' })`);
  await sleep(500);
  const r = await b.ev(`(() => {
    const k = document.getElementById('shelfKette'); const out = [];
    if (!k) return { out: ['Leiste fehlt'] };
    if (k.tagName !== 'OL' || k.closest('[aria-hidden="true"]')) out.push('Leiste ist keine lesbare Liste');
    const lis = [...k.querySelectorAll('li')];
    if (lis.length < 5 || lis.length > 6) out.push('Stationen: ' + lis.length);
    for (const li of lis) {
      const n = li.querySelector('.sk-name'); const q = n.getBoundingClientRect();
      if (q.width < 1 || parseFloat(getComputedStyle(n).fontSize) < 14) out.push('Name zu klein oder unsichtbar: ' + n.textContent);
      if (q.right > innerWidth + 0.5 || q.left < -0.5) out.push('Name ragt aus dem Fenster: ' + n.textContent);
      if (n.textContent.trim().split(/\\\\s+/).length > 3) out.push('Name über drei Wörter: ' + n.textContent);
      if (!li.querySelector('.sk-ico svg')) out.push('Symbol fehlt: ' + n.textContent);
    }
    if (document.documentElement.scrollWidth > innerWidth) out.push('Querscroll');
    return { out, namen: lis.map((l) => l.querySelector('.sk-name').textContent) };
  })()`);
  if (r.namen) {
    const sicht = await b.ev(`[...document.querySelectorAll('#shelfKette .sk-satz')].map((s) => { const q = s.getBoundingClientRect(); return { t: s.textContent.length, h: q.height, f: parseFloat(getComputedStyle(s).fontSize), r: q.right } })`);
    if (reduce) {
      for (const s of sicht) { if (s.h < 10 || s.f < 16) r.out.push('Satz nicht sichtbar oder unter 16 px'); if (s.r > 390 + (w === 1280 ? 900 : 1)) r.out.push('Satz ragt heraus'); }
    } else {
      const gesehen = [];
      await b.ev(`(() => { window.__ab = []; const k = document.getElementById('shelfKette'); new MutationObserver(() => { const i = [...k.querySelectorAll('li')].findIndex((l) => l.classList.contains('an')); if (i >= 0 && window.__ab[window.__ab.length - 1] !== i) window.__ab.push(i); }).observe(k, { attributes: true, subtree: true, attributeFilter: ['class'] }); })()`);
      await b.ev(`[...document.querySelectorAll('#shelfSvg rect[role=button]')][5].dispatchEvent(new MouseEvent('click', { bubbles: true }))`);
      await sleep(2500);
      const mitten = await b.ev(`({ satz: document.getElementById('shelfKetteSatz').textContent, f: parseFloat(getComputedStyle(document.getElementById('shelfKetteSatz')).fontSize) })`);
      if (mitten.f < 16 || mitten.satz.length < 10) r.out.push('Satz fehlt oder unter 16 px mitten im Durchlauf');
      await sleep(4500);
      const ab = await b.ev(`window.__ab`);
      if (ab.join() !== '0,1,2,3,4,5') r.out.push('Reihenfolge des Aufleuchtens: ' + ab.join(','));
    }
  }
  console.log(`Einkauf ${tag}: ${r.out.length} Fehler`);
  for (const f of r.out) fehler.push(`Einkauf ${tag}: ${f}`);
}
b.close();
if (fehler.length) { console.error('\nFehler (' + fehler.length + '):\n' + fehler.map((f) => '  X ' + f).join('\n')); process.exit(1); }
console.log('\nEinkauf: keine Fehler.');
