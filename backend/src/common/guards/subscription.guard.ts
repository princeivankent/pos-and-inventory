import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from '../../database/entities/store.entity';
import { Subscription, SubscriptionStatus } from '../../database/entities/subscription.entity';
import { RequestWithUser } from '../interfaces/request-with-user.interface';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
    @InjectRepository(Subscription)
    private subscriptionRepository: Repository<Subscription>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    const storeId = user?.storeId;

    // If no storeId yet (TenantGuard hasn't run or endpoint doesn't need it), pass through
    if (!storeId) {
      return true;
    }

    // Look up store's organization_id
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
      select: ['id', 'organization_id'],
    });

    // Legacy store without organization - pass through
    if (!store || !store.organization_id) {
      return true;
    }

    // Find active or trial subscription for this organization
    const subscription = await this.subscriptionRepository.findOne({
      where: { organization_id: store.organization_id },
      relations: ['plan'],
      order: { created_at: 'DESC' },
    });

    if (!subscription) {
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          message: 'No active subscription found. Please subscribe to a plan.',
          error: 'Payment Required',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    // Check subscription status
    const now = new Date();
    const isExpired = this.isSubscriptionExpired(subscription, now);

    if (isExpired) {
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          message: subscription.status === SubscriptionStatus.TRIAL
            ? 'Your free trial has expired. Please subscribe to continue.'
            : 'Your subscription has expired. Please renew to continue.',
          error: 'Payment Required',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const blockedStatuses: string[] = [
      SubscriptionStatus.SUSPENDED,
      SubscriptionStatus.CANCELLED,
      SubscriptionStatus.EXPIRED,
    ];

    if (blockedStatuses.includes(subscription.status)) {
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          message: `Your subscription is ${subscription.status}. Please contact support or renew.`,
          error: 'Payment Required',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    // Inject subscription context into request
    request.user.organizationId = store.organization_id;
    request.user.subscription = {
      id: subscription.id,
      status: subscription.status,
      plan: {
        id: subscription.plan.id,
        plan_code: subscription.plan.plan_code,
        name: subscription.plan.name,
        price_php: subscription.plan.price_php,
        max_stores: subscription.plan.max_stores,
        max_users_per_store: subscription.plan.max_users_per_store,
        max_products_per_store: subscription.plan.max_products_per_store,
        features: subscription.plan.features,
      },
      trial_end: subscription.trial_end,
      current_period_end: subscription.current_period_end,
    };

    return true;
  }

  private isSubscriptionExpired(subscription: Subscription, now: Date): boolean {
    if (subscription.status === SubscriptionStatus.TRIAL && subscription.trial_end) {
      return now > new Date(subscription.trial_end);
    }

    if (subscription.status === SubscriptionStatus.ACTIVE && subscription.current_period_end) {
      return now > new Date(subscription.current_period_end);
    }

    return false;
  }
}
