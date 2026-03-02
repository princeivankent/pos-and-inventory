import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';
import { DiscountType } from '../../../core/models/enums';
import { Product } from '../../../core/models/product.model';
import { Customer } from '../../../core/models/customer.model';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    store_id: 's1',
    category_id: 'c1',
    sku: 'SKU-001',
    barcode: null,
    name: 'Test Product',
    description: null,
    unit: 'pcs',
    reorder_level: 5,
    has_expiry: false,
    retail_price: 100,
    cost_price: 60,
    current_stock: 10,
    is_active: true,
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 'cust1',
    store_id: 's1',
    name: 'Juan dela Cruz',
    phone: null,
    email: null,
    address: null,
    credit_limit: 5000,
    current_balance: 0,
    is_active: true,
    created_at: '',
    updated_at: '',
    ...overrides,
  };
}

describe('CartService', () => {
  let service: CartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartService);
    service.clear();
  });

  // --- Initial State ---
  it('has empty items on init', () => {
    expect(service.items()).toEqual([]);
  });

  it('has null customer on init', () => {
    expect(service.customer()).toBeNull();
  });

  it('has cash payment method on init', () => {
    expect(service.paymentMethod()).toBe('cash');
  });

  it('has FIXED discount type on init', () => {
    expect(service.discountType()).toBe(DiscountType.FIXED);
  });

  it('has 0 discountAmount on init', () => {
    expect(service.discountAmount()).toBe(0);
  });

  it('has default taxRate of 0.12', () => {
    expect(service.taxRate()).toBe(0.12);
  });

  it('has taxEnabled true on init', () => {
    expect(service.taxEnabled()).toBe(true);
  });

  // --- addItem ---
  it('adds a new item to cart', () => {
    const p = makeProduct();
    service.addItem(p);
    expect(service.items().length).toBe(1);
    expect(service.items()[0].product.id).toBe('p1');
    expect(service.items()[0].quantity).toBe(1);
  });

  it('sets unit_price from retail_price as Number', () => {
    const p = makeProduct({ retail_price: 99.5 });
    service.addItem(p);
    expect(service.items()[0].unit_price).toBe(99.5);
  });

  it('increments quantity for same product', () => {
    const p = makeProduct();
    service.addItem(p);
    service.addItem(p);
    expect(service.items()[0].quantity).toBe(2);
  });

  it('does not add item when current_stock is 0', () => {
    const p = makeProduct({ current_stock: 0 });
    service.addItem(p);
    expect(service.items().length).toBe(0);
  });

  it('does not exceed current_stock', () => {
    const p = makeProduct({ current_stock: 2 });
    service.addItem(p);
    service.addItem(p);
    service.addItem(p); // 3rd add — should be ignored
    expect(service.items()[0].quantity).toBe(2);
  });

  // --- removeItem ---
  it('removes item by productId', () => {
    service.addItem(makeProduct());
    service.removeItem('p1');
    expect(service.items().length).toBe(0);
  });

  it('removeItem is no-op for unknown id', () => {
    service.addItem(makeProduct());
    service.removeItem('unknown');
    expect(service.items().length).toBe(1);
  });

  // --- updateQuantity ---
  it('updateQuantity sets exact quantity', () => {
    service.addItem(makeProduct());
    service.updateQuantity('p1', 5);
    expect(service.items()[0].quantity).toBe(5);
  });

  it('updateQuantity removes item when quantity <= 0', () => {
    service.addItem(makeProduct());
    service.updateQuantity('p1', 0);
    expect(service.items().length).toBe(0);
  });

  // --- getItemQuantity ---
  it('returns 0 for absent product', () => {
    expect(service.getItemQuantity('nonexistent')).toBe(0);
  });

  it('returns correct quantity for present product', () => {
    service.addItem(makeProduct());
    service.addItem(makeProduct());
    expect(service.getItemQuantity('p1')).toBe(2);
  });

  // --- Computed: subtotal ---
  it('subtotal equals sum of unit_price * quantity', () => {
    service.addItem(makeProduct({ retail_price: 100 }));
    service.addItem(makeProduct({ id: 'p2', retail_price: 50, current_stock: 5 }));
    expect(service.subtotal()).toBe(150);
  });

  // --- Computed: discountValue ---
  it('FIXED discount returns exact amount', () => {
    service.addItem(makeProduct({ retail_price: 200 }));
    service.discountType.set(DiscountType.FIXED);
    service.discountAmount.set(30);
    expect(service.discountValue()).toBe(30);
  });

  it('PERCENTAGE discount returns subtotal * (amount/100)', () => {
    service.addItem(makeProduct({ retail_price: 200 }));
    service.discountType.set(DiscountType.PERCENTAGE);
    service.discountAmount.set(10);
    expect(service.discountValue()).toBeCloseTo(20);
  });

  it('discountValue is 0 when discountAmount is 0', () => {
    service.addItem(makeProduct({ retail_price: 200 }));
    service.discountAmount.set(0);
    expect(service.discountValue()).toBe(0);
  });

  // --- Computed: taxAmount ---
  it('taxAmount is 0 when taxEnabled is false', () => {
    service.addItem(makeProduct({ retail_price: 100 }));
    service.taxEnabled.set(false);
    expect(service.taxAmount()).toBe(0);
  });

  it('taxAmount is (subtotal - discount) * taxRate when enabled', () => {
    service.addItem(makeProduct({ retail_price: 100 }));
    service.discountAmount.set(0);
    service.taxEnabled.set(true);
    service.taxRate.set(0.12);
    expect(service.taxAmount()).toBeCloseTo(12);
  });

  // --- Computed: total ---
  it('total is subtotal - discount + tax', () => {
    service.addItem(makeProduct({ retail_price: 100 }));
    service.discountAmount.set(0);
    service.taxEnabled.set(true);
    service.taxRate.set(0.12);
    expect(service.total()).toBeCloseTo(112);
  });

  it('total is at minimum 0', () => {
    service.discountAmount.set(9999);
    service.taxEnabled.set(false);
    expect(service.total()).toBe(0);
  });

  // --- holdCurrentOrder ---
  it('holdCurrentOrder is no-op on empty cart', () => {
    service.holdCurrentOrder('test');
    expect(service.heldOrders().length).toBe(0);
  });

  it('holdCurrentOrder saves order and clears cart', () => {
    service.addItem(makeProduct());
    service.holdCurrentOrder('note1');
    expect(service.heldOrders().length).toBe(1);
    expect(service.items().length).toBe(0);
    expect(service.heldOrders()[0].note).toBe('note1');
  });

  it('holdCurrentOrder sets a timestamp', () => {
    service.addItem(makeProduct());
    service.holdCurrentOrder();
    expect(service.heldOrders()[0].heldAt).toBeInstanceOf(Date);
  });

  // --- recallOrder ---
  it('recallOrder restores items and customer', () => {
    const cust = makeCustomer();
    service.customer.set(cust);
    service.addItem(makeProduct());
    service.holdCurrentOrder();
    const orderId = service.heldOrders()[0].id;
    service.recallOrder(orderId);
    expect(service.items().length).toBe(1);
    expect(service.customer()).toEqual(cust);
    expect(service.heldOrders().length).toBe(0);
  });

  it('recallOrder is no-op for unknown id', () => {
    service.addItem(makeProduct());
    service.holdCurrentOrder();
    service.recallOrder(9999);
    expect(service.heldOrders().length).toBe(1);
  });

  // --- removeHeldOrder ---
  it('removeHeldOrder removes without restoring', () => {
    service.addItem(makeProduct());
    service.holdCurrentOrder();
    const orderId = service.heldOrders()[0].id;
    service.removeHeldOrder(orderId);
    expect(service.heldOrders().length).toBe(0);
    expect(service.items().length).toBe(0);
  });

  // --- clear ---
  it('clear resets items, customer, discount, paymentMethod', () => {
    service.addItem(makeProduct());
    service.customer.set(makeCustomer());
    service.discountAmount.set(50);
    service.discountType.set(DiscountType.PERCENTAGE);
    service.paymentMethod.set('gcash');
    service.clear();
    expect(service.items()).toEqual([]);
    expect(service.customer()).toBeNull();
    expect(service.discountAmount()).toBe(0);
    expect(service.discountType()).toBe(DiscountType.FIXED);
    expect(service.paymentMethod()).toBe('cash');
  });

  it('clear does NOT reset taxRate or taxEnabled', () => {
    service.taxRate.set(0.05);
    service.taxEnabled.set(false);
    service.clear();
    expect(service.taxRate()).toBe(0.05);
    expect(service.taxEnabled()).toBe(false);
  });
});
