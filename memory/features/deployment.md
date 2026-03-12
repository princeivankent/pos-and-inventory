# Deployment

Last updated: 2026-03-13

## Purpose

Define how the backend, frontend, migrations, environment variables, and release automation reach production safely.

## Current Status

- Status: `done`

## What Exists

- **Backend**: Railway (us-east4) — https://pos-and-inventory-production.up.railway.app
- **Frontend**: Vercel — https://pos-and-inventory-seven.vercel.app
- **Database**: Supabase (existing project, shared with dev for now)
- **CD**: Native GitHub integrations on both Railway and Vercel — auto-deploy on push to `main`
- **Migrations**: Run automatically at startup via `start.sh` → `npx typeorm migration:run -d dist/config/database.config.js`
- **Branch protection**: `main` branch requires CI checks (Backend Build + Frontend Build) to pass before merge
- **PayMongo**: Test mode keys configured in Railway — `sk_test_*` + webhook secret

## Config Files

- `backend/railway.json` — Railway build/start config
- `backend/start.sh` — startup script (migrations then `node dist/main`)
- `frontend/vercel.json` — SPA routing + `/api/*` proxy to Railway

## Known Gaps

- Supabase: using same project as dev (should split prod/dev databases before real customers)
- PayMongo: test mode only — needs business verification + live keys before real payments
- No deployment smoke tests tied to releases
- Frontend bundle still slightly above 500kB warning threshold

## Recent Decisions

- Vercel proxies `/api/*` to Railway — Angular keeps `apiUrl: '/api'`, no CORS needed
- `BYPASS_PAYMENT=false` in production with placeholder PayMongo keys until test keys were ready
- Native platform integrations used for CD (simpler than custom GHA deploy workflows)

## Environment Variables (Railway)

| Var | Notes |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Supabase Transaction pooler |
| `SUPABASE_URL/ANON_KEY/SERVICE_KEY` | From Supabase dashboard |
| `JWT_SECRET` | Random 64-char secret |
| `JWT_EXPIRATION` | `7d` |
| `FRONTEND_URL` | `https://pos-and-inventory-seven.vercel.app` |
| `BYPASS_PAYMENT` | `false` |
| `PAYMONGO_SECRET_KEY` | `sk_test_*` (test mode) |
| `PAYMONGO_WEBHOOK_SECRET` | From PayMongo webhook setup |

## Next Actions

- Split Supabase prod/dev databases before real customer onboarding
- Complete PayMongo business verification → swap to live keys
- Add deployment smoke test coverage

## Last Updated

- 2026-03-13
