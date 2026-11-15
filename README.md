# FamilyOS

„Alles, was eure Familie bewegt. An einem Ort.“

Responsive Familien-App in deutscher Sprache. Phase 2 ergänzt PostgreSQL,
Anmeldung, einmalige Ersteinrichtung, Einladung eines zweiten Erwachsenen
und zwei Kinderprofile ohne Login. Kalender, Aufgaben, Einkauf, Wetter und
Essensplan bleiben ausdrücklich fiktive Phase-1-Demos. Phase 3 ist nicht freigegeben.

Verbindliche Vorgabe: [Master-Spezifikation](FamilyOS_Codex_Implementierung.md).
[Phase-2-Plan](docs/phase-2-plan.md), [Architektur](docs/architecture.md),
[Prüfergebnisse](docs/phase-2-results.md), [Betriebsanleitung](docs/phase-2-operations.md).

## Lokal starten

Node 24 LTS und PostgreSQL erforderlich. `.env.example` als Vorlage verwenden;
DB-URL, kanonische Origin und zwei getrennte zufällige Secrets konfigurieren.
Keine privaten Daten in der Testdatenbank verwenden.

```bash
npm ci
npm run db:generate
# DATABASE_URL für Prisma CLI in Prozessumgebung oder .env setzen
npm run db:migrate
npm run dev
```

http://127.0.0.1:3000/setup einmalig öffnen und eigenes Konto anlegen.
Danach Einrichtungsschlüssel entfernen. Unter Einstellungen zweiten Erwachsenen
einladen und Kinderprofile anlegen. Anmeldung unter `/login` erforderlich.
Details zu Secrets, Einladungen, Migrationen und Grenzen stehen in der
[Betriebsanleitung](docs/phase-2-operations.md).

Inter und Assets werden lokal ausgeliefert. Fach-Demo-Heute bleibt Montag,
16. November 2026, Europe/Berlin. Demo-Gerichte bleiben bei interner Navigation
erhalten und werden beim Neuladen zurückgesetzt; Familienprofile sind persistent.

## Prüfungen

```bash
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
# Dedizierte lokale PostgreSQL-Testinstanz wie in Betriebsanleitung starten
./scripts/test-phase2.sh
```

Integrations-/Browserprüfungen löschen ausschließlich die dedizierte
`familyos_test`-Datenbank. Playwright startet einen eigenen Produktionsserver;
Port 3000 muss frei sein. Tests decken Setup, Auth, Einladung, Profile,
Family-Isolation und die bisherigen Demos bei 360/1024/1440 px ab.
Automatische Axe-Checks ersetzen keine vollständige WCAG-Prüfung.

## Container und Betrieb

Für den vollständig automatischen lokalen Test `./deplopy/local-test.sh`
ausführen: DB, Migrationen, Secrets und fiktive Testkonten werden angelegt.
Keine manuelle Env-Datei nötig. Jeder Start setzt die eigene Testumgebung zurück.

[Lokaler Podman-Test](deplopy/README.md), [Image-Veröffentlichung](docs/deployment.md),
[Backup/Restore](docs/backup-restore.md). Das Image läuft als Non-Root und enthält
keine Runtime-Secrets. Migrationen werden explizit separat ausgeführt.
Nginx, produktives Compose und Homelab-Infrastruktur bleiben unverändert.
Kein Deployment, Registry-Push oder automatische CI ohne Auftrag.
