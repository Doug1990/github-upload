// Prüft die Link-kopieren-Knöpfe an den Abschnittsüberschriften auf Startseite und Zell-Seite.
// Aufruf: node tests/teilen.mjs [--screens=<ordner>] [--chrome=<pfad>]
// Fehler (Exit-Code 1): Abschnitt ohne Knopf, Knopf unter 44 px, falscher Link, keine Rückmeldung "Link kopiert".
import fs from 'node:fs';
import { start, arg, sleep } from './chrome.mjs';

const SCREENS = arg('screens');
if (SCREENS) fs.mkdirSync(SCREENS, { recursive: true });
const b = await start();
const fehler = [];
const SEITEN = ['index.html', 'zelle.html'];

for (const page of SEITEN) {
  for (const w of [1280, 390]) {
    await b.open(page, w);
    const r = await b.ev(`(() => {
      window.__kopiert = [];
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: (t) => { window.__kopiert.push(t); return Promise.resolve(); } } });
      const skip = { hero: 1, landing: 1 };
      const abschnitte = [...document.querySelectorAll('section[id]')].filter((s) => !skip[s.id] && s.querySelector('h2'));
      return abschnitte.map((s) => {
        const btn = s.querySelector('h2 .linkbtn');
        const rect = btn && btn.getBoundingClientRect();
        return { id: s.id, da: !!btn, breite: rect ? Math.round(rect.width) : 0, hoehe: rect ? Math.round(rect.height) : 0, name: btn ? btn.getAttribute('aria-label') : null };
      });
    })()`);
    if (!r.length) fehler.push(`${page} @${w}px: keine Abschnitte mit Überschrift gefunden`);
    for (const a of r) {
      if (!a.da) fehler.push(`${page} @${w}px: #${a.id} ohne Knopf`);
      else if (a.breite < 44 || a.hoehe < 44) fehler.push(`${page} @${w}px: #${a.id} Knopf ${a.breite}x${a.hoehe} px, unter 44`);
      if (a.da && !a.name) fehler.push(`${page} @${w}px: #${a.id} Knopf ohne Beschriftung`);
    }
    if (r.length) {
      // Zweiten Knopf per Tastatur auslösen: fokussieren, Enter-Klick über click() wie bei nativen Buttons
      const ziel = r[Math.min(1, r.length - 1)].id;
      await b.ev(`(() => { const btn = document.querySelector('#${ziel} h2 .linkbtn'); btn.scrollIntoView({ block: 'center' }); btn.focus(); btn.click(); })()`);
      await sleep(300);
      const s = await b.ev(`({ kopiert: window.__kopiert, meldung: document.getElementById('linkMsg').textContent, sichtbar: document.getElementById('linkMsg').classList.contains('on'), fokus: document.activeElement.className })`);
      const soll = `${b.BASE}/${page}#${ziel}`;
      if (s.kopiert[0] !== soll) fehler.push(`${page} @${w}px: kopierter Link ${JSON.stringify(s.kopiert[0])}, erwartet ${soll}`);
      if (s.meldung !== 'Link kopiert' || !s.sichtbar) fehler.push(`${page} @${w}px: Rückmeldung fehlt (${JSON.stringify(s.meldung)})`);
      if (s.fokus !== 'linkbtn') fehler.push(`${page} @${w}px: Fokus nach dem Klick nicht auf dem Knopf`);
      if (SCREENS) {
        const shot = await b.send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(`${SCREENS}/teilen-${page.replace('.html', '')}-${w}.png`, Buffer.from(shot.data, 'base64'));
      }
      console.log(`${page} @${w}px: ${r.length} Knöpfe, Test auf #${ziel} ok`);
    }
  }
}
b.close();
if (fehler.length) { console.error('\nFehler:\n' + fehler.join('\n')); process.exit(1); }
console.log('\nKeine Fehler.');
