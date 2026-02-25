import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Sale, SaleStatus } from '../database/entities/sale.entity';
import { SaleItem } from '../database/entities/sale-item.entity';
import { Product } from '../database/entities/product.entity';
import { InventoryBatch } from '../database/entities/inventory-batch.entity';
import { SalesReportDto } from './dto/sales-report.dto';
import { ProfitReportDto } from './dto/profit-report.dto';
import { TrendMetadataDto } from './dto/trend-metadata.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private saleItemRepository: Repository<SaleItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(InventoryBatch)
    private batchRepository: Repository<InventoryBatch>,
  ) {}

  /**
   * Calculate trend metadata by comparing current vs previous period
   */
  private calculateTrend(
    current: number,
    previous: number,
    precision = 1,
  ): TrendMetadataDto {
    if (previous === 0) {
      // Edge case: no previous data
      return {
        value: current,
        change_amount: current,
        change_percentage: current > 0 ? 100 : 0,
        trend: current > 0 ? 'up' : 'neutral',
        previous_value: 0,
      };
    }

    const changeAmount = current - previous;
    const changePercentage = (changeAmount / previous) * 100;

    return {
      value: current,
      change_amount: Math.round(changeAmount * 100) / 100,
      change_percentage:
        Math.round(changePercentage * Math.pow(10, precision)) /
        Math.pow(10, precision),
      trend:
        changePercentage > 0.5 ? 'up' : changePercentage < -0.5 ? 'down' : 'neutral',
      previous_value: previous,
    };
  }

  /**
   * Calculate previous period date range based on current period
   */
  private getPreviousDateRange(
    period: string,
    startDate: Date,
    endDate: Date,
  ): { previousStart: Date; previousEnd: Date } {
    const diff = endDate.getTime() - startDate.getTime();
    const previousEnd = new Date(startDate.getTime() - 1); // Day before current period
    const previousStart = new Date(previousEnd.getTime() - diff);

    return { previousStart, previousEnd };
  }

  /**
   * Get sales summary for a specific date range (reusable for current and previous periods)
   */
  private async getSalesSummaryForPeriod(
    storeId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalSales: number;
    totalRevenue: number;
    totalTax: number;
    totalDiscount: number;
    netSales: number;
  }> {
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

    return {
      totalSales,
      totalRevenue,
      totalTax,
      totalDiscount,
      netSales,
    };
  }

  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private async getProfitSummaryForPeriod(
    storeId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    totalRevenue: number;
    totalCost: number;
    fallbackRows: number;
  }> {
    const result = await this.saleItemRepository
      .createQueryBuilder('si')
      .select('SUM(si.subtotal)', 'total_revenue')
      .addSelect(
        `
          SUM(
            CASE
              WHEN si.cogs_subtotal IS NOT NULL THEN si.cogs_subtotal
              WHEN b.unit_cost IS NOT NULL THEN si.quantity * b.unit_cost
              ELSE si.quantity * p.cost_price
            END
          )
        `,
        'total_cost',
      )
      .addSelect(
        `
          SUM(
            CASE
              WHEN si.cogs_subtotal IS NULL THEN 1
              ELSE 0
            END
          )
        `,
        'fallback_rows',
      )
      .innerJoin('si.sale', 's')
      .innerJoin('si.product', 'p')
      .leftJoin('si.batch', 'b')
      .where('s.store_id = :storeId', { storeId })
      .andWhere('s.sale_date BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .andWhere('s.status = :status', { status: SaleStatus.COMPLETED })
      .getRawOne();

    return {
      totalRevenue: Number(result?.total_revenue || 0),
      totalCost: Number(result?.total_cost || 0),
      fallbackRows: Number(result?.fallback_rows || 0),
    };
  }

  async getSalesSummary(
    storeId: string,
    period: string,
    date: string,
  ): Promise<SalesReportDto> {
    const { startDate, endDate } = this.getDateRange(period, date);

    // Get previous period date range
    const { previousStart, previousEnd } = this.getPreviousDateRange(
      period,
      startDate,
      endDate,
    );

    // Fetch current and previous period data in parallel
    const [current, previous] = await Promise.all([
      this.getSalesSummaryForPeriod(storeId, startDate, endDate),
      this.getSalesSummaryForPeriod(storeId, previousStart, previousEnd),
    ]);

    // Calculate trends
    const totalSalesTrend = this.calculateTrend(
      current.totalRevenue,
      previous.totalRevenue,
    );
    const totalTransactionsTrend = this.calculateTrend(
      current.totalSales,
      previous.totalSales,
    );
    const totalTaxTrend = this.calculateTrend(current.totalTax, previous.totalTax);
    const netSalesTrend = this.calculateTrend(current.netSales, previous.netSales);

    // Build daily breakdown (keep existing logic)
    const sales = await this.saleRepository.find({
      where: {
        store_id: storeId,
        sale_date: Between(startDate, endDate),
        status: SaleStatus.COMPLETED,
      },
    });

    const dailyMap = new Map<
      string,
      { total_sales: number; transaction_count: number }
    >();
    for (const sale of sales) {
      const d = new Date(sale.sale_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const entry = dailyMap.get(key) || {
        total_sales: 0,
        transaction_count: 0,
      };
      entry.total_sales += Number(sale.total_amount);
      entry.transaction_count += 1;
      dailyMap.set(key, entry);
    }

    const dailyBreakdown: {
      date: string;
      total_sales: number;
      transaction_count: number;
    }[] = [];
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
      total_sales: Math.round(current.totalRevenue * 100) / 100,
      total_sales_trend: totalSalesTrend,
      total_transactions: current.totalSales,
      total_transactions_trend: totalTransactionsTrend,
      total_tax: Math.round(current.totalTax * 100) / 100,
      total_tax_trend: totalTaxTrend,
      net_sales: Math.round(current.netSales * 100) / 100,
      net_sales_trend: netSalesTrend,
      total_discount: Math.round(current.totalDiscount * 100) / 100,
      daily_breakdown: dailyBreakdown,
    };
  }

  async getInventoryReport(storeId: string): Promise<any> {
    const products = await this.productRepository.find({
      where: { store_id: storeId, is_active: true },
      relations: ['category'],
      order: { name: 'ASC' },
    });

    const productStockValuesRaw = await this.batchRepository
      .createQueryBuilder('b')
      .select('b.product_id', 'product_id')
      .addSelect('SUM(b.current_quantity * b.unit_cost)', 'stock_value')
      .where('b.store_id = :storeId', { storeId })
      .andWhere('b.is_active = true')
      .andWhere('b.current_quantity > 0')
      .groupBy('b.product_id')
      .getRawMany();

    const productStockValues = new Map<string, number>();
    for (const row of productStockValuesRaw) {
      productStockValues.set(row.product_id, Number(row.stock_value || 0));
    }

    const totalProducts = products.length;
    const totalStockValue = products.reduce((sum, p) => {
      return sum + Number(productStockValues.get(p.id) || 0);
    }, 0);
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
      total_stock_value: this.round2(totalStockValue),
      total_retail_value: this.round2(totalRetailValue),
      low_stock_count: lowStockCount,
      out_of_stock_count: outOfStockCount,
      products: products.map((p) => ({
        product_id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category?.name,
        current_stock: Number(p.current_stock),
        reorder_level: Number(p.reorder_level),
        cost_price: Number(p.cost_price),
        retail_price: Number(p.retail_price),
        stock_value: this.round2(Number(productStockValues.get(p.id) || 0)),
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
  ): Promise<ProfitReportDto> {
    const { startDate, endDate } = this.getDateRange(period, date);

    // Get previous period date range
    const { previousStart, previousEnd } = this.getPreviousDateRange(
      period,
      startDate,
      endDate,
    );

    const [current, previous] = await Promise.all([
      this.getProfitSummaryForPeriod(storeId, startDate, endDate),
      this.getProfitSummaryForPeriod(storeId, previousStart, previousEnd),
    ]);

    const totalRevenue = current.totalRevenue;
    const totalCost = current.totalCost;
    const grossProfit = totalRevenue - totalCost;
    const profitMargin =
      totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    const previousRevenue = previous.totalRevenue;
    const previousCost = previous.totalCost;
    const previousProfit = previousRevenue - previousCost;
    const previousMargin =
      previousRevenue > 0 ? (previousProfit / previousRevenue) * 100 : 0;

    // Calculate trends
    const totalRevenueTrend = this.calculateTrend(totalRevenue, previousRevenue);
    const totalCostTrend = this.calculateTrend(totalCost, previousCost);
    const grossProfitTrend = this.calculateTrend(grossProfit, previousProfit);
    const profitMarginTrend = this.calculateTrend(profitMargin, previousMargin);

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

    const warnings: string[] = [];
    if (current.fallbackRows > 0) {
      warnings.push(
        `${current.fallbackRows} sale item(s) used fallback costing due to missing cost snapshots.`,
      );
    }

    return {
      period,
      start_date: startDate,
      end_date: endDate,
      costing_method: 'fifo_snapshot_with_legacy_fallback',
      legacy_fallback_rows: current.fallbackRows,
      warnings,
      total_revenue: this.round2(totalRevenue),
      total_revenue_trend: totalRevenueTrend,
      total_cost: this.round2(totalCost),
      total_cost_trend: totalCostTrend,
      gross_profit: this.round2(grossProfit),
      gross_profit_trend: grossProfitTrend,
      profit_margin: this.round2(profitMargin),
      profit_margin_trend: profitMarginTrend,
      total_discount: this.round2(Number(salesAgg?.total_discount || 0)),
      total_tax: this.round2(Number(salesAgg?.total_tax || 0)),
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
