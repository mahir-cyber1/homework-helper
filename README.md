# Homework Helper

Next.js-Web-App mit Hausaufgaben-Hilfe, Pflanzencheck und experimenteller Gebärdenerkennung. Dieses Repository enthält mehrere Anwendungen: Die Startseite `/` zeigt aktuell den Pflanzencheck; die Hausaufgaben-Hilfe ist unter `/homework` erreichbar.

Das separate Repository [homework-helper-app](https://github.com/mahir-cyber1/homework-helper-app) beschreibt die ausgegliederte Hausaufgaben-App. Dessen Einrichtung mit `.env.example` lässt sich hier nicht unverändert übernehmen: In diesem Repository ist keine solche Datei vorhanden.

## Funktionen und Seiten

| Route | Implementierte Funktion |
| --- | --- |
| `/`, `/plant-doctor` | Pflanzenfoto aufnehmen oder hochladen und mit OpenAI analysieren; Ergebnisse lokal im Browser speichern. |
| `/homework` | Aufgaben als Text, Bild oder PDF eingeben, Bilder zuschneiden, Aufgaben erkennen und schrittweise mit Beispielen erklären oder Lösungen prüfen. Klassen 4–6; Deutsch, Türkisch und Englisch; Fach wird automatisch erkannt. Ausgabe über den Browser drucken bzw. als PDF speichern. Eine Gastaufgabe wird im Browser freigeschaltet; weitere Nutzung verlangt in der Oberfläche eine Anmeldung. |
| `/training` | Fehlertraining mit KI-generierten Übungsaufgaben aus gespeicherten Korrekturen. |
| `/league` | Lernpunkte und Ligen für angemeldete Nutzer. |
| `/profile` | Profil, Klassenstufe und Gestaltung mit Avataren, Rahmen und Designs. |
| `/history` | Lokal gespeicherter Verlauf des Pflanzenchecks. Der Hausaufgabenverlauf wird separat in Supabase gespeichert. |
| `/sign-translate` | Experimentelle kamera-basierte Bewegungserkennung mit MediaPipe Holistic und eigenen beschrifteten Trainingsbeispielen; lokale Speicherung und Synchronisierung über Supabase. Kein allgemeiner, verlässlich funktionierender Gebärdensprachübersetzer. |
| `/gebaerdensprache`, `/gebärdensprache` | Umschreibungen auf `/sign-translate` über Next.js-Konfiguration und Proxy. |
| `/music` | Musik-/Klavierspiel mit lokal gespeichertem Bestwert. |
| `/login`, `/admin` | Anmeldung mit Benutzername und Passwort sowie Benutzerverwaltung (Anlegen, Deaktivieren und Aktivieren). |
| `/reset-password` | Passwortänderung für den noch vorhandenen E-Mail-Recovery-Ablauf. |

Die KI-Routen für Hausaufgaben, Pflanzen und Fehlertraining verwenden aktuell fest `gpt-4.1-mini`. Eine Umgebungsvariable zur Modellwahl ist nicht implementiert.

## Technik und Struktur

- Next.js **16.1.6** mit App Router, React / React DOM **19.2.3**, JavaScript.
- OpenAI SDK, Supabase JavaScript SDK, MediaPipe Tasks Vision und react-easy-crop.
- npm-Lockfile, ESLint 9 mit Next.js-Konfiguration.

| Pfad | Zweck |
| --- | --- |
| `app/` | Seiten, Layout, globale Styles und Web-App-Manifest. |
| `app/api/` | Node.js-Route-Handler für KI, Anmeldung, Profile, Punkte und Trainingsdaten. |
| `app/components/` | Gemeinsame Navigation. |
| `lib/` | Supabase-Browserclient, Spracheinstellungen und Profil-/Punktehilfen. |
| `public/` | Bilder, Icons, Liga-Grafiken und Klaviertöne. |
| `supabase-*.sql` | Manuell auszuführende Datenbank-Skripte mit Tabellen, Indizes und RLS-Regeln. |
| `next.config.mjs`, `proxy.js` | Umschreibungen für die Gebärdensprache-Seiten. |
| `eslint.config.mjs`, `jsconfig.json` | Lint-Konfiguration und Import-Alias. |

## Voraussetzungen

- Node.js **20.9 oder neuer** (Mindestversion für Next.js 16) und npm; im Repository ist keine eigene Node-Version festgelegt.
- Ein OpenAI-API-Schlüssel mit Zugriff auf `gpt-4.1-mini` und nutzbarem API-Kontingent.
- Ein Supabase-Projekt für Anmeldung und gespeicherte Nutzerdaten.
- Für Kamerafunktionen: Browser mit Kamerazugriff und erteilte Berechtigung; lokal `localhost`, bei Bereitstellung HTTPS.
- Für MediaPipe zusätzlich Netzwerkzugriff auf `cdn.jsdelivr.net` (WASM) und `storage.googleapis.com` (Holistic-Modell). Diese Assets werden extern geladen.

## Umgebungsvariablen

Im Projektverzeichnis eine Datei `.env.local` anlegen. Sie wird durch `.gitignore` ausgeschlossen. Es gibt aktuell keine `.env.example`, die kopiert werden könnte.

| Variable | Erforderlich für | Sichtbarkeit / Bedeutung |
| --- | --- | --- |
| `OPENAI_API_KEY` | Hausaufgaben, Pflanzenanalyse und KI-Fehlertraining | Nur Server; OpenAI-API-Schlüssel. |
| `NEXT_PUBLIC_SUPABASE_URL` | Anmeldung, Profile, Lern- und Trainingsdaten | Öffentlich; URL des Supabase-Projekts. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase-Browserclient und Passwortanmeldung | Öffentlich; der vom vorhandenen Code verwendete Supabase-Anon-Key. Zugriff wird durch RLS begrenzt. |
| `SUPABASE_SERVICE_ROLE_KEY` | Serverseitige Benutzerverwaltung, Login und Daten-APIs | Nur Server; privilegierter Schlüssel, niemals mit `NEXT_PUBLIC_` veröffentlichen. |
| `NEXT_PUBLIC_SITE_URL` | Metadaten sowie E-Mail-Freigabe-/Recovery-Links | Öffentliche Basis-URL, lokal `http://localhost:3000`; für Deployments die jeweilige HTTPS-URL. Ohne Wert nutzen einzelne Stellen unterschiedliche Fallbacks. |
| `SIGN_TRANSLATE_ALLOWED_EMAILS` | Optional: Einschränkung der Gebärden-Trainings-API | Kommagetrennte Auth-E-Mail-Adressen; leer erlaubt jedem authentifizierten Nutzer den Zugriff auf seine eigenen Beispiele. Bei Benutzername-Login verwendet der Code synthetische Adressen unter `sign.local`. Kein allgemeiner Seitenschutz. |
| `ADMIN_EMAIL` | Älterer E-Mail-Freigabe-/Recovery-Ablauf | Admin-Adresse für Freigabe-Mails und dortige Admin-Erkennung; steuert nicht die aktuelle Benutzername-Adminrolle. |
| `RESEND_API_KEY` | Freigabe-Mail über `/api/request-login` | Nur Server; ohne Schlüssel wird eine neue Anfrage zwar gespeichert, der Mailversand meldet aber einen Fehler. |
| `RESEND_FROM_EMAIL` | Optional: Absender der Freigabe-Mail | Verifizierter Resend-Absender; Code-Fallback: `Homework Helper <onboarding@resend.dev>`. |

Minimale Vorlage für die Kernfunktionen:

```dotenv
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional: Gebärden-Trainings-API einschränken
SIGN_TRANSLATE_ALLOWED_EMAILS=

# Nur für den vorhandenen E-Mail-Freigabeablauf
ADMIN_EMAIL=
RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

Nach Änderungen den Entwicklungsserver neu starten. `NEXT_PUBLIC_*`-Werte gelangen in den Browser-Build und müssen beim Produktionsbuild bereits korrekt gesetzt sein. Keine echten Schlüssel in Git eintragen.

## Supabase einrichten

Die SQL-Dateien liegen im Repository-Root; ein automatischer Migrationslauf ist nicht eingerichtet. Für ein neues Projekt im Supabase SQL Editor in dieser Reihenfolge ausführen:

1. [supabase-login-approval.sql](./supabase-login-approval.sql): Freigabe-/Anfragetabellen und `user_profiles`.
2. [supabase-fix-login-request-display-name-key.sql](./supabase-fix-login-request-display-name-key.sql): Ergänzungen und Indizes für Anzeigenamen und Profile.
3. [supabase-homework-history.sql](./supabase-homework-history.sql): Hausaufgabenverlauf, Punkte, Punkteereignisse und Fehlertraining.
4. [supabase-learning-features.sql](./supabase-learning-features.sql): Profilgestaltung und Fehlertraining; überschneidet sich teilweise mit Schritt 3.
5. [supabase-sign-users.sql](./supabase-sign-users.sql): Benutzerverwaltung in `sign_app_users`.
6. [supabase-sign-training.sql](./supabase-sign-training.sql): Eigene Gebärden-Trainingsbeispiele.

Die Skripte aktivieren RLS. Profile, Hausaufgaben und Trainingsdaten erhalten benutzerbezogene Regeln; Verwaltungszugriffe laufen serverseitig mit Service Role. Bei bestehenden Daten zuerst die Skripte und mögliche Konflikte der eindeutigen Anzeigenamen prüfen.

Der aktuelle Login verwendet Supabase E-Mail/Passwort intern mit aus Benutzernamen gebildeten `@sign.local`-Adressen. Neue Nutzer legt der Admin an; die Login-Seite bietet keine Selbstregistrierung. Der Server enthält derzeit einen fest codierten Admin-Bootstrap in `app/api/password-login/route.js`; Admin-Erkennung findet außerdem in Login- und Admin-Code statt. **Vor öffentlichem Betrieb müssen die fest codierten Zugangsdaten entfernt bzw. ersetzt und die Admin-Autorisierung geprüft werden.** Ein bloßes Ändern von `ADMIN_EMAIL` ändert diesen Ablauf nicht.

Die älteren Routen `/api/request-login`, `/api/approve-login` und `/api/request-password-reset` existieren zusätzlich, werden aber nicht vom aktuellen Loginformular als Standardablauf verwendet. Wenn dieser E-Mail-Ablauf benötigt wird, Supabase Site URL und erlaubte Redirect-URLs passend zu lokalem Betrieb und Deployment konfigurieren (einschließlich `/reset-password`); für Freigabe-Mails zusätzlich Resend konfigurieren.

## Lokal starten

```bash
git clone https://github.com/mahir-cyber1/homework-helper.git
cd homework-helper
npm ci
```

Danach `.env.local` wie oben anlegen und die Supabase-Skripte ausführen.

```bash
npm run dev
```

- Pflanzencheck: [http://localhost:3000](http://localhost:3000)
- Hausaufgaben: [http://localhost:3000/homework](http://localhost:3000/homework)
- Anmeldung: [http://localhost:3000/login](http://localhost:3000/login)
- Gebärdenerkennung: [http://localhost:3000/sign-translate](http://localhost:3000/sign-translate)

## Prüfung und Produktionsbetrieb

```bash
npm run lint
npm run build
npm run start
```

`start` benötigt vorher einen erfolgreichen Build. Ein eigenes Testskript ist in `package.json` nicht definiert.

Für eine manuelle Funktionsprüfung: Pflanzenfoto analysieren; unter `/homework` Text/Bild/PDF erklären und eine Lösung prüfen; nach Anmeldung Profil und gespeicherte Daten kontrollieren; Kamera und eigene Trainingsbeispiele unter `/sign-translate` testen. KI-Aufrufe können API-Kosten verursachen.

## Auf Vercel bereitstellen

1. Dieses GitHub-Repository in Vercel importieren, Framework **Next.js**, Projektverzeichnis Repository-Root.
2. Node-Version passend zur Voraussetzung wählen. Installationsbefehl `npm ci`, Build `npm run build`; das Next.js-Ausgabeverzeichnis automatisch erkennen lassen.
3. Die benötigten Umgebungsvariablen aus der Tabelle für die gewünschten Umgebungen (Production / Preview) setzen. `NEXT_PUBLIC_SITE_URL` auf die jeweilige erreichbare HTTPS-Basis-URL setzen.
4. Supabase-Schema vor der Nutzung anlegen und gegebenenfalls Auth-Redirect-URLs sowie Resend-Absender für die Zielumgebung konfigurieren.
5. Deployment starten. Bei späteren Änderungen an Umgebungsvariablen neu deployen, insbesondere bei `NEXT_PUBLIC_*`.
6. Die oben genannten Seiten und Funktionsabläufe auf der bereitgestellten URL prüfen, einschließlich Kameraberechtigung und externer MediaPipe-Downloads.

Die App benötigt einen Node.js-Server bzw. Next.js-Route-Handler; ein rein statischer Export reicht wegen der API-Routen nicht aus. Eine eigene `vercel.json` ist nicht vorhanden. Die Metadaten unter `app/sign-translate/` enthalten zusätzliche fest eingetragene Deployment-URLs; bei eigener Domain auch diese prüfen.

## Daten und aktuelle Grenzen

- Text, Bilder und PDFs für Hausaufgaben sowie Pflanzenbilder werden zur Analyse an OpenAI übermittelt. Die Anwendung arbeitet deshalb nicht ausschließlich lokal.
- Supabase speichert unter anderem Profile, Hausaufgabenantworten, Punkte, Fehlertraining und synchronisierte Gebärden-Trainingsmerkmale. Pflanzenverlauf, Spracheinstellungen, Gastnutzung, Musik-Bestwert und lokale Gebärdenbeispiele liegen im Browser-Speicher.
- PDF-Ausgabe erfolgt über den Druckdialog des Browsers, nicht über einen eigenen PDF-Exportdienst.
- Das Limit von 20 Hausaufgabenanfragen pro Stunde/IP in `app/api/explain/route.js` liegt nur im Arbeitsspeicher der jeweiligen Serverinstanz. Es ist bei Neustarts und mehreren Instanzen kein dauerhaftes, gemeinsames Limit. Auch die Gastbeschränkung im Browser ist keine serverseitige Zugriffssicherung.
- KI-Antworten und experimentelle Bewegungserkennung können fehlerhaft sein; Ergebnisse prüfen.
