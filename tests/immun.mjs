// Prüft den Abschnitt "Immunsystem als Stadtwache" (#immun) auf der Zell-Seite.
// Aufruf: node tests/immun.mjs [--screens=<ordner>] [--chrome=<pfad>] [--gegenprobe]
// Fehler (Exit-Code 1): falsche Auswertung in einem der beiden Fälle (Eindringling, Fehlalarm gegen Eigenes),
// Schritte oder Knöpfe reagieren falsch, Pfeiltasten wirken nicht, Gedankenstriche im Text,
// Tippflächen unter 44 px oder horizontaler Überlauf bei 390 px, Übergänge trotz Reduced Motion.
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

// Erwartung je Fall und Schritt: Stichwort im Status, Ziel und Lage (Ansicht Körper)
const ERWARTET = {
  in: [
    { status: 'Barriere:', ziel: 'noch keins', lage: 'Noch ruhig' },
    { status: 'Alarm:', ziel: 'Eindringling', lage: 'Alarm' },
    { status: 'Meldung:', ziel: 'Eindringling', lage: 'Alarm' },
    { status: 'Spezialeinheit:', ziel: 'Eindringling', lage: 'Alarm' },
    { status: 'Entwarnung: Die Eindringlinge sind beseitigt', ziel: 'keins mehr', lage: 'Entwarnung' }
  ],
  self: [
    { status: 'Barriere:', ziel: 'noch keins', lage: 'Ruhig' },
    { status: 'Fehlalarm:', ziel: 'Eigene Zellen', lage: 'Fehlalarm' },
    { status: 'Meldung:', ziel: 'Eigene Zellen', lage: 'Fehlalarm' },
    { status: 'Spezialeinheit:', ziel: 'Eigene Zellen', lage: 'Fehlalarm' },
    { status: 'Entwarnung bleibt aus', ziel: 'Eigene Zellen', lage: 'Alarm hält an' }
  ]
};

// Absichtliche Fehler für die Gegenprobe
const FEHLER_EINBAUEN = `(() => {
  const st = document.createElement('style');
  st.textContent = '#immReset { min-height: 30px !important; height: 30px !important; padding: 0 6px !important; }';
  document.head.appendChild(st);
  const p = document.getElementById('immPanel');
  new MutationObserver(() => {
    if (p.dataset.case === 'self' && p.dataset.step === '5') document.getElementById('immStatus').textContent = 'Entwarnung: alles wieder gut.';
    const t = document.getElementById('immTitle'); if (!t.textContent.includes('\\u2014')) t.textContent += ' \\u2014 Test';
  }).observe(p, { attributes: true, attributeFilter: ['data-step', 'data-case'] });
  return true;
})()`;

for (const [w, reduce] of [[1280, false], [390, false], [390, true]]) {
  const tag = `@${w}px${reduce ? ' Reduced Motion' : ''}`;
  await b.open('zelle.html', w, { reduce });
  const ok = await b.ev(`!!document.getElementById('immPanel') && document.querySelectorAll('#immSteps button').length === 5`);
  if (!ok) { fehler.push(`${tag}: Panel oder Schrittknöpfe fehlen`); continue; }
  if (GEGENPROBE) await b.ev(FEHLER_EINBAUEN);

  // Beide Fälle Schritt für Schritt mit "Weiter" durchgehen
  const texte = [];
  for (const fall of ['in', 'self']) {
    const r = await b.ev(`(async () => {
      const $ = (id) => document.getElementById(id), p = $('immPanel'), out = [];
      $('immViewBio').click();
      $(${JSON.stringify(fall === 'in' ? 'immCaseIn' : 'immCaseSelf')}).click();
      $('immReset').click();
      await new Promise((r) => setTimeout(r, 30));
      for (let i = 0; i < 5; i++) {
        await new Promise((r) => setTimeout(r, 30));
        const cur = [...$('immSteps').children].findIndex((x) => x.getAttribute('aria-current') === 'step');
        out.push({ step: p.dataset.step, fall: p.dataset.case, cur, status: $('immStatus').textContent, ziel: $('immTarget').textContent, lage: $('immState').textContent,
          zurueck: $('immBack').disabled, weiter: $('immNext').disabled,
          schaden: [...document.querySelectorAll('#immSvg .imm-x')].filter((e) => e.style.opacity === '1').length,
          text: document.getElementById('immun').innerText + ' ' + [...document.querySelectorAll('#immun [aria-label]')].map((e) => e.getAttribute('aria-label')).join(' ') });
        $('immNext').click();
      }
      return out;
    })()`);
    r.forEach((s, i) => {
      const e = ERWARTET[fall][i], wo = `${tag} ${fall === 'in' ? 'Eindringling' : 'Fehlalarm'} Schritt ${i + 1}`;
      if (s.fall !== fall || s.step !== String(i + 1) || s.cur !== i) fehler.push(`${wo}: Zustand ${s.fall}/${s.step}, markiert ${s.cur + 1}`);
      if (!s.status.includes(e.status)) fehler.push(`${wo}: Auswertung "${s.status}" enthält nicht "${e.status}"`);
      if (s.ziel !== e.ziel) fehler.push(`${wo}: Ziel "${s.ziel}" statt "${e.ziel}"`);
      if (s.lage !== e.lage) fehler.push(`${wo}: Lage "${s.lage}" statt "${e.lage}"`);
      if (s.zurueck !== (i === 0) || s.weiter !== (i === 4)) fehler.push(`${wo}: Zurück/Weiter falsch gesperrt (${s.zurueck}/${s.weiter})`);
      const schadenSoll = fall === 'self' && i === 4 ? 2 : 0;
      if (s.schaden !== schadenSoll) fehler.push(`${wo}: ${s.schaden} beschädigte eigene Zellen im Bild statt ${schadenSoll}`);
      texte.push([wo, s.text]);
    });
  }
  // Fehlalarm darf am Ende nie wie eine Entwarnung klingen und umgekehrt
  // (steckt in den Erwartungen oben, hier nur die Gegenrichtung für den Normalfall)
  const endeIn = await b.ev(`(() => { const $ = (id) => document.getElementById(id); $('immCaseIn').click(); $('immSteps').children[4].click(); return $('immStatus').textContent; })()`);
  if (endeIn.includes('bleibt aus')) fehler.push(`${tag}: Normalfall endet mit "bleibt aus"`);

  // Ansicht Stadt: Titel und Legende wechseln
  const stadt = await b.ev(`(() => { const $ = (id) => document.getElementById(id); $('immSteps').children[0].click(); const a = $('immTitle').textContent; $('immViewCity').click(); const r = [a, $('immTitle').textContent, $('immLegend').textContent, document.getElementById('immSvg').classList.contains('city'), document.getElementById('immun').innerText]; $('immViewBio').click(); return r; })()`);
  if (stadt[0] === stadt[1]) fehler.push(`${tag}: Stadtansicht ändert den Titel nicht`);
  if (!stadt[2].includes('Einbrecher') || !stadt[3]) fehler.push(`${tag}: Stadtansicht ohne Einbrecher in der Legende oder ohne Klasse city`);
  texte.push([`${tag} Stadt`, stadt[4]]);

  // Pfeiltasten in der Schrittleiste
  await b.ev(`(() => { document.getElementById('immCaseIn').click(); document.getElementById('immReset').click(); document.getElementById('immSteps').children[0].focus(); })()`);
  await key('ArrowRight', 'ArrowRight', 39); await key('ArrowRight', 'ArrowRight', 39);
  const nachRechts = await b.ev(`[document.getElementById('immPanel').dataset.step, [...document.getElementById('immSteps').children].indexOf(document.activeElement)]`);
  await key('End', 'End', 35);
  const ende = await b.ev(`document.getElementById('immPanel').dataset.step`);
  await key('ArrowLeft', 'ArrowLeft', 37);
  const links = await b.ev(`document.getElementById('immPanel').dataset.step`);
  await key('Home', 'Home', 36);
  const anfang = await b.ev(`document.getElementById('immPanel').dataset.step`);
  if (JSON.stringify([nachRechts, ende, links, anfang]) !== JSON.stringify([['3', 2], '5', '4', '1'])) fehler.push(`${tag}: Pfeiltasten falsch ${JSON.stringify([nachRechts, ende, links, anfang])}`);

  // Gedankenstriche in sichtbarem Text und aria-Labels
  for (const [wo, t] of texte) {
    const m = t.match(/[–—]/);
    if (m) fehler.push(`${wo}: Gedankenstrich im Text ("${t.slice(Math.max(0, m.index - 30), m.index + 10).replace(/\s+/g, ' ')}")`);
  }

  if (w === 390) {
    const klein = await b.ev(`[...document.querySelectorAll('#immun button, #immun summary, #immun a')].filter((e) => e.offsetParent && !e.classList.contains('linkbtn')).map((e) => { const r = e.getBoundingClientRect(); return [e.id || e.textContent.trim().slice(0, 20), Math.round(r.width), Math.round(r.height)]; }).filter((x) => x[1] < 44 || x[2] < 44)`);
    for (const k of klein) fehler.push(`${tag}: Tippfläche unter 44 px: ${JSON.stringify(k)}`);
    const ueber = await b.ev(`document.documentElement.scrollWidth - document.documentElement.clientWidth`);
    if (ueber > 0) fehler.push(`${tag}: horizontaler Überlauf ${ueber} px`);
    const breit = await b.ev(`(() => { const s = document.getElementById('immun'); return [...s.querySelectorAll('*')].filter((e) => e.getBoundingClientRect().right > document.documentElement.clientWidth + 1 && e.closest('details:not([open]) .hinkt-body') === null).map((e) => e.id || e.tagName).slice(0, 5); })()`);
    if (breit.length) fehler.push(`${tag}: Elemente ragen rechts heraus: ${breit.join(', ')}`);
    const hoch = await b.ev(`(() => { const v = document.getElementById('immSvg').getAttribute('viewBox').split(' ').map(Number); return v[3] > v[2]; })()`);
    if (!hoch) fehler.push(`${tag}: Bild bleibt im Querformat`);
  }
  if (reduce) {
    const dauer = await b.ev(`[...document.querySelectorAll('#immSvg .imm-fx, .imm-step')].map((e) => getComputedStyle(e).transitionDuration).filter((d) => d.split(',').some((x) => parseFloat(x) > 0)).length`);
    if (dauer) fehler.push(`${tag}: ${dauer} Elemente mit Übergang trotz Reduced Motion`);
    const anim = await b.ev(`[...document.querySelectorAll('#immun *')].filter((e) => getComputedStyle(e).animationName !== 'none').length`);
    if (anim) fehler.push(`${tag}: ${anim} Elemente mit Animation trotz Reduced Motion`);
  }

  if (SCREENS && !reduce) {
    // Einblenden abwarten (der IntersectionObserver feuert headless erst nach einigen Frames)
    await b.ev(`(async () => { const s = document.getElementById('immun'); s.scrollIntoView(); for (let i = 0; i < 40 && !s.classList.contains('in'); i++) await new Promise((r) => setTimeout(r, 100)); })()`);
    await sleep(1000);
    const lagen = [['in', 0, false], ['in', 3, false], ['self', 4, false], ['self', 4, true]];
    for (const [fall, s, city] of lagen) {
      await b.ev(`(() => { const $ = (id) => document.getElementById(id); $(${JSON.stringify(fall === 'in' ? 'immCaseIn' : 'immCaseSelf')}).click(); $('immSteps').children[${s}].click(); $(${JSON.stringify(city ? 'immViewCity' : 'immViewBio')}).click(); document.getElementById('immPanel').scrollIntoView({ block: 'start' }); })()`);
      await sleep(1800);
      const shot = await b.send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(`${SCREENS}/immun-${fall}-${s + 1}${city ? '-stadt' : ''}-${w}.png`, Buffer.from(shot.data, 'base64'));
    }
    await b.ev(`(() => { document.getElementById('immViewBio').click(); document.getElementById('immun').querySelector('.imm-head').scrollIntoView({ block: 'start' }); })()`);
    await sleep(600);
    const shot = await b.send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${SCREENS}/immun-text-${w}.png`, Buffer.from(shot.data, 'base64'));
  }
}

await b.close();
if (GEGENPROBE) {
  const erwartet = [['falsche Auswertung', /Fehlalarm Schritt 5: Auswertung/], ['Gedankenstrich', /Gedankenstrich/], ['kleiner Knopf', /Tippfläche unter 44 px: \["immReset"/]];
  const fehlt = erwartet.filter(([, re]) => !fehler.some((f) => re.test(f)));
  if (fehlt.length) { console.log('Gegenprobe gescheitert, nicht erkannt: ' + fehlt.map((x) => x[0]).join(', ')); process.exit(1); }
  console.log(`Gegenprobe bestanden: alle drei eingebauten Fehler erkannt (${fehler.length} Meldungen).`);
  process.exit(0);
}
if (fehler.length) { console.log('Fehler (' + fehler.length + '):'); fehler.forEach((f) => console.log('  X ' + f)); process.exit(1); }
console.log('Immunsystem als Stadtwache: keine Fehler.');
