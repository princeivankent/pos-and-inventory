import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminSubscriptionsController } from './admin-subscriptions.controller';
import { AdminSubscriptionsService } from './admin-subscriptions.service';
import { Subscription } from '../database/entities/subscription.entity';
import { Organization } from '../database/entities/organization.entity';
import { Invoice } from '../database/entities/invoice.entity';
import { Payment } from '../database/entities/payment.entity';
import { SubscriptionPlan } from '../database/entities/subscription-plan.entity';
import { BillingAuditLog } from '../database/entities/billing-audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subscription,
      Organization,
      Invoice,
      Payment,
      SubscriptionPlan,
      BillingAuditLog,
    ]),
  ],
  controllers: [AdminSubscriptionsController],
  providers: [AdminSubscriptionsService],
})
export class AdminSubscriptionsModule {}

