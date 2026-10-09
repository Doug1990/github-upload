// Prüft den Baukasten "Baue deine Stadt" (#baukasten) auf raetsel.html: sechs Bausteine mit Abhängigkeiten, Ketten, Alles bauen und abreißen,
// Tippflächen unter 44 px bei 390 px, Überlauf, ohne Skript steht die Abhängigkeitsliste da.
// Aufruf: node tests/baukasten.mjs [--chrome=<pfad>]
import { start } from './chrome.mjs';

const b = await start();
const fehler = [];
for (const w of [1280, 390]) {
  await b.open('raetsel.html', w);
  const r = await b.ev(`(() => {
    const $ = (id) => document.getElementById(id); if (!$('bkListe')) return null;
    const z = [...document.querySelectorAll('.bk-zeile')], knopf = (n) => z.find((e) => e.querySelector('.rt-b').textContent === n).querySelector('.rt-b');
    const status = (n) => z.find((e) => e.querySelector('.rt-b').textContent === n).querySelector('.bk-s').textContent;
    const o = { n: z.length, start: $('bkStand').textContent };
    knopf('Wohnviertel').click(); o.wohnen = status('Wohnviertel');
    knopf('Straße').click(); knopf('Kraftwerk').click(); o.kraft = status('Kraftwerk'); o.wohnen2 = status('Wohnviertel');
    knopf('Wasserwerk').click(); knopf('Müllabfuhr').click(); o.wohnen3 = status('Wohnviertel'); o.stand3 = $('bkStand').textContent;
    knopf('Straße').click(); o.ohneStrasse = status('Kraftwerk'); o.stand4 = $('bkStand').textContent;
    $('bkAlle').click(); o.alle = $('bkStand').textContent; $('bkLeer').click(); o.leer = $('bkStand').textContent;
    o.klein = [...document.querySelectorAll('.bk .rt-b')].map((e) => { const r = e.getBoundingClientRect(); return [e.textContent, Math.round(r.height)]; }).filter((x) => x[1] < 44);
    o.ueber = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    return o;
  })()`);
  if (!r) { fehler.push(`@${w}px: #bkListe fehlt`); continue; }
  const j = JSON.stringify;
  if (r.n !== 6) fehler.push(`@${w}px ${r.n} Bausteine statt 6`);
  if (!/Wohnviertel/.test(r.wohnen) && !/Steht still/.test(r.wohnen)) fehler.push(`@${w}px Wohnviertel allein: ${r.wohnen}`);
  if (!/Läuft/.test(r.kraft) || !/Steht still. Es fehlt: Wasserwerk, Müllabfuhr/.test(r.wohnen2)) fehler.push(`@${w}px Kraftwerk ${r.kraft}, Wohnviertel ${r.wohnen2}`);
  if (!/Läuft/.test(r.wohnen3) || !/von 6 Bausteine/.test(r.stand3)) fehler.push(`@${w}px Wohnviertel mit allem: ${r.wohnen3} / ${r.stand3}`);
  if (!/Steht still. Es fehlt: Straße/.test(r.ohneStrasse)) fehler.push(`@${w}px Kette ohne Straße: ${r.ohneStrasse}`);
  if (!/Die ganze Stadt läuft/.test(r.alle) || !/Noch ist nichts gebaut/.test(r.leer)) fehler.push(`@${w}px Alles bauen / abreißen: ${r.alle} / ${r.leer}`);
  if (w === 390) { for (const x of r.klein) fehler.push(`@390px Tippfläche unter 44 px: ${j(x)}`); if (r.ueber > 0) fehler.push(`@390px horizontaler Überlauf ${r.ueber} px`); }
}
await b.close();
if (fehler.length) { console.log('Fehler (' + fehler.length + '):'); fehler.forEach((f) => console.log('  X ' + f)); process.exit(1); }
console.log('Baukasten: keine Fehler.');
