import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { BillingController } from './billing.controller';
import { SubscriptionService } from './subscription.service';
import { UsageTrackerService } from './usage-tracker.service';
import { SubscriptionRenewalService } from './subscription-renewal.service';
import { Subscription } from '../database/entities/subscription.entity';
import { SubscriptionPlan } from '../database/entities/subscription-plan.entity';
import { Organization } from '../database/entities/organization.entity';
import { Store } from '../database/entities/store.entity';
import { UserStore } from '../database/entities/user-store.entity';
import { Product } from '../database/entities/product.entity';
import { SubscriptionGuardModule } from '../common/guards/subscription-guard.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subscription,
      SubscriptionPlan,
      Organization,
      Store,
      UserStore,
      Product,
    ]),
    SubscriptionGuardModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [BillingController],
  providers: [SubscriptionService, UsageTrackerService, SubscriptionRenewalService],
  exports: [SubscriptionService, UsageTrackerService],
})
export class BillingModule {}
