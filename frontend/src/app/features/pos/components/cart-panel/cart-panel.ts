import { Component, inject, Output, EventEmitter } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { CartItemComponent } from '../cart-item/cart-item';
import { PhpCurrencyPipe } from '../../../../shared/pipes/php-currency.pipe';

@Component({
  selector: 'app-cart-panel',
  standalone: true,
  imports: [ButtonModule, SelectButtonModule, FormsModule, CartItemComponent, PhpCurrencyPipe],
  templateUrl: './cart-panel.html',
  styleUrls: ['./cart-panel.scss'],
})
export class CartPanelComponent {
  cart = inject(CartService);
  @Output() charge = new EventEmitter<void>();
  @Output() addCustomer = new EventEmitter<void>();
  @Output() addDiscount = new EventEmitter<void>();

  paymentOptions = [
    { label: 'Cash', value: 'cash', icon: 'pi pi-money-bill' },
    { label: 'GCash', value: 'gcash', icon: 'pi pi-mobile' },
    { label: 'Maya', value: 'maya', icon: 'pi pi-credit-card' },
    { label: 'Card', value: 'card', icon: 'pi pi-id-card' },
  ];

  removeCustomer() {
    this.cart.customer.set(null);
  }

  removeDiscount() {
    this.cart.discountAmount.set(0);
  }
}
