# Phase 2 lokal und im bestehenden Betrieb

Kein Deployment und keine Änderung an produktivem Compose oder Nginx.
Node 24 LTS, PostgreSQL 17 (lokal getestet), npm-Lockfile verwenden.

## Runtime-Konfiguration

`.env.example` nach `.env.local` kopieren. `DATABASE_URL` auf eine eigene
PostgreSQL-Datenbank setzen. Produktionsverbindungen benötigen einen
vertrauenswürdigen DB-Endpunkt und angemessene TLS-/Netzwerkabsicherung.
`AUTH_SECRET` und `BOOTSTRAP_SECRET` jeweils separat mit
`openssl rand -hex 32` erzeugen. Nicht in Git, Logs oder Build-Argumenten
ablegen. `NEXTAUTH_URL` ist die kanonische öffentliche HTTPS-Origin ohne
Pfad; HTTP wird nur für Loopback-Tests akzeptiert. Cookies sind HttpOnly,
SameSite=Lax und bei HTTPS Secure. Sessions enden spätestens nach 12 Stunden.

Vorhandener vertrauenswürdiger Reverse Proxy muss direkte untrusted Zugriffe
auf den internen App-Port verhindern. Die App verwendet keine Forwarded-IP
für Rechte oder Limits und prüft bei Mutationen die kanonische Origin.
Es werden keine öffentlichen Ports oder Proxy-Konfigurationen angelegt.

## Migration und Start

```bash
npm ci
npm run db:generate
# Prisma CLI lädt .env, NICHT automatisch .env.local.
# DATABASE_URL aus dem Secret-Manager in die Prozessumgebung exportieren.
npm run db:migrate
npm run build
npm run start
```

Migrationen sind ein expliziter Schritt vor App-Start. Keine automatische
Migration im Container-Entrypoint. Für ein neues Schema zuerst Backup erstellen.
Rollback der ersten Migration ist nur bei leerer, entbehrlicher Testdatenbank
über Neuanlage zulässig; produktive Daten niemals automatisch löschen.
Die bisherige App-Version ohne DB kann wieder gestartet werden, ohne die
neuen Tabellen zu entfernen. Danach gespeicherte Profile sind dort nicht sichtbar.

`/setup`: Betreiber-Schlüssel, Familienname und erster eigener Account.
Nach Erfolg `BOOTSTRAP_SECRET` aus der Laufzeitkonfiguration entfernen.
Der DB-Singleton sperrt jede weitere Initialisierung auch bei parallelen Aufrufen.
Unter `/settings` zweiten Erwachsenen einladen und zwei Kinderprofile anlegen.
Einladungslink vertraulich manuell weitergeben; er enthält das Token im Fragment
und wird beim Öffnen aus der Adresszeile entfernt. Keine E-Mail-Zustellung.
Ein neuer Link widerruft alte Einladungen; Ablauf nach 24 Stunden.
Kinder erhalten keine User-Datensätze und keine Loginmöglichkeit.

## Lokale Tests (ausschließlich fiktive Daten)

```bash
podman run -d --name familyos-phase2-test-db \
  -p 127.0.0.1:55432:5432 \
  -e POSTGRES_USER=familyos_test \
  -e POSTGRES_PASSWORD=fictional_local_test_only \
  -e POSTGRES_DB=familyos_test docker.io/library/postgres:17-bookworm
npm run build
./scripts/test-phase2.sh
```

Der Testlauf löscht Daten ausschließlich in der dafür vorgesehenen
`familyos_test`-DB. Niemals echte Daten dort eingeben. Playwright startet einen
eigenen Standalone-Server, verwendet fiktive Accounts und speichert temporäre
Session-Cookies unter dem gitignorierten `playwright/.auth/`. Nach Prüfung
Testcontainer mit `podman stop familyos-phase2-test-db` stoppen. Für dauerhafte
lokale Entwicklung eine eigene DB mit Volume und eigenen Secrets verwenden.

Für den interaktiven lokalen Container-Test genügt:

```bash
./deplopy/local-test.sh
```

Der Starter baut App und Migrationstool, erzeugt interne Test-DB und Testnetz,
zufällige Secrets sowie zwei fiktive Admin-Konten mit zwei Kinderprofilen.
Er führt Migration und Einrichtung selbst aus und zeigt die Test-Logins an.
Keine manuelle Env-Datei oder DB-Vorbereitung nötig. Nur der App-Port wird
auf 127.0.0.1 veröffentlicht, kein DB-Port. Temporäre Secret-Dateien werden
bei Ende/Abbruch entfernt, der Bootstrap-Schlüssel fehlt im App-Container.
Jeder erneute Start ersetzt ausschließlich diese eigene fiktive Testumgebung
und erzeugt neue Passwörter. `./deplopy/local-test.sh stop` entfernt App, DB,
Testdaten und Netz; Images bleiben lokal. Einzelheiten: `deplopy/README.md`.

## Wartung und Grenzen

Rate-Limits: acht Versuche pro E-Mail und 100 global pro 15-Minuten-Fenster;
Setup fünf Versuche je Fenster. Limits bleiben über Neustarts erhalten. Der
globale Schutz kann bei Angriffen auch legitime Logins vorübergehend sperren.
Keine ungeprüften Proxy-IPs als vermeintlich belastbare Identität verwenden.
Abgelaufene RateLimit-/AppSession-/Invitation-Zeilen können regelmäßig durch
einen separaten vertrauenswürdigen Wartungsjob gelöscht werden; kein öffentlicher
Cleanup-Endpunkt. Kein Passwort-Reset, MFA, Kontolöschen oder Familienwechsel
in dieser Phase. MEMBER ist modelliert und darf keine Admin-Aktionen ausführen;
beide per Setup/Einladung angelegten Erwachsenen sind gleichberechtigte ADMINs.

Kalender, Aufgaben, Einkauf, Wetter und Essen bleiben isolierte fiktive Demos.
Keine Kalender-/Essensplanmigrationen, kein Phase-3-Code und kein Registry-Push.

## Isoliertes Compose-Beispiel

`compose.local.yaml` ist ein separates lokales Beispiel ohne App- oder
DB-Hostports. Es wird nicht in produktive Infrastruktur eingebunden. Alle
Secrets müssen aus einer geschützten Runtime-Umgebung kommen; DATABASE_URL
verwendet hier den DB-Host `db` und dasselbe Passwort wie LOCAL_DB_PASSWORD.
Migrationen sind ein eigener expliziter Tool-Container:

```bash
docker compose -p familyos-local -f compose.local.yaml config --quiet
docker compose -p familyos-local -f compose.local.yaml up -d db
docker compose -p familyos-local -f compose.local.yaml --profile tools run --rm migrate
docker compose -p familyos-local -f compose.local.yaml up -d app
```

Das interne Netz veröffentlicht keine Ports. Für lokale Browsertests den
Loopback-Starter oder den Node-Standalone-Server verwenden. Das optionale
Docker-Buildziel `migrations` enthält CLI-Werkzeuge; das Standardziel `runtime`
enthält weiterhin nur die App. Keine automatische Migration oder Rollout.

Der Host-Befehl `npm run start` bindet ausschließlich `127.0.0.1`; das
Container-Entrypoint verwendet weiterhin den internen Container-Host
`0.0.0.0` ohne eigenständige Portveröffentlichung.
