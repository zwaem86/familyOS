# Supported Node.js LTS major. Update patch/digest regularly; npm dependencies are lockfile-pinned.
FROM docker.io/library/node:24-bookworm-slim AS dependencies
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci

FROM docker.io/library/node:24-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
# Prisma CLI detects OpenSSL while generating the client.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm run build

# Explicit release tool; never runs with the app entrypoint.
FROM build AS migrations
USER node
CMD ["node", "node_modules/prisma/build/index.js", "migrate", "deploy"]

FROM docker.io/library/node:24-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN groupadd --system --gid 1001 familyos && useradd --system --uid 1001 --gid familyos familyos
COPY --from=build --chown=familyos:familyos /app/.next/standalone ./
COPY --from=build --chown=familyos:familyos /app/.next/static ./.next/static
COPY --from=build --chown=familyos:familyos /app/public ./public
USER familyos
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health/live').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]
CMD ["node", "server.js"]
