import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../../database/entities/product.entity';
import { UserStore } from '../../database/entities/user-store.entity';
import { Store } from '../../database/entities/store.entity';
import { UsageLimitGuard } from './usage-limit.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Product, UserStore, Store])],
  providers: [UsageLimitGuard],
  exports: [UsageLimitGuard, TypeOrmModule],
})
export class UsageLimitGuardModule {}
