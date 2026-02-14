import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PaymentGateway,
  CreatePaymentIntentParams,
  PaymentIntentResult,
  WebhookEvent,
} from '../payment-gateway.interface';

@Injectable()
export class PaymongoService implements PaymentGateway {
  private readonly logger = new Logger(PaymongoService.name);
  private readonly secretKey: string;
  private readonly baseUrl = 'https://api.paymongo.com/v1';

  constructor(private configService: ConfigService) {
    this.secretKey = this.configService.get<string>('PAYMONGO_SECRET_KEY', '');
  }

  async createPaymentIntent(
    params: CreatePaymentIntentParams,
  ): Promise<PaymentIntentResult> {
    const response = await fetch(`${this.baseUrl}/payment_intents`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(this.secretKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: Math.round(params.amount * 100),
            payment_method_allowed: ['gcash', 'grab_pay', 'card', 'paymaya'],
            currency: params.currency,
            description: params.description,
            metadata: params.metadata,
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      this.logger.error('PayMongo create payment intent failed', data);
      throw new Error(data.errors?.[0]?.detail || 'Payment creation failed');
    }

    const attrs = data.data.attributes;
    return {
      id: data.data.id,
      status: attrs.status,
      amount: attrs.amount / 100,
      currency: attrs.currency,
      client_key: attrs.client_key,
      metadata: attrs.metadata,
    };
  }

  async getPaymentIntent(id: string): Promise<PaymentIntentResult> {
    const response = await fetch(`${this.baseUrl}/payment_intents/${id}`, {
      headers: {
        Authorization: `Basic ${Buffer.from(this.secretKey + ':').toString('base64')}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      this.logger.error('PayMongo get payment intent failed', data);
      throw new Error(data.errors?.[0]?.detail || 'Failed to get payment');
    }

    const attrs = data.data.attributes;
    return {
      id: data.data.id,
      status: attrs.status,
      amount: attrs.amount / 100,
      currency: attrs.currency,
      client_key: attrs.client_key,
      metadata: attrs.metadata,
    };
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    // PayMongo uses HMAC-SHA256 for webhook verification
    const crypto = require('crypto');
    const webhookSecret = this.configService.get<string>('PAYMONGO_WEBHOOK_SECRET', '');

    if (!webhookSecret) {
      this.logger.warn('PAYMONGO_WEBHOOK_SECRET not configured');
      return false;
    }

    const computedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    return computedSignature === signature;
  }

  parseWebhookEvent(payload: any): WebhookEvent {
    return {
      type: payload.data?.attributes?.type || payload.type,
      data: {
        id: payload.data?.id,
        attributes: payload.data?.attributes?.data?.attributes || {},
      },
    };
  }
}
