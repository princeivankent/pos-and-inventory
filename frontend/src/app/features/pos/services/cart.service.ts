import { Injectable, signal, computed } from '@angular/core';
import { Product } from '../../../core/models/product.model';

export interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  items = signal<CartItem[]>([]);

  itemCount = computed(() =>
    this.items().reduce((sum, item) => sum + item.quantity, 0)
  );

  subtotal = computed(() =>
    this.items().reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
  );

  taxRate = signal(0.12);
  taxEnabled = signal(true);

  taxAmount = computed(() =>
    this.taxEnabled() ? this.subtotal() * this.taxRate() : 0
  );

  total = computed(() => this.subtotal() + this.taxAmount());

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

  clear() {
    this.items.set([]);
  }
}
