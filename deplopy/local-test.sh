#!/usr/bin/env bash
# Ausschließlich fiktiver lokaler Test. Kein Registry-Push oder Deployment.
set -Eeuo pipefail
project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
action="${1:-start}"
container_name="${CONTAINER_NAME:-familyos-local-demo}"
db_name="$container_name-db"
network_name="$container_name-net"
local_port="${LOCAL_PORT:-3000}"
owner_label='io.familyos.local-demo'
temp_dir=''
log() { printf '\n[%s] %s\n' "$(date '+%H:%M:%S')" "$*"; }
fail() { printf '\nFEHLER: %s\n' "$*" >&2; exit 1; }
run() { printf '  $'; printf ' %q' "$@"; printf '\n'; "$@"; }
cleanup() { [[ -z "$temp_dir" ]] || rm -rf -- "$temp_dir"; }
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'printf "\nFEHLER in Zeile %s. Eigene Testressourcen ggf. mit CONTAINER_NAME=%q %q stop entfernen.\n" "$LINENO" "$container_name" "$project_dir/deplopy/local-test.sh" >&2' ERR
usage() {
  cat <<'HELP'
FamilyOS automatisch mit Podman testen (ausschließlich fiktive Daten).

  ./deplopy/local-test.sh [start|stop|status|logs|help]

  start   App und Migrationstool bauen, eigene Testumgebung ersetzen,
          isolierte DB starten, migrieren, vier fiktive Profile anlegen,
          App starten und prüfen. Test-Logins werden angezeigt.
  stop    Eigene App, DB samt Testdaten und Testnetz entfernen; Images bleiben.
  status  Eigene Testcontainer und App-Port anzeigen.
  logs    App-Logs verfolgen; Strg+C beendet nur die Anzeige.

Optional: LOCAL_PORT=3100 oder CONTAINER_NAME=familyos-local-demo
Voraussetzungen: Bash, Podman, curl und übliche Coreutils. Kein Host-Node/npm.
Keine Env-Datei, manuellen Secrets, DB oder Ersteinrichtung nötig.
Jeder Start setzt ausschließlich die zugehörigen fiktiven Testdaten zurück.
Nur App-Port auf 127.0.0.1; kein DB-Hostport, Registry-Push oder Deployment.
HELP
}
[[ $# -le 1 ]] || { usage; exit 1; }
case "$action" in help|--help|-h) usage; exit 0 ;; start|stop|status|logs) ;; *) usage; fail "Unbekannte Aktion: $action" ;; esac
[[ "$container_name" =~ ^[a-zA-Z0-9][a-zA-Z0-9_.-]*$ ]] || fail 'Ungültiger CONTAINER_NAME.'
[[ "$local_port" =~ ^[1-9][0-9]{3,4}$ ]] || fail 'LOCAL_PORT muss zwischen 1024 und 65535 liegen.'
(( local_port >= 1024 && local_port <= 65535 )) || fail 'LOCAL_PORT muss zwischen 1024 und 65535 liegen.'
command -v podman >/dev/null || fail 'Podman fehlt.'
podman info >/dev/null || fail 'Podman ist nicht betriebsbereit.'
exists() {
  local code=0
  podman "$1" exists "$2" || code=$?
  case "$code" in 0) return 0 ;; 1) return 1 ;; *) fail "Status von $2 konnte nicht geprüft werden (Exit $code)." ;; esac
}
check_owner() {
  local kind="$1" name="$2" label
  if [[ "$kind" == container ]]; then
    label="$(podman inspect --format '{{ index .Config.Labels "io.familyos.local-demo" }}' "$name")"
  else
    label="$(podman network inspect --format '{{ index .Labels "io.familyos.local-demo" }}' "$name")"
  fi
  [[ "$label" == "$project_dir" ]] || fail "Ressource '$name' gehört nicht zu diesem Checkout. Anderen CONTAINER_NAME verwenden."
}
preflight() {
  local name
  for name in "$container_name" "$db_name"; do
    if exists container "$name"; then check_owner container "$name"; fi
  done
  if exists network "$network_name"; then check_owner network "$network_name"; fi
}
remove_owned() {
  local name
  preflight
  for name in "$container_name" "$db_name"; do
    if exists container "$name"; then
      # Eigentümerschaft unmittelbar vor jeder Entfernung erneut prüfen.
      check_owner container "$name"
      run podman stop --time 10 "$name"
      run podman rm --volumes "$name"
    fi
  done
  if exists network "$network_name"; then
    check_owner network "$network_name"
    run podman network rm "$network_name"
  fi
}
preflight
case "$action" in
  stop) remove_owned; log 'Eigene Testumgebung entfernt. Images bleiben lokal.'; exit 0 ;;
  status)
    for name in "$container_name" "$db_name"; do
      if exists container "$name"; then run podman inspect --format 'Name: {{.Name}} | Status: {{.State.Status}} | Image: {{.ImageName}}' "$name"; else printf 'Nicht vorhanden: %s\n' "$name"; fi
    done
    if exists container "$container_name"; then run podman port "$container_name"; fi
    exit 0 ;;
  logs)
    exists container "$container_name" || fail 'Kein eigener App-Testcontainer vorhanden.'
    run podman logs --follow --tail 80 "$container_name"; exit 0 ;;
esac
command -v curl >/dev/null || fail 'curl fehlt.'
[[ -f "$project_dir/Dockerfile" && -f "$project_dir/package-lock.json" ]] || fail 'Dockerfile oder Lockfile fehlt.'
image="localhost/familyos:demo-$(date -u '+%Y%m%dT%H%M%SZ')-$$"
migration_image="$image-migrations"
url="http://127.0.0.1:$local_port"
log '1/6 – Baue App und separates Migrationstool aus dem aktuellen Arbeitsbaum.'
run podman build --format docker --pull=missing --file "$project_dir/Dockerfile" --ignorefile "$project_dir/.dockerignore" --target runtime --tag "$image" --label "org.opencontainers.image.created=$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$project_dir"
run podman build --format docker --pull=missing --file "$project_dir/Dockerfile" --ignorefile "$project_dir/.dockerignore" --target migrations --tag "$migration_image" "$project_dir"

log '2/6 – Erzeuge flüchtige Testkonfiguration und ersetze ausschließlich eigene Testressourcen.'
umask 077
temp_dir="$(mktemp -d "${TMPDIR:-/tmp}/familyos-demo.XXXXXXXX")"
# Secrets nur im privaten temporären Verzeichnis, nie in Build-Args oder Ausgabe.
secret_output="$(podman run --rm --network none --entrypoint node "$image" -e 'const {randomBytes}=require("node:crypto"); for(const n of [32,32,32,12,12]) console.log(randomBytes(n).toString("hex"))')"
mapfile -t values <<< "$secret_output"
[[ ${#values[@]} == 5 ]] || fail 'Secret-Erzeugung fehlgeschlagen.'
for i in 0 1 2; do [[ "${values[$i]}" =~ ^[a-f0-9]{64}$ ]] || fail 'Ungültiges generiertes Secret.'; done
for i in 3 4; do [[ "${values[$i]}" =~ ^[a-f0-9]{24}$ ]] || fail 'Ungültiges generiertes Testpasswort.'; done
printf 'POSTGRES_USER=familyos_demo\nPOSTGRES_DB=familyos_local_demo\nPOSTGRES_PASSWORD=%s\n' "${values[0]}" > "$temp_dir/db.env"
printf 'DATABASE_URL=postgresql://familyos_demo:%s@demo-db:5432/familyos_local_demo\n' "${values[0]}" > "$temp_dir/migrate.env"
cp "$temp_dir/migrate.env" "$temp_dir/app.env"
printf 'NEXTAUTH_URL=%s\nAUTH_SECRET=%s\n' "$url" "${values[1]}" >> "$temp_dir/app.env"
cp "$temp_dir/migrate.env" "$temp_dir/seed.env"
printf 'FAMILYOS_DEMO_SEED=fictional-local-only\nBOOTSTRAP_SECRET=%s\nDEMO_ADMIN_PASSWORD=%s\nDEMO_SECOND_PASSWORD=%s\n' "${values[2]}" "${values[3]}" "${values[4]}" >> "$temp_dir/seed.env"
unset secret_output
remove_owned
run podman network create --internal --label "$owner_label=$project_dir" "$network_name"
run podman run --detach --name "$db_name" --label "$owner_label=$project_dir" --network "$network_name" --network-alias demo-db --env-file "$temp_dir/db.env" docker.io/library/postgres:17-bookworm

log '3/6 – Warte auf die isolierte PostgreSQL-Testdatenbank und migriere sie.'
ready=false
for ((attempt=1; attempt<=30; attempt++)); do
  if podman exec "$db_name" pg_isready -h 127.0.0.1 -U familyos_demo -d familyos_local_demo >/dev/null 2>&1; then ready=true; break; fi
  sleep 1
done
[[ "$ready" == true ]] || fail 'Testdatenbank wurde nicht rechtzeitig bereit.'
run podman run --rm --network "$network_name" --env-file "$temp_dir/migrate.env" "$migration_image"
log '4/6 – Erzeuge zwei fiktive Admins und zwei Kinderprofile ohne Login.'
run podman run --rm --network "$network_name" --env-file "$temp_dir/seed.env" --entrypoint node "$migration_image" node_modules/tsx/dist/cli.mjs deplopy/seed-demo.ts

log '5/6 – Starte die App ausschließlich auf dem lokalen Loopback-Port.'
run podman run --detach --name "$container_name" --label "$owner_label=$project_dir" --network "$network_name" --env-file "$temp_dir/app.env" --publish "127.0.0.1:$local_port:3000" --security-opt no-new-privileges --cap-drop ALL "$image"
uid="$(podman exec "$container_name" id -u)"
[[ "$uid" =~ ^[0-9]+$ && "$uid" != 0 ]] || fail 'App läuft unerwartet als Root.'
healthy=false
for ((attempt=1; attempt<=30; attempt++)); do
  if curl --noproxy '*' --fail --silent --connect-timeout 1 --max-time 1 "$url/api/health/live" >/dev/null; then healthy=true; break; fi
  sleep 1
done
[[ "$healthy" == true ]] || fail 'App-Healthcheck fehlgeschlagen.'
run curl --noproxy '*' --fail --silent --show-error --max-time 10 --output /dev/null "$url/login"
run podman healthcheck run "$container_name"
log '6/6 – Fiktive Testumgebung bereit.'
cat <<READY

  Anmeldung: $url/login
  Anwendung: $url
  Einstellungen: $url/settings

  Ausschließlich fiktive Testkonten (beide Admin):
    anna@example.invalid   Passwort: ${values[3]}
    ben@example.invalid    Passwort: ${values[4]}
  Kinder: Mila und Leo (fiktiv, ohne Login).

  Einrichtung und Migrationen sind bereits erledigt.
  Jeder erneute Start erzeugt eine frische Testdatenbank und neue Passwörter.
  Keine privaten Informationen eingeben. Fachansichten bleiben Demos.
  Nur 127.0.0.1:$local_port; die Datenbank hat keinen Hostport.
  App-UID: $uid. Testcontainer laufen bis zum Stoppen im Hintergrund.
READY
printf '\nVerwaltung (bei eigenem Namen CONTAINER_NAME erneut setzen):\n'
for cmd in status logs stop; do printf '  CONTAINER_NAME=%q %q %s\n' "$container_name" "$project_dir/deplopy/local-test.sh" "$cmd"; done
