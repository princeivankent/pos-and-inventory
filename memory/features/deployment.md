# Deployment

Last updated: 2026-03-07

## Purpose

Define how the backend, frontend, migrations, environment variables, and release automation reach production safely.

## Current Status

- Status: `planned`

## What Exists

- Production-capable backend and frontend build commands
- Backend environment validation for production safety
- CI workflows for build/test and isolated browser E2E

## Known Gaps

- No in-repo deployment workflow for backend
- No in-repo deployment workflow for frontend
- No in-repo CD automation
- No production migration runbook captured in operational memory yet
- No deployment smoke execution tied to releases

## Recent Decisions

- Deployment is treated as a real launch blocker, not a minor follow-up

## Dependencies / Cross-Cutting Notes

- Billing live rollout depends on deployment correctness
- Production readiness depends on env-var setup, secrets management, and migration order

## Next Actions

- Choose and implement the production deployment path
- Define release order: migration, backend, frontend
- Add smoke verification after deploy

## Validation / Evidence

- `.github/workflows/ci.yml`
- `.github/workflows/e2e-playwright.yml`
- `docs/development-checklist.md`
- `docs/roadmap.md`

## Last Updated

- 2026-03-07
