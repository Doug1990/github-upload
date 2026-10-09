// Startet alle Prüfskripte nacheinander (nie parallel, damit der Rechner nicht überlastet wird) und fasst das Ergebnis zusammen.
// Aufruf: node tests/alle.mjs [--schnell] [--wiederholen] [--parallel=N] [--eigene] [--nur=check,gene] [--ohne=fokus] [--chrome=<pfad>]
// Alle Skripte teilen sich einen Chrome (jedes öffnet nur einen eigenen Tab), --eigene startet je Skript einen eigenen Chrome. --parallel=N lässt N Skripte gleichzeitig laufen (Vorgabe 1).
// --wiederholen: ein fehlgeschlagenes Skript läuft einmal erneut, besteht es dann, wird es als flackernd vermerkt (touch.mjs tut das gelegentlich).
// --schnell lässt die langen Läufe aus (fokus, fehlertoleranz, kontrast, tastatur, touch), sie laufen in der Vollprüfung.
// Exit-Code 1, wenn ein Skript Fehler meldet oder länger als zehn Minuten braucht. Je Skript steht Dauer und letzte Zeile der Ausgabe da.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const arg = (n) => (process.argv.find((a) => a.startsWith('--' + n + '=')) || '').split('=').slice(1).join('=');
const flag = (n) => process.argv.includes('--' + n);
const LANG = ['fokus', 'fehlertoleranz', 'kontrast', 'tastatur', 'touch'];
const KEINE_PRUEFUNG = ['chrome', 'alle'];
let namen = fs.readdirSync(HIER).filter((f) => f.endsWith('.mjs')).map((f) => f.replace(/\.mjs$/, '')).filter((n) => !KEINE_PRUEFUNG.includes(n)).sort();
// check zuerst, dann die schnellen, dann die langen
namen.sort((a, b) => (a === 'check' ? -1 : b === 'check' ? 1 : LANG.includes(a) - LANG.includes(b) || a.localeCompare(b)));
if (flag('schnell')) namen = namen.filter((n) => !LANG.includes(n));
if (arg('nur')) namen = arg('nur').split(',');
if (arg('ohne')) namen = namen.filter((n) => !arg('ohne').split(',').includes(n));
const PARALLEL = Math.max(1, parseInt(arg('parallel'), 10) || 1);
const chromePfad = arg('chrome') || process.env.CHROME || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => fs.existsSync(p));
let gemeinsam = null, profil = null, envPort = {};
if (!flag('eigene')) {
  if (!chromePfad) { console.error('Chrome nicht gefunden. Pfad mit --chrome=... angeben.'); process.exit(2); }
  profil = fs.mkdtempSync(path.join(os.tmpdir(), 'alle-'));
  gemeinsam = spawn(chromePfad, ['--headless=new', '--disable-gpu', '--mute-audio', ...(process.env.CI ? ['--no-sandbox'] : []), '--remote-debugging-port=0', '--user-data-dir=' + profil, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  const ws = await new Promise((resolve, reject) => {
    let buf = '';
    gemeinsam.stderr.on('data', (d) => { buf += d; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) resolve(m[1]); });
    setTimeout(() => reject(new Error('Chrome startet nicht')), 15000);
  });
  envPort = { CHROME_PORT: new URL(ws).port };
}
const chrome = arg('chrome') ? ['--chrome=' + arg('chrome')] : [];

const lauf = (name) => new Promise((resolve) => {
  const t0 = Date.now(); let aus = '';
  const extra = name === 'check' ? ['--ohne-extern'] : [];
  const p = spawn(process.execPath, [path.join(HIER, name + '.mjs'), ...chrome, ...extra], { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, ...envPort } });
  const timer = setTimeout(() => { p.kill(); }, 10 * 60 * 1000);
  p.stdout.on('data', (d) => { aus += d; }); p.stderr.on('data', (d) => { aus += d; });
  p.on('close', (code, sig) => { clearTimeout(timer); resolve({ name, code: sig ? 124 : code, sek: Math.round((Date.now() - t0) / 1000), aus }); });
});

const t0 = Date.now(); const ergebnisse = []; let naechster = 0;
async function arbeiter() {
  while (naechster < namen.length) {
    const n = namen[naechster++];
    if (!fs.existsSync(path.join(HIER, n + '.mjs'))) { console.log(`?  ${n}: Skript fehlt`); ergebnisse.push({ name: n, code: 2, sek: 0, aus: '' }); continue; }
    let r = await lauf(n);
    // Ein Fehlschlag wird einmal wiederholt. Besteht der zweite Lauf, gilt das Skript als flackernd (Eingabe-Emulation, Zeitabhängigkeit) und wird so vermerkt.
    if (r.code !== 0 && flag('wiederholen')) { const r2 = await lauf(n); if (r2.code === 0) { r2.aus = r2.aus.trim() + ' (erst im 2. Lauf, flackert)'; r2.sek += r.sek; } r = r2; }
    ergebnisse.push(r);
    const zeilen = r.aus.trim().split('\n').filter(Boolean);
    const letzte = (zeilen[zeilen.length - 1] || '').slice(0, 100);
    console.log(`${r.code === 0 ? 'OK ' : 'X  '} ${n.padEnd(15)} ${String(r.sek).padStart(4)} s  ${letzte}`);
  }
}
await Promise.all(Array.from({ length: PARALLEL }, arbeiter));
if (gemeinsam) { gemeinsam.kill(); try { fs.rmSync(profil, { recursive: true, force: true }); } catch {} }
const schlecht = ergebnisse.filter((r) => r.code !== 0);
console.log(`\n${ergebnisse.length} Skripte in ${Math.round((Date.now() - t0) / 1000)} s, ${schlecht.length} mit Fehlern.`);
for (const r of schlecht) { console.log(`\n--- ${r.name} (Exit ${r.code}) ---`); console.log(r.aus.trim().split('\n').slice(-12).join('\n')); }
process.exit(schlecht.length ? 1 : 0);
