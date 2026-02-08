import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { environment } from '../../../environments/environment';
import { Sale } from '../../core/models/sale.model';
import { Product } from '../../core/models/product.model';
import { SalesReport } from '../../core/models/report.model';
import { StoreContextService } from '../../core/services/store-context.service';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { PhpCurrencyPipe } from '../../shared/pipes/php-currency.pipe';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, ButtonModule, PageHeader, PhpCurrencyPipe, StatusBadge],
  template: `
    <app-page-header title="Dashboard" subtitle="Overview of your store" />

    <!-- Quick Actions -->
    <div class="quick-actions">
      <a routerLink="/pos">
        <p-button label="New Sale" icon="pi pi-calculator" styleClass="action-btn" />
      </a>
      @if (storeCtx.isAdmin()) {
        <a routerLink="/products">
          <p-button label="Products" icon="pi pi-box" severity="secondary" [outlined]="true" />
        </a>
        <a routerLink="/reports">
          <p-button label="Reports" icon="pi pi-chart-bar" severity="secondary" [outlined]="true" />
        </a>
      }
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--color-primary-light); color: var(--color-primary)">
          <i class="pi pi-wallet"></i>
        </div>
        <div class="stat-content">
          <span class="stat-label">Today's Sales</span>
          <span class="stat-value">{{ salesReport()?.total_sales ?? 0 | phpCurrency }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--color-info-light); color: var(--color-info)">
          <i class="pi pi-receipt"></i>
        </div>
        <div class="stat-content">
          <span class="stat-label">Transactions</span>
          <span class="stat-value">{{ salesReport()?.total_transactions ?? 0 }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--color-warning-light); color: var(--color-warning)">
          <i class="pi pi-exclamation-triangle"></i>
        </div>
        <div class="stat-content">
          <span class="stat-label">Low Stock Items</span>
          <span class="stat-value">{{ lowStockProducts().length }}</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background: var(--color-success-light); color: var(--color-success)">
          <i class="pi pi-box"></i>
        </div>
        <div class="stat-content">
          <span class="stat-label">Active Products</span>
          <span class="stat-value">{{ totalProducts() }}</span>
        </div>
      </div>
    </div>

    <div class="dashboard-grid">
      <!-- Recent Sales -->
      <div class="card">
        <div class="card-header">
          <h3>Recent Sales</h3>
          <a routerLink="/sales"><p-button label="View All" [text]="true" size="small" /></a>
        </div>
        @if (recentSales().length === 0) {
          <p class="text-secondary text-sm" style="padding:1rem 0">No sales today</p>
        } @else {
          @for (sale of recentSales(); track sale.id) {
            <div class="sale-row">
              <div>
                <span class="font-medium">{{ sale.sale_number }}</span>
                <span class="text-secondary text-xs" style="margin-left:0.5rem">{{ sale.sale_date | date:'h:mm a' }}</span>
              </div>
              <div class="flex items-center gap-2">
                <app-status-badge [label]="sale.status" [severity]="sale.status === 'completed' ? 'success' : 'danger'" />
                <span class="font-semibold">{{ sale.total_amount | phpCurrency }}</span>
              </div>
            </div>
          }
        }
      </div>

      <!-- Low Stock Alerts -->
      <div class="card">
        <div class="card-header">
          <h3>Low Stock Alerts</h3>
          <a routerLink="/inventory/low-stock"><p-button label="View All" [text]="true" size="small" /></a>
        </div>
        @if (lowStockProducts().length === 0) {
          <p class="text-secondary text-sm" style="padding:1rem 0">All products well stocked</p>
        } @else {
          @for (p of lowStockProducts().slice(0, 5); track p.id) {
            <div class="stock-row">
              <div>
                <span class="font-medium">{{ p.name }}</span>
                <span class="text-secondary text-xs" style="margin-left:0.5rem">{{ p.sku }}</span>
              </div>
              <app-status-badge
                [label]="p.current_stock + ' ' + p.unit"
                [severity]="p.current_stock <= 0 ? 'danger' : 'warn'"
              />
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: `
    .quick-actions {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      a { text-decoration: none; }
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .stat-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .stat-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.75rem;
      height: 2.75rem;
      border-radius: var(--border-radius);
      font-size: 1.25rem;
      flex-shrink: 0;
    }
    .stat-content { display: flex; flex-direction: column; }
    .stat-label { font-size: 0.8125rem; color: var(--text-secondary); }
    .stat-value { font-size: 1.375rem; font-weight: 700; color: var(--text-primary); }
    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    @media (max-width: 768px) { .dashboard-grid { grid-template-columns: 1fr; } }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
      h3 { margin: 0; }
    }
    .sale-row, .stock-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--border-color);
      &:last-child { border-bottom: none; }
    }
  `,
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  storeCtx = inject(StoreContextService);

  salesReport = signal<SalesReport | null>(null);
  recentSales = signal<Sale[]>([]);
  lowStockProducts = signal<Product[]>([]);
  totalProducts = signal(0);

  ngOnInit() {
    this.http.get<SalesReport>(`${environment.apiUrl}/reports/sales`, {
      params: { period: 'daily' },
    }).subscribe((r) => this.salesReport.set(r));

    this.http.get<Sale[]>(`${environment.apiUrl}/sales/daily`).subscribe(
      (s) => this.recentSales.set(s.slice(0, 5))
    );

    this.http.get<Product[]>(`${environment.apiUrl}/inventory/low-stock`).subscribe(
      (p) => this.lowStockProducts.set(p)
    );

    this.http.get<Product[]>(`${environment.apiUrl}/products`).subscribe(
      (p) => this.totalProducts.set(p.length)
    );
  }
}
