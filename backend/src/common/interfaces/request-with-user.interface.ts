import { Request } from 'express';

export interface SubscriptionContext {
  id: string;
  status: string;
  plan: {
    id: string;
    plan_code: string;
    name: string;
    price_php: number;
    max_stores: number;
    max_users_per_store: number;
    max_products_per_store: number;
    features: Record<string, boolean>;
  };
  trial_end?: Date;
  current_period_end?: Date;
}

export interface RequestUser {
  userId: string;
  email: string;
  storeId?: string;
  role?: string;
  permissions?: string[];
  organizationId?: string;
  subscription?: SubscriptionContext;
}

export interface RequestWithUser extends Request {
  user: RequestUser;
}
