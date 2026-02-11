import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Product } from '../../../../core/models/product.model';
import { CartItem } from '../../services/cart.service';
import { PhpCurrencyPipe } from '../../../../shared/pipes/php-currency.pipe';

const CATEGORY_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f97316',
  '#10b981', '#06b6d4', '#6366f1', '#ef4444',
];

@Component({
  selector: 'app-product-grid',
  standalone: true,
  imports: [PhpCurrencyPipe],
  templateUrl: './product-grid.html',
  styleUrls: ['./product-grid.scss'],
})
export class ProductGridComponent {
  @Input() products: Product[] = [];
  @Input() cartItems: CartItem[] = [];
  @Output() productSelected = new EventEmitter<Product>();

  onSelect(product: Product) {
    this.productSelected.emit(product);
  }

  getCategoryColor(product: Product): string {
    const name = product.category?.name || product.category_id || '';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
  }

  getInitial(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  getCartQuantity(productId: string): number {
    const item = this.cartItems.find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  }
}
