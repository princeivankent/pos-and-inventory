import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoresService } from './stores.service';
import { StoresController } from './stores.controller';
import { Store } from '../database/entities/store.entity';
import { UserStore } from '../database/entities/user-store.entity';
import { SubscriptionGuardModule } from '../common/guards/subscription-guard.module';
import { UsageLimitGuardModule } from '../common/guards/usage-limit-guard.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Store, UserStore]),
    SubscriptionGuardModule,
    UsageLimitGuardModule,
  ],
  controllers: [StoresController],
  providers: [StoresService],
  exports: [StoresService],
})
export class StoresModule {}
