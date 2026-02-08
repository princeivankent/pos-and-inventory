import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReceiptsService } from './receipts.service';
import { ReceiptsController } from './receipts.controller';
import { Sale } from '../database/entities/sale.entity';
import { SaleItem } from '../database/entities/sale-item.entity';
import { Store } from '../database/entities/store.entity';
import { User } from '../database/entities/user.entity';
import { UserStore } from '../database/entities/user-store.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sale, SaleItem, Store, User, UserStore])],
  controllers: [ReceiptsController],
  providers: [ReceiptsService],
  exports: [ReceiptsService],
})
export class ReceiptsModule {}
