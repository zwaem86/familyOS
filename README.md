# FamilyOS

„Alles, was eure Familie bewegt. An einem Ort.“

Responsiver deutscher Familien-UI-Prototyp. **Nur Phase 1:** öffentlich sichtbare, vollständig fiktive Profile und Termine. Keine Authentifizierung, Datenbank oder dauerhafte Speicherung. Bitte keine echten Familieninformationen eingeben. Phase 2 benötigt ausdrückliche Freigabe.

Zentrale Vorgabe: [FamilyOS_Codex_Implementierung.md](FamilyOS_Codex_Implementierung.md). [Plan für Phase 1](docs/phase-1-plan.md), [Architektur](docs/architecture.md), [Prüfergebnisse](docs/phase-1-results.md).

## Lokal starten

Node.js 24 LTS empfohlen, npm und kompatibler Browser erforderlich.

```bash
npm ci
npm run dev
```

http://127.0.0.1:3000 öffnen. Keine `.env`-Werte nötig. Inter und alle Assets werden lokal ausgeliefert. Demo-Heute: Montag, 16. November 2026, Europe/Berlin.

## Umfang

- Übersicht mit Begrüßung, Terminen, Aufgaben, Einkauf, Demo-Wetter, Essensplan und Schnellzugriffen.
- Kalender mit Tages-, Wochen- und Monatsansicht, Zeitnavigation und Profilfiltern; keine produktive Terminverwaltung.
- Aufgaben und Einkauf: lokal hinzufügen und abhaken. Neuladen setzt Änderungen zurück.
- Essensplan: Dashboard-Wochenübersicht und `/meal-plan` mit sieben Abendessen, Wochenwechsel und tageweisem Speichern/Entfernen. Änderungen bleiben beim Navigieren sichtbar; Neuladen setzt sie zurück. Ungespeicherte Eingaben werden beim Wochenwechsel geschützt.
- Einstellungen: vier fiktive Profile sowie Lade-, Leer-, Fehler- und Erfolgsvorschau.
- Desktop-Sidebar, mobile BottomNav, Tablet-Touch-Bedienung, Sprunglink und Fokusindikatoren.

## Prüfungen

```bash
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright startet den Produktionsserver automatisch. E2E-Smoke-Tests prüfen 360 px, 1024 px und 1440 px, alle Routen, Overflow, WCAG-Axe-Checks, Tastatur-Sprunglink, Navigation, Filter, Zustände und Demo-Interaktionen. Automatische Checks ersetzen keine vollständige manuelle WCAG-Prüfung.

## Lokaler Container-Test mit Podman

```bash
./deplopy/local-test.sh
```

Baut ein lokales Image und startet die Demo unter http://127.0.0.1:3000. Keine Anmeldung erforderlich; fiktive Demo-Daten sind enthalten. Das Skript zeigt Build-Schritte, Health-Prüfung, Aufrufadressen und Verwaltungsbefehle. [Anleitung und Optionen](deplopy/README.md).

## Image

[Build, Smoke-Test, Scan und Registry-Push](docs/deployment.md). Multi-Stage-Dockerfile, Standalone-Ausgabe, Non-Root und Health-Endpunkt sind vorbereitet. Keine Änderung an Nginx oder produktivem Compose, kein automatisches Deployment.

Registry-Werte sind bewusst nicht gesetzt. Keine Secrets als Build-Argumente verwenden. [Backup-/Restore-Status](docs/backup-restore.md).

Vorgeschlagener Commit: `feat: add FamilyOS phase 1 UI prototype`
