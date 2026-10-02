# Backlog

Aufgabenliste für die autonome Arbeit an der Infrastruktur-Seite. Claude arbeitet die Punkte von oben nach unten ab: ein Punkt, ein Branch, Tests in Headless-Chrome, ein Pull Request. Gemergt wird nur von Björn.

## Spielregeln

- Pro Punkt ein Branch `claude/<kurzname>` von aktuellem `main`, ein PR, keine Sammel-PRs.
- Vor jedem PR testen: keine Konsolenfehler, Desktop und 390 px Breite, Screenshots ansehen.
- Akzeptanzkriterien jedes neuen Abschnitts: 390 px ohne horizontales Scrollen, Reduced Motion, Tastaturbedienung, Tippflächen mindestens 44 px, ehrlicher Hinweis zur Vereinfachung. Das läuft mit, statt am Ende gesammelt zu werden.
- Sichtbare deutsche Texte: schlicht und direkt, keine Gedankenstriche, kein KI-Pathos.
- Nicht mergen, nicht force-pushen, keine fremden Branches ändern.
- Nach jedem fertigen PR oder bei einem Blocker eine kurze Meldung an Björn.
- Offene PRs zuerst pflegen (Konflikte, Rückmeldungen), erst dann neue Punkte beginnen.
- Sind weniger als drei Punkte mit Priorität hoch offen, stößt Claude das Konzept-Team neu an (ein Agent mit Blick auf Inhalt, einer auf Interaktion und Qualität) und trägt dessen Vorschläge hier ein.

## Offen, Priorität hoch

1. **Prüfskript `tests/check.mjs`.** Headless-Chrome-Skript (puppeteer-core, kein Build): öffnet jede Seite bei 1280, 768, 390 und 360 px und meldet Konsolenfehler, 404er, horizontalen Überlauf, Tippflächen unter 44 px, tote Links und Anker. Anfangs Warnungen statt Fehler. Aufwand M. Akzeptanz: läuft ohne Argumente, Exit-Code 1 bei eingebautem Fehler, Überlauf mit Seite und Selektor gemeldet.
2. **Roter Faden und Einstieg.** Wegweiser mit drei Punkten (Düsseldorf, Karte, Zelle) auf jeder Seite, "In 2 Minuten" oder "Ganz in Ruhe" im Kopf, Weiter-Block mit Leitfrage am Ende, feste Mini-Begriffsliste (Versorgung, Puffer, Altlast, Ausfall, Bauplan). Aufwand S bis M. Akzeptanz: gleiche Reihenfolge auf allen Seiten, Kernaussagen per Anker auch ohne JavaScript erreichbar.
3. **Barrierefreiheit.** Kontraste messen (mindestens 4,5:1), Skip-Link, ein h1 und Landmarks je Seite, alle `.part` und Karten-Elemente per Tastatur, Start/Pause in der Evolution nur einmal beschriften, Ton-Schalter nach Seitencache-Rücksprung, Reduced Motion einheitlich, Fallbacks für `color-mix` und `:has`. Aufwand M. Akzeptanz: Messwerte im PR, alles per Tab und Enter bedienbar.
4. **Teilen und Einstieg.** Meta-Beschreibung und Open-Graph-Tags mit Vorschaubild je Seite (unter 150 KB), Link-kopieren-Symbol an den Überschriften, `scroll-margin-top` für Anker. Aufwand S bis M. Akzeptanz: Bilder laden, `zelle.html#teilung` scrollt sauber, Kopieren per Tastatur.
5. **Bauamt mit Kontrollpunkten (Zellzyklus).** Drei Tore (G1, G2, Metaphase) mit je zwei Fehlerfällen, Stopp oder Durchlass. Schärft den Schlusssatz zu "Eine Stadt ohne Planungsbüro", weil es Abnahmen vor dem Bau gibt. Hinweis: Das Bauamt ist ein Bild, Eiweiße prüfen sich gegenseitig. Aufwand M.
6. **Ausfall in der Zell-Stadt.** Vier Schalter (Kraftwerk, Müllabfuhr, Zoll, Archiv), abhängige Bauteile fallen in Stufen aus, je ein Beispiel einer realen Krankheitsgruppe. Brücke zur Ausfall-Logik der Düsseldorf-Seite. Hinweis: Krankheiten sind selten ein einzelner Ausfall, kein Ersatz für ärztlichen Rat. Aufwand M.

## Offen, Priorität mittel

7. **Signale zwischen Zellen als Postsystem** (Hormon langsam, Nerv schnell). Branch `claude/zelle-signale`, in Arbeit.
8. **Immunsystem als Stadtwache.** Zwillingspaar zu den Signalen, gleicher Aufbau. Hinweis: Immunität ist verteilt und kann Eigenes angreifen, kein Impf- oder Therapierat. Aufwand M bis L.
9. **Gemeinsame Bausteine.** `assets/shared.css` und `assets/shared.js` (Tokens, Fokus-Stil, Topnav, Reveal, einmaliger Ton-Code, Zelle/Stadt-Schalter), ohne Build, in drei PRs: erst CSS, dann Ton, dann Schalter. Aufwand L. Akzeptanz: eine Farbänderung wirkt auf alle Seiten, Screenshots vor und nach dem Umbau unter 1 Prozent Abweichung.
10. **Performance.** Schleifen nur laufen lassen, wenn Element und Tab sichtbar sind, Canvas-Auflösung deckeln, `index.html` (218 KB) prüfen. Vorher und nachher messen. Aufwand M.
11. **Lernpfad.** Schmale Abschnittsleiste mit Fortschritt und "schon gesehen" in localStorage, Zurücksetzen im Fuß, Datenschutztext anpassen. Aufwand M.
12. **Ton-Feinschliff.** Lautstärke-Regler, Stummschaltung pro Klangquelle, ein gemeinsamer Zustand, Rücksprung aus dem Seitencache. Sinnvoll nach den gemeinsamen Bausteinen. Aufwand M.
13. **Müllabfuhr und Recycling.** Müllregler, Abfuhr zum Lysosom, Streik als Rückstau. Hinweis: Entsorgung ist dezentral (Proteasom), kein Anti-Aging-Versprechen. Aufwand M.
14. **Dorf oder Stadt.** Bakterium gegen Zelle mit Kern als Größenregler. Hinweis: Bakterien sind keine primitive Vorstufe, Endosymbiose ist gut belegt, Details offen. Aufwand M.
15. **Abschlussseite "Eine Stadt, ein Körper, ein Netz".** Dieselben fünf Fragen für Düsseldorf, Zelle, Körper und Internet, je Spalte ein Feld "Wo das Bild hinkt". Erst nach mindestens drei neuen Abschnitten. Aufwand M.

## Offen, Priorität niedrig

16. **Epigenetik in der DNA-Sektion.** Derselbe Bauplan, andere Lesezeichen je Zelltyp. Keine Lebensstil-Deutung, keine Vererbung über Generationen. Aufwand S.
17. **Druckansicht und Lesemodus.** Zuerst nur `@media print` (hell, ohne Bedienknöpfe), Hell-Schalter erst nach den gemeinsamen Bausteinen. Aufwand S bis M.

## Erledigt

- Zelle als Stadt mit ATP-Turbine (#3)
- Überarbeitete Zelle mit Zoom und Stoffflüssen (#5)
- Lokale Schriften (#6)
- Evolutions-Simulator (#8), Sound (#7), Fix geteilte Variablen (#9)
- Mobil-Verbesserungen Zell-Seite (#11), Verlinkung und Rechtliches auf der Karte (#12)
- Zellteilung als Stadtgründung (#13)
- Ton für Evolution und Teilung (#14)
