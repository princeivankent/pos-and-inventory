import {
  Controller,
  Post,
  Body,
  Headers,
  RawBody,
  Inject,
  Logger,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PAYMENT_GATEWAY, PaymentGateway } from '../payment-gateway.interface';
import { Payment, PaymentStatus } from '../../database/entities/payment.entity';
import { Invoice, InvoiceStatus } from '../../database/entities/invoice.entity';
import { Subscription, SubscriptionStatus } from '../../database/entities/subscription.entity';

@Controller('webhooks/paymongo')
export class PaymongoWebhookController {
  private readonly logger = new Logger(PaymongoWebhookController.name);

  constructor(
    @Inject(PAYMENT_GATEWAY)
    private paymentGateway: PaymentGateway,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() body: any,
    @RawBody() rawBody: Buffer | undefined,
    @Headers('paymongo-signature') signature: string,
  ) {
    const payload = rawBody?.toString('utf8') ?? JSON.stringify(body);
    if (!this.paymentGateway.verifyWebhookSignature(payload, signature || '')) {
      this.logger.warn('Invalid webhook signature');
      throw new BadRequestException('Invalid signature');
    }

    const event = this.paymentGateway.parseWebhookEvent(body);
    this.logger.log(`Received webhook event: ${event.type}`);

    switch (event.type) {
      case 'payment.paid':
      case 'checkout_session.payment.paid':
        await this.handlePaymentPaid(event.data, event.eventId);
        break;
      case 'payment.failed':
      case 'checkout_session.payment.failed':
        await this.handlePaymentFailed(event.data, event.eventId);
        break;
      default:
        this.logger.log(`Unhandled webhook event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handlePaymentPaid(
    data: { id: string; attributes: Record<string, any> },
    eventId?: string,
  ) {
    const payment = await this.paymentRepository.findOne({
      where: { gateway_payment_id: data.id },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for gateway ID: ${data.id}`);
      return;
    }
    if (this.isAlreadyProcessed(payment, eventId)) {
      this.logger.log(`Skipping duplicate payment.paid event ${eventId} for payment ${payment.id}`);
      return;
    }

    payment.status = PaymentStatus.SUCCEEDED;
    payment.metadata = this.addProcessedEvent(payment.metadata, eventId);
    await this.paymentRepository.save(payment);

    // Update invoice if linked
    if (payment.invoice_id) {
      await this.invoiceRepository.update(payment.invoice_id, {
        status: InvoiceStatus.PAID,
        paid_at: new Date(),
      });

      // Activate/renew subscription
      const invoice = await this.invoiceRepository.findOne({
        where: { id: payment.invoice_id },
      });

      if (invoice) {
        const subscription = await this.subscriptionRepository.findOne({
          where: { organization_id: invoice.organization_id },
          order: { created_at: 'DESC' },
        });

        if (subscription) {
          subscription.status = SubscriptionStatus.ACTIVE;
          // Update plan if this was an upgrade (invoice may target a new plan)
          if (invoice.plan_id) {
            subscription.plan_id = invoice.plan_id;
          }
          subscription.current_period_start = invoice.period_start;
          subscription.current_period_end = invoice.period_end;
          subscription.trial_start = null;
          subscription.trial_end = null;
          await this.subscriptionRepository.save(subscription);
        }
      }
    }
  }

  private async handlePaymentFailed(
    data: { id: string; attributes: Record<string, any> },
    eventId?: string,
  ) {
    const payment = await this.paymentRepository.findOne({
      where: { gateway_payment_id: data.id },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for gateway ID: ${data.id}`);
      return;
    }
    if (this.isAlreadyProcessed(payment, eventId)) {
      this.logger.log(`Skipping duplicate payment.failed event ${eventId} for payment ${payment.id}`);
      return;
    }

    payment.status = PaymentStatus.FAILED;
    payment.metadata = this.addProcessedEvent(
      { ...payment.metadata, failure_reason: data.attributes.last_payment_error },
      eventId,
    );
    await this.paymentRepository.save(payment);

    // Update invoice
    if (payment.invoice_id) {
      await this.invoiceRepository.update(payment.invoice_id, {
        status: InvoiceStatus.FAILED,
      });
    }
  }

  private isAlreadyProcessed(payment: Payment, eventId?: string) {
    if (!eventId) return false;
    const processed = (payment.metadata?.processed_events ?? []) as string[];
    return processed.includes(eventId);
  }

  private addProcessedEvent(metadata: Record<string, any>, eventId?: string) {
    if (!eventId) return metadata ?? {};
    const processed = new Set<string>((metadata?.processed_events ?? []) as string[]);
    processed.add(eventId);
    return {
      ...(metadata ?? {}),
      processed_events: Array.from(processed),
    };
  }
}
