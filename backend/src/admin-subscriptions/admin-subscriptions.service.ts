import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription, SubscriptionStatus } from '../database/entities/subscription.entity';
import { Organization } from '../database/entities/organization.entity';
import { Invoice } from '../database/entities/invoice.entity';
import { Payment } from '../database/entities/payment.entity';
import { SubscriptionPlan } from '../database/entities/subscription-plan.entity';
import { BillingAuditLog } from '../database/entities/billing-audit-log.entity';
import { ListSubscriptionsDto } from './dto/list-subscriptions.dto';

@Injectable()
export class AdminSubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(SubscriptionPlan)
    private planRepository: Repository<SubscriptionPlan>,
    @InjectRepository(BillingAuditLog)
    private auditRepository: Repository<BillingAuditLog>,
  ) {}

  async listSubscriptions(query: ListSubscriptionsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.subscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .leftJoinAndSelect('subscription.organization', 'organization')
      .orderBy('subscription.updated_at', 'DESC')
      .skip(skip)
      .take(limit);

    if (query.status) {
      qb.andWhere('subscription.status = :status', { status: query.status });
    }
    if (query.plan_code) {
      qb.andWhere('plan.plan_code = :planCode', { planCode: query.plan_code });
    }
    if (query.search?.trim()) {
      qb.andWhere('(organization.name ILIKE :search OR organization.billing_email ILIKE :search)', {
        search: `%${query.search.trim()}%`,
      });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((sub) => ({
        id: sub.id,
        status: sub.status,
        current_period_end: sub.current_period_end,
        trial_end: sub.trial_end,
        cancel_at_period_end: sub.cancel_at_period_end,
        plan: {
          id: sub.plan.id,
          code: sub.plan.plan_code,
          name: sub.plan.name,
          price_php: sub.plan.price_php,
        },
        organization: {
          id: sub.organization.id,
          name: sub.organization.name,
          billing_email: sub.organization.billing_email,
          is_active: sub.organization.is_active,
        },
        updated_at: sub.updated_at,
      })),
      page,
      limit,
      total,
    };
  }

  async getSubscriptionDetail(organizationId: string) {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
    });
    if (!organization) throw new NotFoundException('Organization not found');

    const subscription = await this.subscriptionRepository.findOne({
      where: { organization_id: organizationId },
      relations: ['plan'],
      order: { created_at: 'DESC' },
    });
    if (!subscription) throw new NotFoundException('Subscription not found');

    const [invoices, payments] = await Promise.all([
      this.invoiceRepository.find({
        where: { organization_id: organizationId },
        order: { created_at: 'DESC' },
        take: 20,
      }),
      this.paymentRepository.find({
        where: { organization_id: organizationId },
        order: { created_at: 'DESC' },
        take: 20,
      }),
    ]);

    return {
      organization,
      subscription,
      invoices,
      payments,
    };
  }

  async listInvoices(params: { status?: string; organization_id?: string; page?: number; limit?: number }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};
    if (params.status) where.status = params.status;
    if (params.organization_id) where.organization_id = params.organization_id;

    const [items, total] = await this.invoiceRepository.findAndCount({
      where,
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return { items, total, page, limit };
  }

  async listPayments(params: { status?: string; organization_id?: string; page?: number; limit?: number }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};
    if (params.status) where.status = params.status;
    if (params.organization_id) where.organization_id = params.organization_id;

    const [items, total] = await this.paymentRepository.findAndCount({
      where,
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return { items, total, page, limit };
  }

  async suspendSubscription(organizationId: string, actorUserId: string, reason?: string) {
    const subscription = await this.requireSubscription(organizationId);
    const before = { status: subscription.status };
    subscription.status = SubscriptionStatus.SUSPENDED;
    await this.subscriptionRepository.save(subscription);
    await this.logAudit(actorUserId, organizationId, 'subscription.suspended', reason, before, {
      status: subscription.status,
    });
    return subscription;
  }

  async reactivateSubscription(organizationId: string, actorUserId: string, reason?: string) {
    const subscription = await this.requireSubscription(organizationId);
    const before = { status: subscription.status };
    subscription.status = SubscriptionStatus.ACTIVE;
    await this.subscriptionRepository.save(subscription);
    await this.logAudit(actorUserId, organizationId, 'subscription.reactivated', reason, before, {
      status: subscription.status,
    });
    return subscription;
  }

  async changePlan(organizationId: string, planId: string, actorUserId: string, reason?: string) {
    const subscription = await this.requireSubscription(organizationId);
    const plan = await this.planRepository.findOne({ where: { id: planId, is_active: true } });
    if (!plan) throw new NotFoundException('Plan not found');

    const before = { plan_id: subscription.plan_id };
    subscription.plan_id = plan.id;
    subscription.plan = plan;
    await this.subscriptionRepository.save(subscription);
    await this.logAudit(actorUserId, organizationId, 'subscription.plan_changed', reason, before, {
      plan_id: subscription.plan_id,
    });
    return subscription;
  }

  private async requireSubscription(organizationId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { organization_id: organizationId },
      relations: ['plan'],
      order: { created_at: 'DESC' },
    });
    if (!subscription) throw new NotFoundException('Subscription not found');
    return subscription;
  }

  private async logAudit(
    actorUserId: string,
    organizationId: string,
    action: string,
    reason: string | undefined,
    payloadBefore: Record<string, any>,
    payloadAfter: Record<string, any>,
  ) {
    const audit = this.auditRepository.create({
      actor_user_id: actorUserId,
      organization_id: organizationId,
      action,
      reason: reason ?? null,
      payload_before: payloadBefore,
      payload_after: payloadAfter,
    });
    await this.auditRepository.save(audit);
  }
}
