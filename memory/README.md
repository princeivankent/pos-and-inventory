# Project Memory System

This folder is the operational source of truth for current project state.

Use it to answer:
- What exists right now
- What changed recently
- What is blocked or still missing
- What should be built next

## How To Use It

Before meaningful work:
- Read [index.md](./index.md)
- Read the relevant file in [features/](./features)

After meaningful work:
- Update the relevant feature memory file
- Add an entry to [recent-changes.md](./recent-changes.md)
- Update [index.md](./index.md) if overall status, blockers, or priorities changed
- Update [next-up.md](./next-up.md) if the next actions changed

Update polished docs in `docs/` only when the change affects longer-lived reference material.

## Status Vocabulary

- `planned`: approved but not started
- `in_progress`: active work underway
- `done`: implemented and verified
- `blocked`: cannot proceed without an external dependency or decision
- `deferred`: intentionally postponed

## Confidence Labels

Used in `memory/index.md`:
- `verified`: confirmed directly in code, tests, workflows, or config
- `likely`: strongly supported, but not re-verified recently
- `needs_check`: older or conflicting information needs verification

## Authoring Rules

- `What Exists` only lists implemented behavior
- `Known Gaps` only lists real missing work, bugs, or launch blockers
- `Validation / Evidence` should point to tests, workflows, config, or docs
- Keep entries short and decision-oriented
- If memory and docs disagree, fix memory first, then reconcile docs

## File Map

- [index.md](./index.md): master dashboard
- [recent-changes.md](./recent-changes.md): chronological log of meaningful updates
- [next-up.md](./next-up.md): active priorities
- [features/](./features): per-area operational memory
