import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, ILike } from 'typeorm';
import { Customer } from '../database/entities/customer.entity';
import { CreditPayment } from '../database/entities/credit-payment.entity';
import { Sale, SaleStatus } from '../database/entities/sale.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(CreditPayment)
    private creditPaymentRepository: Repository<CreditPayment>,
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
    private dataSource: DataSource,
  ) {}

  async create(dto: CreateCustomerDto, storeId: string): Promise<Customer> {
    const customer = this.customerRepository.create({
      ...dto,
      store_id: storeId,
      credit_limit: dto.credit_limit ?? 0,
      current_balance: 0,
      is_active: true,
    });
    return this.customerRepository.save(customer);
  }

  async findAllByStore(storeId: string, search?: string): Promise<Customer[]> {
    const where: any = { store_id: storeId, is_active: true };

    if (search && search.trim()) {
      return this.customerRepository.find({
        where: [
          { ...where, name: ILike(`%${search.trim()}%`) },
          { ...where, phone: ILike(`%${search.trim()}%`) },
        ],
        order: { name: 'ASC' },
      });
    }

    return this.customerRepository.find({
      where,
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string, storeId: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id, store_id: storeId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
    return customer;
  }

  async update(
    id: string,
    dto: UpdateCustomerDto,
    storeId: string,
  ): Promise<Customer> {
    const customer = await this.findOne(id, storeId);
    Object.assign(customer, dto);
    return this.customerRepository.save(customer);
  }

  async deactivate(id: string, storeId: string): Promise<Customer> {
    const customer = await this.findOne(id, storeId);
    customer.is_active = false;
    return this.customerRepository.save(customer);
  }

  async getCreditStatement(customerId: string, storeId: string) {
    const customer = await this.findOne(customerId, storeId);

    // Get credit sales (sales where credit_amount > 0)
    const creditSales = await this.saleRepository.find({
      where: {
        customer_id: customerId,
        store_id: storeId,
        status: SaleStatus.COMPLETED,
      },
      order: { sale_date: 'DESC' },
    });

    // Get credit payments
    const payments = await this.creditPaymentRepository.find({
      where: { customer_id: customerId, store_id: storeId },
      order: { payment_date: 'DESC' },
    });

    // Build unified transaction list sorted by date descending
    const transactions: any[] = [];

    for (const sale of creditSales) {
      if (sale.credit_amount > 0) {
        transactions.push({
          type: 'sale',
          date: sale.sale_date,
          reference: sale.sale_number,
          amount: sale.credit_amount,
          sale_id: sale.id,
        });
      }
    }

    for (const payment of payments) {
      transactions.push({
        type: 'payment',
        date: payment.payment_date,
        reference: `PAY-${payment.id.substring(0, 8).toUpperCase()}`,
        amount: payment.amount,
        payment_method: payment.payment_method,
        notes: payment.notes,
      });
    }

    // Sort by date descending
    transactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    // Calculate running balance (from oldest to newest)
    const sorted = [...transactions].reverse();
    let runningBalance = 0;
    for (const tx of sorted) {
      if (tx.type === 'sale') {
        runningBalance += tx.amount;
      } else {
        runningBalance -= tx.amount;
      }
      tx.running_balance = Math.round(runningBalance * 100) / 100;
    }

    return {
      customer,
      transactions,
      summary: {
        credit_limit: customer.credit_limit,
        current_balance: customer.current_balance,
        available_credit: Math.max(
          0,
          customer.credit_limit - customer.current_balance,
        ),
      },
    };
  }

  async recordPayment(
    customerId: string,
    dto: RecordPaymentDto,
    storeId: string,
    userId: string,
  ) {
    return await this.dataSource.transaction(async (manager) => {
      const customer = await manager.findOne(Customer, {
        where: { id: customerId, store_id: storeId },
      });
      if (!customer) {
        throw new NotFoundException(
          `Customer with ID ${customerId} not found`,
        );
      }

      if (dto.amount > Number(customer.current_balance)) {
        throw new BadRequestException(
          `Payment amount (${dto.amount}) exceeds current balance (${customer.current_balance})`,
        );
      }

      // Create credit payment record
      const payment = manager.create(CreditPayment, {
        customer_id: customerId,
        store_id: storeId,
        sale_id: dto.sale_id || null,
        payment_date: new Date(),
        amount: dto.amount,
        payment_method: dto.payment_method || 'cash',
        notes: dto.notes || null,
        recorded_by: userId,
      });
      await manager.save(CreditPayment, payment);

      // Decrement customer balance
      customer.current_balance =
        Math.round((Number(customer.current_balance) - dto.amount) * 100) / 100;
      await manager.save(Customer, customer);

      return { payment, customer };
    });
  }
}
