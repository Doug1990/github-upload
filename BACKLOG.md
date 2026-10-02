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

1. **Mobil-Test der Zell-Seite.** `zelle.html` bei 360, 390 und 768 px prüfen: Zell-Zoom, Beschriftungen, Info-Karte, Turbine, Evolution, Ton-Schalter. Überlappungen, abgeschnittene Texte, zu kleine Tippflächen (mindestens 44 px) und horizontales Scrollen beheben.
2. **Verlinkung zwischen den Seiten.** Startseite, Zell-Seite und Kartenskizze sauber verbinden: Rückweg von `zelle.html` zur Startseite, Footer-Links einheitlich auf allen Seiten, Link auf `karte-skizze.html` von der Startseite prüfen. Keine toten Links.
3. **Weitere Abschnitte für `zelle.html`.** Pro Abschnitt ein eigener PR, im Stil der bestehenden Abschnitte (Stadt-Bild, interaktive Grafik, ehrlicher Hinweis zur Vereinfachung). Kandidaten:
   - Zellteilung als Stadtgründung (Verdopplung des Bauplans, Aufteilung der Infrastruktur)
   - Signale zwischen Zellen als Postsystem (Hormone, Nervenimpulse)
   - Immunsystem als Stadtwache
4. **Barrierefreiheit.** Kontraste, Fokusreihenfolge, Screenreader-Texte, Reduced Motion über alle Seiten prüfen. Bekannte Kleinigkeiten: Start/Pause-Button in der Evolution doppelt beschriftet, Ton-Schalter nach Seitencache-Rücksprung.

## Erledigt

- Zelle als Stadt mit ATP-Turbine (#3)
- Überarbeitete Zelle mit Zoom und Stoffflüssen (#5)
- Lokale Schriften (#6)
