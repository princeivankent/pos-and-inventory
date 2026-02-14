export interface CreatePaymentIntentParams {
  amount: number;
  currency: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface PaymentIntentResult {
  id: string;
  status: string;
  amount: number;
  currency: string;
  client_key?: string;
  checkout_url?: string;
  metadata?: Record<string, any>;
}

export interface WebhookEvent {
  type: string;
  data: {
    id: string;
    attributes: Record<string, any>;
  };
}

export interface PaymentGateway {
  createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult>;
  getPaymentIntent(id: string): Promise<PaymentIntentResult>;
  verifyWebhookSignature(payload: string, signature: string): boolean;
  parseWebhookEvent(payload: any): WebhookEvent;
}

export const PAYMENT_GATEWAY = 'PAYMENT_GATEWAY';
