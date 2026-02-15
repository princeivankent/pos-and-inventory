import { UserRole } from './enums';
import { SubscriptionInfo } from './subscription.model';

export interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserStore {
  id: string;
  user_id: string;
  store_id: string;
  role: UserRole;
  is_default: boolean;
}

export interface UserWithStore {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  role: UserRole;
  is_default: boolean;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  store_name: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    full_name: string;
  };
  stores: StoreAccess[];
  default_store: StoreAccess;
  subscription?: SubscriptionInfo;
}

export interface RegisterResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    full_name: string;
  };
  stores: StoreAccess[];
  default_store: StoreAccess;
  subscription?: SubscriptionInfo;
}

export interface StoreAccess {
  id: string;
  name: string;
  role: UserRole;
  is_default?: boolean;
}

export interface SwitchStoreResponse {
  store: StoreAccess;
}
