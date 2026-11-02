# Lernfreunde in die App-Stores bringen

Die Store-Apps entstehen mit [Capacitor](https://capacitorjs.com) aus derselben Web-App
(Ordner `android/` und `ios/`). App-Kennung: **`de.timkipper.lernfreunde`** – nach dem ersten
Upload nicht mehr änderbar.

Veröffentlicht wird über das Entwicklerkonto von Tims Papa (Google Play und Apple).

## Android (Google Play)

### Einmalig: Upload-Schlüssel anlegen

Google Play verlangt, dass jedes App-Bundle mit demselben Upload-Schlüssel signiert ist.
Den Schlüssel erzeugt der Account-Inhaber auf seinem Rechner (Java bzw. Android Studio nötig):

```bash
keytool -genkeypair -v -keystore lernfreunde-upload.jks -alias lernfreunde \
  -keyalg RSA -keysize 4096 -validity 10000
```

Passwort gut aufbewahren (Passwort-Manager) und die Datei `lernfreunde-upload.jks` sicher sichern.
Geht sie verloren, kann man bei Google einen neuen Upload-Schlüssel beantragen.

Dann im GitHub-Repo unter **Settings → Secrets and variables → Actions** vier Secrets anlegen:

| Secret | Inhalt |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | Ausgabe von `base64 -w0 lernfreunde-upload.jks` (macOS: `base64 -i lernfreunde-upload.jks`) |
| `ANDROID_KEYSTORE_PASSWORD` | Passwort des Schlüsselspeichers |
| `ANDROID_KEY_ALIAS` | `lernfreunde` |
| `ANDROID_KEY_PASSWORD` | Passwort des Schlüssels (meist dasselbe) |

### Bauen

Der Workflow **„Android-App bauen“** läuft bei jedem Merge auf `main` (oder von Hand unter
Actions → Run workflow). Unter **Artifacts** im Lauf liegen:

- `lernfreunde-test-apk` – zum direkten Installieren auf einem Android-Gerät
  (ZIP entpacken, `app-debug.apk` aufs Gerät, Installation aus unbekannten Quellen erlauben)
- `lernfreunde-play-bundle` – das signierte `.aab` für Google Play (erst, wenn die Secrets da sind)

Die Versionsnummer kommt aus `package.json` (`version`), der Versionscode ist die Laufnummer.

### In der Play Console

1. **App erstellen** → Name „Lernfreunde“, Sprache Deutsch, App, kostenlos (oder kostenpflichtig – später nicht mehr umstellbar von kostenpflichtig auf kostenlos).
2. **Zielgruppe und Inhalte**: Zielgruppe 3–5 und 6–8 Jahre → die App fällt unter die **Familienrichtlinie**. Keine Werbung. Zusätzlich „Lehrer-Empfehlung“ (Teacher Approved) ist möglich.
3. **Datenschutzerklärung**: `https://timjonnie.github.io/lernfreunde/datenschutz.html`
4. **Datensicherheit** (Data safety):
   - Daten werden erhoben: **ja, nur mit Konto** – E-Mail-Adresse (Konto), App-Aktivität (Lernfortschritt)
   - Weitergabe an Dritte: **nein**; Zweck: App-Funktionalität und Kontoverwaltung
   - Verschlüsselt übertragen: **ja**; Löschung anfordern: **ja** (in der App, Bereich für Erwachsene → Konto)
5. **Inhaltseinstufung** (IARC-Fragebogen): keine Gewalt, keine Käufe, keine Nutzerinteraktion → „ab 0 Jahren“ / USK 0.
6. **Interner Test** → neue Version → `app-release.aab` hochladen → Tester (E-Mail-Adressen) einladen.
   Danach geschlossener Test, dann Produktion. Für neue Privatkonten verlangt Google einen
   geschlossenen Test mit mindestens 12 Testern über 14 Tage vor der Produktion.

## iOS (App Store)

iOS-Apps werden auf einem **Mac mit Xcode** signiert und hochgeladen.

1. Repo klonen, dann `npm ci` und `npm run cap:sync`.
2. `ios/App/App.xcodeproj` in Xcode öffnen → Target **App** → **Signing & Capabilities** →
   Team = Entwicklerkonto des Papas, Bundle Identifier `de.timkipper.lernfreunde`.
3. In **App Store Connect** eine neue App anlegen (gleiche Kennung), Primärsprache Deutsch.
4. Xcode: **Product → Archive** → **Distribute App** → App Store Connect → hochladen.
5. In App Store Connect:
   - Kategorie **Bildung**, zusätzlich **Kids**-Kategorie (Altersband „5 und jünger“ bzw. „6–8“).
     Kids-Apps brauchen eine Elternschranke vor Links und Käufen – die gibt es
     (Bereich für Erwachsene: gedrückt halten).
   - **App-Datenschutz**: „Kontaktinfos – E-Mail-Adresse“ und „Nutzungsdaten – Produktinteraktion“,
     beide *mit der Identität verknüpft*, *nicht zum Tracking*, Zweck „App-Funktionalität“.
   - Datenschutz-URL wie oben; Exportkonformität ist in der App bereits als „keine Verschlüsselung“ angegeben.
6. TestFlight zum Testen, dann zur Prüfung einreichen.

Prüfen, ob das iOS-Projekt kompiliert (ohne Signatur): Actions → **„iOS-App prüfen“** → Run workflow.

## Texte für die Store-Einträge (Entwurf)

**Kurzbeschreibung** (Google Play, max. 80 Zeichen):
Lesen, Rechnen, Malen und Basteln lernen – mit dem Dino aus den Malbüchern.

**Untertitel** (App Store, max. 30 Zeichen):
Lesen, Rechnen, Malen, Basteln

**Beschreibung:**

Lernfreunde begleitet Kinder beim Lesen- und Rechnenlernen – Schritt für Schritt, mit einer
freundlichen Stimme und dem Dino aus den Malbüchern von Tim Kipper.

- Lesen: Buchstaben und Laute (Anlaut-Methode), Silben, Wörter bauen und erste Sätze
- Rechnen: Zahlen bis 100, Plus und Minus mit Zehnerübergang, Einmaleins – bei Fehlern erklärt
  die App den Rechenweg
- Malen: Ausmalbilder aus den Malbüchern zum Antippen und freies Malen
- Basteln: Schritt-für-Schritt-Anleitungen mit Bastelbögen
- Sticker-Album als Belohnung

Barrierearm: große Schaltflächen, Sprachausgabe, hoher Kontrast, Verweilen und
Ein- oder Zwei-Tasten-Scan für Kinder mit Förderbedarf.

Für Eltern und Lehrkräfte: Lernstand pro Kind – was sitzt, was noch geübt werden sollte.
Mit einem freiwilligen Konto sind Profile und Fortschritt auf allen Geräten gleich.
Keine Werbung, kein Tracking. Funktioniert auch offline.

**Stichworte** (App Store, max. 100 Zeichen):
lesen lernen,rechnen,einmaleins,anlaut,silben,grundschule,vorschule,malen,förderschule,dino

## Offene Punkte vor der Veröffentlichung

- Platzhalter in `public/datenschutz.html` und `public/impressum.html` füllen, rechtlich prüfen lassen
- Sprachclips mit kommerzieller ElevenLabs-Lizenz erzeugen (siehe README → Stimme)
- Screenshots für die Stores (Telefon und Tablet)
- In der Datenschutzerklärung den Herausgeber (Konto des Papas) ergänzen, falls er als Anbieter auftritt
