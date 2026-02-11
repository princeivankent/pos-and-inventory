import { Component, input, Output, EventEmitter, computed, signal, inject, ViewChild, ElementRef } from '@angular/core';
import { InputNumber } from 'primeng/inputnumber';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { PhpCurrencyPipe } from '../../../../shared/pipes/php-currency.pipe';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-payment-dialog',
  standalone: true,
  imports: [DialogModule, ButtonModule, InputNumberModule, InputTextModule, FormsModule, PhpCurrencyPipe],
  templateUrl: './payment-dialog.html',
  styleUrls: ['./payment-dialog.scss'],
})
export class PaymentDialogComponent {
  cart = inject(CartService);
  totalAmount = input(0);
  processing = input(false);
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() completed = new EventEmitter<number>();

  @ViewChild('amountInput') amountInput!: InputNumber;

  visible = false;
  amountPaid = signal<number | null>(null);
  referenceNumber = signal('');

  paymentMethods = [
    { label: 'Cash', value: 'cash', icon: 'pi pi-money-bill' },
    { label: 'GCash', value: 'gcash', icon: 'pi pi-mobile' },
    { label: 'Maya', value: 'maya', icon: 'pi pi-credit-card' },
    { label: 'Card', value: 'card', icon: 'pi pi-id-card' },
  ];

  numpadKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '00'];

  change = computed(() => (this.amountPaid() ?? 0) - this.totalAmount());

  quickAmounts = computed(() => {
    const total = this.totalAmount();
    if (total <= 0) return [];
    const amounts = [total];
    const roundTo = [50, 100, 500, 1000, 2000];
    for (const r of roundTo) {
      const rounded = Math.ceil(total / r) * r;
      if (rounded > total && !amounts.includes(rounded)) {
        amounts.push(rounded);
      }
    }
    return amounts.slice(0, 5);
  });

  isCash = computed(() => this.cart.paymentMethod() === 'cash');

  open() {
    this.amountPaid.set(null);
    this.referenceNumber.set('');
    this.visible = true;
  }

  onDialogShow() {
    // PrimeNG dialog runs its own focus trap after onShow;
    // wait for that to finish before overriding focus.
    setTimeout(() => {
      this.amountInput?.input?.nativeElement?.focus();
      this.amountInput?.input?.nativeElement?.select();
    }, 350);
  }

  onAmountInput(event: { value: number | null }) {
    this.amountPaid.set(event.value);
  }

  onClose() {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onComplete() {
    if (this.processing()) return;
    if (this.isCash() && this.change() < 0) return;
    if (!this.isCash()) {
      // For non-cash, assume exact amount
      this.completed.emit(this.totalAmount());
      return;
    }
    this.completed.emit(this.amountPaid() ?? 0);
  }

  close() {
    this.visible = false;
  }

  onNumpad(key: string) {
    if (key === 'C') {
      this.amountPaid.set(null);
      return;
    }
    const current = this.amountPaid();
    const currentStr = current != null ? String(current) : '';
    const newStr = currentStr + key;
    const parsed = parseInt(newStr, 10);
    if (!isNaN(parsed)) {
      this.amountPaid.set(parsed);
    }
  }

  selectPaymentMethod(method: string) {
    this.cart.paymentMethod.set(method);
  }
}
