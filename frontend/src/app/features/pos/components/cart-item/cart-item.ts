import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { FormsModule } from '@angular/forms';
import { PhpCurrencyPipe } from '../../../../shared/pipes/php-currency.pipe';
import { CartItem } from '../../services/cart.service';

@Component({
  selector: 'app-cart-item',
  standalone: true,
  imports: [ButtonModule, InputNumberModule, FormsModule, PhpCurrencyPipe],
  template: `
    <div class="cart-item">
      <div class="item-info">
        <span class="item-name">{{ item.product.name }}</span>
        <span class="item-price">{{ item.unit_price | phpCurrency }}</span>
      </div>
      <div class="item-controls">
        <p-inputNumber
          [ngModel]="item.quantity"
          (ngModelChange)="quantityChanged.emit($event)"
          [showButtons]="true"
          buttonLayout="horizontal"
          [min]="0"
          [max]="item.product.current_stock"
          incrementButtonIcon="pi pi-plus"
          decrementButtonIcon="pi pi-minus"
          size="small"
          styleClass="cart-qty"
          inputStyleClass="cart-qty-input"
        />
        <span class="item-subtotal">{{ item.unit_price * item.quantity | phpCurrency }}</span>
        <p-button
          icon="pi pi-times"
          [rounded]="true"
          [text]="true"
          severity="danger"
          size="small"
          (onClick)="removed.emit()"
        />
      </div>
    </div>
  `,
  styles: `
    .cart-item {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--border-color);
    }
    .item-info {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }
    .item-name {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text-primary);
      flex: 1;
      margin-right: 0.5rem;
    }
    .item-price {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }
    .item-controls {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .item-subtotal {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-left: auto;
    }
    :host ::ng-deep .cart-qty { width: 100px; }
    :host ::ng-deep .cart-qty-input {
      width: 2.5rem;
      text-align: center;
      font-size: 0.8125rem;
      padding: 0.375rem;
    }
  `,
})
export class CartItemComponent {
  @Input({ required: true }) item!: CartItem;
  @Output() quantityChanged = new EventEmitter<number>();
  @Output() removed = new EventEmitter<void>();
}
