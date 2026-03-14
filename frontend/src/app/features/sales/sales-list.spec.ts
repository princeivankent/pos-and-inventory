import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SalesListComponent } from './sales-list';
import { ToastService } from '../../core/services/toast.service';
import { StoreContextService } from '../../core/services/store-context.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import { CsvExportService } from '../../core/services/csv-export.service';
import { ConfirmationService } from 'primeng/api';

describe('SalesListComponent', () => {
  let fixture: ComponentFixture<SalesListComponent>;
  let component: SalesListComponent;
  let controller: HttpTestingController;
  const toast = { success: vi.fn() };
  const csvExport = { export: vi.fn() };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalesListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ToastService, useValue: toast },
        { provide: StoreContextService, useValue: { isAdmin: vi.fn(() => true) } },
        { provide: SubscriptionService, useValue: { hasFeatureSignal: vi.fn(() => () => true) } },
        { provide: CsvExportService, useValue: csvExport },
        { provide: ConfirmationService, useValue: { confirm: vi.fn() } },
      ],
    })
      .overrideComponent(SalesListComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(SalesListComponent);
    component = fixture.componentInstance;
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
    vi.clearAllMocks();
  });

  it('loads sales on init', () => {
    fixture.detectChanges();
    controller.expectOne('/api/sales/daily').flush([
      { id: 's1', sale_number: 'SALE-001', total_amount: 150, payment_method: 'cash', status: 'completed' },
    ]);
    expect(component.sales().length).toBe(1);
  });

  it('canExport signal reflects SubscriptionService', () => {
    expect(component.canExport()).toBe(true);
  });

  it('exportCsv calls CsvExportService with current sales and correct columns', () => {
    fixture.detectChanges();
    controller.expectOne('/api/sales/daily').flush([
      { id: 's1', sale_number: 'SALE-001', sale_date: '2026-03-14T10:00:00', cashier: { full_name: 'Juan' }, total_amount: 150, payment_method: 'cash', status: 'completed' },
    ]);

    component.exportCsv();

    expect(csvExport.export).toHaveBeenCalledOnce();
    const [data, columns, filename] = csvExport.export.mock.calls[0];
    expect(data).toHaveLength(1);
    expect(data[0].sale_number).toBe('SALE-001');
    expect(columns.map((c: any) => c.header)).toEqual(['Sale #', 'Date', 'Cashier', 'Total (₱)', 'Payment Method', 'Status']);
    expect(filename).toMatch(/^sales-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it('exportCsv exports an empty list when no sales loaded', () => {
    fixture.detectChanges();
    controller.expectOne('/api/sales/daily').flush([]);

    component.exportCsv();

    const [data] = csvExport.export.mock.calls[0];
    expect(data).toHaveLength(0);
  });
});
