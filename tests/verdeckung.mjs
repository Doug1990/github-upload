// Prüft, ob fixierte oder klebrige Elemente (position fixed oder sticky) sichtbaren Inhalt verdecken.
// Aufruf: node tests/verdeckung.mjs [--chrome=<pfad>]
// Je Seite (alle .html außer Impressum und Datenschutz) bei 390 und 360 px, je Scrollposition in Schritten von 400 px:
//   Ziele sind sichtbare Knöpfe, Links, Eingabefelder, Zusammenfassungen und Textzeilen (Textblöcke je Zeilenrechteck).
//   Teile des Schwebe-Elements sind es selbst und seine sichtbaren Nachfahren mit Knopf, Text, Hintergrund oder Rand.
//   Überlappen sich ein Ziel und ein Teil (mindestens 4 mal 4 px) und liegt das Teil dort laut elementFromPoint oben,
//   ist das ein Fehler. Ausnahme: Ziel und Schwebe-Element gehören zusammen (Ziel liegt im Schwebe-Element).
// Fehler (Exit-Code 1): ein Schwebe-Element verdeckt einen Knopf, Link oder Text.
import { start, sleep } from './chrome.mjs';

const b = await start();
const fehler = [];
const SEITEN = b.pages.filter((p) => !['impressum.html', 'datenschutz.html'].includes(p));
const BREITEN = [390, 360];

const PRUEFE = `(() => {
  const vw = innerWidth, vh = innerHeight;
  const sichtbar = (e) => e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
  const schwebend = (e) => { const p = getComputedStyle(e).position; return p === 'fixed' || p === 'sticky'; };
  const effOpacity = (e, bis) => { let o = 1; for (let n = e; n && n !== bis.parentElement; n = n.parentElement) o *= +getComputedStyle(n).opacity; return o; };
  const beschr = (e) => (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\\s+/).slice(0, 2).join('.') : '') || e.tagName.toLowerCase();
  const schneide = (r) => { const l = Math.max(r.left, 0), t = Math.max(r.top, 0), rr = Math.min(r.right, vw), bb = Math.min(r.bottom, vh); return rr - l >= 4 && bb - t >= 4 ? { left: l, top: t, right: rr, bottom: bb } : null; };
  const alle = [...document.body.querySelectorAll('*')].filter((e) => !(e instanceof SVGElement));
  const schweber = alle.filter((e) => schwebend(e) && !e.closest('svg') && sichtbar(e));
  // Nur äußerste Schwebe-Elemente zählen, die Teile werden aus den Nachfahren gebildet
  const wurzeln = schweber.filter((e) => !schweber.some((o) => o !== e && o.contains(e)));
  const teile = [];
  for (const w of wurzeln) {
    for (const e of [w, ...w.querySelectorAll('*')]) {
      if (e instanceof SVGElement || !sichtbar(e) || effOpacity(e, w) < 0.05) continue;
      const cs = getComputedStyle(e);
      if (cs.pointerEvents === 'none') continue;
      const knopf = e.matches('button, a[href], input, select, textarea, summary, [role=button], [tabindex]');
      const text = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      const hg = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent';
      const rand = parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none';
      const bild = e.matches('img, canvas, video');
      if (!(knopf || text || hg || rand || bild)) continue;
      const r = schneide(e.getBoundingClientRect());
      if (r) teile.push({ e, w, r });
    }
  }
  if (!teile.length) return { teile: 0, funde: [] };
  const ziele = [];
  for (const e of alle) {
    if (!sichtbar(e) || schwebend(e) || e.closest('[aria-hidden="true"], [inert], svg')) continue;
    if (e.closest('details:not([open])') && !e.closest('summary') && !e.matches('details')) continue;
    if (effOpacity(e, document.body) < 0.2) continue;
    const knopf = e.matches('button, a[href], input:not([type=hidden]), select, textarea, summary, [role=button]');
    if (knopf) { const r = schneide(e.getBoundingClientRect()); if (r) ziele.push({ e, art: 'Knopf', r }); continue; }
    if (e.closest('button, a[href], summary')) continue;
    const knoten = [...e.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim());
    for (const n of knoten) {
      const rg = document.createRange(); rg.selectNodeContents(n);
      for (const rc of rg.getClientRects()) { const r = schneide(rc); if (r) ziele.push({ e, art: 'Text', r, text: n.textContent.trim().slice(0, 40) }); }
    }
  }
  const funde = new Map();
  for (const z of ziele) {
    for (const t of teile) {
      if (t.w.contains(z.e) || z.e.contains(t.w)) continue;
      const l = Math.max(z.r.left, t.r.left), tp = Math.max(z.r.top, t.r.top), rr = Math.min(z.r.right, t.r.right), bb = Math.min(z.r.bottom, t.r.bottom);
      if (rr - l < 4 || bb - tp < 4) continue;
      const top = document.elementFromPoint((l + rr) / 2, (tp + bb) / 2);
      if (!top || !t.w.contains(top)) continue;
      const k = beschr(t.w) + ' verdeckt ' + z.art + ' ' + beschr(z.e) + (z.text ? ' "' + z.text + '"' : '');
      if (!funde.has(k)) funde.set(k, 1);
    }
  }
  return { teile: teile.length, funde: [...funde.keys()] };
})()`;

for (const page of SEITEN) {
  for (const breite of BREITEN) {
    await b.open(page, breite);
    const hoehe = await b.ev('document.documentElement.scrollHeight');
    const ihoehe = await b.ev('innerHeight');
    const melde = new Map();
    let schritte = 0, teile = 0;
    for (let y = 0; y <= Math.max(0, hoehe - ihoehe) + 399; y += 400) {
      await b.ev(`scrollTo({ top: ${y}, behavior: 'instant' })`);
      await sleep(120);
      const r = await b.ev(PRUEFE);
      schritte++; teile = Math.max(teile, r.teile);
      for (const f of r.funde) if (!melde.has(f)) melde.set(f, y);
    }
    console.log(`${page} ${breite} px: ${schritte} Positionen, bis ${teile} Teile von Schwebe-Elementen, ${melde.size} Verdeckungen`);
    for (const [f, y] of melde) fehler.push(`${page} ${breite} px bei Scroll ${y}: ${f}`);
  }
}
b.close();
if (fehler.length) { console.error('\nFehler (' + fehler.length + '):\n' + fehler.map((f) => '  X ' + f).join('\n')); process.exit(1); }
console.log('\nVerdeckung: keine Fehler.');
