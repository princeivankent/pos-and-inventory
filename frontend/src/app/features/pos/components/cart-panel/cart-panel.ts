import { Component, inject, Output, EventEmitter } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CartService } from '../../services/cart.service';
import { CartItemComponent } from '../cart-item/cart-item';
import { PhpCurrencyPipe } from '../../../../shared/pipes/php-currency.pipe';

@Component({
  selector: 'app-cart-panel',
  standalone: true,
  imports: [ButtonModule, CartItemComponent, PhpCurrencyPipe],
  template: `
    <div class="cart-panel">
      <div class="cart-header">
        <h3>Cart ({{ cart.itemCount() }})</h3>
        @if (cart.items().length > 0) {
          <p-button
            label="Clear"
            [text]="true"
            severity="danger"
            size="small"
            (onClick)="cart.clear()"
          />
        }
      </div>

      <div class="cart-items">
        @if (cart.items().length === 0) {
          <div class="cart-empty">
            <i class="pi pi-shopping-cart"></i>
            <p>Cart is empty</p>
          </div>
        } @else {
          @for (item of cart.items(); track item.product.id) {
            <app-cart-item
              [item]="item"
              (quantityChanged)="cart.updateQuantity(item.product.id, $event)"
              (removed)="cart.removeItem(item.product.id)"
            />
          }
        }
      </div>

      @if (cart.items().length > 0) {
        <div class="cart-summary">
          <div class="summary-row">
            <span>Subtotal</span>
            <span>{{ cart.subtotal() | phpCurrency }}</span>
          </div>
          @if (cart.taxEnabled()) {
            <div class="summary-row">
              <span>VAT (12%)</span>
              <span>{{ cart.taxAmount() | phpCurrency }}</span>
            </div>
          }
          <div class="summary-row total">
            <span>Total</span>
            <span>{{ cart.total() | phpCurrency }}</span>
          </div>
          <p-button
            [label]="'Charge ' + (cart.total() | phpCurrency)"
            styleClass="w-full charge-btn"
            icon="pi pi-wallet"
            (onClick)="charge.emit()"
          />
        </div>
      }
    </div>
  `,
  styles: `
    .cart-panel {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
    }
    .cart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid var(--border-color);
      h3 { font-size: 1rem; margin: 0; }
    }
    .cart-items {
      flex: 1;
      overflow-y: auto;
      padding: 0 1rem;
    }
    .cart-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1rem;
      color: var(--text-tertiary);
      i { font-size: 2.5rem; margin-bottom: 0.75rem; }
      p { font-size: 0.875rem; margin: 0; }
    }
    .cart-summary {
      border-top: 1px solid var(--border-color);
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      color: var(--text-secondary);
      &.total {
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--text-primary);
        padding-top: 0.5rem;
        border-top: 1px solid var(--border-color);
      }
    }
    :host ::ng-deep .w-full { width: 100%; }
    :host ::ng-deep .charge-btn {
      margin-top: 0.5rem;
      font-size: 1rem;
      padding: 0.75rem;
      font-weight: 600;
    }
  `,
})
export class CartPanelComponent {
  cart = inject(CartService);
  @Output() charge = new EventEmitter<void>();
}
