import { Component, Input, Output, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { Customer, RecordPaymentDto } from '../../../../core/models/customer.model';

@Component({
  selector: 'app-record-payment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    FormsModule,
    DialogModule,
    InputNumberModule,
    SelectModule,
    TextareaModule,
    ButtonModule,
  ],
  templateUrl: './record-payment-dialog.html',
  styleUrls: ['./record-payment-dialog.scss'],
})
export class RecordPaymentDialogComponent implements OnChanges {
  @Input() visible = false;
  @Input() customer: Customer | null = null;
  @Input() saving = false;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() submitPayment = new EventEmitter<RecordPaymentDto>();

  amount: number = 0;
  paymentMethod = 'cash';
  notes = '';

  paymentMethods = [
    { label: 'Cash', value: 'cash' },
    { label: 'GCash', value: 'gcash' },
    { label: 'Maya', value: 'maya' },
    { label: 'Card', value: 'card' },
  ];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['visible'] && this.visible) {
      this.amount = 0;
      this.paymentMethod = 'cash';
      this.notes = '';
    }
  }

  get maxAmount(): number {
    return this.customer?.current_balance ?? 0;
  }

  get isValid(): boolean {
    return this.amount > 0 && this.amount <= this.maxAmount;
  }

  payFull() {
    this.amount = this.maxAmount;
  }

  onSubmit() {
    this.submitPayment.emit({
      amount: this.amount,
      payment_method: this.paymentMethod,
      notes: this.notes || undefined,
    });
  }

  onHide() {
    this.visibleChange.emit(false);
  }
}
