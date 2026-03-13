import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PAYMENT_GATEWAY, PaymentGateway } from '../payments/payment-gateway.interface';
import { Subscription, SubscriptionStatus } from '../database/entities/subscription.entity';
import { SubscriptionPlan } from '../database/entities/subscription-plan.entity';
import { Organization } from '../database/entities/organization.entity';
import { Store } from '../database/entities/store.entity';
import { UserStore } from '../database/entities/user-store.entity';
import { Product } from '../database/entities/product.entity';
import { Payment, PaymentStatus } from '../database/entities/payment.entity';
import { Invoice, InvoiceStatus } from '../database/entities/invoice.entity';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private configService: ConfigService,
    @Inject(PAYMENT_GATEWAY)
    private paymentGateway: PaymentGateway,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionPlan)
    private planRepository: Repository<SubscriptionPlan>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
    @InjectRepository(UserStore)
    private userStoreRepository: Repository<UserStore>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
  ) {}

  async getCurrentSubscription(organizationId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { organization_id: organizationId },
      relations: ['plan', 'organization'],
      order: { created_at: 'DESC' },
    });

    if (!subscription) {
      throw new NotFoundException('No subscription found');
    }

    return subscription;
  }

  // Returns SubscriptionInfo shape expected by the frontend (matches auth login response)
  async getSubscriptionInfo(organizationId: string) {
    const subscription = await this.subscriptionRepository.findOne({
      where: { organization_id: organizationId },
      relations: ['plan'],
      order: { created_at: 'DESC' },
    });

    if (!subscription) {
      throw new NotFoundException('No subscription found');
    }

    return {
      status: subscription.status,
      plan_code: subscription.plan.plan_code,
      plan_name: subscription.plan.name,
      trial_ends_at: subscription.trial_end,
      current_period_end: subscription.current_period_end,
      features: subscription.plan.features,
      usage: {
        max_stores: subscription.plan.max_stores,
        max_users_per_store: subscription.plan.max_users_per_store,
        max_products_per_store: subscription.plan.max_products_per_store,
      },
    };
  }

  async getUsage(organizationId: string) {
    const subscription = await this.getCurrentSubscription(organizationId);
    const plan = subscription.plan;

    // Count stores
    const storeCount = await this.storeRepository.count({
      where: { organization_id: organizationId },
    });

    // Count users per store and products per store
    const stores = await this.storeRepository.find({
      where: { organization_id: organizationId },
      select: ['id', 'name'],
    });

    const storeUsage = await Promise.all(
      stores.map(async (store) => {
        const userCount = await this.userStoreRepository.count({
          where: { store_id: store.id },
        });
        const productCount = await this.productRepository.count({
          where: { store_id: store.id, is_active: true },
        });
        return {
          store_id: store.id,
          store_name: store.name,
          users: { current: userCount, limit: plan.max_users_per_store },
          products: { current: productCount, limit: plan.max_products_per_store },
        };
      }),
    );

    return {
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan_code: plan.plan_code,
        plan_name: plan.name,
        trial_end: subscription.trial_end,
        current_period_end: subscription.current_period_end,
      },
      stores: { current: storeCount, limit: plan.max_stores },
      store_details: storeUsage,
      features: plan.features,
    };
  }

  async upgradePlan(organizationId: string, newPlanId: string, paymentId?: string) {
    const subscription = await this.getCurrentSubscription(organizationId);
    const newPlan = await this.planRepository.findOne({
      where: { id: newPlanId, is_active: true },
    });

    if (!newPlan) {
      throw new NotFoundException('Plan not found');
    }

    // Idempotency: webhook may have already applied this upgrade before the user
    // clicked "I've Paid — Activate Plan". If the subscription is already on the
    // target plan and active, treat this as a success rather than an error.
    if (subscription.plan_id === newPlanId && subscription.status === SubscriptionStatus.ACTIVE) {
      return {
        message: `Already on ${newPlan.name} plan`,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          plan_code: newPlan.plan_code,
          plan_name: newPlan.name,
          current_period_end: subscription.current_period_end,
        },
      };
    }

    if (newPlan.sort_order <= subscription.plan.sort_order) {
      throw new BadRequestException(
        'Cannot upgrade to a lower or same tier plan. Use downgrade instead.',
      );
    }

    const bypassPayment = this.configService.get<string>('BYPASS_PAYMENT', 'true') === 'true';
    if (!bypassPayment) {
      if (!paymentId) {
        throw new BadRequestException('payment_id is required when BYPASS_PAYMENT=false');
      }
      await this.validateSuccessfulUpgradePayment(organizationId, newPlanId, paymentId);
    }

    // Upgrade immediately
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Set both the FK column and the relation object — TypeORM resolves the FK
    // from the in-memory relation reference when saving, not the plain column.
    subscription.plan_id = newPlan.id;
    subscription.plan = newPlan;
    subscription.status = SubscriptionStatus.ACTIVE;
    subscription.current_period_start = now;
    subscription.current_period_end = periodEnd;
    subscription.trial_start = null;
    subscription.trial_end = null;

    await this.subscriptionRepository.save(subscription);

    return {
      message: `Successfully upgraded to ${newPlan.name} plan`,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        plan_code: newPlan.plan_code,
        plan_name: newPlan.name,
        current_period_end: subscription.current_period_end,
      },
    };
  }

  private async validateSuccessfulUpgradePayment(
    organizationId: string,
    planId: string,
    paymentId: string,
  ) {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId, organization_id: organizationId },
      relations: ['invoice'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    if (payment.metadata?.target_plan_id !== planId) {
      throw new BadRequestException('Payment does not match selected target plan');
    }

    const maxAgeMs = 30 * 60 * 1000;
    const paymentAge = Date.now() - new Date(payment.created_at).getTime();
    if (paymentAge > maxAgeMs) {
      throw new BadRequestException('Payment is too old. Please start a new upgrade payment.');
    }

    // If still pending, check PayMongo directly and sync status
    if (payment.status !== PaymentStatus.SUCCEEDED) {
      try {
        const session = await this.paymentGateway.getCheckoutSession(payment.gateway_payment_id);
        if (session.status === 'succeeded') {
          payment.status = PaymentStatus.SUCCEEDED;
          await this.paymentRepository.save(payment);
          if (payment.invoice_id) {
            await this.invoiceRepository.update(payment.invoice_id, {
              status: InvoiceStatus.PAID,
              paid_at: new Date(),
            });
          }
          this.logger.log(`Payment ${payment.id} synced to SUCCEEDED from PayMongo`);
        } else {
          throw new BadRequestException('Payment is not successful yet');
        }
      } catch (err) {
        if (err instanceof BadRequestException) throw err;
        this.logger.error('Failed to verify payment with PayMongo', err);
        throw new BadRequestException('Payment is not successful yet');
      }
    }
  }

  async downgradePlan(organizationId: string, newPlanId: string) {
    const subscription = await this.getCurrentSubscription(organizationId);
    const newPlan = await this.planRepository.findOne({
      where: { id: newPlanId, is_active: true },
    });

    if (!newPlan) {
      throw new NotFoundException('Plan not found');
    }

    if (newPlan.sort_order >= subscription.plan.sort_order) {
      throw new BadRequestException(
        'Cannot downgrade to a higher or same tier plan. Use upgrade instead.',
      );
    }

    // Validate current usage fits in the new plan
    const storeCount = await this.storeRepository.count({
      where: { organization_id: organizationId },
    });

    if (storeCount > newPlan.max_stores) {
      throw new ForbiddenException(
        `You currently have ${storeCount} stores but the ${newPlan.name} plan only allows ${newPlan.max_stores}. Please remove stores first.`,
      );
    }

    // Check users and products per store
    const stores = await this.storeRepository.find({
      where: { organization_id: organizationId },
      select: ['id', 'name'],
    });

    for (const store of stores) {
      const userCount = await this.userStoreRepository.count({
        where: { store_id: store.id },
      });
      if (userCount > newPlan.max_users_per_store) {
        throw new ForbiddenException(
          `Store "${store.name}" has ${userCount} users but the ${newPlan.name} plan only allows ${newPlan.max_users_per_store}. Please remove users first.`,
        );
      }

      const productCount = await this.productRepository.count({
        where: { store_id: store.id, is_active: true },
      });
      if (productCount > newPlan.max_products_per_store) {
        throw new ForbiddenException(
          `Store "${store.name}" has ${productCount} products but the ${newPlan.name} plan only allows ${newPlan.max_products_per_store}. Please remove products first.`,
        );
      }
    }

    // Downgrade at period end (or immediately if trial)
    if (subscription.status === SubscriptionStatus.TRIAL) {
      subscription.plan_id = newPlan.id;
      subscription.plan = newPlan;
      await this.subscriptionRepository.save(subscription);
    } else {
      // Schedule downgrade at period end
      subscription.usage_stats = {
        ...subscription.usage_stats,
        pending_downgrade_plan_id: newPlan.id,
      };
      await this.subscriptionRepository.save(subscription);
    }

    return {
      message:
        subscription.status === SubscriptionStatus.TRIAL
          ? `Successfully downgraded to ${newPlan.name} plan`
          : `Your plan will be downgraded to ${newPlan.name} at the end of your current billing period`,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_plan: subscription.plan.name,
        new_plan: newPlan.name,
        effective_date:
          subscription.status === SubscriptionStatus.TRIAL
            ? new Date()
            : subscription.current_period_end,
      },
    };
  }

  async cancelSubscription(organizationId: string, immediate: boolean = false) {
    const subscription = await this.getCurrentSubscription(organizationId);

    if (
      subscription.status === SubscriptionStatus.CANCELLED ||
      subscription.status === SubscriptionStatus.EXPIRED
    ) {
      throw new BadRequestException('Subscription is already cancelled');
    }

    if (immediate || subscription.status === SubscriptionStatus.TRIAL) {
      subscription.status = SubscriptionStatus.CANCELLED;
    } else {
      subscription.cancel_at_period_end = true;
    }

    await this.subscriptionRepository.save(subscription);

    return {
      message: immediate || subscription.status === SubscriptionStatus.CANCELLED
        ? 'Subscription cancelled immediately'
        : 'Subscription will be cancelled at the end of your billing period',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end,
        current_period_end: subscription.current_period_end,
      },
    };
  }

  async createTrialSubscription(
    organizationId: string,
    planCode: string = 'tindahan',
    trialDays: number = 14,
  ) {
    const plan = await this.planRepository.findOne({
      where: { plan_code: planCode, is_active: true },
    });

    if (!plan) {
      throw new NotFoundException(`Plan '${planCode}' not found`);
    }

    const now = new Date();
    const trialEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

    const subscription = this.subscriptionRepository.create({
      organization_id: organizationId,
      plan_id: plan.id,
      status: SubscriptionStatus.TRIAL,
      trial_start: now,
      trial_end: trialEnd,
    });

    return this.subscriptionRepository.save(subscription);
  }
}
