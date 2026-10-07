# Fit – Supabase / Vercel

Standalone Next.js-App mit Supabase-Anmeldung per E-Mail/Passwort. Kein ChatGPT-Konto erforderlich.

## Stand 7. Oktober 2026

- UI, Profil, Altersgruppe, Ernährung, Kalender, Cosmetics, Geschenk-Codes und Wochen-/Monatschecks auf Konten umgestellt.
- Private Dateien im Supabase-Bucket `fit-private`; Daten pro `auth.users.id` in `fit_accounts`.
- Änderungen laufen durch die authentifizierte Edge Function `fit-api`. Browser dürfen nur ihren Datensatz lesen und nur eigene Dateien hochladen/lesen/löschen. Schreibrechte auf Kontodaten ausschließlich für den Backend-Service.
- Gleichzeitige Änderungen werden mit einer Revisionsprüfung gegen verlorene Updates geschützt.
- Erster Monatscheck: Bonus. Danach nur höherer selbst angegebener Trainingswert beim gleichen Training. Wochenchecks ebenso. Keine KI-Körperbewertung.
- Kiro wartet weiterhin auf eine separate KI-Anbindung. Niemals den früher im Chat veröffentlichten API-Schlüssel wiederverwenden.
- App-Icon und Open-Graph-/Twitter-Vorschaubild: `public/fit-icon.jpg`.

## Bereits im Supabase-Projekt eingerichtet

Projekt: `qdrrwjtweuebrprwjrfy` (`homework-helper`, EU-West).
Migration: `fit_private_accounts`. Edge Function: `fit-api`.
`supabase/schema.sql` dokumentiert die bereits angewendete Migration; nicht nochmals auf diesem Projekt ausführen.
Bestehende Tabellen anderer Anwendungen wurden nicht verändert.

## Noch offen vor Veröffentlichung

1. GitHub-Zugriff wurde freigegeben. Fit wird im Branch `fit-supabase` unter `apps/fit` verwaltet. Die bestehende Hauptanwendung bleibt unverändert.
2. Vercel-Projektberechtigung im Team `team_HGrGFkfD6trzVVhVHepN64Mb` / `mahir-cyber1s-projects`: `create_project` wurde mit HTTP 403 abgelehnt. Kein neues Deployment vorhanden.
3. Vercel mit Branch `fit-supabase` und Root Directory `apps/fit` verbinden. Die bestehende andere App nicht überschreiben.
4. In Vercel die Variablen aus `.env.example` eintragen. Publishable Key aus Supabase, niemals Service-Role-Key im Frontend. `NEXT_PUBLIC_APP_URL` auf die echte öffentliche Vercel-Adresse setzen.
5. In Supabase Authentication → URL Configuration die neue Adresse `/auth/callback` und `/auth/callback?next=/password` erlauben. Vorhandene Weiterleitungen anderer Apps erhalten. E-Mail-Bestätigung ist aktiv. Registrierung, Bestätigungslink und Passwortzurücksetzen mit der endgültigen URL testen.
6. Erst nach Festlegung der tatsächlichen Administrator-E-Mail darf für dieses Konto `app_metadata.fit_admin=true` gesetzt werden. Die App bietet Admin-Funktionen ausschließlich diesem serverseitig vergebenen Recht. Ein gemeinsames Passwort reicht in der Mehrbenutzer-App nicht aus.

Die frühere Sites-App bleibt separat bestehen. Ihre Gastdaten wurden nicht automatisch übernommen.

## Lokal starten

Node.js 22 oder neuer. `npm ci`, `.env.example` nach `.env.local` kopieren und mit öffentlicher Supabase-Konfiguration befüllen. Danach `npm run dev`.
Prüfung: `npm run typecheck` und `npm run build`.

## Prüfergebnisse

- Next.js-Produktionsbuild erfolgreich.
- Supabase-RLS-Test mit zwei vorübergehenden Testidentitäten: genau ein eigener Datensatz sichtbar, keine direkten INSERT-/UPDATE-Rechte auf Kontodaten. Transaktion vollständig zurückgerollt.
- Private Storage-RLS: nur die eigene Testdatei sichtbar. Transaktion vollständig zurückgerollt.
- Backend ohne Anmeldung antwortet HTTP 401.
- Registrierung per E-Mail ist im Projekt aktiviert. Bestätigung erforderlich.
- End-to-End-Test der Anmeldung und der Uploads auf einer öffentlichen Vercel-URL steht wegen der Berechtigungsblockade noch aus.

## Betrieb

Für produktive Registrierung SMTP/Versandgrenzen im Supabase-Projekt prüfen. Bei späteren Änderungen der Edge Function die Dateien in `supabase/functions/fit-api` erneut deployen. Die Funktion verwendet nur die von Supabase intern bereitgestellten Serverzugänge und verifiziert jeden Benutzer mit `auth.getUser`.
Keine Zugangsschlüssel, `.env.local`, `node_modules` oder `.next` in Git aufnehmen.
