# Phase 1 – Ergebnisse

Stand: 15. November 2026. Ausschließlich Phase 1 umgesetzt. Die zentrale Spezifikation wurde vollständig gelesen; der Plan steht in `docs/phase-1-plan.md`.

## Geliefert

- Next.js 16.4.6, React 19.3.1, TypeScript Strict, Tailwind v4, shadcn/ui-Button und Lucide; exakte Versionen und npm-Lockfile.
- Responsive AppShell mit Sidebar, Topbar, mobiler BottomNav, deutschen Texten und lokalem Inter.
- Alle fünf Routen: Übersicht, Kalender, Aufgaben, Einkauf und Einstellungen.
- Vier ausschließlich fiktive Demo-Profile; separat gehaltene Termine, Aufgaben und Einkaufsartikel.
- Alle geforderten Dashboard-Widgets und gemeinsame EventCard, MemberAvatar sowie CalendarGrid.
- Kalenderansichten Tag/Woche/Monat, Zeitraumwechsel und Profilfilter. Aufgaben/Einkauf lokal hinzufügen und abhaken; Änderungen sind flüchtig.
- Lade-, Leer-, Fehler- und Erfolgszustände inklusive bedienbarer Vorschau und Retry. Sprunglink, Fokusindikatoren, benannte Navigation und native Checkboxen.
- Standalone-Multi-Stage-Dockerfile, Non-Root-Konfiguration, Health-Endpunkt, `.dockerignore` und validierendes Build-/Push-Skript mit Scan vor Veröffentlichung.
- AGENTS.md, README, Architektur-, Release-, Backup-/Restore-Dokumentation und Kompatibilitäts-ADR.

## Tatsächlich ausgeführte Prüfungen

| Prüfung | Ergebnis |
|---|---|
| `npm ci` | Erfolgreich aus Lockfile; ESLint-9-Supportwarnung dokumentiert |
| `npm run lint` | Erfolgreich, keine Lint-Warnungen |
| `npm run typecheck` | Erfolgreich |
| `npm test` | 4 Unit-Tests bestanden: Montag/Jahreswechsel, Schaltjahr, Monatsende, DST-Datumsnavigation |
| `npm run build` | Erfolgreich; fünf UI-Routen, 404 und Health-Endpunkt generiert |
| `npm run test:e2e` | 12 Playwright-Tests bestanden: Chromium bei 360×780, 1024×768 mit Touch und 1440×1000 |
| Axe-Smoke-Checks | Keine Verstöße in den geprüften WCAG-2/2.1/2.2-A/AA-Regeln auf allen fünf Standardansichten in allen drei Projekten |
| Weitere Overflow-Prüfung | 50 Kombinationen bestanden: fünf Routen bei 360, 390, 700, 701, 768, 900, 1024, 1200, 1440 und 1920 px |
| Visuelle Prüfung | Dashboard-Screenshots bei 360 und 1440 px betrachtet; zusätzlich 1024-px-Screenshot erstellt |
| Entwicklungsserver | `npm run dev -- --port 3001` gestartet; Aufgaben-Hinzufügen im Browser erfolgreich, keine pageerror-Meldung |
| Health/Sicherheitsheader | Status 200, minimales JSON, no-store, nosniff und frame-ancestors-CSP im Browsertest geprüft |
| `npm audit --omit=dev` | Keine bekannten Schwachstellen |
| Gesamtes `npm audit` | 7 moderate Meldungen in Entwicklungsabhängigkeiten; keine automatische kompatible Behebung gefunden |
| `bash -n scripts/publish-image.sh` | Erfolgreich |
| `git diff --check` | Erfolgreich |
| Docker-Build `linux/amd64` | Blockiert: `ERROR: permission denied while trying to connect to the docker API at unix:///var/run/docker.sock` |
| Container-Start, Non-Root und Image-Scan | Nicht ausgeführt: kein Docker-Daemon-Zugriff; Trivy/Grype nicht installiert |
| Registry-Push / Proxy / Rollout | Nicht ausgeführt; Registry unbekannt, keine Infrastruktur verändert |

Die Browserprüfungen liefen gegen die echte Standalone-Ausgabe. Beim ersten Durchlauf gefundene Kontrastprobleme an Termin-Endzeiten wurden behoben. Der Fehlerzustands-Test wurde auf den Inhalt beschränkt, damit er nicht zusätzlich Next.js' Route-Ansage auswählt. Ein späterer Durchlauf zeigte einen frühen Klick vor der Kalender-Hydrierung. Die Kalendersteuerung bleibt nun bis zur Hydrierung deaktiviert; der Test prüft zudem ausdrücklich die gewählte Monatsansicht. Der vollständige abschließende Folgelauf bestand mit 12 von 12 Tests. Die Produktions-CSP wurde zusätzlich auf das Fehlen von `unsafe-eval` geprüft; nur der Entwicklungsmodus erlaubt dies für React-Debugging.

## Grenzen / offene Risiken

- Kein Nachweis eines erfolgreichen OCI-Image-Builds, Image-Starts oder Scans. Die Image-Auslieferungsakzeptanz bleibt bis zu diesen Prüfungen offen.
- ESLint 9 ist nicht mehr unterstützt; die aktuelle Next.js-Plugin-Kette deklariert noch keine vollständige ESLint-10-Kompatibilität. Siehe ADR 0001. Die sieben moderaten Entwicklungsbefunde stammen aus dem minimatch-Abhängigkeitsbaum; `npm audit fix` wurde erfolglos versucht. Keine produktiven Abhängigkeiten betroffen.
- Node 24 im Container wurde wegen des Docker-Blockers noch nicht getestet. Lokale Prüfungen liefen auf Node 26.13.0. Für Release Basis-Digest pinnen und Node-24-Container prüfen.
- Automatische Accessibility-Checks und Tastatur-Smoke-Tests sind keine vollständige WCAG-Zertifizierung. Keine Safari-/Firefox-Abdeckung bisher; Playwright nutzt hier den Ubuntu-Fallback-Build auf dem vorhandenen Linux-System.
- Statische CSP erlaubt Next.js-Inline-Bootstrap. Nonce-CSP und sämtliche Auth-/Family-Schutzmechanismen sind vor privaten Daten in Phase 2 zu behandeln.
- Wetter, Familienprofile und Termine sind fiktiv. Keine produktive Auth, DB, Einladungen, Termin-CRUD oder iCloud-Verbindung.

## Nächster Schritt

Phase 1 im Browser abnehmen. Für Image-Freigabe Docker-Zugriff und Scanner auf dem vorgesehenen Build-Rechner bereitstellen und dokumentierte Prüfungen ausführen. Registry-Angaben erst vor Veröffentlichung klären. Phase 2 ausschließlich nach ausdrücklicher Freigabe beginnen.

Vorgeschlagener Commit: `feat: add FamilyOS phase 1 UI prototype`. Kein Commit und kein Push wurden automatisch ausgeführt.

## Nachtrag: lokaler Podman-Test am 15. November 2026

Der spätere Auftrag für `deplopy/local-test.sh` ergänzt einen ausdrücklich lokalen Teststart. Der bisherige Docker-Socket-Blocker bleibt bestehen; der gemeinsame Image-Build wurde jetzt erfolgreich mit Podman 6.1.4 rootless für linux/amd64 ausgeführt. Node 24.22.3 im Image, App-UID 1001, Host-HTTP-Smoke-Test, Container-Healthcheck und alle zwölf Playwright-Tests gegen den laufenden Container bestanden. Damit sind Node-24-Container-Build und App-Start inzwischen verifiziert. Image-Scan und Registry-Publishing bleiben offen. Details und Bedienung stehen in `deplopy/README.md`.
