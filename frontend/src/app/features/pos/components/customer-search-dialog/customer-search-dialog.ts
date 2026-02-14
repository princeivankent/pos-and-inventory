import { Component, inject, Output, EventEmitter, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DialogModule } from 'primeng/dialog';
import { AutoCompleteModule, AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { environment } from '../../../../../environments/environment';
import { Customer } from '../../../../core/models/customer.model';
import { PhpCurrencyPipe } from '../../../../shared/pipes/php-currency.pipe';

@Component({
  selector: 'app-customer-search-dialog',
  standalone: true,
  imports: [FormsModule, DialogModule, AutoCompleteModule, ButtonModule, PhpCurrencyPipe],
  templateUrl: './customer-search-dialog.html',
  styleUrls: ['./customer-search-dialog.scss'],
})
export class CustomerSearchDialogComponent {
  private http = inject(HttpClient);

  @Output() customerSelected = new EventEmitter<Customer | null>();

  visible = false;
  searchText: string | Customer = '';
  suggestions = signal<Customer[]>([]);

  open() {
    this.searchText = '';
    this.suggestions.set([]);
    this.visible = true;
  }

  close() {
    this.visible = false;
  }

  search(event: AutoCompleteCompleteEvent) {
    this.http
      .get<Customer[]>(`${environment.apiUrl}/customers`, {
        params: { search: event.query },
      })
      .subscribe({
        next: (customers) => this.suggestions.set(customers),
        error: () => this.suggestions.set([]),
      });
  }

  onSelect(event: AutoCompleteSelectEvent) {
    this.customerSelected.emit(event.value as Customer);
    this.close();
  }

  selectWalkIn() {
    this.customerSelected.emit(null);
    this.close();
  }
}
