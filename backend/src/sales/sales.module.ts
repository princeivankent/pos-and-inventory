import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { Sale } from '../database/entities/sale.entity';
import { SaleItem } from '../database/entities/sale-item.entity';
import { Product } from '../database/entities/product.entity';
import { InventoryBatch } from '../database/entities/inventory-batch.entity';
import { StockMovement } from '../database/entities/stock-movement.entity';
import { Store } from '../database/entities/store.entity';
import { Customer } from '../database/entities/customer.entity';
import { UserStore } from '../database/entities/user-store.entity';
import { SubscriptionGuardModule } from '../common/guards/subscription-guard.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sale,
      SaleItem,
      Product,
      InventoryBatch,
      StockMovement,
      Store,
      Customer,
      UserStore,
    ]),
    SubscriptionGuardModule,
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
