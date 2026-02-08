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
  template: `
    <app-page-header title="Sales" subtitle="Sales history and transactions">
      <p-datepicker
        [(ngModel)]="selectedDate"
        [showIcon]="true"
        dateFormat="yy-mm-dd"
        placeholder="Filter by date"
        [showClear]="true"
        (onSelect)="loadSales()"
        (onClear)="loadSales()"
        inputStyleClass="date-input"
      />
    </app-page-header>

    <div class="card">
      <p-table
        [value]="sales()"
        [paginator]="true"
        [rows]="20"
        [loading]="loading()"
        dataKey="id"
        [sortField]="'sale_date'"
        [sortOrder]="-1"
      >
        <ng-template pTemplate="header">
          <tr>
            <th pSortableColumn="sale_number">Sale # <p-sortIcon field="sale_number" /></th>
            <th pSortableColumn="sale_date">Date <p-sortIcon field="sale_date" /></th>
            <th>Cashier</th>
            <th style="text-align:right">Items</th>
            <th pSortableColumn="total_amount" style="text-align:right">Total <p-sortIcon field="total_amount" /></th>
            <th>Payment</th>
            <th>Status</th>
            <th style="width:120px">Actions</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-sale>
          <tr>
            <td class="font-medium">{{ sale.sale_number }}</td>
            <td>{{ sale.sale_date | date:'MMM d, y h:mm a' }}</td>
            <td>{{ sale.cashier?.full_name ?? '-' }}</td>
            <td style="text-align:right">{{ sale.items?.length ?? 0 }}</td>
            <td style="text-align:right" class="font-semibold">{{ sale.total_amount | phpCurrency }}</td>
            <td>
              <app-status-badge
                [label]="sale.payment_method"
                [severity]="sale.payment_method === 'cash' ? 'success' : sale.payment_method === 'credit' ? 'warn' : 'info'"
              />
            </td>
            <td>
              <app-status-badge
                [label]="sale.status"
                [severity]="sale.status === 'completed' ? 'success' : sale.status === 'void' ? 'danger' : 'warn'"
              />
            </td>
            <td>
              <div class="flex gap-2">
                <p-button icon="pi pi-eye" [rounded]="true" [text]="true" (onClick)="viewSale(sale)" />
                @if (storeCtx.isAdmin() && sale.status === 'completed') {
                  <p-button icon="pi pi-ban" [rounded]="true" [text]="true" severity="danger" (onClick)="confirmVoid(sale)" pTooltip="Void sale" />
                }
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr><td colspan="8" class="text-center text-secondary" style="padding:2rem">No sales found</td></tr>
        </ng-template>
      </p-table>
    </div>

    <!-- Sale Detail Dialog -->
    <p-dialog
      [(visible)]="detailVisible"
      header="Sale Detail"
      [modal]="true"
      [style]="{ width: '550px' }"
    >
      @if (selectedSale()) {
        <div class="sale-detail">
          <div class="detail-row">
            <span>Sale #</span>
            <strong>{{ selectedSale()!.sale_number }}</strong>
          </div>
          <div class="detail-row">
            <span>Date</span>
            <span>{{ selectedSale()!.sale_date | date:'MMM d, y h:mm a' }}</span>
          </div>
          <div class="detail-row">
            <span>Status</span>
            <app-status-badge
              [label]="selectedSale()!.status"
              [severity]="selectedSale()!.status === 'completed' ? 'success' : 'danger'"
            />
          </div>

          <h4 style="margin-top: 1rem">Items</h4>
          <table class="items-table">
            <thead>
              <tr>
                <th>Product</th>
                <th style="text-align:right">Qty</th>
                <th style="text-align:right">Price</th>
                <th style="text-align:right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              @for (item of selectedSale()!.items ?? []; track item.id) {
                <tr>
                  <td>{{ item.product?.name ?? 'Product' }}</td>
                  <td style="text-align:right">{{ item.quantity }}</td>
                  <td style="text-align:right">{{ item.unit_price | phpCurrency }}</td>
                  <td style="text-align:right">{{ item.subtotal | phpCurrency }}</td>
                </tr>
              }
            </tbody>
          </table>

          <div class="totals">
            <div class="detail-row">
              <span>Subtotal</span>
              <span>{{ selectedSale()!.subtotal | phpCurrency }}</span>
            </div>
            @if (selectedSale()!.tax_amount > 0) {
              <div class="detail-row">
                <span>VAT</span>
                <span>{{ selectedSale()!.tax_amount | phpCurrency }}</span>
              </div>
            }
            @if (selectedSale()!.discount_amount > 0) {
              <div class="detail-row">
                <span>Discount</span>
                <span>-{{ selectedSale()!.discount_amount | phpCurrency }}</span>
              </div>
            }
            <div class="detail-row total">
              <span>Total</span>
              <span>{{ selectedSale()!.total_amount | phpCurrency }}</span>
            </div>
            <div class="detail-row">
              <span>Paid</span>
              <span>{{ selectedSale()!.amount_paid | phpCurrency }}</span>
            </div>
            <div class="detail-row">
              <span>Change</span>
              <span>{{ selectedSale()!.change_amount | phpCurrency }}</span>
            </div>
          </div>
        </div>
      }
    </p-dialog>
  `,
  styles: `
    :host ::ng-deep .date-input { width: 160px; }
    .sale-detail {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.875rem;
      &.total {
        font-weight: 700;
        font-size: 1rem;
        padding: 0.5rem 0;
        border-top: 2px solid var(--border-color);
        margin-top: 0.25rem;
      }
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
      margin: 0.5rem 0;
      th, td {
        padding: 0.5rem 0.25rem;
        border-bottom: 1px solid var(--border-color);
      }
      th {
        font-weight: 500;
        color: var(--text-secondary);
        text-align: left;
      }
    }
    .totals {
      margin-top: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }
  `,
})
export class SalesListComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private confirmService = inject(ConfirmationService);
  storeCtx = inject(StoreContextService);

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
