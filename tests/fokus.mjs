// Prüft das Fokus-Management: Nach Enter auf einem Knopf darf der Fokus nicht auf body liegen (zum Beispiel weil der Knopf neu gebaut wurde),
// und Tab muss von dort weitergehen.
// Aufruf: node tests/fokus.mjs [--seite=<datei>] [--chrome=<pfad>]
// Fehler (Exit-Code 1): Fokus nach Enter auf body oder auf einem nicht mehr eingehängten Element, Tab landet danach auf body.
import { start, arg, sleep } from './chrome.mjs';

const SKIP = ['exportBtn', 'packBtn', 'packApply', 'packClose', 'submitBtn', 'heroScrollBtn', 'shelfCheckout'];
const b = await start();
const nur = arg('seite');
const fehler = [];
const taste = async (key, code, vk) => {
  await b.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key, code, windowsVirtualKeyCode: vk, text: key === 'Enter' ? '\r' : undefined });
  await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk });
};
for (const seite of (nur ? [nur] : b.pages)) {
  await b.open(seite, 1280);
  const ids = await b.ev(`(() => {
    const skip = ${JSON.stringify(SKIP)};
    return [...document.querySelectorAll('button, [role=button]')].filter((e) => !skip.includes(e.id) && !e.disabled && !e.closest('[hidden], [inert]') && e.checkVisibility && e.checkVisibility({ checkVisibilityCSS: true }) && !e.closest('.side-hud') && !e.classList.contains('theme-dot')).map((e, i) => { e.dataset.fk = String(i); return i; });
  })()`);
  let n = 0;
  for (const i of ids) {
    const info = await b.ev(`(() => { const e = document.querySelector('[data-fk="${i}"]'); if (!e || !e.isConnected) return null; e.scrollIntoView({ block: 'center' }); e.focus(); return (e.id ? '#' + e.id : e.tagName.toLowerCase()) + ' "' + e.textContent.trim().slice(0, 24) + '" in ' + ((e.closest('section[id]') || {}).id || '-'); })()`);
    if (!info) continue;
    await taste('Enter', 'Enter', 13);
    await sleep(60);
    const nach = await b.ev(`(() => { const a = document.activeElement; return { body: a === document.body || !a || !a.isConnected, tag: a ? a.tagName : '' }; })()`);
    if (nach.body) { fehler.push(`${seite}: nach Enter auf ${info} liegt der Fokus auf body`); continue; }
    await taste('Tab', 'Tab', 9);
    await sleep(40);
    const tab = await b.ev(`(() => { const a = document.activeElement; return a === document.body || !a; })()`);
    if (tab) fehler.push(`${seite}: nach Enter und Tab auf ${info} liegt der Fokus auf body`);
    n++;
  }
  console.log(`${seite}: ${n} Knöpfe geprüft`);
}
await b.close();
const eindeutig = [...new Set(fehler)];
if (eindeutig.length) { console.log('Fehler (' + eindeutig.length + '):'); eindeutig.forEach((f) => console.log('  X ' + f)); process.exit(1); }
console.log('Fokus: keine Fehler.');
