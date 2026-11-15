# FamilyOS – Handoff

Stand: 15. November 2026. Repository: `/home/zwaem/Projects/familyOS`.

## Auftrag und verbindliche Grenzen

Vor Änderungen `AGENTS.md` und die vollständige `FamilyOS_Codex_Implementierung.md` lesen. Die Master-Spezifikation ist die zentrale Produkt- und Architekturvorgabe. Ausschließlich Phase 1 ist freigegeben. Phase 2 und weitere Phasen dürfen erst nach ausdrücklicher Freigabe beginnen.

Nginx, produktives Docker Compose und Homelab-Infrastruktur nicht ändern. Kein Registry-Push oder automatischer Rollout ohne Auftrag. Der zusätzlich beauftragte Podman-Start ist ausschließlich ein lokaler Test mit Loopback-Portbindung.

## Projektstand

Phase 1 ist als navigierbarer UI-Prototyp implementiert und in Commit `6f1a0f5` (`feat: add FamilyOS phase 1 UI prototype`) enthalten. Stack: Next.js App Router, React, TypeScript Strict, Tailwind, projektverwaltete shadcn/ui-Komponenten und Lucide. Exakte Versionen stehen in `package.json` und `package-lock.json`.

Die Routen `/`, `/calendar`, `/tasks`, `/shopping` und `/settings` funktionieren responsiv. Kalenderansichten und Profilfilter sind bedienbar; Aufgaben und Einkauf lassen sich lokal ergänzen und abhaken. Lade-, Leer-, Fehler- und Erfolgszustände sind vorhanden.

Alle Daten sind fiktiv und in `src/features/dashboard/demo-data.ts` isoliert. Demo-Heute ist der 16. November 2026, Europe/Berlin. Anna, Ben, Mila und Leo sind Demo-Profile. Es gibt keine Authentifizierung, Login-Seite, Passwörter, DB oder dauerhafte Speicherung. Neuladen setzt Demo-Eingaben zurück. Ein DB-Seed und echte Testkonten sind noch nicht implementiert.

## Aktuelle, noch nicht committete Änderungen

- `deplopy/local-test.sh`: ausführbares Bash-Skript für lokalen Image-Build und Podman-Start. Der Verzeichnisname `deplopy` entspricht dem Benutzerauftrag.
- `deplopy/README.md`: Voraussetzungen, Optionen, Bedienung und tatsächliche Testergebnisse.
- `Dockerfile`: vollständig qualifizierte Node-Basis `docker.io/library/node:24-bookworm-slim` in allen Stufen, damit Podman keine interaktive Registry-Auswahl benötigt.
- `.dockerignore`: zusätzliche Ausschlüsse für Secrets, Schlüssel, Playwright-Sitzungen, Dumps und Editor-Verzeichnisse.
- `public/.gitkeep`: stellt das für den Container-Build benötigte, bisher leere Verzeichnis auch in frischen Checkouts bereit.
- `README.md`, `docs/deployment.md`, `docs/phase-1-results.md`: Anleitung und Nachtrag zum erfolgreichen Podman-Test.
- Dieses Handoff: `docs/HANDOFF.md`.

Die `.gitignore` ist bereits Teil des letzten Commits und gehört nicht zum aktuellen Änderungsdiff. Es wurden keine Dateien gestagt, kein Commit erstellt und kein Push ausgeführt.

## Lokalen Test starten

Voraussetzungen: Bash, betriebsbereites Podman und curl. Für den ersten Build ist Internetzugang erforderlich. Node/npm auf dem Host sind für das Startskript nicht nötig.

```bash
./deplopy/local-test.sh
# Alternativer Port:
LOCAL_PORT=3100 ./deplopy/local-test.sh

./deplopy/local-test.sh status
./deplopy/local-test.sh logs
./deplopy/local-test.sh stop
```

Standardadresse nach erfolgreichem Start: **http://127.0.0.1:3000**. Anmeldung ist nicht erforderlich. Ein eigener Containername lässt sich über `CONTAINER_NAME` setzen; bei Verwaltungsbefehlen denselben Namen erneut übergeben.

Das Skript baut aus dem aktuellen Arbeitsbaum inklusive uncommitteter Änderungen und erzeugt ein lokales Image mit Zeitstempel-Tag. Danach ersetzt es ausschließlich den über ein Checkout-Label zugeordneten Testcontainer. Fremde namensgleiche Container werden abgewiesen. Es veröffentlicht nur `127.0.0.1`, prüft App-UID und HTTP-Erreichbarkeit und gibt Aufrufadressen, Demo-Hinweise sowie Verwaltungsbefehle aus. Images bleiben nach dem Stoppen erhalten; es gibt kein automatisches Pruning.

**Laufzeitstatus bei Erstellung dieses Handoffs:** `familyos-local-demo` ist derzeit nicht vorhanden; Port 3000 ist nicht erreichbar. Der zuvor erfolgreiche Testlauf bedeutet nicht, dass die App aktuell läuft. Für einen neuen Test das Startskript ausführen. Im Handoff wurde kein neuer Container gestartet.

## Tatsächlich ausgeführte Prüfungen

Die Implementierung wurde in dieser Sitzung bereits geprüft; für das Handoff wurden keine vollständigen Tests erneut ausgeführt.

- Phase 1: Lint, Typecheck, Produktions-Build und vier Vitest-Tests bestanden.
- Zwölf Playwright-Tests bestanden gegen den laufenden Podman-Container bei 360, 1024 und 1440 px, einschließlich Axe-Smoke-Checks, Navigation, Kalenderfiltern, Zuständen und Demo-Aktionen.
- Zusätzliche Phase-1-Overflow-Prüfung: 50 Kombinationen aus fünf Routen und zehn Bildschirmbreiten bestanden.
- Podman 6.1.4 rootless: gemeinsamer Image-Build für linux/amd64 erfolgreich; Node 24.22.3 im Image, App-UID 1001, Host-HTTP-Smoke-Test und `podman healthcheck run` bestanden.
- Ungültiger lokaler Port und fremde Container-Eigentümerschaft wurden erwartungsgemäß abgewiesen.
- `bash -n deplopy/local-test.sh` und `git diff --check` bestanden.
- Stoppen, Log-Follow und erneutes Ersetzen wurden nicht separat end-to-end getestet.

Für erneute Projektprüfungen:

```bash
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright verwendet einen bereits erreichbaren Dienst auf Port 3000 oder startet die lokale Standalone-Ausgabe. Für eine ausdrückliche Container-Prüfung zuerst den Podman-Test starten.

## Offene Punkte und Risiken

- Image-Sicherheits-Scan und Registry-Push sind nicht ausgeführt. Trivy/Grype waren nicht installiert. Der Docker-Daemon-Zugriff scheiterte am Socket; der Podman-Build war erfolgreich.
- Registry, Namespace, Zielhardware, Zugangsdatenverwaltung und Release-Ablauf sind vor Veröffentlichung zu klären. ARM64 ist nicht verifiziert. `scripts/publish-image.sh` ist der separate Release-Weg mit verpflichtendem Scan, kein lokaler Demo-Start.
- Sieben moderate npm-Audit-Meldungen betreffen Entwicklungsabhängigkeiten im TypeScript-Lint-/minimatch-Baum. `npm audit --omit=dev` hatte keine Befunde. Der kompatible automatische Fix war nicht verfügbar.
- ESLint 9 ist nicht mehr unterstützt, bleibt wegen der deklarierten Next.js-Plugin-Kompatibilität fixiert. Siehe `docs/decisions/0001-eslint-compatibility.md`.
- Die Produktions-CSP erlaubt Inline-Bootstrap-Skripte. Nonce-CSP und alle Auth-/Family-Schutzmechanismen sind vor privaten Daten in Phase 2 zu behandeln. `unsafe-eval` ist nur im Entwicklungsmodus erlaubt.
- Basisimage-Major ist fixiert, ein Release-Digest noch nicht. Automatische Accessibility-Prüfungen ersetzen keine vollständige WCAG-Prüfung; Safari/Firefox sind nicht abgedeckt.

## Empfohlene Fortsetzung

1. Aktuellen lokalen Podman-Testweg und Dokumentation reviewen und committen.
2. Phase-1-UI durch den Benutzer abnehmen lassen; offene Image-Scan-/Release-Prüfungen bei Bedarf abschließen.
3. Nur nach ausdrücklicher Phase-2-Freigabe einen neuen Plan für PostgreSQL/Prisma, sichere Authentifizierung, Bootstrap, Einladungen und Familienisolation erstellen.

Weitere Details: `docs/phase-1-plan.md`, `docs/phase-1-results.md`, `docs/architecture.md`, `docs/deployment.md` und `deplopy/README.md`.
