// Prüft den Abschnitt "Alles hängt an Standards" (#normen) auf abschluss.html.
// Aufruf: node tests/normen.mjs [--chrome=<pfad>]
// Fehler (Exit-Code 1): drei Paare, Start mit keinem passenden Paar, Wechseln der Variante, "Norm einführen" lässt alle passen, "Wieder mischen",
// Rückmeldung (gestrichelt mit Symbol, Leuchtring, Statusmeldung, Fokus, Punkte, Reduced Motion), Tippflächen unter 44 px bei 390 px, Überlauf.
import { start } from './chrome.mjs';

const b = await start();
const fehler = [];
for (const w of [1280, 390]) {
  await b.open('abschluss.html', w);
  const r = await b.ev(`(() => {
    const $ = (id) => document.getElementById(id); const box = () => $('nm'); if (!$('nm')) return null;
    const z = [...document.querySelectorAll('.nm-zeile')];
    const st = () => ({ live: $('nmStand').textContent, rand: getComputedStyle(z[0].querySelectorAll('.nm-b')[0]).borderTopStyle, ok0: z[0].querySelector('.nm-ok').textContent, ring: getComputedStyle(z[0].querySelector('.ring')).opacity, an: getComputedStyle(z[0].querySelector('.ring')).animationName, punkte: [...document.querySelectorAll('.nm-punkte i')].map((x) => x.classList.contains('ok')), passt: z.filter((e) => e.classList.contains('passt')).length, t: $('nmStand').textContent, l0: z[0].querySelectorAll('.nm-b')[0].textContent, r0: z[0].querySelectorAll('.nm-b')[1].textContent });
    const o = { zeilen: z.length, start: st() };
    const bt = z[0].querySelectorAll('.nm-b')[1]; bt.focus(); bt.click(); o.zwischen = st(); o.fokus1 = document.activeElement === bt; bt.click(); o.eins = st(); o.fokus2 = document.activeElement === bt;
    o.liveAttr = $('nmStand').getAttribute('aria-live'); o.liveZahl = box().querySelectorAll('[aria-live]').length; 
    $('nmNorm').click(); o.norm = st();
    $('nmMisch').click(); o.misch = st();
    o.klein = [...document.querySelectorAll('.nm-b')].map((e) => { const r = e.getBoundingClientRect(); return [e.textContent.slice(0, 18), Math.round(r.width), Math.round(r.height)]; }).filter((x) => x[2] < 44);
    o.ueber = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    return o;
  })()`);
  if (!r) { fehler.push(`@${w}px: #nm fehlt`); continue; }
  const j = JSON.stringify;
  if (r.zeilen !== 3) fehler.push(`@${w}px ${r.zeilen} Paare statt 3`);
  if (r.start.passt !== 0 || !/0 von 3 Paaren passen/.test(r.start.t)) fehler.push(`@${w}px Start: ${j(r.start)}`);
  if (r.eins.passt !== 1 || r.eins.r0 !== r.eins.l0) fehler.push(`@${w}px nach zwei Klicks: ${j(r.eins)}`);
  if (r.norm.passt !== 3 || !/gemeinsamen Norm/.test(r.norm.t)) fehler.push(`@${w}px Norm: ${j(r.norm)}`);
  if (r.misch.passt !== 0) fehler.push(`@${w}px nach dem Mischen: ${j(r.misch)}`);
  if (r.zwischen.rand !== 'dashed' || !/passt nicht/.test(r.zwischen.ok0) || !/^Noch nicht\. /.test(r.zwischen.live) || r.zwischen.ring !== '0') fehler.push(`@${w}px falsch: ${j(r.zwischen)}`);
  if (!/^Richtig\. /.test(r.eins.live) || r.eins.rand === 'dashed' || !/passt$/.test(r.eins.ok0) || r.eins.an !== 'nmring' || j(r.eins.punkte) !== '[true,false,false]') fehler.push(`@${w}px richtig: ${j(r.eins)}`);
  if (r.norm.an !== 'nmring' && r.norm.ring !== '1') fehler.push(`@${w}px Leuchtring bei Norm: ${j(r.norm)}`);
  if (r.liveAttr !== 'polite' || r.liveZahl !== 1) fehler.push(`@${w}px Statusmeldung: aria-live ${r.liveAttr}, ${r.liveZahl} Regionen`);
  if (!r.fokus1 || !r.fokus2) fehler.push(`@${w}px Fokus bleibt nicht auf dem Knopf`);
  if (w === 390) { for (const k of r.klein) fehler.push(`@390px Tippfläche unter 44 px: ${j(k)}`); if (r.ueber > 0) fehler.push(`@390px horizontaler Überlauf ${r.ueber} px`); }
}
// Reduced Motion: Leuchtring ohne Animation im Endzustand
await b.open('abschluss.html', 1280, { reduce: true });
const rm = await b.ev(`(() => { document.getElementById('nmNorm').click(); const s = getComputedStyle(document.querySelector('.nm-zeile .ring')); return { an: s.animationName, op: s.opacity }; })()`);
if (rm.an !== 'none' || rm.op !== '1') fehler.push(`Reduced Motion: Leuchtring ${JSON.stringify(rm)}`);
await b.close();
if (fehler.length) { console.log('Fehler (' + fehler.length + '):'); fehler.forEach((f) => console.log('  X ' + f)); process.exit(1); }
console.log('Normen: keine Fehler.');
