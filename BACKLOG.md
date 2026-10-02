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

1. **Teilen, Rest.** Meta und Vorschaubilder sind erledigt (#19). Offen: Link-kopieren-Symbol an den Überschriften (Tastatur, Rückmeldung \"Link kopiert\") und `scroll-margin-top` für Anker. Aufwand S.
2. **Bauamt mit Kontrollpunkten (Zellzyklus).** Drei Tore (G1, G2, Metaphase) mit je zwei Fehlerfällen, Stopp oder Durchlass. Schärft den Schlusssatz zu "Eine Stadt ohne Planungsbüro", weil es Abnahmen vor dem Bau gibt. Hinweis: Das Bauamt ist ein Bild, Eiweiße prüfen sich gegenseitig. Aufwand M.
3. **Ausfall in der Zell-Stadt.** Vier Schalter (Kraftwerk, Müllabfuhr, Zoll, Archiv), abhängige Bauteile fallen in Stufen aus, je ein Beispiel einer realen Krankheitsgruppe. Brücke zur Ausfall-Logik der Düsseldorf-Seite. Hinweis: Krankheiten sind selten ein einzelner Ausfall, kein Ersatz für ärztlichen Rat. Aufwand M.

## Offen, Priorität mittel

4. **Immunsystem als Stadtwache.** Zwillingspaar zu den Signalen, gleicher Aufbau. Hinweis: Immunität ist verteilt und kann Eigenes angreifen, kein Impf- oder Therapierat. Aufwand M bis L.
5. **Gemeinsame Bausteine.** `assets/shared.css` und `assets/shared.js` (Tokens, Fokus-Stil, Topnav, Reveal, einmaliger Ton-Code, Zelle/Stadt-Schalter), ohne Build, in drei PRs: erst CSS, dann Ton, dann Schalter. Aufwand L. Akzeptanz: eine Farbänderung wirkt auf alle Seiten, Screenshots vor und nach dem Umbau unter 1 Prozent Abweichung.
6. **Performance.** Schleifen nur laufen lassen, wenn Element und Tab sichtbar sind, Canvas-Auflösung deckeln, `index.html` (218 KB) prüfen. Vorher und nachher messen. Aufwand M.
7. **Lernpfad.** Schmale Abschnittsleiste mit Fortschritt und "schon gesehen" in localStorage, Zurücksetzen im Fuß, Datenschutztext anpassen. Aufwand M.
8. **Ton-Feinschliff.** Lautstärke-Regler, Stummschaltung pro Klangquelle, ein gemeinsamer Zustand, Rücksprung aus dem Seitencache. Sinnvoll nach den gemeinsamen Bausteinen. Aufwand M.
9. **Müllabfuhr und Recycling.** Müllregler, Abfuhr zum Lysosom, Streik als Rückstau. Hinweis: Entsorgung ist dezentral (Proteasom), kein Anti-Aging-Versprechen. Aufwand M.
10. **Dorf oder Stadt.** Bakterium gegen Zelle mit Kern als Größenregler. Hinweis: Bakterien sind keine primitive Vorstufe, Endosymbiose ist gut belegt, Details offen. Aufwand M.
11. **Abschlussseite "Eine Stadt, ein Körper, ein Netz".** Dieselben fünf Fragen für Düsseldorf, Zelle, Körper und Internet, je Spalte ein Feld "Wo das Bild hinkt". Erst nach mindestens drei neuen Abschnitten. Aufwand M.

## Offen, Priorität niedrig

12. **Epigenetik in der DNA-Sektion.** Derselbe Bauplan, andere Lesezeichen je Zelltyp. Keine Lebensstil-Deutung, keine Vererbung über Generationen. Aufwand S.
13. **Druckansicht und Lesemodus.** Zuerst nur `@media print` (hell, ohne Bedienknöpfe), Hell-Schalter erst nach den gemeinsamen Bausteinen. Aufwand S bis M.

## Entscheidungen für Björn (gesammelt)

Alles, was eine Entscheidung von Björn braucht, wird hier gesammelt statt ihn zu unterbrechen. Claude arbeitet mit der naheliegendsten Annahme weiter und teilt die Liste gesammelt mit. Erledigtes wird gestrichen.

1. **Datenschutztext zu den Schriften.** Der Agent hat den Abschnitt "Google Fonts" durch "Schriftarten" ersetzt (lokal ausgeliefert, keine Verbindung zu Google). Bitte rechtlich gegenlesen. Annahme bis dahin: bleibt so.
2. **Seitentitel von Impressum und Datenschutz** enthalten einen Gedankenstrich ("Datenschutz — Was trägt deinen Tag?"). Das widerspricht Björns Schreibstil. Vorschlag: Mittelpunkt statt Strich. Annahme bis dahin: unverändert.
3. **Höreindruck des Tons.** Klangteppich, Interaktionsklänge, Evolution, Teilung und Signale sind nur technisch getestet. Lautstärken und Klangfarben bitte anhören. Die Konstanten stehen im Sound-Block (MASTER, peak-Werte).
4. **Zeiten in der Signal-Animation.** Hormon gestrafft, Nerv in Zeitlupe, damit man es sieht. Steht in der Notiz im Abschnitt. Annahme: so lassen.
5. **Vorschaubilder.** Motiv und Text der drei Bilder in `og/` sind ein Vorschlag. Annahme: bleiben, bis Björn etwas ändern will.
6. **Textfarben angehoben (Barrierefreiheit, #21).** Mehrere gedämpfte Grautöne sind heller geworden, damit Kontrast mindestens 4,5:1 erreicht (zum Beispiel #6E7689 und #5E6579 zu #8E98AC). Optik bleibt ruhig, bitte einmal ansehen. Annahme: bleibt.
7. **Theme-Rauten auf der Startseite.** Die Pille ist etwas größer, weil die Tippfläche jetzt 44 px misst. Die Rauten selbst sind gleich klein. Annahme: bleibt.
8. **Hero-Kette der Startseite wechselt von selbst, ohne Pause-Knopf.** Für Bewegungen über fünf Sekunden verlangt WCAG 2.2 eine Pause-Möglichkeit. Vorschlag: ein kleiner Pause-Knopf. Annahme bis dahin: unverändert, bei Reduced Motion wechselt sie nicht mehr.
9. **Kontrast nur im Ausgangszustand gemessen.** Geöffnete Panels, Zustände nach Klicks, Theme-Farben grün und gelb und SVG-Text sind nicht erfasst. Folgepunkt für später.

## Erledigt

- Zelle als Stadt mit ATP-Turbine (#3)
- Überarbeitete Zelle mit Zoom und Stoffflüssen (#5)
- Lokale Schriften (#6)
- Evolutions-Simulator (#8), Sound (#7), Fix geteilte Variablen (#9)
- Mobil-Verbesserungen Zell-Seite (#11), Verlinkung und Rechtliches auf der Karte (#12)
- Zellteilung als Stadtgründung (#13)
- Ton für Evolution und Teilung (#14)
- Prüfskript (#16), Signale (#17), Roter Faden (#18), Teilen und Vorschaubilder (#19)
- Barrierefreiheit (#21): Kontraste, Skip-Link, Tastatur, Tippflächen, Reduced Motion, Fallbacks, Skripte `tests/kontrast.mjs` und `tests/tastatur.mjs`
