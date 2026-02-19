export interface SubscriptionInfo {
  status: 'trial' | 'active' | 'past_due' | 'suspended' | 'cancelled' | 'expired';
  plan_code: 'tindahan' | 'negosyo' | 'kadena';
  plan_name: string;
  trial_ends_at?: string;
  current_period_end?: string;
  features: Record<string, boolean>;
  usage: {
    max_stores: number;
    max_users_per_store: number;
    max_products_per_store: number;
  };
}

export interface SubscriptionPlan {
  id: string;
  plan_code: string;
  name: string;
  price_php: number;
  max_stores: number;
  max_users_per_store: number;
  max_products_per_store: number;
  features: Record<string, boolean>;
  sort_order: number;
}

export interface StoreUsageDetail {
  store_id: string;
  store_name: string;
  users: { current: number; limit: number };
  products: { current: number; limit: number };
}

export interface UsageResponse {
  subscription: {
    id: string;
    status: string;
    plan_code: string;
    plan_name: string;
    trial_end?: string;
    current_period_end?: string;
  };
  stores: { current: number; limit: number };
  store_details: StoreUsageDetail[];
  features: Record<string, boolean>;
}

// Feature enum for type safety
export enum SubscriptionFeature {
  POS = 'pos',
  BASIC_INVENTORY = 'basic_inventory',
  REPORTS = 'reports',
  UTANG_MANAGEMENT = 'utang_management',
  FIFO_INVENTORY = 'fifo_inventory',
  MULTI_STORE = 'multi_store',
  RECEIPT_CUSTOMIZATION = 'receipt_customization',
  EXPORT_DATA = 'export_data',
}
