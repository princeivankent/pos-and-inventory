export interface Category {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  children?: Category[];
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  parent_id?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  parent_id?: string;
}
