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

// Hero-Grafik: vier Beispiele, Schrift wirksam mindestens 12 px, Überschriften bleiben frei, Reduced Motion zeigt die Endstelle
const HERO = `(() => {
  const svg = document.querySelector('.hero-bild'); const sr = svg.getBoundingClientRect(); const out = [];
  const gs = [...svg.querySelectorAll('g')];
  if (gs.length !== 4) out.push('Linien: ' + gs.length);
  const starts = gs.map((g) => g.querySelector('path').getAttribute('d').split('H')[0].split(' ')[0]);
  if (new Set(starts).size !== 1) out.push('Linien beginnen verschieden: ' + starts.join(' '));
  const ende = gs.map((g) => g.querySelector('path').getAttribute('d').split('H')[1]);
  if (new Set(ende).size !== 1) out.push('Linien enden verschieden');
  const label = svg.getAttribute('aria-label');
  const heads = [];
  for (const g of gs) {
    const ts = [...g.querySelectorAll('text')]; const bsp = g.querySelector('.b-bsp');
    if (!bsp || bsp.textContent.trim().split(/\\s+/).length > 2) out.push('Beispiel fehlt oder mehr als zwei Wörter');
    else if (!label.includes(bsp.textContent.trim().replace('-App', '').toLowerCase().replace(/^./, (c) => c) ) && !label.toLowerCase().includes(bsp.textContent.trim().toLowerCase())) out.push('aria-label ohne ' + bsp.textContent);
    for (const t of ts) { const q = t.getBoundingClientRect(); if (parseFloat(getComputedStyle(t).fontSize) * (sr.width / 320) < 12) out.push('Schrift unter 12 px wirksam: ' + t.textContent); if (q.left < sr.left - 0.5 || q.right > sr.right + 0.5) out.push('Text ragt aus dem Bild: ' + t.textContent); }
    heads.push({ n: ts[0].textContent, r: ts[0].getBoundingClientRect() });
  }
  const treffer = (a, b) => a.right > b.left && a.left < b.right && a.bottom > b.top && a.top < b.bottom;
  for (const h of heads) {
    for (const g of gs) {
      for (const e of g.querySelectorAll('path, circle, text.b-bsp')) if (treffer(h.r, e.getBoundingClientRect())) out.push('Überschrift "' + h.n + '" überdeckt');
    }
  }
  const dots = [...svg.querySelectorAll('.b-fluss')].map((c) => { const q = c.getBoundingClientRect(); return (q.left + q.right) / 2; });
  const stand = [...svg.querySelectorAll('g')].map((g) => { const q = [...g.querySelectorAll('circle')][1].getBoundingClientRect(); return (q.left + q.right) / 2; });
  return { out, dots, stand };
})()`;
for (const [w, reduce] of [[1280, false], [390, false], [360, false], [390, true]]) {
  await b.open('index.html', w, { reduce });
  await b.ev(`document.querySelector('.hero-bild').scrollIntoView({ behavior: 'instant', block: 'center' })`);
  await sleep(800);
  const r = await b.ev(HERO);
  if (reduce) r.dots.forEach((d, i) => { if (Math.abs(d - r.stand[i]) > 1.5) r.out.push('Reduced Motion: laufender Punkt ' + (i + 1) + ' steht nicht an der Endstelle'); });
  console.log(`Hero-Grafik ${w} px${reduce ? ' (Reduced Motion)' : ''}: ${r.out.length} Fehler`);
  for (const f of r.out) fehler.push(`Hero-Grafik ${w} px${reduce ? ' reduziert' : ''}: ${f}`);
}
b.close();
if (fehler.length) { console.error('\nFehler (' + fehler.length + '):\n' + fehler.map((f) => '  X ' + f).join('\n')); process.exit(1); }
console.log('\nQuerschnitt: keine Fehler.');
