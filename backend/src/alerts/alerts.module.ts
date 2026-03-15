import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlertsService } from './alerts.service';
import { LowStockAlert } from '../database/entities/low-stock-alert.entity';
import { Product } from '../database/entities/product.entity';
import { Store } from '../database/entities/store.entity';
import { Subscription } from '../database/entities/subscription.entity';
import { SubscriptionPlan } from '../database/entities/subscription-plan.entity';
import { UserStore } from '../database/entities/user-store.entity';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LowStockAlert,
      Product,
      Store,
      Subscription,
      SubscriptionPlan,
      UserStore,
    ]),
    EmailModule,
  ],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class AlertsModule {}
