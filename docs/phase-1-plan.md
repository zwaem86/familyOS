# Phase 1 – Implementierungsplan

Die vollständige `FamilyOS_Codex_Implementierung.md` Version 1.5 ist verbindlich. Ausgangszustand: leeres Repository mit README und Spezifikation. Ausschließlich Phase 1 ist freigegeben.

1. Next.js App Router, React, TypeScript Strict, Tailwind und projektverwaltete shadcn/ui-Komponenten initialisieren. Versionen mit npm-Lockfile fixieren.
2. Design-Tokens, lokal ausgelieferte Inter-Schrift, responsive AppShell, Sidebar, Topbar und BottomNav erstellen.
3. Übersicht, Kalender, Aufgaben, Einkauf und Einstellungen mit vier fiktiven Profilen implementieren. Fixtures separat halten.
4. Wiederverwendbare Widgets, Kalenderansichten und Filter sowie flüchtige Aufgaben-/Einkaufsinteraktionen ergänzen. Alle Funktionen als Demo kennzeichnen.
5. Lade-, Leer-, Fehler- und Erfolgszustände, Fokusführung, Tastaturbedienung und Touch-Ziele prüfen.
6. Standalone-Dockerfile, Health-Endpunkt und konfigurierbaren Build-/Push-Prozess liefern. Keine Infrastruktur ändern, keinen Push ausführen.
7. Lint, Typecheck, Produktions-Build, Unit- und responsive Accessibility-Smoke-Tests ausführen. Grenzen und Ergebnisse dokumentieren.

## Sicherheitsentscheidungen

- Öffentlich sichtbare UI enthält ausschließlich fiktive Daten; keine echte Authentifizierung, Sessions, Familien-APIs oder DB.
- Eingaben sind flüchtig, längenbegrenzt und werden als React-Text gerendert. Keine lokalen persistenten Speicher, keine externen Dienste.
- Kein Vertrauen in Forwarded-Header nötig: Phase 1 leitet weder Identität noch URLs daraus ab.
- CSP erlaubt Next.js-Inline-Bootstrap-Skripte; Nonce-CSP wird vor privaten Daten in Phase 2 geprüft.
- Registry, Namespace, Zielarchitektur und Release-Zugangsdaten bleiben offen. Keine produktiven Nginx-/Compose-Dateien erzeugen oder ändern.

## Stoppbedingung

Die fünf Seiten sind navigierbar, Demo-Funktionen bedienbar, Tests nachvollziehbar und Grenzen dokumentiert. Auth, Prisma, Einladungen und produktiver Kalender sind nicht Bestandteil dieser Phase. Phase 2 beginnt erst nach ausdrücklicher Freigabe.
