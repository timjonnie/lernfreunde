# Fahrplan Lernfreunde

Ziel: ein fertiges Produkt, das jede Familie, Schule oder Förderstelle nutzen kann –
im Web und als App im App Store und bei Google Play.

## Phase 1 – Sauberes Projekt und Hosting ✅
- Eine 1,3-MB-HTML-Datei zerlegt in Code, Gestaltung, Bilder und Töne
- Schriften selbst ausgeliefert statt von Google (DSGVO)
- Automatische Veröffentlichung auf GitHub Pages, Netlify entfällt

## Phase 2 – Stimme (läuft)
- ✅ Skript + GitHub-Workflow „Stimmen erzeugen“: erzeugt fehlende Clips mit Juna,
  so viele das Guthaben erlaubt, und macht beim nächsten Lauf weiter
- ⏳ Clips mit Free-Credits erzeugen (nur zum Entwickeln; vor dem Verkauf mit
  bezahltem Tarif neu erzeugen – Free-Clips sind nicht kommerziell lizenziert)
- Heute sind nur 20 Sätze aufgenommen; alles andere spricht die Gerätestimme
  (klingt je nach Gerät sehr unterschiedlich).
- Alle benötigten Texte aufnehmen (die App kennt ihre Liste selbst: `voiceInventory()`,
  rund 400 Einträge: Sätze, Zahlen 0–100, Buchstaben, Silben, Wörter).
- Ganze Sätze aufnehmen statt Satzbausteine aneinanderzureihen – klingt natürlicher.
- ✅ Buchstaben als **Laut** sprechen („mmm“) statt mit dem Buchstabennamen („em“) –
  wichtig für das Lesenlernen nach Anlaut-Methode. Schalter im Erwachsenenbereich.
  Laut-Tabelle in `src/content.js` (`LAUT`); nach den ersten Aufnahmen anhören und nachschärfen,
  besonders die kurzen Laute B, D, G, K, P, T.

## Phase 3 – Gestaltung und Bedienung (UI/UX) (läuft)
- ✅ Tim-Kipper-CI: App-Icon, Favicon, Farben (Nachtblau, Buntstift-Orange), Schrift Lexend
- ✅ Maskottchen: der Dino aus „Mal mit mir!“ in CI-Farben – Startseite, Ergebnis-Bildschirm, als Ausmalbild
- ✅ Neue Startseite: Wortmarke, Dino mit Sprechblase, Kinder-Karten mit Sternen und „Weiter bei …“
- Klarere Belohnungen und Fortschritt für Kinder
- Übersichtlicher Erwachsenenbereich mit Lernstand-Auswertung
- Offline nutzbar (installierbare Web-App)

## Phase 4 – Inhalte vervollständigen
- Lesen: fehlende Buchstaben (C, J, V, X, Y, Q, Ä, Ö, Ü, ß) und Laute (Sch, Ei, Au, Eu, Ch, Pf, Qu),
  Klein-/Großbuchstaben, erste Sätze lesen
- Rechnen: Zehnerübergang, Rechnen bis 100, Einmaleins
- Weitere Ausmalbilder und Bastelideen aus den Büchern

## Phase 5 – Konten und Datenbank
- Supabase (Server in der EU): Konten für Eltern bzw. Lehrkräfte, mehrere Kinder,
  Fortschritt auf allen Geräten
- App funktioniert weiter offline und gleicht später ab
- Datenschutz für Kinderdaten: so wenig Daten wie möglich, Datenschutzerklärung, Impressum

## Phase 6 – App-Stores
- Verpackung als iOS- und Android-App mit Capacitor
- Regeln für Kinder-Apps (Apple „Kids“, Google „Familien“): keine Werbung/Tracking,
  Elternschranke (gibt es schon), keine Links nach außen
- Entwicklerkonten: Apple (99 $/Jahr), Google (einmalig 25 $)
