# Repository Guidelines

## Project Structure & Module Organization
This repo is split into two TypeScript apps:
- `backend/`: NestJS API (`src/` modules like `auth`, `products`, `sales`, `billing`, `database`).
- `frontend/`: Angular 21 app (`src/app/{core,shared,layout,features}`).
- `docs/`: architecture, roadmap, and feature implementation notes.

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
