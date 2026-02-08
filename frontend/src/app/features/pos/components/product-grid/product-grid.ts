import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Product } from '../../../../core/models/product.model';
import { PhpCurrencyPipe } from '../../../../shared/pipes/php-currency.pipe';

@Component({
  selector: 'app-product-grid',
  standalone: true,
  imports: [PhpCurrencyPipe],
  template: `
    @if (products.length === 0) {
      <div class="empty-grid">
        <i class="pi pi-box"></i>
        <p>No products found</p>
      </div>
    } @else {
      <div class="product-grid">
        @for (product of products; track product.id) {
          <button
            class="product-tile"
            [class.out-of-stock]="product.current_stock <= 0"
            [disabled]="product.current_stock <= 0"
            (click)="onSelect(product)"
          >
            <span class="tile-name">{{ product.name }}</span>
            <span class="tile-price">{{ product.retail_price | phpCurrency }}</span>
            <span class="tile-stock" [class.low]="product.current_stock <= product.reorder_level && product.current_stock > 0">
              {{ product.current_stock }} {{ product.unit }}
            </span>
          </button>
        }
      </div>
    }
  `,
  styles: `
    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 0.75rem;
    }
    .product-tile {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      padding: 1rem 0.75rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      cursor: pointer;
      transition: all var(--transition-fast);
      text-align: center;
      min-height: 100px;
      &:hover:not(:disabled) {
        border-color: var(--color-primary);
        background: var(--color-primary-light);
      }
      &:active:not(:disabled) {
        transform: scale(0.97);
      }
      &.out-of-stock {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
    .tile-name {
      font-weight: 500;
      font-size: 0.8125rem;
      color: var(--text-primary);
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .tile-price {
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--color-primary);
    }
    .tile-stock {
      font-size: 0.6875rem;
      color: var(--text-secondary);
      &.low { color: var(--color-warning); }
    }
    .empty-grid {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      color: var(--text-tertiary);
      i { font-size: 2rem; margin-bottom: 0.5rem; }
      p { font-size: 0.875rem; margin: 0; }
    }
  `,
})
export class ProductGridComponent {
  @Input() products: Product[] = [];
  @Output() productSelected = new EventEmitter<Product>();

  onSelect(product: Product) {
    this.productSelected.emit(product);
  }
}
