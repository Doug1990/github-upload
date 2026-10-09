# Was trägt deinen Tag?

Eine kleine Seite darüber, was hinter dem Alltag an Infrastruktur steckt, einmal am Beispiel Düsseldorf und einmal am Beispiel einer Zelle (die Zelle als Stadt). Alles ist ein Bild zum Ausprobieren und stark vereinfacht, jeder Abschnitt sagt dazu, wo das Bild hinkt.

Live: https://doug1990.github.io/github-upload/ (GitHub Pages, Repo `doug1990/github-upload`)

## Seiten

| Datei | Inhalt |
| --- | --- |
| `index.html` | Startseite: Düsseldorf, der Tag in Infrastruktur, Stadtkette, "Wenn es hakt", "Wer hält es instand", "Du gehörst dazu". Der Seitenkopf trägt noch das Etikett "in Arbeit". |
| `zelle.html` | Die Zelle als Stadt: Kraftwerk, Zoll, Ausfall, Evolution, Gene, Teilung, Signale, Immunsystem, "Dorf oder Stadt" und mehr |
| `karte-skizze.html` | Karte von Düsseldorf (isometrisch, schematisch): tippe an, was du heute gemacht hast, und die beteiligten Orte leuchten, mit Nummern, Ebenen-Filter und Infokarte. Elf Tätigkeiten, kombinierbar. |
| `impressum.html`, `datenschutz.html` | Rechtliches |
| `glossar.html` | Glossar: Begriffe aus Zelle und Stadt mit Bild und kurzer Erklärung (Schreibweisen in `BEGRIFFE.md`, geprüft von `tests/begriffe.mjs`) |
| `abschluss.html` | Abschlussseite "Eine Stadt, ein Körper, ein Netz": fünf Fragen, vier Antworten (Düsseldorf, Zelle, Körper, Internet), je Spalte ein Feld "Wo das Bild hinkt" |
| `tagesverlauf.html` | Ein Tag im Netz: Beispielkurven für Strom, Wasser und Verkehr mit Uhrzeit-Schieber (alle Werte frei gewählt, in Prozent der Tagesspitze) |
| `raetsel.html` | Mitmach-Format: "Wer bin ich?" mit fünf Rätseln und Baukasten "Baue deine Stadt". Rätsel: mit drei Hinweisen, Antwort per Tippen oder Tastatur, ohne Skript sind Hinweise und Lösungen sichtbar |

Alles läuft ohne Build und ohne fremde Server: eine HTML-Datei je Seite mit eigenem CSS und Skript, Schriften liegen in `fonts/`, Vorschaubilder in `og/`. Eingaben bleiben im Browser.

## Lokal ansehen

Irgendein statischer Server im Ordner reicht, z.B.

```
python3 -m http.server 8000
```

und dann http://localhost:8000/ öffnen.

## Prüfen

Die Skripte brauchen nur Node 22 und ein lokales Chrome (Pfad bei Bedarf mit `--chrome=<pfad>`). Ohne grünen Lauf wird nicht gemergt.

| Befehl | Prüft |
| --- | --- |
| `node tests/alle.mjs [--schnell] [--wiederholen] [--eigene] [--parallel=N]` | Alle Prüfskripte nacheinander in einem gemeinsamen Chrome (jedes Skript öffnet nur einen Tab), mit Dauer und Ergebnis. `--schnell` lässt die langen aus, `--wiederholen` wiederholt Fehlschläge einmal, `--eigene` startet je Skript einen eigenen Chrome, `--parallel=N` ist ausprobiert und wird nicht empfohlen (Schnelllauf rund 13 Minuten) |
| `node tests/check.mjs` | Alle Seiten bei 1280, 768, 390 und 360 px: Konsolenfehler, horizontaler Überlauf, tote Links und Anker, title, Beschreibung, canonical, og:image, JSON-LD, sitemap.xml. Mit `--screens=<ordner>` entstehen Screenshots. Externe Links per HEAD (Warnung, `--ohne-extern` überspringt). `--langsam` misst die Ladezeit bei 3G. |
| `node tests/kontrast.mjs` | Textkontrast mindestens 4,5 zu 1, auch nach Klicks |
| `node tests/tastatur.mjs` | Tabreihenfolge, Fokus-Stil, Erreichbarkeit, auch nach Klicks |
| `node tests/teilen.mjs` | Link-kopieren-Knöpfe an den Überschriften |
| `node tests/touch.mjs` | Touch-Bedienung bei 390 px (Scrollen über Flächen, Doppeltipp, Schieber) |
| `node tests/begriffe.mjs` | Festgelegte Schreibweise der Leitbegriffe (siehe `BEGRIFFE.md`), ohne Chrome |
| `node tests/mikrotext.mjs` | Wirksame Schriftgröße von SVG-Beschriftungen bei schmaler Breite |
| `node tests/fehlertoleranz.mjs --seite=<datei>` | Seite läuft weiter, wenn localStorage, AudioContext, ResizeObserver oder Canvas fehlen (alle Knöpfe gedrückt, keine Ausnahmen, Text bleibt) |
| `node tests/gewicht.mjs [--budget=<KB>]` | Gewicht je Seite (roh und gzip, Schriften getrennt, Anfragen), Fehler über 150 KB gzip, Warnung ab 85 Prozent |
| `node tests/zoom.mjs [--faktor=1.5]` | 320 px Breite und Schrift auf 150 Prozent (mit `--faktor=3` strenger): kein Überlauf, kein abgeschnittener Text, nichts außerhalb des Fensters |
| `node tests/fokus.mjs [--seite=<datei>]` | Fokus nach Enter auf Knöpfen und Tab danach nie auf body (Zell-Seite dauert einige Minuten) |
| `node tests/abschluss.mjs` | Abschlussseite: fünf Fragen, vier Antworten, vier Felder "Wo das Bild hinkt", Links |
| `node tests/tagesverlauf.mjs` | Tagesverlauf-Seite: drei Netze, Kurven, Werte, Füllstand, Auslastung, Tippflächen |
| `node tests/raetsel.mjs` | Rätselseite: fünf Rätsel, Hinweise nacheinander, richtige und falsche Antwort, ohne Skript, Tippflächen |
| `node tests/baukasten.mjs` | Baukasten "Baue deine Stadt" auf der Rätselseite: sechs Bausteine mit Abhängigkeiten, Ketten, alles bauen und abreißen |
| `node tests/visuell.mjs [--update]` | Visuelle Regression: oberer Seitenbereich jeder Seite bei 1280 und 390 px gegen Referenzbilder in `tests/visuell/` (Toleranz 0,05 Prozent der Pixel). Nach gewollten Änderungen `--update`, Differenzbilder landen in `tests/visuell/diff/` |
| `node tests/skalen.mjs` | Schieber "Skala" auf der Abschlussseite: drei Stufen, Feld "Anders", ohne Skript beides sichtbar |
| `node tests/normen.mjs` | Abschnitt "Alles hängt an Standards" auf der Abschlussseite: drei Paare, Variante wechseln, Norm einführen, Tippflächen |
| `node tests/schemata.mjs` | Screenreader: Jedes SVG hat einen Namen oder ist versteckt, jede Statuszeile liegt in einer Live-Region |
| `node tests/stoerung.mjs` | Startseite, "Wenn es hakt": Ausbreitung nach dem Abschalten, Leitungen, Reset, Tastatur |
| `node tests/instand.mjs` | Startseite, "Wer hält es instand": Strategien über die Jahre, Zeitraffer, Regler |
| `node tests/dorf.mjs` | Zell-Seite, "Dorf oder Stadt": Größenregler, Kennzahlen, Hinweise (`--gegenprobe` baut absichtlich Fehler ein) |
| `node tests/gene.mjs`, `immun.mjs`, `fliessband.mjs`, `tag.mjs`, `fragen.mjs`, `quorum.mjs`, `alterung.mjs` | Je ein Abschnitt der Zell-Seite (`immun.mjs` kennt ebenfalls `--gegenprobe`) |

`tests/chrome.mjs` ist keine eigene Prüfung, sondern die gemeinsame Hilfe der Skripte (eigener Server auf das Repo, headless Chrome über das DevTools-Protokoll). `tests/mikrotext-basis.json` hält die bekannten Altlasten für `mikrotext.mjs`. In `tests/ci/pruefen.yml` liegt die Vorlage für einen CI-Workflow. Sie läuft erst, wenn sie nach `.github/workflows/` kopiert ist (Stand siehe `BACKLOG.md`).

## Vorschaubilder erzeugen

Die drei Bilder in `og/` (1200 mal 630 px) entstehen aus `og/vorlage.html`:

```
node og/render.mjs
```

Ergebnis sind `og/index.jpg`, `og/karte.jpg` und `og/zelle.jpg`.

## Arbeiten am Projekt

- Aufgabenliste und offene Entscheidungen stehen in `BACKLOG.md`. Die Seite ist noch in Arbeit, einzelne Punkte dort sind offen.
- Pro Punkt ein Branch `claude/<kurzname>`, ein Pull Request, Tests wie oben.
- Sichtbare deutsche Texte: schlicht und direkt, keine Gedankenstriche.
- Neue Abschnitte brauchen: 390 px ohne horizontales Scrollen, Reduced Motion, Tastaturbedienung, Tippflächen ab 44 px und einen Hinweis, wo das Bild hinkt.
- Nie `git add -A`, immer gezielt Dateien hinzufügen.

## Hinweis zu sitemap.xml und robots.txt

Beide Dateien liegen im Repo, GitHub Pages liefert sie unter `/github-upload/`. Suchmaschinen lesen `robots.txt` aber nur im Wurzelverzeichnis einer Domain (hier `doug1990.github.io/robots.txt`). Die `sitemap.xml` lässt sich in der Search Console direkt eintragen.
