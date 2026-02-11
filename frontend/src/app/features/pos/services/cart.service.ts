import { Injectable, signal, computed } from '@angular/core';
import { Product } from '../../../core/models/product.model';
import { Customer } from '../../../core/models/customer.model';
import { DiscountType } from '../../../core/models/enums';

export interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
}

export interface HeldOrder {
  id: number;
  items: CartItem[];
  customer: Customer | null;
  note: string;
  heldAt: Date;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  items = signal<CartItem[]>([]);
  customer = signal<Customer | null>(null);
  paymentMethod = signal<string>('cash');
  discountType = signal<DiscountType>(DiscountType.FIXED);
  discountAmount = signal<number>(0);
  heldOrders = signal<HeldOrder[]>([]);

  private nextHoldId = 1;

  itemCount = computed(() =>
    this.items().reduce((sum, item) => sum + item.quantity, 0)
  );

  subtotal = computed(() =>
    this.items().reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
  );

  taxRate = signal(0.12);
  taxEnabled = signal(true);

  discountValue = computed(() => {
    const amount = this.discountAmount();
    if (amount <= 0) return 0;
    if (this.discountType() === DiscountType.PERCENTAGE) {
      return this.subtotal() * (amount / 100);
    }
    return amount;
  });

  taxAmount = computed(() =>
    this.taxEnabled() ? (this.subtotal() - this.discountValue()) * this.taxRate() : 0
  );

  total = computed(() => Math.max(0, this.subtotal() - this.discountValue() + this.taxAmount()));

  addItem(product: Product) {
    const current = this.items();
    const existing = current.find((i) => i.product.id === product.id);

    if (existing) {
      if (existing.quantity >= product.current_stock) return;
      this.items.set(
        current.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      );
    } else {
      if (product.current_stock <= 0) return;
      this.items.set([
        ...current,
        { product, quantity: 1, unit_price: Number(product.retail_price) },
      ]);
    }
  }

  updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }
    this.items.set(
      this.items().map((i) =>
        i.product.id === productId ? { ...i, quantity } : i
      )
    );
  }

  removeItem(productId: string) {
    this.items.set(this.items().filter((i) => i.product.id !== productId));
  }

  getItemQuantity(productId: string): number {
    const item = this.items().find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  }

  holdCurrentOrder(note = '') {
    if (this.items().length === 0) return;
    const order: HeldOrder = {
      id: this.nextHoldId++,
      items: [...this.items()],
      customer: this.customer(),
      note,
      heldAt: new Date(),
    };
    this.heldOrders.set([...this.heldOrders(), order]);
    this.clear();
  }

  recallOrder(orderId: number) {
    const orders = this.heldOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    this.items.set([...order.items]);
    this.customer.set(order.customer);
    this.heldOrders.set(orders.filter((o) => o.id !== orderId));
  }

  removeHeldOrder(orderId: number) {
    this.heldOrders.set(this.heldOrders().filter((o) => o.id !== orderId));
  }

  clear() {
    this.items.set([]);
    this.customer.set(null);
    this.discountAmount.set(0);
    this.discountType.set(DiscountType.FIXED);
    this.paymentMethod.set('cash');
  }
}
