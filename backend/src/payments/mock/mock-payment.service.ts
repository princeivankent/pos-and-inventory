import { Injectable, Logger } from '@nestjs/common';
import {
  PaymentGateway,
  CreatePaymentIntentParams,
  PaymentIntentResult,
  WebhookEvent,
} from '../payment-gateway.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MockPaymentService implements PaymentGateway {
  private readonly logger = new Logger(MockPaymentService.name);
  private payments = new Map<string, PaymentIntentResult>();

  async createPaymentIntent(
    params: CreatePaymentIntentParams,
  ): Promise<PaymentIntentResult> {
    const id = `mock_pi_${uuidv4()}`;
    const result: PaymentIntentResult = {
      id,
      status: 'succeeded',
      amount: params.amount,
      currency: params.currency,
      client_key: `mock_ck_${uuidv4()}`,
      metadata: params.metadata,
    };

    this.payments.set(id, result);
    this.logger.log(`[MOCK] Created payment intent: ${id} for ${params.amount} ${params.currency}`);

    return result;
  }

  async getPaymentIntent(id: string): Promise<PaymentIntentResult> {
    const payment = this.payments.get(id);
    if (!payment) {
      return {
        id,
        status: 'not_found',
        amount: 0,
        currency: 'PHP',
      };
    }
    return payment;
  }

  verifyWebhookSignature(_payload: string, _signature: string): boolean {
    this.logger.log('[MOCK] Webhook signature verified (always true in mock)');
    return true;
  }

  parseWebhookEvent(payload: any): WebhookEvent {
    return {
      type: payload.type || 'payment.paid',
      data: {
        id: payload.data?.id || `mock_${uuidv4()}`,
        attributes: payload.data?.attributes || {},
      },
    };
  }
}
