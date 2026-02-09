export enum Permission {
  // Products & Categories
  PRODUCTS_VIEW = 'products:view',
  PRODUCTS_MANAGE = 'products:manage',

  // Inventory
  INVENTORY_VIEW = 'inventory:view',
  INVENTORY_ADJUST = 'inventory:adjust',

  // Sales
  SALES_CREATE = 'sales:create',
  SALES_VIEW = 'sales:view',
  SALES_VOID = 'sales:void',

  // Receipts
  RECEIPTS_VIEW = 'receipts:view',

  // Reports
  REPORTS_VIEW = 'reports:view',

  // Customers
  CUSTOMERS_VIEW = 'customers:view',
  CUSTOMERS_MANAGE = 'customers:manage',

  // Users
  USERS_MANAGE = 'users:manage',

  // Stores
  STORES_MANAGE = 'stores:manage',
}

export const ALL_PERMISSIONS = Object.values(Permission);

export const DEFAULT_CASHIER_PERMISSIONS: Permission[] = [
  Permission.PRODUCTS_VIEW,
  Permission.INVENTORY_VIEW,
  Permission.SALES_CREATE,
  Permission.SALES_VIEW,
  Permission.RECEIPTS_VIEW,
  Permission.CUSTOMERS_VIEW,
];

export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  [Permission.PRODUCTS_VIEW]: 'View and search products and categories',
  [Permission.PRODUCTS_MANAGE]:
    'Create, update, and delete products and categories',
  [Permission.INVENTORY_VIEW]:
    'View stock levels, movements, and low stock alerts',
  [Permission.INVENTORY_ADJUST]: 'Adjust stock and receive inventory batches',
  [Permission.SALES_CREATE]: 'Create new sales transactions',
  [Permission.SALES_VIEW]: 'View sales history and daily sales',
  [Permission.SALES_VOID]: 'Void or cancel a sale',
  [Permission.RECEIPTS_VIEW]: 'View and generate receipts',
  [Permission.REPORTS_VIEW]:
    'View all reports (sales, inventory, profit, best-selling)',
  [Permission.CUSTOMERS_VIEW]: 'View customer information',
  [Permission.CUSTOMERS_MANAGE]:
    'Create, update, and delete customers and manage credit',
  [Permission.USERS_MANAGE]: 'Add, remove, and update users and permissions',
  [Permission.STORES_MANAGE]: 'Update store settings and configuration',
};
