import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MovementHistoryComponent } from './movement-history';
import { SubscriptionService } from '../../core/services/subscription.service';
import { CsvExportService } from '../../core/services/csv-export.service';

describe('MovementHistoryComponent', () => {
  let fixture: ComponentFixture<MovementHistoryComponent>;
  let component: MovementHistoryComponent;
  let controller: HttpTestingController;
  const csvExport = { export: vi.fn() };

  const mockMovements = [
    {
      id: 'm1',
      created_at: '2026-03-14T10:00:00',
      movement_type: 'purchase',
      quantity: 10,
      notes: 'Initial stock',
      batch: { product: { name: 'Coffee', sku: 'COF-1' }, supplier: { name: 'Supplier A' }, batch_number: 'B001' },
      creator: { full_name: 'Admin' },
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovementHistoryComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SubscriptionService, useValue: { hasFeatureSignal: vi.fn(() => () => true) } },
        { provide: CsvExportService, useValue: csvExport },
      ],
    })
      .overrideComponent(MovementHistoryComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(MovementHistoryComponent);
    component = fixture.componentInstance;
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
    vi.clearAllMocks();
  });

  it('loads movements on init with default pagination', () => {
    fixture.detectChanges();
    const req = controller.expectOne('/api/inventory/movements?offset=0&limit=15');
    req.flush({ data: mockMovements, total: 1 });
    expect(component.movements().length).toBe(1);
    expect(component.totalRecords()).toBe(1);
  });

  it('setTypeFilter reloads from page 0 with movement_type param', () => {
    fixture.detectChanges();
    controller.expectOne('/api/inventory/movements?offset=0&limit=15').flush({ data: [], total: 0 });

    component.setTypeFilter('purchase');
    controller.expectOne('/api/inventory/movements?offset=0&limit=15&movement_type=purchase').flush({ data: mockMovements, total: 1 });

    expect(component.activeTypeFilter).toBe('purchase');
    expect(component.movements().length).toBe(1);
  });

  it('setTypeFilter with null omits movement_type param', () => {
    fixture.detectChanges();
    controller.expectOne('/api/inventory/movements?offset=0&limit=15').flush({ data: [], total: 0 });

    component.activeTypeFilter = 'purchase';
    component.setTypeFilter(null);
    controller.expectOne('/api/inventory/movements?offset=0&limit=15').flush({ data: [], total: 0 });

    expect(component.activeTypeFilter).toBeNull();
  });

  it('exportCsv calls CsvExportService with current movements and correct columns', () => {
    fixture.detectChanges();
    controller.expectOne('/api/inventory/movements?offset=0&limit=15').flush({ data: mockMovements, total: 1 });

    component.exportCsv();

    expect(csvExport.export).toHaveBeenCalledOnce();
    const [data, columns, filename] = csvExport.export.mock.calls[0];
    expect(data).toHaveLength(1);
    expect(columns.map((c: any) => c.header)).toEqual(['Date', 'Product', 'SKU', 'Type', 'Quantity', 'Supplier', 'Batch #', 'Notes', 'Created By']);
    expect(filename).toMatch(/^stock-movements-all-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it('exportCsv filename includes active type filter', () => {
    fixture.detectChanges();
    controller.expectOne('/api/inventory/movements?offset=0&limit=15').flush({ data: [], total: 0 });

    component.activeTypeFilter = 'purchase';
    component.exportCsv();

    const [, , filename] = csvExport.export.mock.calls[0];
    expect(filename).toMatch(/^stock-movements-purchase-\d{4}-\d{2}-\d{2}\.csv$/);
  });
});
