# Gestaltung, nächste Runde (Konzept K2)

Stand 18. Oktober 2026, gerendert mit `tests/chrome.mjs` bei 1280 und 390 px, alle sieben Hauptseiten, Ausschnitte über die ganze Länge. Das hier ist ein Konzept. Nichts davon ist gebaut. Zelle und Stadt bleiben die Grundidee, die Regeln aus `GESTALTUNG.md` gelten weiter.

## 1. Ist-Zustand

Sichtbare Wörter (ohne Skript, Stil, SVG), gemessen heute, in Klammern der Stand vor der Überarbeitung:

| Seite | Wörter heute | Vorher | größte Abschnitte |
| --- | --- | --- | --- |
| index | 1116 | 1952 | hero 206, instand 125, landing 121, stoerung 116, now 84 |
| zelle | 5387 | 8549 | dorf 287, immun 252, bauamt 233, gen 225, zoll 217, regulation 216, signale 212 |
| abschluss | 544 | 839 | skalen 150, normen 82 |
| glossar | 520 | 983 | ein Block, rund 40 Einträge |
| raetsel | 341 | 465 | baukasten 98 |
| tagesverlauf | 122 | 241 | ein Block |
| karte-skizze | 130 | 231 | ein Block |

### Index (Düsseldorf)
- Einstieg: Hero "Hinter fast allem, was du machst, steckt Infrastruktur." mit vier Ebenenlinien und Begleiter. Darunter "Das Wichtigste in Kürze" als Punktekette (sieben Stationen) und die Wahl "In 2 Minuten" oder "Ganz in Ruhe".
- Abfolge: Querschnitt (Was hast du heute gemacht?), Deine Reise, Einkaufsregal, Was kommt vor was?, Du gehörst dazu, Fällt eine Leitung aus, Instandhaltung, Kosten, Es läuft weiter, Wie Energie unterwegs entsteht (optional), dann "Bevor du gehst" und Weiter zur Karte.
- Sehr bildstark in "Fällt eine Leitung aus" (Lücke, gestrichelter Umweg), "Du gehörst dazu" (Du in der Mitte) und der Reise.
- Textlastig bleibt der Querschnitt: nach dem Antippen erscheinen Kärtchen mit drei bis vier Zeilen Fließtext und eine lange Liste "Was darunter liegt".

### Zelle
- Einstieg: "In fast jeder deiner Zellen stehen Kraftwerke." Hero fast leer (große Kreise, ein Satz, ein Link). Danach Teile 1 bis 5 mit je einer Teil-Überschrift.
- Etwa 25 Bausteine mit Reglern, Schaltern und Knöpfen: Kraftwerk, Zoll, Entstehung (Auswahl), Muskel/Nerv/Fettzelle, Fließband, Archiv, Fließband mit Störungen, Kontrollpunkt, Briefe, Nachbarn, Bakterien, Körper als Netz, Drei Fragen zum Schluss.
- Mit Abstand die größte Seite: 561 KB HTML, 5387 Wörter, die Seite endet in drei zugeklappten Fragen.
- Bei 390 px stehen viele Zahlenkacheln und Kästen "In der Zelle" und "In der Stadt" untereinander. Das wird lang und gleichförmig.

### Abschluss ("Eine Stadt, ein Körper, ein Netz")
- Fünf Fragen, vier Antworten als Vergleichskacheln (Düsseldorf, Zelle, Körper, Internet) mit je einer kleinen Leitungsskizze. Danach Normen-Spiel, "Gleicher Name, anderer Mechanismus" mit Schieber, vier zugeklappte "Wo die Bilder hinken", Linkzeile.
- Stärkste Seite für die Wiedererkennung: dieselbe Linie viermal, jedes Mal anders.
- Es ist ein Vergleich, aber kein Schluss: Die Seite endet mit einer Linkzeile, nicht mit einem Satz oder einem Bild, das hängen bleibt.

### Glossar, Rätsel, Tagesverlauf, Karte
- Glossar: Karten mit Ebenenfarbe, Icon, Bild-Wort in Farbe, ein bis drei Zeilen. Wenige kleine Skizzen (Quorum, Redundanz, Osmose, Gefälle). Bei 390 px rund 8 Bildschirme lang, ohne Suche oder Filter.
- Rätsel: fünf Rätsel mit je drei Hinweisen, dann Baukasten mit Abhängigkeiten. Das Spiel ist klar, die Rückmeldung ist still (nur Text).
- Tagesverlauf: Diagramm mit Strom, Wasser, Verkehr, Uhr-Schieber. Gut, aber ohne Fuß und ohne Weiterleitung.
- Karte-Skizze: isometrische Karte mit Tätigkeits-Chips und mitlaufender Liste. Hat als einzige Nebenseite die Seitenreihe oben und "Weiter" unten.

### Querschnitt
- Seitenreihe (Düsseldorf, Karte, Zelle) als Kopfleiste nur auf index, zelle, karte-skizze. Abschluss, Glossar, Rätsel, Tagesverlauf haben nur "← Zurück", und das Ziel ist verschieden (Rätsel zu Abschluss, die anderen zu Index).
- Impressum und Datenschutz sind nur von index, zelle und karte-skizze verlinkt. Auf den vier Nebenseiten fehlt der Fuß. Auch Vorschaubilder fürs Teilen (og-Tags) gibt es nur auf diesen drei.
- Ton: Schalter "Ton an" schwebt auf index (zwei Stellen: HUD und Schalter in der Kopfzeile) und auf zelle ("Ton aus"). Die Nebenseiten haben keinen Ton. Der Zustand ist pro Seite getrennt (eigener Speicherschlüssel auf zelle).
- Barrierefreiheit: Reduced Motion ist auf den großen Seiten dicht abgedeckt (index 18, zelle 42 Stellen), `noscript`-Hinweis auf index und zelle, Tastatur und Kontrast laufen als Prüfskripte. Sprungmarken und Fokusführung sind getestet. Auf den vier kleinen Seiten ist Reduced Motion nur wenig abgedeckt (1 bis 3 Stellen), dort bewegt sich aber auch wenig.
- Ladeeindruck: Schriften lokal, kein CDN. Das Zell-Hero ist beim Öffnen praktisch leer (Kreise und ein Satz), bei zelle.html mit 561 KB sieht man erst nach dem Parsen etwas. Die Seiten sind sonst schnell und leer von Ruckeln, nur die Startseite zeigt rund 10 Prozent Hauptthread im Leerlauf (laut Backlog Punkt 6).

## 2. Stärken
- Eine Designsprache über alle Seiten: durchgezogene Linie als Fluss, gestrichelter Umweg, Punkte als Bewegung, Lücke bei Ausfall. Auf Index (Ausfall), Zelle (Kontrollpunkt, Diffusion gegen Motor), Abschluss (vier Skizzen) und Glossar (Redundanz) sofort wiederzuerkennen.
- Die Vier-Ebenen-Farben tragen: Chips, Karten, Linien, Legende der Karte. Ein Blick reicht, um die Ebene zu erkennen.
- Die besten Abschnitte erklären durch Bedienung, nicht durch Text: Ausfall, Reise, Fließband, Archiv, Kontrollpunkt.
- "Wo das Bild hinkt" als zugeklapptes Muster ist überall gleich und ehrlich. Das gibt der Seite Glaubwürdigkeit.
- Hero der Startseite: ein Satz, vier ruhige Linien. Der Einstieg ist ruhig und lädt zum Scrollen ein.
- Zwei Lesegeschwindigkeiten ("In 2 Minuten", "Ganz in Ruhe") und der Zurück-Weg vom Glossar: Orientierung beim Einstieg ist gut mitgedacht.
- Technisch solide: 390 px ohne seitliches Scrollen auf allen sieben Seiten in meinen Ausschnitten, Tippflächen groß, Prüfskripte für Kontrast, Tastatur, Touch, Zoom.

## 3. Schwächen
- Dramaturgie: Der Bogen geht gut los (Hero, Reise, Ausfall), verliert aber zur Mitte der Startseite Spannung (Instandhaltung, Kosten, Es läuft weiter sind drei ähnliche Rechen-Kästen mit Reglern). Der Abschluss auf Index ("Bevor du gehst") ist schön, aber leise, danach springt die Seite zur Karte, ohne die Leitidee zu bündeln.
- Der Gesamtbogen der Reihe ist unklar: Düsseldorf, Karte, Zelle, Abschluss, Rätsel, Tagesverlauf, Glossar stehen gleichrangig nebeneinander, nur die ersten drei sind Reihe. Wer von Zelle fertig ist, landet in drei zugeklappten Fragen und keinem klaren nächsten Schritt außer dem Abschluss.
- Zelle ist lang und gleichförmig. Gleiches Muster (Überschrift, Satz, Regler, Kasten In der Zelle, Kasten In der Stadt, Wo das Bild hinkt) rund zwanzigmal. Es fehlt ein Atempunkt oder eine Rückschau zwischen den Teilen, und es gibt keinen Fortschritt außer den Teil-Überschriften.
- Nebenseiten sind Inseln: kein Fuß mit Impressum, keine Seitenreihe, keine Vorschaubilder, Rückweg je nach Seite anders.
- Interaktion fühlt sich an manchen Stellen tot an: Der Querschnitt auf Index zeigt nach "Einordnen" erst eine Textliste, im Abschluss sind die vier Kacheln oben nur Bild ("Ausfall zeigen" ist der einzige Knopf), die Glossarkarten haben Pfeil, aber der Pfeil führt nur weiter. Die Rätsel melden richtig oder falsch nur still als Text.
- Mobil: Das Glossar ist eine lange Spalte ohne Suche oder Sprung. In Zelle sind die Zahlenkacheln bei 390 px dreispaltig und eng, die Kästen In der Zelle und In der Stadt wiederholen sich. Die schwebenden Bedienelemente (Ton, Ebenenpunkte unten) verdecken bei 390 px unten rechts Inhalt, siehe Reise-Chips und "Wo das Bild hinkt" in den Ausschnitten.
- Ton: zwei getrennte Klangwelten (Index, Zelle), keine auf den Nebenseiten. Das ist so gewollt, bis Björn Probe gehört hat.
- Barrierefreiheit: Die kleinen Beschriftungen in den Skizzen (Abschluss, Glossar) sind bei 390 px sehr klein. Hell-Schalter fehlt (Backlog 21).
- Ladeeindruck: Das Zell-Hero (große leere Fläche, ein Satz) wirkt beim Öffnen wie ein halb geladenes Blatt. Kein Platzhalter für die Bilder.

## 4. Verbesserungen (zwölf, nach Reihenfolge)

Reihenfolge: erst risikoarm und großer Hebel, dann Mittelgroßes, zuletzt Entscheidungen mit Geschmack.

### 1. Fuß mit Impressum, Datenschutz und Rückmeldung auf den vier Nebenseiten (sofort umsetzbar, ein PR, klein und sicher)
- Aufwand S. Nutzen: Impressum ist von jeder Seite erreichbar, die Reihe wirkt als ein Ganzes. Risiko: sehr klein, nur Links aus dem Fuß von `karte-skizze.html` übernehmen, keine Texte ändern.
- Abnahme: abschluss, glossar, raetsel, tagesverlauf haben denselben Fuß wie karte-skizze, 390 px ohne Querscroll, `node tests/alle.mjs --schnell` grün, visuelle Referenzen für diese vier Seiten nach Sichtprüfung erneuert.

### 2. Gleicher Kopf und gleiches "Weiter" auf den Nebenseiten (sofort umsetzbar, ein PR, klein und sicher)
- Aufwand S. Nutzen: Orientierung, kein Sackgassen-Gefühl. Die Nebenseiten bekommen dieselbe Kopfleiste (`pfad-weg`) und ein "Weiter" wie index, zelle, karte-skizze, mit festgelegter Rückrichtung. Risiko: klein, nur Markup und vorhandene Stile.
- Abnahme: Auf jeder der sieben Seiten ist die aktuelle Seite in der Leiste markiert (`aria-current`), das "Weiter" führt nach dem Plan: Düsseldorf, Karte, Zelle, Abschluss, Rätsel. Tagesverlauf und Glossar hängen unten am Abschluss bzw. an Index. Tastaturtest `tastatur.mjs` und `tests/ordnung.mjs` grün.

### 3. Vorschau-Meta (og-Tags, Beschreibung) für die vier Nebenseiten (sofort umsetzbar, ein PR, klein und sicher)
- Aufwand S. Nutzen: Wer einen Link zu Glossar, Rätsel oder Tagesverlauf teilt, sieht ein Bild und einen Satz. Bilder liegen schon in `og/`. Risiko: sehr klein, kein sichtbarer Eingriff.
- Abnahme: Jede der vier Seiten hat `og:title`, `og:description`, `og:image`, `<meta name="description">` nach dem Muster von index, Texte ohne Gedankenstrich, `node tests/check.mjs` grün.

### 4. Textabbau im Querschnitt der Startseite
- Aufwand M. Nutzen: Der Querschnitt ist die erste Bedienung der Seite und derzeit eine Textliste. Statt Fließtext je Tätigkeit: die Ebenen als vier Punkte auf einer Linie (wie im Hero), je ein Wort. Der Text bleibt als zugeklapptes "Mehr". Risiko: mittel, Inhalte der Kärtchen sind Fachaussagen und dürfen beim Kürzen nicht kippen.
- Abnahme: Querschnitt unter 70 Wörtern sichtbar nach dem Antippen, alle Fachaussagen erreichbar (zugeklappt), 390 px ohne Querscroll, `tests/saetze.mjs` und `tests/mikrotext.mjs` grün.

### 5. Ruhige Bilder statt Kästen in der Mitte der Startseite
- Aufwand M. Nutzen: Instandhaltung, Kosten, Es läuft weiter sind bisher drei Rechenkästen. Die Idee: Instandhaltung mit der Lücke bei Ausfall (Streifen mit Lücke ist schon da) groß zeigen und die Zahlen zugeklappt lassen, Kosten als eine Zeile. Risiko: mittel, Zahlen sind Beispielwerte mit Quellen.
- Abnahme: Auf Index nach dem Ausfall-Abschnitt kommt innerhalb von zwei Bildschirmen bei 390 px ein neues Bild, nicht noch ein Kasten. Sichtbare Wörter Index unter 1000.

### 6. Glossar durchsuchbar und mit Ebenenfilter
- Aufwand M. Nutzen: Auf dem Handy ist das Glossar acht Bildschirme lang. Ein Suchfeld und vier Ebenenchips (Farben wie überall) machen es zum Nachschlagen. Risiko: klein bis mittel, nur Filterlogik, Texte bleiben.
- Abnahme: Filter funktioniert mit Tastatur, `aria-live` meldet die Trefferzahl, ohne Skript sind alle Karten sichtbar, Reduced Motion bleibt gleich.

### 7. Rückmeldung für Rätsel und Normen-Spiel
- Aufwand S bis M. Nutzen: Richtig oder falsch soll man sehen: das passende Teil springt in die Skizze (Zeichnung rechts im Rätsel), falsches wackelt nicht, sondern bleibt gestrichelt. Risiko: klein.
- Abnahme: Bei richtigem Tipp wird die Zeichnung im Kopf der Karte hervorgehoben, Statusmeldung für Screenreader, Reduced Motion zeigt den Endzustand sofort.

### 8. Zelle: Atempunkte und Fortschritt
- Aufwand M. Nutzen: Zwischen den fünf Teilen eine kurze Rückschau-Zeile mit der Linie (Teil 1 von 5 erledigt, Punkt auf der Linie), dazu eine schlanke Teilleiste. Das ist ein Teil von Backlog 7 (Lernpfad), aber ohne localStorage. Risiko: mittel, Länge der Seite bleibt.
- Abnahme: Die Teilleiste ist bei 390 px nicht höher als 48 px, springt per Tastatur, markiert den aktuellen Teil beim Scrollen (IntersectionObserver), keine neuen Konsolenfehler.

### 9. Ladeeindruck: Platzhalter und Hero der Zelle
- Aufwand S bis M. Nutzen: Das Zell-Hero soll sofort etwas zeigen: die Kreise als ruhige Zellen, ein Punkt, der sich bewegt. Für die großen SVG und Reglerbausteine ein Platzhalter mit fester Höhe (kein Springen beim Laden). Risiko: klein, Messung vorher nachher mit `leerlauf.mjs` und einem Layout-Sprung-Test.
- Abnahme: Kein Layout-Sprung (CLS unter 0,05 im Headless-Lauf), Hero zeigt in der ersten Sekunde einen sichtbaren Vorgang, Reduced Motion zeigt Standbild.

### 10. Mobil: Zahlenkacheln und Schwebe-Elemente
- Aufwand M. Nutzen: Bei 390 px zweispaltige statt dreispaltige Zahlenkacheln, der Ton-Schalter und die Ebenenpunkte so legen, dass sie keinen Inhalt verdecken (nach unten links, oder beim Scrollen einklappen). Risiko: mittel, Berührt viele Stellen, deshalb nach Gegenlesen der Bilder.
- Abnahme: Auf allen sieben Seiten bei 390 px verdeckt kein Schwebe-Element einen Knopf oder Text (Prüfung mit `touch.mjs` und neuem Verdeckungstest), Tippflächen bleiben bei 44 px.

### 11. Ein starker Schluss für die Reihe
- Aufwand M. Nutzen: Der Abschluss endet mit einer Linkzeile. Stattdessen: eine Seite lang eine Linie, die alle vier Ebenen durchläuft und am Ende "Du" erreicht (aus dem Hero). Ein Satz, ein Bild. Risiko: mittel (Geschmack, siehe Entscheidung).
- Abnahme: Letzter Bildschirm von abschluss.html hat ein Bild, einen Satz und höchstens zwei Links, Reduced Motion zeigt das fertige Bild.

### 12. Lesbarkeit der Mikrotexte in Skizzen
- Aufwand M. Nutzen: Die Beschriftungen in den Abschluss-Skizzen und im Glossar sind bei 390 px unter 11 px. Mindestgröße anheben, wo es der Platz zulässt, sonst Beschriftung kürzen. Risiko: mittel, Skizzen können umbrechen.
- Abnahme: `tests/mikrotext.mjs` meldet auf den vier Nebenseiten keine Beschriftung unter 11 px bei 390 px, `visuell` nach Sichtprüfung erneuert.

## 5. Reihenfolge in einem Blick

| Nr. | Punkt | Aufwand | Risiko | Hebel |
| --- | --- | --- | --- | --- |
| 1 | Fuß auf den Nebenseiten | S | klein | groß (Pflicht und Reihe) |
| 2 | Kopfleiste und Weiter | S | klein | groß |
| 3 | Vorschau-Meta | S | sehr klein | mittel |
| 4 | Querschnitt kürzen | M | mittel | groß |
| 5 | Mitte der Startseite als Bild | M | mittel | groß |
| 6 | Glossar Suche und Filter | M | klein | mittel |
| 7 | Rätsel Rückmeldung | S bis M | klein | mittel |
| 8 | Zelle Atempunkte | M | mittel | groß |
| 9 | Ladeeindruck | S bis M | klein | mittel |
| 10 | Mobil Schwebe-Elemente | M | mittel | mittel |
| 11 | Starker Schluss | M | mittel | groß |
| 12 | Mikrotexte | M | mittel | klein |

Die Punkte 1 bis 3 sind **sofort umsetzbar, ein PR, klein und sicher**. Sie berühren nur Markup und Meta der vier Nebenseiten und lassen sich in einem PR bündeln oder einzeln nehmen. Danach 9 und 6 (klein, messbar), dann 4, 5, 8.

## 6. Nicht vorgeschlagen (bewusst)
- Änderungen an Datenschutz- und Impressumtexten (Punkt 1 setzt nur Links).
- Kürzen von Fachtexten ohne Gegenlesen (Punkt 4 und 5 gehen erst nach Björns Blick).
- Entfernen des Labels "Düsseldorf · in Arbeit".
- Zusammenführen der Töne vor der Hörprobe.

## 7. Entscheidung für Björn
1. Soll die Reihe eine feste Reihenfolge haben (Düsseldorf, Karte, Zelle, Abschluss, Rätsel), und wo stehen Glossar und Tagesverlauf? Betrifft Punkt 2.
2. Soll der Querschnitt auf der Startseite wirklich bildhafter werden, auch wenn Kärtchentexte dafür in ein "Mehr" wandern? Fachtexte lesen, bevor Punkt 4 läuft.
3. Mitte der Startseite: Instandhaltung, Kosten und Es läuft weiter als Bild plus ein Satz, oder die Rechenkästen behalten, weil sie das Argument tragen? Betrifft Punkt 5.
4. Schluss der Reihe (Punkt 11): ein Bild und ein Satz, ja oder nein. Und wenn ja, welcher Satz.
5. Zelle: Teilleiste und Rückschau (Punkt 8) als sichtbare Struktur, oder die Seite lieber wie ein Fluss ohne Zwischenkarten lassen?
6. Pause-Knopf für die Hero-Kette (steht schon im Backlog, Entscheidung 8), wirkt auf die Barrierefreiheit der Startseite.
7. Hörprobe der Klänge (Entscheidung 3) vor jeder Ton-Arbeit, auch für einen Ton auf den Nebenseiten.
8. Hell-Schalter (Backlog 21): ja oder nein, falls ja gehört er zu Punkt 10.
9. Fachtexte, die bei Punkt 4, 5 und 8 berührt werden (Backlog 17, 22, 24, 28, 31, 33, 37): bitte gegenlesen, bevor gekürzt wird.
