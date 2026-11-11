# Lernfreunde

Lern-App für Kinder: Lesen (Buchstaben, Silben), Zahlen & Rechnen, Malen und Basteln.
Barrierearm bedienbar – Tippen, Verweilen, 1- und 2-Tasten-Scan, große Schrift, hoher Kontrast, Vorlesen.

## Entwickeln

```bash
npm install
npm run dev       # lokale Vorschau mit automatischem Neuladen
npm run build     # fertige Version nach dist/
npm run preview   # fertige Version lokal ansehen
```

## Aufbau

| Pfad | Inhalt |
|---|---|
| `index.html` | Einstiegsseite |
| `src/main.js` | App-Code (Inhalte, Spiele, Sprache, Eingabe, Malen, Basteln, Erwachsenenbereich) |
| `src/styles.css` | Gestaltung, Farben, Hell/Dunkel, Kontrast-Modus |
| `src/data/` | Verzeichnisse der Sprachclips, Ausmalbilder und Bastelbögen |
| `public/assets/` | Sprachclips (MP3), Ausmalbilder und Bastelbögen (PNG) |
| `original/` | Unveränderter Ausgangsstand aus dem claude.ai-Artifact (nur Referenz) |
| `scripts/extract-original.py` | Einmal-Skript, das den Ausgangsstand in diese Struktur zerlegt hat |

Schriften (Andika, Atkinson Hyperlegible) werden mit der App ausgeliefert, nicht von Google geladen (Datenschutz).
Die App ist offline nutzbar: Ein Service Worker (vite-plugin-pwa) speichert beim ersten Besuch
alle Dateien; Updates werden beim nächsten Start automatisch geladen.
Ohne Konto liegen die Daten nur im Browser (`localStorage`, Schlüssel `lernfreunde.v1`).

## Konten und Datenbank (Firebase)

Eltern bzw. Lehrkräfte können im Erwachsenenbereich unter „Konto“ ein Konto anlegen (E-Mail und
Passwort). Profile, Einstellungen, Lernstand und Sticker werden dann mit Firestore abgeglichen
(Projekt `lernfreunde-69dd8`, Region Frankfurt `europe-west3`); gemalte Bilder bleiben auf dem Gerät.

| Datei | Inhalt |
|---|---|
| `src/cloud.js` | Anmeldung und Abgleich, wird nach dem Start nachgeladen |
| `firestore.rules` | Sicherheitsregeln: jedes Konto nur seine eigenen Daten |
| `tests/rules.test.mjs` | Tests der Regeln im Emulator: `npm run test:rules` (braucht Java) |
| `.github/workflows/firestore-rules.yml` | testet die Regeln und spielt sie nach dem Merge ein (Secret `FIREBASE_SERVICE_ACCOUNT`) |
| `public/datenschutz.html`, `public/impressum.html` | Entwürfe, vor Veröffentlichung prüfen |

Lokal mit Emulatoren testen: `npx firebase emulators:start --only auth,firestore`, dann die App
unter `http://localhost:5173/?emulator` öffnen.

## Veröffentlichen

Jeder Push auf `main` baut die App und veröffentlicht sie auf GitHub Pages
(`.github/workflows/deploy.yml`). Einmalig nötig: im Repo unter
**Settings → Pages → Build and deployment → Source** „GitHub Actions“ wählen.

## Stimme

Die App spricht mit aufgenommenen Clips (ElevenLabs, Stimme „Juna“). Fehlt ein Clip,
spricht stattdessen die Stimme des Geräts. `npm run voice:check` zeigt, was noch fehlt.

Fehlende Clips Schritt für Schritt erzeugen – pro Lauf so viele, wie das Guthaben hergibt:

1. Einmalig: ElevenLabs → *Developers → API Keys* → Schlüssel anlegen, dann im Repo unter
   **Settings → Secrets and variables → Actions → New repository secret** als
   `ELEVENLABS_API_KEY` speichern.
2. Im Repo **Actions → „Stimmen erzeugen“ → Run workflow** (Branch `main`).
3. Die neuen Clips werden gespeichert und die App neu veröffentlicht.
   Sind die Credits aufgebraucht, geht es beim nächsten Lauf weiter.

Lokal geht es auch: `ELEVENLABS_API_KEY=… npm run voice`.

Hinweis: Mit dem kostenlosen ElevenLabs-Tarif erzeugte Clips sind nicht für kommerzielle
Nutzung lizenziert. Vor dem Verkauf mit einem bezahlten Tarif neu erzeugen
(Clips löschen und den Workflow erneut starten).

## Store-Apps (Android, iOS)

`android/` und `ios/` sind Capacitor-Projekte aus derselben Web-App. Nach Änderungen:
`npm run cap:sync`. Bauen, Signieren und Veröffentlichen: [docs/STORES.md](docs/STORES.md).

Fahrplan: [docs/ROADMAP.md](docs/ROADMAP.md)
