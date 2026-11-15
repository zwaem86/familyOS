# Backup / Restore – Phase 1

Phase 1 enthält keine persistente Datenbank und keine echten Familieninformationen. Demo-Eingaben gehen beim Neuladen verloren. Wiederherstellung erfolgt aus Git und Lockfile durch `npm ci` und erneuten Build.

Ein belastbares PostgreSQL-Backup-/Restore-Verfahren einschließlich tatsächlichem Restore-Test folgt mit der Datenbank in Phase 2. Es wurde bisher kein DB-Backup oder Restore getestet.
