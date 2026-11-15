# PostgreSQL Backup / Restore

Familienprofile, Passwort-Hashes, Einladungen, Sessions und Rate-Limits sind
sensible Daten. Backups verschlüsselt, zugriffsbeschränkt und außerhalb des
Repositories speichern. Datenbank und AUTH_SECRET getrennt sichern. Keine
Klartextpasswörter in Shell-Argumenten; DB-Zugang über geschützte pgpass-Datei
oder Secret-Manager bereitstellen. Retention und Offsite-Kopie betreiberseitig
festlegen; keine Homelab-Konfiguration wird hier geändert.

```bash
# CONNECTION_SERVICE verweist auf einen lokalen, geschützten pg_service-Eintrag.
pg_dump --dbname="service=$CONNECTION_SERVICE" --format=custom --no-owner \
  --file=/sicherer/pfad/familyos.dump
# In NEUE, leere und isolierte Datenbank mit passender PostgreSQL-Version:
pg_restore --dbname="service=$RESTORE_SERVICE" --no-owner --no-privileges \
  --exit-on-error /sicherer/pfad/familyos.dump
```

Vor Restore App-Zugriffe auf das Ziel sperren. Nicht über eine laufende
Datenbank restaurieren. Nach Restore Tabellen/Profilzahlen prüfen, Migrationen
mit `prisma migrate status` kontrollieren und Anmeldung beider Erwachsenen
sowie Familienisolation testen. Alle restaurierten AppSession-Zeilen löschen
und AUTH_SECRET rotieren, um alte Sessions zu widerrufen; offene Einladungen
widerrufen. Ein bereits initialisiertes Backup muss Bootstrap id=1 enthalten.

Tatsächlicher lokaler Restore-Test wird in `docs/phase-2-results.md` dokumentiert.
Ein erfolgreicher Test mit fiktiven Daten ersetzt keine regelmäßigen Restore-
Übungen und keine Sicherung der späteren produktiven Umgebung.
