# FamilyOS
Vor jeder Änderung `FamilyOS_Codex_Implementierung.md` vollständig lesen. Sie ist die zentrale Produkt- und Architekturvorgabe.
Nur die ausdrücklich freigegebene Phase implementieren. Phase 1 ist umgesetzt; Phase 2 ist seit dem Benutzerauftrag vom 15. November 2026 ausdrücklich freigegeben. Phase 3 und spätere Phasen bleiben gesperrt.
Keine Änderungen an Nginx, produktivem Compose oder Homelab-Infrastruktur. Kein Deployment und kein Registry-Push ohne Auftrag.
Demo-Daten strikt isolieren und als fiktiv kennzeichnen. Keine privaten Familieninformationen oder Secrets einchecken.
Lint, Typecheck, Build und relevante Tests durchführen; tatsächliche Ergebnisse und Einschränkungen dokumentieren.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
