# Supplier Management

**Branch:** `feature/supplier-management`
**Completed:** February 25, 2026
**Status:** ✅ Complete

---

## Overview

Full CRUD supplier management with soft-delete, search, and integration into inventory stock-in. Suppliers are admin-only and available on all subscription tiers (no feature gate required).

**Scope:** Supplier CRUD + link to inventory batches. No purchase orders, no analytics, no reorder suggestions.

---

## Database

### Existing Entity
The `Supplier` entity and `inventory_batches.supplier_id` FK already existed in the initial schema. No entity was created from scratch.

**Entity:** `backend/src/database/entities/supplier.entity.ts`
```
suppliers
├── id          UUID PK
├── store_id    UUID (tenant isolation via TenantBaseEntity)
├── name        VARCHAR(255) NOT NULL
├── contact_person  VARCHAR(255) NULLABLE
├── phone       VARCHAR(50) NULLABLE
├── email       VARCHAR(255) NULLABLE
├── address     TEXT NULLABLE
├── is_active   BOOLEAN DEFAULT TRUE   ← added via migration
├── created_at
└── updated_at
```

### Migration
**File:** `backend/src/database/migrations/1707600000000-AddSupplierIsActive.ts`

Adds `is_active BOOLEAN NOT NULL DEFAULT TRUE` to the `suppliers` table. Uses `IF NOT EXISTS` so it is safe to re-run.

```bash
cd backend && npm run migration:run
```

---

## Backend

### Permissions
**File:** `backend/src/common/permissions/permission.enum.ts`

| Permission | Value | Who |
|---|---|---|
| `SUPPLIERS_VIEW` | `suppliers:view` | Any role |
| `SUPPLIERS_MANAGE` | `suppliers:manage` | Admin only |

Not added to `DEFAULT_CASHIER_PERMISSIONS` — suppliers are admin-managed data.

### API Endpoints

Base path: `/api/suppliers`
All endpoints require `Authorization: Bearer <jwt>` and `X-Store-Id: <uuid>` headers.

| Method | Path | Permission | Role | Description |
|---|---|---|---|---|
| `GET` | `/suppliers` | `SUPPLIERS_VIEW` | Any | List active suppliers. Accepts `?search=` query param (ILike on name and phone). |
| `GET` | `/suppliers/:id` | `SUPPLIERS_VIEW` | Any | Get single supplier by ID. |
| `POST` | `/suppliers` | `SUPPLIERS_MANAGE` | Admin | Create a supplier. |
| `PATCH` | `/suppliers/:id` | `SUPPLIERS_MANAGE` | Admin | Update a supplier. |
| `DELETE` | `/suppliers/:id` | `SUPPLIERS_MANAGE` | Admin | Soft-delete: sets `is_active = false`. Does NOT hard-delete — preserves batch history. |

### DTOs
- `CreateSupplierDto` — `name` required (MaxLength 255), all other fields optional
- `UpdateSupplierDto` — extends `PartialType(CreateSupplierDto)`, all fields optional

### Module Files
```
backend/src/suppliers/
├── dto/
│   ├── create-supplier.dto.ts
│   └── update-supplier.dto.ts
├── suppliers.controller.ts
├── suppliers.module.ts
└── suppliers.service.ts
```

`SuppliersModule` imports `[Supplier, UserStore]` entities and `SubscriptionGuardModule`. It exports `SuppliersService` for potential use by other modules.

Registered in `backend/src/app.module.ts` after `CustomersModule`.

### Guard Chain
```typescript
@UseGuards(AuthGuard('jwt'), TenantGuard, SubscriptionGuard, RolesGuard, PermissionsGuard, FeatureGateGuard)
```
No `@RequireFeature` — available on all subscription tiers (Tindahan, Negosyo, Kadena).

---

## Inventory Integration

When performing a **Stock In**, an optional `supplier_id` can be sent. If provided, the created `InventoryBatch` will record which supplier delivered the stock.

### Changes
- **`backend/src/inventory/dto/stock-adjustment.dto.ts`** — Added `@IsUUID() @IsOptional() supplier_id?: string`
- **`backend/src/inventory/inventory.service.ts`** — Passes `supplier_id: dto.supplier_id || null` to batch creation in the `STOCK_IN` branch
- **`backend/src/inventory/inventory.module.ts`** — Added `Supplier` entity to `TypeOrmModule.forFeature([...])` for relation resolution

### Stock Movements Query
The `getMovements` service method was updated to:
1. Include `batch.supplier` in relations (so supplier name appears in movement history)
2. Accept an optional `movement_type` filter parameter for server-side filtering

---

## Frontend

### Models & Service
- **`frontend/src/app/core/models/supplier.model.ts`** — `Supplier`, `CreateSupplierDto`, `UpdateSupplierDto` interfaces
- **`frontend/src/app/core/services/supplier.service.ts`** — `getAll(search?)`, `getOne(id)`, `create(dto)`, `update(id, dto)`, `deactivate(id)`

### Feature Components
```
frontend/src/app/features/suppliers/
├── supplier-list.ts / .html / .scss          ← Container page
└── components/
    ├── supplier-table/
    │   ├── supplier-table.ts / .html / .scss  ← Presentational table
    └── supplier-form-dialog/
        └── supplier-form-dialog.ts / .html / .scss  ← Create/Edit modal
```

**Container (`supplier-list`):**
- Angular signals: `suppliers`, `loading`, `saving`
- Debounced search (300ms)
- Uses `ConfirmationService` for deactivate prompt
- Admin-only: Add/Edit/Deactivate buttons hidden for cashier role

**Table (`supplier-table`):**
- Columns: Name | Contact Person | Phone | Email | Address | Actions
- `enhanced-table` styleClass (matches Products page design standard)
- `[rowsPerPageOptions]="[15, 30, 50]"` — no separate page-size dropdown
- Row hover `#f9fafb` transition
- `cell-secondary` for Contact/Phone/Email/Address columns
- `cell-mono` for phone numbers
- Address truncated with `text-overflow: ellipsis`
- Empty state with `pi-truck` icon

**Form Dialog (`supplier-form-dialog`):**
- Two sections: **Basic Information** (name*, contact_person) | **Contact Details** (phone, email, address)
- `isValid` requires only `name.trim()`
- 480px width, matching Customer form dialog

### Routing & Navigation
**Route:** `/suppliers` — protected by `adminGuard`

```typescript
// frontend/src/app/app.routes.ts
{
  path: 'suppliers',
  loadComponent: () => import('./features/suppliers/supplier-list').then(m => m.SupplierListComponent),
  canActivate: [adminGuard],
}
```

**Sidebar:** Suppliers appears between Customers and Reports, `adminOnly: true`
```typescript
{ label: 'Suppliers', icon: 'pi-truck', route: '/suppliers', adminOnly: true }
```

### Inventory Stock-In Integration
The stock-in dialog in `inventory-overview` was updated to include a **Supplier (optional)** `p-select` dropdown:
- Loads suppliers when the stock-in dialog opens
- Filterable, clearable dropdown using `p-select`
- `supplier_id` is included in the API payload only when set

---

## UI/UX Design Notes

- **Search input:** Uses PrimeNG 21 `p-iconfield` + `p-inputicon` (not the deprecated `span.p-input-icon-left` wrapper)
- **No feature gate:** Suppliers are available on all plans — no upgrade prompt needed
- **Soft-delete:** DELETE sets `is_active = false`, preserving inventory batch history
- **Table design standard:** Follows `enhanced-table` pattern established in the Products page (rowsPerPageOptions, row hover, cell-secondary hierarchy)

---

## Testing Checklist

- [ ] `POST /api/suppliers` → creates supplier, returns `is_active: true`
- [ ] `GET /api/suppliers?search=motor` → filters by name/phone
- [ ] `DELETE /api/suppliers/:id` → sets `is_active = false`, not hard-deleted
- [ ] `POST /api/inventory/adjust` with `type: stock_in` and valid `supplier_id` → `inventory_batches.supplier_id` is populated
- [ ] `GET /api/inventory/movements` → response includes `batch.supplier.name`
- [ ] Login as admin → sidebar shows "Suppliers" between Customers and Reports
- [ ] Login as cashier → "Suppliers" not visible in sidebar
- [ ] Create a supplier → appears in table
- [ ] Open stock-in dialog → supplier dropdown appears and is filterable
- [ ] Submit stock-in with a selected supplier → movement history shows supplier name
