// Prüft Seiten bei 320 px Breite (entspricht 400 Prozent Zoom auf 1280 px) mit Schrift auf 150 Prozent.
// Aufruf: node tests/zoom.mjs [--seite=<datei>] [--faktor=1.5] [--chrome=<pfad>]
// Fehler (Exit-Code 1): horizontales Scrollen der Seite, abgeschnittener Text in Knöpfen, Kennzahlen, Kästen und Feldern (Inhalt größer als Kasten bei
// hidden), Knöpfe oder Eingaben, die ganz oder teilweise außerhalb des Fensters liegen.
import { start, arg } from './chrome.mjs';

const FAKTOR = parseFloat(arg('faktor')) || 1.5;
const b = await start();
const nur = arg('seite');
const fehler = [];
for (const seite of (nur ? [nur] : b.pages)) {
  await b.open(seite, 320);
  await b.ev(`(() => {
    const f = ${FAKTOR};
    const list = [...document.querySelectorAll('body *')].filter((e) => !e.closest('svg') || e.tagName === 'svg');
    const werte = list.map((e) => parseFloat(getComputedStyle(e).fontSize));
    list.forEach((e, i) => { if (!e.closest('svg')) e.style.setProperty('font-size', (werte[i] * f) + 'px', 'important'); });
  })()`);
  await new Promise((r) => setTimeout(r, 600));
  const r = await b.ev(`(() => {
    const sel = (e) => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.getAttribute('class') ? '.' + e.getAttribute('class').trim().split(/\\s+/)[0] : '') + ' "' + e.textContent.trim().slice(0, 22) + '" in ' + ((e.closest('section[id]') || {}).id || '-');
    const sichtbar = (e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && e.checkVisibility && e.checkVisibility({ checkVisibilityCSS: true }); };
    const out = { sw: document.documentElement.scrollWidth, iw: innerWidth };
    const scroller = (e) => { for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) { if (/auto|scroll/.test(getComputedStyle(p).overflowX)) return true; } return false; };
    out.ausserhalb = [...document.querySelectorAll('button, a[href], input, select, textarea, [role=button]')].filter((e) => sichtbar(e) && !e.closest('svg') && !scroller(e) && !['fixed', 'sticky'].includes(getComputedStyle(e).position) && (e.getBoundingClientRect().right > innerWidth + 1 || e.getBoundingClientRect().left < -1)).map(sel).slice(0, 8);
    out.abgeschnitten = [...document.querySelectorAll('button, .stat, .stat span, .stat small, .btn, .inst-btn, .chip, label, output, .col, .panel p, li, td, th')].filter((e) => {
      if (!sichtbar(e) || e.closest('svg') || scroller(e)) return false;
      const c = getComputedStyle(e); const k = /hidden|clip/.test(c.overflowX) || /hidden|clip/.test(c.overflowY) || c.textOverflow === 'ellipsis';
      return k && (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1);
    }).map(sel).slice(0, 8);
    return out;
  })()`);
  if (r.sw > r.iw + 1) fehler.push(`${seite}: horizontales Scrollen (${r.sw} > ${r.iw})`);
  for (const x of r.ausserhalb) fehler.push(`${seite}: außerhalb des Fensters: ${x}`);
  for (const x of r.abgeschnitten) fehler.push(`${seite}: abgeschnittener Text: ${x}`);
  console.log(`${seite}: geprüft`);
}
await b.close();
const eindeutig = [...new Set(fehler)];
if (eindeutig.length) { console.log('Fehler (' + eindeutig.length + '):'); eindeutig.forEach((f) => console.log('  X ' + f)); process.exit(1); }
console.log('Zoom: keine Fehler.');
