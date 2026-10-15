# Gestaltung: weniger Text, mehr Bild

Ziel der Überarbeitung: Die Seite soll zeigen, wie Infrastruktur funktioniert, in der Stadt (Menschen, Leitungen, Orte) und im Körper (Zelle, Stoffwechsel, Signale). Das passiert über Bewegung und Zeichnung, nicht über Absätze. Text ist Beschriftung, nicht Erklärung.

Vorbild für die Bildsprache sind die drei Prototypen `entwurf/reise-prototyp.html`, `entwurf/ausfall-prototyp.html` und `entwurf/ausfall-grafik.html`.

## Regeln

1. **Ein Bild, ein Gedanke, ein bis zwei Sätze.** Pro Abschnitt höchstens eine Überschrift und zwei kurze Sätze sichtbar. Mehr Erklärung gehört in ein zugeklapptes "Warum?" oder "Wo das Bild hinkt".
2. **Erst sehen, dann lesen.** Jeder Abschnitt hat eine Zeichnung oder Animation, die den Mechanismus zeigt (Fluss, Takt, Knoten, Ausfall, Umweg). Eine Deko ohne Funktion zählt nicht.
3. **Eine Linie, ein Fluss.** Hauptleitung als durchgezogene Linie, Reserve und Umweg gestrichelt, Punkte als Bewegung auf der Leitung. Ausfall zeigt sich als Lücke, der Umweg als neuer Weg.
4. **Vier Ebenen mit festen Farben** (aus den Prototypen, hell und dunkel):
   - Kulturell `--kult` `#B9832A` (dunkel `#D9A64A`)
   - Digital `--digi` `#5563BF` (dunkel `#8590E6`)
   - Physisch `--phys` `#2C7A82` (dunkel `#4FA9B1`)
   - Biologisch `--bio` `#56903F` (dunkel `#7DBB63`)
5. **Stadt und Körper gleiche Zeichensprache.** Dieselbe Leitung, derselbe Knoten, derselbe Punkt, einmal als Rohr und einmal als Ader. So sieht man, dass es dasselbe Prinzip ist.
6. **Schrift:** Fraunces für Überschriften und Schlusssätze, IBM Plex Sans für Beschriftung. Beschriftungen kurz, im Bild.
7. **Bewegung mit Sinn.** Alles, was sich bewegt, zeigt einen Vorgang. Reduced Motion zeigt den Endzustand statt der Animation.

## Was bleibt (Qualitätsregeln des Projekts)

- 390 px ohne horizontales Scrollen, Tippflächen ab 44 px, Tastaturbedienung, Reduced Motion.
- Ein Hinweis, wo das Bild hinkt, bleibt pro Abschnitt, aber zugeklappt.
- Keine Gedankenstriche, schlichter Ton, Schreibweisen aus `BEGRIFFE.md`.
- Fachliche Aussagen werden beim Kürzen nicht verändert. Was nur durch Text trägt, bleibt Text.
- Prüfen mit `node tests/alle.mjs --schnell`, nach gewollten Änderungen Referenzbilder mit `node tests/visuell.mjs --update` nach Sichtprüfung.

## Messlatte Text

Sichtbare Wörter (ohne Skript, Stil, SVG), Stand vor der Überarbeitung: `index.html` 1952, `zelle.html` 8549, `abschluss.html` 839, `glossar.html` 983, `raetsel.html` 465, `tagesverlauf.html` 241, `karte-skizze.html` 231. Ziel: Startseite und Zell-Seite je rund ein Drittel weniger, ohne dass ein Mechanismus verloren geht.
