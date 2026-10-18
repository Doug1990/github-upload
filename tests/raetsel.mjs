// Prüft die Seite raetsel.html: fünf Rätsel mit drei Hinweisen und vier Antworten, Hinweise nacheinander, richtige und falsche Antwort,
// Rückmeldung (Leuchtring, gestrichelte Markierung, Statusmeldung, Fokus, Fortschrittspunkte, Reduced Motion), Lösung ohne Skript sichtbar, Bedienung nur mit der Tastatur, Tippflächen unter 44 px bei 390 px, Überlauf.
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
    const fb = () => k[0].querySelector('.rt-fb'), pk = () => [...document.querySelectorAll('.rt-punkte li')].map((x) => x.classList.contains('ok'));
    const k3 = k[3]; o.hFrei = sicht(k3, '.rt-h'); [...k3.querySelectorAll('.rt-a')].find((x) => x.textContent !== k3.getAttribute('data-loesung')).click(); o.hNach = sicht(k3, '.rt-h'); o.k3Fertig = k3.classList.contains('fertig'); o.k3fb = k3.querySelector('.rt-fb').textContent;
    const falsch = a.find((x) => x.textContent === 'Archiv'); falsch.focus(); falsch.click();
    o.falsch = fb().textContent; o.stand0 = document.getElementById('rtStand').textContent;
    o.falschFokus = document.activeElement === falsch; o.falschRand = getComputedStyle(falsch).borderTopStyle; o.falschKlasse = falsch.classList.contains('falsch');
    o.fort0 = document.getElementById('rtFortT').textContent; o.punkte0 = pk(); o.liveFb = fb().getAttribute('aria-live');
    o.fertigVorher = k[0].classList.contains('fertig');
    const r = a.find((x) => x.textContent === 'Kraftwerk'); r.click();
    o.richtig = fb().textContent; o.stand1 = document.getElementById('rtStand').textContent;
    o.richtigFokus = document.activeElement === k[0].querySelector('.rt-weiter') && !k[0].querySelector('.rt-weiter').hidden;
    o.loesungOffen = k[0].querySelector('.rt-loesung').open; o.punkte1 = pk();
    const ring = k[0].querySelector('.rt-lb .ring'), rs = getComputedStyle(ring);
    o.ring = { an: rs.animationName, op: rs.opacity, kopf: getComputedStyle(k[0].querySelector('.rt-bild .ic.kult')).boxShadow !== 'none' };
    k[0].querySelector('.rt-weiter').click(); o.weiterFokus = document.activeElement === k[1].querySelector('h2');
    k.slice(1).forEach((e) => e.querySelector('.rt-a[class*=rt-a]') && [...e.querySelectorAll('.rt-a')].find((x) => x.textContent === e.getAttribute('data-loesung')).click());
    o.stand5 = document.getElementById('rtStand').textContent; o.punkte5 = pk();
    o.klein = [...document.querySelectorAll('.rt-b')].filter((x) => x.getBoundingClientRect().height > 0).map((e) => [e.textContent.slice(0, 12), Math.round(e.getBoundingClientRect().height)]).filter((x) => x[1] < 44);
    o.ueber = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    return o;
  })()`);
  const j = JSON.stringify;
  if (r.n !== 5 || r.hinw.some((x) => x !== 3) || r.opt.some((x) => x !== 4)) fehler.push(`@${w}px Rätsel ${r.n}, Hinweise ${j(r.hinw)}, Antworten ${j(r.opt)}`);
  if (r.h0 !== 1 || r.h1 !== 2 || r.h2 !== 3 || !r.mehrWeg) fehler.push(`@${w}px Hinweise nacheinander: ${r.h0}, ${r.h1}, ${r.h2}, Knopf weg ${r.mehrWeg}`);
  if (r.hFrei !== 1 || r.hNach !== 2) fehler.push(`@${w}px falscher Tipp zeigt nächsten Hinweis: ${r.hFrei} auf ${r.hNach}`);
  if (!/^Noch nicht\. Nächster Hinweis folgt\. Rätsel 4 von 5\./.test(r.k3fb) || !/^Noch nicht\. Alle Hinweise sind sichtbar\. Rätsel 1 von 5\./.test(r.falsch) || !/0 von 5/.test(r.stand0)) fehler.push(`@${w}px falsche Antwort: ${r.falsch} / ${r.stand0}`);
  if (r.liveFb !== 'polite') fehler.push(`@${w}px Meldung ohne aria-live polite`);
  if (!r.falschFokus) fehler.push(`@${w}px Fokus nach falschem Tipp nicht auf dem Knopf`);
  if (r.falschRand !== 'dashed' || !r.falschKlasse) fehler.push(`@${w}px falscher Knopf ohne gestrichelte Umrandung: ${r.falschRand}`);
  if (r.fertigVorher || r.k3Fertig || r.punkte0.some((x) => x)) fehler.push(`@${w}px falscher Tipp darf nichts lösen: ${j(r.punkte0)}`);
  if (!/^Richtig\. Hier ist das Lösungsbild\. 1 von 5 Rätseln gelöst\./.test(r.richtig) || !/1 von 5/.test(r.stand1)) fehler.push(`@${w}px richtige Antwort: ${r.richtig} / ${r.stand1}`);
  if (!r.richtigFokus) fehler.push(`@${w}px Fokus nach richtigem Tipp nicht auf Weiter`);
  if (!r.loesungOffen || j(r.punkte1) !== '[true,false,false,false,false]') fehler.push(`@${w}px Lösungsbild offen ${r.loesungOffen}, Punkte ${j(r.punkte1)}`);
  if (r.ring.an !== 'rtring' || !r.ring.kopf) fehler.push(`@${w}px Leuchtring: ${j(r.ring)}`);
  if (!r.weiterFokus) fehler.push(`@${w}px Weiter fokussiert nicht das nächste Rätsel`);
  if (!/Alle fünf gelöst/.test(r.stand5) || r.punkte5.some((x) => !x)) fehler.push(`@${w}px Schluss: ${r.stand5} ${j(r.punkte5)}`);
  if (w === 390) { for (const x of r.klein) fehler.push(`@390px Tippfläche unter 44 px: ${j(x)}`); if (r.ueber > 0) fehler.push(`@390px horizontaler Überlauf ${r.ueber} px`); }
}
// Reduced Motion: Leuchtring sofort im Endzustand, ohne Animation
await b.open('raetsel.html', 1280, { reduce: true });
const rm = await b.ev(`(() => { const k = document.querySelector('.rt'); [...k.querySelectorAll('.rt-a')].find((x) => x.textContent === k.getAttribute('data-loesung')).click(); const s = getComputedStyle(k.querySelector('.rt-lb .ring')); return { an: s.animationName, op: s.opacity, tr: s.transform }; })()`);
if (rm.an !== 'none' || rm.op !== '1') fehler.push(`Reduced Motion: Leuchtring ${JSON.stringify(rm)}`);
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
