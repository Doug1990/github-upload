// Ordnungsregeln für alle Seiten, abgeleitet aus dem Feedback von Björn (BACKLOG Entscheidungen 90 bis 95).
// Aufruf: node tests/ordnung.mjs [--chrome=<pfad>]
// Fehler (Exit-Code 1):
//   1. Jede Schlussfrage (.hinkt-frage) hat direkt eine sichtbare Antwort (.weiter-antwort) und die Kennzeichnung "Zum Weiterdenken".
//   2. Jeder Abschnitt der Zell-Seite steht im Inhaltsverzeichnis (#kurz), und die fünf Teilköpfe stehen in der richtigen Reihenfolge vor ihren Abschnitten.
//   3. Im sichtbaren Text gibt es keine Gedankenstriche und kein Muster "nicht ..., sondern".
// Bericht (Warnung, Exit-Code 0): Fachwörter, deren erste Nennung auf der Seite keine Erklärung in der Nähe hat (Heuristik, Meldemodus).
import { start } from './chrome.mjs';

const FACH = ['ATP', 'Protonen', 'Enzym', 'Gefälle', 'Mitochondrium', 'Ribosom', 'Lysosom', 'Proteasom', 'Rezeptor', 'Motorprotein', 'Zellmembran', 'Golgi-Apparat', 'Aminosäure', 'Mutation', 'Rückkopplung', 'Redundanz', 'Diffusion', 'Autophagie'];
const b = await start();
const fehler = [], bericht = [];
for (const seite of b.pages) {
  await b.open(seite, 1280);
  const r = await b.ev(`(() => {
    const o = {};
    o.fragen = [...document.querySelectorAll('.hinkt-frage')].map((f) => ({ eb: !!f.querySelector('.weiter-eb'), antwort: !!(f.nextElementSibling && f.nextElementSibling.classList.contains('weiter-antwort')), t: f.textContent.slice(0, 50) }));
    const kurz = document.getElementById('kurz');
    if (kurz && document.querySelector('.teil-kopf')) {
      const ids = [...document.querySelectorAll('main section.sec[id]')].map((s) => s.id);
      const links = [...kurz.querySelectorAll('li a')].map((a) => a.getAttribute('href').slice(1));
      o.fehltImVerzeichnis = ids.filter((i) => !links.includes(i));
      const reihe = [...document.querySelectorAll('main section.sec[id], .teil-kopf')].map((e) => e.id);
      o.reihe = reihe.join(',');
      o.anzahlVerzeichnis = kurz.querySelectorAll('.kurz-alle li a').length; o.anzahlSektionen = ids.length;
      o.teile = [...document.querySelectorAll('.teil-kopf')].map((e) => e.id).join(',');
    }
    const text = [...document.querySelectorAll('p, li, dd, .col, summary, h1, h2, h3')].filter((e) => !e.closest('script, style, svg, #kurz, .kurz-alle') && !e.querySelector('p, li, .col')).map((e) => e.textContent.replace(/\\s+/g, ' ').trim());
    const textAlle = [...document.querySelectorAll('p, li, dd, .col, summary, h1, h2, h3')].filter((e) => !e.closest('script, style, svg') && !e.querySelector('p, li, .col')).map((e) => e.textContent.replace(/\\s+/g, ' ').trim());
    o.striche = textAlle.filter((t) => /[\\u2013\\u2014]/.test(t)).slice(0, 3);
    o.nichtSondern = textAlle.filter((t) => /\\bnicht\\b[^.!?]{0,70}\\bsondern\\b/i.test(t)).map((t) => t.slice(0, 120)).slice(0, 3);
    const alles = text.join(' \\n ');
    o.fach = ['zelle.html', 'index.html'].includes(location.pathname.split('/').pop()) ? ${JSON.stringify(FACH)}.map((w) => { const i = alles.indexOf(w); return i < 0 ? null : { w, ctx: alles.slice(Math.max(0, i - 60), i + 160) }; }).filter(Boolean) : [];
    return o;
  })()`);
  r.fragen.forEach((f) => { if (!f.eb || !f.antwort) fehler.push(`${seite}: Schlussfrage ohne Kennzeichnung oder Antwort: "${f.t}"`); });
  if (r.fehltImVerzeichnis && r.fehltImVerzeichnis.length) fehler.push(`${seite}: nicht im Inhaltsverzeichnis: ${r.fehltImVerzeichnis.join(', ')}`);
  if (r.teile !== undefined) {
    if (r.teile !== 'teil1,teil2,teil3,teil4,teil5') fehler.push(`${seite}: Teilköpfe ${r.teile}`);
    const t = r.reihe.split(',');
    if (!t.every((x, i) => !/^teil/.test(x) || (i + 1 < t.length && !/^teil/.test(t[i + 1])))) fehler.push(`${seite}: ein Teilkopf steht nicht vor einem Abschnitt`);
    if (r.anzahlSektionen !== r.anzahlVerzeichnis) fehler.push(`${seite}: ${r.anzahlSektionen} Abschnitte, aber ${r.anzahlVerzeichnis} im Verzeichnis`);
  }
  r.striche.forEach((t) => fehler.push(`${seite}: Gedankenstrich im Text: "${t.slice(0, 80)}"`));
  r.nichtSondern.forEach((t) => fehler.push(`${seite}: Muster "nicht, sondern": "${t}"`));
  for (const f of r.fach) if (!/[(=]|heißt|ist ein|sind |Energieträger|Treibstoff|Eiweiß|Teilchen|Bauteil|Fachwort|Zuckerlager/.test(f.ctx.replace(f.w, ''))) bericht.push(`${seite}: "${f.w}" ohne Erklärung in der Nähe: …${f.ctx.replace(/\n/g, ' ').slice(40, 140)}…`);
}
await b.close();
if (bericht.length) { console.log(`Bericht, Fachwörter ohne erkennbare Erklärung bei der ersten Nennung (${bericht.length}, nur Hinweis):`); bericht.forEach((x) => console.log('  ? ' + x)); }
if (fehler.length) { console.log('Fehler (' + fehler.length + '):'); fehler.forEach((f) => console.log('  X ' + f)); process.exit(1); }
console.log('Ordnung: Regeln 1 bis 3 erfüllt.');
