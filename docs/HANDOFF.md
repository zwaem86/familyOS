# FamilyOS – Handoff

Stand: 15. November 2026. Repository `/home/zwaem/Projects/familyOS`.

## Freigabe und Stand

Phase 1 einschließlich Essensplan ist umgesetzt und inzwischen committet.
Der Benutzer hat mit „beginne mit phase 2“ Phase 2 ausdrücklich freigegeben.
Phase 2 ist implementiert und lokal geprüft, aber noch nicht committet.
Phase 3 und produktive Aufgaben/Einkauf/Essensplan bleiben gesperrt.
Vor Änderungen AGENTS.md und FamilyOS_Codex_Implementierung.md vollständig lesen.

Keine Änderungen an Nginx, produktivem Compose oder Homelab-Infrastruktur.
Kein Deployment, Registry-Push oder automatische CI. Alle Testdaten sind fiktiv.

## Phase 2

- PostgreSQL/Prisma: User, Family, FamilyMember, Invitation, AppSession,
  Bootstrap-Singleton und DB-Rate-Limits. Versionierte initiale Migration.
- Auth.js `next-auth` 4.24.15 mit Credentials und Argon2id. Verschlüsseltes
  JWT-Cookie plus bei jedem Zugriff geprüfte DB-Session, fester Ablauf 12h,
  Logout-Widerruf. Details und Next-16-Kompatibilität in ADR 0002.
- `/setup` mit Betreiber-Secret nur vor Erstinitialisierung, atomarer Singleton.
- `/login`, `/invite`, zweiter gleichberechtigter Admin per 24h-Einladung;
  Token nur gehasht gespeichert, E-Mail-gebunden und transaktional einmalig.
- `/settings` zeigt echte gespeicherte Profile, lädt zweiten Erwachsenen ein
  und legt bis zu zwei Kinder ohne User/Login an. Kinder sind bearbeitbar.
- Sämtliche Dashboard-Routen benötigen Anmeldung. Server Actions prüfen
  unabhängig vom Layout Origin, Session, Mitgliedschaft und Adminrechte.
- Aktive Familie kommt aus der DB-Session, keine Berechtigung aus Client-familyId.
- Script-Nonce-CSP über src/proxy.ts, dynamisches Rendering und private/no-store.

Kalender, Aufgaben, Einkauf, Wetter und Essensplan sind weiter isolierte
fiktive Demos mit festem Demo-Heute 16. November 2026. Keine produktive
Fachpersistenz. DemoMealProvider erhält Gerichte bei interner Navigation;
Neuladen setzt sie zurück. Familienprofile in Einstellungen sind persistent.

## Einstiegspunkte

- `prisma/schema.prisma`, `prisma/migrations/202611150001_phase2_core/`
- `src/lib/auth/{options,session,crypto,config,schemas,rate-limit}.ts`
- `src/features/family/server/service.ts`, `actions.ts`, `forms.tsx`
- `src/app/(auth)/`, `src/app/api/auth/[...nextauth]/route.ts`
- `tests/integration/family.test.ts`, `tests/e2e/auth.spec.ts`
- `docs/phase-2-plan.md`, `docs/phase-2-operations.md`, `docs/phase-2-results.md`
- `docs/backup-restore.md`, `docs/decisions/0002-credentials-sessions.md`

## Lokal starten

Runtime-Secrets und DB anhand `.env.example` und Betriebsanleitung setzen.
Prisma CLI lädt `.env` oder Prozessumgebung, nicht automatisch `.env.local`.

```bash
npm ci
npm run db:generate
npm run db:migrate
npm run dev
```

Einmalig `/setup` mit eigenem Betreiber-Schlüssel öffnen, danach Schlüssel
entfernen. Unter `/settings` zweiten Erwachsenen einladen und Kinder anlegen.
Keine Standardkonten oder echten Zugangsdaten werden ausgeliefert.

`npm run start` bindet auf Host nur 127.0.0.1. Im Image interner Port 3000,
Non-Root-UID 1001. Migrationen laufen separat; optionales Buildziel `migrations`.
`compose.local.yaml` ist nur ein lokales Beispiel ohne Host-Portfreigaben.
Der Podman-Starter richtet seit dem Folgeauftrag alles automatisch ein: eigene
Test-DB, internes Netz, Migrationen, Zufallssecrets und vier fiktive Profile.
Keine manuelle Env-Datei nötig; Test-Logins werden angezeigt. Jeder Start setzt
diese eigene Testumgebung zurück, stop entfernt auch Testdaten und Netz.

## Tatsächliche Verifikation

Lint, Typecheck und Produktions-Build bestanden; 10 Unit-, 7 echte PostgreSQL-
Integrations- und 23 Browsertests bestanden. Vier bewusst doppelte Schreib-/
Login-Fehlerflows auf Mobil/Tablet übersprungen. Initiales Browser-Setup,
beide Logins, direkte unautorisierte Server Actions, Token-Replay, Rollen,
Family-Isolation und bestehende Demos geprüft.

App- und separates Migrationsimage mit Podman rootless für amd64 gebaut.
App: UID 1001, Node 24.22.3, Healthcheck, beide Logins, Profile und Neustart
geprüft. Migrationscontainer auf frischer Test-DB erfolgreich. pg_dump/Restore
in separate DB: 2 User, 4 Profile, 1 Bootstrap. Compose-Konfiguration validiert.
Vollständige Ergebnisse und Einschränkungen: `docs/phase-2-results.md`.

Offen vor Release: Image-Scan (Trivy/Grype fehlen), echter HTTPS-Proxy-Test,
Secure-Cookie über echtes TLS, ARM64, Release-Digest/Registry-Werte. Keine
Behauptung vollständiger Produktionsreife. Produktive npm-Abhängigkeiten
ohne Audit-Befund; sieben moderate bestehende Dev-Befunde.

## Übergabe

Temporäre App-/DB-Testcontainer der Phase-2-Prüfung sind gestoppt; lokale Images
und ausschließlich fiktive Testdaten bleiben erhalten. Kein laufender Dienst
ist für die Übergabe vorgesehen. Keine Dateien gestagt, kein Commit oder Push.
Vor Commit `git status` einschließlich neuer Dateien prüfen.

Nächster Schritt: Phase-2-Änderungen reviewen und lokal abnehmen/committen.
Phase 3 erst nach neuer ausdrücklicher Freigabe beginnen.


Nachtrag zum automatischen lokalen Starter: Zwei vollständige Starts ohne
Env-Datei, neue Test-Logins, vier Profile, geschlossener Bootstrap, Seed-Replay-
Sperre, temporäre Secret-Bereinigung, Status, Log-Follow-Abbruch und zweifaches
Stop geprüft. Stop entfernt eigene DB samt anonymem Volume und Testnetz.
Fremde DB-Ressource und ungültiger Port werden abgewiesen. Dokumentation in
`deplopy/README.md` und `docs/phase-2-results.md` aktualisiert. Kein laufender
Testdienst aus diesem Folgeauftrag; Images bleiben lokal.
