import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProductListComponent } from './product-list';
import { ToastService } from '../../core/services/toast.service';
import { StoreContextService } from '../../core/services/store-context.service';
import { ConfirmationService } from 'primeng/api';

describe('ProductListComponent', () => {
  let fixture: ComponentFixture<ProductListComponent>;
  let component: ProductListComponent;
  let controller: HttpTestingController;
  const toast = { success: vi.fn() };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ToastService, useValue: toast },
        {
          provide: StoreContextService,
          useValue: {
            isAdmin: vi.fn(() => true),
          },
        },
        {
          provide: ConfirmationService,
          useValue: { confirm: vi.fn() },
        },
      ],
    })
      .overrideComponent(ProductListComponent, {
        set: { template: '' },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('loads products and categories on init', () => {
    fixture.detectChanges();

    controller.expectOne('/api/products').flush([{ id: 'p1', name: 'Test Product' }]);
    controller.expectOne('/api/categories').flush([{ id: 'c1', name: 'General' }]);

    expect(component.products().length).toBe(1);
    expect(component.categories().length).toBe(1);
  });

  it('creates a product and refreshes the list', () => {
    fixture.detectChanges();
    controller.expectOne('/api/products').flush([]);
    controller.expectOne('/api/categories').flush([{ id: 'c1', name: 'General' }]);

    component.form = {
      name: 'Coffee',
      sku: 'COF-1',
      category_id: 'c1',
      retail_price: 120,
      cost_price: 80,
      unit: 'pcs',
      reorder_level: 2,
      barcode: '',
      description: '',
    };

    component.saveProduct();

    controller.expectOne('/api/products').flush({ id: 'p1' });
    controller.expectOne('/api/products').flush([{ id: 'p1', name: 'Coffee' }]);

    expect(toast.success).toHaveBeenCalledWith('Product created');
    expect(component.dialogVisible).toBe(false);
  });
});
