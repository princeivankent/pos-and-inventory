import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ReportsComponent } from './reports';
import { SubscriptionService } from '../../core/services/subscription.service';
import { CsvExportService } from '../../core/services/csv-export.service';

describe('ReportsComponent', () => {
  let fixture: ComponentFixture<ReportsComponent>;
  let component: ReportsComponent;
  let controller: HttpTestingController;
  const csvExport = { export: vi.fn() };

  const mockSalesReport = {
    period: 'daily',
    start_date: '2026-03-14',
    end_date: '2026-03-14',
    total_sales: 5000,
    total_transactions: 10,
    total_tax: 535.71,
    total_discount: 0,
    net_sales: 4464.29,
    daily_breakdown: [
      { date: '2026-03-14', total_sales: 5000, transaction_count: 10 },
    ],
  };

  const mockInventoryReport = {
    total_products: 2,
    total_stock_value: 10000,
    low_stock_count: 1,
    out_of_stock_count: 0,
    products: [
      { product_id: 'p1', name: 'Coffee', sku: 'COF-1', current_stock: 10, retail_price: 120, cost_price: 80, stock_value: 800, reorder_level: 2 },
    ],
  };

  const mockBestSelling = [
    { product_id: 'p1', name: 'Coffee', sku: 'COF-1', total_quantity: 50, total_revenue: 6000 },
  ];

  const mockProfitReport = {
    period: 'daily',
    start_date: '2026-03-14',
    end_date: '2026-03-14',
    total_revenue: 5000,
    total_cost: 3000,
    gross_profit: 2000,
    profit_margin: 40,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportsComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SubscriptionService, useValue: { hasFeatureSignal: vi.fn(() => () => true) } },
        { provide: CsvExportService, useValue: csvExport },
      ],
    })
      .overrideComponent(ReportsComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(ReportsComponent);
    component = fixture.componentInstance;
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
    vi.clearAllMocks();
  });

  function flushInitialRequests() {
    controller.expectOne((req) => req.url.includes('/api/reports/sales')).flush(mockSalesReport);
    controller.expectOne('/api/reports/inventory').flush(mockInventoryReport);
    controller.expectOne((req) => req.url.includes('/api/reports/best-selling')).flush(mockBestSelling);
    controller.expectOne((req) => req.url.includes('/api/reports/profit')).flush(mockProfitReport);
  }

  it('loads all four reports on init', () => {
    fixture.detectChanges();
    flushInitialRequests();

    expect(component.salesReport()).not.toBeNull();
    expect(component.inventoryReport()).not.toBeNull();
    expect(component.bestSelling().length).toBe(1);
    expect(component.profitReport()).not.toBeNull();
  });

  it('canExport signal reflects SubscriptionService', () => {
    expect(component.canExport()).toBe(true);
  });

  // --- exportSalesCsv ---
  it('exportSalesCsv exports daily_breakdown with correct columns', () => {
    fixture.detectChanges();
    flushInitialRequests();

    component.exportSalesCsv();

    expect(csvExport.export).toHaveBeenCalledOnce();
    const [data, columns, filename] = csvExport.export.mock.calls[0];
    expect(data).toHaveLength(1);
    expect(data[0].date).toBe('2026-03-14');
    expect(columns.map((c: any) => c.header)).toEqual(['Date', 'Total Sales', 'Transactions']);
    expect(filename).toMatch(/^sales-report-daily-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it('exportSalesCsv exports empty array when no daily_breakdown', () => {
    fixture.detectChanges();
    flushInitialRequests();

    component.salesReport.set({ ...mockSalesReport, daily_breakdown: undefined });
    component.exportSalesCsv();

    const [data] = csvExport.export.mock.calls[0];
    expect(data).toHaveLength(0);
  });

  // --- exportInventoryCsv ---
  it('exportInventoryCsv exports inventory products with correct columns', () => {
    fixture.detectChanges();
    flushInitialRequests();

    component.exportInventoryCsv();

    expect(csvExport.export).toHaveBeenCalledOnce();
    const [data, columns, filename] = csvExport.export.mock.calls[0];
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe('Coffee');
    expect(columns.map((c: any) => c.header)).toEqual(['Product', 'SKU', 'Stock', 'Reorder Level', 'Stock Value']);
    expect(filename).toMatch(/^inventory-report-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it('exportInventoryCsv exports empty array when no inventory report', () => {
    fixture.detectChanges();
    flushInitialRequests();

    component.inventoryReport.set(null);
    component.exportInventoryCsv();

    const [data] = csvExport.export.mock.calls[0];
    expect(data).toHaveLength(0);
  });

  // --- exportBestSellingCsv ---
  it('exportBestSellingCsv exports items with rank prepended', () => {
    fixture.detectChanges();
    flushInitialRequests();

    component.exportBestSellingCsv();

    expect(csvExport.export).toHaveBeenCalledOnce();
    const [data, columns, filename] = csvExport.export.mock.calls[0];
    expect(data[0].rank).toBe(1);
    expect(columns.map((c: any) => c.header)).toEqual(['Rank', 'Product', 'SKU', 'Qty Sold', 'Revenue']);
    expect(filename).toMatch(/^best-selling-monthly-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  // --- exportProfitCsv ---
  it('exportProfitCsv exports a single summary row with correct columns', () => {
    fixture.detectChanges();
    flushInitialRequests();

    component.exportProfitCsv();

    expect(csvExport.export).toHaveBeenCalledOnce();
    const [data, columns, filename] = csvExport.export.mock.calls[0];
    expect(data).toHaveLength(1);
    expect(data[0].revenue).toBe(5000);
    expect(data[0].gross_profit).toBe(2000);
    expect(data[0].margin_pct).toBe(40);
    expect(columns.map((c: any) => c.header)).toEqual(['Period', 'Start Date', 'End Date', 'Revenue', 'Cost', 'Gross Profit', 'Margin %']);
    expect(filename).toMatch(/^profit-report-daily-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it('exportProfitCsv does nothing when profitReport is null', () => {
    fixture.detectChanges();
    flushInitialRequests();

    component.profitReport.set(null);
    component.exportProfitCsv();

    expect(csvExport.export).not.toHaveBeenCalled();
  });
});
