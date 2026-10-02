# Backlog

Aufgabenliste für die autonome Arbeit an der Infrastruktur-Seite. Claude arbeitet die Punkte von oben nach unten ab: ein Punkt, ein Branch, Tests in Headless-Chrome, ein Pull Request. Gemergt wird nur von Björn.

## Spielregeln

- Pro Punkt ein Branch `claude/<kurzname>` von aktuellem `main`, ein PR, keine Sammel-PRs.
- Vor jedem PR testen: keine Konsolenfehler, Desktop und 390 px Breite, Screenshots ansehen.
- Sichtbare deutsche Texte: schlicht und direkt, keine Gedankenstriche, kein KI-Pathos.
- Nicht mergen, nicht force-pushen, keine fremden Branches ändern.
- Nach jedem fertigen PR oder bei einem Blocker eine kurze Meldung an Björn.
- Offene PRs zuerst pflegen (Konflikte, Rückmeldungen), erst dann neue Punkte beginnen.

## Offen

1. **Weitere Abschnitte für `zelle.html`.** Pro Abschnitt ein eigener PR, im Stil der bestehenden Abschnitte (Stadt-Bild, interaktive Grafik, ehrlicher Hinweis zur Vereinfachung). Kandidaten:
   - Signale zwischen Zellen als Postsystem (Hormone, Nervenimpulse)
   - Immunsystem als Stadtwache
2. **Mobil-Test der neuen Abschnitte.** Evolution, Teilung und Ton-Schalter bei 360, 390 und 768 px prüfen (die Zell-Grafik ist bereits geprüft). Auf echtem Gerät testen, soweit möglich.
3. **Barrierefreiheit.** Kontraste, Fokusreihenfolge, Screenreader-Texte, Reduced Motion über alle Seiten prüfen. Bekannte Kleinigkeiten: Start/Pause-Button in der Evolution doppelt beschriftet, Ton-Schalter nach Seitencache-Rücksprung.

## Erledigt

- Zelle als Stadt mit ATP-Turbine (#3)
- Überarbeitete Zelle mit Zoom und Stoffflüssen (#5)
- Lokale Schriften (#6)
- Evolutions-Simulator (#8), Sound (#7), Fix geteilte Variablen (#9)
- Mobil-Verbesserungen Zell-Seite (#11), Verlinkung und Rechtliches auf der Karte (#12)
- Zellteilung als Stadtgründung (#13)
- Ton für Evolution und Teilung
