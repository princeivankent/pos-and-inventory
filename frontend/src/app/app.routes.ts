import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/layout').then((m) => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'pos',
        loadComponent: () =>
          import('./features/pos/pos').then((m) => m.PosComponent),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/product-list').then(
            (m) => m.ProductListComponent
          ),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/categories/category-list').then(
            (m) => m.CategoryListComponent
          ),
        canActivate: [adminGuard],
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./features/inventory/inventory-overview').then(
            (m) => m.InventoryOverviewComponent
          ),
      },
      {
        path: 'inventory/movements',
        loadComponent: () =>
          import('./features/inventory/movement-history').then(
            (m) => m.MovementHistoryComponent
          ),
      },
      {
        path: 'inventory/low-stock',
        loadComponent: () =>
          import('./features/inventory/low-stock-alerts').then(
            (m) => m.LowStockAlertsComponent
          ),
      },
      {
        path: 'sales',
        loadComponent: () =>
          import('./features/sales/sales-list').then(
            (m) => m.SalesListComponent
          ),
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./features/customers/customer-list').then(
            (m) => m.CustomerListComponent
          ),
      },
      {
        path: 'sales/:id',
        loadComponent: () =>
          import('./features/sales/sale-detail').then(
            (m) => m.SaleDetailComponent
          ),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/reports').then(
            (m) => m.ReportsComponent
          ),
        canActivate: [adminGuard],
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/user-list').then(
            (m) => m.UserListComponent
          ),
        canActivate: [adminGuard],
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/store-settings').then(
            (m) => m.StoreSettingsComponent
          ),
        canActivate: [adminGuard],
      },
      {
        path: 'billing',
        loadComponent: () =>
          import('./features/billing/billing').then((m) => m.BillingComponent),
        canActivate: [adminGuard],
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
