import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Sale, SaleStatus } from '../database/entities/sale.entity';
import { SaleItem } from '../database/entities/sale-item.entity';
import { Product } from '../database/entities/product.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private saleItemRepository: Repository<SaleItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async getSalesSummary(
    storeId: string,
    period: string,
    date: string,
  ): Promise<any> {
    const { startDate, endDate } = this.getDateRange(period, date);

    const sales = await this.saleRepository.find({
      where: {
        store_id: storeId,
        sale_date: Between(startDate, endDate),
        status: SaleStatus.COMPLETED,
      },
    });

    const totalSales = sales.length;
    const totalRevenue = sales.reduce(
      (sum, s) => sum + Number(s.total_amount),
      0,
    );
    const totalTax = sales.reduce((sum, s) => sum + Number(s.tax_amount), 0);
    const totalDiscount = sales.reduce(
      (sum, s) => sum + Number(s.discount_amount),
      0,
    );

    const netSales = totalRevenue - totalTax - totalDiscount;

    // Build daily breakdown
    const dailyMap = new Map<string, { total_sales: number; transaction_count: number }>();
    for (const sale of sales) {
      const d = new Date(sale.sale_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const entry = dailyMap.get(key) || { total_sales: 0, transaction_count: 0 };
      entry.total_sales += Number(sale.total_amount);
      entry.transaction_count += 1;
      dailyMap.set(key, entry);
    }

    const dailyBreakdown: { date: string; total_sales: number; transaction_count: number }[] = [];
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
      const entry = dailyMap.get(key);
      dailyBreakdown.push({
        date: key,
        total_sales: entry ? Math.round(entry.total_sales * 100) / 100 : 0,
        transaction_count: entry ? entry.transaction_count : 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return {
      period,
      start_date: startDate,
      end_date: endDate,
      total_sales: Math.round(totalRevenue * 100) / 100,
      total_transactions: totalSales,
      total_tax: Math.round(totalTax * 100) / 100,
      total_discount: Math.round(totalDiscount * 100) / 100,
      net_sales: Math.round(netSales * 100) / 100,
      daily_breakdown: dailyBreakdown,
    };
  }

  async getInventoryReport(storeId: string): Promise<any> {
    const products = await this.productRepository.find({
      where: { store_id: storeId, is_active: true },
      relations: ['category'],
      order: { name: 'ASC' },
    });

    const totalProducts = products.length;
    const totalStockValue = products.reduce(
      (sum, p) => sum + Number(p.cost_price) * Number(p.current_stock),
      0,
    );
    const totalRetailValue = products.reduce(
      (sum, p) => sum + Number(p.retail_price) * Number(p.current_stock),
      0,
    );
    const lowStockCount = products.filter(
      (p) => Number(p.current_stock) <= Number(p.reorder_level),
    ).length;
    const outOfStockCount = products.filter(
      (p) => Number(p.current_stock) === 0,
    ).length;

    return {
      total_products: totalProducts,
      total_stock_value: Math.round(totalStockValue * 100) / 100,
      total_retail_value: Math.round(totalRetailValue * 100) / 100,
      low_stock_count: lowStockCount,
      out_of_stock_count: outOfStockCount,
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category?.name,
        current_stock: Number(p.current_stock),
        reorder_level: Number(p.reorder_level),
        cost_price: Number(p.cost_price),
        retail_price: Number(p.retail_price),
        stock_value: Math.round(Number(p.cost_price) * Number(p.current_stock) * 100) / 100,
      })),
    };
  }

  async getBestSelling(
    storeId: string,
    period: string,
    date: string,
    limit = 10,
  ): Promise<any> {
    const { startDate, endDate } = this.getDateRange(period, date);

    const results = await this.saleItemRepository
      .createQueryBuilder('si')
      .select('si.product_id', 'product_id')
      .addSelect('p.name', 'product_name')
      .addSelect('p.sku', 'sku')
      .addSelect('SUM(si.quantity)', 'total_quantity')
      .addSelect('SUM(si.subtotal)', 'total_revenue')
      .innerJoin('si.sale', 's')
      .innerJoin('si.product', 'p')
      .where('s.store_id = :storeId', { storeId })
      .andWhere('s.sale_date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('s.status = :status', { status: SaleStatus.COMPLETED })
      .groupBy('si.product_id')
      .addGroupBy('p.name')
      .addGroupBy('p.sku')
      .orderBy('total_quantity', 'DESC')
      .limit(limit)
      .getRawMany();

    return results.map((r) => ({
      product_id: r.product_id,
      name: r.product_name,
      sku: r.sku,
      total_quantity: Number(r.total_quantity),
      total_revenue: Math.round(Number(r.total_revenue) * 100) / 100,
    }));
  }

  async getProfitReport(
    storeId: string,
    period: string,
    date: string,
  ): Promise<any> {
    const { startDate, endDate } = this.getDateRange(period, date);

    const results = await this.saleItemRepository
      .createQueryBuilder('si')
      .select('SUM(si.subtotal)', 'total_revenue')
      .addSelect('SUM(si.quantity * p.cost_price)', 'total_cost')
      .innerJoin('si.sale', 's')
      .innerJoin('si.product', 'p')
      .where('s.store_id = :storeId', { storeId })
      .andWhere('s.sale_date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('s.status = :status', { status: SaleStatus.COMPLETED })
      .getRawOne();

    const totalRevenue = Number(results?.total_revenue || 0);
    const totalCost = Number(results?.total_cost || 0);
    const grossProfit = totalRevenue - totalCost;
    const profitMargin =
      totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // Get total discounts and taxes for the period
    const salesAgg = await this.saleRepository
      .createQueryBuilder('s')
      .select('SUM(s.discount_amount)', 'total_discount')
      .addSelect('SUM(s.tax_amount)', 'total_tax')
      .addSelect('COUNT(*)', 'total_transactions')
      .where('s.store_id = :storeId', { storeId })
      .andWhere('s.sale_date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('s.status = :status', { status: SaleStatus.COMPLETED })
      .getRawOne();

    return {
      period,
      start_date: startDate,
      end_date: endDate,
      total_revenue: Math.round(totalRevenue * 100) / 100,
      total_cost: Math.round(totalCost * 100) / 100,
      gross_profit: Math.round(grossProfit * 100) / 100,
      profit_margin: Math.round(profitMargin * 100) / 100,
      total_discount: Math.round(
        Number(salesAgg?.total_discount || 0) * 100,
      ) / 100,
      total_tax: Math.round(Number(salesAgg?.total_tax || 0) * 100) / 100,
      total_transactions: Number(salesAgg?.total_transactions || 0),
    };
  }

  private getDateRange(
    period: string,
    date: string,
  ): { startDate: Date; endDate: Date } {
    const dateStr = date || (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`; })();
    const baseDate = new Date(dateStr + 'T00:00:00');

    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'weekly': {
        const day = baseDate.getDay();
        startDate = new Date(baseDate);
        startDate.setDate(baseDate.getDate() - day);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
      case 'monthly': {
        startDate = new Date(
          baseDate.getFullYear(),
          baseDate.getMonth(),
          1,
          0,
          0,
          0,
          0,
        );
        endDate = new Date(
          baseDate.getFullYear(),
          baseDate.getMonth() + 1,
          0,
          23,
          59,
          59,
          999,
        );
        break;
      }
      case 'daily':
      default: {
        startDate = new Date(baseDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(baseDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      }
    }

    return { startDate, endDate };
  }
}
