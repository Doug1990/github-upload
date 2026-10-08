// Prüft den Abschnitt "Was liegen bleibt, stört." (#muell) auf der Zell-Seite.
// Aufruf: node tests/muell.mjs [--chrome=<pfad>]
// Fehler (Exit-Code 1): falsche Rechnung (Anfall 3, Abfuhr 4: Haufen bleibt 0; Streik: wächst; 8 am Tag: wächst um 4), Zurücksetzen,
// Tippflächen unter 44 px bei 390 px, Überlauf, Regler ohne label.
import { start } from './chrome.mjs';

const b = await start();
const fehler = [];
for (const w of [1280, 390]) {
  await b.open('zelle.html', w);
  const r = await b.ev(`(() => {
    const $ = (id) => document.getElementById(id); if (!$('muellAnfall')) return null;
    const st = () => ({ tag: +$('muellTag').textContent, h: +$('muellHaufen').textContent, punkte: document.querySelectorAll('#muellField i').length });
    const an = (v) => { $('muellAnfall').value = v; $('muellAnfall').dispatchEvent(new Event('input', { bubbles: true })); };
    const o = {};
    $('muellReset').click(); an(3); $('muellFuenf').click(); o.ruhig = st();
    $('muellReset').click(); an(8); $('muellFuenf').click(); o.viel = st();
    $('muellReset').click(); an(3); $('muellStreik').click(); $('muellFuenf').click(); o.streik = st(); o.streikStatus = $('muellStatus').textContent;
    for (let i = 0; i < 3; i++) $('muellFuenf').click(); o.voll = st(); o.vollKlasse = $('muellField').classList.contains('voll');
    $('muellReset').click(); o.reset = st(); o.resetStreik = $('muellStreik').getAttribute('aria-pressed');
    o.label = !!document.querySelector('label[for=muellAnfall]');
    o.klein = [...document.querySelectorAll('#muellWeiter,#muellFuenf,#muellStreik,#muellReset')].map((e) => { const r = e.getBoundingClientRect(); return [e.id, Math.round(r.width), Math.round(r.height)]; }).filter((x) => x[1] < 44 || x[2] < 44);
    o.ueber = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    return o;
  })()`);
  if (!r) { fehler.push(`@${w}px: #muellAnfall fehlt`); continue; }
  if (r.ruhig.h !== 0 || r.ruhig.tag !== 5) fehler.push(`@${w}px Anfall 3: Haufen ${r.ruhig.h} nach Tag ${r.ruhig.tag}, erwartet 0 nach 5`);
  if (r.viel.h !== 20) fehler.push(`@${w}px Anfall 8: Haufen ${r.viel.h} statt 20 nach 5 Tagen`);
  if (r.streik.h !== 15 || r.streik.punkte !== 15) fehler.push(`@${w}px Streik: Haufen ${r.streik.h}, Punkte ${r.streik.punkte}, erwartet 15`);
  if (!/Abfuhr steht/.test(r.streikStatus)) fehler.push(`@${w}px Streik: Statustext passt nicht: ${r.streikStatus}`);
  if (r.voll.h < 40 || !r.vollKlasse) fehler.push(`@${w}px nach 20 Streiktagen: Haufen ${r.voll.h}, Klasse voll ${r.vollKlasse}`);
  if (r.voll.punkte !== 60) fehler.push(`@${w}px Punkte auf 60 begrenzt erwartet, ${r.voll.punkte}`);
  if (r.reset.h !== 0 || r.reset.tag !== 0 || r.resetStreik !== 'false') fehler.push(`@${w}px Zurücksetzen unvollständig`);
  if (!r.label) fehler.push(`@${w}px Regler ohne label`);
  if (w === 390) {
    for (const k of r.klein) fehler.push(`@390px Tippfläche unter 44 px: ${JSON.stringify(k)}`);
    if (r.ueber > 0) fehler.push(`@390px horizontaler Überlauf ${r.ueber} px`);
  }
}
await b.close();
if (fehler.length) { console.log('Fehler (' + fehler.length + '):'); fehler.forEach((f) => console.log('  X ' + f)); process.exit(1); }
console.log('Müllabfuhr: keine Fehler.');
