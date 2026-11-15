# Image-Build und Veröffentlichung

Phase 1 liefert eine öffentliche Demo ohne Auth oder persistente Daten. Keine produktiven Familieninformationen verwenden. Nginx, TLS, Firewall, vorhandene Registry und produktives Compose bleiben unverändert. Dieses Projekt führt keinen Rollout aus.

## Laufzeit

- Node.js-LTS-Basis `node:24-bookworm-slim`, Multi-Stage, Next.js standalone.
- Non-Root-UID/GID 1001; Start `node server.js`, direkt als Containerprozess für SIGTERM.
- `PORT=3000`, `HOSTNAME=0.0.0.0`, `NODE_ENV=production`, Telemetrie deaktiviert.
- `EXPOSE 3000` dokumentiert nur den internen Port. Keine Host-Portfreigabe nötig.
- `/api/health/live`: HTTP 200 mit `{"status":"ok"}`, keine DB- oder Benutzerdetails.
- Keine Runtime-Secrets, Volumes oder Migrationen in Phase 1. Logs auf stdout/stderr.
- Keine `.env`-, Git-, Test-, Backup- oder lokalen DB-Dateien im Buildkontext. Runtime erhält nur standalone, statische Assets und public.
- Node-Major ist fixiert; Patch und Basis-Layer können sich ändern. Für bitidentische Release-Rebuilds den verifizierten Basis-Digest zusätzlich pinnen und regelmäßig aktualisieren. npm-Abhängigkeiten werden per `npm ci` reproduziert.

## Lokaler Image-Test

```bash
docker build --platform linux/amd64 -t familyos:0.1.0 .
docker run --detach --name familyos-smoke --network none familyos:0.1.0
docker exec familyos-smoke id
docker exec familyos-smoke node -e "fetch('http://127.0.0.1:3000/api/health/live').then(async r=>{console.log(r.status,await r.text());if(!r.ok)process.exit(1)})"
docker stop --time 10 familyos-smoke
docker rm familyos-smoke
trivy image --severity HIGH,CRITICAL --exit-code 1 familyos:0.1.0
```

## Versionierter Build / Push

Voraussetzungen: Docker mit Buildx und Daemon-Zugriff, Git, Node/npm, Playwright Chromium und Trivy. Arbeitsbaum muss sauber und alle gewünschten Änderungen müssen committed sein. Release-Konvention: SemVer ohne `v`, zusätzlich `sha-<12-stellige-revision>`. Kein `latest`.

```bash
export REGISTRY='<echter-registry-host>'
export IMAGE_NAMESPACE='<echter-namespace>'
export IMAGE_NAME=familyos
export VERSION=0.1.0
export PLATFORMS=linux/amd64
# Optional: öffentliche Quell-URL für OCI-Label; keine privaten Zugangsdaten.
# export SOURCE_URL=https://...
./scripts/publish-image.sh build
# Interaktiver Login auf dem Build-Rechner; keine Passwörter in CLI-Argumenten.
docker login "$REGISTRY"
./scripts/publish-image.sh push
```

Das Skript validiert Variablen, führt Lint, Typecheck, Unit-, Build- und Browserprüfungen aus, baut lokal, prüft Non-Root/Health und scannt vor dem Push. Es veröffentlicht dasselbe lokale Image mit beiden Tags und gibt den Registry-Digest aus. Fehlender Scanner oder HIGH/CRITICAL-Befund bricht ab. OCI-Version, Revision und Commit-Zeit werden gesetzt, Source nur wenn bekannt. Ein teilweise fehlgeschlagener Push kann bereits einen Tag veröffentlicht haben; vor erneutem Release Registry-Zustand prüfen. Tags dürfen organisatorisch nicht überschrieben werden; Deployment bevorzugt per ausgegebenem Digest.

Aktuell nur linux/amd64 zugelassen. ARM64/Multi-Arch erst nach Verifikation nativer Abhängigkeiten und Zielhardware ergänzen. Kein Registry-Push wurde ausgeführt.

## Vor Veröffentlichung offen

Registry-Hostname/Namespace, OCI-Unterstützung, Zielarchitektur, Tag-Unveränderlichkeit, Zugangsdatenverwaltung, vorhandene Runtime-Konfiguration, separater Migrationsschritt ab Phase 2 und eventuelle spätere CI-Freigabe. Keine Werte erfinden.

Phase 2 ergänzt DATABASE_URL, Auth.js-Secret, kanonische HTTPS-URL und vertrauenswürdige Proxy-Konfiguration. Forwarded-Header dürfen dann nur vom vertrauenswürdigen Proxy akzeptiert werden. Prisma Client erst mit Prisma-Einführung generieren; `prisma migrate deploy` bleibt ein expliziter separater Release-Schritt, niemals implizit beim Containerstart.
