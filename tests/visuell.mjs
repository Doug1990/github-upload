// Visuelle Regression: Vergleicht den oberen Seitenbereich (1000 px) jeder Seite bei 1280 und 390 px mit gespeicherten Referenzbildern.
// Aufruf: node tests/visuell.mjs [--update] [--seite=<datei>] [--toleranz=0.05] [--chrome=<pfad>]
// Die Referenzbilder liegen in tests/visuell/. Mit --update werden sie neu geschrieben. Abweichende Bilder landen als Differenzbild in tests/visuell/diff/.
// Fehler (Exit-Code 1): Referenzbild fehlt, oder mehr als --toleranz Prozent der Pixel weichen ab (Standard 0,05). Animationen laufen sofort zu Ende (Dauer 0), damit Endzustände sichtbar sind.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { start, arg, sleep } from './chrome.mjs';

const HIER = path.join(path.dirname(fileURLToPath(import.meta.url)), 'visuell');
const DIFF = path.join(HIER, 'diff');
const UPDATE = process.argv.includes('--update');
const TOL = parseFloat(arg('toleranz')) || 0.05;
const BREITEN = [1280, 390];
const HOEHE = 1000;
fs.mkdirSync(HIER, { recursive: true });

const b = await start();
const nur = arg('seite');
const fehler = [];
const FREEZE = 'html, html * { animation-duration: 0.001s !important; animation-delay: 0s !important; animation-iteration-count: 1 !important; transition-duration: 0.001s !important; transition-delay: 0s !important; caret-color: transparent !important; scroll-behavior: auto !important; } .reveal { opacity: 1 !important; transform: none !important; }';
for (const seite of (nur ? [nur] : b.pages)) {
  for (const w of BREITEN) {
    await b.open(seite, w, { reduce: true });
    await b.ev(`(() => { const s = document.createElement('style'); s.textContent = ${JSON.stringify(FREEZE)}; document.head.appendChild(s); window.scrollTo(0, 0); })()`);
    await sleep(900);
    const shot = await b.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: w, height: HOEHE, scale: 1 } });
    const name = `${seite.replace('.html', '')}-${w}.png`;
    const datei = path.join(HIER, name);
    if (UPDATE) { fs.writeFileSync(datei, Buffer.from(shot.data, 'base64')); console.log(`geschrieben: ${name}`); continue; }
    if (!fs.existsSync(datei)) { fehler.push(`${name}: kein Referenzbild (node tests/visuell.mjs --update)`); continue; }
    const ref = fs.readFileSync(datei).toString('base64');
    const r = await b.ev(`(async () => {
      const laden = (d) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = 'data:image/png;base64,' + d; });
      const [a, c] = await Promise.all([laden(${JSON.stringify(ref)}), laden(${JSON.stringify(shot.data)})]);
      if (a.width !== c.width || a.height !== c.height) return { groesse: [a.width, a.height, c.width, c.height] };
      const mk = (i) => { const cv = document.createElement('canvas'); cv.width = i.width; cv.height = i.height; const x = cv.getContext('2d'); x.drawImage(i, 0, 0); return { cv, x, d: x.getImageData(0, 0, i.width, i.height).data }; };
      const A = mk(a), C = mk(c), out = document.createElement('canvas'); out.width = a.width; out.height = a.height;
      const ox = out.getContext('2d'), od = ox.createImageData(a.width, a.height); let n = 0;
      for (let p = 0; p < A.d.length; p += 4) {
        const dif = Math.max(Math.abs(A.d[p] - C.d[p]), Math.abs(A.d[p + 1] - C.d[p + 1]), Math.abs(A.d[p + 2] - C.d[p + 2]));
        if (dif > 24) { n++; od.data[p] = 255; od.data[p + 1] = 40; od.data[p + 2] = 120; od.data[p + 3] = 255; } else { od.data[p] = A.d[p] * 0.3; od.data[p + 1] = A.d[p + 1] * 0.3; od.data[p + 2] = A.d[p + 2] * 0.3; od.data[p + 3] = 255; }
      }
      ox.putImageData(od, 0, 0);
      return { prozent: n / (a.width * a.height) * 100, diff: n ? out.toDataURL('image/png').split(',')[1] : '' };
    })()`);
    if (r.groesse) { fehler.push(`${name}: Größe ${r.groesse[0]}x${r.groesse[1]} statt ${r.groesse[2]}x${r.groesse[3]}`); continue; }
    const p = Math.round(r.prozent * 100) / 100;
    if (r.prozent > TOL) {
      fs.mkdirSync(DIFF, { recursive: true });
      fs.writeFileSync(path.join(DIFF, name), Buffer.from(r.diff, 'base64'));
      fehler.push(`${name}: ${p} Prozent der Pixel weichen ab (Toleranz ${TOL}), Differenzbild in tests/visuell/diff/${name}`);
    } else console.log(`ok: ${name} (${p} Prozent)`);
  }
}
await b.close();
if (UPDATE) process.exit(0);
if (fehler.length) { console.log('Fehler (' + fehler.length + '):'); fehler.forEach((f) => console.log('  X ' + f)); process.exit(1); }
console.log('Visuell: alle Bilder innerhalb der Toleranz.');
