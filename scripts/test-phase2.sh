#!/usr/bin/env bash
# Only the dedicated fictional local DB; never production.
set -euo pipefail
export DATABASE_URL=postgresql://familyos_test:fictional_local_test_only@127.0.0.1:55432/familyos_test
export NEXTAUTH_URL=http://127.0.0.1:3000
export AUTH_SECRET=fictional-test-auth-secret-at-least-32-characters
export BOOTSTRAP_SECRET=fictional-bootstrap-test-secret-32-characters
npm run db:migrate
npm run test:integration
npm run test:e2e
