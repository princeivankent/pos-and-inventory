export interface Supplier {
  id: string;
  store_id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSupplierDto {
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface UpdateSupplierDto {
  name?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
}
