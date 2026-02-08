import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { Product } from '../database/entities/product.entity';
import { InventoryBatch } from '../database/entities/inventory-batch.entity';
import { StockMovement } from '../database/entities/stock-movement.entity';
import { UserStore } from '../database/entities/user-store.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      InventoryBatch,
      StockMovement,
      UserStore,
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
