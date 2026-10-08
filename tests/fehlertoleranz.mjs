// Prüft, dass jede Seite weiterläuft, wenn Browser-Schnittstellen fehlen oder Fehler werfen:
// localStorage, AudioContext, ResizeObserver und Canvas. Die Schnittstellen werden vor dem Laden der Seite abgeschaltet.
// Aufruf: node tests/fehlertoleranz.mjs [--seite=zelle.html] [--chrome=<pfad>]
// Fehler (Exit-Code 1): nicht abgefangene Ausnahmen, Konsolenfehler, leere oder stark gekürzte Seite, Abschnitte ohne Text.
import { start, arg, sleep } from './chrome.mjs';

const FAELLE = {
  'localStorage wirft': `
    const werfen = () => { throw new DOMException('gesperrt', 'SecurityError'); };
    Object.defineProperty(window, 'localStorage', { get: werfen, configurable: true });
    Object.defineProperty(window, 'sessionStorage', { get: werfen, configurable: true });`,
  'kein AudioContext': `
    delete window.AudioContext; delete window.webkitAudioContext;`,
  'kein ResizeObserver': `delete window.ResizeObserver;`,
  'Canvas liefert nichts': `HTMLCanvasElement.prototype.getContext = () => null;`,
};
FAELLE['alles zusammen'] = Object.values(FAELLE).join('\n');

const b = await start();
const nur = arg('seite');
const seiten = (nur ? [nur] : b.pages);
const fehler = [];

// Ohne Abschaltung: Textmenge als Vergleich
const grund = {};
for (const seite of seiten) {
  await b.open(seite, 1280);
  grund[seite] = await b.ev(`document.body.innerText.length`);
}

let skriptId = null;
for (const [name, code] of Object.entries(FAELLE)) {
  if (skriptId) await b.send('Page.removeScriptToEvaluateOnNewDocument', { identifier: skriptId });
  skriptId = (await b.send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => { try { ${code} } catch (e) {} })();` })).identifier;
  for (const seite of seiten) {
    b.events.length = 0;
    await b.open(seite, 390);
    // Alle Knöpfe einmal drücken (außer Export, Dialoge, Absenden)
    await b.ev(`(async () => {
      const skip = ['exportBtn', 'packBtn', 'packApply', 'packClose', 'submitBtn'];
      for (const e of [...document.querySelectorAll('button')]) { if (!skip.includes(e.id) && !e.disabled) { try { e.click(); } catch (x) {} } await new Promise((r) => setTimeout(r, 40)); }
    })()`);
    await sleep(600);
    for (const m of b.events) {
      if (m.method === 'Runtime.exceptionThrown') fehler.push(`${seite} [${name}]: Ausnahme: ${(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).split('\n')[0].slice(0, 160)}`);
      if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') fehler.push(`${seite} [${name}]: Konsolenfehler: ${m.params.args.map((a) => a.value ?? a.description).join(' ').slice(0, 160)}`);
    }
    const r = await b.ev(`({ len: document.body.innerText.length, leer: [...document.querySelectorAll('section[id]')].filter((s) => s.innerText.trim().length < 40).map((s) => s.id) })`);
    if (r.len < grund[seite] * 0.8) fehler.push(`${seite} [${name}]: nur ${r.len} Zeichen Text statt rund ${grund[seite]}`);
    if (r.leer.length) fehler.push(`${seite} [${name}]: Abschnitte ohne Text: ${r.leer.join(', ')}`);
  }
}
await b.close();
const eindeutig = [...new Set(fehler)];
if (eindeutig.length) { console.log(`Fehler (${eindeutig.length}):`); eindeutig.forEach((f) => console.log('  X ' + f)); process.exit(1); }
console.log(`Fehlertoleranz: ${seiten.length} Seiten, ${Object.keys(FAELLE).length} Fälle, keine Fehler.`);
