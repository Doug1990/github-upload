// Prüft die Touch-Bedienung bei 390 px mit emulierter Touch-Eingabe auf allen Seiten.
// Aufruf: node tests/touch.mjs [--chrome=<pfad>]
// Je Bedienfläche (Schieber, Zeichenflächen, Schemata in Panels) wird:
//   1. senkrecht darüber gewischt: die Seite muss sich bewegen (Scrollen bleibt möglich),
//   2. doppelt getippt: der Seitenzoom darf sich nicht ändern (touch-action oder Viewport).
// Bei Schiebern wird zusätzlich waagerecht gewischt: der Wert muss sich ändern.
// Fehler (Exit-Code 1): Scrollen blockiert, Doppeltipp zoomt, Schieber reagiert nicht auf Wischen.
import { start, sleep } from './chrome.mjs';

const b = await start();
const fehler = [];
const SEITEN = b.pages.filter((p) => p.endsWith('.html'));

async function ziele() {
  return b.ev(`(() => {
    const sicht = (e) => { const r = e.getBoundingClientRect(); return e.offsetParent !== null && r.width >= 40 && r.height >= 20; };
    window.__ziele = [];
    document.querySelectorAll('input[type=range]').forEach((e) => { if (sicht(e)) window.__ziele.push({ art: 'schieber', e }); });
    document.querySelectorAll('canvas, svg').forEach((e) => { if (sicht(e) && e.getBoundingClientRect().width >= 150 && e.getBoundingClientRect().height >= 100 && e.getAttribute('aria-hidden') !== 'true' && !e.closest('[aria-hidden="true"]') && !window.__ziele.some((z) => z.e === e || z.e.contains(e) || e.contains(z.e))) window.__ziele.push({ art: 'fläche', e }); });
    return window.__ziele.map((z, i) => ({ i, art: z.art, name: (z.e.id || z.e.getAttribute('aria-label') || z.e.getAttribute('class') || z.e.tagName).toString().slice(0, 40) }));
  })()`);
}

async function mitte(i) {
  return b.ev(`(() => {
    const e = window.__ziele[${i}].e;
    const r0 = e.getBoundingClientRect();
    scrollBy({ top: r0.top + r0.height / 2 - innerHeight / 2, behavior: 'instant' });
    const r = e.getBoundingClientRect();
    return { x: Math.round(Math.min(Math.max(r.left + r.width / 2, 10), innerWidth - 10)), y: Math.round(Math.min(Math.max(r.top + r.height / 2, 10), innerHeight - 10)), ta: getComputedStyle(e).touchAction, wert: e.value };
  })()`);
}

for (const page of SEITEN) {
  await b.open(page, 390);
  await b.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await b.send('Page.reload');
  await sleep(2500);
  const liste = await ziele();
  console.log(`${page}: ${liste.length} Bedienflächen`);
  for (const z of liste) {
    const m = await mitte(z.i);
    await sleep(300);
    const vor = await b.ev('scrollY');
    await b.send('Input.synthesizeScrollGesture', { x: m.x, y: m.y, yDistance: -180, gestureSourceType: 'touch', speed: 800 });
    await sleep(500);
    const nach = await b.ev('scrollY');
    if (Math.abs(nach - vor) < 20) fehler.push(`${page} ${z.art} "${z.name}": senkrechtes Wischen scrollt die Seite nicht (${vor} auf ${nach}, touch-action ${m.ta})`);

    const m2 = await mitte(z.i);
    const s0 = await b.ev('visualViewport.scale');
    await b.send('Input.synthesizeTapGesture', { x: m2.x, y: m2.y, tapCount: 2, gestureSourceType: 'touch' });
    await sleep(500);
    const s1 = await b.ev('visualViewport.scale');
    if (Math.abs(s1 - s0) > 0.01) fehler.push(`${page} ${z.art} "${z.name}": Doppeltipp ändert den Seitenzoom (${s0} auf ${s1})`);

    if (z.art === 'schieber') {
      const m3 = await mitte(z.i);
      const info = await b.ev(`(() => { const e = window.__ziele[${z.i}].e, r = e.getBoundingClientRect(), mn = +e.min || 0, mx = e.max === '' ? 100 : +e.max, f = (e.value - mn) / (mx - mn); return { x0: Math.round(r.left + 8 + (r.width - 16) * f), y: Math.round(r.top + r.height / 2), breite: Math.round(r.width), f }; })()`);
      const richtung = info.f > 0.5 ? -1 : 1;
      const w0 = await b.ev(`window.__ziele[${z.i}].e.value`);
      await b.send('Input.synthesizeScrollGesture', { x: info.x0, y: info.y, xDistance: -richtung * Math.round(info.breite / 3), gestureSourceType: 'touch', speed: 600 });
      await sleep(400);
      const w1 = await b.ev(`window.__ziele[${z.i}].e.value`);
      if (w0 === w1) fehler.push(`${page} schieber "${z.name}": waagerechtes Wischen ändert den Wert nicht (${w0})`);
    }
  }
}
b.close();
if (fehler.length) { console.error('\nFehler (' + fehler.length + '):\n' + fehler.map((f) => '  X ' + f).join('\n')); process.exit(1); }
console.log('\nTouch-Bedienung: keine Fehler.');
