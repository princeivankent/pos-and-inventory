export interface Customer {
  id: string;
  store_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  credit_limit: number;
  current_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerDto {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  credit_limit?: number;
}

export interface UpdateCustomerDto {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  credit_limit?: number;
}

export interface RecordPaymentDto {
  amount: number;
  payment_method?: string;
  sale_id?: string;
  notes?: string;
}

export interface CreditPayment {
  id: string;
  customer_id: string;
  sale_id: string | null;
  payment_date: string;
  amount: number;
  payment_method: string;
  notes: string | null;
  recorded_by: string;
}

export interface CreditTransaction {
  type: 'sale' | 'payment';
  date: string;
  reference: string;
  amount: number;
  running_balance: number;
  sale_id?: string;
  payment_method?: string;
  notes?: string;
}

export interface CreditStatement {
  customer: Customer;
  transactions: CreditTransaction[];
  summary: {
    credit_limit: number;
    current_balance: number;
    available_credit: number;
  };
}
