# Phase 2 – Plan und Freigabe

Am 15. November 2026 durch Benutzerauftrag „beginne mit phase 2“ freigegeben.
Phase 3 und produktive Aufgaben/Einkauf/Essensplan bleiben ausgeschlossen.

1. Kernschema für Benutzer, Familien, Profile, Einladungen, Bootstrap,
   widerrufbare Sessions und persistente Rate-Limits mit PostgreSQL/Prisma.
2. Auth.js Credentials mit Argon2id, einmaliges Setup mit Betreiber-Secret,
   Einladung des zweiten Admins, Kinderprofile ohne Login.
3. Geschützte Layouts und Einstellungen; jede Aktion prüft Session und
   aktive Mitgliedschaft. Vorhandene Fachwidgets bleiben fiktive Demos.
4. Migration, lokale Test-DB, Integrations-/Browserprüfungen, Container-Build
   und Betriebs-/Backup-Anleitung. Keine Infrastrukturänderung oder Push.

## Sicherheitsentscheidungen

- Stabile Auth.js-Version `next-auth` 4.24.15 (Next 16/React 19 als Peers).
  Credentials erfordert JWT; verschlüsselte Cookies werden zusätzlich durch
  eine DB-Session mit festem Ablauf und Widerruf bei Logout abgesichert.
  Keine OAuth-Adaptermodelle ohne OAuth. Siehe ADR 0002.
- Setup nur mit mindestens 32 Zeichen langem Betreiber-Secret, konstantem
  Vergleich und transaktionalem Singleton; nach Initialisierung geschlossen.
- Einladungen: 256-Bit-Token, nur SHA-256-Hash in DB, 24 Stunden gültig,
  an E-Mail gebunden, transaktionale Einmalverwendung und höchstens zwei
  Erwachsene. Übergabe des Links erfolgt manuell, kein Maildienst.
- Aktive Familie wird ausschließlich aus der serverseitig gespeicherten
  Session gelesen. ADMIN-Aktionen prüfen Mitgliedschaft bei jedem Aufruf.
- DB-Rate-Limits pro normalisierter E-Mail und globalem Sicherheitsbudget;
  kein Vertrauen in ungeprüfte Forwarded-IP-Header.
- Kanonische NEXTAUTH_URL ist Pflicht, HTTPS außerhalb von Loopback.
  Mutationen prüfen Origin gegen diese URL; Auth.js schützt Auth-POSTs
  zusätzlich mit eigenem CSRF-Token. Keine Proxy-Konfiguration ändern.
