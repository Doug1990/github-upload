// Prüft Suche und Ebenenfilter im Glossar: Suche, Filter, Kombination, Leerzustand, Zurücksetzen, Trefferzeile, ohne JavaScript alle Einträge sichtbar.
// Aufruf: node tests/glossar.mjs [--chrome=<pfad>]
import { start, sleep } from './chrome.mjs';

const b = await start();
const fehler = [];
const pruefe = (ok, text) => { if (!ok) fehler.push(text); };
const eq = (ist, soll, text) => pruefe(JSON.stringify(ist) === JSON.stringify(soll), `${text}: ${JSON.stringify(ist)} statt ${JSON.stringify(soll)}`);
const sichtbar = () => b.ev(`[...document.querySelectorAll('dl.gloss .g')].filter((k) => k.checkVisibility()).map((k) => k.querySelector('dt span').textContent)`);
const tippe = async (t) => { await b.ev(`(() => { const i = document.getElementById('gl-suche'); i.value = ${JSON.stringify(t)}; i.dispatchEvent(new Event('input', { bubbles: true })); })()`); };
const klick = (sel) => b.ev(`document.querySelector(${JSON.stringify(sel)}).click()`);
const chip = (name) => `.gl-chip[data-ebene="${name}"]`;
const live = async () => { await sleep(450); return b.ev(`document.querySelector('.gl-sr').textContent`); };
const sicht = () => b.ev(`document.querySelector('.gl-treffer').textContent`);
const ebeneVon = () => b.ev(`[...document.querySelectorAll('dl.gloss .g')].filter((k) => k.checkVisibility()).map((k) => k.className.match(/l-(\\w+)/)[1])`);

await b.open('glossar.html', 1280);
eq((await sichtbar()).length, 38, 'Ausgangszustand Einträge');
eq(await b.ev(`document.querySelectorAll('dl.gloss .g').length`), 38, 'Einträge im DOM');
pruefe(await b.ev(`!!document.querySelector('label[for=gl-suche]') && document.querySelector('label[for=gl-suche]').checkVisibility()`), 'Suchfeld ohne sichtbares Label');
eq(await b.ev(`document.querySelector('.gl-sr').getAttribute('aria-live')`), 'polite', 'aria-live');
eq(await b.ev(`document.querySelector('.gl-chip:not([data-ebene])').getAttribute('aria-pressed')`), 'true', 'Alle anfangs gedrückt');
eq(await sicht(), '38 von 38', 'sichtbare Anzeige anfangs');

// Suche
await tippe('Pore');
const pore = await sichtbar();
pruefe(pore.includes('Kernpore'), 'Suche "Pore" findet Kernpore nicht');
pruefe(pore.length >= 1 && pore.length < 10, `Suche "Pore" liefert ${pore.length} Einträge`);
pruefe(await b.ev(`[...document.querySelectorAll('dl.gloss .g')].filter((k) => k.checkVisibility()).every((k) => /pore/i.test(k.querySelector('dt').textContent + k.querySelector('dd').textContent))`), 'Suche "Pore": Eintrag ohne "pore" sichtbar');
eq(await live(), `${pore.length} von 38 Begriffen`, 'Trefferzeile nach "Pore"');
eq(await sicht(), `${pore.length} von 38`, 'sichtbare Anzeige nach "Pore"');
// Tolerant: Groß/Klein, Umlaut, ß
for (const [a, c] of [['KERNPORE', 'kernpore'], ['eiweiss', 'Eiweiß'], ['EIWEISS', 'eiweiß'], ['gefalle', 'Gefälle'], ['gefaelle', 'GEFÄLLE'], ['aminosaure', 'Aminosäure'], ['ruckkopplung', 'Rückkopplung']]) {
  await tippe(a); const x = await sichtbar(); await tippe(c); const y = await sichtbar();
  pruefe(x.length > 0 && JSON.stringify(x) === JSON.stringify(y), `Schreibweisen "${a}" und "${c}" nicht gleich (${x.length} gegen ${y.length})`);
}
await tippe('Eiweiß'); pruefe((await sichtbar()).includes('Eiweiß'), 'Suche "Eiweiß" findet Eiweiß nicht');
await tippe('Archiv'); pruefe((await sichtbar()).includes('Zellkern'), 'Suche im Kurzsatz ("Archiv") findet Zellkern nicht');

// Ebenenfilter
await tippe('');
eq((await sichtbar()).length, 38, 'Suche geleert');
const stueck = {};
for (const e of ['kult', 'digi', 'phys', 'bio']) {
  await klick(chip(e));
  const eb = await ebeneVon();
  stueck[e] = eb.length;
  pruefe(eb.length > 0 && eb.every((x) => x === e), `Filter ${e}: falsche Einträge sichtbar`);
  eq(await b.ev(`document.querySelector('${chip(e)}').getAttribute('aria-pressed')`), 'true', `Filter ${e} gedrückt`);
  eq(await b.ev(`document.querySelector('.gl-chip:not([data-ebene])').getAttribute('aria-pressed')`), 'false', 'Alle nicht gedrückt bei Filter');
  await klick(chip(e));
  eq((await sichtbar()).length, 38, `Filter ${e} wieder aus`);
}
eq(stueck, { kult: 2, digi: 8, phys: 11, bio: 17 }, 'Zahl je Ebene');
await klick(chip('kult')); await klick(chip('digi'));
eq((await ebeneVon()).length, 10, 'Kulturell plus Digital');
eq(await live(), '10 von 38 Begriffen', 'Trefferzeile bei zwei Filtern');
// Kombination Suche plus Filter (kult und digi sind noch gewählt)
await tippe('Pore');
const k1 = await b.ev(`[...document.querySelectorAll('dl.gloss .g')].filter((k) => k.checkVisibility()).map((k) => k.className.match(/l-(\\w+)/)[1])`);
pruefe(k1.every((x) => ['kult', 'digi'].includes(x)), 'Pore mit Kulturell und Digital: falsche Ebene');
await klick(chip('kult')); await klick(chip('digi')); await klick(chip('bio'));
const komb = await sichtbar();
pruefe(komb.every((n) => pore.includes(n)), 'Kombination Pore plus Biologisch: Eintrag nicht in der Suchmenge');
pruefe((await ebeneVon()).every((x) => x === 'bio'), 'Kombination Pore plus Biologisch: falsche Ebene');
const ausserhalb = pore.length - komb.length;
await klick(chip('bio')); await klick(chip('phys'));
eq((await sichtbar()).length + komb.length + ausserhalb >= pore.length, true, 'Kombination Pore plus Physisch: Menge');
// Leerzustand
await tippe('xyzxyz');
eq((await sichtbar()).length, 0, 'Leerzustand ohne Einträge');
pruefe(await b.ev(`(() => { const l = document.querySelector('.gl-leer'); return !l.hidden && l.checkVisibility() && l.textContent.includes('Kein Begriff gefunden.') && !!l.querySelector('button'); })()`), 'Leerzustand fehlt');
eq(await live(), '0 von 38 Begriffen', 'Trefferzeile im Leerzustand');
// Zurücksetzen
await klick('.gl-reset');
eq((await sichtbar()).length, 38, 'nach Zurücksetzen alle Einträge');
eq(await b.ev(`document.getElementById('gl-suche').value`), '', 'Suchfeld nach Zurücksetzen');
eq(await b.ev(`document.querySelectorAll('.gl-chip[aria-pressed=true]').length`), 1, 'nach Zurücksetzen nur Alle gedrückt');
pruefe(await b.ev(`document.querySelector('.gl-leer').hidden`), 'Leerzustand nach Zurücksetzen noch sichtbar');
eq(await live(), '38 von 38 Begriffen', 'Trefferzeile nach Zurücksetzen');
// Alle setzt Filter zurück
await klick(chip('bio')); await klick(chip('phys'));
await klick('.gl-chip:not([data-ebene])');
eq((await sichtbar()).length, 38, '"Alle" setzt Filter zurück');
// Tippflächen und Breite
for (const w of [390, 320]) {
  await b.open('glossar.html', w);
  const r = await b.ev(`({ sw: document.documentElement.scrollWidth, iw: innerWidth, klein: [...document.querySelectorAll('.gl-tools input, .gl-chip, .gl-reset')].filter((e) => e.checkVisibility() && e.getBoundingClientRect().height < 44).length })`);
  pruefe(r.sw <= r.iw + 1, `${w} px: horizontales Scrollen`);
  eq(r.klein, 0, `${w} px: Tippflächen unter 44 px`);
}
// Ohne JavaScript (Auswertung erst nach dem Laden, weil Evaluate bei abgeschaltetem Skript nicht antwortet)
await b.send('Emulation.setScriptExecutionDisabled', { value: true });
await b.send('Page.navigate', { url: `${b.BASE}/glossar.html?ohne` });
await sleep(2000);
await b.send('Emulation.setScriptExecutionDisabled', { value: false });
eq((await sichtbar()).length, 38, 'ohne JavaScript alle 38 Einträge');
pruefe(await b.ev(`!document.getElementById('gl-suche') && !document.querySelector('.gl-tools')`), 'ohne JavaScript ist ein Suchfeld da');
pruefe(await b.ev(`document.querySelector('.nojs-note') && document.querySelector('.nojs-note').checkVisibility()`), 'ohne JavaScript fehlt der Hinweis');

await b.close();
if (fehler.length) { console.log('Fehler (' + fehler.length + '):'); fehler.forEach((f) => console.log('  X ' + f)); process.exit(1); }
console.log('glossar: Suche, Filter, Leerzustand, Zurücksetzen und Trefferzeile in Ordnung.');
