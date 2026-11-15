# FamilyOS – Handoff

Stand: 15. November 2026. Repository: `/home/zwaem/Projects/familyOS`.

## Verbindlicher Auftrag und Freigaben

Vor Änderungen `AGENTS.md` und `FamilyOS_Codex_Implementierung.md` vollständig
lesen. Die Master-Spezifikation Version 1.7 ist verbindlich.

**Phase 1 einschließlich Essensplan-Demo und Phase 2 sind umgesetzt.** Phase 2
wurde durch den Benutzerauftrag „beginne mit phase 2“ ausdrücklich freigegeben.
**Phase 3 und spätere Phasen sind weiterhin nicht freigegeben.** Insbesondere
keine produktive Kalender-, Aufgaben-, Einkaufs- oder Essensplanimplementierung
beginnen, bevor die jeweilige Phase ausdrücklich beauftragt wird.

Nginx, produktives Compose und Homelab-Infrastruktur bleiben unverändert.
Kein Deployment, Registry-Push oder automatische CI ohne Auftrag. Lokale
Podman-Tests mit Loopback-Portbindung sind beauftragt. Alle Testfamilien,
Profile und Konten sind fiktiv; keine privaten Daten oder Secrets einchecken.

## Git-Stand

Bei Beginn dieses Handoffs war der Arbeitsbaum sauber. Letzte Commits:

- `a14f703` – `add phase 2 auth and family management`
- `ce33f95` – `feat(meal-plan): add weekly dinner planning demo`
- `fe2b2ad` – `add local Podman demo workflow & Handoff`

Phase 2 einschließlich vollautomatischem lokalem Teststarter ist in `a14f703`
committet. **Dieses Handoff aktualisiert ausschließlich `docs/HANDOFF.md` und
ist noch nicht committet.** Für diesen Auftrag wurden keine Dateien gestagt,
kein Commit und kein Push ausgeführt. Vor einem weiteren Commit `git status`
einschließlich unversionierter Dateien prüfen.

## Implementierter Umfang

Next.js App Router, React, TypeScript Strict, Tailwind, projektverwaltete
shadcn/ui-Komponenten, Lucide, selbst gehostete Inter-Schrift, responsive
AppShell mit Sidebar und mobiler BottomNav. Versionen per Lockfile fixiert.

| Route | Aktueller Zweck |
|---|---|
| `/login` | Anmeldung mit eigenem erwachsenem Account |
| `/setup` | Einmalige, per Betreiber-Secret geschützte Ersteinrichtung; danach geschlossen |
| `/invite` | E-Mail-gebundene Einladung des zweiten Erwachsenen annehmen |
| `/` | Geschütztes Dashboard mit fiktiven Fachwidgets |
| `/calendar` | Geschützte fiktive Tages-/Wochen-/Monatsansicht mit Filtern |
| `/tasks`, `/shopping` | Geschützte, flüchtige Demo-Interaktionen |
| `/meal-plan` | Geschützter Demo-Wocheneditor für sieben Abendessen |
| `/settings` | Persistente Familienprofile, Einladung, Kinderprofile und UI-Zustandsvorschau |
| `/api/auth/[...nextauth]` | Auth.js-Handler mit Origin-/CSRF-Schutz |
| `/api/health/live` | Öffentlicher minimaler Prozessstatus `{"status":"ok"}` |

### Phase 2: Daten und Sicherheitsgrenzen

PostgreSQL/Prisma-Kernmodelle: `User`, `Family`, `FamilyMember`, `Invitation`,
`AppSession`, `Bootstrap` und `RateLimit`. Initiale Migration versioniert.
Keine produktiven Kalender- oder Essensplanmodelle eingeführt.

Auth.js `next-auth` 4.24.15 nutzt Credentials und Argon2id. Das verschlüsselte
JWT-Cookie verweist auf eine zusätzlich geprüfte DB-Session mit festem
12-Stunden-Ablauf. Logout widerruft die DB-Session. Aktive Familie kommt aus
dieser Session; eine clientseitige familyId ist kein Berechtigungsnachweis.
Jede Familienaktion prüft selbst Session, Mitgliedschaft und erforderliche
Adminrechte, unabhängig vom geschützten Layout.

Setup erstellt Bootstrap-Singleton, ersten User und Familie atomar. Zweiter
Erwachsener wird gleichberechtigter ADMIN über gehashtes, E-Mail-gebundenes,
einmaliges Einladungstoken mit 24 Stunden Gültigkeit. Neue Einladung widerruft
frühere offene Links. Manuelle vertrauliche Linkübergabe, kein Mailversand.
Bis zu zwei Kinderprofile sind ohne User und Login anlegbar und bearbeitbar.
Rollen-/Typregeln sind auch durch SQL-Checks abgesichert.

DB-Rate-Limits überleben Neustarts: acht Loginversuche pro E-Mail und 100 global
je 15-Minuten-Fenster, Setup fünf Versuche. Nach globaler Sperre entstehen
keine zusätzlichen E-Mail-Limit-Zeilen. Keine Rechte oder Limits aus ungeprüften
Forwarded-IP-Headern. Mutationen prüfen die kanonische Origin; Auth.js schützt
Auth-POSTs zusätzlich durch CSRF-Tokens.

Script-Nonce-CSP über `src/proxy.ts`, dynamisches Rendering und private/no-store.
Script-`unsafe-inline` entfällt; `unsafe-eval` nur in Entwicklung. Inline-Styles
bleiben erlaubt. Next-16-Kompatibilität und Sessionstrategie: ADR 0002.

### Weiterhin isolierte Fach-Demos

Kalender, Aufgaben, Einkauf, Wetter und Essensplan verwenden ausschließlich
fiktive Fixtures. Demo-Heute bleibt Montag, **16. November 2026**, Europe/Berlin.
Die Familienprofile in Einstellungen sind davon getrennt und persistent.

`DemoMealProvider` hält gespeicherte Demo-Gerichte im React-Zustand: interne
Navigation zwischen Dashboard und Editor erhält sie; Neuladen setzt sie zurück.
Kein localStorage/sessionStorage. Wochen sind Montag–Sonntag, Tage einzeln
speicherbar; leeres Speichern entfernt einen Eintrag. Entwürfe sind getrennt;
Wochenwechsel und eigener Übersichtslink fragen vor Verwerfen, Neuladen nutzt
die Browserwarnung. Andere AppShell-Links/Browser-Zurück haben keine zusätzliche
SPA-Entwurfsabfrage. Produktiver Essensplan bleibt Phase 4 nach dem Kalender.

## Automatischer lokaler Test: bevorzugter Einstieg

```bash
./deplopy/local-test.sh
```

**Keine manuell anzulegende Env-Datei, DB oder Ersteinrichtung erforderlich.**
Voraussetzungen: Bash, Podman, curl und Coreutils; kein Host-Node/npm.
Der Starter baut App und Migrationstool, erzeugt ein eigenes internes Netz,
startet eine isolierte PostgreSQL-17-Testdatenbank, generiert zufällige Secrets,
migriert die DB und legt zwei fiktive Admins sowie zwei Kinderprofile an.

Standardadresse: **http://127.0.0.1:3000/login**. Im Terminal erscheinen
`anna@example.invalid` und `ben@example.invalid` mit jeweils frisch generiertem
Testpasswort. Kinder: Mila und Leo, ausdrücklich fiktiv und ohne Login.
Der Bootstrap-Schlüssel wird dem laufenden App-Container nicht übergeben.
Private temporäre Secret-Dateien werden bei Ende/Abbruch entfernt.

**Jeder erneute Start ersetzt die eigene Testumgebung samt Testdaten und
Passwörtern.** Keine privaten Informationen eingeben. App nur auf Loopback,
kein DB-Hostport. Checkout-Eigentümerschaft wird für App, DB und Netz geprüft;
fremde Ressourcen werden abgewiesen.

```bash
./deplopy/local-test.sh status
./deplopy/local-test.sh logs
./deplopy/local-test.sh stop
# Andere lokale Testumgebung / belegter Port:
CONTAINER_NAME=familyos-test2 LOCAL_PORT=3100 ./deplopy/local-test.sh
CONTAINER_NAME=familyos-test2 ./deplopy/local-test.sh stop
```

`stop` entfernt eigene App, DB einschließlich anonymem Volume und Testnetz.
Images bleiben lokal. Bei Fehlern ggf. eigene Ressourcen mit demselben
CONTAINER_NAME und `stop` entfernen. `logs` verfolgt App-Logs; Strg+C beendet
nur die Anzeige. Details: `deplopy/README.md` und `docs/phase-2-operations.md`.

**Bei diesem Handoff aktuell geprüft:** `podman ps` zeigt keine laufenden
Container. Die Ressourcen des automatischen Startertests wurden entfernt;
ältere Phase-2-Testcontainer sind gestoppt. Lokale Images bleiben erhalten.
Für dieses reine Handoff wurde kein Dienst gestartet.

## Direkter Host-Betrieb und Test-Suite

Für eigene dauerhafte Entwicklung `.env.example` und Betriebsanleitung nutzen.
Hier müssen DB und Runtime-Secrets ausdrücklich konfiguriert werden; der
automatische Demo-Starter oben benötigt diese Vorbereitung nicht.

```bash
npm ci
npm run db:generate
npm run db:migrate
npm run dev
```

Prisma CLI liest `.env` bzw. Prozessumgebung, nicht automatisch `.env.local`.
Runtime: DATABASE_URL, kanonische NEXTAUTH_URL, AUTH_SECRET; BOOTSTRAP_SECRET
nur zur Ersteinrichtung. HTTPS außer auf Loopback. Nach Setup Betreiber-Secret
entfernen. Keine echten Secret-Werte in Git, Build-Argumenten oder Logs.

Host-`npm run start` bindet nur 127.0.0.1. Image: interner Port 3000, UID 1001.
Migrationen explizit separat ausführen; optionales Docker-Buildziel `migrations`.
`compose.local.yaml` ist ein separates lokales Beispiel ohne Hostports und
ersetzt oder verändert kein produktives Compose.

```bash
npm run lint
npm run typecheck
npm test
npm run build
# Dedizierte Test-PostgreSQL-Instanz laut Betriebsanleitung vorbereiten:
./scripts/test-phase2.sh
bash -n deplopy/local-test.sh scripts/test-phase2.sh
git diff --check
```

`scripts/test-phase2.sh` ist die separate automatisierte Integrations-/E2E-Suite,
nicht der interaktive Demo-Starter. Sie benötigt die dafür vorgesehene lokale
`familyos_test`-DB und löscht deren fiktiven Teststand. Niemals produktive Daten
dort verwenden. Playwright startet einen eigenen Standalone-Server; Port 3000
muss frei sein. Sessionartefakte liegen gitignoriert unter `playwright/.auth/`.

## Tatsächliche Prüfungen und Grenzen

Die folgenden Ergebnisse stammen aus den vorherigen Implementierungs- und
Starterläufen. **Für dieses reine Handoff wurden keine Funktionsprüfungen,
Lint-, Typecheck- oder Buildläufe wiederholt.** Nur Git-/Containerstatus und
das Dokument wurden geprüft.

| Prüfstand | Ergebnis |
|---|---|
| Phase-2-Implementierung | Lint, Typecheck, Produktions-Build bestanden |
| Unit / Integration | 10 Unit- und 7 echte PostgreSQL-Integrationstests bestanden |
| Standard-Browser-Suite | 23 bestanden, 4 bewusst doppelte Schreib-/Login-Fehlerflows auf Mobil/Tablet übersprungen; Chromium bei 360/1024/1440 px |
| Sicherheitsabdeckung | Setup-Rennen, Token-Ablauf/-Replay, Rollen, Cross-Family-Reads/-Writes, DB-Limits, unautorisierte Server Actions, Sessionablauf und Logout-Widerruf |
| Container | Rootless Podman, amd64, UID 1001, Node 24.22.3, Healthcheck, beide Logins und Profile; App-/DB-Neustart geprüft |
| Migration / Restore | Separater Non-Root-Migrationscontainer auf frischer DB; pg_dump/Restore in separate DB mit 2 Usern, 4 Profilen, 1 Bootstrap |
| Compose | Konfiguration validiert, vollständiger Compose-Stack nicht gestartet |
| Automatischer Starter | Zwei vollständige Starts ohne manuelle Konfiguration; beide erzeugten Logins, vier Profile, geschlossener Bootstrap, neue Passwörter und entfernte Secret-Dateien geprüft |
| Starter-Verwaltung | Status, Log-Follow-Abbruch bei weiterlaufender App, zweifaches Stop; App, DB-Volume und Netz entfernt; fremde DB und ungültiger Port abgewiesen; Seed-Replay verweigert |
| Prüfungen zum Starterauftrag | Lint, Typecheck, Build, 10 Unit-Tests, Shell-Syntax und Whitespace bestanden; vollständige 7/23-Suiten nicht erneut ausgeführt |

Vollständige Ergebnisse: `docs/phase-2-results.md`.

Vor Release noch offen:

- Image-Scan: Trivy/Grype waren nicht installiert; npm Audit ersetzt keinen
  OS-/Image-Scan. Letzter produktiver npm-Auditstand: 0 Befunde; sieben moderate
  Dev-Befunde. Nicht für dieses Handoff neu abgefragt.
- Echter HTTPS-Proxy-Test und Secure-Cookie-Prüfung über TLS; bisher Loopback-
  HTTP-Cookie-Smoke für HttpOnly/SameSite=Lax. Produktionsinfrastruktur ungeändert.
- Registry/Namespace, Zielarchitektur, unveränderliche Tags, Basisimage-Digest,
  Zugangsdatenverwaltung und separaten Release-/Migrationsablauf klären.
  ARM64 ist nicht geprüft. Kein Registry-Push oder Rollout ausgeführt.
- Kein Passwort-Reset, MFA, Mailversand oder Familienwechsel. Abgelaufene
  Limit-/Session-/Einladungszeilen benötigen einen Betreiber-Wartungsjob.
  Globales Rate-Limit kann unter Angriffen berechtigte Logins vorübergehend sperren.
- Style-CSP erlaubt Inline-Styles. Axe-Smoke ist keine vollständige
  WCAG-Zertifizierung; Safari/Firefox ungeprüft. Keine pauschale Produktionsfreigabe.

## Wichtige Dateien und nächste Schritte

- `prisma/schema.prisma`, `prisma/migrations/202611150001_phase2_core/`
- `src/lib/auth/{options,session,crypto,config,schemas,rate-limit}.ts`
- `src/lib/db/client.ts`, `src/features/family/actions.ts`, `src/features/family/forms.tsx`
- `src/features/family/server/service.ts`, `src/proxy.ts`
- `deplopy/local-test.sh`, `deplopy/seed-demo.ts`, `scripts/test-phase2.sh`
- `docs/phase-2-plan.md`, `docs/phase-2-operations.md`, `docs/phase-2-results.md`
- `docs/architecture.md`, `docs/backup-restore.md`, `docs/deployment.md`
- `docs/decisions/0001-eslint-compatibility.md`, `0002-credentials-sessions.md`

Nächster Schritt: automatischen lokalen Test starten und Phase 2 bei Bedarf
abnehmen/reviewen. Dieses Handoff separat committen, falls gewünscht.
**Phase 3 erst nach neuer ausdrücklicher Freigabe beginnen.**
