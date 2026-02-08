export enum UserRole {
  ADMIN = 'admin',
  CASHIER = 'cashier',
}

export enum PaymentMethod {
  CASH = 'cash',
  CREDIT = 'credit',
  PARTIAL = 'partial',
}

export enum SaleStatus {
  COMPLETED = 'completed',
  VOID = 'void',
  RETURNED = 'returned',
}

export enum MovementType {
  PURCHASE = 'purchase',
  SALE = 'sale',
  ADJUSTMENT = 'adjustment',
  RETURN = 'return',
  EXPIRED = 'expired',
  DAMAGED = 'damaged',
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}
