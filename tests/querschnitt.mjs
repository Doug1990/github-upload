// Prüft den Querschnitt (id tool) und die Begleiterin auf der Startseite.
// Aufruf: node tests/querschnitt.mjs [--chrome=<pfad>]
// 1) Beschriftungen der Ebenen (Kulturell, Digital, Physisch, Biologisch samt Unterzeile) werden nie überdeckt:
//    bei 1280, 768, 390 und 360 px, im Ausgangszustand, nach dem Auslösen von vier Aktivitäten (auch während der
//    Zeichenanimation), mit Störfall und mit Grundwasser schneidet keine Linie (Pfadpunkte) und keine Blase die
//    Beschriftungsflächen, und die Beschriftungen liegen im Zeichenraster über allen Linien.
// 2) Die Begleiterin (#descentFigure) ist nach dem Sprung per Klick auf jeden Kurzpfad-Link ausgeblendet
//    oder, beim Querschnitt, ganz oben.
import { start, sleep } from './chrome.mjs';

const b = await start();
const fehler = [];
const BREITEN = [1280, 768, 390, 360];

const PRUEFE = `(() => {
  const g = document.getElementById('graph');
  const rects = [...g.querySelectorAll('.band-label, .band-gloss')].map((t) => { const r = t.getBoundingClientRect(); return { n: t.textContent, l: r.left - 2, r: r.right + 2, t: r.top - 1, b: r.bottom + 1 }; });
  const treffer = (x, y) => rects.find((r) => x >= r.l && x <= r.r && y >= r.t && y <= r.b);
  const funde = [];
  const ctm = g.getScreenCTM();
  const pfade = [...g.querySelectorAll('path')].filter((p) => p.getAttribute('stroke') && p.getAttribute('stroke') !== 'none' && getComputedStyle(p).fill === 'none' && !p.closest('defs'));
  for (const p of pfade) {
    const L = p.getTotalLength();
    for (let s = 0; s <= L; s += 3) {
      const pt = p.getPointAtLength(s); const x = pt.x * ctm.a + ctm.e, y = pt.y * ctm.d + ctm.f;
      const h = treffer(x, y);
      if (h) { funde.push('Linie ' + (p.getAttribute('class') || 'pfad') + ' schneidet "' + h.n + '"'); break; }
    }
  }
  for (const l of g.querySelectorAll('line')) {
    const r = l.getBoundingClientRect();
    const h = rects.find((q) => r.right >= q.l && r.left <= q.r && r.bottom >= q.t && r.top <= q.b);
    if (h) funde.push('Linie schneidet "' + h.n + '"');
  }
  for (const c of g.querySelectorAll('circle.bloom')) {
    const r = c.getBoundingClientRect();
    const h = rects.find((q) => r.right >= q.l && r.left <= q.r && r.bottom >= q.t && r.top <= q.b);
    if (h) funde.push('Blase schneidet "' + h.n + '"');
  }
  // Zeichenraster: jede Beschriftung liegt hinter keiner Linie oder Form (Reihenfolge im DOM)
  const kinder = [...g.children];
  const letzteLinie = Math.max(-1, ...kinder.map((k, i) => (k.matches('path[stroke]') ? i : -1)));
  for (const t of g.querySelectorAll('.band-label, .band-gloss')) {
    const wurzel = kinder.find((k) => k.contains(t));
    if (kinder.indexOf(wurzel) < letzteLinie) funde.push('Beschriftung "' + t.textContent + '" liegt unter einer Linie');
  }
  return { n: rects.length, funde: [...new Set(funde)] };
})()`;

for (const w of BREITEN) {
  await b.open('index.html', w);
  await b.ev(`document.getElementById('graph').scrollIntoView({ behavior: 'instant', block: 'center' })`);
  await sleep(600);
  const melde = new Set();
  const pruefe = async (zustand) => { const r = await b.ev(PRUEFE); if (r.n < 8) melde.add(zustand + ': nur ' + r.n + ' Beschriftungen gefunden'); for (const f of r.funde) melde.add(zustand + ': ' + f); };
  await pruefe('Ausgang');
  for (const name of ['Zocken', 'Musik-Streaming', 'Kind in die Kita bringen', 'Eine KI etwas fragen', 'Kaffee kochen', 'Bahn fahren', 'Radfahren']) {
    await b.ev(`[...document.querySelectorAll('#graph .activity-group')].find((e) => e.getAttribute('aria-label') === ${JSON.stringify(name)}).dispatchEvent(new MouseEvent('click', { bubbles: true }))`);
    for (let i = 0; i < 4; i++) { await sleep(150); await pruefe('nach ' + name + ' (Animation)'); }
  }
  const aktiv = await b.ev(`document.querySelectorAll('#graph path.root-path').length`);
  if (aktiv < 12) melde.add('zu wenige Wurzeln gezeichnet: ' + aktiv);
  await b.ev(`document.querySelectorAll('#graph .crack-icon').forEach((e) => e.dispatchEvent(new MouseEvent('click', { bubbles: true })))`);
  await sleep(1300); await pruefe('mit Störfall');
  await b.ev(`document.getElementById('groundwaterToggle').click()`);
  await sleep(1300); await pruefe('mit Grundwasser');
  await b.ev(`document.getElementById('groundwaterToggle').click()`);
  console.log(`Querschnitt ${w} px: ${aktiv} Wurzeln, ${melde.size} Überdeckungen`);
  for (const f of melde) fehler.push(`Querschnitt ${w} px, ${f}`);
}

// Begleiterin nach Sprung per Kurzpfad-Link
const ZIELE = ['tool', 'journey', 'shelfScene', 'chainGame', 'belonging', 'now', 'cubeSection'];
for (const w of [1280, 1024]) {
  await b.open('index.html', w);
  for (const id of ZIELE) {
    await b.ev(`scrollTo({ top: 0, behavior: 'instant' })`);
    await sleep(400);
    await b.ev(`document.querySelector('#kurz a[href="#${id}"]').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))`);
    await sleep(1800);
    const r = await b.ev(`(() => { const f = document.getElementById('descentFigure'); if (!f) return { fehlt: true }; const cs = getComputedStyle(f); const r = f.getBoundingClientRect(); const sichtbar = cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0.05; const s = document.getElementById('tool'); return { sichtbar, top: r.top, vh: innerHeight, ab: scrollY, toolTop: s.getBoundingClientRect().top }; })()`);
    if (r.fehlt) { fehler.push('#descentFigure fehlt'); continue; }
    const ok = !r.sichtbar || (id === 'tool' && r.top / r.vh <= 0.2);
    console.log(`Sprung zu ${id} (${w} px): Figur ${r.sichtbar ? 'sichtbar bei ' + Math.round(r.top / r.vh * 100) + ' vh' : 'ausgeblendet'}`);
    if (!ok) fehler.push(`Sprung zu ${id} (${w} px): Figur ${r.sichtbar ? 'steht bei ' + Math.round(r.top / r.vh * 100) + ' vh' : 'unerwartet'}`);
  }
}
b.close();
if (fehler.length) { console.error('\nFehler (' + fehler.length + '):\n' + fehler.map((f) => '  X ' + f).join('\n')); process.exit(1); }
console.log('\nQuerschnitt: keine Fehler.');
