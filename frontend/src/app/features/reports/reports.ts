import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabsModule } from 'primeng/tabs';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { environment } from '../../../environments/environment';
import { SalesReport, InventoryReport, BestSellingItem, ProfitReport, DailySales } from '../../core/models/report.model';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { PhpCurrencyPipe } from '../../shared/pipes/php-currency.pipe';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [DecimalPipe, FormsModule, TabsModule, SelectModule, TableModule, ChartModule, ButtonModule, SkeletonModule, ProgressSpinnerModule, PageHeader, PhpCurrencyPipe],
  template: `
    <app-page-header title="Reports" subtitle="Business analytics and insights" />

    <p-tabs [(value)]="activeTab">
      <p-tabpanel value="sales" header="Sales">
        <!-- Period selector + date navigation -->
        <div class="report-controls">
          <p-select
            [(ngModel)]="salesPeriod"
            [options]="periodOptions"
            optionLabel="label"
            optionValue="value"
            (onChange)="onSalesPeriodChange()"
          />
          <div class="date-nav">
            <p-button icon="pi pi-chevron-left" [text]="true" [rounded]="true" severity="secondary" (onClick)="navigateDate('sales', -1)" />
            <span class="date-label">{{ formatDateRange(salesReport()?.start_date, salesReport()?.end_date, salesPeriod) }}</span>
            <p-button icon="pi pi-chevron-right" [text]="true" [rounded]="true" severity="secondary" (onClick)="navigateDate('sales', 1)" [disabled]="isCurrentPeriod(salesDate, salesPeriod)" />
          </div>
          @if (isCurrentPeriod(salesDate, salesPeriod)) {
            <span class="current-badge">Current</span>
          }
        </div>

        @if (salesLoading()) {
          <div class="stats-grid">
            @for (_ of [1,2,3,4]; track _) {
              <div class="stat-card"><p-skeleton height="3.5rem" /></div>
            }
          </div>
        } @else if (salesReport()) {
          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-label">Total Sales</span>
              <span class="stat-value">{{ salesReport()!.total_sales | phpCurrency }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Transactions</span>
              <span class="stat-value">{{ salesReport()!.total_transactions }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Tax Collected</span>
              <span class="stat-value">{{ salesReport()!.total_tax | phpCurrency }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Net Sales</span>
              <span class="stat-value">{{ salesReport()!.net_sales | phpCurrency }}</span>
            </div>
          </div>

          @if (salesReport()!.total_transactions === 0) {
            <div class="empty-state">
              <i class="pi pi-chart-bar"></i>
              <p>No sales recorded for this period</p>
            </div>
          } @else if (salesChartData()) {
            <div class="card" style="margin-top: 1rem">
              <p-chart type="bar" [data]="salesChartData()!" [options]="chartOptions" height="300px" />
            </div>
          }
        }
      </p-tabpanel>

      <p-tabpanel value="inventory" header="Inventory">
        @if (inventoryLoading()) {
          <div class="stats-grid" style="margin-top: 1rem;">
            @for (_ of [1,2,3,4]; track _) {
              <div class="stat-card"><p-skeleton height="3.5rem" /></div>
            }
          </div>
        } @else if (inventoryReport()) {
          <div class="stats-grid" style="margin-top: 1rem;">
            <div class="stat-card">
              <span class="stat-label">Total Products</span>
              <span class="stat-value">{{ inventoryReport()!.total_products }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Stock Value</span>
              <span class="stat-value">{{ inventoryReport()!.total_stock_value | phpCurrency }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Low Stock</span>
              <span class="stat-value warn">{{ inventoryReport()!.low_stock_count }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Out of Stock</span>
              <span class="stat-value danger">{{ inventoryReport()!.out_of_stock_count }}</span>
            </div>
          </div>

          @if (inventoryReport()!.products.length === 0) {
            <div class="empty-state">
              <i class="pi pi-box"></i>
              <p>No products in inventory</p>
            </div>
          } @else {
            <div class="card" style="margin-top: 1rem">
              <p-table [value]="inventoryReport()!.products" [paginator]="true" [rows]="10" dataKey="product_id">
                <ng-template pTemplate="header">
                  <tr>
                    <th>Product</th><th>SKU</th>
                    <th style="text-align:right">Stock</th>
                    <th style="text-align:right">Reorder Lvl</th>
                    <th style="text-align:right">Stock Value</th>
                    <th style="text-align:center">Status</th>
                  </tr>
                </ng-template>
                <ng-template pTemplate="body" let-item>
                  <tr>
                    <td class="font-medium">{{ item.name }}</td>
                    <td>{{ item.sku }}</td>
                    <td style="text-align:right">{{ item.current_stock }}</td>
                    <td style="text-align:right">{{ item.reorder_level }}</td>
                    <td style="text-align:right">{{ item.stock_value | phpCurrency }}</td>
                    <td style="text-align:center">
                      @if (item.current_stock === 0) {
                        <span class="stock-badge danger">Out of Stock</span>
                      } @else if (item.current_stock <= item.reorder_level) {
                        <span class="stock-badge warn">Low Stock</span>
                      } @else {
                        <span class="stock-badge ok">In Stock</span>
                      }
                    </td>
                  </tr>
                </ng-template>
              </p-table>
            </div>
          }
        }
      </p-tabpanel>

      <p-tabpanel value="best-selling" header="Best Selling">
        <div class="report-controls">
          <p-select
            [(ngModel)]="bestSellingPeriod"
            [options]="periodOptions"
            optionLabel="label"
            optionValue="value"
            (onChange)="onBestSellingPeriodChange()"
          />
          <div class="date-nav">
            <p-button icon="pi pi-chevron-left" [text]="true" [rounded]="true" severity="secondary" (onClick)="navigateDate('bestSelling', -1)" />
            <span class="date-label">{{ formatPeriodLabel(bestSellingDate, bestSellingPeriod) }}</span>
            <p-button icon="pi pi-chevron-right" [text]="true" [rounded]="true" severity="secondary" (onClick)="navigateDate('bestSelling', 1)" [disabled]="isCurrentPeriod(bestSellingDate, bestSellingPeriod)" />
          </div>
          @if (isCurrentPeriod(bestSellingDate, bestSellingPeriod)) {
            <span class="current-badge">Current</span>
          }
        </div>

        @if (bestSellingLoading()) {
          <div style="display:flex;justify-content:center;padding:3rem;">
            <p-progressSpinner strokeWidth="3" styleClass="w-3rem h-3rem" />
          </div>
        } @else if (bestSelling().length === 0) {
          <div class="empty-state">
            <i class="pi pi-trophy"></i>
            <p>No sales data for this period</p>
          </div>
        } @else {
          <div class="card">
            <p-chart type="bar" [data]="bestSellingChartData()!" [options]="horizontalChartOptions" height="300px" />
          </div>
          <div class="card" style="margin-top: 1rem">
            <p-table [value]="bestSelling()" dataKey="product_id">
              <ng-template pTemplate="header">
                <tr>
                  <th style="width:3rem">#</th><th>Product</th><th style="text-align:right">Qty Sold</th><th style="text-align:right">Revenue</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-item let-i="rowIndex">
                <tr>
                  <td>{{ i + 1 }}</td>
                  <td class="font-medium">{{ item.name }}</td>
                  <td style="text-align:right">{{ item.total_quantity }}</td>
                  <td style="text-align:right">{{ item.total_revenue | phpCurrency }}</td>
                </tr>
              </ng-template>
            </p-table>
          </div>
        }
      </p-tabpanel>

      <p-tabpanel value="profit" header="Profit">
        <div class="report-controls">
          <p-select
            [(ngModel)]="profitPeriod"
            [options]="periodOptions"
            optionLabel="label"
            optionValue="value"
            (onChange)="onProfitPeriodChange()"
          />
          <div class="date-nav">
            <p-button icon="pi pi-chevron-left" [text]="true" [rounded]="true" severity="secondary" (onClick)="navigateDate('profit', -1)" />
            <span class="date-label">{{ formatDateRange(profitReport()?.start_date, profitReport()?.end_date, profitPeriod) }}</span>
            <p-button icon="pi pi-chevron-right" [text]="true" [rounded]="true" severity="secondary" (onClick)="navigateDate('profit', 1)" [disabled]="isCurrentPeriod(profitDate, profitPeriod)" />
          </div>
          @if (isCurrentPeriod(profitDate, profitPeriod)) {
            <span class="current-badge">Current</span>
          }
        </div>

        @if (profitLoading()) {
          <div class="stats-grid">
            @for (_ of [1,2,3,4]; track _) {
              <div class="stat-card"><p-skeleton height="3.5rem" /></div>
            }
          </div>
        } @else if (profitReport()) {
          <div class="stats-grid">
            <div class="stat-card">
              <span class="stat-label">Revenue</span>
              <span class="stat-value">{{ profitReport()!.total_revenue | phpCurrency }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Cost</span>
              <span class="stat-value">{{ profitReport()!.total_cost | phpCurrency }}</span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Gross Profit</span>
              <span class="stat-value" [class.success]="profitReport()!.gross_profit >= 0" [class.danger]="profitReport()!.gross_profit < 0">
                {{ profitReport()!.gross_profit | phpCurrency }}
              </span>
            </div>
            <div class="stat-card">
              <span class="stat-label">Margin</span>
              <span class="stat-value" [class.success]="profitReport()!.profit_margin >= 0" [class.danger]="profitReport()!.profit_margin < 0">
                {{ profitReport()!.profit_margin | number:'1.1-1' }}%
              </span>
            </div>
          </div>

          @if (profitReport()!.total_revenue === 0) {
            <div class="empty-state">
              <i class="pi pi-wallet"></i>
              <p>No profit data for this period</p>
            </div>
          }
        }
      </p-tabpanel>
    </p-tabs>
  `,
  styles: `
    .report-controls {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding-top: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }
    .date-nav {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .date-label {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--text-primary);
      min-width: 10rem;
      text-align: center;
    }
    .current-badge {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-success);
      background: color-mix(in srgb, var(--color-success) 12%, transparent);
      padding: 0.2rem 0.6rem;
      border-radius: 1rem;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-top: 0.5rem;
    }
    .stat-card {
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }
    .stat-label {
      font-size: 0.8125rem;
      color: var(--text-secondary);
      font-weight: 500;
    }
    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
      &.success { color: var(--color-success); }
      &.danger { color: var(--color-danger); }
      &.warn { color: var(--color-warning); }
    }
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1rem;
      color: var(--text-secondary);
      i {
        font-size: 2.5rem;
        margin-bottom: 0.75rem;
        opacity: 0.4;
      }
      p {
        font-size: 0.9375rem;
        margin: 0;
      }
    }
    .stock-badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.2rem 0.6rem;
      border-radius: 1rem;
      white-space: nowrap;
      &.ok {
        color: var(--color-success);
        background: color-mix(in srgb, var(--color-success) 12%, transparent);
      }
      &.warn {
        color: var(--color-warning);
        background: color-mix(in srgb, var(--color-warning) 12%, transparent);
      }
      &.danger {
        color: var(--color-danger);
        background: color-mix(in srgb, var(--color-danger) 12%, transparent);
      }
    }
  `,
})
export class ReportsComponent implements OnInit {
  private http = inject(HttpClient);

  activeTab = 'sales';
  salesPeriod = 'daily';
  bestSellingPeriod = 'monthly';
  profitPeriod = 'daily';

  // Track which date each report is viewing
  salesDate = this.todayStr();
  bestSellingDate = this.todayStr();
  profitDate = this.todayStr();

  periodOptions = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
  ];

  salesReport = signal<SalesReport | null>(null);
  inventoryReport = signal<InventoryReport | null>(null);
  bestSelling = signal<BestSellingItem[]>([]);
  profitReport = signal<ProfitReport | null>(null);
  salesChartData = signal<any>(null);
  bestSellingChartData = signal<any>(null);

  salesLoading = signal(false);
  inventoryLoading = signal(false);
  bestSellingLoading = signal(false);
  profitLoading = signal(false);

  chartOptions = {
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { callback: (v: number) => '₱' + v.toLocaleString() } },
    },
  };

  horizontalChartOptions = {
    indexAxis: 'y' as const,
    plugins: { legend: { display: false } },
    scales: { x: { beginAtZero: true } },
  };

  ngOnInit() {
    this.loadSalesReport();
    this.loadInventoryReport();
    this.loadBestSelling();
    this.loadProfitReport();
  }

  // --- Date helpers ---

  private todayStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  /** Navigate a report's date by offset based on its period */
  navigateDate(report: 'sales' | 'bestSelling' | 'profit', direction: number) {
    const dateKey = report + 'Date' as 'salesDate' | 'bestSellingDate' | 'profitDate';
    const periodKey = report + 'Period' as 'salesPeriod' | 'bestSellingPeriod' | 'profitPeriod';
    const period = this[periodKey];
    const current = new Date(this[dateKey] + 'T00:00:00');

    if (period === 'daily') {
      current.setDate(current.getDate() + direction);
    } else if (period === 'weekly') {
      current.setDate(current.getDate() + direction * 7);
    } else if (period === 'monthly') {
      current.setMonth(current.getMonth() + direction);
    }

    // Don't go into the future
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (current > today) return;

    const newDate = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
    this[dateKey] = newDate;

    if (report === 'sales') this.loadSalesReport();
    else if (report === 'bestSelling') this.loadBestSelling();
    else if (report === 'profit') this.loadProfitReport();
  }

  /** Check if a date falls within the current period */
  isCurrentPeriod(dateStr: string, period: string): boolean {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();

    if (period === 'daily') {
      return d.toDateString() === today.toDateString();
    } else if (period === 'weekly') {
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      return d >= startOfWeek && d <= endOfWeek;
    } else {
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    }
  }

  /** Format a date range from API response for display */
  formatDateRange(startDate?: string, endDate?: string, period?: string): string {
    if (!startDate || !endDate) return '...';

    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    if (period === 'daily') {
      return `${fullMonths[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()}`;
    } else if (period === 'monthly') {
      return `${fullMonths[start.getMonth()]} ${start.getFullYear()}`;
    } else {
      // weekly
      if (start.getMonth() === end.getMonth()) {
        return `${months[start.getMonth()]} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
      }
      return `${months[start.getMonth()]} ${start.getDate()} - ${months[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
    }
  }

  /** Format period label from the local date (used before API returns) */
  formatPeriodLabel(dateStr: string, period: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (period === 'daily') {
      return `${fullMonths[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    } else if (period === 'monthly') {
      return `${fullMonths[d.getMonth()]} ${d.getFullYear()}`;
    } else {
      const startOfWeek = new Date(d);
      startOfWeek.setDate(d.getDate() - d.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
        return `${months[startOfWeek.getMonth()]} ${startOfWeek.getDate()} - ${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
      }
      return `${months[startOfWeek.getMonth()]} ${startOfWeek.getDate()} - ${months[endOfWeek.getMonth()]} ${endOfWeek.getDate()}, ${endOfWeek.getFullYear()}`;
    }
  }

  // --- Period change handlers (reset date to today) ---

  onSalesPeriodChange() {
    this.salesDate = this.todayStr();
    this.loadSalesReport();
  }

  onBestSellingPeriodChange() {
    this.bestSellingDate = this.todayStr();
    this.loadBestSelling();
  }

  onProfitPeriodChange() {
    this.profitDate = this.todayStr();
    this.loadProfitReport();
  }

  // --- Data loading ---

  loadSalesReport() {
    this.salesLoading.set(true);
    this.http.get<SalesReport>(`${environment.apiUrl}/reports/sales`, {
      params: { period: this.salesPeriod, date: this.salesDate },
    }).subscribe({
      next: (r) => {
        this.salesReport.set(r);
        if (r.daily_breakdown?.length) {
          this.salesChartData.set({
            labels: r.daily_breakdown.map((d: DailySales) => {
              const dt = new Date(d.date);
              return `${dt.getMonth() + 1}/${dt.getDate()}`;
            }),
            datasets: [{
              label: 'Sales',
              data: r.daily_breakdown.map((d: DailySales) => d.total_sales),
              backgroundColor: '#6366f1',
              borderRadius: 4,
            }],
          });
        } else {
          this.salesChartData.set(null);
        }
        this.salesLoading.set(false);
      },
      error: () => this.salesLoading.set(false),
    });
  }

  loadInventoryReport() {
    this.inventoryLoading.set(true);
    this.http.get<InventoryReport>(`${environment.apiUrl}/reports/inventory`).subscribe({
      next: (r) => {
        this.inventoryReport.set(r);
        this.inventoryLoading.set(false);
      },
      error: () => this.inventoryLoading.set(false),
    });
  }

  loadBestSelling() {
    this.bestSellingLoading.set(true);
    this.http.get<BestSellingItem[]>(`${environment.apiUrl}/reports/best-selling`, {
      params: { period: this.bestSellingPeriod, date: this.bestSellingDate },
    }).subscribe({
      next: (items) => {
        this.bestSelling.set(items);
        if (items.length) {
          this.bestSellingChartData.set({
            labels: items.map((i) => i.name),
            datasets: [{
              label: 'Quantity Sold',
              data: items.map((i) => i.total_quantity),
              backgroundColor: '#6366f1',
              borderRadius: 4,
            }],
          });
        } else {
          this.bestSellingChartData.set(null);
        }
        this.bestSellingLoading.set(false);
      },
      error: () => this.bestSellingLoading.set(false),
    });
  }

  loadProfitReport() {
    this.profitLoading.set(true);
    this.http.get<ProfitReport>(`${environment.apiUrl}/reports/profit`, {
      params: { period: this.profitPeriod, date: this.profitDate },
    }).subscribe({
      next: (r) => {
        this.profitReport.set(r);
        this.profitLoading.set(false);
      },
      error: () => this.profitLoading.set(false),
    });
  }
}
