import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from '../../database/entities/store.entity';
import { Subscription } from '../../database/entities/subscription.entity';
import { SubscriptionGuard } from './subscription.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Store, Subscription])],
  providers: [SubscriptionGuard],
  exports: [SubscriptionGuard, TypeOrmModule],
})
export class SubscriptionGuardModule {}
