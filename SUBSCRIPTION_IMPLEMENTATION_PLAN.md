# Subscription System Implementation Plan

## Context

The POS system needs subscription-based billing with 3 tiers (Tindahan/Negosyo/Kadena) to monetize the SaaS product. This adds an Organization entity as the billing account, subscription plans with feature gating, usage limits, and eventually PayMongo payment processing. The implementation is phased so each step is independently deployable and testable.

## Pricing Tiers

| Tier | Price | Max Stores | Max Users | Max Products | Key Features |
|------|-------|-----------|-----------|--------------|--------------|
| **Tindahan** | ₱799/mo | 1 | 2 | 500 | Basic POS, Inventory, Receipts, VAT |
| **Negosyo** | ₱1,499/mo | 3 | 5 | 2,000 | + FIFO, Reports, Utang management |
| **Kadena** | ₱2,999/mo | Unlimited | Unlimited | Unlimited | + Multi-store, Advanced reports, API access |

**Trial Period**: 14 days free trial on all plans

## Key Design Decisions

1. **Organization owns Stores** - Add `organization_id` to `Store` (not User). Users link to organizations through their store memberships.
2. **Backward compatible guard** - SubscriptionGuard passes through for stores without an `organization_id` (legacy data).
3. **PayMongo mocked first** - Use interface + factory pattern so we can develop/test without live payment keys.
4. **Migration via raw SQL** - Matches existing pattern in `1707300000000-AddUserPermissions.ts`.

---

## Phase 1: Database Entities + Migration

**New files:**
- `backend/src/database/entities/organization.entity.ts` - Billing account entity extending `BaseEntity`
- `backend/src/database/entities/subscription-plan.entity.ts` - Plan definitions (3 tiers)
- `backend/src/database/entities/subscription.entity.ts` - Links org to plan, tracks status/periods
- `backend/src/database/migrations/1707400000000-AddSubscriptionTables.ts` - Creates 3 tables, ALTERs stores, seeds plans, migrates existing data

**Modify:**
- `backend/src/database/entities/store.entity.ts` - Add `organization_id` column + `@ManyToOne(() => Organization)`
- `backend/src/database/entities/index.ts` - Export new entities

**Migration does:**
1. CREATE `organizations` table (name, owner_user_id, billing_email, billing_phone, tax_id, billing_address, is_active)
2. CREATE `subscription_plans` table (plan_code, name, price_php, max_stores, max_users_per_store, max_products_per_store, features JSONB, sort_order)
3. CREATE `subscriptions` table (organization_id, plan_id, status, trial_start/end, current_period_start/end, cancel_at_period_end, usage_stats JSONB)
4. ALTER `stores` ADD `organization_id` FK
5. INSERT 3 seed plans (tindahan/negosyo/kadena)
6. Data migration: create Organization per admin user, link their stores, create 30-day Kadena trial for existing users

**Verify:** Run migration, check tables exist, verify existing stores have organization_id populated.

---

## Phase 2: SubscriptionGuard + Request Interface

**New files:**
- `backend/src/common/guards/subscription.guard.ts` - Checks org has active/trial subscription, injects subscription context into request
- `backend/src/common/guards/subscription-guard.module.ts` - Shared module exporting guard + TypeORM repos (Store, Subscription)

**Modify:**
- `backend/src/common/interfaces/request-with-user.interface.ts` - Add `organizationId` and `subscription` fields to `RequestUser`

**Guard logic:**
1. Get `storeId` from request (set by TenantGuard)
2. Look up store's `organization_id` (pass through if null = legacy)
3. Find active/trial subscription for that org
4. Check trial_end / current_period_end for expiry, throw 402 if expired
5. Inject `organizationId` + `subscription` (id, status, plan with features/limits) into `request.user`

**Verify:** Guard compiles, legacy stores (no org_id) pass through, stores with expired trial get 402.

---

## Phase 3: Feature Gate + Usage Limit Guards

**New files:**
- `backend/src/common/decorators/require-feature.decorator.ts` - `@RequireFeature('reports')`
- `backend/src/common/decorators/check-limit.decorator.ts` - `@CheckLimit({ resource: 'products' })`
- `backend/src/common/guards/feature-gate.guard.ts` - Reads plan features from request.user.subscription, throws 403 if missing
- `backend/src/common/guards/usage-limit.guard.ts` - Counts current resources, throws 403 if at limit

**Verify:** Decorators + guards compile, no-op when no subscription context present.

---

## Phase 4: Apply Guards to Existing Controllers

**Modify (add SubscriptionGuard to @UseGuards chain + feature/limit decorators):**
- `backend/src/products/products.controller.ts` - Add SubscriptionGuard; `@CheckLimit({ resource: 'products' })` on POST
- `backend/src/stores/stores.controller.ts` - Add SubscriptionGuard; `@CheckLimit({ resource: 'stores' })` on POST
- `backend/src/users/users.controller.ts` - Add SubscriptionGuard; `@CheckLimit({ resource: 'users' })` on POST
- `backend/src/reports/reports.controller.ts` - Add SubscriptionGuard; `@RequireFeature('reports')` on all endpoints
- `backend/src/customers/customers.controller.ts` - Add SubscriptionGuard; `@RequireFeature('utang_management')` on credit endpoints
- `backend/src/inventory/inventory.controller.ts` - Add SubscriptionGuard
- `backend/src/sales/sales.controller.ts` - Add SubscriptionGuard
- `backend/src/categories/categories.controller.ts` - Add SubscriptionGuard
- `backend/src/receipts/receipts.controller.ts` - Add SubscriptionGuard

**Each module.ts** needs to import `SubscriptionGuardModule` (for repository DI).

**Verify:** Build compiles, existing endpoints still work (existing stores have trial subscriptions from migration).

---

## Phase 5: Subscription Plans + Billing Modules

**New files:**
```
backend/src/subscription-plans/
  subscription-plans.module.ts
  subscription-plans.service.ts
  subscription-plans.controller.ts       # GET /subscription-plans (public)

backend/src/billing/
  billing.module.ts
  billing.controller.ts                  # GET/POST /billing/* (authenticated)
  subscription.service.ts                # CRUD + upgrade/downgrade/cancel
  usage-tracker.service.ts               # Count resources, cache daily via cron
  dto/
    upgrade-plan.dto.ts
    cancel-subscription.dto.ts
```

**Modify:**
- `backend/src/app.module.ts` - Import SubscriptionPlansModule + BillingModule

**Endpoints:**
- `GET /api/subscription-plans` - Public, list active plans
- `GET /api/billing/subscription` - Current subscription + usage
- `GET /api/billing/usage` - Current resource counts vs limits
- `POST /api/billing/upgrade` - Upgrade plan (admin only)
- `POST /api/billing/downgrade` - Downgrade plan (validates usage fits)
- `POST /api/billing/cancel` - Cancel subscription

**Verify:** API endpoints return correct data, upgrade/downgrade logic works.

---

## Phase 6: Auth Flow Integration

**Modify:**
- `backend/src/auth/auth.service.ts` - Register: create Organization + trial Subscription (14 days, Tindahan plan). Login: include subscription info in response.
- `backend/src/auth/auth.module.ts` - Add Organization, SubscriptionPlan, Subscription to TypeOrmModule.forFeature

**Register flow becomes:**
1. Create Supabase user (existing)
2. Create User record (existing)
3. **Create Organization** (NEW)
4. Create Store, **set organization_id** (modified)
5. Create UserStore (existing)
6. **Create trial Subscription on Tindahan plan** (NEW)
7. Return JWT + stores + **subscription info** (modified)

**Login response adds:**
```json
{
  "subscription": {
    "status": "trial",
    "plan_code": "tindahan",
    "plan_name": "Tindahan",
    "trial_ends_at": "2026-03-01",
    "features": { "fifo_inventory": false, ... },
    "usage": { "stores": { "current": 1, "limit": 1 }, ... }
  }
}
```

**Verify:** Register creates org + trial, login returns subscription data, existing users unaffected.

---

## Phase 7: PayMongo Integration (Mock-first)

**New files:**
```
backend/src/payments/
  payments.module.ts
  payments.controller.ts
  payments.service.ts
  payment-gateway.interface.ts           # Abstract interface
  mock/mock-payment.service.ts           # Dev/test implementation
  paymongo/paymongo.service.ts           # Real PayMongo (when keys configured)
  paymongo/paymongo-webhook.controller.ts
```

**New migration:** `1707500000000-AddBillingTables.ts`
- CREATE `invoices` table
- CREATE `payments` table
- CREATE `payment_methods` table

**New entities:**
- `backend/src/database/entities/invoice.entity.ts`
- `backend/src/database/entities/payment.entity.ts`
- `backend/src/database/entities/payment-method.entity.ts`

**Factory pattern:** If `PAYMONGO_SECRET_KEY` env var is set, use real PayMongo; otherwise use mock.

**Environment Variables:**
```env
# .env
PAYMONGO_PUBLIC_KEY=pk_test_xxx
PAYMONGO_SECRET_KEY=sk_test_xxx
PAYMONGO_WEBHOOK_SECRET=whsec_xxx
```

**Endpoints:**
- `POST /api/payments/create-intent` - Create payment for subscription
- `POST /api/payments/webhook` - PayMongo webhook handler

**Verify:** Mock payments work in dev, webhook endpoint accepts test payloads.

---

## Phase 8: Billing Cron Jobs

**New file:**
- `backend/src/billing/subscription-renewal.service.ts`

**Cron jobs (using @nestjs/schedule, already installed):**
- Daily midnight: Process subscription renewals (charge default payment method)
- Every 6 hours: Retry failed payments (max 3 retries, then suspend)
- Daily 10 AM: Trial ending reminders (3-day, 1-day, expired)

**Implementation:**

```typescript
// Update cached usage stats daily
@Cron('0 0 * * *')
async updateUsageStats() {
  // For each active subscription
  // Count stores, users, products
  // Update subscription.usage_stats
}

// Process subscription renewals
@Cron('0 0 * * *') // Daily at midnight Manila time
async processRenewals() {
  // Find subscriptions expiring in next 24 hours
  // Create invoice for next period
  // Charge default payment method
  // Handle failures
}

// Retry failed payments
@Cron('0 */6 * * *') // Every 6 hours
async retryFailedPayments() {
  const failed = await this.findRecentFailedPayments();
  // Retry up to 3 times
  // Suspend subscription after max retries
}

// Send trial reminders
@Cron('0 10 * * *') // Daily at 10 AM Manila time
async sendTrialReminders() {
  // 3 days before trial ends
  // 1 day before trial ends
  // Trial ended today
}
```

**Verify:** Cron jobs fire on schedule, trial expiration updates status correctly.

---

## Verification Plan

1. **After Phase 1:** `npm run build` compiles, migration creates tables with `npx typeorm migration:run`
2. **After Phase 2-3:** Guards compile, unit test that legacy stores pass through
3. **After Phase 4:** `npm run build`, test existing API endpoints still return 200
4. **After Phase 5:** `GET /api/subscription-plans` returns 3 plans, billing endpoints work
5. **After Phase 6:** Register creates org+trial, login includes subscription
6. **After Phase 7-8:** Mock payment flow works end-to-end

## Implementation Order

Phases 1-6 are the **backend MVP** (~60 files created/modified). Phases 7-8 add payment processing. Frontend billing pages would be a separate follow-up task.

**Estimated scope per phase:**
| Phase | New Files | Modified Files |
|-------|-----------|---------------|
| 1 | 4 | 2 |
| 2 | 2 | 1 |
| 3 | 4 | 0 |
| 4 | 0 | ~12 (controllers + modules) |
| 5 | 6 | 2 |
| 6 | 0 | 2 |
| 7 | 10 | 3 |
| 8 | 1 | 1 |

---

## Philippine Market Considerations

### PayMongo Specifics

1. **GCash is King**
   - 76M users in PH
   - Preferred payment method
   - 2.5% fee (vs 3.5% + ₱15 for cards)
   - Requires redirect flow

2. **Currency & Amounts**
   - All amounts in PHP (centavos for API)
   - ₱799 = 79900 centavos
   - Always multiply by 100 before PayMongo API calls

3. **Tax Compliance**
   - 12% VAT on all invoices
   - Include organization TIN on invoices
   - BIR-compliant invoice format

4. **3D Secure**
   - Mandatory for card payments
   - Always set `request_three_d_secure: 'any'`

---

## Next Steps

### Immediate (This Week)

1. Review this implementation plan
2. Set up PayMongo test account
3. Create database entities
4. Run migrations

### Week 1-2

1. Implement Organizations module
2. Update auth flow to create trials
3. Seed subscription plans

### Week 3-4

1. Integrate PayMongo
2. Test GCash payment flow
3. Set up webhooks

### Week 5-6

1. Implement feature gating
2. Apply guards to existing modules
3. Test upgrade/downgrade flows

### Week 7-9

1. Build Angular billing pages
2. Test end-to-end flows
3. Deploy to production

---

## Success Metrics

After implementation, track:

- **Trial-to-Paid Conversion**: Target 15%+
- **Monthly Churn**: Target < 7%
- **Payment Success Rate**: Target 95%+
- **Average Revenue Per User (ARPU)**: Target ₱1,229
- **Customer Lifetime Value (LTV)**: Target ₱12,000+ (10 months)

---

## Support & Documentation

**For PayMongo Integration:**
- Docs: https://developers.paymongo.com/docs
- Test Cards: https://developers.paymongo.com/docs/testing
- Support: developers@paymongo.com

**For Questions:**
- Review CLAUDE.md, ARCHITECTURE.md, PROJECT_SUMMARY.md
- Check this implementation plan
- Test in PayMongo sandbox first

---

Good luck with implementation! 🚀
