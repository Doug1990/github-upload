# Was trägt deinen Tag?

Eine kleine Seite darüber, was hinter dem Alltag an Infrastruktur steckt, einmal am Beispiel Düsseldorf und einmal am Beispiel einer Zelle (die Zelle als Stadt). Alles ist ein Bild zum Ausprobieren und stark vereinfacht, jeder Abschnitt sagt dazu, wo das Bild hinkt.

Live: https://doug1990.github.io/github-upload/ (GitHub Pages, Repo `doug1990/github-upload`)

## Seiten

| Datei | Inhalt |
| --- | --- |
| `index.html` | Startseite: Düsseldorf, der Tag in Infrastruktur, Stadtkette, "Du gehörst dazu" |
| `zelle.html` | Die Zelle als Stadt: Kraftwerk, Zoll, Ausfall, Evolution, Gene, Teilung, Signale, Immunsystem und mehr |
| `karte-skizze.html` | Skizze von Düsseldorf als Karte, tippe an, was du heute gemacht hast |
| `impressum.html`, `datenschutz.html` | Rechtliches |

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
| `node tests/check.mjs` | Alle Seiten bei 1280, 768, 390 und 360 px: Konsolenfehler, horizontaler Überlauf, tote Links und Anker, title, Beschreibung, canonical, og:image, JSON-LD, sitemap.xml. Mit `--screens=<ordner>` entstehen Screenshots. |
| `node tests/kontrast.mjs` | Textkontrast mindestens 4,5 zu 1, auch nach Klicks |
| `node tests/tastatur.mjs` | Tabreihenfolge, Fokus-Stil, Erreichbarkeit, auch nach Klicks |
| `node tests/teilen.mjs` | Link-kopieren-Knöpfe an den Überschriften |
| `node tests/touch.mjs` | Touch-Bedienung bei 390 px (Scrollen über Flächen, Doppeltipp, Schieber) |
| `node tests/mikrotext.mjs` | Wirksame Schriftgröße von SVG-Beschriftungen bei schmaler Breite |
| `node tests/gene.mjs`, `immun.mjs`, `fliessband.mjs`, `tag.mjs`, `fragen.mjs` | Je ein Abschnitt der Zell-Seite |

## Vorschaubilder erzeugen

Die drei Bilder in `og/` (1200 mal 630 px) entstehen aus `og/vorlage.html`:

```
node og/render.mjs
```

Ergebnis sind `og/index.jpg`, `og/karte.jpg` und `og/zelle.jpg`.

## Arbeiten am Projekt

- Aufgabenliste und offene Entscheidungen stehen in `BACKLOG.md`.
- Pro Punkt ein Branch `claude/<kurzname>`, ein Pull Request, Tests wie oben.
- Sichtbare deutsche Texte: schlicht und direkt, keine Gedankenstriche.
- Neue Abschnitte brauchen: 390 px ohne horizontales Scrollen, Reduced Motion, Tastaturbedienung, Tippflächen ab 44 px und einen Hinweis, wo das Bild hinkt.
- Nie `git add -A`, immer gezielt Dateien hinzufügen.

## Hinweis zu sitemap.xml und robots.txt

Beide Dateien liegen im Repo, GitHub Pages liefert sie unter `/github-upload/`. Suchmaschinen lesen `robots.txt` aber nur im Wurzelverzeichnis einer Domain (hier `doug1990.github.io/robots.txt`). Die `sitemap.xml` lässt sich in der Search Console direkt eintragen.
