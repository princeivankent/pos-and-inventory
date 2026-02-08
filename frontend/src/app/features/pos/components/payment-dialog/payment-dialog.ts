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
  template: `
    <p-dialog
      header="Payment"
      [(visible)]="visible"
      [modal]="true"
      [style]="{ width: '420px' }"
      [closable]="!processing()"
      [closeOnEscape]="!processing()"
      (onHide)="onClose()"
    >
      <div class="payment-body">
        <div class="payment-total">
          <span>Total Amount</span>
          <span class="total-value">{{ totalAmount() | phpCurrency }}</span>
        </div>

        <div class="field">
          <label>Amount Received</label>
          <p-inputNumber
            [ngModel]="amountPaid()"
            (ngModelChange)="amountPaid.set($event)"
            mode="currency"
            currency="PHP"
            locale="en-PH"
            [min]="0"
            inputStyleClass="payment-input"
            styleClass="w-full"
            placeholder="Enter amount"
          />
        </div>

        <div class="quick-amounts">
          @for (amount of quickAmounts(); track amount) {
            <p-button
              [label]="amount | phpCurrency"
              [outlined]="true"
              severity="secondary"
              size="small"
              (onClick)="amountPaid.set(amount)"
            />
          }
        </div>

        <div class="change-display" [class.negative]="change() < 0">
          <span>{{ change() >= 0 ? 'Change' : 'Remaining' }}</span>
          <span class="change-value">{{ (change() >= 0 ? change() : -change()) | phpCurrency }}</span>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <p-button
          label="Cancel"
          [text]="true"
          severity="secondary"
          [disabled]="processing()"
          (onClick)="onClose()"
        />
        <p-button
          [label]="processing() ? 'Processing...' : 'Complete Sale'"
          [icon]="processing() ? 'pi pi-spinner pi-spin' : 'pi pi-check'"
          [disabled]="change() < 0 || processing()"
          [loading]="processing()"
          (onClick)="onComplete()"
        />
      </ng-template>
    </p-dialog>
  `,
  styles: `
    .payment-body {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .payment-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: var(--bg-secondary);
      border-radius: var(--border-radius);
    }
    .total-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-primary);
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      label {
        font-size: 0.875rem;
        font-weight: 500;
      }
    }
    :host ::ng-deep .payment-input {
      width: 100%;
      font-size: 1.25rem;
      font-weight: 600;
      text-align: right;
      padding: 0.75rem 1rem;
    }
    :host ::ng-deep .w-full { width: 100%; }
    .quick-amounts {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .change-display {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: #ecfdf5;
      border-radius: var(--border-radius);
      &.negative {
        background: #fef2f2;
        .change-value { color: var(--color-danger); }
      }
    }
    .change-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--color-success);
    }
  `,
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
