# Lokaler Podman-Test

Aus dem Repository starten:

```bash
./deplopy/local-test.sh
```

Das Skript funktioniert auch von einem anderen Arbeitsverzeichnis aus. Voraussetzungen: Bash, betriebsbereites Podman (bevorzugt rootless), curl und Internetzugang für den ersten Image-Build. Node/npm auf dem Host sind für das Skript nicht erforderlich.

Es baut das bestehende Multi-Stage-Dockerfile mit einem lokalen Zeitstempel-Tag, startet `familyos-local-demo` im Hintergrund und prüft Non-Root-Betrieb, Health-Endpunkt sowie HTTP-Erreichbarkeit der Übersicht. Build-Ausgaben und ausgeführte Befehle bleiben sichtbar. Der erste Build kann einige Minuten dauern. Uncommittete Änderungen werden bewusst mitgebaut; dies ist ein lokaler Test und kein Registry-Release oder Sicherheitsscan.

Nach erfolgreichem Start: **http://127.0.0.1:3000**.

**Anmeldung: keine.** Phase 1 hat keine Login-Seite, Konten oder Passwörter. Die vier Profile Anna, Ben, Mila und Leo sind fiktiv. Kalender, Aufgaben und Einkauf werden aus `src/features/dashboard/demo-data.ts` eingebunden. Fiktive Abendessen kommen zusätzlich aus `src/features/meal-plan/demo-data.ts`; sie erscheinen im Dashboard und unter `/meal-plan`. Ein zusätzlicher DB-Seed ist ohne Datenbank nicht nötig. Ein persistenter Seed und echte Testkonten werden erst mit der ausdrücklich freigegebenen Phase 2 ergänzt.

Demo-Aufgaben und Einkaufsartikel lassen sich lokal hinzufügen und abhaken. Kalenderansichten und Profilfilter sind bedienbar. Neuladen setzt Eingaben zurück. Bitte keine echten Familieninformationen eingeben.

## Port und Verwaltung

```bash
# Falls Port 3000 belegt ist:
LOCAL_PORT=3100 ./deplopy/local-test.sh

./deplopy/local-test.sh status
./deplopy/local-test.sh logs
./deplopy/local-test.sh stop
./deplopy/local-test.sh --help
```

Ein erneuter Start baut zuerst das neue Image und ersetzt danach ausschließlich den mit diesem Checkout markierten Testcontainer. Bei einem fremden Container unter demselben Namen bricht das Skript ab. Vorhandene andere Container werden nicht angefasst. Eigener Name bei Bedarf:

```bash
CONTAINER_NAME=familyos-mein-test LOCAL_PORT=3100 ./deplopy/local-test.sh
CONTAINER_NAME=familyos-mein-test ./deplopy/local-test.sh stop
```

Nur `127.0.0.1` wird veröffentlicht. Der Dienst ist weder im LAN noch öffentlich erreichbar. Läuft Podman auf einem entfernten Rechner, lässt sich der Port bei Bedarf durch einen selbst eingerichteten SSH-Tunnel erreichen. Nginx, produktives Compose, Firewall und Registry bleiben unverändert.

Stoppen entfernt den Testcontainer, nicht die gebauten Images. Das Skript gibt nach dem Start den genauen Image-Namen sowie den passenden `podman rmi`-Befehl aus. Alte Images werden nicht automatisch gelöscht.

## Technische Hinweise

- Podman verwendet dasselbe Dockerfile und explizit die vorhandene `.dockerignore`.
- Die Node-Basis ist vollständig als `docker.io/library/node:24-bookworm-slim` benannt; so entsteht keine interaktive Short-Name-Registry-Abfrage.
- `--format docker` erhält den `HEALTHCHECK` aus dem gemeinsamen Dockerfile; zusätzlich prüft das Skript HTTP vom Host.
- Keine Host-Verzeichnisse oder Secrets werden in den Container gemountet, keine Datenbank oder Volumes angelegt.
- Der laufende App-Prozess verwendet die im Dockerfile konfigurierte UID 1001, ohne Linux-Capabilities und ohne neue Privilegien.
- Der normale Registry-Release bleibt separat in `scripts/publish-image.sh` mit Tests und Scanner. Ein erfolgreicher lokaler Test ersetzt diesen Release-Prozess nicht.

Referenz: [Podman build](https://docs.podman.io/en/stable/markdown/podman-build.1.html).

## Verifikation am 15. November 2026

Mit Podman 6.1.4 rootless tatsächlich ausgeführt: Image-Build für linux/amd64, Start auf 127.0.0.1:3000, App-UID 1001, Node 24.22.3, Host-HTTP-Smoke-Test und `podman healthcheck run`. Alle zwölf vorhandenen Playwright-Tests bestanden gegen den laufenden Podman-Container (360, 1024 und 1440 px, einschließlich Axe-Checks und Demo-Aktionen). Ungültiger Port und fremde Container-Eigentümerschaft wurden erwartungsgemäß abgewiesen. `bash -n` und `git diff --check` bestanden. Kein Registry-Push und kein Image-Sicherheits-Scan ausgeführt.
