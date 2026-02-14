import { Component, input, Output, EventEmitter, computed, signal, inject, ViewChild } from '@angular/core';
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

  allPaymentMethods = [
    { label: 'Cash', value: 'cash', icon: 'pi pi-money-bill', requiresCustomer: false },
    { label: 'GCash', value: 'gcash', icon: 'pi pi-mobile', requiresCustomer: false },
    { label: 'Maya', value: 'maya', icon: 'pi pi-credit-card', requiresCustomer: false },
    { label: 'Card', value: 'card', icon: 'pi pi-id-card', requiresCustomer: false },
    { label: 'Credit', value: 'credit', icon: 'pi pi-wallet', requiresCustomer: true },
    { label: 'Partial', value: 'partial', icon: 'pi pi-arrows-h', requiresCustomer: true },
  ];

  paymentMethods = computed(() => {
    const hasCustomer = !!this.cart.customer();
    return this.allPaymentMethods.filter(m => !m.requiresCustomer || hasCustomer);
  });

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
  isCredit = computed(() => this.cart.paymentMethod() === 'credit');
  isPartial = computed(() => this.cart.paymentMethod() === 'partial');
  isDigital = computed(() => ['gcash', 'maya', 'card'].includes(this.cart.paymentMethod()));

  creditAmount = computed(() => {
    const method = this.cart.paymentMethod();
    if (method === 'credit') return this.totalAmount();
    if (method === 'partial') return Math.max(0, this.totalAmount() - (this.amountPaid() ?? 0));
    return 0;
  });

  availableCredit = computed(() => {
    const customer = this.cart.customer();
    if (!customer) return 0;
    return Math.max(0, customer.credit_limit - customer.current_balance);
  });

  creditExceeded = computed(() => this.creditAmount() > this.availableCredit());

  canComplete = computed(() => {
    if (this.processing()) return false;
    const method = this.cart.paymentMethod();
    if (method === 'cash') return this.change() >= 0;
    if (method === 'credit') return !this.creditExceeded();
    if (method === 'partial') {
      const paid = this.amountPaid() ?? 0;
      return paid > 0 && paid < this.totalAmount() && !this.creditExceeded();
    }
    // digital: always completable
    return true;
  });

  open() {
    this.amountPaid.set(null);
    this.referenceNumber.set('');
    this.visible = true;
  }

  onDialogShow() {
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
    if (!this.canComplete()) return;
    const method = this.cart.paymentMethod();

    if (method === 'credit') {
      // Full credit - amount_paid is 0
      this.completed.emit(0);
    } else if (method === 'partial') {
      this.completed.emit(this.amountPaid() ?? 0);
    } else if (this.isDigital()) {
      this.completed.emit(this.totalAmount());
    } else {
      // Cash
      this.completed.emit(this.amountPaid() ?? 0);
    }
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
    // Reset amount when switching methods
    this.amountPaid.set(null);
  }
}
