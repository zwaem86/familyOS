# Architektur – Phase 2

Modularer Monolith mit Next.js App Router, React, TypeScript Strict und
PostgreSQL/Prisma. `(dashboard)` besitzt ein authentifiziertes dynamisches
Layout. Jede Familienaktion prüft zusätzlich selbst die Session; das Layout
ist kein Ersatz für Endpunktautorisierung.

## Sicherheits- und Datenpfad

`/api/auth/[...nextauth]` verwendet Auth.js Credentials und Argon2id. Die
kanonische Runtime-Origin wird explizit validiert. Auth-POSTs benötigen korrekte
Origin und Auth.js-CSRF-Token. Server Actions prüfen ebenfalls Origin und
verwenden Zod an jeder Eingabegrenze.

`src/lib/auth/session.ts` liest das verschlüsselte JWT aus dem HttpOnly-Cookie,
prüft die gehashte Session-ID in PostgreSQL, den festen Ablauf und die aktuelle
Erwachsenen-Mitgliedschaft. Aktive Familie kommt ausschließlich aus dieser
DB-Session. `src/features/family/server/service.ts` prüft jede Familienoperation
mit serverseitigem Principal; Abfragen und Updates werden mit familyId begrenzt.
Familienobjekte geben keine Passwort-Hashes oder Einladungs-Hashes an Clients aus.

`prisma/schema.prisma` enthält nur Phase-2-Kernmodelle, keine Kalender- oder
Essensplanmodelle. SQL-Checks koppeln Rollen, Profiltypen und User-Zuordnung.
Setup erstellt Bootstrap-Singleton, ersten User und Familie atomar. Einladungen,
Annahme und Kinderkapazität werden unter Family-Zeilensperre serialisiert.
Einladungen sind E-Mail-gebunden, gehasht, kurzlebig und nur einmal einlösbar.
Zwei Erwachsene sind ADMIN; zwei Kinder haben keinen User und keinen Login.

Datenbankgestützte Login-Limits werden zwischen Instanzen geteilt und überleben
Neustarts. Ungeprüfte Forwarded-Header beeinflussen weder Family-ACLs noch Limits.
Logout löscht die serverseitige Session, sodass kopierte Cookies unwirksam werden.
Siehe [ADR 0002](decisions/0002-credentials-sessions.md).

## Rendering und CSP

Next.js `src/proxy.ts` erzeugt pro Anfrage eine zufällige Script-Nonce und reicht
die CSP an Renderer und Browser weiter. Alle Seiten sind dynamisch. Script-
`unsafe-inline` entfällt; `unsafe-eval` gilt nur in Entwicklung. Inline-Styles
bleiben für bestehende Komponenten erlaubt. Antworten sind private/no-store.
CSP ist keine Autorisierung. HTTPS/HSTS und der vertrauenswürdige Reverse Proxy
bleiben Aufgabe der bestehenden Infrastruktur.

## Isolierte Demos

`src/features/dashboard/demo-data.ts` und `src/features/meal-plan/demo-data.ts`
enthalten ausschließlich fiktive Fixtures. Fachansichten zeigen bewusst den
16. November 2026. Kalender, Aufgaben, Einkauf, Wetter und Essensplan sind
weiterhin ohne produktive API oder DB-Persistenz. Profile in Einstellungen
werden getrennt davon aus autorisierten DB-Abfragen geladen.

`DemoMealProvider` hält gespeicherte Demo-Gerichte flüchtig im React-Zustand;
Navigation zwischen Dashboard und Editor erhält sie, Neuladen setzt sie zurück.
Datumsschlüssel und Wochenarithmetik werden weiterverwendet. SQL-DATE-Einträge,
produktive CalendarProvider und Wiederholungen bleiben späteren Phasen vorbehalten.

## Betrieb

PrismaPg-Treiberadapter, lazy DB-Client und Standalone-Ausgabe erlauben Builds
ohne Runtime-Secrets oder DB-Zugriff. Migrationen liegen versioniert unter
`prisma/migrations` und laufen separat vor dem Start. Das Runtime-Image enthält
nur Standalone-Artefakte, statische Assets und public. Kein Seed mit echten Daten.
Inter ist selbst gehostet; kein Wetter-, Mail- oder Analytikdienst.

Abhängigkeiten sind exakt per Lockfile fixiert. ESLint-Kompatibilität bleibt
in [ADR 0001](decisions/0001-eslint-compatibility.md) dokumentiert. Tests und
Betriebsgrenzen stehen in den Phase-2-Ergebnissen und der Betriebsanleitung.
