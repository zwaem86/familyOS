# FamilyOS – Handoff

Stand: 15. November 2026. Repository: `/home/zwaem/Projects/familyOS`.

## Verbindlicher Auftrag

Vor Änderungen `AGENTS.md` und `FamilyOS_Codex_Implementierung.md` vollständig lesen. Die Master-Spezifikation **Version 1.7** ist verbindlich. **Nur Phase 1 einschließlich Essensplan-Demo ist freigegeben und umgesetzt. Phase 2 nicht beginnen, bevor der Benutzer sie ausdrücklich freigibt.**

Nginx, produktives Docker Compose und Homelab-Infrastruktur bleiben unverändert. Kein Registry-Push, keine automatische CI oder produktiver Rollout ohne Auftrag. Der lokale Podman-Test mit Loopback-Portbindung ist ausdrücklich beauftragt.

## Implementierter Stand

Next.js App Router, React, TypeScript Strict, Tailwind, projektverwaltete shadcn/ui-Komponenten, Lucide und selbst gehostete Inter-Schrift. Versionen sind im npm-Lockfile fixiert. Responsive AppShell mit Desktop-Sidebar und mobiler BottomNav.

| Route | Funktion in Phase 1 |
|---|---|
| `/` | Dashboard mit Begrüßung, Terminen, Aufgaben, Einkauf, Demo-Wetter, Essensplan und Schnellzugriffen |
| `/calendar` | Demo-Tages-/Wochen-/Monatsansicht, Zeitraumwechsel und Profilfilter |
| `/tasks` | Demo-Aufgaben hinzufügen und abhaken |
| `/shopping` | Demo-Artikel hinzufügen und abhaken |
| `/settings` | Vier fiktive Profile und Vorschau für Lade-, Leer-, Fehler- und Erfolgszustände |
| `/meal-plan` | Abendessen für aktuelle und weitere Wochen tageweise bearbeiten |
| `/api/health/live` | Minimales JSON `{"status":"ok"}` ohne vertrauliche Daten |

**Keine Authentifizierung, Login-Seite, Passwörter, Datenbank oder produktive Familien-API.** Alle Angaben sind fiktiv. Demo-Heute ist bewusst Montag, der **16. November 2026**, Europe/Berlin. Keine echten Familieninformationen eingeben.

## Essensplan: Architektur und Verhalten

Die zuletzt beauftragte Erweiterung ist vollständig als Phase-1-Demo implementiert:

- Dashboard: sieben Tage Montag bis Sonntag mit Datum und Gericht; heutiger Tag und heutiges Abendessen hervorgehoben, fehlende Einträge als „Noch offen“.
- `/meal-plan?week=next` öffnet die kommende Woche. „Diese Woche“, „Nächste Woche“ und Pfeile ermöglichen weitere Wochenwechsel.
- Jeder Tag wird bewusst einzeln gespeichert. Gerichtsnamen werden getrimmt und auf maximal 120 Zeichen geprüft. Leeres Feld speichern entfernt den Eintrag. Fehler erhalten den Entwurf.
- Ungespeicherte Entwürfe liegen getrennt vom gespeicherten Demo-Stand. Beim Wochenwechsel wird vor Verwerfen nachgefragt; vor Neuladen mit offenen Entwürfen greift die Browserwarnung. Der eigene Link „Zur Übersicht“ fragt ebenfalls nach. Andere AppShell-Links und Browser-Zurück haben keine gesonderte SPA-Entwurfsabfrage.
- `DemoMealProvider` im Dashboard-Layout hält ausschließlich React-Zustand. Gespeicherte Gerichte bleiben beim internen Navigieren zwischen Dashboard und Editor erhalten. **Neuladen setzt alles auf die Fixtures zurück.** Kein localStorage oder sessionStorage.
- Die Mobile-BottomNav behält fünf Einträge. Den Essensplan erreicht man über das Dashboard; die Topbar benennt die neue Route.
- Keine neuen Abhängigkeiten, Rezepte, KI, Einkaufslisten-Automatik oder Kalenderverknüpfung.

Wichtige Dateien:

| Pfad | Verantwortung |
|---|---|
| `src/features/dashboard/demo-data.ts` | Fiktive Profile, Termine, Aufgaben, Einkauf und fixes Demo-Datum |
| `src/features/meal-plan/demo-data.ts` | Fiktive Abendessen nach lokalem ISO-Datumsschlüssel |
| `src/features/meal-plan/demo-meal-provider.tsx` | Gemeinsamer flüchtiger Zustand und Hydrierungsbereitschaft |
| `src/features/meal-plan/meal-plan.ts` | Eingabevalidierung und Beschriftung des Wochenbereichs |
| `src/features/meal-plan/meal-plan-widget.tsx` | Dashboard-Wochenübersicht |
| `src/features/meal-plan/meal-plan-editor.tsx` | Editor, Entwürfe, Speichern, Fehler und Wochenwechsel |
| `src/features/calendar/demo-calendar.ts` | Wiederverwendete Datumsarithmetik und deutsche Datumsanzeige |
| `src/app/(dashboard)/meal-plan/page.tsx` | Route mit Suspense-Ladezustand für `useSearchParams` |
| `tests/unit/meal-plan.test.ts` | Validierung und Wochengrenzen |
| `tests/e2e/meal-plan.spec.ts` | Editor-/Dashboard-Zusammenspiel und Fehler-/Entwurfsverhalten |

Die spätere persistente Umsetzung mit `MealPlanEntry`, lokalem SQL-DATE je Familie und Family-ACLs bleibt **Phase 4** nach dem produktiven Kalender zugeordnet. Das Modell ist spezifiziert, aber noch nicht als Prisma-Schema oder Migration implementiert.

## Git-Stand bei Übergabe

Letzter Commit: `fe2b2ad` (`add local Podman demo workflow & Handoff`). Die ursprüngliche UI ist in `6f1a0f5` enthalten.

**Die Essensplan-Erweiterung ist noch nicht committet.** Zum aktuellen Arbeitsbaum gehören:

- Neue Route `src/app/(dashboard)/meal-plan/` und neues Feature `src/features/meal-plan/`.
- Neue Tests `tests/unit/meal-plan.test.ts` und `tests/e2e/meal-plan.spec.ts` sowie Erweiterung der bestehenden Routenprüfung.
- Änderungen an Dashboard-Layout, Dashboard-Seite, AppShell-Topbar und globalen Styles.
- Spezifikation v1.7, README, Architektur, Phase-1-Plan, Prüfergebnisse und dieses Handoff.
- Ergänzte Demo-Daten-/URL-Ausgabe in `deplopy/local-test.sh` und aktualisierte lokale Anleitung.

Vor dem nächsten Commit `git status` einschließlich unversionierter Dateien prüfen. Für dieses Handoff wurden weder Dateien gestagt noch ein Commit oder Push ausgeführt.

## Lokal starten

```bash
# Entwicklung mit Node.js 24 LTS empfohlen:
npm ci
npm run dev

# Alternativ Image bauen und mit Podman starten:
./deplopy/local-test.sh
# Bei belegtem Port:
LOCAL_PORT=3100 ./deplopy/local-test.sh
```

Nach erfolgreichem Standardstart: **http://127.0.0.1:3000**, Editor **http://127.0.0.1:3000/meal-plan**. **Anmeldung nicht erforderlich.**

Podman-Skript: Bash, Podman und curl erforderlich; kein Host-Node/npm nötig. Es baut das vorhandene Multi-Stage-Dockerfile aus dem aktuellen Arbeitsbaum einschließlich uncommitteter Änderungen. Das lokale Zeitstempel-Image bleibt lokal. Nur der per Checkout-Label zugeordnete Testcontainer wird ersetzt; namensgleiche fremde Container werden abgewiesen. Bindung ausschließlich an `127.0.0.1`. Non-Root-UID und Host-HTTP-Erreichbarkeit werden geprüft. Ausgaben enthalten Schritte, URLs und Verwaltungsbefehle.

```bash
./deplopy/local-test.sh status
./deplopy/local-test.sh logs
./deplopy/local-test.sh stop
```

Standardname: `familyos-local-demo`. Bei eigenem `CONTAINER_NAME` diesen auch für Verwaltungsbefehle setzen. Stoppen entfernt den Container, nicht Images. Kein automatisches Pruning.

**Bei diesem Handoff aktuell geprüft:** kein Podman-Container vorhanden; auf Port 3000 ist die App nicht erreichbar. Die temporäre Standalone-Vorschau wurde nach der visuellen Prüfung beendet. Es wurde für dieses Handoff kein Dienst gestartet.

## Verifikation und ihre Grenzen

Die folgenden Ergebnisse stammen aus den tatsächlichen vorherigen Implementierungsläufen. Für dieses reine Handoff wurden die vollständigen Tests nicht wiederholt.

| Prüfstand | Ergebnis |
|---|---|
| Aktuelle Essensplan-Erweiterung | Lint, Typecheck und Produktions-Build bestanden |
| Unit-Tests | 10 bestanden: Kalendernavigation, Essensplanvalidierung, Jahreswechsel und DST-Wochengrenzen |
| Browser | 18 Playwright-Tests bestanden gegen die lokale Standalone-Ausgabe bei 360, 1024 und 1440 px |
| Browser-Abdeckung | Sechs Routen, Axe-Smoke-Checks einschließlich Validierungsfehlerzustand, Navigation, Speichern/Entfernen, getrennte Wochen, Dashboard-Abgleich, Reset nach Neuladen, Entwürfe verwerfen/erhalten und leere Wochen |
| Zusätzlicher Overflow-Test | 20 Kombinationen aus Dashboard/Editor und zehn Breiten von 360 bis 1920 px bestanden; auch 120 Zeichen ohne Leerzeichen auf mobilem Dashboard geprüft |
| Visuelle Prüfung | Desktop-Dashboard bei 1440 px und Mobil-Editor bei 360 px anhand von Screenshots betrachtet |
| Podman vor Essensplan-Erweiterung | Build linux/amd64, Start, App-UID 1001, Node 24.22.3, Host-HTTP-Test, Container-Healthcheck und damalige 12 Browsertests bestanden; Podman 6.1.4 rootless |
| Aktuelles Podman-Image mit Essensplan | Noch nicht gebaut/getestet; Startskript für Neubau ausführen |
| Skript | `bash -n` bestanden; ungültiger Port und fremde Eigentümerschaft abgewiesen; Stoppen/Log-Follow/erneutes Ersetzen nicht separat end-to-end getestet |

Erneute Prüfungen:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
bash -n deplopy/local-test.sh
git diff --check
```

Playwright verwendet außerhalb von CI einen bereits erreichbaren Dienst auf Port 3000 oder startet die lokale Standalone-Ausgabe. Vor einer Prüfung sicherstellen, dass dort die gewünschte Version läuft. Für Containerprüfungen erst das aktuelle Podman-Image bauen/starten.

## Offene Punkte

- Keine produktive Auth, DB, Einladungen oder Family-Isolation. Die öffentliche Demo darf keine privaten Daten enthalten.
- Image-Sicherheits-Scan und Registry-Push wurden nicht ausgeführt. Trivy/Grype waren nicht installiert. Docker-Daemon-Zugriff scheiterte am Socket; Podman funktionierte.
- Registry/Namespace, Zielarchitektur, Zugangsdatenverwaltung, unveränderliche Tags und Release-Ablauf vor Veröffentlichung klären. ARM64 ist nicht geprüft. Basisimage auf Node-Major 24 fixiert, Release-Digest noch nicht gepinnt.
- `scripts/publish-image.sh` ist der getrennte Release-Weg mit Tests und verpflichtendem Scan. Der lokale Demo-Start ersetzt keine Release-Freigabe.
- Letzter npm-Audit-Stand: sieben moderate Befunde in Entwicklungsabhängigkeiten des TypeScript-Lint-/minimatch-Baums; produktive Abhängigkeiten ohne Befunde. Nicht für dieses Handoff neu abgefragt.
- ESLint 9 ist nicht mehr unterstützt; kompatible Plugin-Kette und Upgrade-Grenze sind in ADR 0001 dokumentiert.
- Produktions-CSP erlaubt Next.js-Inline-Bootstrap; `unsafe-eval` nur in Entwicklung. Nonce-CSP und alle Auth-/Family-Schutzmaßnahmen vor privaten Daten prüfen.
- Automatische Accessibility-Checks sind keine vollständige WCAG-Zertifizierung. Safari/Firefox bisher nicht geprüft.

## Nächste Schritte

1. Essensplan-Demo im Browser abnehmen und aktuellen Änderungsstand reviewen/committen.
2. Bei Bedarf mit `./deplopy/local-test.sh` ein aktuelles Testimage einschließlich Essensplan bauen und verifizieren; Image-Scan vor Release nachholen.
3. **Auf ausdrückliche Freigabe für Phase 2 warten.** Erst dann Repository/Tests prüfen und einen Plan für PostgreSQL/Prisma, sichere Anmeldung, Bootstrap, Einladungen und Familienisolation erstellen. Produktiver Kalender folgt in Phase 3, persistenter Essensplan in Phase 4.

Weiterführend: `FamilyOS_Codex_Implementierung.md`, `docs/phase-1-plan.md`, `docs/phase-1-results.md`, `docs/architecture.md`, `docs/deployment.md`, `docs/decisions/0001-eslint-compatibility.md` und `deplopy/README.md`.
