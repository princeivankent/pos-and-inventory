import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { environment } from '../../../environments/environment';
import { Sale } from '../../core/models/sale.model';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { PhpCurrencyPipe } from '../../shared/pipes/php-currency.pipe';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-sale-detail',
  standalone: true,
  imports: [DatePipe, RouterLink, ButtonModule, PageHeader, PhpCurrencyPipe, StatusBadge],
  template: `
    @if (sale()) {
      <app-page-header [title]="'Sale ' + sale()!.sale_number">
        <a routerLink="/sales">
          <p-button label="Back to Sales" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" />
        </a>
      </app-page-header>

      <div class="detail-grid">
        <div class="card">
          <h3>Sale Information</h3>
          <div class="info-rows">
            <div class="info-row"><span>Sale #</span><strong>{{ sale()!.sale_number }}</strong></div>
            <div class="info-row"><span>Date</span><span>{{ sale()!.sale_date | date:'MMM d, y h:mm a' }}</span></div>
            <div class="info-row"><span>Cashier</span><span>{{ sale()!.cashier?.full_name ?? '-' }}</span></div>
            <div class="info-row"><span>Payment</span><app-status-badge [label]="sale()!.payment_method" severity="info" /></div>
            <div class="info-row"><span>Status</span><app-status-badge [label]="sale()!.status" [severity]="sale()!.status === 'completed' ? 'success' : 'danger'" /></div>
          </div>
        </div>

        <div class="card">
          <h3>Items</h3>
          <table class="items-table">
            <thead>
              <tr><th>Product</th><th style="text-align:right">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Subtotal</th></tr>
            </thead>
            <tbody>
              @for (item of sale()!.items ?? []; track item.id) {
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
            <div class="total-row"><span>Subtotal</span><span>{{ sale()!.subtotal | phpCurrency }}</span></div>
            @if (sale()!.tax_amount > 0) {
              <div class="total-row"><span>VAT</span><span>{{ sale()!.tax_amount | phpCurrency }}</span></div>
            }
            <div class="total-row grand"><span>Total</span><span>{{ sale()!.total_amount | phpCurrency }}</span></div>
            <div class="total-row"><span>Paid</span><span>{{ sale()!.amount_paid | phpCurrency }}</span></div>
            <div class="total-row"><span>Change</span><span>{{ sale()!.change_amount | phpCurrency }}</span></div>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    @media (max-width: 768px) { .detail-grid { grid-template-columns: 1fr; } }
    h3 { margin-bottom: 1rem; }
    .info-rows { display: flex; flex-direction: column; gap: 0.75rem; }
    .info-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.875rem; }
    .items-table {
      width: 100%; border-collapse: collapse; font-size: 0.8125rem; margin-bottom: 1rem;
      th, td { padding: 0.5rem 0.25rem; border-bottom: 1px solid var(--border-color); }
      th { font-weight: 500; color: var(--text-secondary); text-align: left; }
    }
    .totals { display: flex; flex-direction: column; gap: 0.375rem; }
    .total-row {
      display: flex; justify-content: space-between; font-size: 0.875rem;
      &.grand { font-weight: 700; font-size: 1rem; padding-top: 0.5rem; border-top: 2px solid var(--border-color); }
    }
  `,
})
export class SaleDetailComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  sale = signal<Sale | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.http.get<Sale>(`${environment.apiUrl}/sales/${id}`).subscribe(
        (s) => this.sale.set(s)
      );
    }
  }
}
