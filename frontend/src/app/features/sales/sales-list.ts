import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { environment } from '../../../environments/environment';
import { Sale } from '../../core/models/sale.model';
import { ToastService } from '../../core/services/toast.service';
import { StoreContextService } from '../../core/services/store-context.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import { CsvExportService } from '../../core/services/csv-export.service';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { PhpCurrencyPipe } from '../../shared/pipes/php-currency.pipe';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-sales-list',
  standalone: true,
  imports: [
    DatePipe, FormsModule, TableModule, ButtonModule, DatePickerModule,
    DialogModule, ConfirmDialogModule, PageHeader, PhpCurrencyPipe, StatusBadge,
  ],
  templateUrl: './sales-list.html',
  styleUrls: ['./sales-list.scss'],
})
export class SalesListComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private confirmService = inject(ConfirmationService);
  storeCtx = inject(StoreContextService);
  private subscriptionService = inject(SubscriptionService);
  private csvExport = inject(CsvExportService);

  canExport = this.subscriptionService.hasFeatureSignal('export_data');

  sales = signal<Sale[]>([]);
  selectedSale = signal<Sale | null>(null);
  loading = signal(false);
  detailVisible = false;
  selectedDate: Date | null = null;

  ngOnInit() {
    this.loadSales();
  }

  loadSales() {
    this.loading.set(true);
    const params: Record<string, string> = {};
    if (this.selectedDate) {
      const d = this.selectedDate;
      params['date'] = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    this.http.get<Sale[]>(`${environment.apiUrl}/sales/daily`, { params }).subscribe({
      next: (s) => { this.sales.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  viewSale(sale: Sale) {
    this.http.get<Sale>(`${environment.apiUrl}/sales/${sale.id}`).subscribe({
      next: (s) => {
        this.selectedSale.set(s);
        this.detailVisible = true;
      },
    });
  }

  exportCsv() {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    this.csvExport.export(this.sales(), [
      { field: 'sale_number', header: 'Sale #' },
      { field: 'sale_date', header: 'Date' },
      { field: 'cashier.full_name', header: 'Cashier' },
      { field: 'total_amount', header: 'Total (₱)' },
      { field: 'payment_method', header: 'Payment Method' },
      { field: 'status', header: 'Status' },
    ], `sales-${dateStr}.csv`);
  }

  confirmVoid(sale: Sale) {
    this.confirmService.confirm({
      message: `Void sale "${sale.sale_number}"? This cannot be undone.`,
      header: 'Confirm Void',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.http.post(`${environment.apiUrl}/sales/${sale.id}/void`, {}).subscribe({
          next: () => {
            this.toast.success('Sale voided');
            this.loadSales();
          },
        });
      },
    });
  }
}
