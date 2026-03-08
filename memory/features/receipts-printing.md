# Receipts & Printing

Last updated: 2026-03-07

## Purpose

Generate sale receipts for operators and define the path from browser/PDF receipt output to real POS printer support.

## Current Status

- Status: `in_progress`

## What Exists

- Backend receipt data endpoint
- Backend PDF receipt generation
- Thermal-friendly PDF/browser receipt layout
- Frontend receipt preview after sale completion
- Store-configurable receipt header and footer
- Browser print flow from the receipt preview

## Known Gaps

- No wired ESC/POS print endpoint for real POS hardware
- No verified USB or network printer flow in production-like environments
- Real-store printing remains a launch blocker for hardware-based rollout

## Recent Decisions

- Browser/PDF receipt support is treated as complete
- Real thermal hardware integration is treated as separate unfinished work

## Dependencies / Cross-Cutting Notes

- Depends on sales completion and store settings
- Billing plans expose receipt customization as a feature-level capability

## Next Actions

- Define the real thermal-print integration path
- Add fallback behavior and operator flow for printer-unavailable cases

## Validation / Evidence

- `backend/src/receipts`
- `frontend/src/app/features/pos/components/receipt-preview`
- `frontend/src/app/features/settings`
- `docs/roadmap.md`

## Last Updated

- 2026-03-07
