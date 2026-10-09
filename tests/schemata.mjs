// Prüft für Screenreader: Jedes SVG hat einen Namen (aria-label, aria-labelledby oder title) oder ist versteckt (aria-hidden),
// und jede Statuszeile liegt in einer ruhigen Live-Region (aria-live oder role=status).
// Aufruf: node tests/schemata.mjs [--chrome=<pfad>]
// Fehler (Exit-Code 1): SVG ohne Namen und nicht versteckt, Statuszeile ohne Live-Region. Erfasst wird der Zustand nach dem Laden und nach einmal allen Knöpfen drücken.
import { start } from './chrome.mjs';

const b = await start();
const fehler = [];
for (const seite of b.pages) {
  await b.open(seite, 1280);
  const r = await b.ev(`(async () => {
    const sel = (e) => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.getAttribute('class') ? '.' + e.getAttribute('class').trim().split(/\\s+/)[0] : '');
    const skip = ['exportBtn', 'packBtn', 'packApply', 'packClose', 'submitBtn'];
    const pruefe = () => {
      const svgs = [...document.querySelectorAll('svg')].filter((s) => !s.closest('[aria-hidden="true"]') && s.getAttribute('aria-hidden') !== 'true' && !s.closest('defs') && !s.closest('button') && !s.closest('a') && !s.closest('summary'));
      const ohneName = svgs.filter((s) => !(s.getAttribute('aria-label') || s.getAttribute('aria-labelledby') || s.querySelector(':scope > title') || s.getAttribute('role') === 'presentation' || s.getAttribute('role') === 'none')).map(sel);
      const stat = [...document.querySelectorAll('.status, [id$="Status"], [id$="status"], [class*="-status"], .aus-status, .inst-status, .reg-status')].filter((e) => e.tagName !== 'SVG' && e.id !== 'inputStatus' || e.id === 'inputStatus');
      const ohneLive = stat.filter((e) => !e.closest('[aria-live], [role=status], [role=alert]') && !e.getAttribute('aria-live')).map(sel);
      return { ohneName, ohneLive };
    };
    const o = { start: pruefe() };
    for (const e of [...document.querySelectorAll('button')]) { if (!skip.includes(e.id) && !e.disabled) { try { e.click(); } catch (x) {} } await new Promise((r) => setTimeout(r, 30)); }
    o.nachher = pruefe();
    return o;
  })()`);
  for (const zeit of ['start', 'nachher']) {
    for (const x of new Set(r[zeit].ohneName)) fehler.push(`${seite} [${zeit}]: SVG ohne Namen: ${x}`);
    for (const x of new Set(r[zeit].ohneLive)) fehler.push(`${seite} [${zeit}]: Statuszeile ohne Live-Region: ${x}`);
  }
}
await b.close();
const eindeutig = [...new Set(fehler)];
if (eindeutig.length) { console.log('Fehler (' + eindeutig.length + '):'); eindeutig.forEach((f) => console.log('  X ' + f)); process.exit(1); }
console.log('Schemata: alle SVGs benannt oder versteckt, alle Statuszeilen mit Live-Region.');
