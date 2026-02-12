# Product Roadmap - POS & Inventory Management System

## Stage Assessment: PRE-LAUNCH

The system has no live users yet. The core backend and frontend are ~92% complete. The primary task (running a store with POS, inventory, and sales) is mostly functional. The focus must be on **completing the core loop** before anything else.

**Core loop checklist:**
- [x] Can users ring up sales? (POS interface complete)
- [x] Is inventory tracked accurately? (FIFO batch system working)
- [x] Can users view sales and reports? (Dashboard + reports functional)
- [ ] Can users manage customer credit ("utang")? **GAP - critical for Philippine retail**
- [ ] Can users manage suppliers? **GAP - needed for inventory receiving**
- [ ] Does the system work on real POS hardware? **GAP - thermal printing not wired up**

---

## Priority Roadmap

### Phase 1: Complete the Core Loop (Build Now)

These are **High Impact, Low Effort** items that close gaps in the fundamental value proposition. Without these, the product doesn't fully solve the problem it claims to solve.

#### 1.1 Customer Credit Management ("Utang")

**Recommendation:** Build Now

| Attribute | Value |
|-----------|-------|
| Impact | High - Credit sales are a daily reality in Philippine sari-sari stores. Without this, the system doesn't match how stores actually operate. |
| Effort | Low - Entities (`Customer`, `CreditPayment`) already exist. Need CRUD module + integration into sales flow. |
| Category | Core Feature |
| Stage Fit | Yes - Directly completes the core loop |

**What to build:**
- Customer CRUD module (controller, service, DTOs)
- Credit limit validation in sales flow (reject if over limit)
- Credit payment recording and balance tracking
- Customer balance statement view in frontend
- Customer selection during POS checkout (for credit sales)

**What NOT to build yet:**
- SMS/email reminders for overdue balances
- Customer analytics or purchase history reports
- Automated interest calculations

---

#### 1.2 Supplier Management

**Recommendation:** Build Now

| Attribute | Value |
|-----------|-------|
| Impact | High - Stores need to track where inventory comes from. Required for proper inventory receiving workflow. |
| Effort | Low - Entity already exists. Standard CRUD following established pattern. |
| Category | Core Feature |
| Stage Fit | Yes - Completes inventory management loop |

**What to build:**
- Supplier CRUD module (controller, service, DTOs)
- Link suppliers to inventory batches on stock-in
- Supplier list/detail pages in frontend

**What NOT to build yet:**
- Purchase orders system
- Supplier performance analytics
- Automated reorder suggestions

---

#### 1.3 Thermal Printer Integration

**Recommendation:** Build Now

| Attribute | Value |
|-----------|-------|
| Impact | High - Real POS environments need receipt printing. PDF-only is a blocker for actual store deployment. |
| Effort | Low - Dependencies already installed (`escpos`, `escpos-usb`). Receipt data structure exists. |
| Category | Core Feature |
| Stage Fit | Yes - Required for real-world usability |

**What to build:**
- ESC/POS formatted receipt output
- Print endpoint that sends to connected USB/network printer
- Fallback to PDF when no printer detected
- Print button on POS completion screen

**What NOT to build yet:**
- Printer management UI
- Multiple printer support
- Kitchen/warehouse printer routing

---

### Phase 2: Make It Deployable (Build Next)

These are **High Impact, Medium Effort** items needed before real users can adopt the system. They don't add features - they make existing features production-ready.

#### 2.1 End-to-End Testing & Bug Fixes

**Recommendation:** Build Next

| Attribute | Value |
|-----------|-------|
| Impact | High - Can't launch with untested transaction flows. Sales + inventory + credit must work atomically. |
| Effort | Medium - Need to test all critical paths. |
| Category | Retention (users won't stay if it breaks) |

**What to do:**
- Write E2E tests for the sales transaction flow (FIFO deduction, payment, receipt)
- Write E2E tests for inventory adjustments (stock in, stock out, batch tracking)
- Test multi-tenant isolation (verify store A can't see store B's data)
- Test role-based access (cashier vs admin permissions)
- Fix any bugs found during testing

---

#### 2.2 Low-Stock Alert Automation

**Recommendation:** Build Next

| Attribute | Value |
|-----------|-------|
| Impact | Medium - Prevents stockouts, which directly affect store revenue. |
| Effort | Low - Entity exists. Need a cron job + dashboard notification. |
| Category | Retention |

**What to build:**
- NestJS cron job to check stock levels against thresholds
- Dashboard notification for low-stock items
- Low-stock badge/indicator on product list

**What NOT to build yet:**
- Email/SMS notifications
- Auto-reorder functionality
- Expiry date tracking alerts

---

#### 2.3 Data Seeding & Onboarding Flow

**Recommendation:** Build Next

| Attribute | Value |
|-----------|-------|
| Impact | High - New users need to set up their store quickly. A blank system is intimidating. |
| Effort | Low - Seed script + simple first-run wizard. |
| Category | Core Feature |

**What to build:**
- Seed script with sample Philippine retail categories (groceries, beverages, snacks, etc.)
- First-login store setup wizard (store name, TIN, address, tax rate)
- Quick-start guide or tooltips for first use

---

### Phase 3: Launch & Validate (Build After Real Users)

Do NOT build these until real stores are using the system and providing feedback. These are assumptions that need validation.

#### 3.1 Returns & Refunds Module

**Recommendation:** Build Later (validate demand first)

| Attribute | Value |
|-----------|-------|
| Impact | Medium - Important but not every sale gets returned. Can handle manually at first. |
| Effort | Medium - Needs reverse transaction logic, batch restocking. |
| Category | Core Feature |

**Fake it first:** Handle returns as manual inventory adjustments + void the original sale. If stores do this frequently, build the dedicated module.

---

#### 3.2 Expense Tracking

**Recommendation:** Build Later (validate demand first)

| Attribute | Value |
|-----------|-------|
| Impact | Medium - Useful for profit calculation but not core POS function. |
| Effort | Medium - New entity, new module, report integration. |

**Fake it first:** Store owners can track expenses in a spreadsheet. If they consistently ask for it in-app, build it.

---

#### 3.3 Barcode Scanning Input

**Recommendation:** Build Later

| Attribute | Value |
|-----------|-------|
| Impact | Medium - Speeds up POS checkout significantly. |
| Effort | Low - Barcode scanners act as keyboard input. Product lookup by barcode already exists. |

**Note:** Most USB barcode scanners already work as keyboard input. The existing product search by barcode may already support this. Test with real hardware before building anything custom.

---

### Phase 4: Don't Build (Deprioritize Indefinitely)

These are either **Low Impact**, **High Effort**, or solve problems that don't exist yet.

| Feature | Why Not |
|---------|---------|
| Multi-currency support | Philippine stores operate in PHP. No real demand. |
| Advanced analytics/BI | Basic reports exist. No users generating data yet. |
| Mobile app | The Angular frontend works in mobile browsers. Build native only if browser UX is proven insufficient. |
| Social features / sharing | Not relevant to POS use case. |
| Dark mode | Nice-to-have with zero impact on core value. |
| Barcode label printing | Solve manually with free label tools until demand is clear. |
| API integrations (accounting, e-commerce) | No users means no integration demand. Wait for requests. |
| Advanced BIR reporting | Basic TIN/VAT is implemented. Advanced compliance only needed at scale. |
| Multi-language support | Target market speaks Filipino/English. Current UI is sufficient. |

---

## Summary: Build Order

| Priority | Item | Impact | Effort | Category |
|----------|------|--------|--------|----------|
| 1 | Customer Credit ("Utang") | High | Low | Core |
| 2 | Supplier Management | High | Low | Core |
| 3 | Thermal Printer Integration | High | Low | Core |
| 4 | E2E Testing & Bug Fixes | High | Medium | Retention |
| 5 | Low-Stock Alert Automation | Medium | Low | Retention |
| 6 | Data Seeding & Onboarding | High | Low | Core |
| --- | **LAUNCH GATE** | --- | --- | --- |
| 7 | Returns & Refunds | Medium | Medium | Core |
| 8 | Expense Tracking | Medium | Medium | Monetization |
| 9 | Barcode Scanning | Medium | Low | Core |

**Items 1-6** complete the core loop and make the system deployable.
**Items 7-9** are validated post-launch based on real user feedback.
**Everything else** stays off the roadmap until there's proven demand.

---

## Weekly Review Questions

Use these every week to stay focused:

1. What's the ONE thing that moves us closer to a deployable product?
2. Are we building for the sari-sari store owner in front of us, or an imaginary enterprise user?
3. What can we cut from scope this week?
4. What assumptions are we making that we haven't validated?

---

## Success Metrics (Post-Launch)

Track these to validate roadmap decisions:

- **Daily active stores** - Are stores using it every day?
- **Sales transactions per store** - Is the POS actually being used for real sales?
- **Credit balance accuracy** - Do store owners trust the utang tracking?
- **Time to first sale** - How quickly can a new store ring up their first transaction?
- **Support requests** - What are stores struggling with?

If these metrics aren't improving, the roadmap priorities are wrong. Adjust accordingly.
