// Tastaturprüfung: geht per Tab durch jede Seite und meldet
//  - interaktive Elemente, die per Tab nicht erreichbar sind (native Elemente, Elemente mit Klick-Handler
//    oder cursor:pointer, role=button/link und so weiter),
//  - erreichbare Elemente ohne Namen, ohne Rolle (nur bei Nicht-Standard-Elementen) oder ohne sichtbaren Fokus-Stil,
//  - Nicht-Standard-Elemente, die auf Enter oder Leertaste nicht reagieren,
//  - Fokusfallen (Fokus kommt nicht mehr aus einer kleinen Gruppe heraus).
// Außerdem: Der Skip-Link ist der erste Tab-Stopp und springt zu <main>.
// Aufruf: node tests/tastatur.mjs [--breiten=1280,390] [--seite=zelle.html] [--chrome=<pfad>]
// Exit-Code 1 bei Fehlern, Warnungen (kein Fokus-Stil) lassen ihn auf 0.
import { start, arg, sleep } from './chrome.mjs';

const widths = (arg('breiten') || '1280').split(',').map(Number);
const only = arg('seite');
const b = await start();

const key = async (k, code, vk, text) => {
  await b.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: k, code, windowsVirtualKeyCode: vk, text });
  if (text) await b.send('Input.dispatchKeyEvent', { type: 'char', key: k, code, windowsVirtualKeyCode: vk, text });
  await b.send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk });
};
const tab = () => key('Tab', 'Tab', 9);

// Seitenhilfen: Selektorbeschreibung, Namen, Kandidaten
const HELP = `(() => {
  window.__sel = (e) => { let s = e.tagName.toLowerCase(); if (e.id) s += '#' + e.id; else if (e.getAttribute('class')) s += '.' + e.getAttribute('class').trim().split(/\\s+/).slice(0, 2).join('.'); const t = (e.getAttribute('aria-label') || e.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 28); return s + (t ? ' "' + t + '"' : ''); };
  window.__name = (e) => (e.getAttribute('aria-label') || (e.getAttribute('aria-labelledby') && [...e.getAttribute('aria-labelledby').split(' ')].map((i) => document.getElementById(i)?.textContent || '').join(' ')) || e.getAttribute('title') || (e.labels && e.labels[0]?.textContent) || e.getAttribute('placeholder') || e.textContent || '').replace(/\\s+/g, ' ').trim();
  window.__native = (e) => /^(A|BUTTON|INPUT|SELECT|TEXTAREA|SUMMARY)$/.test(e.tagName) && !(e.tagName === 'A' && !e.hasAttribute('href'));
  window.__visible = (e) => { if (!e.checkVisibility({ checkVisibilityCSS: true })) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  window.__seen = new Set();
  return true;
})()`;

const CANDIDATES = `(() => {
  const out = [];
  const all = [...document.querySelectorAll('body *')];
  for (const e of all) {
    if (e.closest('[inert], [aria-hidden=true]') && !e.matches('[tabindex]')) continue;
    if (e.disabled || e.closest('fieldset:disabled')) continue;
    if (e.tagName === 'INPUT' && e.type === 'hidden') continue;
    if (e.matches('svg, script, style, defs, title, desc, path, circle, rect, line, polygon, polyline, ellipse, text, tspan, use, stop, linearGradient, radialGradient, filter, clipPath, mask, pattern, marker, feGaussianBlur, feMerge, feMergeNode, feFlood, feComposite, feOffset, feColorMatrix') && !e.matches('[role], [tabindex]') && !(window.getEventListeners && ['click','pointerdown','mousedown','keydown'].some((t) => (getEventListeners(e)[t] || []).length))) continue;
    if (!window.__visible(e)) continue;
    const cs = getComputedStyle(e);
    const lst = window.getEventListeners ? getEventListeners(e) : {};
    const hasClick = ['click', 'pointerdown', 'mousedown', 'pointerup', 'mouseup', 'touchstart'].some((t) => (lst[t] || []).length);
    const hasKey = ['keydown', 'keyup', 'keypress'].some((t) => (lst[t] || []).length);
    const role = e.getAttribute('role');
    const interactiveRole = /^(button|link|tab|checkbox|switch|menuitem|option|radio|slider)$/.test(role || '');
    const nativ = window.__native(e);
    // cursor:pointer erbt; nur zählen, wenn das Element selbst Auslöser ist (Handler oder Rolle) oder ein reines Nicht-Standard-Element mit pointer ohne interaktiven Vorfahren
    const pointer = cs.cursor === 'pointer' && e.parentElement && getComputedStyle(e.parentElement).cursor !== 'pointer';
    if (nativ || interactiveRole || hasClick || e.hasAttribute('tabindex') && e.tabIndex >= 0 || pointer) {
      if (e.hasAttribute('tabindex') && e.tabIndex < 0 && !nativ && !hasClick && !interactiveRole && !pointer) continue;
      out.push({ i: window.__idx = (window.__idx || 0), sel: window.__sel(e), nativ, hasKey, hasClick, role, tabindex: e.getAttribute('tabindex') });
      e.setAttribute('data-kand', String(out.length - 1));
    }
  }
  return out;
})()`;

let errors = 0, warns = 0;
const E = (m) => { errors++; console.log('  X ' + m); };
const W = (m) => { warns++; console.log('  ! ' + m); };

for (const page of b.pages) {
  if (only && page !== only) continue;
  for (const w of widths) {
    console.log(`${page} @${w}px`);
    await b.open(page, w);
    await b.send('Page.bringToFront');
    await b.ev(HELP);
    const kand = await b.send('Runtime.evaluate', { expression: CANDIDATES, returnByValue: true, includeCommandLineAPI: true }).then((r) => r.result?.value || []);
    // Tab-Lauf
    await b.ev(`document.activeElement && document.activeElement.blur(); scrollTo(0,0); true`);
    const seq = [];
    let first = null, trapCheck = [];
    for (let i = 0; i < 1200; i++) {
      await tab();
      const r = await b.ev(`(() => { const e = document.activeElement; if (!e || e === document.body || e === document.documentElement) return null; window.__seen.add(e);
        const cs = getComputedStyle(e); const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none';
        const k = e.getAttribute('data-kand'); return { sel: window.__sel(e), name: window.__name(e), nativ: window.__native(e), role: e.getAttribute('role'), ring, kand: k, svg: !!e.closest('svg'), href: e.getAttribute('href') }; })()`);
      if (!r) { if (i > 0) break; else continue; }
      seq.push(r);
      if (i === 0) first = r;
    }
    if (!first) { E('kein Element per Tab erreichbar'); continue; }
    if (!/Zum Inhalt springen/.test(first.name)) E(`erster Tab-Stopp ist nicht der Skip-Link, sondern ${first.sel}`);
    else {
      await b.ev(`scrollTo(0,0); document.activeElement.blur(); true`);
      await tab();
      await key('Enter', 'Enter', 13, '\r');
      await sleep(300);
      const ok = await b.ev(`location.hash === '#main' && !!document.querySelector('main#main')`);
      if (!ok) E('Skip-Link springt nicht zu main#main');
      const h1 = await b.ev(`document.querySelectorAll('h1').length`);
      if (h1 !== 1) E(`${h1} h1-Überschriften (erwartet: genau eine)`);
      const lv = await b.ev(`(() => { let p = 0, bad = []; for (const h of document.querySelectorAll('h1,h2,h3,h4,h5,h6')) { const l = +h.tagName[1]; if (p && l > p + 1) bad.push(h.tagName + ' nach H' + p + ': ' + h.textContent.trim().slice(0, 30)); p = l; } return bad; })()`);
      lv.forEach((m) => E('Überschriftenebene übersprungen: ' + m));
      const lm = await b.ev(`({main: document.querySelectorAll('main').length, nav: [...document.querySelectorAll('nav')].filter((n) => !n.getAttribute('aria-label')).length, lang: document.documentElement.lang})`);
      if (lm.main !== 1) E(`${lm.main} main-Elemente`);
      if (lm.nav) E(`${lm.nav} nav ohne aria-label`);
      if (lm.lang !== 'de') E('lang ist nicht de');
    }
    // Fokusfalle: gleiche Elemente mehrfach, ohne dass die Folge endet
    const uniq = new Set(seq.map((s) => s.sel + '|' + s.name)).size;
    if (seq.length >= 1200) E(`Tab-Lauf endet nicht (mögliche Fokusfalle), ${uniq} verschiedene Elemente`);
    // Nicht erreichbare Kandidaten
    const reached = new Set(seq.filter((s) => s.kand !== null).map((s) => s.kand));
    // zusätzlich: Elemente, die einen erreichten Vorfahren haben (Kind eines Buttons usw.)
    const covered = await b.ev(`(() => { const r = []; document.querySelectorAll('[data-kand]').forEach((e) => { if (window.__seen.has(e) || [...window.__seen].some((s) => s.contains(e) && s !== e && (s.matches('a,button,summary,[role=button],[role=link]')))) r.push(e.getAttribute('data-kand')); }); return r; })()`);
    covered.forEach((c) => reached.add(c));
    for (const k of kand.map((_, i) => String(i))) {
      if (!reached.has(k)) {
        const c = kand[+k];
        // Eltern mit Handler (Event-Delegation) sind kein eigener Stopp, wenn ein erreichbares Kind-Element existiert
        const hasReachedChild = await b.ev(`(() => { const e = document.querySelector('[data-kand="${k}"]'); return [...window.__seen].some((s) => e.contains(s)); })()`);
        if (hasReachedChild) continue;
        // Roving Tabindex: Geschwister mit tabindex=-1 sind per Pfeiltasten erreichbar, wenn ein Geschwister ein Tab-Stopp ist
        const roving = await b.ev(`(() => { const e = document.querySelector('[data-kand="${k}"]'); return e.getAttribute('tabindex') === '-1' && !!e.getAttribute('role') && [...e.parentElement.children].some((s) => window.__seen.has(s)); })()`);
        if (roving) continue;
        // Bekannte Ausnahme: leere Fächer im Kettenspiel (nur belegte sind Ziele und werden dann fokussierbar)
        if (/^div\.cg-slot/.test(c.sel)) continue;
        E(`nicht per Tab erreichbar: ${c.sel}${c.role ? ' [role=' + c.role + ']' : ''}`);
      }
    }
    // Namen, Rollen, Fokus-Stil der erreichten Elemente
    const seen = new Set();
    for (const s of seq) {
      const id = s.sel; if (seen.has(id)) continue; seen.add(id);
      if (!s.name && !(await b.ev(`!!document.activeElement`))) continue;
      if (!s.name) E(`erreichbar, aber ohne Namen: ${s.sel}`);
      if (!s.nativ && !s.role) E(`erreichbar, aber ohne role: ${s.sel}`);
      if (!s.ring) {
        // Kein Outline: prüfen, ob sich Stil (Kontur, Filter, Schatten) bei Fokus gegenüber Unfokussiert ändert
        const diff = await b.ev(`(async () => { const e = [...window.__seen].find((x) => window.__sel(x) === ${JSON.stringify(s.sel)}); if (!e) return true;
          const snap = () => [e, ...e.querySelectorAll('*')].slice(0, 40).flatMap((n) => [getComputedStyle(n), getComputedStyle(n, '::before'), getComputedStyle(n, '::after')]).map((c) => { return [c.stroke, c.strokeWidth, c.filter, c.boxShadow, c.outlineStyle, c.backgroundColor, c.borderColor, c.color, c.opacity, c.textDecorationLine].join('|'); }).join('#');
          e.focus(); await new Promise((r) => setTimeout(r, 450)); const a = snap(); e.blur(); await new Promise((r) => setTimeout(r, 450)); const u = snap(); e.focus(); return a !== u; })()`);
        if (!diff) W(`kein sichtbarer Fokus-Stil: ${s.sel}`);
      }
    }
    // Enter und Leertaste bei Nicht-Standard-Elementen
    const nonNative = [...new Set(seq.filter((s) => !s.nativ))].filter((s, i, a) => a.findIndex((x) => x.sel === s.sel) === i);
    for (const s of nonNative.slice(0, 40)) {
      const idx = seq.findIndex((x) => x.sel === s.sel);
      // Fokus direkt setzen über data-kand, falls vorhanden, sonst über Selektor-Suche
      const res = await b.ev(`(() => { const all = [...window.__seen]; const e = all.find((x) => window.__sel(x) === ${JSON.stringify(s.sel)}); if (!e) return null; e.focus(); window.__clicks = 0; const h = () => { window.__clicks++; }; document.addEventListener('click', h, true); window.__h = h;
        window.__mo = new MutationObserver((m) => { window.__clicks += m.length; }); window.__mo.observe(document.body, { subtree: true, attributes: true, childList: true, characterData: true }); return true; })()`);
      if (!res) continue;
      const out = {};
      for (const [name, k, c, vk, txt] of [['Enter', 'Enter', 'Enter', 13, '\r'], ['Leertaste', ' ', 'Space', 32, ' ']]) {
        await b.ev(`window.__clicks = 0; true`);
        await key(k, c, vk, txt);
        await sleep(120);
        out[name] = await b.ev(`window.__clicks`);
        // Dialoge und Panels, die die Tab-Reihenfolge verändern könnten, wieder schließen
        await key('Escape', 'Escape', 27);
        await b.ev(`(() => { const e = [...window.__seen].find((x) => window.__sel(x) === ${JSON.stringify(s.sel)}); e && e.isConnected && e.focus(); return true; })()`);
      }
      await b.ev(`document.removeEventListener('click', window.__h, true); window.__mo.disconnect(); true`);
      if (!out.Enter) W(`reagiert nicht auf Enter: ${s.sel}`);
      if (!out.Leertaste && (s.role === 'button')) W(`reagiert nicht auf Leertaste: ${s.sel}`);
    }
    console.log(`  ${seq.length} Tab-Stopps, ${uniq} verschieden, ${kand.length} interaktive Kandidaten`);
  }
}
console.log(`\n${errors} Fehler, ${warns} Warnungen.`);
b.close();
process.exit(errors ? 1 : 0);
