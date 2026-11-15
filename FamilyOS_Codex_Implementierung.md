# FamilyOS – Master-Spezifikation für Codex

> Version 1.7 · Stand: 15. November 2026
> Status: verbindliche Implementierungsrichtlinie für ein neues Projekt  
> Zielplattform: bestehendes Homelab; Bereitstellung durch Build und Push versionierter OCI/Docker-Images in eine vorhandene Registry

## 0. Auftrag an Codex

Baue **FamilyOS**, eine datenschutzorientierte, responsive Familien-Web-App für **zwei Erwachsene und zwei Kinder**. Arbeite iterativ und setze zunächst **Phase 1 (UI)**, danach **Phase 2 (Datenbank, Authentifizierung und Familienverwaltung)** und danach **Phase 3 (Familienkalender)** um. **Nicht alle Phasen ungeprüft auf einmal implementieren.** Vor jeder Phase Repository prüfen, Plan erstellen, offene sicherheitsrelevante Entscheidungen nennen, implementieren, testen und Ergebnisse dokumentieren.

Diese Datei ist die zentrale Produkt- und Architekturvorgabe. Lege ergänzend eine knappe `AGENTS.md` an, die Codex anweist, diese Spezifikation vor Änderungen zu lesen. Falls technische Details mit aktuellen Framework-Versionen kollidieren, dokumentiere die Abweichung als Architecture Decision Record (ADR), bevor du davon abweichst. Keine vorgetäuschten Tests, Integrationen oder Deployments.

## 1. Produktvision und Rahmenbedingungen

- Name: **FamilyOS**; Leitidee: „Alles, was eure Familie bewegt. An einem Ort.“
- Geräte: Tablet (insbesondere Querformat/Wanddisplay), Smartphone und Desktop.
- Design: modern, minimalistisch, ruhiges Light Theme, Apple-inspirierte Klarheit ohne Kopieren proprietärer UI.
- Familie: zwei Erwachsene mit getrennten Logins und gleichen Adminrechten; zwei Kinder als Familienprofile **ohne Login** in der ersten Version.
- Kalender: zunächst eigener lokaler Kalender; spätere **Apple-iCloud-CalDAV-Integration**. In Phase 3 nur Provider-Abstraktion, noch keine echte iCloud-Anbindung.
- Essensplan: gemeinsamer Wochenplan für das Abendessen; aktuelle Woche übersichtlich auf dem Dashboard, kommende Woche im Voraus planbar.
- Smart Home: später; Home Assistant erst nach dem Kernprodukt integrieren.
- Betrieb: Bestehende Homelab-Infrastruktur mit Docker Compose und klassischem Nginx direkt auf dem Host; HTTPS und externer Zugriff sind bereits eingerichtet. **Codex darf Nginx, die produktive Compose-Datei und die Infrastruktur nicht verändern.** Liefergegenstand ist ein versioniertes, registryfähiges OCI/Docker-Image samt reproduzierbarem Build-/Push-Prozess.
- Sprache: UI standardmäßig Deutsch; Internationalisierung später möglich. Standardzeitzone `Europe/Berlin`.

### Nichtziele für die ersten drei Phasen

Keine KI-Funktionen, keine Home-Assistant-Steuerung, keine produktive iCloud-Synchronisation, keine Push-Benachrichtigungen, kein komplexes Echtzeitsystem, keine Multi-Tenant-SaaS-Abrechnung. Einkauf, Aufgaben und Essensplan können in Phase 1 als Demo-Oberflächen existieren; produktive Aufgaben-, Einkaufs- und Essensplan-Workflows kommen nach Phase 3.

## 2. Architekturentscheidungen

| Bereich | Vorgabe |
|---|---|
| Architektur | Modularer Monolith, feature-basiert |
| Frontend/Backend | Next.js App Router, React, TypeScript Strict Mode |
| Styling | Tailwind CSS, shadcn/ui, Lucide React, Inter |
| Datenbank | PostgreSQL mit Prisma und versionierten Migrationen |
| Validierung | Zod an allen serverseitigen Eingabegrenzen |
| Auth | Auth.js mit sicherer Session-Verwaltung; für Credentials Argon2id |
| Tests | Vitest für Unit/Integration, Playwright für E2E |
| Auslieferung | Multi-Stage-Dockerfile, OCI-Image, versionierte Tags, Registry-Push; kein Infrastruktur-Deployment |
| Kalender | Domain-Service und austauschbare CalendarProvider-Schnittstelle |
| PWA | Später installierbar; keine sensiblen API-Daten dauerhaft in öffentlichen Caches |
| Netzwerk | Vorhandener Reverse Proxy und Compose bleiben unverändert; App muss für Betrieb hinter HTTPS-Proxy geeignet sein |

Bevorzuge stabile, zueinander kompatible Versionen zum Implementierungszeitpunkt; Versionen per Lockfile fixieren. Verwende keine unkontrollierten `latest`-Tags im produktiven Deployment.

## 3. UI/UX-Spezifikation

### Design-Tokens

- Canvas `#F8FAFC`, Surface `#FFFFFF`, Primary `#2563EB`, Success `#10B981`, Accent `#F59E0B`.
- Schrift: Inter; Basisschrift 14–16 px, Überschriften 24–32 px.
- Kartenradius 16–20 px; 8-Punkt-Abstandssystem; dezente Schatten.
- Familienfarben beispielsweise Blau, Rosa, Grün, Violett; Namen und Symbole ergänzen die Farbkodierung.
- Accessibility-Ziel WCAG 2.2 AA; sichtbare Fokusindikatoren, Tastaturbedienung, ausreichende Kontraste, Touch-Ziele ca. 44×44 px.

### Layouts

**Desktop:** Sidebar links, Topbar, Dashboard mit mehreren Spalten, Kalender mit großer Wochen-/Monatsansicht.  
**Tablet:** touchoptimiertes Bento-Grid, Querformat bevorzugt, optional später Kiosk-/Vollbildmodus.  
**Smartphone:** einspaltige Widgets, feste Bottom-Navigation, kompakte Tagesübersicht und schnelle Erfassung; ab 360 px ohne horizontales Scrollen.

### Hauptnavigation

1. Übersicht (`/`)
2. Kalender (`/calendar`)
3. Aufgaben (`/tasks`)
4. Einkauf (`/shopping`)
5. Einstellungen (`/settings`)

### Dashboard-Widgets

`GreetingWidget`, `UpcomingEventsWidget`, `TasksWidget`, `ShoppingWidget`, `WeatherWidget` (zunächst Demo), `MealPlanWidget` (Essensplan, zunächst Demo), `QuickActions`. Datenquellen und Demo-Daten strikt trennen. Lade-, Leer-, Fehler- und Erfolgzustände implementieren. Dashboard-Layout später nutzerabhängig konfigurierbar.

### Essensplan – Abendessen für die Woche

**Ziel:** Die Familie sieht auf einen Blick, was in der aktuellen Woche abends gegessen wird, und kann die kommende Woche vorplanen.

- Eine Woche umfasst **Montag bis Sonntag**, einschließlich Wochenende. Wochenzuordnung und „Heute“ richten sich nach der Familienzeitzone, standardmäßig `Europe/Berlin`.
- Pro Familie und lokalem Kalendertag gibt es höchstens einen Abendessenseintrag. Ein Gericht ist freier Text (1–120 Zeichen nach Trim), z. B. „Gemüselasagne“, „Reste essen“ oder „Auswärts“. Es ist keine Rezeptdatenbank erforderlich.
- Die Planungsansicht `/meal-plan` öffnet die aktuelle Woche. „Diese Woche“, „Nächste Woche“ sowie Vor-/Zurück-Navigation zeigen jeweils den genauen Datumsbereich; Eingaben der kommenden Woche dürfen die aktuelle Woche nicht überschreiben.
- Beide Erwachsenen können Gerichte pro Tag eintragen, ändern und entfernen. Jeder Tag ist einzeln speicherbar; eine leere Eingabe entfernt den vorhandenen Eintrag nach bewusster Speicheraktion. Kein automatisches Speichern beim Tippen.
- Leere Tage zeigen **„Noch offen“**. Nicht vollständig geplante Wochen sind erlaubt. Ein Wochenwechsel allein speichert oder löscht keine Eingaben; bei ungespeicherten Änderungen wird vor dem Verwerfen nachgefragt.
- Das **`MealPlanWidget` auf dem Dashboard** zeigt standardmäßig die aktuelle Woche mit Datumsbereich und allen sieben Paaren aus Wochentag/Datum und Gericht. Der heutige Tag und das heutige Abendessen werden zusätzlich hervorgehoben, auch textlich. Vergangene Tage bleiben lesbar.
- Auf Desktop/Tablet erscheint eine kompakte Wochenübersicht, auf dem Smartphone eine gut lesbare vertikale Liste ohne horizontales Scrollen ab 360 px. Lange Gerichtsnamen umbrechen. Fehlende Einträge bleiben sichtbar.
- „Essensplan bearbeiten“ und „Nächste Woche planen“ führen aus dem Widget direkt zur passenden Woche in `/meal-plan`. Ein zusätzlicher Eintrag in der mobilen BottomNav ist dafür nicht erforderlich.
- Speichern und Entfernen erhalten klare Erfolgs-/Fehlerrückmeldungen; Ladezustände, leere Wochen und Tastatur-/Touch-Bedienung gehören zum Umfang. Bei Fehlern bleiben Eingaben für einen erneuten Versuch erhalten.
- Produktive Einträge werden dauerhaft gespeichert und sind beiden berechtigten Erwachsenen zugänglich. Es gelten dieselben serverseitigen Session-/Family-ACL-Prüfungen wie für andere Familienobjekte. Kinderprofile erhalten dadurch keinen Login oder öffentlichen Zugriff.
- Zunächst keine Rezepte, Zutatenverwaltung, Nährwerte, KI-Vorschläge, automatische Einkaufsliste oder automatische Kalendertermine. Eine spätere Einkaufsverknüpfung ist ein eigener Auftrag.

**Phasenzuordnung:** Die Essensplan-Demo ist ausdrücklich als Erweiterung von Phase 1 freigegeben und gehört zu deren UI-Umfang. Sie nutzt ausschließlich isolierte fiktive Fixtures und gemeinsamen flüchtigen React-Zustand: innerhalb der App-Navigation bleiben gespeicherte Demo-Gerichte sichtbar, beim Neuladen werden sie zurückgesetzt. Das Demo-Heute richtet sich wie die übrige Phase-1-UI nach dem gekennzeichneten festen Demo-Datum. Die produktive Umsetzung mit DB-Persistenz und Family-ACLs gehört nach Phase 3 in Phase 4 zusammen mit Aufgaben und Einkauf; sie benötigt wie jede weitere Phase eine ausdrückliche Freigabe. Phase 2 wurde am 15. November 2026 ausdrücklich durch den Benutzer freigegeben; Phase 3 und spätere Phasen bleiben gesperrt.

**Akzeptanzkriterien:**

1. Das Dashboard zeigt alle sieben Abendessen der aktuellen Familienwoche; „Heute“ und offene Tage sind eindeutig erkennbar.
2. Gerichte für die kommende Woche können erfasst und später geändert oder entfernt werden, ohne die aktuelle Woche zu verändern.
3. In der produktiven Umsetzung sehen beide Erwachsenen gespeicherte Änderungen auch nach Neuladen; fremde Familien können weder lesen noch schreiben.
4. Wochenbeginn Montag, Monats-/Jahreswechsel und Sommerzeitwechsel verschieben keinen Eintrag auf ein anderes lokales Datum.
5. Mobile Ansicht ab 360 px, Tastaturbedienung sowie Lade-, Leer-, Fehler- und Erfolgzustände sind geprüft.

## 4. Benutzer- und Berechtigungsmodell

- `User`: authentifiziertes Konto, E-Mail und Authentifizierungsdaten.
- `Family`: gemeinsamer, logisch isolierter Familienbereich.
- `FamilyMember`: Profil in einer Familie; optional mit `User` verknüpft.
- Zwei Erwachsene erhalten `ADMIN`; Kinder sind Profile mit `CHILD` und ohne eigenen Login.
- Ein Benutzer kann später mehreren Familien angehören; **jede Anfrage ist auf die aktive Family zu beschränken**.
- Bei jedem Lesen und Schreiben Session, Family-Mitgliedschaft und Berechtigung serverseitig prüfen. Niemals eine clientseitig übermittelte `familyId` als Berechtigungsnachweis akzeptieren.
- Objektverknüpfungen müssen zur selben Family gehören; bei Bedarf Composite Foreign Keys und transaktionale Prüfungen einsetzen.
- Kinderprofile dürfen nicht durch ungeschützte URLs oder öffentliche Endpunkte auslesbar sein.
- Keine offene Selbstregistrierung: initialer Admin über geschützten Bootstrap-Prozess; zweiter Erwachsener über einmaliges, zeitlich begrenztes Einladungstoken. Token gehasht speichern, Ablauf und Einmalverwendung erzwingen.
- Passwörter mit Argon2id hashen; Session-Cookies `HttpOnly`, `Secure` im HTTPS-Produktivbetrieb, angemessenes `SameSite`; CSRF-Schutz nach Auth.js- und Next.js-Empfehlungen.
- Login-Rate-Limits, Schutz vor Brute Force und aussagearme Login-Fehler implementieren; Proxy-Rate-Limits sind nur zusätzliche Verteidigung.

## 5. Datenmodell

Verwende UUIDs, UTC-Zeitpunkte, `createdAt`/`updatedAt` wo sinnvoll, eindeutige Indizes und referenzielle Integrität.

### Kernmodelle

| Modell | Wesentliche Felder / Beziehungen |
|---|---|
| `User` | id, email unique, name?, passwordHash?, timestamps |
| `Family` | id, name, timezone default `Europe/Berlin`, timestamps |
| `FamilyMember` | id, familyId, userId?, name, color, role, type; unique `(familyId,userId)` für verknüpfte Konten |
| `Calendar` | id, familyId, name, color, source `LOCAL`/`ICLOUD`, externalId? |
| `Event` | id, familyId, calendarId, title, description?, startsAt, endsAt, allDay, recurrenceRule?, timestamps |
| `EventParticipant` | eventId, familyMemberId; unique Paar |
| `Task` | id, familyId, title, description?, status, dueAt?, assignedToId?, timestamps |
| `MealPlanEntry` | id, familyId, date (lokales SQL-DATE), dish, timestamps; unique `(familyId,date)`; ausschließlich Abendessen |
| `Routine` | id, familyId, title, recurrenceRule, optionale Aufgaben-Vorlage |
| `ShoppingList` | id, familyId, name, timestamps |
| `ShoppingItem` | id, listId, name, quantity?, unit?, checked, timestamps |
| `DashboardWidget` | id, familyId, userId?, type, position, settings (validiertes JSON) |
| `CalendarConnection` | id, familyId, provider, credentialRef, syncStatus, timestamps |
| `ExternalEventMapping` | id, eventId, connectionId, externalUid, recurrenceId?, etag?, remoteHref? |

Auth.js kann zusätzliche Adaptermodelle benötigen. Diese passend zur tatsächlich eingesetzten Auth.js-Version implementieren.

### Integritätsregeln

- `endsAt > startsAt` für normale zeitgebundene Termine.
- Für Ganztagstermine klare **exklusive Enddatum-Semantik** festlegen und durchgängig verwenden.
- `Event.calendarId`, `EventParticipant.familyMemberId`, `Task.assignedToId` müssen zur `Event`/`Task`-Family gehören. Durch zusammengesetzte Fremdschlüssel und/oder transaktionale Validierung absichern.
- Event-UID und Recurrence-ID für spätere CalDAV-Integration separat modellieren; nicht allein auf UID vertrauen.
- Wiederholungen nach RFC 5545 mit Ausnahmen, Sommerzeit und Serienänderungen behandeln. Bei Phase 3 das konkrete Persistenzmodell für Ausnahmen (z. B. `EventException`) ergänzen und testen.
- Prisma-Migrationen versionieren, keine destruktiven Schemaänderungen ohne explizite Freigabe.
- Essensplan-Einträge verwenden ein lokales Kalendertag-Datum (`YYYY-MM-DD` / PostgreSQL `DATE`), keinen UTC-Mitternachtszeitpunkt. Der eindeutige Index `(familyId,date)` sichert einen Eintrag je Abend und unterstützt Wochenabfragen. Die Migration wird erst mit der freigegebenen produktiven Essensplan-Phase eingeführt.
- Indexe für `(familyId, startsAt)`, `(familyId, status)`, `(familyId, dueAt)` sowie relevante externe Sync-Schlüssel.

## 6. Projektstruktur

```text
familyos/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── public/
│   ├── icons/
│   └── manifest.webmanifest
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx
│   │   ├── (auth)/setup/page.tsx
│   │   ├── (dashboard)/layout.tsx
│   │   ├── (dashboard)/page.tsx
│   │   ├── (dashboard)/calendar/page.tsx
│   │   ├── (dashboard)/tasks/page.tsx
│   │   ├── (dashboard)/shopping/page.tsx
│   │   ├── (dashboard)/meal-plan/page.tsx
│   │   ├── (dashboard)/settings/page.tsx
│   │   └── api/
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   └── shared/
│   ├── features/
│   │   ├── dashboard/
│   │   ├── family/
│   │   ├── calendar/
│   │   ├── tasks/
│   │   ├── shopping/
│   │   ├── meal-plan/
│   │   └── integrations/icloud/
│   ├── lib/
│   │   ├── auth/
│   │   ├── db/
│   │   ├── permissions/
│   │   └── validation/
│   └── types/
├── tests/{unit,integration,e2e}/
├── docs/
│   ├── architecture.md
│   ├── deployment.md
│   ├── backup-restore.md
│   └── decisions/
├── AGENTS.md
├── .env.example
├── compose.yaml
├── Dockerfile
└── README.md
```

Die Route Groups `(auth)` und `(dashboard)` sind Next.js-interne Verzeichnisnamen, keine URL-Bestandteile. Features besitzen nach Bedarf `components/`, `server/`, `schemas/`, `types/`, `tests/`.

## 7. Container-Image-Build und Registry-Publishing (verbindlich)

### Verantwortungsgrenze

**Bereits vorhanden und nicht von Codex zu implementieren oder zu verändern:** Nginx direkt auf dem Host, TLS-Zertifikate, öffentliche Domain, Reverse-Proxy-Routing, Firewall, produktive Docker-Compose-Konfiguration und Registry-Infrastruktur. Keine generierten Nginx-Konfigurationsdateien, keine eigenmächtigen Host-Portfreigaben, kein `docker compose up` auf dem produktiven Host und keine automatischen Deployments. Ein lokales Compose-Beispiel für Entwicklung/Tests ist zulässig, muss klar als *nicht produktiv* gekennzeichnet sein.

**Von Codex zu liefern:** Ein reproduzierbar baubares, möglichst schlankes OCI-kompatibles Docker-Image der Next.js-App, Skripte bzw. Make-Targets für Build, Tag und Push, eine `.dockerignore`, dokumentierte Runtime-Konfiguration, Image-Metadaten und Tests. Ziel-Registry und Namespace sind per Variablen konfigurierbar; keine Registry-URL erfinden.

### Dockerfile und Laufzeit

- Multi-Stage-Build mit getrennten Stufen für Dependencies, Build und Runtime; Next.js `output: 'standalone'` verwenden.
- Gepinnte, unterstützte Node.js-LTS-Major-Version, passendes Debian-slim-Image bevorzugen; Basisimage-Version dokumentieren und regelmäßig aktualisieren.
- Paketmanager anhand des Lockfiles bestimmen; `npm ci` / entsprechendes Frozen-Lockfile-Verfahren nutzen. Kein unkontrolliertes Installieren von Abhängigkeiten.
- Prisma Client im Build generieren; erforderliche OpenSSL-/Systembibliotheken für die gewählte Basis prüfen. Build und Runtime müssen kompatible Plattformen haben.
- Nur erforderliche Standalone-Artefakte, `public` und `.next/static` in das Runtime-Image kopieren; keine `.env`-Dateien, `.git`, Testdaten oder Secrets einpacken.
- Prozess als nicht privilegierter Benutzer starten. `NODE_ENV=production`, `HOSTNAME=0.0.0.0` und dokumentierter interner App-Port (Standard 3000). `EXPOSE` dokumentiert nur den Port und veröffentlicht ihn nicht.
- `SIGTERM` sauber behandeln; Logs auf stdout/stderr, keine Logdateien im Container voraussetzen.
- Health-Endpunkt `/api/health/live` ohne vertrauliche Informationen; optional Readiness-Endpunkt mit minimaler DB-Prüfung und geeigneter Absicherung.
- Container-Start darf keine destruktiven Migrationen ausführen. Datenbankmigrationen (`prisma migrate deploy`) als expliziten, separaten Release-Schritt dokumentieren.
- Konfiguration zur Laufzeit via Umgebungsvariablen/Secrets; keine Secrets als Docker-Build-Argumente, Image-Layer, Labels oder `NEXT_PUBLIC_*`-Variablen. Nur wirklich öffentliche Werte dürfen `NEXT_PUBLIC_*` verwenden.
- Reverse-Proxy-Betrieb berücksichtigen: kanonische öffentliche HTTPS-URL und Auth.js-Host-/Cookie-Einstellungen zur Laufzeit konfigurieren; Forwarded-Header nur vom vertrauenswürdigen Proxy akzeptieren. Kein blindes Vertrauen in clientseitig gesetzte `X-Forwarded-*`-Header.

### Image-Namensschema und Versionierung

Konfigurierbare Variablen:

```bash
REGISTRY=registry.example.invalid
IMAGE_NAMESPACE=family
IMAGE_NAME=familyos
VERSION=0.1.0
PLATFORMS=linux/amd64
```

`registry.example.invalid` ist ausschließlich ein **Platzhalter**. Vor Verwendung die echte Registry-Adresse einsetzen. Resultierender Image-Name: `${REGISTRY}/${IMAGE_NAMESPACE}/${IMAGE_NAME}`.

- Release-Tag: `1.0.0` (SemVer ohne zwingendes `v`-Präfix; Konvention im README festlegen).
- Zusätzlich unveränderlicher Commit-Tag: `sha-<kurzer-git-sha>`.
- Optional `latest` nur für explizit freigegebene stabile Releases; nie ausschließlich `latest` verwenden.
- OCI-Labels mindestens für Source, Revision, Version und Created, soweit die Werte vorhanden sind; keine internen Geheimnisse in Labels.
- Deployment bevorzugt mit **Image-Digest** `image@sha256:...` oder einem organisatorisch unveränderlichen Tag; Tags können überschrieben werden.

### Build und Push (Beispielbefehle)

```bash
# Einmalig auf dem Build-Rechner (interaktive Anmeldung):
docker login "$REGISTRY"

# Buildx-Builder muss für die gewünschten Plattformen eingerichtet sein.
IMAGE="$REGISTRY/$IMAGE_NAMESPACE/$IMAGE_NAME"
SHA="$(git rev-parse --short=12 HEAD)"

docker buildx build \
  --platform "${PLATFORMS:-linux/amd64}" \
  --tag "$IMAGE:$VERSION" \
  --tag "$IMAGE:sha-$SHA" \
  --label "org.opencontainers.image.revision=$(git rev-parse HEAD)" \
  --label "org.opencontainers.image.version=$VERSION" \
  --push .
```

Für reine lokale Tests stattdessen `docker buildx build --load ...` mit **nur einer Plattform** verwenden. `--push` veröffentlicht direkt in die Registry; bei mehreren Plattformen entsteht ein Multi-Arch-Manifest. `linux/arm64` nur hinzufügen, wenn Build-Umgebung, native Abhängigkeiten und Zielhardware verifiziert sind. Vor Push prüfen, dass keine uncommitteten Änderungen unbeabsichtigt im Release landen.

Codex soll ein robustes `scripts/publish-image.sh` **oder** Makefile erstellen, das benötigte Variablen validiert, fehlende Tools meldet, saubere Tags erzeugt, Fehler abbricht (`set -euo pipefail`) und den gepushten Image-Digest ausgibt. Kein Login-Passwort in CLI-Argumenten oder Skripten hinterlegen. Für CI nur sichere Registry-Credentials/Secrets verwenden.

### Sicherheits- und Qualitätssicherung der Images

- `.dockerignore` für `.git`, `node_modules`, `.env*` (mit ggf. notwendiger Ausnahme nur für dokumentierte nicht geheime Beispiele), Coverage, lokale DB-Dumps, Backups und Testartefakte.
- Build für `linux/amd64` erfolgreich; Image startet ohne Root-Rechte und liefert den Health-Endpunkt.
- Container-Image auf bekannte Schwachstellen prüfen (z. B. Trivy oder Grype), Ergebnisse und Restrisiken dokumentieren.
- Optional SBOM und Signierung/Attestations, wenn die Registry und der Buildprozess dies unterstützen.
- Release-Prozess: Tests → Image bauen → Smoke-Test → Scan → versionierte Tags → Registry-Push → Digest notieren. **Kein automatischer Rollout.**
- Dokumentiere die minimal erforderlichen Runtime-Variablen (z. B. `DATABASE_URL`, Auth.js-Secret, öffentliche Basis-URL), interne Ports, persistente Daten und die Reihenfolge für DB-Migrationen; keine Änderungen an vorhandener Compose-/Nginx-Infrastruktur vornehmen.

### Akzeptanzkriterien für die Auslieferung

1. `docker build` bzw. `docker buildx build` funktioniert reproduzierbar mit Lockfile.
2. Das Runtime-Image enthält keine Geheimnisse und läuft als Non-Root-Benutzer.
3. Build- und Push-Befehle akzeptieren eine beliebige vorhandene OCI-Registry.
4. SemVer- und Git-SHA-Tags werden erzeugt und der Digest ist nachvollziehbar.
5. Keine produktive Nginx- oder Compose-Konfiguration wird generiert oder geändert.
6. Start-/Health-/Smoke-Test und sicherheitsrelevante Image-Prüfungen sind dokumentiert.

## 8. Sicherheits- und Datenschutzanforderungen

Die App ist öffentlich erreichbar und verarbeitet private Familieninformationen. Sicherheit ist eine Freigabebedingung, keine spätere Optimierung.

- Zugriff auf sämtliche Familienobjekte nur nach Session- und Family-ACL-Prüfung; IDOR-/Cross-Tenant-Tests.
- Sichere Authentifizierung, Rate-Limiting, Einladungsablauf, Passwort-Reset nur mit verifizierten Tokens (falls implementiert).
- Keine offenen Setup-Endpunkte nach Erstinitialisierung; Bootstrap gegen parallele Initialisierung absichern.
- Server Actions und API-Routen als öffentlich aufrufbare Endpunkte behandeln, nie auf UI-Sichtbarkeit vertrauen.
- Eingaben mit Zod prüfen; Ausgabe sicher rendern; keine ungeprüften HTML-Inhalte.
- Sicherheitsheader, CSP, CSRF-/Origin-Schutz, sichere Cookies und HTTPS.
- Externe URLs und CalDAV-Endpunkte gegen SSRF absichern; keine beliebigen vom Benutzer angegebenen internen Netzwerkziele abrufen.
- Abhängigkeiten und Container regelmäßig auf bekannte Schwachstellen prüfen.
- Sensible Daten in Logs minimieren; keine unnötigen Analytik- oder Trackingdienste.
- Kinderprofile und persönliche Termine nur den berechtigten Familienmitgliedern anzeigen.
- Für externe Erreichbarkeit keine unauthentifizierten Kiosk-Datenendpunkte. Ein späterer Wanddisplay-Modus benötigt eine bewusst begrenzte, geschützte Session und ggf. reduzierte Datenansicht.

## 9. Kalenderarchitektur und spätere iCloud-Anbindung

### Phase 3: lokaler Kalender

- Tages-, Wochen-, Monatsansicht; responsiv.
- CRUD für Termine; Titel, Beschreibung, Zeit, Ganztag, Teilnehmer, Kalender.
- Filter nach Mitgliedern, Farben, mehrtägige und ganztägige Termine.
- Wiederholungen nach RFC 5545 mit Ausnahmen und Bearbeiten „nur diesen Termin“ vs. „gesamte Serie“.
- `Europe/Berlin` als Standard für Anzeige und lokale Eingaben; Zeitpunkte in UTC speichern; lokale Datumskomponenten für Ganztagstermine sauber modellieren.
- Sommerzeit-Sprünge, über Mitternacht laufende Termine, Wochenstart Montag, inklusive/exklusive Grenzen testen.
- Kalenderdaten nur aus serverseitig autorisierten Services laden.

### Provider-Schnittstelle

```typescript
interface CalendarProvider {
  getCalendars(): Promise<CalendarInfo[]>;
  getEvents(calendarId: string, range: DateRange): Promise<CalendarEvent[]>;
  createEvent?(calendarId: string, input: CreateEventInput): Promise<CalendarEvent>;
  updateEvent?(eventId: string, input: UpdateEventInput): Promise<CalendarEvent>;
  deleteEvent?(eventId: string): Promise<void>;
}
```

Definiere die genannten Domain-Typen separat; UI darf nicht von CalDAV-spezifischen Formaten abhängen. Implementiere `LocalCalendarProvider`. iCloud-Adapter zunächst nur als dokumentierte Schnittstelle, nicht als Fake-Integration.

### Spätere iCloud-Phase

- Apple iCloud über CalDAV; Authentifizierungsverfahren anhand aktueller Apple-Vorgaben verifizieren.
- Separate Verbindungen/Kalender je berechtigtem Erwachsenem; Zugriff nur mit dessen ausdrücklicher Einrichtung.
- Zunächst **read-only**, danach optional bidirektional.
- Serverseitiger Sync-Worker mit Scheduling, Backoff, Fehlerzuständen und Rate-Limits.
- CalDAV-Discovery, Kalender-URLs, UID, ETag, Sync-Token (wenn unterstützt), `RECURRENCE-ID`, Löschungen und Konflikte korrekt behandeln.
- Keine doppelten Termine; deterministische Zuordnung zu lokalen Events.
- Zugangsdaten verschlüsselt mit getrennt verwaltetem Schlüssel speichern; nie an Browser ausliefern.
- Importierte Ereignisse mit Quelle markieren; kein stillschweigendes Zurückschreiben nach iCloud.

## 10. Implementierungsphasen und Codex-Aufträge

### Phase 1 – Designsystem und UI-Prototyp

**Ziel:** Ein navigierbarer, visuell hochwertiger Prototyp mit getrennten Demo-Daten, ohne produktive Auth oder DB.

**Auftrag an Codex:**

1. Repository prüfen; Projekt mit Next.js, TypeScript, Tailwind, shadcn/ui und Lucide initialisieren.
2. Design-Tokens, Inter, AppShell, Sidebar, Topbar, BottomNav und responsive Breakpoints implementieren.
3. Seiten Übersicht, Kalender, Aufgaben, Einkauf, Einstellungen sowie den Essensplan-Editor `/meal-plan` erstellen.
4. Vier farbige Demo-Familienprofile, realistische Demo-Termine und Widgets einbauen.
5. Wiederverwendbare UI-Komponenten (`GreetingWidget`, `CalendarGrid`, `EventCard`, `MemberAvatar`, `TasksWidget`, `ShoppingWidget`, `MealPlanWidget`) bauen.
6. Loading-, Empty- und Error-States sowie Tastaturbedienung ergänzen.
7. Keine produktive Authentifizierung vortäuschen; alle Mock-Funktionen deutlich kennzeichnen.
8. Lint, Typecheck, Build, UI-/Accessibility-Smoke-Tests durchführen.
9. README aktualisieren und Git-Commit vorschlagen.

**Akzeptanz:** Navigation funktioniert, kein horizontaler Overflow ab 360 px, Touch-Bedienung auf Tablet, Build/Tests erfolgreich, Mock-Daten klar isoliert. Essensplan zeigt sieben Abendessen im Dashboard; aktuelle und kommende Wochen sind separat editierbar, Änderungen bleiben beim internen Navigieren sichtbar und werden beim Neuladen zurückgesetzt.

### Phase 2 – Datenbank, Login und Familienverwaltung

**Ziel:** Zwei separate erwachsene Accounts, sichere Anmeldung, zwei Kinderprofile, dauerhafte Datenhaltung und Isolation.

**Auftrag an Codex:**

1. Bestehenden Code und Phase-1-Tests prüfen.
2. PostgreSQL, Prisma, Migrationen und sichere DB-Zugriffsschicht integrieren.
3. Auth.js passend zur aktuellen Version mit Credentials und Argon2id einrichten; notwendige Adapter-/Sessionmodelle ergänzen.
4. Einmaligen, abgesicherten Erst-Setup-Prozess erstellen.
5. Zweiten Erwachsenen per einmaligem, ablaufendem Einladungstoken hinzufügen.
6. Kinderprofile ohne Login anlegen; Rollen `ADMIN`, `MEMBER`, `CHILD` sauber modellieren.
7. Familienberechtigungen serverseitig für jede Aktion prüfen.
8. Authentifizierte Layouts und Einstellungen implementieren.
9. Dockerfile, Compose-Konfiguration und Secret-Handling nach Abschnitt 7 erstellen; keine öffentlichen App-/DB-Ports.
10. Tests für Auth, Sessions, Einladungen, Rollen, Datenpersistenz und familienübergreifende Zugriffssperren schreiben.
11. Dokumentation für Setup, Migration, Backup, Restore und Deployment ergänzen.

**Akzeptanz:** Zwei Erwachsene melden sich getrennt an, Kinderprofile funktionieren ohne Login, Daten überleben Neustart, Cross-Family-Zugriffe scheitern, keine Secrets in Git, Compose kann hinter dem vorgesehenen Proxy betrieben werden.

### Phase 3 – Produktiver lokaler Familienkalender

**Ziel:** Sicherer, persistenter Familienkalender mit Wiederholungen und Vorbereitung für iCloud.

**Auftrag an Codex:**

1. Vorhandenes Projekt und Migrationen prüfen.
2. Kalender-, Event-, Teilnehmer- und Wiederholungsmodelle vervollständigen.
3. `CalendarProvider` und `LocalCalendarProvider` implementieren.
4. Tages-, Wochen-, Monatsansicht und Termin-Editor bauen.
5. CRUD mit serverseitiger Autorisierung, Zod und verständlichen Fehlerzuständen implementieren.
6. Mitgliedsfilter, Kalenderfarben, Ganztag, mehrtägige Termine, Wiederholungen und Ausnahmen integrieren.
7. Sommerzeit, Zeitzonen und Serienbearbeitung umfassend testen.
8. Datenmodelle für spätere CalDAV-Synchronisation vorbereiten, aber **keine echte iCloud-Verbindung** herstellen.
9. Unit-, Integrations- und Playwright-E2E-Tests ergänzen.
10. Build, Migration, Docker-Start und Proxy-Zugriff prüfen; Einschränkungen dokumentieren.

**Akzeptanz:** Beide Erwachsenen können Termine verwalten, Kinder als Teilnehmer auswählen, Termine bleiben gespeichert, Wiederholungen funktionieren, Family-Isolation ist getestet, keine externe Kalenderabhängigkeit.

### Danach (nicht Teil der ersten drei Phasen)

4. Aufgaben/Routinen, Einkaufsliste und **Essensplan** gemäß Abschnitt 3 produktiv umsetzen; einschließlich Dashboard-Widget, Wocheneditor, Persistenz, Family-Isolation und Tests.
5. iCloud-CalDAV-Import zunächst read-only mit Sync-Worker.  
6. PWA und optional geschützter Tablet-Kiosk-Modus.  
7. Home Assistant als getrenntes Integrationsmodul.  
8. Optional KI-Assistenz, Fotos und Benachrichtigungen.

## 11. Teststrategie und Definition of Done

### Automatisierte Prüfungen

- TypeScript-Strict-Check, ESLint, Produktions-Build.
- Unit-Tests für Validierung, Kalenderwiederholungen, Berechtigungslogik.
- Integrationstests mit echter Test-PostgreSQL-Instanz für Migrationen, Relationen und Familienisolation.
- Playwright-E2E für Login, Einladung, Termin-CRUD und responsive Navigation.
- Security-Tests: unautorisierte Server Actions, fremde `familyId`, fremde Objekt-IDs, Token-Replay, abgelaufene Einladungen, Rate-Limits.
- Zeit-/Kalendertests: DST-Wechsel, Ganztag, wiederkehrende Ausnahmen, mehrtägige Events.
- Essensplan-Tests (mit Umsetzung): aktuelle/kommende Woche getrennt, Anlegen/Ändern/Entfernen, offene Tage, persistente Anzeige für beide Erwachsenen, Cross-Family-Sperren, Montag-Wochenstart, Monats-/Jahreswechsel, DST und responsive Dashboard-Anzeige.
- Docker-Checks: `docker compose config`, Healthchecks, keine DB-Portfreigabe, App hinter Proxy, Restore-Test.

### Definition of Done pro Phase

- Funktionsumfang erfüllt und nachvollziehbar dokumentiert.
- Keine offenen kritischen Sicherheitslücken.
- Lint, Typecheck, Build und relevante Tests bestanden; andernfalls exakte Fehler nennen.
- README, `.env.example`, Migrationen und ADRs aktualisiert.
- Keine Secrets, Passwörter oder privaten Familiendaten im Repository.
- Keine ungetesteten Behauptungen wie „produktionsbereit“.

## 12. Vor dem Registry-Push zu klären

Codex muss diese Angaben als Variablen erfragen oder als TODO dokumentieren, ohne sie zu erfinden:

1. Registry-Hostname (ggf. Port), Namespace/Projekt und Image-Name.
2. Unterstützt die Registry OCI-Images und Multi-Arch-Manifeste?
3. Zielarchitektur des Homelab-Hosts (`linux/amd64` oder `linux/arm64`).
4. Gewünschte SemVer-Tag-Konvention und Umgang mit `latest`.
5. Wo und wie werden Registry-Zugangsdaten für manuelle Builds bzw. CI sicher verwaltet?
6. Welche Runtime-Variablen stellt die vorhandene Compose-Umgebung bereit? Keine Compose-Datei ohne Auftrag verändern.
7. Wie werden DB-Migrationen im bestehenden Release-Prozess separat ausgeführt?
8. Soll später eine CI-Pipeline Images automatisch bauen und pushen? Ohne Freigabe nicht einrichten.

**Bereits geklärt:** Nginx läuft direkt auf dem Host; Reverse Proxy, HTTPS und produktives Docker Compose existieren und bleiben unverändert. FamilyOS muss lediglich ein kompatibles Image liefern.

## 13. Arbeitsanweisung für Codex

> Lies diese Datei vollständig und behandle sie als verbindliche Projektspezifikation. Prüfe zunächst das Repository. Erstelle einen kurzen Plan für **Phase 1** und implementiere ausschließlich diese Phase. Nutze aktuelle, kompatible stabile Versionen und dokumentiere Entscheidungen. Vermeide unnötige Abhängigkeiten. Teste Lint, Typecheck, Build und relevante UI-Funktionen. Zeige am Ende eine Zusammenfassung der Änderungen, Tests, offenen Risiken und den vorgeschlagenen nächsten Schritt. Beginne **Phase 2 erst nach ausdrücklicher Freigabe**. Keine Änderungen an bestehendem Nginx oder produktivem Docker Compose. Erstelle einen reproduzierbaren Docker-Image-Build und Registry-Push-Prozess; Registry-Werte als konfigurierbare Variablen behandeln.
