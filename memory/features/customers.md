# Customers

Last updated: 2026-03-07

## Purpose

Manage customer records, credit limits, balances, credit statements, and payment recording.

## Current Status

- Status: `done`

## What Exists

- Backend customer CRUD with store scoping
- Credit-limit enforcement in sales flow
- Payment recording against outstanding balances
- Unified customer credit statements
- Frontend customer list, payment dialog, and statement dialog
- Feature gating for utang-related actions

## Known Gaps

- No reminder/collections automation exists
- No advanced customer analytics exists

## Recent Decisions

- Utang management is treated as implemented core behavior, with gating by subscription plan where applicable

## Dependencies / Cross-Cutting Notes

- Depends on sales for balance-producing transactions
- Subscription feature gates affect statement/payment UI availability

## Next Actions

- Keep stable

## Validation / Evidence

- `backend/src/customers`
- `frontend/src/app/features/customers`
- Frontend customer feature test coverage
- Sales integration tests cover credit balance reversal on void

## Last Updated

- 2026-03-07
