import { Category } from './category.model';

export interface Product {
  id: string;
  store_id: string;
  category_id: string;
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  unit: string;
  reorder_level: number;
  has_expiry: boolean;
  retail_price: number;
  cost_price: number;
  current_stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface CreateProductDto {
  category_id: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  unit?: string;
  reorder_level?: number;
  has_expiry?: boolean;
  retail_price: number;
  cost_price: number;
  current_stock?: number;
}

export interface UpdateProductDto {
  category_id?: string;
  sku?: string;
  barcode?: string;
  name?: string;
  description?: string;
  unit?: string;
  reorder_level?: number;
  has_expiry?: boolean;
  retail_price?: number;
  cost_price?: number;
  is_active?: boolean;
}
