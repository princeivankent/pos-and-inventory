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
  templateUrl: './cart-item.html',
  styleUrls: ['./cart-item.scss'],
})
export class CartItemComponent {
  @Input({ required: true }) item!: CartItem;
  @Output() quantityChanged = new EventEmitter<number>();
  @Output() removed = new EventEmitter<void>();
}
