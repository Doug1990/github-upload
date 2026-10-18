// Prüft Inhalt und Verweise der Startseite (index.html).
// Aufruf: node tests/startseite.mjs [--chrome=<pfad>]
// Außerdem: index.html enthält keinen Link auf zelle.html.
// Kurzpfad ("Das Wichtigste in Kürze"): sieben Stationen mit Kernaussage (höchstens 14 Wörter), aria-label mit Kernaussage,
// Tippfläche mindestens 44 px, Text liegt im Bild, Schrift wirksam mindestens 12 px, das Wort optional ist weg, kein Querscroll.
import fs from 'node:fs';
import { start, sleep } from './chrome.mjs';

const b = await start();
const fehler = [];

// Kurzpfad: sieben Stationen mit Kernaussage (höchstens 14 Wörter), Tippfläche mindestens 44 px, Text liegt im Bild, kein Querscroll
for (const w of [1280, 390]) {
  await b.open('index.html', w);
  const r = await b.ev(`(() => {
    const svg = document.querySelector('.kp-bild'); const sr = svg.getBoundingClientRect(); const out = [];
    const links = [...svg.querySelectorAll('a[role=link]')];
    if (links.length !== 7) out.push('Stationen: ' + links.length);
    for (const a of links) {
      const ks = [...a.querySelectorAll('text.kp-k')].map((t) => t.textContent.trim()).join(' ');
      const wörter = ks.split(/\\s+/).filter(Boolean).length;
      if (wörter < 3 || wörter > 14) out.push(a.getAttribute('href') + ': Kernaussage mit ' + wörter + ' Wörtern');
      if (!a.getAttribute('aria-label').includes(ks)) out.push(a.getAttribute('href') + ': aria-label ohne Kernaussage');
      const h = a.querySelector('.kp-hit').getBoundingClientRect(); if (h.height < 43.5) out.push(a.getAttribute('href') + ': Tippfläche ' + Math.round(h.height) + ' px');
      for (const t of a.querySelectorAll('text')) { const q = t.getBoundingClientRect(); if (q.right > sr.right + 0.5 || q.left < sr.left) out.push(a.getAttribute('href') + ': Text ragt aus dem Bild: ' + t.textContent); if (parseFloat(getComputedStyle(t).fontSize) * (sr.width / 320) < 12) out.push(a.getAttribute('href') + ': Schrift unter 12 px wirksam'); }
    }
    if (/optional/.test(svg.textContent)) out.push('Wort optional steht noch da');
    if (document.documentElement.scrollWidth > innerWidth) out.push('Querscroll');
    return out;
  })()`);
  console.log(`Kurzpfad ${w} px: ${r.length} Fehler`);
  for (const f of r) fehler.push(`Kurzpfad ${w} px: ${f}`);
}

// Die Startseite verlinkt nicht auf die Zell-Seite
{
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const treffer = html.match(/href=["']zelle\.html[^"']*["']/g) || [];
  console.log(`Links zur Zell-Seite in index.html: ${treffer.length}`);
  if (treffer.length) fehler.push('index.html enthält Links zu zelle.html: ' + treffer.join(', '));
}
b.close();
if (fehler.length) { console.error('\nFehler (' + fehler.length + '):\n' + fehler.map((f) => '  X ' + f).join('\n')); process.exit(1); }
console.log('\nStartseite: keine Fehler.');
