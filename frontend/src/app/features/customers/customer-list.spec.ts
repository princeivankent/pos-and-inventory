import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';
import { CustomerListComponent } from './customer-list';
import { CustomerService } from '../../core/services/customer.service';
import { ToastService } from '../../core/services/toast.service';
import { StoreContextService } from '../../core/services/store-context.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import { ConfirmationService } from 'primeng/api';

describe('CustomerListComponent', () => {
  let fixture: ComponentFixture<CustomerListComponent>;
  let component: CustomerListComponent;
  const customerService = {
    getAll: vi.fn(() => of([])),
    recordPayment: vi.fn(() => of({})),
    create: vi.fn(() => of({})),
    update: vi.fn(() => of({})),
    deactivate: vi.fn(() => of({})),
    getStatement: vi.fn(() => of({})),
  };
  const toast = { success: vi.fn() };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerListComponent],
      providers: [
        { provide: CustomerService, useValue: customerService },
        { provide: ToastService, useValue: toast },
        {
          provide: StoreContextService,
          useValue: { isAdmin: vi.fn(() => true) },
        },
        {
          provide: SubscriptionService,
          useValue: { hasFeatureSignal: vi.fn(() => () => true) },
        },
        {
          provide: ConfirmationService,
          useValue: { confirm: vi.fn() },
        },
      ],
    })
      .overrideComponent(CustomerListComponent, {
        set: { template: '' },
      })
      .compileComponents();

    fixture = TestBed.createComponent(CustomerListComponent);
    component = fixture.componentInstance;
  });

  it('loads customers on init', () => {
    fixture.detectChanges();
    expect(customerService.getAll).toHaveBeenCalledWith('');
  });

  it('records a payment and reloads the customer list', () => {
    fixture.detectChanges();
    customerService.getAll.mockClear();

    component.paymentCustomer.set({ id: 'cust-1', name: 'Juan' } as any);
    component.submitPayment({
      amount: 100,
      payment_method: 'cash',
      notes: 'Paid in store',
    });

    expect(customerService.recordPayment).toHaveBeenCalledWith('cust-1', {
      amount: 100,
      payment_method: 'cash',
      notes: 'Paid in store',
    });
    expect(toast.success).toHaveBeenCalledWith('Payment recorded');
    expect(customerService.getAll).toHaveBeenCalledWith('');
  });
});
