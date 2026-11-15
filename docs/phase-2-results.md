# Phase 2 – Tatsächliche Prüfergebnisse

Stand: 15. November 2026. Phase 2 ausdrücklich durch Benutzer freigegeben.
Umgesetzt: PostgreSQL/Prisma-Kernschema, Migration, Auth.js Credentials mit
Argon2id, DB-geprüfte widerrufbare JWT-Sessions, geschützter Bootstrap,
Einladung des zweiten Admins, zwei Kinderprofile, autorisierte Einstellungen,
Family-ACLs, persistente Limits, Origin-/CSRF-Schutz und Script-Nonce-CSP.

## Durchgeführte Prüfungen

| Prüfung | Tatsächliches Ergebnis |
|---|---|
| `npm run lint` | bestanden, keine Warnungen |
| `npm run typecheck` | bestanden |
| `npm test` | 10 Unit-Tests bestanden |
| `npm run build` | bestanden ohne Runtime-Secrets/DB; Prisma-Client generiert |
| `npm run test:integration` | 7 Tests gegen echte PostgreSQL-17-Testinstanz bestanden |
| `npm run test:e2e` | 23 bestanden, 4 bewusst übersprungen; Chromium bei 360/1024/1440 px |
| Migration | frische DB per Prisma CLI erfolgreich, erneutes deploy ohne Änderungen |
| Separater Migrationscontainer | Non-Root-Toolimage gebaut; Migration erfolgreich in frische `familyos_migration_test`-DB angewendet |
| App-Image | Podman rootless, linux/amd64, Build ohne Runtime-Secrets bestanden |
| Runtime | UID 1001, Node 24.22.3, Healthcheck und Host-HTTP-Test bestanden |
| Container-Anmeldung | beide erwachsenen Accounts erfolgreich; restaurierte Kinderprofile sichtbar |
| Neustart | Profile/Konten nach DB-Neustart erhalten; Anmeldung/Profile nach App-Neustart geprüft |
| Restore | `pg_dump -Fc` und `pg_restore --exit-on-error` in separate DB bestanden: 2 User, 4 Profile, 1 Bootstrap |
| Cookie-Smoke | HttpOnly und SameSite=Lax im Loopback-Test geprüft |
| Runtime-Inhalt | keine `.env`, `.git`, Prisma-Migrationsquellen oder Tests im App-Arbeitsverzeichnis |
| Compose | `docker compose -p familyos-local -f compose.local.yaml config --quiet` bestanden; Beispiel ohne Hostports |
| Host-Start | `npm run start` bindet laut `ss` nur 127.0.0.1:3000; Login HTTP 200 |
| Shell/Whitespace | `bash -n` für beide lokalen Skripte und `git diff --check` bestanden |
| npm Audit | produktive Abhängigkeiten: 0 Befunde; Installation meldet 7 moderate Befunde im bisherigen Dev-Baum |
| Visuell | Mobil-Login und Desktop-Einstellungen anhand erzeugter Screenshots betrachtet |

Integrationsabdeckung: falscher Setup-Schlüssel, paralleles Setup, Argon2id,
gehashte/einmalige/abgelaufene/E-Mail-gebundene Einladungen, parallele Annahme,
zwei Erwachsenenplätze, zwei Kinderplätze, persistente Profile, Cross-Family-
Reads und fremde Objekt-IDs, MEMBER-Verbot für Adminaktionen, atomare Limits mit begrenzter Zeilenerzeugung nach globaler Sperre,
Origin-Prüfung, abgelaufene/widerrufene Sessions sowie Ablehnung eines richtigen
Passworts nach ausgeschöpftem Login-Limit, auch nach Client-Neuverbindung.

Browserabdeckung: initiales Setup und erste Anmeldung im globalen Setup,
anonymer Zugriff auf alle sechs geschützten Routen, manipulierte Origin samt
Forwarded-Header, eigener Login des zweiten Erwachsenen, Kinderprofile für
beide Accounts, direkte Server-Action-Replays ohne Cookies, Logout und Replay
einer kopierten Session. Dazu bestehende Demo-/Essensplan-/Navigationstests,
Overflow und Axe-Smoke-Checks. Vier übersprungene Tests sind die doppelten
Ausführungen des schreibenden Familienflows und Login-Fehlerflows auf Mobil/
Tablet; diese beiden Flows laufen jeweils einmal auf Desktop.

## Einschränkungen

- Kein Produktivbetrieb, Registry-Push, automatisches Deployment oder CI.
  Nginx und produktives Compose blieben unverändert.
- Kein Live-Test hinter dem produktiven HTTPS-Proxy. Secure-Cookie wird durch
  die kanonische HTTPS-URL konfiguriert; tatsächliche Proxy-/TLS-Prüfung steht aus.
- Image-Scan nicht durchgeführt: Trivy und Grype nicht installiert. npm Audit
  ist kein Ersatz für einen OS-/Image-Scan. Basisimage-Digest und Release-Tags
  bleiben vor Veröffentlichung zu klären; ARM64 nicht geprüft.
- Das Compose-Beispiel wurde validiert, nicht als vollständiger Compose-Stack
  gestartet. App und DB wurden separat per Podman in isoliertem Testnetz geprüft.
- Der lokale Starter wurde im Folgeauftrag vollständig automatisiert und
  end-to-end geprüft; Details im folgenden Nachtrag.
- Initialer Versuch, eine bestehende pasta-Test-DB an ein weiteres Netz zu
  hängen, wurde von Podman abgewiesen. Containerprüfung erfolgte anschließend
  mit eigener restaurierter Test-DB in einem separaten internen Testnetz.
- NextAuth v4 ist bewusst stabil fixiert; Next-16-Integration nutzt asynchrone
  Header und `getToken` statt synchronem `getServerSession` (ADR 0002).
- Kein Passwort-Reset, MFA, Mailversand oder Familienwechsel. Einladungslinks
  werden manuell vertraulich übergeben. Abgelaufene DB-Zeilen benötigen später
  einen Betreiber-Wartungsjob. Globales Login-Limit kann unter Angriffen auch
  berechtigte Anmeldungen vorübergehend sperren.
- Style-CSP erlaubt weiterhin Inline-Styles; Script-CSP verwendet Nonces.
  Axe-Smoke ist keine vollständige WCAG-Zertifizierung. Safari/Firefox ungeprüft.
- Vitest meldet einen Hinweis zum künftigen nativen Vite-Configloader, und
  Playwright eine NO_COLOR/FORCE_COLOR-Umgebungswarnung; beide Prüfungen bestehen.

Alle Testkonten, Passwörter, Familien und Kinder sind fiktiv. Temporäre Cookies
und Screenshots liegen gitignoriert. Keine echten Secrets/Familiendaten angelegt.
Phase 3 und produktive Fachworkflows bleiben gesperrt. Noch kein Git-Commit.


## Nachtrag: vollautomatischer lokaler Teststarter

Benutzerauftrag: keine manuell anzulegende LOCAL_ENV_FILE; alles soll automatisch
im Testskript passieren. `./deplopy/local-test.sh` baut jetzt App/Migrationstool,
erzeugt ein eigenes internes Netz und eine DB ohne Hostport, generiert Secrets,
migriert die frische DB und legt über bestehende Services zwei fiktive Admins
und zwei Kinderprofile an. Test-Logins werden angezeigt. Der Bootstrap-Schlüssel
wird dem App-Container nicht übergeben. Secret-Dateien liegen vorübergehend in
einem privaten mktemp-Verzeichnis und werden per EXIT-/Signal-Trap entfernt.
`deplopy/seed-demo.ts` ist ausschließlich ein explizit gestartetes Testwerkzeug:
DB-Hostname, DB-Name, bewusste Demo-Freigabe und leere DB werden geprüft.

Tatsächlich mit CONTAINER_NAME=familyos-auto-test und LOCAL_PORT=3100 geprüft:

- Zwei vollständige Aufrufe ohne Env-Datei, Host-Node/npm, manuelle DB,
  Migration oder Setup. Beide erfolgreich, inklusive UID 1001 und Healthcheck.
- Beide erzeugten Test-Logins per Chromium geprüft; vier fiktive Profile sichtbar,
  Setup geschlossen. Kein Bootstrap-Schlüssel im App-Container, kein DB-Hostport.
- Seed auf bereits befüllter Test-DB verweigert; keine vorhandenen Daten ersetzt.
- Erneuter Start entfernt eigene alte Ressourcen und erzeugt neue funktionierende
  Passwörter. Temporäre Secret-Verzeichnisse nach beiden Läufen nicht mehr vorhanden.
- Status ausgeführt; Log-Follow mit SIGINT beendet, App lief danach weiter.
- Stop zweimal erfolgreich; App, DB, anonymes PostgreSQL-Volume und Netz danach weg.
- Fremder namensgleicher DB-Container abgewiesen und unverändert erhalten;
  absichtlich angelegte Prüfressource anschließend separat entfernt.
- Ungültiger Port abgewiesen. `bash -n`, Lint, Typecheck, 10 Unit-Tests,
  Produktions-Build und `git diff --check` bestanden.

App-Logik und Migrationen unverändert. Die vollständigen 7 Integrations- und
23 Standard-Browsertests wurden für diesen Skriptauftrag nicht erneut ausgeführt;
stattdessen wurden die oben beschriebenen tatsächlichen Container- und
Browserprüfungen des neuen Ablaufs durchgeführt. Testdienste nach Prüfung
entfernt; lokale Images bleiben. Keine Produktiv- oder Infrastrukturänderungen.
