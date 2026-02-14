import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from '../database/entities/product.entity';
import { UserStore } from '../database/entities/user-store.entity';
import { SubscriptionGuardModule } from '../common/guards/subscription-guard.module';
import { UsageLimitGuardModule } from '../common/guards/usage-limit-guard.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, UserStore]),
    SubscriptionGuardModule,
    UsageLimitGuardModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
