#!/usr/bin/env bash
# Ausschließlich lokaler Phase-1-Test. Kein Registry-Push und kein Infrastruktur-Deployment.
set -Eeuo pipefail

project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
action="${1:-start}"
container_name="${CONTAINER_NAME:-familyos-local-demo}"
local_port="${LOCAL_PORT:-3000}"
owner_label='io.familyos.local-demo'
started_container=''

log() { printf '\n[%s] %s\n' "$(date '+%H:%M:%S')" "$*"; }
fail() { printf '\nFEHLER: %s\n' "$*" >&2; exit 1; }
run() { printf '  $'; printf ' %q' "$@"; printf '\n'; "$@"; }
on_error() {
  local code="$1" line="$2"
  trap - ERR
  printf '\nFEHLER: Schritt in Zeile %s fehlgeschlagen (Exit %s).\n' "$line" "$code" >&2
  if [[ -n "$started_container" ]]; then
    printf 'Letzte Container-Logs zur Diagnose:\n' >&2
    podman logs --tail 80 "$started_container" >&2 || true
    printf 'Der Testcontainer bleibt zur Diagnose erhalten. Aufräumen: %q stop\n' "${BASH_SOURCE[0]}" >&2
  fi
  exit "$code"
}
trap 'on_error "$?" "$LINENO"' ERR

usage() {
  cat <<'HELP'
FamilyOS lokal mit Podman testen (Phase 1, ausschließlich fiktive Daten).

  ./deplopy/local-test.sh [start|stop|status|logs|help]

  start   Image aus dem aktuellen Arbeitsbaum bauen, eigenen Testcontainer
          ersetzen, starten und HTTP-/Non-Root-Smoke-Test ausführen (Standard).
  stop    Eigenen Testcontainer stoppen und entfernen; Image bleibt erhalten.
  status  Status und tatsächliche Portzuordnung anzeigen.
  logs    Container-Logs verfolgen; Strg+C beendet nur die Log-Anzeige.

Optionale Umgebungsvariablen:
  LOCAL_PORT=3000                    Lokaler Port, erlaubt: 1024–65535
  CONTAINER_NAME=familyos-local-demo Name des eigenen Testcontainers

Beispiel: LOCAL_PORT=3100 ./deplopy/local-test.sh

Nur 127.0.0.1 wird veröffentlicht. Kein Zugriff aus dem LAN, kein Registry-Push.
Anmeldung: keine. Phase 1 hat weder Benutzerkonten noch Passwörter oder DB.
HELP
}

[[ $# -le 1 ]] || { usage; exit 1; }
case "$action" in
  help|--help|-h) usage; exit 0 ;;
  start|stop|status|logs) ;;
  *) usage; fail "Unbekannte Aktion: $action" ;;
esac
[[ "$container_name" =~ ^[a-zA-Z0-9][a-zA-Z0-9_.-]*$ ]] || fail 'Ungültiger CONTAINER_NAME.'
[[ "$local_port" =~ ^[1-9][0-9]{3,4}$ ]] || fail 'LOCAL_PORT muss eine Zahl zwischen 1024 und 65535 sein.'
(( local_port >= 1024 && local_port <= 65535 )) || fail 'LOCAL_PORT muss zwischen 1024 und 65535 liegen.'
command -v podman >/dev/null || fail 'Podman fehlt. Bitte Podman installieren und für den eigenen Benutzer einrichten.'
log 'Prüfe Podman und die lokale Container-Umgebung.'
run podman --version
podman info >/dev/null || fail 'Podman ist nicht betriebsbereit. Bitte lokale Podman-/Rootless-Einrichtung prüfen.'

container_exists() {
  local code=0
  podman container exists "$container_name" || code=$?
  case "$code" in
    0) return 0 ;;
    1) return 1 ;;
    *) fail "Container-Status konnte nicht geprüft werden (Exit $code)." ;;
  esac
}
check_owner() {
  local label
  label="$(podman inspect --format '{{ index .Config.Labels "io.familyos.local-demo" }}' "$container_name")"
  [[ "$label" == "$project_dir" ]] || fail "Container '$container_name' gehört nicht zum lokalen Test dieses Checkouts. Bitte einen anderen CONTAINER_NAME verwenden."
}

if container_exists; then
  check_owner
elif [[ "$action" != start ]]; then
  log "Kein Testcontainer '$container_name' vorhanden."
  exit 0
fi
case "$action" in
  stop)
    log "Stoppe und entferne ausschließlich den eigenen Testcontainer '$container_name'."
    run podman stop --time 10 "$container_name"
    run podman rm "$container_name"
    log 'Testcontainer entfernt. Lokale Images bleiben für weitere Tests erhalten.'
    exit 0 ;;
  status)
    run podman inspect --format 'Name: {{.Name}} | Status: {{.State.Status}} | Image: {{.ImageName}}' "$container_name"
    run podman port "$container_name"
    printf '\nAnmeldung: keine; öffentlicher Phase-1-UI-Prototyp mit fiktiven Daten.\n'
    exit 0 ;;
  logs)
    log 'Zeige Logs. Strg+C beendet nur diese Anzeige.'
    run podman logs --follow --tail 80 "$container_name"
    exit 0 ;;
esac

command -v curl >/dev/null || fail 'curl fehlt; für die HTTP-Prüfung auf dem Host erforderlich.'
[[ -f "$project_dir/Dockerfile" && -f "$project_dir/package-lock.json" ]] || fail 'Dockerfile oder npm-Lockfile fehlt.'
[[ -f "$project_dir/src/features/dashboard/demo-data.ts" ]] || fail 'Phase-1-Demo-Fixtures fehlen.'
image="localhost/familyos:demo-$(date -u '+%Y%m%dT%H%M%SZ')"
url="http://127.0.0.1:$local_port"

log '1/5 – Bereite die fiktiven Testdaten vor.'
printf '%s\n' \
  'Die vorhandenen Fixtures werden beim Image-Build eingebunden:' \
  '  src/features/dashboard/demo-data.ts' \
  '  Profile: Anna, Ben, Mila und Leo; dazu Termine, Aufgaben und Einkauf.' \
  '  Demo-Heute: Montag, 16. November 2026, Europe/Berlin.' \
  'Kein DB-Seed erforderlich: Phase 1 besitzt noch keine Datenbank.' \
  'Demo-Eingaben sind flüchtig. Neuladen setzt sie zurück.' \
  'Ein persistenter Test-Seed wird erst mit der freigegebenen DB-Phase ergänzt.'

log "2/5 – Baue das lokale Image '$image'."
printf '%s\n' \
  "Build-Kontext: $project_dir (aktueller Arbeitsbaum, auch uncommittete Änderungen)." \
  'Das bestehende Multi-Stage-Dockerfile installiert per npm ci und baut Next.js.' \
  'Beim ersten Build werden Basisimage und npm-Pakete heruntergeladen; das kann einige Minuten dauern.' \
  'Das Image bleibt lokal. Dies ist kein gescannter Registry-Release.'
# Docker-Format erhält die HEALTHCHECK-Anweisung des gemeinsamen Dockerfiles.
run podman build --format docker --pull=missing \
  --file "$project_dir/Dockerfile" --ignorefile "$project_dir/.dockerignore" \
  --tag "$image" \
  --label "org.opencontainers.image.created=$(date -u '+%Y-%m-%dT%H:%M:%SZ')" \
  --label "org.opencontainers.image.version=${image##*:}" \
  "$project_dir"

log '3/5 – Starte den lokalen Testcontainer.'
# Vor einem Ersetzen erneut Eigentümerschaft prüfen; fremde Container nie entfernen.
if container_exists; then
  check_owner
  run podman stop --time 10 "$container_name"
  run podman rm "$container_name"
fi
run podman run --detach --name "$container_name" \
  --label "$owner_label=$project_dir" \
  --publish "127.0.0.1:$local_port:3000" \
  --security-opt no-new-privileges --cap-drop ALL \
  "$image"
started_container="$container_name"

log '4/5 – Prüfe Non-Root-Betrieb und HTTP-Erreichbarkeit (maximal ca. 60 Sekunden).'
runtime_uid="$(podman exec "$container_name" id -u)"
[[ "$runtime_uid" =~ ^[0-9]+$ && "$runtime_uid" != 0 ]] || fail 'Der App-Prozess läuft unerwartet als Root.'
printf 'App-Benutzer im Container: UID %s\n' "$runtime_uid"
healthy=false
for ((attempt=1; attempt<=30; attempt++)); do
  if [[ "$(podman inspect --format '{{.State.Running}}' "$container_name")" != true ]]; then
    podman logs --tail 80 "$container_name" >&2
    fail 'Der Container wurde vorzeitig beendet.'
  fi
  if curl --noproxy '*' --fail --silent --show-error --connect-timeout 1 --max-time 1 \
    "$url/api/health/live" >/dev/null 2>&1; then
    healthy=true
    break
  fi
  printf '  Warte auf Health-Endpunkt … Versuch %s/30\n' "$attempt"
  sleep 1
done
if [[ "$healthy" != true ]]; then
  podman logs --tail 80 "$container_name" >&2
  fail "Health-Endpunkt nicht erreichbar. Logs: podman logs $container_name"
fi
run curl --noproxy '*' --fail --silent --show-error --max-time 5 "$url/api/health/live"
printf '\n'
run curl --noproxy '*' --fail --silent --show-error --max-time 10 --output /dev/null "$url/"
run podman port "$container_name"

log '5/5 – FamilyOS ist zum lokalen Test bereit.'
cat <<READY

  Anwendung:     $url
  Kalender:      $url/calendar
  Aufgaben:      $url/tasks
  Einkauf:       $url/shopping
  Einstellungen: $url/settings
  Health:        $url/api/health/live

  Anmeldung: NICHT ERFORDERLICH.
  Phase 1 hat keine Login-Seite, Benutzerkonten oder Passwörter.
  Anna, Ben, Mila und Leo sind ausschließlich fiktive Demo-Profile.
  Es wurden keine Zugangsdaten und keine Datenbank angelegt.

  Testen: Kalenderansichten/Profilfilter wechseln, Aufgaben und Artikel
  hinzufügen oder abhaken. Zum Zurücksetzen die Seite neu laden.

  Erreichbar nur auf diesem Rechner über 127.0.0.1, nicht im LAN.
  Bei einem entfernten Rechner bleibt die Adresse dort lokal;
  bei Bedarf einen eigenen SSH-Tunnel zum angegebenen Port nutzen.

  Container: $container_name
  Image:     $image
  Der Container läuft im Hintergrund weiter.
READY
printf '\nVerwaltung (bei eigenem Namen CONTAINER_NAME erneut setzen):\n'
printf '  Status:  CONTAINER_NAME=%q %q status\n' "$container_name" "$project_dir/deplopy/local-test.sh"
printf '  Logs:    CONTAINER_NAME=%q %q logs\n' "$container_name" "$project_dir/deplopy/local-test.sh"
printf '  Stoppen: CONTAINER_NAME=%q %q stop\n' "$container_name" "$project_dir/deplopy/local-test.sh"
printf '  Image bei Bedarf danach entfernen: podman rmi %q\n' "$image"
