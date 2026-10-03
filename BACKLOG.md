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
27. **Lieferketten: Vom Gen zum Produkt.** Weg vom Bauplan über Abschrift und Eiweißbau bis zum fertigen Teil, als Stationenkette mit Störknopf an jeder Station. Hinweis: Abschrift und Eiweißbau laufen vielfach parallel, ein Gen ergibt nicht immer ein Eiweiß, Regulation fehlt im Bild. Aufwand M. Der Bauplan steht im Text, ist aber nie in Aktion zu sehen. Nach dem Fließband bauen, Aufbau teilen. Vorher prüfen, was der Abschnitt "Gene und Genregulation" schon abdeckt (Archiv, Abschrift, Fabrik), und nur die Lücke füllen.
28. **Zustände nach Klicks im Kontrast- und Tastaturtest.** `kontrast.mjs` und `tastatur.mjs` klicken je Seite Schalter, Theme-Rauten und Panels durch und messen danach erneut (löst Entscheidung 9 ein, inklusive Theme grün und gelb). Akzeptanz: Lauf über alle Seiten ohne Verstoß, das Skript meldet, in welchem Zustand ein Fehler auftrat. Aufwand M.
29. **Touch-Bedienung der Regler und Zieher.** Schieber, Zoomflächen und Karte per emulierter Touch-Eingabe bei 390 px testen: senkrechtes Scrollen über jedem Abschnitt bleibt möglich, `touch-action` gezielt gesetzt, Doppeltipp zoomt nicht ungewollt. Aufwand M. Die Seite wird viel auf dem Handy gelesen.

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
30. **Reserven und Speicher.** Fettdepot, Glykogen und Vorratsraum als Lager der Zelle, per Regler "Lieferung fällt aus" ablesbar, wie lange die Reserve reicht. Hinweis: Speicher sind je Zelltyp sehr verschieden, Nervenzellen speichern kaum, die Laufzeiten sind frei gewählt. Aufwand M. Ergänzt den Robustheitsabschnitt.
31. **Zellen im Verbund.** Gewebe als Stadtviertel: Nachbarzellen teilen Nährstoffe und Signale über Kontaktstellen, ein Klick isoliert ein Viertel. Hinweis: Gewebe bestehen aus vielen Zelltypen, Aufgaben sind verteilt, Viertel sind keine festen Grenzen. Aufwand M. Leitet von der Zelle zum Körper über und bereitet die Abschlussseite vor.
32. **Externe Links und Ladetest.** `check.mjs` prüft externe Links per HEAD-Anfrage (nur Warnung). Schalter `--langsam` drosselt auf 3G und meldet Zeit bis zum ersten Text und bis zur Bedienbarkeit. Aufwand S bis M.
33. **Lesbarkeit.** Fließtext höchstens etwa 70 Zeichen je Zeile, mindestens 16 px mobil, Zeilenabstand mindestens 1,5, Seite bei 200 Prozent Zoom ohne Überlauf. `check.mjs` meldet Zeilen über 80 Zeichen und Text unter 16 px. Aufwand S.
34. **Fehlertoleranz.** Seiten laufen weiter, wenn `localStorage`, `AudioContext`, `ResizeObserver` oder Canvas fehlen oder Fehler werfen. Das Prüfskript schaltet diese APIs ab, keine Konsolenfehler, alle Abschnitte lesbar. Aufwand M. Vor Lernpfad und Ton-Feinschliff.

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
27. **Fließband (#36): Platzierung, Titel, Zahlen.** Der Abschnitt steht nach dem Kraftwerk und vor "Gut genug schlägt perfekt", Titel "Das Fließband: Wo es eng wird, staut es sich." Alle Raten sind frei gewählt (je Station 3 pro Sekunde, Zulauf und Verbrauch bis 4). Station 3 ist fest der Engpass, eine freie Wahl der Station gibt es nicht. Annahme: bleibt.
28. **Fließband: Fachcheck.** "Der Endprodukt-Pegel bremst Station 1" ist als Rückkopplungshemmung gemeint (feedback inhibition, wie bei vielen Biosynthesewegen). Die Warteschlange vor einer Station steht in der Notiz für die Menge an Zwischenprodukt. Der Hinweis "ein Enzym ist kein Arbeiter" steht im Feld "Wo das Bild hinkt". Annahme: bleibt.
29. **Fließband: Mobil und Ton.** Auf 390 px sind die Beschriftungen im Schema klein (rund 11 px wirksam), die Bedienung läuft über die Regler darunter. Der Abschnitt hat noch keinen Ton und keinen Eintrag im Stadtbild. Reduced Motion: kein Dauerlauf, das Ergebnis steht nach jeder Eingabe sofort. Sonst gibt es einen Anhalten-Knopf. Annahme: bleibt.
30. **"Dein Tag in einer Zelle": Platzierung und Wortlaut.** Der Abschnitt steht nach "Die Zelle ist eine Stadt in klein" und vor dem Kraftwerk, Titel "Auch eine Zelle hat einen Tag, nur keinen Stundenplan." Er verlinkt zur Düsseldorf-Seite. Die Texte zu Nacht, Morgen, Tag, Nachmittag und Abend sind mein Vorschlag. Annahme: bleibt.
31. **"Dein Tag": Fachcheck.** Die Werte hinter den Balken sind frei gewählt (Stützpunkte im Skript). Aussagen zum Gegenlesen: "Schäden an der DNA werden oft nachts repariert", "nach dem Essen nehmen viele Zellen Zucker auf und legen Vorräte an", "Hormone und Nervensignale melden, dass der Tag beginnt". Die innere Uhr aus Eiweißen steht im Feld "Wo das Bild hinkt". Annahme: bleibt.
32. **"Drei Fragen zum Schluss": Auswahl und Wortlaut.** Gewählt habe ich "Was fällt aus, wenn das Kraftwerk fehlt?", "Wer entscheidet in der Zelle?" und "Was hat das mit Düsseldorf zu tun?". Die Antworten sind mein Vorschlag und stehen in `zelle.html` im Abschnitt `#fragen`. Der Abschnitt steht vor dem Schlussabsatz, die dritte Frage führt zu Düsseldorf und zur Karte. Fachcheck: "Niemand entscheidet" (Regeln ohne Chef) und "Ersatzwege fangen etwas auf, aber nicht alles". Annahme: bleibt.
33. **Gene und Genregulation (#35): Fachcheck.** Bitte gegenlesen: "rund 1 bis 2 Prozent des Genoms codieren für Eiweiße", der Zeitstrahl (Mendel 1860er, Morgan um 1910, Watson und Crick 1953 mit Röntgenaufnahmen von Franklin und Wilkins, Code 1960er, Sanger 1977, Insulin in Bakterien 1978 und 1982 am Markt, Genom 2003), "rund 20.000 Gene", die Zuordnung der sechs Akten zu Muskel, Nerv, Betazelle und Haut sowie "nach dem Essen liest die Betazelle die Insulin-Akte deutlich öfter ab". Annahme: bleibt.
34. **Gene: Auswertung der Mutationen.** Das Beispielgen ATG GAA GCT TGG AAA TAA kennt fünf Ausgänge (still, Fehlsinn, Abbruch, Startsignal fehlt, Stoppsignal fehlt). Gezeigt wird nur ein Strang der Doppelhelix, Introns und Spleißen stehen nur im Feld "Wo das Bild hinkt". Annahme: bleibt. Offen ist, ob "Zufälliger Tausch" auch Ton bekommen soll (Tonleiter der Basen ist schon da, Höreindruck siehe Entscheidung 3).

## Erledigt

- Gene und Genregulation: Abschnitte `#gen` (Archiv, Abschrift, Fabrik, Buchstaben tauschen, Zeitstrahl) und `#regulation` (vier Zelltypen, sechs Akten, Blutzucker-Schalter) auf der Zell-Seite, Skript `tests/gene.mjs` (#35)
- Zelle verstehen, Fragen zum Schluss: Abschnitt auf der Zell-Seite, Skript `tests/fragen.mjs`
- Einstieg "Dein Tag in einer Zelle": Abschnitt auf der Zell-Seite, Skript `tests/tag.mjs`
- Fließband (Stoffwechselwege): Abschnitt auf der Zell-Seite, Skript `tests/fliessband.mjs` (#36)
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
