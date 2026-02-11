import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { PhpCurrencyPipe } from '../../../../shared/pipes/php-currency.pipe';
import { CartItem } from '../../services/cart.service';

@Component({
  selector: 'app-cart-item',
  standalone: true,
  imports: [ButtonModule, PhpCurrencyPipe],
  templateUrl: './cart-item.html',
  styleUrls: ['./cart-item.scss'],
})
export class CartItemComponent {
  @Input({ required: true }) item!: CartItem;
  @Output() quantityChanged = new EventEmitter<number>();
  @Output() removed = new EventEmitter<void>();

  increment() {
    if (this.item.quantity < this.item.product.current_stock) {
      this.quantityChanged.emit(this.item.quantity + 1);
    }
  }

  decrement() {
    this.quantityChanged.emit(this.item.quantity - 1);
  }
}
