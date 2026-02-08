import { MovementType } from './enums';

export interface InventoryBatch {
  id: string;
  store_id: string;
  product_id: string;
  supplier_id: string | null;
  batch_number: string;
  purchase_date: string;
  expiry_date: string | null;
  unit_cost: number;
  initial_quantity: number;
  current_quantity: number;
  wholesale_price: number;
  retail_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product?: { name: string; sku: string };
  supplier?: { name: string };
}

export interface StockMovement {
  id: string;
  store_id: string;
  batch_id: string;
  movement_type: MovementType;
  quantity: number;
  reference_id: string | null;
  reference_type: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  batch?: InventoryBatch;
  creator?: { full_name: string };
}

export interface CreateBatchDto {
  product_id: string;
  supplier_id?: string;
  batch_number: string;
  purchase_date: string;
  expiry_date?: string;
  unit_cost: number;
  initial_quantity: number;
  wholesale_price: number;
  retail_price: number;
}

export interface StockAdjustmentDto {
  product_id: string;
  quantity: number;
  movement_type: MovementType;
  notes?: string;
}

export interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  current_stock: number;
  reorder_level: number;
  unit: string;
}
