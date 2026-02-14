import {
  Controller,
  Post,
  Body,
  Headers,
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
    @Headers('paymongo-signature') signature: string,
  ) {
    // Verify signature
    const rawBody = JSON.stringify(body);
    if (!this.paymentGateway.verifyWebhookSignature(rawBody, signature || '')) {
      this.logger.warn('Invalid webhook signature');
      throw new BadRequestException('Invalid signature');
    }

    const event = this.paymentGateway.parseWebhookEvent(body);
    this.logger.log(`Received webhook event: ${event.type}`);

    switch (event.type) {
      case 'payment.paid':
        await this.handlePaymentPaid(event.data);
        break;
      case 'payment.failed':
        await this.handlePaymentFailed(event.data);
        break;
      default:
        this.logger.log(`Unhandled webhook event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handlePaymentPaid(data: { id: string; attributes: Record<string, any> }) {
    const payment = await this.paymentRepository.findOne({
      where: { gateway_payment_id: data.id },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for gateway ID: ${data.id}`);
      return;
    }

    payment.status = PaymentStatus.SUCCEEDED;
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
          subscription.current_period_start = invoice.period_start;
          subscription.current_period_end = invoice.period_end;
          await this.subscriptionRepository.save(subscription);
        }
      }
    }
  }

  private async handlePaymentFailed(data: { id: string; attributes: Record<string, any> }) {
    const payment = await this.paymentRepository.findOne({
      where: { gateway_payment_id: data.id },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for gateway ID: ${data.id}`);
      return;
    }

    payment.status = PaymentStatus.FAILED;
    payment.metadata = { ...payment.metadata, failure_reason: data.attributes.last_payment_error };
    await this.paymentRepository.save(payment);

    // Update invoice
    if (payment.invoice_id) {
      await this.invoiceRepository.update(payment.invoice_id, {
        status: InvoiceStatus.FAILED,
      });
    }
  }
}
