# Architektur – Phase 1

Modularer Monolith mit Next.js App Router und React. Route Group `(dashboard)` bündelt die gemeinsame AppShell; sie ist kein URL-Bestandteil. Features liegen unter `src/features`, gemeinsame UI unter `src/components`.

`src/features/dashboard/demo-data.ts` enthält ausschließlich deterministische, fiktive Fixtures. Domain-Typen für Profile und Demo-Termine sind getrennt. Keine DB, Authentifizierung, produktiven Server Actions oder Familien-API. `/api/health/live` liefert ausschließlich einen Prozessstatus.

Inter kommt über `@fontsource/inter` aus dem eigenen Build. Keine Google-Font-Abfrage, keine Analytik, kein externer Wetterdienst. Aufgaben und Einkauf verwenden React-Zustand; Routewechsel und Neuladen dürfen ihn zurücksetzen. Demo-Heute ist bewusst der 16. November 2026 und wird angezeigt.

Kalendernavigation nutzt ISO-Datumsschlüssel und UTC-Mittag für reine Demo-Datumsarithmetik. Anzeige erfolgt explizit in Europe/Berlin. Diese Fixtures und Hilfsfunktionen ersetzen weder das produktive UTC-/Ganztagsmodell noch die Provider-Schnittstelle aus Phase 3.

shadcn/ui wird als projektverwalteter Quellcode mit `components.json`, `cn`, CVA, Radix Slot und Button umgesetzt. Tailwind v4 verwendet den PostCSS-Adapter und CSS-Tokens; eine Tailwind-v3-Konfiguration ist nicht erforderlich. Anleitung: https://ui.shadcn.com/docs/installation/manual und https://nextjs.org/docs/app/getting-started/installation.

## Sicherheitsgrenze

Die gesamte UI ist öffentlich. Keine echten Familieninformationen eingeben. Kinderprofile sind ausdrücklich fiktiv. Vor Phase 2 sind Session-/Family-ACLs, Credentials, Bootstrap, Rate-Limits, CSRF-/Origin-Schutz, sichere Cookies und autorisierte Datenzugriffe erforderlich. Phase 1 täuscht diese Schutzfunktionen nicht vor.

CSP beschränkt Ressourcen auf die eigene Origin, verhindert Einbettung und fremde Form-Ziele. Next.js benötigt für den statischen Bootstrap aktuell Inline-Skripte; daher `script-src 'self' 'unsafe-inline'`. Dies schützt nicht vollständig vor Script-Injection und muss vor Verarbeitung privater Daten mit einer Nonce-Strategie überprüft werden. React rendert sämtliche Demo-Eingaben als Text. Nur im Entwicklungsmodus wird für React-Debugging gemäß Next.js-Dokumentation zusätzlich `unsafe-eval` erlaubt; die Produktions-CSP schließt es aus. HTTPS/HSTS bleiben Aufgabe der vorhandenen Infrastruktur.

Die Kompatibilitätsentscheidung für ESLint ist in [ADR 0001](decisions/0001-eslint-compatibility.md) dokumentiert. Installierte Versionen stehen exakt in `package.json` und `package-lock.json`. Buildumgebung: Node 26.13.0; Image: unterstützter Node-LTS-Major 24 auf Debian Bookworm slim. Der Container-Build ist separat zu verifizieren.
