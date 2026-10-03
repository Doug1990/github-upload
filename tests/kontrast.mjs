// Kontrastmessung: für jeden sichtbaren Textknoten (außer SVG-Text und Canvas) wird die Vordergrundfarbe
// gegen die effektive Hintergrundfarbe gemessen. Hintergrund = nächster deckender Hintergrund, halbtransparente
// Schichten davor werden aufgerechnet, bei Verläufen zählen alle Farbstopps (schlechtester Fall).
// Grenzwerte: 4,5:1 normaler Text, 3:1 großer Text (ab 24 px oder 18,66 px fett).
// Danach werden die Seiten per Klick in weitere Zustände gebracht (Details offen, Bauteile, Schalter, Themes,
// alle Knöpfe, siehe chrome.mjs) und jeweils neu gemessen. Ein Verstoß wird dem Schritt zugeordnet, nach dem er
// zuerst auftrat. Mit --ohne-zustaende wird nur der Ausgangszustand gemessen.
// Aufruf: node tests/kontrast.mjs [--breiten=1280,390] [--seite=zelle.html] [--ohne-zustaende] [--chrome=<pfad>]
// Exit-Code 1 bei Verstößen.
import { start, arg, sleep, zustandsSchritte } from './chrome.mjs';

const widths = (arg('breiten') || '1280,390').split(',').map(Number);
const only = arg('seite');
const b = await start();

const MEASURE = `(() => {
  const parse = (s) => {
    s = s.trim(); let m;
    if ((m = s.match(/^rgba?\\(([^)]+)\\)/))) { const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(parseFloat); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
    if ((m = s.match(/^color\\(srgb ([^)]+)\\)/))) { const p = m[1].split(/[ \\/]+/).filter(Boolean).map(parseFloat); return [p[0]*255, p[1]*255, p[2]*255, p.length > 3 ? p[3] : 1]; }
    return null;
  };
  const over = (top, base) => { const a = top[3]; return [top[0]*a + base[0]*(1-a), top[1]*a + base[1]*(1-a), top[2]*a + base[2]*(1-a), 1]; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126*f(c[0]) + 0.7152*f(c[1]) + 0.0722*f(c[2]); };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const sel = (e) => { let s = e.tagName.toLowerCase(); if (e.id) s += '#' + e.id; else if (e.classList.length) s += '.' + [...e.classList].slice(0, 2).join('.'); return s; };
  const hex = (c) => '#' + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  // Kandidaten für den Hintergrund eines Elements
  const bgCandidates = (el) => {
    const layers = [];
    let base = null;
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e);
      const img = cs.backgroundImage;
      const col = parse(cs.backgroundColor);
      let stops = null;
      if (img && /gradient/.test(img)) {
        stops = (img.match(/(rgba?\\([^)]*\\)|color\\(srgb[^)]*\\))/g) || []).map(parse).filter(Boolean);
        if (!stops.length) stops = null;
      }
      if (stops) {
        const under = col && col[3] > 0 ? col : null;
        const cands = stops.map((s) => (under && under[3] >= 0.99 && s[3] < 1 ? over(s, under) : s));
        if (cands.every((c) => c[3] >= 0.99)) { base = cands; break; }
        layers.push({ cands }); continue;
      }
      if (col && col[3] > 0) { if (col[3] >= 0.99) { base = [col]; break; } layers.push({ cands: [col] }); }
    }
    let cands = base || [[255, 255, 255, 1]];
    for (const l of layers.reverse()) cands = cands.flatMap((c) => l.cands.map((t) => over(t, c)));
    return cands;
  };
  const out = []; const seen = new Set(); let total = 0;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const n = walker.currentNode; const txt = n.textContent.replace(/\\s+/g, ' ').trim();
    if (!txt) continue;
    const el = n.parentElement;
    if (!el || el.closest('svg, canvas, script, style, noscript, option, :disabled, [aria-disabled=true]')) continue;
    if (!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
    const r = document.createRange(); r.selectNodeContents(n); const bb = r.getBoundingClientRect();
    if (bb.width < 1 || bb.height < 1) continue;
    const cs = getComputedStyle(el);
    // laufende Animationen (Ein- und Ausblenden) zählen nicht, gemessen wird der Endzustand
    let op = 1; for (let e = el; e; e = e.parentElement) { if (e.getAnimations().some((a) => a.playState === 'running')) continue; op *= parseFloat(getComputedStyle(e).opacity); }
    if (op < 0.05) continue;
    const fg0 = parse(cs.color); if (!fg0) continue;
    const size = parseFloat(cs.fontSize), weight = parseInt(cs.fontWeight) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const need = large ? 3 : 4.5;
    total++;
    let worst = Infinity, wFg = null, wBg = null;
    for (const bg of bgCandidates(el)) {
      let fg = fg0[3] < 1 ? over(fg0, bg) : fg0;
      if (op < 1) fg = over([fg[0], fg[1], fg[2], op], bg);
      const rt = ratio(fg, bg);
      if (rt < worst) { worst = rt; wFg = fg; wBg = bg; }
    }
    if (worst < need) {
      const key = sel(el) + hex(wFg) + hex(wBg);
      if (seen.has(key)) continue; seen.add(key);
      out.push({ sel: sel(el), text: txt.slice(0, 40), fg: hex(wFg), bg: hex(wBg), ratio: Math.round(worst * 100) / 100, need, size });
    }
  }
  return { total, out };
})()`;

let bad = 0; const summary = [];
for (const page of b.pages) {
  if (only && page !== only) continue;
  for (const w of widths) {
    await b.open(page, w);
    const r = await b.ev(MEASURE);
    r.out.sort((x, y) => x.ratio - y.ratio);
    const bekannt = new Set(r.out.map((v) => [v.sel, v.fg, v.bg, v.text].join('|')));
    let n = r.out.length, schlecht = r.out[0]?.ratio, knoten = r.total;
    for (const v of r.out) { bad++; console.log(`  X ${page} @${w}px ${v.sel} "${v.text}" ${v.fg} auf ${v.bg} = ${v.ratio}:1 (nötig ${v.need}:1, ${v.size}px)`); }
    let schritte = 0;
    if (!process.argv.includes('--ohne-zustaende')) {
      for (const s of await zustandsSchritte(b)) {
        schritte++;
        await s.run(); await sleep(900);
        const z = await b.ev(MEASURE);
        knoten = Math.max(knoten, z.total);
        z.out.sort((x, y) => x.ratio - y.ratio);
        for (const v of z.out) {
          const key = [v.sel, v.fg, v.bg, v.text].join('|');
          if (bekannt.has(key)) continue; bekannt.add(key);
          n++; bad++; schlecht = Math.min(schlecht ?? Infinity, v.ratio);
          console.log(`  X ${page} @${w}px [nach: ${s.name}] ${v.sel} "${v.text}" ${v.fg} auf ${v.bg} = ${v.ratio}:1 (nötig ${v.need}:1, ${v.size}px)`);
        }
      }
    }
    summary.push(`${page} @${w}px: bis zu ${knoten} Textknoten, ${schritte} Zustandsschritte, ${n} Verstöße, schlechtester Wert ${schlecht ?? '-'}`);
  }
}
console.log('\n' + summary.join('\n'));
console.log(bad ? `\n${bad} Verstöße.` : '\nKeine Kontrastverstöße.');
b.close();
process.exit(bad ? 1 : 0);
