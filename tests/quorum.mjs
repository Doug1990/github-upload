// Prüft den Zusatzfall "Bakterien zählen sich" (#quorum) im Signale-Abschnitt der Zell-Seite.
// Aufruf: node tests/quorum.mjs [--chrome=<pfad>]
// Fehler (Exit-Code 1): falsche Schwelle (unter 30 darf nichts leuchten, ab 30 müssen alle leuchten), Zahl der Punkte,
// Überlauf bei 390 px, Schieberegler ohne erreichbare Beschriftung.
import { start } from './chrome.mjs';

const b = await start();
const fehler = [];
for (const w of [1280, 390]) {
  await b.open('zelle.html', w);
  const r = await b.ev(`(() => {
    const n = document.getElementById('quorumN'); if (!n) return null;
    const setze = (v) => { n.value = v; n.dispatchEvent(new Event('input', { bubbles: true })); };
    const z = () => ({ punkte: document.querySelectorAll('#quorumField i').length, an: document.querySelectorAll('#quorumField i.on').length, status: document.getElementById('quorumStatus').textContent });
    const out = {};
    setze(8); out.a = z(); setze(28); out.b = z(); setze(30); out.c = z(); setze(60); out.d = z();
    out.label = !!document.querySelector('label[for=quorumN]');
    out.ueber = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    return out;
  })()`);
  if (!r) { fehler.push(`@${w}px: #quorumN fehlt`); continue; }
  if (r.a.punkte !== 8 || r.a.an !== 0) fehler.push(`@${w}px 8 Bakterien: ${r.a.punkte} Punkte, ${r.a.an} leuchten`);
  if (r.b.an !== 0) fehler.push(`@${w}px 28 Bakterien: ${r.b.an} leuchten statt 0`);
  if (r.c.punkte !== 30 || r.c.an !== 30) fehler.push(`@${w}px 30 Bakterien: ${r.c.an} von ${r.c.punkte} leuchten`);
  if (r.d.punkte !== 60 || r.d.an !== 60) fehler.push(`@${w}px 60 Bakterien: ${r.d.an} von ${r.d.punkte} leuchten`);
  if (!/Schwelle/.test(r.c.status)) fehler.push(`@${w}px Statustext nennt die Schwelle nicht`);
  if (!r.label) fehler.push(`@${w}px Regler ohne label`);
  if (w === 390 && r.ueber > 0) fehler.push(`@390px horizontaler Überlauf ${r.ueber} px`);
}
await b.close();
if (fehler.length) { console.log('Fehler (' + fehler.length + '):'); fehler.forEach((f) => console.log('  X ' + f)); process.exit(1); }
console.log('Quorum Sensing: keine Fehler.');
