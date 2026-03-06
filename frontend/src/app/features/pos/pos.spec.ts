import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PosComponent } from './pos';
import { ToastService } from '../../core/services/toast.service';
import { StoreContextService } from '../../core/services/store-context.service';
import { CartService } from './services/cart.service';
import { DiscountType } from '../../core/models/enums';

describe('PosComponent', () => {
  let fixture: ComponentFixture<PosComponent>;
  let component: PosComponent;
  let controller: HttpTestingController;
  let cart: CartService;
  const toast = { success: vi.fn(), error: vi.fn() };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PosComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ToastService, useValue: toast },
        {
          provide: StoreContextService,
          useValue: { storeId: vi.fn(() => 'store-1') },
        },
      ],
    })
      .overrideComponent(PosComponent, {
        set: { template: '' },
      })
      .compileComponents();

    fixture = TestBed.createComponent(PosComponent);
    component = fixture.componentInstance;
    controller = TestBed.inject(HttpTestingController);
    cart = TestBed.inject(CartService);
  });

  afterEach(() => controller.verify());

  it('posts partial sale payload with customer and discount details', () => {
    fixture.detectChanges();

    controller.expectOne('/api/products').flush([]);
    controller.expectOne('/api/stores/store-1').flush({
      id: 'store-1',
      settings: { tax_enabled: true, tax_rate: 12 },
    });

    cart.addItem({
      id: 'product-1',
      name: 'Coffee',
      retail_price: 100,
      current_stock: 10,
      unit: 'pcs',
    } as any);
    cart.customer.set({ id: 'customer-1', name: 'Juan' } as any);
    cart.paymentMethod.set('partial');
    cart.discountType.set(DiscountType.FIXED);
    cart.discountAmount.set(10);

    (component as any).paymentDialog = { close: vi.fn() };
    (component as any).receiptPreview = { open: vi.fn() };

    component.completeSale(50);

    const req = controller.expectOne('/api/sales');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toMatchObject({
      amount_paid: 50,
      customer_id: 'customer-1',
      payment_method: 'partial',
      discount_amount: 10,
      discount_type: 'fixed',
    });
    expect(req.request.body.credit_amount).toBeGreaterThan(0);

    req.flush({
      id: 'sale-1',
      sale_number: 'SALE-001',
      items: [],
    });

    controller.expectOne('/api/products').flush([]);

    expect(toast.success).toHaveBeenCalledWith('Sale completed!', '#SALE-001');
  });
});
