import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Customer } from '../../../../core/models/customer.model';

@Component({
  selector: 'app-customer-table',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, TableModule, ButtonModule, TagModule],
  templateUrl: './customer-table.html',
  styleUrls: ['./customer-table.scss'],
})
export class CustomerTableComponent {
  @Input() customers: Customer[] = [];
  @Input() loading = false;
  @Input() isAdmin = false;
  @Input() hasUtangFeature = true;

  @Output() viewStatement = new EventEmitter<Customer>();
  @Output() recordPayment = new EventEmitter<Customer>();
  @Output() edit = new EventEmitter<Customer>();
  @Output() delete = new EventEmitter<Customer>();

  getBalanceSeverity(customer: Customer): 'success' | 'warn' | 'danger' {
    if (customer.current_balance === 0) return 'success';
    if (customer.credit_limit === 0) return 'warn';
    const ratio = customer.current_balance / customer.credit_limit;
    if (ratio >= 0.8) return 'danger';
    return 'warn';
  }

  getBalanceLabel(customer: Customer): string {
    if (customer.current_balance === 0) return 'Paid';
    return `${customer.current_balance.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}`;
  }
}
