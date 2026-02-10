# POS & Inventory System — Strategic Roadmap

> Last updated: February 10, 2026

## Stage Assessment: Pre-Launch

This product has **zero real users**. The backend is ~80% functional, but there is no usable frontend. Nobody can ring up a sale, manage inventory, or do anything without a working UI.

**The only thing that matters right now is completing the core loop.**

### Core Loop Definition

For a POS system targeting Philippine sari-sari stores and small retailers, the core loop is:

1. **Admin** logs in, adds products, and stocks inventory
2. **Cashier** logs in, rings up sales at the register
3. **Admin** views daily sales and stock levels

If a store owner can't do these three things end-to-end, nothing else matters.

---

## What's Already Built

| Area | Status | Notes |
|------|--------|-------|
| Auth (backend) | Done | Login, register, JWT, store switching |
| Products CRUD (backend) | Done | Create, search, update, soft delete |
| Categories CRUD (backend) | Done | Hierarchical categories |
| Inventory/FIFO (backend) | Done | Batch tracking, stock adjustments, movements |
| Sales Transactions (backend) | Done | FIFO batch selection, VAT calc, atomic transactions, void |
| Reports (backend) | Done | Sales summary, inventory, best sellers, profit |
| Receipts (backend) | Done | PDF generation with store/sale details |
| Users & Roles (backend) | Done | Admin/Cashier roles, permissions |
| Stores (backend) | Done | Multi-tenant CRUD |
| Frontend | ~10% | Angular skeleton, models defined, no functional pages |
| Customers/Credit (backend) | Not built | Entity exists, no service/controller |
| Suppliers (backend) | Not built | Entity exists, no service/controller |
| Alerts/Cron (backend) | Not built | No implementation |
| Returns/Refunds (backend) | Partial | Void exists, full return flow missing |

---

## Roadmap

### Phase 1: Complete the Core Loop

**Goal:** A store owner can log in, add products, stock inventory, and a cashier can ring up sales. This is the minimum for the product to exist.

Everything in this phase is **High Impact**. Without it, there is no product.

| # | Feature | Impact | Effort | Category | Why |
|---|---------|--------|--------|----------|-----|
| 1.1 | **Frontend: Auth pages** (login, register) | High | Low | Core | Can't access the app without this |
| 1.2 | **Frontend: Layout & navigation** (sidebar, header, routing) | High | Low | Core | Structural requirement for all pages |
| 1.3 | **Frontend: Product management page** | High | Medium | Core | Admin must add products before anyone can sell |
| 1.4 | **Frontend: Inventory management page** (stock-in, view batches) | High | Medium | Core | Admin must stock products before cashier can sell |
| 1.5 | **Frontend: POS interface** (product grid, cart, payment, receipt) | High | High | Core | This IS the product. The register screen. |
| 1.6 | **Frontend: Dashboard** (today's sales, low stock summary) | High | Medium | Core | Admin needs to see what happened today |

**What NOT to build in Phase 1:**
- Customer credit (utang) — cashiers can sell for cash first
- Supplier management — admin can stock inventory without supplier records
- Reports beyond daily summary — not useful with no sales data yet
- Alerts/cron jobs — no data to alert on
- Thermal printing — PDF receipts work fine initially
- Barcode scanning — manual product search works first
- Multi-store UI — start with one store

**Phase 1 exit criteria:** A real store can use this for one full day of cash sales.

---

### Phase 2: Make Daily Operations Viable

**Goal:** Handle the realities of running a Philippine retail store day-to-day. These are features users will ask for within the first week of real use.

| # | Feature | Impact | Effort | Category | Why |
|---|---------|--------|--------|----------|-----|
| 2.1 | **Customers module + credit system (utang)** | High | Medium | Core | Utang is fundamental to Philippine sari-sari stores. Cash-only won't last. |
| 2.2 | **Frontend: Customer management page** | High | Medium | Core | Admin needs to see who owes what |
| 2.3 | **Credit payment recording** | High | Low | Core | Customers pay their utang, need to track it |
| 2.4 | **Sales history page** (frontend) | Medium | Low | Retention | Cashier/admin needs to look up past transactions |
| 2.5 | **Returns/refunds flow** (backend + frontend) | Medium | Medium | Core | Will happen within the first week of real use |
| 2.6 | **Category management page** (frontend) | Medium | Low | Core | Admin organizes products into categories |

**Phase 2 exit criteria:** A store can operate for a full month, including credit sales and basic returns.

---

### Phase 3: Operational Completeness

**Goal:** Fill remaining gaps that prevent smooth long-term operation. Only build these after real stores validate Phase 1-2.

| # | Feature | Impact | Effort | Category | Why |
|---|---------|--------|--------|----------|-----|
| 3.1 | **Reports page** (frontend — sales, inventory, profit) | High | Medium | Retention | Admin needs weekly/monthly business insights |
| 3.2 | **Low stock alerts** (backend cron + frontend notification) | Medium | Low | Retention | Prevents stockouts, keeps store running |
| 3.3 | **Expiry alerts** (backend cron + frontend notification) | Medium | Low | Retention | Critical for stores selling perishables |
| 3.4 | **Suppliers module** (backend + frontend) | Low | Low | Core | Nice organizational feature, not blocking operations |
| 3.5 | **User management page** (frontend) | Medium | Low | Core | Admin manages cashier accounts from UI |
| 3.6 | **Settings page** (frontend — store info, tax config) | Low | Low | Core | Store can be configured via DB initially |

**Phase 3 exit criteria:** Store owner has full visibility into business performance and gets proactive alerts.

---

### Phase 4: Scale & Efficiency

**Goal:** Speed up daily operations and support growth. Only build after real usage patterns emerge.

| # | Feature | Impact | Effort | Category | Why |
|---|---------|--------|--------|----------|-----|
| 4.1 | **Barcode scanning** (frontend integration) | Medium | Medium | Retention | Speeds up checkout significantly for stores with many SKUs |
| 4.2 | **Thermal printer support** (frontend trigger + backend formatting) | Medium | Medium | Retention | Store owners expect paper receipts |
| 4.3 | **Multi-store switching UI** | Medium | Low | Growth | Only matters when users manage multiple stores |
| 4.4 | **Customer statements** (credit history report) | Low | Low | Retention | Useful for settling utang disputes |
| 4.5 | **Advanced permissions UI** | Low | Medium | Core | Only needed for stores with multiple employees |
| 4.6 | **Offline-capable POS** (service worker/PWA) | High | High | Retention | Philippine internet isn't reliable — this could be a major differentiator |

**Phase 4 exit criteria:** Cashiers process sales faster, store owners can manage multiple locations.

---

## What's Explicitly NOT on the Roadmap

These are features that might seem appealing but fail the evaluation criteria:

| Feature | Why Not |
|---------|---------|
| Mobile app | The Angular frontend can be responsive. A separate app is premature optimization. |
| Analytics dashboard with charts | The reports module covers this. Fancy charts don't help if basics aren't solid. |
| Social login (Google/Facebook) | Email/password works. No user has asked for alternatives. |
| Customizable themes / dark mode | Doesn't improve the core loop at all. |
| Integrations (accounting software, e-commerce) | Imaginary users. Wait for real demand. |
| AI-powered demand forecasting | Premature. Need months of sales data first. |
| Gamification / loyalty points | Solving the wrong problem at this stage. |
| Multi-language support | Philippine market speaks English/Filipino. Current UI language is sufficient. |

---

## Decision Framework for New Feature Requests

Before adding anything to this roadmap, answer these questions:

1. **Does it serve the core loop?** (Admin stocks → Cashier sells → Admin reviews)
2. **Has a real user asked for it?** (Not "users might want..." — an actual person.)
3. **Can we fake it manually first?** (Google Sheet, manual process, etc.)
4. **What do we NOT build if we build this?** (Everything has an opportunity cost.)

---

## Current Priority: Phase 1

The single highest-impact action right now is **building the frontend POS interface** (item 1.5). Everything else is either a prerequisite for it (1.1, 1.2, 1.3, 1.4) or follows from it (1.6).

**Recommended build order within Phase 1:**

```
1.1 Auth pages → 1.2 Layout/routing → 1.3 Products page → 1.4 Inventory page → 1.5 POS interface → 1.6 Dashboard
```

Each step unlocks the next. Don't skip ahead.

---

## Success Metrics

Track these after launch to validate roadmap decisions:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Daily active stores | 1+ completing full days | Sales records per store per day |
| Transactions per store per day | 10+ | Sale count in reports |
| Core feature adoption | All Phase 1 features used | Check if products, inventory, sales all have data |
| Drop-off point | Identify where users stop | Which pages have zero activity |
| Feature requests | Track what users ask for | Drives Phase 2-4 prioritization |

---

## Summary

| Phase | Focus | Status |
|-------|-------|--------|
| **Phase 1** | Core loop (frontend + end-to-end flow) | **Next up** |
| **Phase 2** | Daily operations (utang, returns, sales history) | Waiting |
| **Phase 3** | Operational completeness (reports UI, alerts, suppliers) | Waiting |
| **Phase 4** | Scale & efficiency (barcode, thermal print, offline) | Waiting |

**One rule above all: Don't build Phase N+1 until Phase N is validated with real users.**
