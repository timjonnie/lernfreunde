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
Daten liegen derzeit nur im Browser (`localStorage`, Schlüssel `lernfreunde.v1`).

## Veröffentlichen

Jeder Push auf `main` baut die App und veröffentlicht sie auf GitHub Pages
(`.github/workflows/deploy.yml`). Einmalig nötig: im Repo unter
**Settings → Pages → Build and deployment → Source** „GitHub Actions“ wählen.

Fahrplan: [docs/ROADMAP.md](docs/ROADMAP.md)
