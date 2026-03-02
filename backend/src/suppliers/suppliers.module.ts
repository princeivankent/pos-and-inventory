import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuppliersService } from './suppliers.service';
import { SuppliersController } from './suppliers.controller';
import { Supplier } from '../database/entities/supplier.entity';
import { UserStore } from '../database/entities/user-store.entity';
import { SubscriptionGuardModule } from '../common/guards/subscription-guard.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Supplier, UserStore]),
    SubscriptionGuardModule,
  ],
  controllers: [SuppliersController],
  providers: [SuppliersService],
  exports: [SuppliersService],
})
export class SuppliersModule {}
