import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { Skeleton } from 'primeng/skeleton';
import { UIChart } from 'primeng/chart';
import { environment } from '../../../environments/environment';
import { Sale } from '../../core/models/sale.model';
import { Product } from '../../core/models/product.model';
import {
  SalesReport,
  BestSellingItem,
  ProfitReport,
  InventoryReport,
} from '../../core/models/report.model';
import { StoreContextService } from '../../core/services/store-context.service';
import { AuthService } from '../../core/services/auth.service';
import { PhpCurrencyPipe } from '../../shared/pipes/php-currency.pipe';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    DecimalPipe,
    ButtonModule,
    Skeleton,
    UIChart,
    PhpCurrencyPipe,
    StatusBadge,
  ],
  template: `
    <!-- 1. Personalized Greeting Header -->
    <div class="dashboard-welcome">
      <div class="welcome-text">
        <h1>{{ greeting }}, {{ userName }}</h1>
        <p class="subtitle">{{ today }}</p>
      </div>
      <div class="quick-actions">
        <a routerLink="/pos">
          <p-button label="New Sale" icon="pi pi-calculator" />
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
    </div>

    <!-- 2. Stat Cards -->
    <div class="stats-grid">
      <a routerLink="/sales" class="stat-card stat-card--clickable">
        @if (statsLoading()) {
          <p-skeleton width="2.75rem" height="2.75rem" borderRadius="8px" />
          <div class="stat-content">
            <p-skeleton width="80px" height="13px" />
            <p-skeleton width="100px" height="22px" />
          </div>
        } @else {
          <div class="stat-icon" style="background: var(--color-primary-light); color: var(--color-primary)">
            <i class="pi pi-wallet"></i>
          </div>
          <div class="stat-content">
            <span class="stat-label">Today's Sales</span>
            <span class="stat-value">{{ salesReport()?.total_sales ?? 0 | phpCurrency }}</span>
          </div>
        }
      </a>
      <a routerLink="/sales" class="stat-card stat-card--clickable">
        @if (statsLoading()) {
          <p-skeleton width="2.75rem" height="2.75rem" borderRadius="8px" />
          <div class="stat-content">
            <p-skeleton width="80px" height="13px" />
            <p-skeleton width="60px" height="22px" />
          </div>
        } @else {
          <div class="stat-icon" style="background: var(--color-info-light); color: var(--color-info)">
            <i class="pi pi-receipt"></i>
          </div>
          <div class="stat-content">
            <span class="stat-label">Transactions</span>
            <span class="stat-value">{{ salesReport()?.total_transactions ?? 0 }}</span>
          </div>
        }
      </a>
      <a routerLink="/inventory" class="stat-card stat-card--clickable">
        @if (statsLoading()) {
          <p-skeleton width="2.75rem" height="2.75rem" borderRadius="8px" />
          <div class="stat-content">
            <p-skeleton width="80px" height="13px" />
            <p-skeleton width="40px" height="22px" />
          </div>
        } @else {
          <div class="stat-icon" style="background: var(--color-warning-light); color: var(--color-warning)">
            <i class="pi pi-exclamation-triangle"></i>
          </div>
          <div class="stat-content">
            <span class="stat-label">Low Stock Items</span>
            <span class="stat-value">{{ lowStockProducts().length }}</span>
          </div>
        }
      </a>
      <a routerLink="/products" class="stat-card stat-card--clickable">
        @if (statsLoading()) {
          <p-skeleton width="2.75rem" height="2.75rem" borderRadius="8px" />
          <div class="stat-content">
            <p-skeleton width="80px" height="13px" />
            <p-skeleton width="40px" height="22px" />
          </div>
        } @else {
          <div class="stat-icon" style="background: var(--color-success-light); color: var(--color-success)">
            <i class="pi pi-box"></i>
          </div>
          <div class="stat-content">
            <span class="stat-label">Active Products</span>
            <span class="stat-value">{{ totalProducts() }}</span>
          </div>
        }
      </a>
    </div>

    <!-- 3. Sales Trend Chart -->
    <div class="card chart-section">
      <div class="card-header">
        <div>
          <h3>Sales This Week</h3>
          @if (!chartLoading() && weeklySalesReport()) {
            <span class="chart-subtitle">Total: {{ weeklySalesReport()!.total_sales | phpCurrency }}</span>
          }
        </div>
        <a routerLink="/reports"><p-button label="View Reports" [text]="true" size="small" /></a>
      </div>
      @if (chartLoading()) {
        <p-skeleton width="100%" height="260px" borderRadius="8px" />
      } @else {
        <div class="chart-wrapper">
          <p-chart type="line" [data]="salesChartData" [options]="chartOptions" height="260px" />
        </div>
      }
    </div>

    <!-- 4. Two-Column Grid -->
    <div class="content-grid">
      <!-- Recent Sales -->
      <div class="card">
        <div class="card-header">
          <h3>Recent Sales</h3>
          <a routerLink="/sales"><p-button label="View All" [text]="true" size="small" /></a>
        </div>
        @if (salesLoading()) {
          @for (i of skeletonRows; track i) {
            <div class="sale-row">
              <div class="flex items-center gap-2">
                <p-skeleton width="100px" height="14px" />
                <p-skeleton width="50px" height="12px" />
              </div>
              <p-skeleton width="80px" height="14px" />
            </div>
          }
        } @else if (recentSales().length === 0) {
          <div class="empty-state">
            <i class="pi pi-shopping-cart empty-icon"></i>
            <p>No sales today</p>
          </div>
        } @else {
          @for (sale of recentSales(); track sale.id) {
            <a class="sale-row sale-row--clickable" [routerLink]="['/sales']">
              <div class="sale-row-left">
                <div class="timeline-dot"></div>
                <div>
                  <span class="font-medium">{{ sale.sale_number }}</span>
                  <span class="text-secondary text-xs sale-time">{{ sale.sale_date | date:'h:mm a' }}</span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <app-status-badge [label]="sale.status" [severity]="sale.status === 'completed' ? 'success' : 'danger'" />
                <span class="font-semibold">{{ sale.total_amount | phpCurrency }}</span>
              </div>
            </a>
          }
        }
      </div>

      <!-- Right column: Top Selling (admin) or Low Stock (cashier) -->
      @if (storeCtx.isAdmin()) {
        <div class="card">
          <div class="card-header">
            <h3>Top Selling Products</h3>
            <a routerLink="/reports"><p-button label="Details" [text]="true" size="small" /></a>
          </div>
          @if (topSellingLoading()) {
            @for (i of skeletonRows; track i) {
              <div class="top-product-row">
                <p-skeleton width="60%" height="14px" />
                <p-skeleton width="50px" height="14px" />
              </div>
            }
          } @else if (topSellingProducts().length === 0) {
            <div class="empty-state">
              <i class="pi pi-trophy empty-icon"></i>
              <p>No sales data this month</p>
            </div>
          } @else {
            @for (item of topSellingProducts(); track item.product_id; let idx = $index) {
              <div class="top-product-row">
                <div class="top-product-info">
                  <span class="top-product-rank">#{{ idx + 1 }}</span>
                  <span class="font-medium">{{ item.name }}</span>
                </div>
                <div class="top-product-bar-area">
                  <div class="top-product-bar"
                    [style.width.%]="getBarWidth(item.total_quantity)">
                  </div>
                  <span class="top-product-qty">{{ item.total_quantity }} sold</span>
                </div>
              </div>
            }
          }
        </div>
      } @else {
        <!-- Cashier: Low Stock Alerts -->
        <div class="card">
          <div class="card-header">
            <h3>Low Stock Alerts</h3>
            <a routerLink="/inventory/low-stock"><p-button label="View All" [text]="true" size="small" /></a>
          </div>
          @if (statsLoading()) {
            @for (i of skeletonRows; track i) {
              <div class="stock-row">
                <p-skeleton width="60%" height="14px" />
                <p-skeleton width="50px" height="14px" />
              </div>
            }
          } @else if (lowStockProducts().length === 0) {
            <div class="empty-state">
              <i class="pi pi-check-circle empty-icon" style="color: var(--color-success)"></i>
              <p>All products well stocked</p>
            </div>
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
      }
    </div>

    <!-- 5. Bottom Row (Admin-only insights) -->
    @if (storeCtx.isAdmin()) {
      <div class="insights-grid">
        <!-- Today's Profit -->
        <div class="card">
          <div class="card-header">
            <h3>Today's Profit</h3>
          </div>
          @if (profitLoading()) {
            <div class="profit-grid">
              @for (i of [1,2,3,4]; track i) {
                <div class="profit-stat">
                  <p-skeleton width="70px" height="12px" />
                  <p-skeleton width="90px" height="20px" />
                </div>
              }
            </div>
          } @else {
            <div class="profit-grid">
              <div class="profit-stat">
                <span class="profit-label">Revenue</span>
                <span class="profit-value">{{ profitReport()?.total_revenue ?? 0 | phpCurrency }}</span>
              </div>
              <div class="profit-stat">
                <span class="profit-label">Cost</span>
                <span class="profit-value">{{ profitReport()?.total_cost ?? 0 | phpCurrency }}</span>
              </div>
              <div class="profit-stat">
                <span class="profit-label">Gross Profit</span>
                <span class="profit-value" [class.profit-positive]="(profitReport()?.gross_profit ?? 0) >= 0"
                  [class.profit-negative]="(profitReport()?.gross_profit ?? 0) < 0">
                  {{ profitReport()?.gross_profit ?? 0 | phpCurrency }}
                </span>
              </div>
              <div class="profit-stat">
                <span class="profit-label">Margin</span>
                <span class="profit-value" [class.profit-positive]="(profitReport()?.profit_margin ?? 0) >= 0"
                  [class.profit-negative]="(profitReport()?.profit_margin ?? 0) < 0">
                  {{ (profitReport()?.profit_margin ?? 0) | number:'1.1-1' }}%
                </span>
              </div>
            </div>
          }
        </div>

        <!-- Inventory Snapshot -->
        <div class="card">
          <div class="card-header">
            <h3>Inventory Snapshot</h3>
          </div>
          @if (inventoryLoading()) {
            <div class="profit-grid">
              @for (i of [1,2,3,4]; track i) {
                <div class="profit-stat">
                  <p-skeleton width="70px" height="12px" />
                  <p-skeleton width="90px" height="20px" />
                </div>
              }
            </div>
          } @else {
            <div class="profit-grid">
              <div class="profit-stat">
                <span class="profit-label">Stock Value</span>
                <span class="profit-value">{{ inventoryReport()?.total_stock_value ?? 0 | phpCurrency }}</span>
              </div>
              <div class="profit-stat">
                <span class="profit-label">Total Products</span>
                <span class="profit-value">{{ inventoryReport()?.total_products ?? 0 }}</span>
              </div>
              <div class="profit-stat">
                <span class="profit-label">Low Stock</span>
                <span class="profit-value">
                  <app-status-badge
                    [label]="(inventoryReport()?.low_stock_count ?? 0).toString()"
                    [severity]="(inventoryReport()?.low_stock_count ?? 0) > 0 ? 'warn' : 'success'"
                  />
                </span>
              </div>
              <div class="profit-stat">
                <span class="profit-label">Out of Stock</span>
                <span class="profit-value">
                  <app-status-badge
                    [label]="(inventoryReport()?.out_of_stock_count ?? 0).toString()"
                    [severity]="(inventoryReport()?.out_of_stock_count ?? 0) > 0 ? 'danger' : 'success'"
                  />
                </span>
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: `
    .dashboard-welcome {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-6);
    }
    .welcome-text h1 {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0;
      color: var(--text-primary);
    }
    .welcome-text .subtitle {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin: var(--space-1) 0 0;
    }
    .quick-actions {
      display: flex;
      gap: 0.75rem;
      a { text-decoration: none; }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin-bottom: var(--space-6);
    }
    .stat-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      text-decoration: none;
      color: inherit;
      transition: transform var(--transition-fast), box-shadow var(--transition-fast);
    }
    .stat-card--clickable:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
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
    .stat-content { display: flex; flex-direction: column; gap: 2px; }
    .stat-label { font-size: 0.8125rem; color: var(--text-secondary); }
    .stat-value { font-size: 1.375rem; font-weight: 700; color: var(--text-primary); }

    .chart-section {
      margin-bottom: var(--space-6);
      box-shadow: var(--shadow-sm);
    }
    .chart-subtitle {
      font-size: 0.875rem;
      color: var(--text-secondary);
      font-weight: 500;
    }
    .chart-wrapper {
      position: relative;
      width: 100%;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-6);
      margin-bottom: var(--space-6);
    }

    .insights-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-6);
    }

    @media (max-width: 768px) {
      .dashboard-welcome {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-4);
      }
      .content-grid,
      .insights-grid {
        grid-template-columns: 1fr;
      }
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
      h3 { margin: 0; font-size: 1rem; font-weight: 600; }
    }

    .sale-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--border-color);
      &:last-child { border-bottom: none; }
    }
    .sale-row--clickable {
      text-decoration: none;
      color: inherit;
      border-radius: var(--border-radius-sm);
      padding: 0.75rem 0.5rem;
      margin: 0 -0.5rem;
      transition: background var(--transition-fast);
      &:hover { background: var(--bg-secondary); }
    }
    .sale-row-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .timeline-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--color-primary);
      flex-shrink: 0;
    }
    .sale-time {
      margin-left: 0.5rem;
    }

    .stock-row, .top-product-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--border-color);
      &:last-child { border-bottom: none; }
    }
    .top-product-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
      min-width: 0;
      .font-medium {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
    .top-product-rank {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--color-primary);
      min-width: 1.5rem;
    }
    .top-product-bar-area {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 120px;
    }
    .top-product-bar {
      height: 6px;
      background: var(--color-primary);
      border-radius: 3px;
      min-width: 4px;
      transition: width var(--transition-normal);
    }
    .top-product-qty {
      font-size: 0.75rem;
      color: var(--text-secondary);
      white-space: nowrap;
    }

    .profit-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-4);
    }
    .profit-stat {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .profit-label {
      font-size: 0.8125rem;
      color: var(--text-secondary);
    }
    .profit-value {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .profit-positive { color: var(--color-success); }
    .profit-negative { color: var(--color-danger); }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-8) 0;
      color: var(--text-secondary);
      p { margin: var(--space-2) 0 0; font-size: 0.875rem; }
    }
    .empty-icon {
      font-size: 2rem;
      color: var(--text-tertiary);
    }
  `,
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  storeCtx = inject(StoreContextService);

  // Data signals
  salesReport = signal<SalesReport | null>(null);
  weeklySalesReport = signal<SalesReport | null>(null);
  recentSales = signal<Sale[]>([]);
  lowStockProducts = signal<Product[]>([]);
  totalProducts = signal(0);
  topSellingProducts = signal<BestSellingItem[]>([]);
  profitReport = signal<ProfitReport | null>(null);
  inventoryReport = signal<InventoryReport | null>(null);

  // Loading signals
  statsLoading = signal(true);
  chartLoading = signal(true);
  salesLoading = signal(true);
  topSellingLoading = signal(true);
  profitLoading = signal(true);
  inventoryLoading = signal(true);

  // Chart data
  salesChartData: any = { labels: [], datasets: [] };
  chartOptions: any = {};

  // Template helpers
  skeletonRows = [1, 2, 3, 4, 5];
  greeting = '';
  userName = '';
  today = '';

  ngOnInit() {
    this.setGreeting();
    this.setupChartOptions();
    this.loadAllData();
  }

  private setGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) this.greeting = 'Good morning';
    else if (hour < 17) this.greeting = 'Good afternoon';
    else this.greeting = 'Good evening';

    const user = this.auth.currentUser();
    this.userName = user?.full_name?.split(' ')[0] ?? 'there';

    this.today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private setupChartOptions() {
    this.chartOptions = {
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx: any) => '₱' + (ctx.raw as number).toLocaleString(),
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (v: number) => '₱' + v.toLocaleString(),
          },
          grid: { color: 'rgba(0,0,0,0.04)' },
        },
        x: {
          grid: { display: false },
        },
      },
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
    };
  }

  private loadAllData() {
    const api = environment.apiUrl;

    // Daily sales report (stat cards)
    this.http.get<SalesReport>(`${api}/reports/sales`, { params: { period: 'daily' } })
      .subscribe({
        next: (r) => this.salesReport.set(r),
        error: () => {},
        complete: () => this.statsLoading.set(false),
      });

    // Weekly sales report (chart)
    this.http.get<SalesReport>(`${api}/reports/sales`, { params: { period: 'weekly' } })
      .subscribe({
        next: (r) => {
          this.weeklySalesReport.set(r);
          this.buildChartData(r);
        },
        error: () => this.buildChartData(null),
        complete: () => this.chartLoading.set(false),
      });

    // Recent sales
    this.http.get<Sale[]>(`${api}/sales/daily`).subscribe({
      next: (s) => this.recentSales.set(s.slice(0, 5)),
      error: () => {},
      complete: () => this.salesLoading.set(false),
    });

    // Low stock products
    this.http.get<Product[]>(`${api}/inventory/low-stock`).subscribe({
      next: (p) => this.lowStockProducts.set(p),
      error: () => {},
      complete: () => {},
    });

    // Active products count
    this.http.get<Product[]>(`${api}/products`).subscribe({
      next: (p) => this.totalProducts.set(p.length),
      error: () => {},
    });

    // Admin-only data
    if (this.storeCtx.isAdmin()) {
      // Top selling products
      this.http.get<BestSellingItem[]>(`${api}/reports/best-selling`, {
        params: { period: 'monthly', limit: '5' },
      }).subscribe({
        next: (items) => this.topSellingProducts.set(items),
        error: () => {},
        complete: () => this.topSellingLoading.set(false),
      });

      // Profit report
      this.http.get<ProfitReport>(`${api}/reports/profit`, { params: { period: 'daily' } })
        .subscribe({
          next: (r) => this.profitReport.set(r),
          error: () => {},
          complete: () => this.profitLoading.set(false),
        });

      // Inventory report
      this.http.get<InventoryReport>(`${api}/reports/inventory`).subscribe({
        next: (r) => this.inventoryReport.set(r),
        error: () => {},
        complete: () => this.inventoryLoading.set(false),
      });
    }
  }

  private buildChartData(report: SalesReport | null) {
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    if (!report?.daily_breakdown?.length) {
      this.salesChartData = {
        labels: dayLabels,
        datasets: [{
          label: 'Sales',
          data: [0, 0, 0, 0, 0, 0, 0],
          fill: true,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.08)',
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#6366f1',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
        }],
      };
      return;
    }

    const labels = report.daily_breakdown.map((d) => {
      const date = new Date(d.date);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    });
    const data = report.daily_breakdown.map((d) => d.total_sales);

    this.salesChartData = {
      labels,
      datasets: [{
        label: 'Sales',
        data,
        fill: true,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.08)',
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      }],
    };
  }

  getBarWidth(quantity: number): number {
    const max = Math.max(...this.topSellingProducts().map((p) => p.total_quantity), 1);
    return (quantity / max) * 100;
  }
}
