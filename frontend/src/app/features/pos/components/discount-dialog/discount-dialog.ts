import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DiscountType } from '../../../../core/models/enums';
import { CartService } from '../../services/cart.service';
import { PhpCurrencyPipe } from '../../../../shared/pipes/php-currency.pipe';

@Component({
  selector: 'app-discount-dialog',
  standalone: true,
  imports: [FormsModule, DialogModule, ButtonModule, InputNumberModule, SelectButtonModule, PhpCurrencyPipe],
  templateUrl: './discount-dialog.html',
  styleUrls: ['./discount-dialog.scss'],
})
export class DiscountDialogComponent {
  cart = inject(CartService);

  visible = false;
  discountType = signal<DiscountType>(DiscountType.FIXED);
  discountAmount = signal<number>(0);

  typeOptions = [
    { label: 'Fixed (₱)', value: DiscountType.FIXED },
    { label: 'Percent (%)', value: DiscountType.PERCENTAGE },
  ];

  preview = computed(() => {
    const amount = this.discountAmount() || 0;
    if (amount <= 0) return 0;
    if (this.discountType() === DiscountType.PERCENTAGE) {
      return this.cart.subtotal() * (amount / 100);
    }
    return amount;
  });

  open() {
    this.discountType.set(this.cart.discountType());
    this.discountAmount.set(this.cart.discountAmount());
    this.visible = true;
  }

  close() {
    this.visible = false;
  }

  apply() {
    this.cart.discountType.set(this.discountType());
    this.cart.discountAmount.set(this.discountAmount() || 0);
    this.close();
  }

  remove() {
    this.cart.discountAmount.set(0);
    this.close();
  }
}
