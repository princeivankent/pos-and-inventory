import { DiscountType, PaymentMethod, SaleStatus } from './enums';

export interface Sale {
  id: string;
  store_id: string;
  sale_number: string;
  customer_id: string | null;
  cashier_id: string;
  sale_date: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_method: PaymentMethod;
  amount_paid: number;
  change_amount: number;
  credit_amount: number;
  notes: string | null;
  status: SaleStatus;
  returned_from_sale_id: string | null;
  created_at: string;
  updated_at: string;
  items?: SaleItem[];
  cashier?: { full_name: string };
  customer?: { name: string };
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  batch_id: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product?: { name: string; sku: string };
}

export interface CreateSaleItemDto {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount?: number;
}

export interface CreateSaleDto {
  items: CreateSaleItemDto[];
  discount_amount?: number;
  discount_type?: DiscountType;
  amount_paid: number;
  payment_notes?: string;
  notes?: string;
}
