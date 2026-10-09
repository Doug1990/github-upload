// Prüft die Seite tagesverlauf.html: drei Netze, Beispielkurven, Uhrzeit-Schieber, Werte, Hinweis auf Beispielwerte.
// Aufruf: node tests/tagesverlauf.mjs [--chrome=<pfad>]
// Fehler (Exit-Code 1): drei Netze, Strom mittags Überschuss und abends Lücke, Wasser Füllstand zwischen 10 und 90, Verkehr Auslastung in der Spitze hoch,
// "Beispielkurve" im Text, Regler ohne label, Tippflächen unter 44 px bei 390 px, Überlauf.
import { start } from './chrome.mjs';

const b = await start();
const fehler = [];
for (const w of [1280, 390]) {
  await b.open('tagesverlauf.html', w);
  const r = await b.ev(`(() => {
    const $ = (id) => document.getElementById(id); if (!$('tvH')) return null;
    const tabs = [...document.querySelectorAll('#tvTabs button')];
    const h = (v) => { $('tvH').value = v; $('tvH').dispatchEvent(new Event('input', { bubbles: true })); };
    const werte = () => [...document.querySelectorAll('#tvWerte .tv-wert')].map((e) => e.querySelector('small').textContent + '=' + e.querySelector('b').textContent);
    const o = { tabs: tabs.length, kurven: document.querySelectorAll('#tvSvg polyline').length };
    tabs[0].click(); h(12); o.sMittag = werte(); o.sText = $('tvText').textContent; h(18); o.sAbend = werte();
    tabs[1].click(); const fuell = []; for (let i = 0; i < 24; i++) { h(i); fuell.push(parseInt($('tvWerte').children[1].querySelector('b').textContent, 10)); } o.fuell = [Math.min(...fuell), Math.max(...fuell)];
    tabs[2].click(); h(7); o.vSpitze = werte(); h(3); o.vNacht = werte();
    o.label = !!document.querySelector('label[for=tvH]');
    o.klein = [...tabs, $('tvH')].map((e) => { const r = e.getBoundingClientRect(); return [e.textContent || 'regler', Math.round(r.width), Math.round(r.height)]; }).filter((x) => x[2] < 44);
    o.ueber = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    return o;
  })()`);
  if (!r) { fehler.push(`@${w}px: #tvH fehlt`); continue; }
  const j = JSON.stringify;
  if (r.tabs !== 3 || r.kurven !== 2) fehler.push(`@${w}px ${r.tabs} Netze, ${r.kurven} Kurven`);
  if (!r.sMittag.some((x) => x.startsWith('Überschuss')) || !/Überschuss kann in Speicher/.test(r.sText)) fehler.push(`@${w}px Strom mittags: ${j(r.sMittag)} ${r.sText}`);
  if (!r.sAbend.some((x) => x === 'Lücke=93 %')) fehler.push(`@${w}px Strom abends: ${j(r.sAbend)}`);
  if (r.fuell[0] < 10 || r.fuell[1] > 90 || r.fuell[1] - r.fuell[0] < 70) fehler.push(`@${w}px Füllstand ${j(r.fuell)}`);
  if (!r.vSpitze.includes('Auslastung=95 %') || !r.vNacht.some((x) => x.startsWith('Auslastung=') && parseInt(x.split('=')[1], 10) < 60)) fehler.push(`@${w}px Verkehr: Spitze ${j(r.vSpitze)} Nacht ${j(r.vNacht)}`);
  if (!r.label) fehler.push(`@${w}px Regler ohne label`);
  if (w === 390) { for (const k of r.klein) fehler.push(`@390px Tippfläche unter 44 px: ${j(k)}`); if (r.ueber > 0) fehler.push(`@390px horizontaler Überlauf ${r.ueber} px`); }
}
await b.close();
if (fehler.length) { console.log('Fehler (' + fehler.length + '):'); fehler.forEach((f) => console.log('  X ' + f)); process.exit(1); }
console.log('Tagesverlauf: keine Fehler.');
