// Prüft die Seite raetsel.html: fünf Rätsel mit drei Hinweisen und vier Antworten, Hinweise nacheinander, richtige und falsche Antwort,
// Lösung ohne Skript sichtbar, Bedienung nur mit der Tastatur, Tippflächen unter 44 px bei 390 px, Überlauf.
// Aufruf: node tests/raetsel.mjs [--chrome=<pfad>]
import { start } from './chrome.mjs';

const b = await start();
const fehler = [];
for (const w of [1280, 390]) {
  await b.open('raetsel.html', w);
  const r = await b.ev(`(() => {
    const k = [...document.querySelectorAll('.rt')];
    const sicht = (e, s) => [...e.querySelectorAll(s)].filter((x) => x.getBoundingClientRect().height > 0).length;
    const o = { n: k.length, hinw: k.map((e) => e.querySelectorAll('.rt-h').length), opt: k.map((e) => e.querySelectorAll('.rt-a').length) };
    o.h0 = sicht(k[0], '.rt-h'); k[0].querySelector('.rt-mehr').click(); o.h1 = sicht(k[0], '.rt-h'); k[0].querySelector('.rt-mehr').click(); o.h2 = sicht(k[0], '.rt-h'); o.mehrWeg = k[0].querySelector('.rt-mehr').hidden;
    const a = [...k[0].querySelectorAll('.rt-a')];
    a.find((x) => x.textContent === 'Archiv').click(); o.falsch = k[0].querySelector('.rt-fb').textContent; o.stand0 = document.getElementById('rtStand').textContent;
    a.find((x) => x.textContent === 'Kraftwerk').click(); o.richtig = k[0].querySelector('.rt-fb').textContent; o.stand1 = document.getElementById('rtStand').textContent;
    k.slice(1).forEach((e) => e.querySelector('.rt-a[class*=rt-a]') && [...e.querySelectorAll('.rt-a')].find((x) => x.textContent === e.getAttribute('data-loesung')).click());
    o.stand5 = document.getElementById('rtStand').textContent;
    o.klein = [...document.querySelectorAll('.rt-b')].filter((x) => x.getBoundingClientRect().height > 0).map((e) => [e.textContent.slice(0, 12), Math.round(e.getBoundingClientRect().height)]).filter((x) => x[1] < 44);
    o.ueber = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    return o;
  })()`);
  const j = JSON.stringify;
  if (r.n !== 5 || r.hinw.some((x) => x !== 3) || r.opt.some((x) => x !== 4)) fehler.push(`@${w}px Rätsel ${r.n}, Hinweise ${j(r.hinw)}, Antworten ${j(r.opt)}`);
  if (r.h0 !== 1 || r.h1 !== 2 || r.h2 !== 3 || !r.mehrWeg) fehler.push(`@${w}px Hinweise nacheinander: ${r.h0}, ${r.h1}, ${r.h2}, Knopf weg ${r.mehrWeg}`);
  if (!/Das war es nicht/.test(r.falsch) || !/0 von 5/.test(r.stand0)) fehler.push(`@${w}px falsche Antwort: ${r.falsch} / ${r.stand0}`);
  if (!/^Richtig\. Gesucht: Kraftwerk in der Stadt, Mitochondrium in der Zelle/.test(r.richtig) || !/1 von 5/.test(r.stand1)) fehler.push(`@${w}px richtige Antwort: ${r.richtig} / ${r.stand1}`);
  if (!/Alle fünf gelöst/.test(r.stand5)) fehler.push(`@${w}px Schluss: ${r.stand5}`);
  if (w === 390) { for (const x of r.klein) fehler.push(`@390px Tippfläche unter 44 px: ${j(x)}`); if (r.ueber > 0) fehler.push(`@390px horizontaler Überlauf ${r.ueber} px`); }
}
// Tastatur: Tab erreicht Hinweis-Knopf und Antworten, Enter wählt
await b.open('raetsel.html', 1280);
const tab = await b.ev(`(() => { const e = document.querySelector('.rt .rt-a'); e.focus(); return document.activeElement === e; })()`);
if (!tab) fehler.push('Antwortknopf nicht fokussierbar');
// Ohne Skript: alle Hinweise und Lösungen sichtbar
await b.send('Emulation.setScriptExecutionDisabled', { value: true });
await b.send('Page.navigate', { url: `${b.BASE}/raetsel.html` });
await new Promise((r) => setTimeout(r, 900));
const ohne = await b.ev(`({ h: [...document.querySelectorAll('.rt-h')].filter((e) => e.getBoundingClientRect().height > 0).length, l: [...document.querySelectorAll('.rt-loesung')].filter((e) => e.getBoundingClientRect().height > 0).length })`);
if (ohne.h !== 15 || ohne.l !== 5) fehler.push(`ohne Skript sichtbar: ${ohne.h} von 15 Hinweisen, ${ohne.l} von 5 Lösungen`);
await b.close();
if (fehler.length) { console.log('Fehler (' + fehler.length + '):'); fehler.forEach((f) => console.log('  X ' + f)); process.exit(1); }
console.log('Rätsel: keine Fehler.');
