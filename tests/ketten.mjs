// Prüft das Kettenspiel "Was kommt vor was?" (#chainGame) auf der Startseite.
// Aufruf: node tests/ketten.mjs [--chrome=<pfad>]
// Je spielbarer Kette: Begründung vorhanden, Titel höchstens 6 und Untertitel höchstens 10 Wörter, die Lösung (Tiefe aufsteigend, gleiche Tiefe beliebig)
// ist durch Antippen erreichbar, alle Plätze zeigen ✓, danach steht "Darum diese Reihenfolge". Fehlversuch: falsche Plätze zeigen ≠ (nicht nur Farbe).
// Legende, Anweisung, Hilfsbild mit echten Gliedern (Schrift wirksam mindestens 14 px bei 390 px), kein Querscroll.
import { start, sleep } from './chrome.mjs';

const b = await start();
const fehler = [];
const w = (t) => t.trim().split(/\s+/).filter(Boolean).length;
for (const breite of [1280, 390]) {
  await b.open('index.html', breite);
  await b.ev(`document.getElementById('chainGame').scrollIntoView({ behavior: 'instant', block: 'start' })`);
  await sleep(300);
  const ketten = JSON.parse(await b.ev(`JSON.stringify(ACTIVITIES.filter((a) => Array.isArray(a.kette) && a.kette.length >= 3 && !a.generated).map((a) => ({ id: a.id, label: a.label, warum: a.warum || '', kette: a.kette.map((g, i) => ({ ding: g.ding, zahl: g.zahl, tier: g.gameTier !== undefined ? g.gameTier : (g.tier !== undefined ? g.tier : i) })) })))`));
  if (ketten.length < 5) fehler.push(`${breite} px: nur ${ketten.length} spielbare Ketten`);
  const lead = await b.ev(`document.querySelector('.cg-lead').textContent`);
  if (!/Oben steht/.test(lead) || /von oben nach unten\./.test(lead) && !/Reihenfolge/.test(lead)) fehler.push('Anweisung unklar: ' + lead);
  const leg = await b.ev(`document.querySelector('.cg-legende').textContent`);
  for (const t of ['✓', '≠', 'gleiches Symbol', 'Reihenfolge egal']) if (!leg.includes(t)) fehler.push(`Legende ohne ${t}`);
  const bsp = await b.ev(`(() => { const s = document.querySelector('.cg-bsp'); const sr = s.getBoundingClientRect(); return { t: s.textContent, min: Math.min(...[...s.querySelectorAll('text')].map((e) => parseFloat(getComputedStyle(e).fontSize) * sr.width / 320)), ragt: [...s.querySelectorAll('text')].some((e) => { const q = e.getBoundingClientRect(); return q.right > sr.right + 1 || q.left < sr.left - 1; }), label: s.getAttribute('aria-label') }; })()`);
  if (!/Wasser/.test(bsp.t) || !/Strom/.test(bsp.t) || !/Bohne/.test(bsp.t) || !/●/.test(bsp.t)) fehler.push('Hilfsbild ohne echte Glieder oder Symbol');
  if (bsp.min < 14) fehler.push(`${breite} px: Hilfsbild Schrift wirksam ${bsp.min.toFixed(1)} px`);
  if (bsp.ragt) fehler.push(`${breite} px: Text im Hilfsbild ragt heraus`);
  if (!/gleichzeitig/.test(bsp.label)) fehler.push('aria-label des Hilfsbilds unvollständig');
  for (const k of ketten) {
    if (!k.warum || w(k.warum) < 8) fehler.push(`${k.id}: Begründung fehlt`);
    k.kette.forEach((g, i) => { if (w(g.ding) > 6) fehler.push(`${k.id} Glied ${i + 1}: Titel mit ${w(g.ding)} Wörtern`); if (w(g.zahl) > 10) fehler.push(`${k.id} Glied ${i + 1}: Untertitel mit ${w(g.zahl)} Wörtern`); });
    // diese Kette aufrufen
    let da = false;
    for (let n = 0; n < 60 && !da; n++) {
      da = await b.ev(`document.getElementById('cgTitle').textContent.includes(${JSON.stringify('„' + k.label + '“')})`);
      if (!da) await b.ev(`document.getElementById('cgNext').click()`);
    }
    if (!da) { fehler.push(`${k.id}: Kette nicht erreichbar`); continue; }
    const klickeReihe = async (reihenfolge) => {
      for (const i of reihenfolge) await b.ev(`[...document.querySelectorAll('#cgPool .cg-chip')].find((c) => c.textContent.includes(${JSON.stringify(k.kette[i].ding)})).click()`);
    };
    const idx = k.kette.map((_, i) => i);
    // Fehlversuch zuerst: absteigende Tiefe
    const falsch = [...idx].sort((a, c) => k.kette[c].tier - k.kette[a].tier || a - c);
    await klickeReihe(falsch);
    const f = await b.ev(`({ wrong: [...document.querySelectorAll('.cg-slot.wrong')].map((s) => s.querySelector('.cg-mark')?.textContent), warum: !document.getElementById('cgWarum').hidden })`);
    if (!f.wrong.length) fehler.push(`${k.id}: Fehlversuch zeigt keine falschen Plätze`);
    if (f.wrong.some((m) => m !== '≠')) fehler.push(`${k.id}: falscher Platz ohne ≠`);
    if (!f.warum) fehler.push(`${k.id}: nach Fehlversuch keine Begründung`);
    await b.ev(`document.getElementById('cgRetry').click()`);
    // Lösung
    const richtig = [...idx].sort((a, c) => k.kette[a].tier - k.kette[c].tier || a - c);
    await klickeReihe(richtig);
    const r = await b.ev(`({ ok: [...document.querySelectorAll('.cg-slot.correct .cg-mark')].map((m) => m.textContent), n: document.querySelectorAll('.cg-slot').length, wrong: document.querySelectorAll('.cg-slot.wrong').length, warum: document.getElementById('cgWarum').textContent, hidden: document.getElementById('cgWarum').hidden, fb: document.getElementById('cgFeedback').textContent, ueber: document.documentElement.scrollWidth - innerWidth })`);
    if (r.ok.length !== r.n || r.wrong) fehler.push(`${k.id}: Lösung nicht erreicht (${r.ok.length} von ${r.n} richtig)`);
    if (r.ok.some((m) => m !== '✓')) fehler.push(`${k.id}: richtiger Platz ohne ✓`);
    if (r.hidden || !r.warum.startsWith('Darum diese Reihenfolge: ')) fehler.push(`${k.id}: Begründung nach dem Lösen fehlt`);
    if (!/^Passt/.test(r.fb)) fehler.push(`${k.id}: Rückmeldung "${r.fb}"`);
    if (breite === 390 && r.ueber > 0) fehler.push(`${k.id}: Querscroll ${r.ueber} px`);
  }
  console.log(`Ketten ${breite} px: ${ketten.length} Ketten geprüft`);
}
b.close();
if (fehler.length) { console.error('\nFehler (' + fehler.length + '):\n' + fehler.map((f) => '  X ' + f).join('\n')); process.exit(1); }
console.log('\nKetten: keine Fehler.');
