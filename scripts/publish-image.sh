#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mode="${1:-}"
if [[ "$mode" != build && "$mode" != push ]]; then echo 'Usage: scripts/publish-image.sh build|push' >&2; exit 1; fi
for tool in docker git node; do command -v "$tool" >/dev/null || { echo "Missing tool: $tool" >&2; exit 1; }; done
docker buildx version >/dev/null
: "${REGISTRY:?Set REGISTRY to your existing registry hostname}"
: "${IMAGE_NAMESPACE:?Set IMAGE_NAMESPACE}"
: "${VERSION:?Set VERSION to SemVer without v prefix}"
IMAGE_NAME="${IMAGE_NAME:-familyos}"
PLATFORMS="${PLATFORMS:-linux/amd64}"
[[ "$REGISTRY" =~ ^[a-z0-9]([a-z0-9.-]*[a-z0-9])?(:[0-9]+)?$ && "$REGISTRY" != *example.invalid* ]] || { echo 'Invalid registry hostname' >&2; exit 1; }
[[ "$IMAGE_NAMESPACE" =~ ^[a-z0-9]+([._-][a-z0-9]+)*(/[a-z0-9]+([._-][a-z0-9]+)*)*$ && "$IMAGE_NAME" =~ ^[a-z0-9]+([._-][a-z0-9]+)*$ ]] || { echo 'Invalid image namespace/name' >&2; exit 1; }
[[ "$VERSION" =~ ^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$ && ${#VERSION} -le 128 ]] || { echo 'Invalid SemVer Docker tag' >&2; exit 1; }
[[ "$PLATFORMS" == linux/amd64 ]] || { echo 'Only verified target configuration linux/amd64 is currently supported; validate others before adding.' >&2; exit 1; }
[[ -z "$(git status --porcelain)" ]] || { echo 'Commit or remove uncommitted changes before an image release.' >&2; exit 1; }
revision="$(git rev-parse HEAD)"
short_revision="$(git rev-parse --short=12 HEAD)"
created="$(git show -s --format=%cI HEAD)"
image="$REGISTRY/$IMAGE_NAMESPACE/$IMAGE_NAME"
args=(--platform "$PLATFORMS" --tag "$image:$VERSION" --tag "$image:sha-$short_revision" --label "org.opencontainers.image.revision=$revision" --label "org.opencontainers.image.version=$VERSION" --label "org.opencontainers.image.created=$created")
if [[ -n "${SOURCE_URL:-}" ]]; then args+=(--label "org.opencontainers.image.source=$SOURCE_URL"); fi
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
# Build locally first, smoke-test and scan the identical image before publishing.
docker buildx build "${args[@]}" --load .
container="$(docker run --detach --network none "$image:$VERSION")"
trap 'docker rm -f "$container" >/dev/null 2>&1 || true' EXIT
[[ "$(docker exec "$container" id -u)" != 0 ]]
healthy=false
for ((attempt=0;attempt<30;attempt++)); do
  if docker exec "$container" node -e "fetch('http://127.0.0.1:3000/api/health/live').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"; then healthy=true; break; fi
  sleep 1
done
[[ "$healthy" == true ]] || { docker logs "$container"; exit 1; }
command -v trivy >/dev/null || { echo 'Install Trivy to complete the mandatory image scan.' >&2; exit 1; }
trivy image --exit-code 1 --severity HIGH,CRITICAL "$image:$VERSION"
if [[ "$mode" == push ]]; then
  docker push "$image:$VERSION"
  docker push "$image:sha-$short_revision"
  docker buildx imagetools inspect "$image:$VERSION"
  digest="$(docker buildx imagetools inspect "$image:$VERSION" --format '{{json .Manifest}}' | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{const m=JSON.parse(s);if(!/^sha256:[a-f0-9]{64}$/.test(m.digest))process.exit(1);console.log(m.digest)})')"
  echo "Published: $image@$digest"
else
  echo "Local image verified: $image:$VERSION (not published)"
fi
