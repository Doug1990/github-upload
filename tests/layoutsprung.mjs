// Misst die kumulative Layoutverschiebung (CLS) beim Laden und beim ersten Durchscrollen von zelle.html und index.html.
// Aufruf: node tests/layoutsprung.mjs [--seiten=zelle.html,index.html] [--chrome=<pfad>]
// Grenze 0,1 (Grenze guter Seiten), Ziel des Projekts 0,05. Gemessen bei 1280 und 390 px, mit und ohne Reduced Motion.
// Ausgabe je Lauf: Verschiebung, erster sichtbarer Inhalt (FCP) und größter Inhalt (LCP) in Millisekunden.
import { start, arg, sleep } from './chrome.mjs';

const GRENZE = 0.1;
const SEITEN = (arg('seiten') || 'zelle.html,index.html').split(',');
const b = await start();
const fehler = [];
const SPION = `(() => {
  window.__cls = 0; window.__lcp = 0; window.__quellen = [];
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; for (const s of (e.sources || []).slice(0, 2)) window.__quellen.push(e.value.toFixed(3) + ' ' + (s.node ? (s.node.nodeName + (s.node.id ? '#' + s.node.id : '') + (s.node.className && s.node.className.baseVal === undefined ? '.' + String(s.node.className).split(' ')[0] : '')) : '?')); } }).observe({ type: 'layout-shift', buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
})()`;
await b.send('Page.addScriptToEvaluateOnNewDocument', { source: SPION });
console.log('Layoutverschiebung (CLS), Grenze ' + GRENZE + ', Ziel 0,05');
for (const seite of SEITEN) {
  for (const breite of [1280, 390]) {
    for (const reduce of [false, true]) {
      await b.send('Emulation.setDeviceMetricsOverride', { width: breite, height: 900, deviceScaleFactor: 1, mobile: breite < 500 });
      await b.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }] });
      await b.send('Page.navigate', { url: 'about:blank' });
      await sleep(200);
      await b.send('Page.navigate', { url: `${b.BASE}/${seite}` });
      for (let i = 0; i < 60; i++) {
        if (await b.ev(`document.readyState === 'complete' && location.pathname.endsWith(${JSON.stringify(seite)})`)) break;
        await sleep(100);
      }
      await sleep(300);
      const wert = await b.ev(`(async () => {
        const h = () => document.documentElement.scrollHeight;
        for (let y = 0; y < h(); y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); }
        await new Promise((r) => setTimeout(r, 800));
        const fcp = (performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime || 0;
        return { cls: window.__cls, fcp: Math.round(fcp), lcp: Math.round(window.__lcp), quellen: window.__quellen.slice(0, 6) };
      })()`);
      const ok = wert.cls <= GRENZE;
      console.log(`  ${ok ? 'ok' : 'X '} ${seite.padEnd(12)} ${String(breite).padStart(4)} px ${reduce ? 'reduziert ' : 'animiert  '} CLS ${wert.cls.toFixed(3)}  FCP ${wert.fcp} ms  LCP ${wert.lcp} ms`);
      if (process.argv.includes('--quellen') && wert.quellen.length) wert.quellen.forEach((q) => console.log('       ' + q));
      if (!ok) fehler.push(`${seite} ${breite} px ${reduce ? 'reduziert' : 'animiert'}: Layoutverschiebung ${wert.cls.toFixed(3)} über ${GRENZE}`);
    }
  }
}
await b.close();
if (fehler.length) { console.log('Fehler (' + fehler.length + '):'); fehler.forEach((f) => console.log('  X ' + f)); process.exit(1); }
console.log('Alle Läufe unter ' + GRENZE + '.');
