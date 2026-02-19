# Subscription System Testing Guide

## Prerequisites

Before testing, ensure:

1. **Database Migration Has Run**
   ```bash
   cd backend
   npm run migration:run
   ```
   This creates the `organizations`, `subscription_plans`, and `subscriptions` tables, and seeds the 3 plans.

2. **Backend is Running**
   ```bash
   cd backend
   npm run start:dev
   ```

3. **Environment Variables** (in `backend/.env`)
   ```
   DATABASE_URL=your_postgres_url
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_KEY=your_service_key
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRATION=7d

   # Optional: For real PayMongo testing (otherwise uses mock)
   # PAYMONGO_SECRET_KEY=sk_test_...
   ```

---

## Test Scenario 1: New User Registration with Trial

**What to Test**: New users get a 14-day trial on the Tindahan plan.

### Steps:

1. **Register a New User**
   ```bash
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "testuser@example.com",
       "password": "password123",
       "full_name": "Test User",
       "store_name": "Test Tindahan"
     }'
   ```

2. **Expected Response**:
   ```json
   {
     "access_token": "eyJhbGc...",
     "refresh_token": "...",
     "user": {
       "id": "uuid",
       "email": "testuser@example.com",
       "full_name": "Test User"
     },
     "stores": [
       {
         "id": "store-uuid",
         "name": "Test Tindahan",
         "role": "admin",
         "is_default": true
       }
     ],
     "default_store": { ... },
     "subscription": {
       "status": "trial",
       "plan_code": "tindahan",
       "plan_name": "Tindahan",
       "trial_ends_at": "2026-02-28T...",  // 14 days from now
       "features": {
         "fifo_inventory": false,
         "utang_management": false,
         "reports": false,
         "api_access": false
       }
     }
   }
   ```

3. **Verify in Database**:
   ```sql
   -- Check organization was created
   SELECT * FROM organizations WHERE billing_email = 'testuser@example.com';

   -- Check store is linked to organization
   SELECT id, name, organization_id FROM stores WHERE name = 'Test Tindahan';

   -- Check trial subscription was created
   SELECT s.*, sp.plan_code, sp.name
   FROM subscriptions s
   JOIN subscription_plans sp ON s.plan_id = sp.id
   WHERE s.organization_id = (
     SELECT id FROM organizations WHERE billing_email = 'testuser@example.com'
   );
   ```

4. **Save the Access Token** for next tests:
   ```bash
   export TOKEN="eyJhbGc..."
   export STORE_ID="store-uuid-from-response"
   ```

---

## Test Scenario 2: Login Returns Subscription Info

**What to Test**: Existing users see their subscription status on login.

### Steps:

1. **Login**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "testuser@example.com",
       "password": "password123"
     }'
   ```

2. **Expected Response**: Same structure as registration, with subscription info included.

---

## Test Scenario 3: Feature Gating (Reports Blocked on Tindahan Plan)

**What to Test**: Users on Tindahan plan cannot access reports (requires Negosyo+).

### Steps:

1. **Try to Access Reports**
   ```bash
   curl -X GET "http://localhost:3000/api/reports/sales?period=daily" \
     -H "Authorization: Bearer $TOKEN" \
     -H "X-Store-Id: $STORE_ID"
   ```

2. **Expected Response** (403 Forbidden):
   ```json
   {
     "statusCode": 403,
     "message": "This feature requires a higher plan",
     "features": ["reports"],
     "current_plan": "tindahan",
     "upgrade_url": "/billing/upgrade"
   }
   ```

---

## Test Scenario 4: Usage Limits (Products Limit on Tindahan)

**What to Test**: Tindahan plan limited to 500 products.

### Steps:

1. **Create Products** (repeat until you hit 500):
   ```bash
   curl -X POST http://localhost:3000/api/products \
     -H "Authorization: Bearer $TOKEN" \
     -H "X-Store-Id: $STORE_ID" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test Product",
       "sku": "TEST-001",
       "retail_price": 100,
       "cost_price": 50,
       "current_stock": 10
     }'
   ```

2. **After 500 products, Expected Response** (403 Forbidden):
   ```json
   {
     "statusCode": 403,
     "message": "You've reached the limit of 500 products",
     "resource": "products",
     "limit": 500,
     "current": 500,
     "upgrade_url": "/billing/upgrade"
   }
   ```

---

## Test Scenario 5: Upgrade to Negosyo Plan

**What to Test**: Admin can upgrade plan, unlocking features and increasing limits.

### Steps:

1. **Get Current Subscription**
   ```bash
   curl -X GET http://localhost:3000/api/billing/subscription \
     -H "Authorization: Bearer $TOKEN" \
     -H "X-Store-Id: $STORE_ID"
   ```

2. **Expected Response**:
   ```json
   {
     "id": "sub-uuid",
     "status": "trial",
     "plan": {
       "plan_code": "tindahan",
       "name": "Tindahan",
       "price_php": 799,
       "max_stores": 1,
       "max_users_per_store": 2,
       "max_products_per_store": 500,
       "features": { ... }
     },
     "trial_ends_at": "2026-02-28",
     "usage": {
       "stores": { "current": 1, "limit": 1 },
       "users": { "current": 1, "limit": 2 },
       "products": { "current": 5, "limit": 500 }
     }
   }
   ```

3. **Upgrade to Negosyo**
   ```bash
   curl -X POST http://localhost:3000/api/billing/upgrade \
     -H "Authorization: Bearer $TOKEN" \
     -H "X-Store-Id: $STORE_ID" \
     -H "Content-Type: application/json" \
     -d '{
       "plan_code": "negosyo"
     }'
   ```

4. **Expected Response**:
   ```json
   {
     "message": "Plan upgraded successfully",
     "subscription": {
       "status": "active",
       "plan": {
         "plan_code": "negosyo",
         "name": "Negosyo",
         "price_php": 1499,
         "max_stores": 3,
         "max_users_per_store": 5,
         "max_products_per_store": 2000,
         "features": {
           "fifo_inventory": true,
           "utang_management": true,
           "reports": true,
           "api_access": false
         }
       }
     }
   }
   ```

5. **Verify Reports Now Accessible**
   ```bash
   curl -X GET "http://localhost:3000/api/reports/sales?period=daily" \
     -H "Authorization: Bearer $TOKEN" \
     -H "X-Store-Id: $STORE_ID"
   ```
   Should return 200 with sales data.

---

## Test Scenario 6: Usage Tracking

**What to Test**: GET /billing/usage shows current resource counts vs limits.

### Steps:

1. **Check Usage**
   ```bash
   curl -X GET http://localhost:3000/api/billing/usage \
     -H "Authorization: Bearer $TOKEN" \
     -H "X-Store-Id: $STORE_ID"
   ```

2. **Expected Response**:
   ```json
   {
     "plan": {
       "plan_code": "negosyo",
       "name": "Negosyo"
     },
     "usage": {
       "stores": {
         "current": 1,
         "limit": 3,
         "percentage": 33
       },
       "users": {
         "current": 1,
         "limit": 5,
         "percentage": 20
       },
       "products": {
         "current": 5,
         "limit": 2000,
         "percentage": 0.25
       }
     }
   }
   ```

---

## Test Scenario 7: Trial Expiration

**What to Test**: After trial ends, user gets 402 Payment Required on protected endpoints.

### Steps:

1. **Manually Expire Trial** (in database):
   ```sql
   UPDATE subscriptions
   SET trial_end = NOW() - INTERVAL '1 day',
       current_period_end = NOW() - INTERVAL '1 day'
   WHERE organization_id = (
     SELECT organization_id FROM stores WHERE id = 'your-store-id'
   );
   ```

2. **Try to Access Any Protected Endpoint**
   ```bash
   curl -X GET http://localhost:3000/api/products \
     -H "Authorization: Bearer $TOKEN" \
     -H "X-Store-Id: $STORE_ID"
   ```

3. **Expected Response** (402 Payment Required):
   ```json
   {
     "statusCode": 402,
     "error": "Payment Required",
     "message": "Your free trial has ended. Please subscribe to continue.",
     "upgrade_url": "/billing/upgrade"
   }
   ```

4. **Reset Trial** (for continued testing):
   ```sql
   UPDATE subscriptions
   SET trial_end = NOW() + INTERVAL '14 days',
       current_period_end = NOW() + INTERVAL '14 days',
       status = 'trial'
   WHERE organization_id = (
     SELECT organization_id FROM stores WHERE id = 'your-store-id'
   );
   ```

---

## Test Scenario 8: List Available Plans (Public Endpoint)

**What to Test**: Anyone can see available subscription plans without auth.

### Steps:

1. **Get Plans** (no auth required)
   ```bash
   curl -X GET http://localhost:3000/api/subscription-plans
   ```

2. **Expected Response**:
   ```json
   [
     {
       "id": "uuid",
       "plan_code": "tindahan",
       "name": "Tindahan",
       "price_php": 799,
       "billing_interval": "monthly",
       "max_stores": 1,
       "max_users_per_store": 2,
       "max_products_per_store": 500,
       "features": {
         "fifo_inventory": false,
         "utang_management": false,
         "reports": false,
         "api_access": false
       },
       "sort_order": 1
     },
     {
       "id": "uuid",
       "plan_code": "negosyo",
       "name": "Negosyo",
       "price_php": 1499,
       "max_stores": 3,
       "max_users_per_store": 5,
       "max_products_per_store": 2000,
       "features": {
         "fifo_inventory": true,
         "utang_management": true,
         "reports": true,
         "api_access": false
       },
       "sort_order": 2
     },
     {
       "id": "uuid",
       "plan_code": "kadena",
       "name": "Kadena",
       "price_php": 2999,
       "max_stores": null,
       "max_users_per_store": null,
       "max_products_per_store": null,
       "features": {
         "fifo_inventory": true,
         "utang_management": true,
         "reports": true,
         "api_access": true,
         "advanced_analytics": true
       },
       "sort_order": 3
     }
   ]
   ```

---

## Test Scenario 9: Cancel Subscription

**What to Test**: Admin can cancel subscription (cancels at period end).

### Steps:

1. **Cancel Subscription**
   ```bash
   curl -X POST http://localhost:3000/api/billing/cancel \
     -H "Authorization: Bearer $TOKEN" \
     -H "X-Store-Id: $STORE_ID" \
     -H "Content-Type: application/json" \
     -d '{
       "reason": "Switching to competitor"
     }'
   ```

2. **Expected Response**:
   ```json
   {
     "message": "Subscription will be canceled at the end of the current period",
     "subscription": {
       "status": "active",
       "cancel_at_period_end": true,
       "current_period_end": "2026-03-15",
       "cancellation_reason": "Switching to competitor"
     }
   }
   ```

---

## Test Scenario 10: PayMongo Payment (Mock Mode)

**What to Test**: Payment flow using mock service (no real PayMongo key).

### Steps:

1. **Create Payment Intent**
   ```bash
   curl -X POST http://localhost:3000/api/payments/create-intent \
     -H "Authorization: Bearer $TOKEN" \
     -H "X-Store-Id: $STORE_ID" \
     -H "Content-Type: application/json" \
     -d '{
       "plan_code": "negosyo",
       "payment_method": "card"
     }'
   ```

2. **Expected Response** (Mock):
   ```json
   {
     "payment_intent_id": "mock_pi_123456789",
     "client_key": "mock_client_key_123456789",
     "status": "succeeded",
     "amount": 149900,
     "description": "Subscription to Negosyo plan"
   }
   ```

3. **Check Backend Logs**: Should see `[MockPaymentService] Creating payment intent for 1499.00 PHP`

---

## Test Scenario 11: Backward Compatibility (Legacy Stores)

**What to Test**: Stores without organization_id (pre-migration) still work.

### Steps:

1. **Create Legacy Store** (manually in DB):
   ```sql
   INSERT INTO stores (id, name, organization_id)
   VALUES (gen_random_uuid(), 'Legacy Store', NULL);
   ```

2. **Access Endpoints**: All guards should pass through (no subscription checks).

---

## Test Scenario 12: Downgrade with Usage Validation

**What to Test**: Cannot downgrade if current usage exceeds new plan limits.

### Steps:

1. **Create 600 Products** (on Negosyo plan, limit 2000)

2. **Try to Downgrade to Tindahan** (limit 500)
   ```bash
   curl -X POST http://localhost:3000/api/billing/downgrade \
     -H "Authorization: Bearer $TOKEN" \
     -H "X-Store-Id: $STORE_ID" \
     -H "Content-Type: application/json" \
     -d '{
       "plan_code": "tindahan"
     }'
   ```

3. **Expected Response** (400 Bad Request):
   ```json
   {
     "statusCode": 400,
     "message": "Cannot downgrade: you have 600 products but Tindahan plan allows only 500"
   }
   ```

---

## Debugging Tips

### Check if Migration Ran:
```sql
-- Should see 3 plans
SELECT * FROM subscription_plans ORDER BY sort_order;

-- Should see your org
SELECT * FROM organizations;

-- Should see your subscription
SELECT * FROM subscriptions;
```

### Enable Debug Logging:
In `backend/src/common/guards/subscription.guard.ts`, add:
```typescript
console.log('[SubscriptionGuard] Store:', storeId);
console.log('[SubscriptionGuard] Organization:', store?.organization_id);
console.log('[SubscriptionGuard] Subscription:', subscription);
```

### Check Request Context:
In any controller, add:
```typescript
@Get('debug')
debug(@Request() req) {
  return {
    user: req.user,
    storeId: req.user.storeId,
    organizationId: req.user.organizationId,
    subscription: req.user.subscription,
  };
}
```

---

## Quick Test Script

Save as `test-subscription.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:3000/api"

# 1. Register
echo "=== Registering new user ==="
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test'$(date +%s)'@example.com",
    "password": "password123",
    "full_name": "Test User",
    "store_name": "Test Store"
  }')

TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.access_token')
STORE_ID=$(echo $REGISTER_RESPONSE | jq -r '.default_store.id')

echo "Token: $TOKEN"
echo "Store ID: $STORE_ID"
echo "Subscription: $(echo $REGISTER_RESPONSE | jq '.subscription')"

# 2. Get Plans
echo -e "\n=== Getting subscription plans ==="
curl -s -X GET "$BASE_URL/subscription-plans" | jq '.[] | {name, price_php, features}'

# 3. Get Current Subscription
echo -e "\n=== Getting current subscription ==="
curl -s -X GET "$BASE_URL/billing/subscription" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Store-Id: $STORE_ID" | jq

# 4. Try Reports (should fail on Tindahan)
echo -e "\n=== Trying to access reports (should fail) ==="
curl -s -X GET "$BASE_URL/reports/sales?period=daily" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Store-Id: $STORE_ID" | jq

# 5. Upgrade to Negosyo
echo -e "\n=== Upgrading to Negosyo ==="
curl -s -X POST "$BASE_URL/billing/upgrade" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Store-Id: $STORE_ID" \
  -H "Content-Type: application/json" \
  -d '{"plan_code": "negosyo"}' | jq

# 6. Try Reports Again (should work now)
echo -e "\n=== Trying to access reports (should work now) ==="
curl -s -X GET "$BASE_URL/reports/sales?period=daily" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Store-Id: $STORE_ID" | jq '.success'

echo -e "\n=== All tests complete ==="
```

Run with: `chmod +x test-subscription.sh && ./test-subscription.sh`

---

## Summary

✅ **What's Working:**
- New user registration creates Organization + 14-day trial
- Login returns subscription info
- Feature gates block access based on plan (e.g., reports)
- Usage limits prevent exceeding plan quotas (e.g., products)
- Upgrade/downgrade flow with validation
- Legacy stores (no org_id) pass through guards
- Mock payment service for development

🔜 **Next Steps:**
- Frontend billing page UI
- Real PayMongo integration testing (add PAYMONGO_SECRET_KEY)
- Email notifications for trial ending
- Webhook testing for payment confirmations
