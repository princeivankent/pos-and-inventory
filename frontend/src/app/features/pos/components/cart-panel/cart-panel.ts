import { Component, inject, Output, EventEmitter } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CartService } from '../../services/cart.service';
import { CartItemComponent } from '../cart-item/cart-item';
import { PhpCurrencyPipe } from '../../../../shared/pipes/php-currency.pipe';

@Component({
  selector: 'app-cart-panel',
  standalone: true,
  imports: [ButtonModule, CartItemComponent, PhpCurrencyPipe],
  templateUrl: './cart-panel.html',
  styleUrls: ['./cart-panel.scss'],
})
export class CartPanelComponent {
  cart = inject(CartService);
  @Output() charge = new EventEmitter<void>();
}
