import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PAYMENT_GATEWAY, PaymentGateway } from './payment-gateway.interface';
import { Invoice, InvoiceStatus } from '../database/entities/invoice.entity';
import { Payment, PaymentStatus } from '../database/entities/payment.entity';
import { BillingPaymentMethod } from '../database/entities/payment-method.entity';
import { Subscription } from '../database/entities/subscription.entity';
import { SubscriptionPlan } from '../database/entities/subscription-plan.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @Inject(PAYMENT_GATEWAY)
    private paymentGateway: PaymentGateway,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(BillingPaymentMethod)
    private paymentMethodRepository: Repository<BillingPaymentMethod>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {}

  async createInvoice(
    organizationId: string,
    plan: SubscriptionPlan,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<Invoice> {
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const invoice = this.invoiceRepository.create({
      organization_id: organizationId,
      plan_id: plan.id,
      invoice_number: invoiceNumber,
      amount: plan.price_php,
      tax_amount: plan.price_php * 0.12,
      currency: 'PHP',
      status: InvoiceStatus.PENDING,
      due_date: new Date(periodStart.getTime() + 7 * 24 * 60 * 60 * 1000),
      period_start: periodStart,
      period_end: periodEnd,
    });

    return this.invoiceRepository.save(invoice);
  }

  async payInvoice(invoiceId: string) {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId },
      relations: ['plan'],
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const totalAmount = invoice.amount + invoice.tax_amount;

    // Create payment intent via gateway
    const paymentIntent = await this.paymentGateway.createPaymentIntent({
      amount: totalAmount,
      currency: invoice.currency,
      description: `Subscription payment - ${invoice.invoice_number}`,
      metadata: {
        invoice_id: invoice.id,
        organization_id: invoice.organization_id,
      },
    });

    // Record payment
    const payment = this.paymentRepository.create({
      organization_id: invoice.organization_id,
      invoice_id: invoice.id,
      amount: totalAmount,
      currency: invoice.currency,
      status:
        paymentIntent.status === 'succeeded'
          ? PaymentStatus.SUCCEEDED
          : PaymentStatus.PENDING,
      payment_method: 'gateway',
      gateway_payment_id: paymentIntent.id,
    });

    await this.paymentRepository.save(payment);

    // If mock gateway (auto-succeeds), mark invoice paid
    if (paymentIntent.status === 'succeeded') {
      invoice.status = InvoiceStatus.PAID;
      invoice.paid_at = new Date();
      await this.invoiceRepository.save(invoice);
    }

    return {
      payment_intent: paymentIntent,
      payment_id: payment.id,
      invoice_id: invoice.id,
    };
  }

  async getInvoices(organizationId: string) {
    return this.invoiceRepository.find({
      where: { organization_id: organizationId },
      relations: ['plan'],
      order: { created_at: 'DESC' },
    });
  }

  async getPayments(organizationId: string) {
    return this.paymentRepository.find({
      where: { organization_id: organizationId },
      order: { created_at: 'DESC' },
    });
  }

  async getPaymentMethods(organizationId: string) {
    return this.paymentMethodRepository.find({
      where: { organization_id: organizationId, is_active: true },
    });
  }
}
