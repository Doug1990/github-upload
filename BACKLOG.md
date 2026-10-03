# Backlog

Aufgabenliste für die autonome Arbeit an der Infrastruktur-Seite. Claude arbeitet die Punkte von oben nach unten ab: ein Punkt, ein Branch, Tests in Headless-Chrome, ein Pull Request. Claude mergt seine PRs nach bestandenen Tests selbst und informiert Björn kurz.

## Spielregeln

- Pro Punkt ein Branch `claude/<kurzname>` von aktuellem `main`, ein PR, keine Sammel-PRs.
- Vor jedem PR testen: keine Konsolenfehler, Desktop und 390 px Breite, Screenshots ansehen.
- Akzeptanzkriterien jedes neuen Abschnitts: 390 px ohne horizontales Scrollen, Reduced Motion, Tastaturbedienung, Tippflächen mindestens 44 px, ehrlicher Hinweis zur Vereinfachung. Das läuft mit, statt am Ende gesammelt zu werden.
- Sichtbare deutsche Texte: schlicht und direkt, keine Gedankenstriche, kein KI-Pathos.
- Nicht force-pushen, keine fremden Branches ändern.
- Nach jedem fertigen PR oder bei einem Blocker eine kurze Meldung an Björn.
- Offene PRs zuerst pflegen (Konflikte, Rückmeldungen), erst dann neue Punkte beginnen.
- Sind weniger als drei Punkte mit Priorität hoch offen, stößt Claude das Konzept-Team neu an (ein Agent mit Blick auf Inhalt, einer auf Interaktion und Qualität) und trägt dessen Vorschläge hier ein.

## Offen, Priorität hoch

2. **CI-Workflow.** Vorlage liegt fertig in `tests/ci/pruefen.yml` (läuft bei Pull Request und Push auf main: `check.mjs`, `kontrast.mjs`, `tastatur.mjs`, Screenshots als Artefakt bei Fehler). Fehlt nur noch die Freigabe, siehe Entscheidung 14. Danach Datei nach `.github/workflows/` verschieben. Aufwand S.
3. **Fließband (Stoffwechselwege).** Stationen mit Enzymen, Engpass und Rückstau per Regler, Rückkopplung "Endprodukt hemmt Station 1". Schließt an das ATP-Kraftwerk an. Hinweis: Wege bilden ein Netz, ein Enzym ist kein Arbeiter. Aufwand M.

## Offen, Priorität mittel

4. **Immunsystem als Stadtwache.** Zwillingspaar zu den Signalen, gleicher Aufbau. Hinweis: Immunität ist verteilt und kann Eigenes angreifen, kein Impf- oder Therapierat. Aufwand M bis L.
5. **Gemeinsame Bausteine.** `assets/shared.css` und `assets/shared.js` (Tokens, Fokus-Stil, Topnav, Reveal, einmaliger Ton-Code, Zelle/Stadt-Schalter), ohne Build, in drei PRs: erst CSS, dann Ton, dann Schalter. Aufwand L. Akzeptanz: eine Farbänderung wirkt auf alle Seiten, Screenshots vor und nach dem Umbau unter 1 Prozent Abweichung.
6. **Performance.** Schleifen nur laufen lassen, wenn Element und Tab sichtbar sind, Canvas-Auflösung deckeln, `index.html` (218 KB) prüfen. Vorher und nachher messen. Aufwand M.
7. **Lernpfad.** Schmale Abschnittsleiste mit Fortschritt und "schon gesehen" in localStorage, Zurücksetzen im Fuß, Datenschutztext anpassen. Aufwand M.
8. **Ton-Feinschliff.** Lautstärke-Regler, Stummschaltung pro Klangquelle, ein gemeinsamer Zustand, Rücksprung aus dem Seitencache. Sinnvoll nach den gemeinsamen Bausteinen. Aufwand M.
9. **Müllabfuhr und Recycling.** Müllregler, Abfuhr zum Lysosom, Streik als Rückstau. Hinweis: Entsorgung ist dezentral (Proteasom), kein Anti-Aging-Versprechen. Aufwand M.
10. **Dorf oder Stadt.** Bakterium gegen Zelle mit Kern als Größenregler. Hinweis: Bakterien sind keine primitive Vorstufe, Endosymbiose ist gut belegt, Details offen. Aufwand M.
11. **Abschlussseite "Eine Stadt, ein Körper, ein Netz".** Dieselben fünf Fragen für Düsseldorf, Zelle, Körper und Internet, je Spalte ein Feld "Wo das Bild hinkt". Erst nach mindestens drei neuen Abschnitten. Aufwand M.
12. **README, Suchmaschinen-Grundlagen und Meta.** Kurze `README.md` (Zweck, Seiten, Befehle, Vorschaubilder erzeugen), `canonical` je Seite, `sitemap.xml`, `robots.txt`, JSON-LD `WebSite` auf der Startseite. `check.mjs` prüft title, description, canonical, og:image und meldet Gedankenstriche im sichtbaren Text. Aufwand S.
13. **Visuelle Regression.** `tests/visuell.mjs`: Referenzbilder je Seite und Breite, Vergleich per Canvas, Differenzbild bei Abweichung, Baseline mit `--update`. Voraussetzung für die gemeinsamen Bausteine. Aufwand M.
14. **Zellskelett als Straßen und Gerüst.** Fracht läuft per Motorprotein am Mikrotubulus, "Gerüst abbauen" lässt Wege reißen. Hinweis: Motorproteine schreiten in Stufen, es gibt keinen Fahrplan. Aufwand M.
15. **Zwei Skalen, dieselbe Frage.** Düsseldorf und Zelle nebeneinander, Schieber "Skala" blendet über, Feld "Gleicher Name, anderer Mechanismus". Vorstufe der Abschlussseite. Aufwand M.
16. **Robuste Kompatibilität.** `noscript`-Hinweis je Seite, iOS-Audio entsperren (erste Geste, Zustand `interrupted`), Test mit abgeschaltetem JavaScript im Prüfskript, Prüfliste für echte Geräte. Entsperr-Code mit dem Ton-Feinschliff zusammenführen. Aufwand M.
17. **Skripte auslagern und Ladezeit messen.** Erst messen, dann nur große Skripte nach `assets/*.js` mit `defer`, nach den gemeinsamen Bausteinen. Aufwand M.
18. **Eigene Seite zu Stromnetz, Wasser und Verkehr.** Tagesverlauf mit Schieber, Last, Erzeugung und Speicher. Keine Zahlen erfinden, Quellen nennen oder als Beispiel markieren. Aufwand L.
19. **Erweiterungen.** Quorum Sensing als Zusatzfall im Signale-Abschnitt, Alterung und Reparatur im Müllabfuhr-Abschnitt. Je Aufwand S.

## Offen, Priorität niedrig

20. **Epigenetik in der DNA-Sektion.** Derselbe Bauplan, andere Lesezeichen je Zelltyp. Keine Lebensstil-Deutung, keine Vererbung über Generationen. Aufwand S.
21. **Druckansicht und Lesemodus.** Zuerst nur `@media print` (hell, ohne Bedienknöpfe), Hell-Schalter erst nach den gemeinsamen Bausteinen. Aufwand S bis M.
22. **Mitmach-Format.** Rätsel "Wer bin ich, in Stadt und Zelle?" und Baukasten "Baue deine Stadt", alles ohne Maus lösbar. Erst nach Fließband, Zellskelett und Zoll. Aufwand M.
23. **Rückmeldung ohne Analytics.** Fußlink "Fehler gemeldet oder Idee?" per `mailto:` mit Betreff je Seite, ein Satz in der Datenschutzseite. Aufwand S.
24. **Glossar.** `glossar.html` und `tests/begriffe.json` mit bevorzugter Schreibweise, vom Prüfskript gelesen. Nach README und Sitemap. Aufwand M.

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
10. **Bauamt-Abschnitt (#23): Reihenfolge und Titel.** Der Abschnitt steht nach der Teilung und vor den Signalen, Titel "Ein Bauamt gibt es nicht, geprüft wird trotzdem." Alternative wäre ein ruhigerer Titel. Annahme: bleibt.
11. **Evolutionsabschnitt heißt weiter "Ohne Bauamt: Was sich bewährt, bleibt."** Stimmig (kein Entwerfer), kollidiert aber leicht mit dem Bauamt als Bild im neuen Abschnitt. Annahme: bleibt.
12. **Krebs-Ausblick im Bauamt-Abschnitt** steht nur im Ergebnisblock und in der Notiz, bewusst nüchtern. Soll er sichtbarer sein? Annahme: bleibt.
13. **Datenschutz-Fix (#25).** Der Text aus "Eigene Aktivität" ging an api.anthropic.com. Jetzt bleibt er im Browser (Stichwort-Heuristik), `?pack=` lädt nur von dieser Seite, Links nur mit http oder https, neuer Abschnitt in der Datenschutzerklärung. Bitte gegenlesen. Wenn eine KI-Einordnung gewünscht ist: eigener Proxy und ein Hinweis am Eingabefeld.
14. **Branch-Schutz.** Nach dem CI-Workflow in GitHub unter Settings, Branches, "Require status checks" für main setzen. Das ist deine Einstellung.
15. **Rückmeldung per Mail.** Wortlaut und Adresse des Fußlinks (siehe Backlog). Annahme: Adresse aus dem Impressum.
16. **Ausfall-Abschnitt (#27): Platzierung und Titel.** Er steht nach der Robustheit und vor der Evolution, Titel "Fällt eine Stelle aus, merkt es der Rest." Annahme: bleibt.
17. **Ausfall-Abschnitt: Krankheitsbeispiele gegenlesen.** Mitochondriopathien, lysosomale Speicherkrankheiten, Mukoviszidose, DNA-Reparatur und Kernhülle. Besonders die Formulierung "Ob und wie behandelt wird … gehört in ärztliche Hände". Die Abhängigkeiten sind didaktisch vereinfacht (zum Beispiel Lysosom bis Kraftwerk über aussortierte Mitochondrien), ein Fachcheck wäre gut. Annahme: bleibt, steht in der Notiz.
18. **Ausfall-Abschnitt: Verlinkung.** Der Link führt zu "Du gehörst dazu" (`#belonging`) auf der Düsseldorf-Seite, wo eine Leitung die nächsten mitreißt. "Was kommt vor was?" (`#chainGame`) ist ein Ordnungsspiel und passt weniger. Annahme: bleibt.
19. **Ausfall-Abschnitt: Optik und Ton.** Bauteile in der Stadtansicht bekommen keine eigenen Stadtsymbole (Aufwand M, falls gewünscht). Müllhalde als orange Würfelhaufen, Kaskade 1,5 s je Stufe, Klang von Ausfall, Stufe und Wiederherstellen nur technisch getestet. Annahme: bleibt.
20. **CI-Workflow braucht eine Freigabe von dir.** Das GitHub-Token hat keinen `workflow`-Scope, deshalb darf ich keine Datei unter `.github/workflows/` pushen. Zwei Wege: (a) im Terminal `! gh auth refresh -h github.com -s workflow` ausführen und im Browser bestätigen, dann verschiebe ich `tests/ci/pruefen.yml` selbst, oder (b) die Datei auf github.com über "Add file" nach `.github/workflows/pruefen.yml` kopieren. Danach "Require status checks" für main setzen (Entscheidung 14). Bis dahin laufen die Skripte von mir vor jedem Merge.
21. **Zoll-Abschnitt (#30): Optik und Tempo.** Viele kleine Teilchen, Ausgleich dauert etwa 20 Sekunden. Zu langsam oder zu unruhig? Die Schleuse im Stadtbild besteht nur aus Toren und einem Zahnrad. Annahme: bleibt.
22. **Zoll-Abschnitt: Fachcheck.** "Die Membran ist nie ganz dicht" (Leck-Bild), "ein ATP je Teilchen" (echte Pumpen arbeiten anders, steht in der Notiz), das Tor öffnet "für kurze Zeit". Die Zahlen sind frei gewählt, keine Messwerte. Annahme: bleibt, steht in der Notiz.
23. **Zoll-Abschnitt: Osmose.** Der Satz in der Notiz ist knapp. Soll Osmose einen eigenen Abschnitt oder ein Beispiel bekommen? Annahme: nein, erst mal nicht.
24. **"Wo das Bild hinkt" (#32), Fachcheck.** 18 Felder (10 auf der Zell-Seite, 7 auf der Startseite, 1 auf der Karte). Sachlich zu prüfen sind vor allem Aussagen, die nicht schon auf den Seiten stehen: die Turbine als Eiweiß in der Membran (ATP-Synthase), Genregulation je Zelltyp, "Abweichungen entstehen zufällig beim Kopieren, die Auswahl kommt danach", "in einer echten Zelle ist es dichter und ständig in Bewegung", "keine der beiden Zellen ist die neue", "echte Nutzung schwankt über den Tag", "ein Stausee speichert Energie für Tage" (als Bild gemeint, bei Bedarf weicher). Annahme: bleibt.
25. **"Wo das Bild hinkt", Ton und Optik.** Gold und gestrichelter Rahmen (Baustellenband) ist dezent, aber sichtbarer als die graue Notiz. Knappe Sätze wie "Es ist keine." (Du gehörst dazu) und "Die Zelle versteht dabei nichts. Sie reagiert." (Signale) sind fast Pointen. Zwei Gegenfragen sind etwas rhetorisch (Teilung, Signale). Das Feld ist 560 px breit und links ausgerichtet, auch in zentrierten Abschnitten. Annahme: bleibt.
26. **Link-Knöpfe an den Überschriften.** Kettensymbol hinter jeder Abschnittsüberschrift auf Startseite (6) und Zell-Seite (10), Tippfläche 44 px, Deckkraft 45 Prozent, bei Fokus und Hover voll. Kopiert wird die Adresse ohne Parameter, Rückmeldung "Link kopiert" unten mittig. Auf Karte, Impressum und Datenschutz gibt es keine. Annahme: bleibt.

## Erledigt

- Teilen, Rest: Link-kopieren-Knöpfe und `scroll-margin-top`, Skript `tests/teilen.mjs`
- Zelle als Stadt mit ATP-Turbine (#3)
- Überarbeitete Zelle mit Zoom und Stoffflüssen (#5)
- Lokale Schriften (#6)
- Evolutions-Simulator (#8), Sound (#7), Fix geteilte Variablen (#9)
- Mobil-Verbesserungen Zell-Seite (#11), Verlinkung und Rechtliches auf der Karte (#12)
- Zellteilung als Stadtgründung (#13)
- Ton für Evolution und Teilung (#14)
- Prüfskript (#16), Signale (#17), Roter Faden (#18), Teilen und Vorschaubilder (#19)
- Wo das Bild hinkt (#32)
- Zoll im Detail (#30)
- Ausfall in der Zell-Stadt (#27)
- Datenschutz-Fix, Eingaben bleiben im Browser (#25)
- Bauamt mit Kontrollpunkten (#23)
- Barrierefreiheit (#21): Kontraste, Skip-Link, Tastatur, Tippflächen, Reduced Motion, Fallbacks, Skripte `tests/kontrast.mjs` und `tests/tastatur.mjs`
