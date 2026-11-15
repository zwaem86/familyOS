# Lokaler Podman-Test

```bash
./deplopy/local-test.sh
```

Der Starter erledigt alles automatisch: App und Migrationstool bauen, ein
eigenes internes Testnetz und eine PostgreSQL-Testdatenbank starten,
Migrationen ausführen, zwei fiktive Admin-Konten und zwei Kinderprofile
anlegen und die App auf http://127.0.0.1:3000 starten. Die beiden E-Mail-
Adressen und frisch erzeugten Testpasswörter erscheinen am Ende im Terminal.
Keine Env-Datei und keine manuelle Ersteinrichtung erforderlich.

Voraussetzungen: Bash, Podman, curl und Coreutils. Kein Node/npm auf dem Host.
Secrets werden zufällig erzeugt und nur in privaten temporären Dateien zur
Laufzeit übergeben; die Dateien werden bei Erfolg, Fehler oder Abbruch entfernt.
Der Einrichtungsschlüssel wird der laufenden App nicht übergeben.

**Jeder Start ersetzt die eigene Testumgebung einschließlich ihrer Testdaten**
und erzeugt neue Passwörter. Keine privaten Informationen eingeben.
Die Fachansichten bleiben fiktive Demos. Die Testdatenbank hat keinen Hostport;
nur die App ist auf Loopback erreichbar. Nginx und produktives Compose bleiben
unverändert. Kein Registry-Push oder Deployment.

```bash
./deplopy/local-test.sh status
./deplopy/local-test.sh logs
./deplopy/local-test.sh stop
# Alternativer App-Port oder unabhängige zweite Testumgebung:
LOCAL_PORT=3100 CONTAINER_NAME=familyos-test2 ./deplopy/local-test.sh
CONTAINER_NAME=familyos-test2 ./deplopy/local-test.sh stop
```

`stop` entfernt App, DB mit ihren Testdaten und Testnetz. Lokale Images bleiben
erhalten. Bei Fehlern können eigene Testressourcen zur Diagnose bestehenbleiben;
mit demselben CONTAINER_NAME und `stop` aufräumen. Vor dem Ersetzen wird bei
App, DB und Netzwerk die Checkout-Eigentümerschaft geprüft. Fremde Ressourcen
werden abgewiesen. `logs` zeigt ausschließlich App-Logs; Strg+C beendet die Anzeige.
