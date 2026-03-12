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
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200');
    const successUrl = `${frontendUrl}/billing?payment=success`;
    const cancelUrl = `${frontendUrl}/billing?payment=cancelled`;

    const response = await fetch(`${this.baseUrl}/checkout_sessions`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(this.secretKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          attributes: {
            cancel_url: cancelUrl,
            success_url: successUrl,
            payment_method_types: ['gcash', 'card', 'paymaya', 'grab_pay'],
            show_description: true,
            show_line_items: true,
            send_email_receipt: false,
            line_items: [
              {
                amount: Math.round(params.amount * 100),
                currency: params.currency,
                name: params.description,
                quantity: 1,
              },
            ],
            metadata: params.metadata,
          },
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      this.logger.error('PayMongo create checkout session failed', data);
      throw new Error(data.errors?.[0]?.detail || 'Checkout session creation failed');
    }

    const attrs = data.data.attributes;
    return {
      id: data.data.id,
      status: attrs.status ?? 'active',
      amount: params.amount,
      currency: params.currency,
      checkout_url: attrs.checkout_url,
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
    const paymentData = payload.data?.attributes?.data;
    return {
      type: payload.data?.attributes?.type || payload.type,
      eventId: payload.data?.id,
      data: {
        id: paymentData?.id,
        attributes: paymentData?.attributes || {},
      },
    };
  }
}
