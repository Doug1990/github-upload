// Prüft die Abschnitte "Gene" (#gen) und "Genregulation" (#regulation) auf der Zell-Seite.
// Aufruf: node tests/gene.mjs [--screens=<ordner>] [--chrome=<pfad>]
// Fehler (Exit-Code 1): falsche Auswertung bei Mutationen, falsche Zahl offener Akten, Tippflächen unter 44 px bei 390 px.
import fs from 'node:fs';
import { start, arg, sleep } from './chrome.mjs';

const SCREENS = arg('screens');
if (SCREENS) fs.mkdirSync(SCREENS, { recursive: true });
const b = await start();
const fehler = [];

// Beispielgen ATG GAA GCT TGG AAA TAA. Erwartet wird ein Stichwort in der Auswertung.
const FAELLE = [
  { name: 'Ursprung', erwartet: 'Met, Glu, Ala, Trp, Lys' },
  { name: 'still (GAA zu GAG)', erwartet: 'Stille Mutation' },
  { name: 'Fehlsinn (GCT zu GGT)', erwartet: 'Fehlsinn' },
  { name: 'Abbruch (TGG zu TGA)', erwartet: 'Abbruch' },
  { name: 'Start weg (ATG zu ACG)', erwartet: 'Startsignal fehlt' },
  { name: 'Stopp fehlt (TAA zu TAC)', erwartet: 'Stoppsignal am Ende fehlt' }
];

for (const w of [1280, 390]) {
  await b.open('zelle.html', w);
  const ok = await b.ev(`!!document.getElementById('genPanel') && !!document.getElementById('regPanel')`);
  if (!ok) { fehler.push(`@${w}px: Panels fehlen`); continue; }

  for (const f of FAELLE) {
    // Zurücksetzen, bis Schritt 3, dann den Buchstaben auf den gewünschten Wert klicken.
    const r = await b.ev(`(() => {
      const $ = (id) => document.getElementById(id);
      $('genReset').click(); $('genNext').click(); $('genNext').click();
      const ziel = ${JSON.stringify(f.name)};
      const setze = (i, wunsch) => { const bt = $('genDna').querySelectorAll('button')[i]; let n = 0; while (bt.textContent !== wunsch && n++ < 5) bt.click(); };
      if (ziel.startsWith('still')) setze(5, 'G');
      if (ziel.startsWith('Fehlsinn')) setze(7, 'G');
      if (ziel.startsWith('Abbruch')) setze(11, 'A');
      if (ziel.startsWith('Start')) setze(1, 'C');
      if (ziel.startsWith('Stopp fehlt')) setze(17, 'C');
      return $('genStatus').textContent;
    })()`);
    if (!r.includes(f.erwartet)) fehler.push(`@${w}px ${f.name}: Auswertung "${r}" enthält nicht "${f.erwartet}"`);
  }

  // Schritte: Reihen sichtbar
  const sicht = await b.ev(`(() => { const $ = (id) => document.getElementById(id); $('genReset').click(); const a = [$('genRowRna').hidden, $('genRowPro').hidden]; $('genNext').click(); const c = [$('genRowRna').hidden, $('genRowPro').hidden]; $('genNext').click(); const d = [$('genRowRna').hidden, $('genRowPro').hidden]; return [a, c, d]; })()`);
  if (JSON.stringify(sicht) !== '[[true,true],[false,true],[false,false]]') fehler.push(`@${w}px: Schritte zeigen falsche Reihen ${JSON.stringify(sicht)}`);

  // Genregulation: Zahl offener Akten je Zelltyp und Zucker
  const reg = await b.ev(`(() => {
    const out = {}; const seg = [...document.querySelectorAll('#regSeg button')];
    seg.forEach((bt) => { bt.click(); out[bt.textContent] = [document.querySelectorAll('#regGrid .reg-card:not(.zu)').length, document.querySelectorAll('#regGrid .reg-lv i.on').length]; });
    seg[2].click(); document.getElementById('regSugar').click();
    out.betaZucker = document.querySelectorAll('#regGrid .reg-lv i.on').length;
    seg[0].click(); out.muskelZucker = document.querySelectorAll('#regGrid .reg-lv i.on').length;
    document.getElementById('regMarks').click();
    out.marken = document.querySelectorAll('#regGrid .reg-mark').length;
    return out;
  })()`);
  for (const [k, v] of Object.entries(reg)) {
    if (Array.isArray(v) && v[0] !== 3) fehler.push(`@${w}px ${k}: ${v[0]} offene Akten statt 3`);
  }
  if (reg.betaZucker !== 4) fehler.push(`@${w}px Betazelle mit Zucker: ${reg.betaZucker} gefüllte Segmente statt 4`);
  if (reg.muskelZucker !== 3) fehler.push(`@${w}px Muskelzelle mit Zucker: ${reg.muskelZucker} Segmente statt 3`);
  if (reg.marken !== 6) fehler.push(`@${w}px Lesezeichen: ${reg.marken} Markierungen statt 6`);

  if (w === 390) {
    const klein = await b.ev(`[...document.querySelectorAll('#genPanel button, #regPanel button, .gen-zeit summary')].filter((e) => e.offsetParent).map((e) => { const r = e.getBoundingClientRect(); return [e.textContent.trim().slice(0, 20), Math.round(r.width), Math.round(r.height)]; }).filter((x) => x[1] < 44 || x[2] < 44)`);
    for (const k of klein) fehler.push(`@390px Tippfläche unter 44 px: ${JSON.stringify(k)}`);
    const ueber = await b.ev(`document.documentElement.scrollWidth - document.documentElement.clientWidth`);
    if (ueber > 0) fehler.push(`@390px horizontaler Überlauf ${ueber} px`);
  }

  if (SCREENS) {
    for (const id of ['gen', 'regulation']) {
      await b.ev(`(() => { const s = document.getElementById('${id}'); s.scrollIntoView({ block: 'start' }); if ('${id}' === 'gen') { document.getElementById('genNext').click(); document.getElementById('genNext').click(); document.getElementById('genDna').querySelectorAll('button')[7].click(); document.getElementById('genDna').querySelectorAll('button')[7].click(); } })()`);
      await sleep(700);
      await b.ev(`document.getElementById('${id}').scrollIntoView({ block: 'start' })`);
      await sleep(1200);
      const shot = await b.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(`${SCREENS}/gene-${id}-${w}.png`, Buffer.from(shot.data, 'base64'));
    }
  }
}

await b.close();
if (fehler.length) { console.log('Fehler (' + fehler.length + '):'); fehler.forEach((f) => console.log('  X ' + f)); process.exit(1); }
console.log('Gene und Genregulation: keine Fehler.');
