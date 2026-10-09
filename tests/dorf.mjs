// Prüft den Abschnitt "Dorf oder Stadt" (#dorf) auf der Zell-Seite.
// Aufruf: node tests/dorf.mjs [--screens=<ordner>] [--chrome=<pfad>] [--gegenprobe]
// Fehler (Exit-Code 1): falsche Kennzahlen oder Auswertung bei einer der sieben Größen, Schalter "Bakterium" und
// "Zelle mit Kern" wirken falsch, Bild passt nicht zur Größe (Kraftwerke, Stau, wartende Ribosomen), Regler reagiert
// nicht auf Pfeiltasten oder Knöpfe, Hinweise fehlen (Kurz-Liste, Endosymbiose, Wo das Bild hinkt, Notiz),
// Gedankenstriche im Text, Tippflächen unter 44 px, horizontaler Überlauf oder SVG-Text unter 11 px bei 390 px,
// Bewegung trotz Reduced Motion.
// --gegenprobe baut absichtlich Fehler in die geladene Seite ein (falsche Auswertung, Gedankenstrich,
// zu kleiner Knopf) und prüft, dass das Skript alle drei meldet. Dann ist Exit-Code 0 ein Erfolg.
import fs from 'node:fs';
import { start, arg, sleep } from './chrome.mjs';

const SCREENS = arg('screens');
const GEGENPROBE = process.argv.includes('--gegenprobe');
if (SCREENS) fs.mkdirSync(SCREENS, { recursive: true });
const b = await start();
const fehler = [];

const key = async (k, code, vk) => {
  await b.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: k, code, windowsVirtualKeyCode: vk });
  await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk });
};

// Erwartung je Stufe des Reglers (Kugel: Oberfläche ÷ Volumen = 6 ÷ d)
const D = [1, 2, 5, 10, 20, 50, 100];
const OV = ['6', '3', '1,2', '0,6', '0,3', '0,12', '0,06'];
const WEG = ['0,5', '1', '2,5', '5', '10', '25', '50'];
const BAK = ['Läuft', 'Läuft', 'Wird eng', 'Engpass', 'Engpass', 'Engpass', 'Engpass'];
const BAK_STATUS = ['läuft gut', 'läuft gut', 'wird es eng', 'Engpass', 'Engpass', 'Engpass', 'Engpass'];
const EUK = ['Klein, geht', 'Klein, geht', 'Läuft', 'Läuft', 'Läuft', 'Läuft', 'Läuft, lange Wege'];
const MITO = [1, 2, 3, 5, 6, 8, 10];
const STAU = [0, 0, 20, 30, 30, 30, 30];

// Absichtliche Fehler für die Gegenprobe
const FEHLER_EINBAUEN = `(() => {
  const st = document.createElement('style');
  st.textContent = '#dorfReset { min-height: 30px !important; height: 30px !important; padding: 0 6px !important; }';
  document.head.appendChild(st);
  const p = document.getElementById('dorfPanel');
  new MutationObserver(() => {
    if (p.dataset.size === '6') document.getElementById('dorfStatus').textContent = 'Etwa 100 µm: Das Bakterium läuft gut, und alles ist fein.';
    const t = document.getElementById('dorfTitle'); if (!t.textContent.includes('\\u2014')) t.textContent += ' \\u2014 Test';
  }).observe(p, { attributes: true, attributeFilter: ['data-size', 'data-pick'] });
  return true;
})()`;

for (const [w, reduce] of [[1280, false], [390, false], [390, true]]) {
  const tag = `@${w}px${reduce ? ' Reduced Motion' : ''}`;
  await b.open('zelle.html', w, { reduce });
  const ok = await b.ev(`!!document.getElementById('dorfPanel') && !!document.getElementById('dorfSize') && document.querySelectorAll('#dorf [aria-pressed]').length === 2`);
  if (!ok) { fehler.push(`${tag}: Panel, Regler oder Schalter fehlen`); continue; }
  if (GEGENPROBE) await b.ev(FEHLER_EINBAUEN);

  // Alle Stufen für beide Schalterstellungen über den Regler durchspielen
  const texte = [];
  for (const pick of ['bak', 'euk']) {
    const r = await b.ev(`(async () => {
      const $ = (id) => document.getElementById(id), p = $('dorfPanel'), rg = $('dorfSize'), out = [];
      $(${JSON.stringify(pick === 'bak' ? 'dorfPickBak' : 'dorfPickEuk')}).click();
      for (let i = 0; i < 7; i++) {
        rg.value = String(i); rg.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise((r) => setTimeout(r, 30));
        out.push({ size: p.dataset.size, pick: p.dataset.pick, d: $('dorfD').textContent, ov: $('dorfOV').textContent, weg: $('dorfWeg').textContent,
          calc: $('dorfCalc').textContent, status: $('dorfStatus').textContent, out: $('dorfSizeO').textContent, vt: rg.getAttribute('aria-valuetext'),
          bak: $('dorfLgBak').querySelector('b').textContent, euk: $('dorfLgEuk').querySelector('b').textContent,
          eyebrow: $('dorfEyebrow').textContent, title: $('dorfTitle').textContent, townL: $('dorfTownL').textContent,
          pressed: [$('dorfPickBak').getAttribute('aria-pressed'), $('dorfPickEuk').getAttribute('aria-pressed')],
          kleiner: $('dorfSmaller').disabled, groesser: $('dorfBigger').disabled,
          mito: document.querySelectorAll('#dorfSvg .dorf-mito').length, stau: document.querySelectorAll('#dorfSvg .dorf-queue').length,
          warten: document.querySelectorAll('#dorfSvg .dorf-ribo.wait').length, fern: document.querySelectorAll('#dorfSvg .dorf-far').length,
          dim: [...document.querySelectorAll('#dorfSvg .dorf-cell')].map((g) => g.classList.contains('dim')),
          text: $('dorf').innerText + ' ' + [...document.querySelectorAll('#dorf [aria-label], #dorf [aria-valuetext]')].map((e) => (e.getAttribute('aria-label') || '') + ' ' + (e.getAttribute('aria-valuetext') || '')).join(' ') + ' ' + document.getElementById('dorfSvgT').textContent });
      }
      return out;
    })()`);
    const titel = new Set();
    r.forEach((s, i) => {
      const wo = `${tag} ${pick === 'bak' ? 'Bakterium' : 'Zelle mit Kern'} Stufe ${i + 1} (${D[i]} µm)`;
      if (s.size !== String(i) || s.pick !== pick) fehler.push(`${wo}: Zustand ${s.pick}/${s.size}`);
      if (s.d !== `etwa ${D[i]} µm` || s.out !== s.d || !String(s.vt).startsWith(s.d)) fehler.push(`${wo}: Durchmesser "${s.d}", Anzeige "${s.out}", Vorlesetext "${s.vt}"`);
      if (s.ov !== `${OV[i]} pro µm`) fehler.push(`${wo}: Oberfläche je Volumen "${s.ov}" statt "${OV[i]} pro µm"`);
      if (s.weg !== `etwa ${WEG[i]} µm`) fehler.push(`${wo}: Weg zur Mitte "${s.weg}"`);
      if (!s.calc.includes('Kugel') || !s.calc.includes(`6 ÷ d = 6 ÷ ${D[i]} µm = ${OV[i]} pro µm`) || !s.calc.includes('Beispiel')) fehler.push(`${wo}: Rechnung unvollständig ("${s.calc.slice(0, 120)}")`);
      if (i > 0 && !s.calc.includes(`${D[i]}-mal so breit`)) fehler.push(`${wo}: Vergleich mit 1 µm fehlt`);
      if (s.bak !== BAK[i] || s.euk !== EUK[i]) fehler.push(`${wo}: Lage "${s.bak}"/"${s.euk}" statt "${BAK[i]}"/"${EUK[i]}"`);
      if (!s.status.startsWith(`Etwa ${D[i]} µm:`) || !s.status.includes(BAK_STATUS[i]) || !s.status.includes('Zelle mit Kern')) fehler.push(`${wo}: Auswertung "${s.status}" passt nicht (erwartet "${BAK_STATUS[i]}")`);
      if (!s.eyebrow.startsWith(pick === 'bak' ? 'Bakterium' : 'Zelle mit Kern') || !s.eyebrow.includes(`etwa ${D[i]} µm`)) fehler.push(`${wo}: Überschrift "${s.eyebrow}"`);
      if (s.townL !== (pick === 'bak' ? 'Im Dorf' : 'In der Stadt')) fehler.push(`${wo}: Spalte "${s.townL}"`);
      if (JSON.stringify(s.pressed) !== JSON.stringify(pick === 'bak' ? ['true', 'false'] : ['false', 'true'])) fehler.push(`${wo}: aria-pressed ${JSON.stringify(s.pressed)}`);
      if (JSON.stringify(s.dim) !== JSON.stringify(pick === 'bak' ? [false, true] : [true, false])) fehler.push(`${wo}: Hervorhebung im Bild falsch ${JSON.stringify(s.dim)}`);
      if (s.kleiner !== (i === 0) || s.groesser !== (i === 6)) fehler.push(`${wo}: Kleiner/Größer falsch gesperrt (${s.kleiner}/${s.groesser})`);
      if (s.mito !== MITO[i]) fehler.push(`${wo}: ${s.mito} Kraftwerke im Bild statt ${MITO[i]}`);
      if (s.stau !== STAU[i]) fehler.push(`${wo}: ${s.stau} wartende Teilchen vor den Toren statt ${STAU[i]}`);
      if ((s.warten > 0) !== (i >= 3) || (s.fern > 0) !== (i >= 2)) fehler.push(`${wo}: ferne Mitte (${s.fern}) oder wartende Ribosomen (${s.warten}) passen nicht zur Größe`);
      titel.add(s.title);
      texte.push([wo, s.text]);
    });
    if (titel.size !== 3) fehler.push(`${tag} ${pick}: ${titel.size} verschiedene Titel statt 3 Lagen`);
  }

  // Knöpfe Kleiner, Größer, Zurück
  const knoepfe = await b.ev(`(async () => {
    const $ = (id) => document.getElementById(id), p = $('dorfPanel'), w = () => new Promise((r) => setTimeout(r, 30)), out = [];
    $('dorfPickBak').click(); $('dorfReset').click(); await w(); out.push(p.dataset.size);
    $('dorfBigger').click(); await w(); $('dorfBigger').click(); await w(); out.push(p.dataset.size, $('dorfSize').value);
    $('dorfSmaller').click(); await w(); out.push(p.dataset.size);
    $('dorfReset').click(); await w(); out.push(p.dataset.size);
    return out;
  })()`);
  if (JSON.stringify(knoepfe) !== JSON.stringify(['1', '3', '3', '2', '1'])) fehler.push(`${tag}: Knöpfe falsch ${JSON.stringify(knoepfe)}`);

  // Pfeiltasten, Pos1 und Ende am Regler
  await b.ev(`(() => { const r = document.getElementById('dorfSize'); r.scrollIntoView({ block: 'center' }); r.focus(); })()`);
  await key('ArrowRight', 'ArrowRight', 39); await sleep(50); await key('ArrowRight', 'ArrowRight', 39); await sleep(50);
  const rechts = await b.ev(`[document.getElementById('dorfPanel').dataset.size, document.activeElement.id]`);
  await key('End', 'End', 35); await sleep(50);
  const ende = await b.ev(`document.getElementById('dorfPanel').dataset.size`);
  await key('ArrowLeft', 'ArrowLeft', 37); await sleep(50);
  const links = await b.ev(`document.getElementById('dorfPanel').dataset.size`);
  await key('Home', 'Home', 36); await sleep(50);
  const anfang = await b.ev(`document.getElementById('dorfPanel').dataset.size`);
  if (JSON.stringify([rechts, ende, links, anfang]) !== JSON.stringify([['3', 'dorfSize'], '6', '5', '0'])) fehler.push(`${tag}: Tastatur am Regler falsch ${JSON.stringify([rechts, ende, links, anfang])}`);

  // Hinweise: Kurz-Liste, Endosymbiose, Wo das Bild hinkt, Notiz, vorsichtige Aussagen
  const hinweis = await b.ev(`(() => {
    const s = document.getElementById('dorf'); s.querySelectorAll('details').forEach((d) => { d.open = true; });
    const t = s.innerText;
    return { kurz: !!document.querySelector('#kurz a[href="#dorf"]'), ort: [...s.querySelectorAll('h3')].some((h) => h.textContent.includes('Woher kommen die Kraftwerke?')),
      hinkt: !!s.querySelector('details.hinkt .hinkt-body'), note: (s.querySelector('.note') || { textContent: '' }).textContent.startsWith('Stark vereinfacht'),
      endo: /Endosymbiose/.test(t) && /gut belegt/.test(t) && /Offen ist/.test(t), vorstufe: /keine Vorstufe/.test(t), nukleoid: /Nukleoid/.test(t) && /Zellwand/.test(t),
      riesen: /Riesenbakterien/.test(t), primitiv: /primitiv|weniger entwickelt/i.test(t),
      vor: (() => { const ids = [...document.querySelectorAll('section[id]')].map((x) => x.id); return [ids.indexOf('evolution'), ids.indexOf('dorf'), ids.indexOf('dna')]; })(),
      text: t };
  })()`);
  if (!hinweis.kurz) fehler.push(`${tag}: Eintrag in der Kurz-Liste fehlt`);
  if (!hinweis.ort || !hinweis.endo) fehler.push(`${tag}: Abschnitt "Woher kommen die Kraftwerke?" fehlt oder ohne "gut belegt" und "Offen ist"`);
  if (!hinweis.hinkt || !hinweis.note) fehler.push(`${tag}: "Wo das Bild hinkt" oder Notiz "Stark vereinfacht" fehlt`);
  if (!hinweis.vorstufe || !hinweis.nukleoid || !hinweis.riesen) fehler.push(`${tag}: fachlicher Hinweis fehlt (keine Vorstufe, Nukleoid und Zellwand, Riesenbakterien)`);
  if (hinweis.primitiv) fehler.push(`${tag}: Text nennt Bakterien primitiv oder weniger entwickelt`);
  if (!(hinweis.vor[0] >= 0 && hinweis.vor[1] > hinweis.vor[0] && hinweis.vor[2] > hinweis.vor[1])) fehler.push(`${tag}: Abschnitt steht nicht nach #evolution und vor #dna (${hinweis.vor})`);
  texte.push([`${tag} Hinweise`, hinweis.text]);

  // Gedankenstriche in sichtbarem Text, aria-Labels und SVG-Titel
  for (const [wo, t] of texte) {
    const m = t.match(/[–—]/);
    if (m) fehler.push(`${wo}: Gedankenstrich im Text ("${t.slice(Math.max(0, m.index - 30), m.index + 10).replace(/\s+/g, ' ')}")`);
  }

  if (w === 390) {
    const klein = await b.ev(`[...document.querySelectorAll('#dorf button, #dorf summary, #dorf a, #dorf input')].filter((e) => e.offsetParent && !e.classList.contains('linkbtn')).map((e) => { const r = e.getBoundingClientRect(); return [e.id || e.textContent.trim().slice(0, 20), Math.round(r.width), Math.round(r.height)]; }).filter((x) => x[1] < 44 || x[2] < 44)`);
    for (const k of klein) fehler.push(`${tag}: Tippfläche unter 44 px: ${JSON.stringify(k)}`);
    const ueber = await b.ev(`document.documentElement.scrollWidth - document.documentElement.clientWidth`);
    if (ueber > 0) fehler.push(`${tag}: horizontaler Überlauf ${ueber} px`);
    for (const s of [0, 6]) {
      const r = await b.ev(`(async () => {
        const rg = document.getElementById('dorfSize'); rg.value = '${s}'; rg.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise((r) => setTimeout(r, 50));
        const sec = document.getElementById('dorf'), cw = document.documentElement.clientWidth;
        const breit = [...sec.querySelectorAll('*')].filter((e) => e.getBoundingClientRect().right > cw + 1).map((e) => e.id || e.tagName).slice(0, 5);
        const v = document.getElementById('dorfSvg').getAttribute('viewBox').split(' ').map(Number);
        const mini = [...document.querySelectorAll('#dorfSvg text')].map((t) => { const c = t.getScreenCTM(); return [t.textContent, Math.round(parseFloat(getComputedStyle(t).fontSize) * Math.hypot(c.a, c.b) * 10) / 10]; }).filter((x) => x[1] < 11);
        return { breit, hoch: v[3] > v[2], mini };
      })()`);
      if (r.breit.length) fehler.push(`${tag} Stufe ${s + 1}: Elemente ragen rechts heraus: ${r.breit.join(', ')}`);
      if (!r.hoch) fehler.push(`${tag}: Bild bleibt im Querformat`);
      for (const m of r.mini) fehler.push(`${tag} Stufe ${s + 1}: SVG-Text "${m[0]}" nur ${m[1]} px`);
    }
  }
  if (reduce) {
    const anim = await b.ev(`[...document.querySelectorAll('#dorf *')].filter((e) => getComputedStyle(e).animationName !== 'none').length`);
    if (anim) fehler.push(`${tag}: ${anim} Elemente mit Animation trotz Reduced Motion`);
    const dauer = await b.ev(`[...document.querySelectorAll('#dorfSvg .dorf-cell')].map((e) => getComputedStyle(e).transitionDuration).filter((d) => d.split(',').some((x) => parseFloat(x) > 0.001)).length`);
    if (dauer) fehler.push(`${tag}: ${dauer} Elemente mit Übergang trotz Reduced Motion`);
    // Regler wirkt trotzdem sofort
    const sofort = await b.ev(`(() => { const rg = document.getElementById('dorfSize'); rg.value = '4'; rg.dispatchEvent(new Event('input', { bubbles: true })); return document.getElementById('dorfD').textContent; })()`);
    if (sofort !== 'etwa 20 µm') fehler.push(`${tag}: Regler wirkt bei Reduced Motion nicht ("${sofort}")`);
  }

  if (SCREENS && !reduce) {
    await b.ev(`(async () => { const s = document.getElementById('dorf'); s.scrollIntoView(); for (let i = 0; i < 40 && !s.classList.contains('in'); i++) await new Promise((r) => setTimeout(r, 100)); })()`);
    await sleep(1000);
    for (const [s, pick] of [[1, 'bak'], [3, 'bak'], [6, 'euk']]) {
      await b.ev(`(() => { const $ = (id) => document.getElementById(id), rg = $('dorfSize'); rg.value = '${s}'; rg.dispatchEvent(new Event('input', { bubbles: true })); $(${JSON.stringify(pick === 'bak' ? 'dorfPickBak' : 'dorfPickEuk')}).click(); $('dorfPanel').scrollIntoView({ block: 'start' }); })()`);
      await sleep(900);
      const shot = await b.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(`${SCREENS}/dorf-${s + 1}-${pick}-${w}.png`, Buffer.from(shot.data, 'base64'));
    }
  }
}

await b.close();
if (GEGENPROBE) {
  const erwartet = [['falsche Auswertung', /Stufe 7 \(100 µm\): Auswertung/], ['Gedankenstrich', /Gedankenstrich/], ['kleiner Knopf', /Tippfläche unter 44 px: \["dorfReset"/]];
  const fehlt = erwartet.filter(([, re]) => !fehler.some((f) => re.test(f)));
  if (fehlt.length) { console.log('Gegenprobe gescheitert, nicht erkannt: ' + fehlt.map((x) => x[0]).join(', ')); process.exit(1); }
  console.log(`Gegenprobe bestanden: alle drei eingebauten Fehler erkannt (${fehler.length} Meldungen).`);
  process.exit(0);
}
if (fehler.length) { console.log('Fehler (' + fehler.length + '):'); fehler.forEach((f) => console.log('  X ' + f)); process.exit(1); }
console.log('Dorf oder Stadt: keine Fehler.');
