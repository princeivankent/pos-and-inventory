import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InventoryOverviewComponent } from './inventory-overview';
import { ToastService } from '../../core/services/toast.service';
import { StoreContextService } from '../../core/services/store-context.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import { CsvExportService } from '../../core/services/csv-export.service';
import { SupplierService } from '../../core/services/supplier.service';
import { of } from 'rxjs';

describe('InventoryOverviewComponent', () => {
  let fixture: ComponentFixture<InventoryOverviewComponent>;
  let component: InventoryOverviewComponent;
  let controller: HttpTestingController;
  const toast = { success: vi.fn(), error: vi.fn() };
  const csvExport = { export: vi.fn() };

  const mockProducts = [
    { id: 'p1', name: 'Coffee', sku: 'COF-1', current_stock: 10, unit: 'pcs', cost_price: 80, retail_price: 120, reorder_level: 2 },
    { id: 'p2', name: 'Tea', sku: 'TEA-1', current_stock: 5, unit: 'pcs', cost_price: 40, retail_price: 60, reorder_level: 1 },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryOverviewComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ToastService, useValue: toast },
        { provide: StoreContextService, useValue: { isAdmin: vi.fn(() => true) } },
        { provide: SubscriptionService, useValue: { hasFeatureSignal: vi.fn(() => () => true) } },
        { provide: CsvExportService, useValue: csvExport },
        { provide: SupplierService, useValue: { getAll: vi.fn(() => of([])) } },
      ],
    })
      .overrideComponent(InventoryOverviewComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(InventoryOverviewComponent);
    component = fixture.componentInstance;
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
    vi.clearAllMocks();
  });

  it('loads products on init', () => {
    fixture.detectChanges();
    controller.expectOne('/api/products').flush(mockProducts);
    expect(component.products().length).toBe(2);
  });

  it('filteredProducts returns all products when search is empty', () => {
    fixture.detectChanges();
    controller.expectOne('/api/products').flush(mockProducts);
    expect(component.filteredProducts().length).toBe(2);
  });

  it('filteredProducts filters by name search', () => {
    fixture.detectChanges();
    controller.expectOne('/api/products').flush(mockProducts);
    component.searchQuery.set('coffee');
    expect(component.filteredProducts().length).toBe(1);
    expect(component.filteredProducts()[0].name).toBe('Coffee');
  });

  it('exportCsv calls CsvExportService with filteredProducts and correct columns', () => {
    fixture.detectChanges();
    controller.expectOne('/api/products').flush(mockProducts);

    component.exportCsv();

    expect(csvExport.export).toHaveBeenCalledOnce();
    const [data, columns, filename] = csvExport.export.mock.calls[0];
    expect(data).toHaveLength(2);
    expect(columns.map((c: any) => c.header)).toEqual(['Product', 'SKU', 'Stock', 'Unit', 'Cost Price', 'Retail Price']);
    expect(filename).toMatch(/^inventory-overview-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it('exportCsv exports only filtered products when search is active', () => {
    fixture.detectChanges();
    controller.expectOne('/api/products').flush(mockProducts);
    component.searchQuery.set('coffee');

    component.exportCsv();

    const [data] = csvExport.export.mock.calls[0];
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe('Coffee');
  });
});
