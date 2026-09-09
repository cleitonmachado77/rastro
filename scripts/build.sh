#!/usr/bin/env bash
set -euo pipefail

# Default local/Vercel SQLite URL when the env var is unset.
export DATABASE_URL="${DATABASE_URL:-file:./dev.db}"

npx prisma generate
npx prisma migrate deploy
npx tsx prisma/seed.ts
npx next build
