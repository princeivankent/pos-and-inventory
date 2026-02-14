import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { Customer } from '../database/entities/customer.entity';
import { CreditPayment } from '../database/entities/credit-payment.entity';
import { Sale } from '../database/entities/sale.entity';
import { UserStore } from '../database/entities/user-store.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, CreditPayment, Sale, UserStore]),
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
