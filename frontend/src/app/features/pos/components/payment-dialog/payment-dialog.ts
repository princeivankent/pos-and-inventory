import { Component, input, Output, EventEmitter, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputNumberModule } from 'primeng/inputnumber';
import { PhpCurrencyPipe } from '../../../../shared/pipes/php-currency.pipe';

@Component({
  selector: 'app-payment-dialog',
  standalone: true,
  imports: [DialogModule, ButtonModule, InputNumberModule, FormsModule, PhpCurrencyPipe],
  templateUrl: './payment-dialog.html',
  styleUrls: ['./payment-dialog.scss'],
})
export class PaymentDialogComponent {
  totalAmount = input(0);
  processing = input(false);
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() completed = new EventEmitter<number>();

  visible = false;
  amountPaid = signal<number | null>(null);

  change = computed(() => (this.amountPaid() ?? 0) - this.totalAmount());

  quickAmounts = computed(() => {
    const total = this.totalAmount();
    if (total <= 0) return [];
    const amounts = [total]; // Exact amount
    const roundTo = [50, 100, 500, 1000, 2000];
    for (const r of roundTo) {
      const rounded = Math.ceil(total / r) * r;
      if (rounded > total && !amounts.includes(rounded)) {
        amounts.push(rounded);
      }
    }
    return amounts.slice(0, 5);
  });

  open() {
    this.amountPaid.set(null);
    this.visible = true;
  }

  onClose() {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onComplete() {
    if (this.change() >= 0 && !this.processing()) {
      this.completed.emit(this.amountPaid() ?? 0);
    }
  }

  close() {
    this.visible = false;
  }
}
