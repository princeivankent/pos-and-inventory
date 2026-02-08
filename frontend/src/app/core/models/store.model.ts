export interface Store {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  tax_id: string | null;
  settings: StoreSettings;
  created_at: string;
  updated_at: string;
}

export interface StoreSettings {
  tax_enabled?: boolean;
  tax_rate?: number;
  receipt_header?: string;
  receipt_footer?: string;
  [key: string]: unknown;
}

export interface UpdateStoreDto {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  tax_id?: string;
  settings?: StoreSettings;
}
