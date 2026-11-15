# ADR 0002: Credentials-Sessions

Status: angenommen, 15. November 2026.

Auth.js wird als stabile `next-auth` 4.24.15 eingesetzt. Die Version erklärt
Next.js 16 und React 19 als kompatible Peers. V5 ist weiterhin Vorabversion.
Die Credentials-Strategie unterstützt JWT-Sessions, keine Adapter-Sessions:
https://next-auth.js.org/configuration/providers/credentials

Benutzer und Argon2id-Hashes werden ausdrücklich durch die Anwendung in
PostgreSQL gespeichert. Auth.js stellt verschlüsselte JWT-Cookies und CSRF-
Schutz bereit. Zusätzlich enthält jedes JWT eine zufällige Session-ID;
deren Hash, Benutzer, aktive Familie und fester 12-Stunden-Ablauf liegen
in PostgreSQL. Jede geschützte Anfrage prüft diese Session und die aktuelle
Mitgliedschaft. Logout widerruft die DB-Session. Ein entwendetes altes JWT
ist danach wirkungslos. Es gibt keine OAuth-Account-/VerificationToken-
Modelle und keinen Prisma-Auth-Adapter, da diese hier nicht benötigt werden.

Die serverseitige Zugriffsschicht liest JWTs über `getToken` und die asynchronen
Next.js-Header. Sie verwendet nicht das auf synchrone Next-Header ausgelegte
v4-`getServerSession`. Die Auth-Route verwendet den App-Router-Handler.

Prisma 7.10.1 mit PostgreSQL-Treiberadapter wird fixiert; Prisma 8 ist laut
npm aktuell eine Vorabversion. Migrationen werden separat ausgeführt.

Vor privaten Profilen wird die Script-CSP auf pro Request erzeugte Nonces
umgestellt. Next.js Proxy übergibt die CSP auch an den Renderer; alle Seiten
werden dynamisch gerendert. Script-`unsafe-inline` entfällt, `unsafe-eval`
bleibt auf Entwicklung beschränkt. Style-`unsafe-inline` bleibt für bestehende
Komponenten erlaubt. Die CSP-Schicht führt keine Autorisierung durch; diese
bleibt in Session-DAL und Services. Antworten werden nicht öffentlich gecacht.
