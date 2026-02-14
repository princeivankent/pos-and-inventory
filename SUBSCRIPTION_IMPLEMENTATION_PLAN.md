# Subscription & Payment Implementation Plan

## Overview

This document outlines the implementation plan for adding subscription-based billing and feature gating to the POS & Inventory Management System.

## Pricing Tiers

| Tier | Price | Max Stores | Max Users | Max Products | Key Features |
|------|-------|-----------|-----------|--------------|--------------|
| **Tindahan** | ₱799/mo | 1 | 2 | 500 | Basic POS, Inventory, Receipts, VAT |
| **Negosyo** | ₱1,499/mo | 3 | 5 | 2,000 | + FIFO, Reports, Utang management |
| **Kadena** | ₱2,999/mo | Unlimited | Unlimited | Unlimited | + Multi-store, Advanced reports, API access |

**Trial Period**: 14 days free trial on all plans

## Implementation Phases

### Phase 1: Database Foundation (Week 1)

**New Entities to Create:**

1. **Organization** (`organization.entity.ts`)
   - Core billing account entity
   - Links multiple users and stores
   - Owner: Single user who created the account
   - Has one active subscription

2. **SubscriptionPlan** (`subscription-plan.entity.ts`)
   - Plan definitions (Tindahan, Negosyo, Kadena)
   - Pricing and limits
   - Feature flags (JSONB)

3. **Subscription** (`subscription.entity.ts`)
   - Links Organization to SubscriptionPlan
   - Status: trial, active, past_due, canceled, expired
   - Tracks billing periods and usage stats

4. **Invoice** (`invoice.entity.ts`)
   - Generated monthly for subscriptions
   - Stores line items and amounts (with 12% VAT)
   - Links to payments

5. **Payment** (`payment.entity.ts`)
   - Records all payment attempts
   - Links to PayMongo payment IDs
   - Tracks status and gateway fees

6. **PaymentMethod** (`payment-method.entity.ts`)
   - Stores customer payment methods (GCash, cards)
   - Links to PayMongo customer/payment method IDs
   - Default payment method per organization

7. **FeatureUsageLog** (`feature-usage-log.entity.ts`)
   - Audit log of feature access attempts
   - Tracks granted and denied feature usage

**Migration Steps:**

```bash
# 1. Create new entities
npm run migration:generate -- AddSubscriptionTables

# 2. Add organization_id to existing entities
# Modify: User, Store entities

# 3. Run migration
npm run migration:run
```

**Data Migration Strategy:**

For existing users/stores, create one Organization per user and link their stores to it:

```typescript
// Migration: Create organizations for existing data
// - Each existing user gets their own organization
// - All stores they own are linked to that organization
// - Create trial subscription for each organization
```

---

### Phase 2: Organizations Module (Week 1-2)

**Create Module:**

```
backend/src/organizations/
├── organizations.module.ts
├── organizations.service.ts
├── organizations.controller.ts
└── dto/
    ├── create-organization.dto.ts
    └── update-organization.dto.ts
```

**Key Features:**
- CRUD operations for organizations
- Link users/stores to organizations
- Update billing details (TIN, address, email)

**Modify Auth Flow:**

Update `auth.service.ts` registration:
1. Create Supabase user
2. **Create Organization** (NEW)
3. Create User (link to organization)
4. Create default Store (link to organization)
5. **Create trial Subscription** (NEW)
6. Return JWT + subscription status

---

### Phase 3: Subscription Plans Module (Week 2)

**Create Module:**

```
backend/src/subscription-plans/
├── subscription-plans.module.ts
├── subscription-plans.service.ts
├── subscription-plans.controller.ts
└── dto/
    └── create-plan.dto.ts
```

**Endpoints:**
- `GET /api/subscription-plans` - Public endpoint listing available plans
- `POST /api/admin/subscription-plans` - Admin: Create/update plans

**Seed Data:**

Create seeder script to populate 3 plans:

```typescript
// seeds/subscription-plans.seed.ts
const plans = [
  {
    plan_code: 'tindahan',
    name: 'Tindahan',
    name_tagalog: 'Tindahan',
    price_php: 799,
    max_stores: 1,
    max_users_per_store: 2,
    max_products_per_store: 500,
    features: {
      fifo_inventory: false,
      utang_management: false,
      reports: false,
      api_access: false,
    },
  },
  {
    plan_code: 'negosyo',
    name: 'Negosyo',
    name_tagalog: 'Negosyo',
    price_php: 1499,
    max_stores: 3,
    max_users_per_store: 5,
    max_products_per_store: 2000,
    features: {
      fifo_inventory: true,
      utang_management: true,
      reports: true,
      api_access: false,
    },
  },
  {
    plan_code: 'kadena',
    name: 'Kadena',
    name_tagalog: 'Kadena',
    price_php: 2999,
    max_stores: null, // unlimited
    max_users_per_store: null,
    max_products_per_store: null,
    features: {
      fifo_inventory: true,
      utang_management: true,
      reports: true,
      api_access: true,
      advanced_analytics: true,
    },
  },
];
```

---

### Phase 4: Billing Module - Core (Week 2-3)

**Create Module:**

```
backend/src/billing/
├── billing.module.ts
├── billing.service.ts
├── billing.controller.ts
├── subscription.service.ts
├── invoice.service.ts
├── usage-tracker.service.ts
└── dto/
    ├── create-subscription.dto.ts
    ├── upgrade-plan.dto.ts
    └── cancel-subscription.dto.ts
```

**Key Services:**

1. **SubscriptionService**
   - Create trial subscriptions
   - Upgrade/downgrade plans
   - Cancel subscriptions
   - Track billing periods

2. **InvoiceService**
   - Generate monthly invoices
   - Calculate VAT (12%)
   - Apply credits/prorations
   - Generate PDF invoices

3. **UsageTrackerService**
   - Count stores per organization
   - Count users per organization
   - Count products across all stores
   - Cache usage stats daily (cron job)

**Cron Jobs:**

```typescript
// Update cached usage stats daily
@Cron('0 0 * * *')
async updateUsageStats() {
  // For each active subscription
  // Count stores, users, products
  // Update subscription.usage_stats
}
```

**Endpoints:**

```typescript
// Customer endpoints
GET    /api/billing/subscription        // Get current subscription
POST   /api/billing/upgrade              // Upgrade to higher plan
POST   /api/billing/downgrade            // Downgrade to lower plan
POST   /api/billing/cancel               // Cancel subscription
GET    /api/billing/invoices             // List invoices
GET    /api/billing/invoices/:id/pdf     // Download invoice PDF
GET    /api/billing/usage                // Current usage stats
```

---

### Phase 5: PayMongo Integration (Week 3-4)

**Create Module:**

```
backend/src/payments/
├── payments.module.ts
├── payments.service.ts
├── payments.controller.ts
├── payment-method.service.ts
├── paymongo/
│   ├── paymongo.service.ts
│   ├── paymongo-webhook.controller.ts
│   └── paymongo.config.ts
└── dto/
    ├── create-payment-intent.dto.ts
    └── attach-payment-method.dto.ts
```

**Environment Variables:**

```env
# .env
PAYMONGO_PUBLIC_KEY=pk_test_xxx
PAYMONGO_SECRET_KEY=sk_test_xxx
PAYMONGO_WEBHOOK_SECRET=whsec_xxx
```

**PayMongoService - Key Methods:**

```typescript
class PayMongoService {
  // Create payment intent for one-time payments
  createPaymentIntent(amount: number, description: string)

  // Attach payment method to intent
  attachPaymentMethod(paymentIntentId, paymentMethodId)

  // Create GCash source (redirect flow)
  createSource(amount: number, type: 'gcash')

  // Create payment from source (after redirect)
  createPaymentFromSource(sourceId: string)

  // Retrieve payment status
  retrievePayment(paymentId: string)

  // Verify webhook signature
  verifyWebhookSignature(payload, signature)
}
```

**Webhook Events to Handle:**

```typescript
@Post('webhooks/paymongo')
async handleWebhook(@Body() payload, @Headers('paymongo-signature') sig) {
  // 1. Verify signature
  // 2. Check for duplicate events
  // 3. Handle events:

  switch (event.type) {
    case 'payment.paid':
      // Mark payment as succeeded
      // Mark invoice as paid
      // Activate subscription
      // Send receipt email
      break;

    case 'payment.failed':
      // Mark payment as failed
      // Mark subscription as past_due
      // Send payment failed email
      break;

    case 'source.chargeable':
      // GCash authorization complete
      // Create payment from source
      break;
  }
}
```

**Payment Flows:**

**1. GCash Payment Flow (Most common in PH):**

```
1. Backend: Create GCash source → Get checkout URL
2. Frontend: Redirect user to PayMongo checkout
3. User: Authorizes payment in GCash app
4. PayMongo: Redirects back to app
5. Backend: Receives 'source.chargeable' webhook
6. Backend: Creates payment from source
7. Backend: Receives 'payment.paid' webhook
8. Backend: Activates subscription
```

**2. Card Payment Flow:**

```
1. Backend: Create payment intent
2. Frontend: Collect card details via PayMongo.js
3. Frontend: Attach payment method to intent
4. PayMongo: 3D Secure redirect (if needed)
5. Backend: Receives 'payment.paid' webhook
6. Backend: Activates subscription
```

**Endpoints:**

```typescript
// Payment endpoints
POST   /api/payments/create-intent          // Create payment intent
POST   /api/payments/create-gcash-source    // Create GCash source
POST   /api/payments/attach-method          // Attach payment method
GET    /api/payments/:id                    // Get payment status
POST   /api/payments/webhook                // PayMongo webhook

// Payment method management
GET    /api/payment-methods                 // List saved methods
POST   /api/payment-methods                 // Add payment method
DELETE /api/payment-methods/:id             // Remove method
POST   /api/payment-methods/:id/set-default // Set as default
```

---

### Phase 6: Feature Gating (Week 4-5)

**Create Guards:**

```
backend/src/common/guards/
├── subscription.guard.ts      # Check active subscription
├── feature-gate.guard.ts      # Check feature access
└── usage-limit.guard.ts       # Check usage limits
```

**1. SubscriptionGuard**

Validates organization has an active subscription (trial or paid).

```typescript
@UseGuards(AuthGuard('jwt'), TenantGuard, SubscriptionGuard)
export class SalesController {
  // All endpoints require active subscription
}
```

**2. FeatureGateGuard**

Checks if plan includes specific features.

```typescript
@Get('fifo-report')
@UseGuards(AuthGuard('jwt'), TenantGuard, SubscriptionGuard, FeatureGateGuard)
@RequireFeature('fifo_inventory')
async getFifoReport() {
  // Only Negosyo and Kadena plans can access
}
```

**3. UsageLimitGuard**

Enforces count limits (stores, users, products).

```typescript
@Post('stores')
@UseGuards(AuthGuard('jwt'), SubscriptionGuard, UsageLimitGuard)
@CheckLimit({ resource: 'stores', action: 'create' })
async createStore() {
  // Blocked if at limit
}
```

**Decorators:**

```typescript
// Check if plan has feature
@RequireFeature('fifo_inventory')
@RequireFeature('utang_management', 'reports')

// Check resource limits before creation
@CheckLimit({ resource: 'stores', action: 'create' })
@CheckLimit({ resource: 'users', action: 'create' })
@CheckLimit({ resource: 'products', action: 'create' })

// Extract organization from request
@CurrentOrganization() organizationId: string
```

**Apply Guards to Existing Modules:**

| Module | Guard/Decorator | Purpose |
|--------|----------------|---------|
| Products | `@CheckLimit({ resource: 'products' })` | Block creating products beyond plan limit |
| Users | `@CheckLimit({ resource: 'users' })` | Block adding users beyond plan limit |
| Stores | `@CheckLimit({ resource: 'stores' })` | Block creating stores beyond plan limit |
| Inventory (FIFO) | `@RequireFeature('fifo_inventory')` | Negosyo+ only |
| Reports | `@RequireFeature('reports')` | Negosyo+ only |
| Credit/Utang | `@RequireFeature('utang_management')` | Negosyo+ only |

**Custom Exceptions:**

```typescript
// Throw when subscription inactive
export class PaymentRequiredException extends HttpException {
  constructor(details: {
    message: string;
    status?: string;
    renewUrl?: string;
  }) {
    super({
      statusCode: 402, // Payment Required
      error: 'Payment Required',
      ...details,
    }, 402);
  }
}

// Throw when feature not available in plan
export class FeatureNotAvailableException extends ForbiddenException {
  constructor(feature: string, currentPlan: string, requiredPlan: string) {
    super({
      message: `This feature requires ${requiredPlan} plan`,
      feature,
      currentPlan,
      upgradeUrl: '/billing/upgrade',
    });
  }
}
```

---

### Phase 7: Billing Flows (Week 5-6)

**1. Subscription Renewal (Automated)**

```typescript
// billing/subscription-renewal.service.ts

@Cron('0 0 * * *') // Daily at midnight Manila time
async processRenewals() {
  // Find subscriptions expiring in next 24 hours
  const expiring = await this.findExpiringSubscriptions();

  for (const subscription of expiring) {
    // 1. Create invoice for next period
    const invoice = await this.invoiceService.create({
      organization_id: subscription.organization_id,
      subscription_id: subscription.id,
      amount: subscription.plan.price_php,
    });

    // 2. Charge default payment method
    const paymentMethod = await this.getDefaultPaymentMethod(subscription);

    if (!paymentMethod) {
      // No payment method - mark past_due
      await this.markAsPastDue(subscription);
      await this.sendPaymentMethodRequiredEmail(subscription);
      continue;
    }

    // 3. Attempt charge
    try {
      await this.paymentService.charge({
        invoice_id: invoice.id,
        payment_method_id: paymentMethod.id,
        amount: invoice.total_amount,
      });

      // Payment processed via webhook
      // If successful, subscription extended

    } catch (error) {
      await this.handleRenewalFailure(subscription, error);
    }
  }
}
```

**2. Payment Retry Logic**

```typescript
@Cron('0 */6 * * *') // Every 6 hours
async retryFailedPayments() {
  const failed = await this.findRecentFailedPayments();

  for (const payment of failed) {
    const retryCount = await this.getRetryCount(payment.id);

    if (retryCount >= 3) {
      // Max retries - suspend subscription
      await this.subscriptionService.suspend(
        payment.invoice.subscription_id,
        'Payment failed after 3 retries'
      );
      continue;
    }

    // Retry payment
    await this.paymentService.retry(payment.id);
  }
}
```

**3. Upgrade Flow**

```typescript
async upgradePlan(
  organizationId: string,
  newPlanCode: string,
  immediate: boolean = true,
) {
  const subscription = await this.getCurrentSubscription(organizationId);
  const newPlan = await this.planService.findByCode(newPlanCode);

  if (immediate) {
    // Calculate proration
    const proration = this.calculateProration(subscription, newPlan);

    // Charge difference immediately
    const invoice = await this.invoiceService.createProration({
      organization_id: organizationId,
      amount: proration,
      description: `Upgrade to ${newPlan.name} (prorated)`,
    });

    await this.paymentService.chargeDefault(organizationId, invoice.id);

    // Update subscription plan immediately
    await this.subscriptionService.updatePlan(subscription.id, newPlan.id);

    return { success: true, charged: proration };

  } else {
    // Schedule upgrade for next renewal
    await this.subscriptionService.schedulePlanChange(subscription.id, newPlan.id);

    return { success: true, effectiveDate: subscription.current_period_end };
  }
}
```

**4. Downgrade Flow**

```typescript
async downgradePlan(
  organizationId: string,
  newPlanCode: string,
) {
  const subscription = await this.getCurrentSubscription(organizationId);
  const newPlan = await this.planService.findByCode(newPlanCode);

  // Check if current usage fits in new plan
  const usage = await this.usageTracker.getCurrentUsage(organizationId);
  const violations = this.checkUsageViolations(usage, newPlan);

  if (violations.length > 0) {
    throw new BadRequestException({
      message: 'Cannot downgrade: usage exceeds plan limits',
      violations, // e.g., { resource: 'stores', current: 5, limit: 3 }
      action_required: 'Please reduce usage before downgrading',
    });
  }

  // Schedule downgrade for end of billing period (no refunds)
  await this.subscriptionService.schedulePlanChange(
    subscription.id,
    newPlan.id,
    subscription.current_period_end,
  );

  return {
    success: true,
    effectiveDate: subscription.current_period_end,
    message: 'Plan will change at end of current billing period',
  };
}
```

**5. Cancellation Flow**

```typescript
async cancelSubscription(
  organizationId: string,
  reason: string,
  immediate: boolean = false,
) {
  const subscription = await this.getCurrentSubscription(organizationId);

  if (immediate) {
    // Cancel immediately (no refund)
    await this.subscriptionService.cancelNow(subscription.id, reason);

    return {
      success: true,
      access_until: new Date(), // Loses access immediately
    };

  } else {
    // Cancel at end of billing period (default)
    await this.subscriptionService.update(subscription.id, {
      cancel_at_period_end: true,
      cancellation_reason: reason,
    });

    return {
      success: true,
      access_until: subscription.current_period_end,
      message: 'Subscription will end at period close',
    };
  }
}
```

**6. Trial-to-Paid Conversion**

```typescript
// Send reminders before trial ends
@Cron('0 10 * * *') // Daily at 10 AM Manila time
async sendTrialReminders() {
  // 3 days before trial ends
  const threeDaysOut = await this.findTrialsEndingIn(3);
  for (const sub of threeDaysOut) {
    await this.emailService.sendTrialEnding3Days(sub);
  }

  // 1 day before trial ends
  const oneDayOut = await this.findTrialsEndingIn(1);
  for (const sub of oneDayOut) {
    await this.emailService.sendTrialEndingTomorrow(sub);
  }

  // Trial ended today
  const expiredToday = await this.findTrialsEndedToday();
  for (const sub of expiredToday) {
    // Check if they added payment method
    const hasPayment = await this.hasValidPaymentMethod(sub.organization_id);

    if (hasPayment) {
      // Charge and activate
      await this.chargeFirstPayment(sub);
    } else {
      // Expire subscription
      await this.subscriptionService.expire(sub.id);
      await this.emailService.sendTrialExpired(sub);
    }
  }
}
```

---

### Phase 8: Admin Features (Week 6-7)

**Admin Endpoints:**

```typescript
@Controller('admin/subscriptions')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminSubscriptionsController {

  // List all subscriptions with filters
  @Get()
  async listAll(@Query() filters: SubscriptionFilterDto) {
    return await this.subscriptionService.findAllWithFilters(filters);
  }

  // View subscription details
  @Get(':id')
  async getDetails(@Param('id') id: string) {
    return await this.subscriptionService.findOneWithDetails(id);
  }

  // Extend trial manually
  @Post(':id/extend-trial')
  async extendTrial(
    @Param('id') id: string,
    @Body() dto: { days: number; reason: string },
    @CurrentUser() admin: User,
  ) {
    return await this.subscriptionService.extendTrial(
      id,
      dto.days,
      dto.reason,
      admin.id,
    );
  }

  // Comp subscription (free access)
  @Post(':id/comp')
  async compSubscription(
    @Param('id') id: string,
    @Body() dto: { until: Date; reason: string },
    @CurrentUser() admin: User,
  ) {
    return await this.subscriptionService.comp(
      id,
      dto.until,
      dto.reason,
      admin.id,
    );
  }

  // Force cancel subscription
  @Post(':id/force-cancel')
  async forceCancel(
    @Param('id') id: string,
    @Body() dto: { reason: string },
    @CurrentUser() admin: User,
  ) {
    return await this.subscriptionService.adminCancel(id, dto.reason, admin.id);
  }

  // View usage metrics
  @Get(':id/usage')
  async getUsageMetrics(@Param('id') id: string) {
    return await this.usageTracker.getDetailedUsage(id);
  }

  // View payment history
  @Get(':id/payments')
  async getPayments(@Param('id') id: string) {
    return await this.paymentService.findBySubscription(id);
  }
}
```

**Analytics Dashboard Endpoints:**

```typescript
@Controller('admin/analytics')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminAnalyticsController {

  // Revenue metrics
  @Get('revenue')
  async getRevenueMetrics(@Query() period: PeriodDto) {
    return {
      mrr: await this.calculateMRR(),
      arr: await this.calculateARR(),
      churn_rate: await this.calculateChurnRate(period),
      new_subscriptions: await this.countNewSubscriptions(period),
      canceled_subscriptions: await this.countCancellations(period),
    };
  }

  // Plan distribution
  @Get('plan-distribution')
  async getPlanDistribution() {
    return await this.subscriptionService.countByPlan();
  }

  // Payment success rate
  @Get('payment-success-rate')
  async getPaymentSuccessRate(@Query() period: PeriodDto) {
    return await this.paymentService.calculateSuccessRate(period);
  }
}
```

---

### Phase 9: Frontend Integration Points (Week 7-8)

**API Endpoints for Frontend:**

```typescript
// Auth response now includes subscription
POST /api/auth/login
{
  access_token: "...",
  user: {...},
  stores: [...],
  subscription: {
    status: "trial",
    plan_code: "tindahan",
    plan_name: "Tindahan",
    trial_ends_at: "2026-03-01T00:00:00Z",
    days_remaining: 12,
    usage: {
      stores: { current: 1, limit: 1 },
      users: { current: 2, limit: 2 },
      products: { current: 150, limit: 500 }
    },
    features: {
      fifo_inventory: false,
      utang_management: false,
      reports: false,
      api_access: false
    }
  }
}

// Get current subscription
GET /api/billing/subscription

// Get available plans
GET /api/subscription-plans

// Get usage stats
GET /api/billing/usage

// Create payment intent
POST /api/payments/create-intent
{
  plan_code: "negosyo",
  billing_interval: "monthly"
}
Response: {
  payment_intent_id: "pi_xxx",
  client_key: "pi_xxx_client",
  amount: 149900, // ₱1,499 in centavos
  publishable_key: "pk_xxx"
}

// Create GCash source (for GCash payment)
POST /api/payments/create-gcash-source
{
  plan_code: "negosyo"
}
Response: {
  source_id: "src_xxx",
  checkout_url: "https://checkout.paymongo.com/...",
  redirect_success: "https://yourapp.com/billing/success",
  redirect_failed: "https://yourapp.com/billing/failed"
}

// Upgrade plan
POST /api/billing/upgrade
{
  plan_code: "kadena",
  immediate: true
}

// Downgrade plan
POST /api/billing/downgrade
{
  plan_code: "tindahan"
}

// Cancel subscription
POST /api/billing/cancel
{
  reason: "Closing business",
  immediate: false
}

// Get invoices
GET /api/billing/invoices?limit=10&offset=0

// Download invoice PDF
GET /api/billing/invoices/:id/pdf
```

**Error Response Format:**

When guards block access, return helpful upgrade prompts:

```typescript
// 402 Payment Required (subscription inactive)
{
  statusCode: 402,
  error: "Payment Required",
  message: "Your trial has expired. Please subscribe to continue.",
  subscription_status: "expired",
  upgrade_url: "/billing/upgrade"
}

// 403 Forbidden (feature not in plan)
{
  statusCode: 403,
  error: "Forbidden",
  message: "This feature requires Negosyo plan",
  feature: "fifo_inventory",
  current_plan: "tindahan",
  required_plan: "negosyo",
  upgrade_url: "/billing/upgrade"
}

// 403 Forbidden (usage limit reached)
{
  statusCode: 403,
  error: "Forbidden",
  message: "You've reached the limit of 500 products",
  resource: "products",
  limit: 500,
  current: 500,
  upgrade_url: "/billing/upgrade"
}
```

---

### Phase 10: Testing & Production Readiness (Week 8-9)

**Testing Checklist:**

- [ ] Unit tests for all services
- [ ] Integration tests for payment flows
- [ ] Test webhook handling with PayMongo test mode
- [ ] Test subscription lifecycle (trial → paid → renewal)
- [ ] Test upgrade/downgrade flows
- [ ] Test usage limit enforcement
- [ ] Test feature gating
- [ ] Test payment failure scenarios
- [ ] Load test guards (don't slow down API)
- [ ] Test GCash redirect flow end-to-end
- [ ] Test card payment with 3D Secure
- [ ] Test proration calculations
- [ ] Test email notifications

**Performance Optimization:**

```typescript
// 1. Cache subscription in request to avoid repeated DB queries
// 2. Add database indexes:
CREATE INDEX idx_subscriptions_org_status ON subscriptions(organization_id, status);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end);
CREATE INDEX idx_payments_paymongo_id ON payments(paymongo_payment_id);
CREATE INDEX idx_invoices_org_created ON invoices(organization_id, created_at);

// 3. Cache subscription data (5-minute TTL)
@UseInterceptors(CacheInterceptor)

// 4. Batch usage calculations (cron instead of real-time)
```

**Security Checklist:**

- [ ] Verify webhook signatures
- [ ] Prevent duplicate webhook processing
- [ ] Validate plan changes (can't downgrade if over limits)
- [ ] Check for race conditions in usage limits
- [ ] Sanitize user input in cancellation reasons
- [ ] Rate limit payment endpoints
- [ ] Log all subscription changes for audit
- [ ] Encrypt payment method details
- [ ] Use environment variables for API keys

**Production Deployment:**

1. Set up PayMongo production account
2. Get live API keys and webhook secret
3. Configure webhook URL: `https://api.yourapp.com/webhooks/paymongo`
4. Set up email service (SendGrid/Resend for transactional emails)
5. Configure cron jobs (subscription renewals, trial reminders)
6. Set up monitoring (Sentry for errors, Datadog for metrics)
7. Create admin user for subscription management
8. Prepare customer support scripts for payment issues

---

## Critical Files to Create/Modify

### New Files (Priority Order)

1. **Database Entities** (Week 1)
   - `backend/src/database/entities/organization.entity.ts`
   - `backend/src/database/entities/subscription-plan.entity.ts`
   - `backend/src/database/entities/subscription.entity.ts`
   - `backend/src/database/entities/invoice.entity.ts`
   - `backend/src/database/entities/payment.entity.ts`
   - `backend/src/database/entities/payment-method.entity.ts`
   - `backend/src/database/entities/feature-usage-log.entity.ts`

2. **Guards** (Week 4)
   - `backend/src/common/guards/subscription.guard.ts` ⚠️ **CRITICAL**
   - `backend/src/common/guards/feature-gate.guard.ts` ⚠️ **CRITICAL**
   - `backend/src/common/guards/usage-limit.guard.ts` ⚠️ **CRITICAL**

3. **PayMongo Integration** (Week 3)
   - `backend/src/payments/paymongo/paymongo.service.ts` ⚠️ **CRITICAL**
   - `backend/src/payments/paymongo/paymongo-webhook.controller.ts` ⚠️ **CRITICAL**
   - `backend/src/payments/paymongo/paymongo.config.ts`

4. **Services** (Weeks 2-6)
   - `backend/src/organizations/organizations.service.ts`
   - `backend/src/billing/subscription.service.ts`
   - `backend/src/billing/invoice.service.ts`
   - `backend/src/billing/usage-tracker.service.ts`
   - `backend/src/billing/subscription-renewal.service.ts`
   - `backend/src/payments/payments.service.ts`
   - `backend/src/payments/payment-method.service.ts`

### Files to Modify

1. **Auth Service** (Week 2)
   - `backend/src/auth/auth.service.ts`
     - Update `register()` to create Organization and trial Subscription
     - Update `login()` to return subscription status

2. **Existing Entities** (Week 1)
   - `backend/src/database/entities/user.entity.ts`
     - Add `organization_id` column
   - `backend/src/database/entities/store.entity.ts`
     - Add `organization_id` column

3. **Apply Guards** (Week 5)
   - `backend/src/products/products.controller.ts`
   - `backend/src/users/users.controller.ts`
   - `backend/src/stores/stores.controller.ts`
   - `backend/src/inventory/inventory.controller.ts`
   - `backend/src/sales/sales.controller.ts`
   - `backend/src/reports/reports.controller.ts`

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

### Email Templates (Taglish)

Use Filipino-friendly language:

```
Subject: Your free trial ends in 3 days! 🎉

Hi Juan,

Your 14-day free trial of POS Tindahan ends in 3 days.

To continue using the system:
1. Go to Settings > Billing
2. Choose your plan
3. Pay via GCash or card

Questions? Reply to this email.

Salamat,
POS Team
```

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
