# Subscription System Implementation Guide

**Implementation Date**: February 14-15, 2026
**Status**: ✅ Complete (Backend + Frontend)

---

## Overview

The subscription system implements a 3-tier SaaS billing model with feature gating, usage limits, and PayMongo payment integration. The system is designed to be backward-compatible with legacy stores while enforcing subscription rules for new organizations.

## Subscription Tiers

| Plan | Price (PHP/mo) | Features | Limits |
|------|----------------|----------|--------|
| **Tindahan** | ₱799 | POS, Basic Inventory | 1 store, 2 users/store, 500 products/store |
| **Negosyo** | ₱1,499 | + Reports, Utang, FIFO, Multi-Store, Receipts | 3 stores, 5 users/store, 2,000 products/store |
| **Kadena** | ₱2,999 | + Export Data | Unlimited stores, users, products |

### Feature Matrix

| Feature | Tindahan | Negosyo | Kadena |
|---------|----------|---------|--------|
| `pos` | ✅ | ✅ | ✅ |
| `basic_inventory` | ✅ | ✅ | ✅ |
| `reports` | ❌ | ✅ | ✅ |
| `utang_management` | ❌ | ✅ | ✅ |
| `fifo_inventory` | ❌ | ✅ | ✅ |
| `multi_store` | ❌ | ✅ | ✅ |
| `receipt_customization` | ❌ | ✅ | ✅ |
| `export_data` | ❌ | ❌ | ✅ |

---

## Backend Implementation (Feb 14, 2026)

### Database Schema

**New Entities** (6 total):
- `Organization` - Billing account that owns stores
- `SubscriptionPlan` - Plan definitions (seeded with 3 tiers)
- `Subscription` - Active subscription linking organization to plan
- `Invoice` - Billing invoices for subscription payments
- `Payment` - Payment records (renamed to BillingPaymentMethod internally to avoid conflict with Sale.PaymentMethod enum)
- `PaymentMethod` - Saved payment methods (GCash, Card)

**Relationships**:
```
Organization (1) → (many) Store
Organization (1) → (many) Subscription
Subscription (many) → (1) SubscriptionPlan
Organization (1) → (many) Invoice
Invoice (1) → (many) Payment
Organization (1) → (many) PaymentMethod
```

**Migration**: `1707400000000-AddSubscriptionTables.ts`
- Creates all 6 tables
- Seeds 3 subscription plans
- Migrates existing stores to organizations with 30-day Kadena trial

### Guards Architecture

**Guard Chain** (applied to all tenant controllers):
```typescript
@UseGuards(
  AuthGuard('jwt'),
  TenantGuard,
  SubscriptionGuard,    // NEW
  RolesGuard,
  PermissionsGuard,
  FeatureGateGuard,     // NEW
  UsageLimitGuard       // NEW
)
```

**SubscriptionGuard** (`common/guards/subscription.guard.ts`):
- Validates organization has active or trial subscription
- Injects `organizationId` and `subscription` into request context
- Passes through for legacy stores (no organization_id)
- Returns 402 if subscription is suspended/cancelled/expired

**FeatureGateGuard** (`common/guards/feature-gate.guard.ts`):
- Reads `@RequireFeature('feature_name')` decorator from controller method
- Validates subscription plan includes the required feature
- Returns 403 with upgrade message if feature unavailable

**UsageLimitGuard** (`common/guards/usage-limit.guard.ts`):
- Reads `@CheckLimit({ resource: 'products' })` decorator
- Queries current usage count (e.g., product count for store)
- Compares against plan limit
- Returns 403 if limit exceeded

### Applied Feature Gates

**Reports Endpoints** (`reports.controller.ts`):
```typescript
@Get('sales')
@RequireFeature('reports')
getSalesReport() { ... }
```

**Customer Credit Endpoints** (`customers.controller.ts`):
```typescript
@Get(':id/statement')
@RequireFeature('utang_management')
getStatement() { ... }

@Post(':id/payments')
@RequireFeature('utang_management')
recordPayment() { ... }
```

### Applied Usage Limits

**Products Controller**:
```typescript
@Post()
@CheckLimit({ resource: 'products' })
createProduct() { ... }
```

**Stores Controller**:
```typescript
@Post()
@CheckLimit({ resource: 'stores' })
createStore() { ... }
```

**Users Controller**:
```typescript
@Post()
@CheckLimit({ resource: 'users' })
createUser() { ... }
```

### Auth Flow Integration

**Register** (`auth.service.ts`):
1. Create User
2. Create Organization
3. Create Store with organization_id
4. Create UserStore membership
5. Create Subscription (14-day Tindahan trial)
6. Return subscription info in response

**Login** (`auth.service.ts`):
- Query user's organization through stores
- Load active subscription
- Return subscription data in LoginResponse

### Payment Integration

**PaymentGateway Interface** (`payments/payment-gateway.interface.ts`):
```typescript
interface PaymentGateway {
  createPaymentIntent(amount: number, currency: string): Promise<PaymentIntent>;
  createSourceRedirect(amount: number, type: 'gcash'): Promise<SourceRedirect>;
  verifyPayment(paymentId: string): Promise<boolean>;
}
```

**Implementations**:
- `MockPaymentService` - Development/testing (always succeeds)
- `PaymongoService` - Production (PayMongo API integration)

**Factory Pattern** (`payments/payment.service.ts`):
```typescript
if (process.env.PAYMONGO_SECRET_KEY) {
  return new PaymongoService();
} else {
  return new MockPaymentService();
}
```

### Cron Jobs

**Subscription Renewal** (`@Cron('0 0 * * *')`):
- Runs daily at midnight
- Finds subscriptions with `current_period_end` <= today
- Creates invoice, charges payment method
- Updates subscription period or suspends on failure

**Failed Payment Retry** (`@Cron('0 */6 * * *')`):
- Runs every 6 hours
- Finds pending invoices with retry_count < 3
- Retries payment
- Suspends subscription after 3 failures

**Trial Reminders** (`@Cron('0 10 * * *')`):
- Runs daily at 10 AM
- Sends email 3 days before trial end
- Sends email 1 day before trial end
- Sends email on trial expiry day

### API Endpoints

**Public**:
- `GET /api/subscription-plans` - List all available plans

**Authenticated**:
- `GET /api/billing/subscription` - Get current subscription + usage stats
- `GET /api/billing/usage` - Get resource counts vs limits
- `POST /api/billing/upgrade` - Upgrade to higher plan (admin only)
- `POST /api/billing/downgrade` - Downgrade plan (validates usage fits new limits)
- `POST /api/billing/cancel` - Cancel subscription (keeps data until period end)
- `POST /api/payments/create-intent` - Create payment intent for subscription
- `POST /api/payments/webhook` - PayMongo webhook handler (signature verification)

---

## Frontend Implementation (Feb 15, 2026)

### Core Services

**SubscriptionService** (`core/services/subscription.service.ts`):
```typescript
@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  // State signals
  subscription = signal<SubscriptionInfo | null>(null);
  availablePlans = signal<SubscriptionPlan[]>([]);

  // Computed signals
  hasActiveSubscription = computed(() => ...);
  currentPlan = computed(() => ...);
  isTrialing = computed(() => ...);

  // Methods
  hasFeature(feature: string): boolean { ... }
  hasFeatureSignal(feature: string): Signal<boolean> { ... }
  setSubscription(sub: SubscriptionInfo | null) { ... }
  loadPlans(): Observable<SubscriptionPlan[]> { ... }
  clear() { ... }
}
```

**Storage**: Subscription data persisted to `localStorage` with key `'subscription'`

**Initialization**: Auto-loads from localStorage on service construction

### Models

**SubscriptionInfo** (`core/models/subscription.model.ts`):
```typescript
interface SubscriptionInfo {
  status: 'trial' | 'active' | 'past_due' | 'suspended' | 'cancelled' | 'expired';
  plan_code: 'tindahan' | 'negosyo' | 'kadena';
  plan_name: string;
  trial_ends_at?: string;
  current_period_end?: string;
  features: Record<string, boolean>;
  usage: {
    max_stores: number;
    max_users_per_store: number;
    max_products_per_store: number;
  };
}
```

**SubscriptionFeature Enum**:
```typescript
enum SubscriptionFeature {
  POS = 'pos',
  BASIC_INVENTORY = 'basic_inventory',
  REPORTS = 'reports',
  UTANG_MANAGEMENT = 'utang_management',
  FIFO_INVENTORY = 'fifo_inventory',
  MULTI_STORE = 'multi_store',
  RECEIPT_CUSTOMIZATION = 'receipt_customization',
  EXPORT_DATA = 'export_data',
}
```

### Auth Integration

**Updated Response Interfaces**:
```typescript
interface LoginResponse {
  // ... existing fields
  subscription?: SubscriptionInfo;
}

interface RegisterResponse {
  // ... existing fields
  subscription?: SubscriptionInfo;
}
```

**AuthService Changes** (`core/services/auth.service.ts`):
```typescript
// Inject SubscriptionService
private subscriptionService = inject(SubscriptionService);

// On login/register success
if (res.subscription) {
  this.subscriptionService.setSubscription(res.subscription);
}

// On logout
this.subscriptionService.clear();
```

### Adaptive Navigation

**Sidebar** (`layout/sidebar/sidebar.ts`):

**Extended NavItem Interface**:
```typescript
interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
  requiresFeature?: string;  // NEW
}
```

**Updated visibleItems Getter**:
```typescript
get visibleItems(): NavItem[] {
  const isAdmin = this.storeContext.isAdmin();

  return this.navItems.filter((item) => {
    // Check role requirement
    if (item.adminOnly && !isAdmin) return false;

    // Check feature requirement
    if (item.requiresFeature) {
      return this.subscriptionService.hasFeature(item.requiresFeature);
    }

    return true;
  });
}
```

**Example Configuration**:
```typescript
{
  label: 'Reports',
  icon: 'pi-chart-bar',
  route: '/reports',
  adminOnly: true,
  requiresFeature: 'reports'  // Hidden for Tindahan plan
}
```

### Adaptive Dashboard

**Dashboard Component** (`features/dashboard/dashboard.ts`):

**Conditional API Calls**:
```typescript
private loadAllData() {
  const hasReports = this.subscriptionService.hasFeature('reports');

  // Always available endpoints
  this.http.get('/api/reports/sales', { params: { period: 'daily' } }).subscribe(...);
  this.http.get('/api/sales/daily').subscribe(...);
  this.http.get('/api/inventory/low-stock').subscribe(...);

  // Conditional reports endpoints
  if (this.storeCtx.isAdmin() && hasReports) {
    this.http.get('/api/reports/best-selling').subscribe(...);
    this.http.get('/api/reports/profit').subscribe(...);
    this.http.get('/api/reports/inventory').subscribe(...);
  } else {
    // Skip API calls, set loading states to false immediately
    this.topSellingLoading.set(false);
    this.profitLoading.set(false);
    this.inventoryLoading.set(false);
  }
}
```

**Upgrade Prompts** (`features/dashboard/dashboard.html`):
```html
@if (topSellingLoading()) {
  <!-- Skeleton loader -->
} @else if (!hasReportsFeature()) {
  <div class="upgrade-prompt">
    <i class="pi pi-lock upgrade-icon"></i>
    <p class="upgrade-title">Unlock Sales Analytics</p>
    <p class="upgrade-text">
      Track your best-selling products and analyze sales trends with the Negosyo plan
    </p>
    <a routerLink="/settings">
      <p-button label="Upgrade Now" icon="pi pi-arrow-up" size="small" />
    </a>
  </div>
} @else if (topSellingProducts().length === 0) {
  <!-- Empty state -->
} @else {
  <!-- Data display -->
}
```

**Upgrade Prompt Styles** (`features/dashboard/dashboard.scss`):
```scss
.upgrade-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 8px;
  border: 2px dashed #dee2e6;
  min-height: 200px;

  .upgrade-icon {
    font-size: 2.5rem;
    color: #6c757d;
    margin-bottom: 1rem;
  }

  .upgrade-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #212529;
    margin-bottom: 0.5rem;
  }

  .upgrade-text {
    font-size: 0.875rem;
    color: #6c757d;
    margin-bottom: 1.5rem;
    max-width: 300px;
  }

  &.compact {
    min-height: auto;
    padding: 1.5rem;
    // Smaller text and icon
  }
}
```

### Customer Feature Gating

**Customer List Component** (`features/customers/customer-list.ts`):
```typescript
private subscriptionService = inject(SubscriptionService);
hasUtangFeature = this.subscriptionService.hasFeatureSignal('utang_management');
```

**Customer Table Template** (`features/customers/components/customer-table/customer-table.html`):
```html
<td class="text-center actions-cell">
  @if (hasUtangFeature) {
    <p-button
      icon="pi pi-file"
      pTooltip="View Statement"
      (onClick)="viewStatement.emit(customer)"
    />
  }
  @if (hasUtangFeature && customer.current_balance > 0) {
    <p-button
      icon="pi pi-wallet"
      pTooltip="Record Payment"
      (onClick)="recordPayment.emit(customer)"
    />
  }
  @if (isAdmin) {
    <!-- Edit/Delete buttons always visible -->
  }
</td>
```

### Enhanced Error Handling

**Error Interceptor** (`core/interceptors/error.interceptor.ts`):
```typescript
switch (error.status) {
  case 402:
    toast.error(
      'Subscription Required',
      'Your subscription is inactive. Please renew to continue.',
      { life: 6000 }
    );
    break;

  case 403:
    // Check if it's a subscription feature gate error
    if (message.includes('does not include this feature') || message.includes('Please upgrade')) {
      toast.error(
        'Feature Locked',
        'This feature requires an upgraded plan. Visit Settings to upgrade.',
        { life: 5000 }
      );
    } else {
      toast.error('Access Denied', message);
    }
    break;
}
```

---

## Implementation Checklist

### Backend ✅
- [x] Create subscription entities (Organization, SubscriptionPlan, Subscription, Invoice, Payment, PaymentMethod)
- [x] Write migration with table creation + plan seeding
- [x] Implement SubscriptionGuard (validates active subscription)
- [x] Implement FeatureGateGuard + @RequireFeature decorator
- [x] Implement UsageLimitGuard + @CheckLimit decorator
- [x] Apply guards to all tenant controllers
- [x] Update auth flow (register creates org + subscription, login returns subscription)
- [x] Implement subscription-plans module (public endpoint)
- [x] Implement billing module (subscription management)
- [x] Implement payments module (PayMongo integration)
- [x] Implement cron jobs (renewals, retries, reminders)

### Frontend ✅
- [x] Create SubscriptionService with signals + localStorage
- [x] Create subscription models (SubscriptionInfo, SubscriptionPlan, SubscriptionFeature enum)
- [x] Update LoginResponse/RegisterResponse to include subscription
- [x] Integrate with AuthService (persist/clear subscription)
- [x] Update sidebar to filter by requiresFeature
- [x] Update dashboard to conditionally call reports APIs
- [x] Create upgrade prompt components/styles
- [x] Update customers page to gate credit features
- [x] Enhance error interceptor for 402/403 errors

---

## Testing Checklist

### Subscription Persistence
- [ ] Register new account → subscription saved to localStorage
- [ ] Refresh page → subscription persists
- [ ] Logout → subscription cleared
- [ ] Login → subscription restored

### Tindahan Plan (Feature Restrictions)
- [ ] Reports menu hidden in sidebar
- [ ] Dashboard shows upgrade prompts for Top Selling, Profit, Inventory sections
- [ ] No 403 errors in console (API calls skipped)
- [ ] Credit statement/payment buttons hidden in Customers page
- [ ] Basic features work (POS, Products, Inventory, Sales, Customers CRUD)

### Negosyo/Kadena Plan (Full Access)
- [ ] Reports menu visible
- [ ] Dashboard loads all sections with data
- [ ] No upgrade prompts visible
- [ ] Credit features fully functional

### Error Handling
- [ ] 403 feature gate error → "Feature Locked" toast with upgrade CTA
- [ ] 402 subscription inactive → "Subscription Required" toast
- [ ] No technical stack traces shown to users

### Backend Guards
- [ ] SubscriptionGuard blocks suspended subscriptions (402)
- [ ] FeatureGateGuard blocks unavailable features (403)
- [ ] UsageLimitGuard blocks exceeded limits (403)
- [ ] Legacy stores (no organization_id) pass through guards

---

## Future Enhancements

### Frontend
- [ ] Route guard to block direct URL access to restricted pages
- [ ] Structural directive `*appRequireFeature` for inline feature gating
- [ ] Reusable `UpgradePromptComponent`
- [ ] Subscription settings page (`/settings/subscription`) with plan comparison
- [ ] Real-time subscription updates via WebSocket

### Backend
- [ ] Metered billing (pay-per-transaction for high-volume stores)
- [ ] Annual subscription discount (2 months free)
- [ ] Add-on features (SMS notifications, email marketing, loyalty program)
- [ ] Reseller/agency accounts (manage multiple client organizations)
- [ ] Usage analytics dashboard for organization owners

### Business
- [ ] Free tier (limited to 1 store, 1 user, 50 products, no reports)
- [ ] Enterprise tier (custom pricing, dedicated support, white-label)
- [ ] Partner integrations (accounting software, e-commerce platforms)

---

## Related Files

### Backend
- `backend/src/database/migrations/1707400000000-AddSubscriptionTables.ts`
- `backend/src/database/entities/organization.entity.ts`
- `backend/src/database/entities/subscription.entity.ts`
- `backend/src/database/entities/subscription-plan.entity.ts`
- `backend/src/database/entities/invoice.entity.ts`
- `backend/src/database/entities/payment.entity.ts`
- `backend/src/common/guards/subscription.guard.ts`
- `backend/src/common/guards/feature-gate.guard.ts`
- `backend/src/common/guards/usage-limit.guard.ts`
- `backend/src/common/decorators/require-feature.decorator.ts`
- `backend/src/common/decorators/check-limit.decorator.ts`
- `backend/src/subscription-plans/subscription-plans.module.ts`
- `backend/src/billing/billing.module.ts`
- `backend/src/payments/payments.module.ts`
- `backend/src/billing/subscription-renewal.service.ts`

### Frontend
- `frontend/src/app/core/services/subscription.service.ts`
- `frontend/src/app/core/models/subscription.model.ts`
- `frontend/src/app/core/services/auth.service.ts`
- `frontend/src/app/core/models/user.model.ts`
- `frontend/src/app/layout/sidebar/sidebar.ts`
- `frontend/src/app/features/dashboard/dashboard.ts`
- `frontend/src/app/features/dashboard/dashboard.html`
- `frontend/src/app/features/dashboard/dashboard.scss`
- `frontend/src/app/features/customers/customer-list.ts`
- `frontend/src/app/features/customers/customer-list.html`
- `frontend/src/app/features/customers/components/customer-table/customer-table.ts`
- `frontend/src/app/features/customers/components/customer-table/customer-table.html`
- `frontend/src/app/core/interceptors/error.interceptor.ts`

### Documentation
- `CLAUDE.md` - Updated with subscription patterns
- `PROJECT_SUMMARY.md` - Updated with subscription status
- `MEMORY.md` - Updated with subscription implementation notes
- `SUBSCRIPTION_IMPLEMENTATION.md` - This file

---

**Last Updated**: February 15, 2026
**Contributors**: Claude Code + Prince Ivan Kent
