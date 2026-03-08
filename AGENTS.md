# Repository Guidelines

## Project Structure & Module Organization
This repo is split into two TypeScript apps:
- `backend/`: NestJS API (`src/` modules like `auth`, `products`, `sales`, `billing`, `database`).
- `frontend/`: Angular 21 app (`src/app/{core,shared,layout,features}`).
- `docs/`: architecture, roadmap, and feature implementation notes.
- `memory/`: operational project memory and current implementation status.

Keep domain logic inside feature modules (`backend/src/<domain>` and `frontend/src/app/features/<domain>`). Put cross-cutting concerns in `backend/src/common` and `frontend/src/app/core`.

## Build, Test, and Development Commands
Run commands from each app folder.

Backend (`backend/`):
- `npm run start:dev`: run Nest with watch mode (default API port `3000`).
- `npm run build`: compile to `dist/`.
- `npm run migration:run`: apply TypeORM migrations.
- `npm run test`, `npm run test:e2e`, `npm run test:cov`: unit, e2e, coverage.

Frontend (`frontend/`):
- `npm run start`: start Angular dev server on `4200`.
- `npm run build`: production build.
- `npm run test`: run unit tests.

## Coding Style & Naming Conventions
- Use 2-space indentation, UTF-8, and trim trailing whitespace (`frontend/.editorconfig`).
- TypeScript files use single quotes and `camelCase` for variables/functions.
- Use `PascalCase` for classes/components and Nest DTO/entity names (e.g., `CreateProductDto`).
- Keep filenames descriptive and feature-scoped (e.g., `product-list.ts`, `sales.service.ts`).
- Backend lint/format: `npm run lint`, `npm run format` in `backend/`.

## Testing Guidelines
- Backend uses Jest with `*.spec.ts` naming (`backend/package.json` Jest config).
- Place backend unit tests next to source or under `backend/test/` for integration/e2e.
- Frontend tests should live as `*.spec.ts` beside components/services.
- Frontend uses Vitest (not Karma/Jasmine) — 120 tests passing across core layer.
- Prioritize coverage for multi-tenant isolation, billing/feature gates, and sales transaction flows.

## Commit & Pull Request Guidelines
- Follow concise, imperative commit subjects (examples in history: `Add ...`, `Improve ...`, `Reorganize ...`).
- Keep commits scoped to one concern (backend API, frontend UI, docs).
- PRs should include:
  - clear summary and affected modules,
  - linked issue/task,
  - migration or env-var notes if applicable,
  - screenshots/GIFs for frontend changes.

## Security & Configuration Tips
- Never commit secrets; keep `.env` local (`backend/.env.example` as template).
- Validate `DATABASE_URL`, Supabase keys, JWT settings, and `FRONTEND_URL` before running migrations or deployments.
- For tenant-protected endpoints, ensure `Authorization` and `X-Store-Id` headers are handled end-to-end.

## Subscription & Feature Gating

All tenant controllers use the full guard chain:
```typescript
@UseGuards(AuthGuard('jwt'), TenantGuard, SubscriptionGuard, RolesGuard, PermissionsGuard, FeatureGateGuard, UsageLimitGuard)
```

Use decorators for feature gates and limits:
- `@RequireFeature('reports')` — gated to Negosyo+ plans
- `@RequireFeature('utang_management')` — gated to Negosyo+ plans
- `@CheckLimit({ resource: 'products' })` — enforces plan resource limits

Frontend feature gating: use `SubscriptionService.hasFeatureSignal('feature_name')` for template signals,
and `hasFeature('feature_name')` before making API calls.

## Table Design Standard

All PrimeNG tables follow the Products page pattern:
- `styleClass="enhanced-table"` on `<p-table>`
- `class="table-row"` on `<tr>` body rows
- `[rowsPerPageOptions]="[15, 30, 50]"` — no separate page-size selector
- `[showCurrentPageReport]="true"` + `"Showing {first}–{last} of {totalRecords} X"` template
- Search: use `<p-iconfield>` + `<p-inputicon styleClass="pi pi-search" />` (NOT deprecated `span.p-input-icon-left`)

## Documentation Workflow
- Before creating or modifying code, always read `memory/index.md` and the relevant `memory/features/*.md` file first. Use `docs/` as the polished reference layer after that.
- After making changes, update relevant files in `docs/` when needed so documentation stays aligned with implementation.
- After meaningful changes, update the relevant `memory/features/*.md`, `memory/recent-changes.md`, and `memory/index.md` when project status, blockers, or next steps changed.
- Treat `memory/` as the operational source of truth for current status. If `memory/` and `docs/` disagree, fix `memory/` first, then reconcile `docs/`.
- Only add necessary documentation items; do not add unnecessary or redundant entries.
- Supplier Management details are documented in `docs/features/supplier-management.md`.
