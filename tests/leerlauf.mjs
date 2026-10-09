// Misst die Rechenlast der Seiten im Leerlauf: Anteil der Zeit, in der der Hauptthread beschäftigt ist, während nichts angeklickt wird.
// Aufruf: node tests/leerlauf.mjs [--sekunden=6] [--grenze=<Prozent>] [--chrome=<pfad>]
// Gemessen wird am Seitenanfang und mitten in der Seite, mit Skript, bei 390 px. Ohne --grenze nur Bericht, mit --grenze Fehler bei Überschreitung.
import { start, arg, sleep } from './chrome.mjs';

const SEK = parseFloat(arg('sekunden')) || 6;
const GRENZE = parseFloat(arg('grenze')) || 0;
const b = await start();
await b.send('Performance.enable');
const metrik = async () => { const r = await b.send('Performance.getMetrics'); const m = Object.fromEntries(r.metrics.map((x) => [x.name, x.value])); return { task: m.TaskDuration, script: m.ScriptDuration, layout: m.LayoutDuration, t: m.Timestamp }; };
const fehler = [];
console.log(`Leerlauf über ${SEK} s bei 390 px: Anteil Hauptthread (Aufgaben), davon Skript`);
for (const seite of b.pages) {
  await b.open(seite, 390);
  for (const [name, y] of [['Anfang', 0], ['Mitte', 0.5]]) {
    await b.ev(`window.scrollTo(0, ${y} * (document.documentElement.scrollHeight - innerHeight))`);
    await sleep(1500);
    const a = await metrik(); await sleep(SEK * 1000); const c = await metrik();
    const dt = c.t - a.t, task = (c.task - a.task) / dt * 100, script = (c.script - a.script) / dt * 100;
    console.log(`  ${seite.padEnd(20)} ${name.padEnd(7)} ${task.toFixed(1).padStart(5)} %  Skript ${script.toFixed(1).padStart(5)} %`);
    if (GRENZE && task > GRENZE) fehler.push(`${seite} ${name}: ${task.toFixed(1)} Prozent im Leerlauf (Grenze ${GRENZE})`);
  }
}
await b.close();
if (fehler.length) { console.log('Fehler (' + fehler.length + '):'); fehler.forEach((f) => console.log('  X ' + f)); process.exit(1); }
