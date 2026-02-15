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
import { SubscriptionService } from '../../core/services/subscription.service';
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
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  storeCtx = inject(StoreContextService);
  private subscriptionService = inject(SubscriptionService);

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
  lowStockLoading = signal(true);
  productsLoading = signal(true);
  topSellingLoading = signal(true);
  profitLoading = signal(true);
  inventoryLoading = signal(true);

  // Subscription feature check
  hasReportsFeature = this.subscriptionService.hasFeatureSignal('reports');

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
    const hasReports = this.subscriptionService.hasFeature('reports');

    // Daily sales stats (requires reports feature)
    if (hasReports) {
      this.http
        .get<SalesReport>(`${api}/reports/sales`, { params: { period: 'daily' } })
        .subscribe({
          next: (r) => this.salesReport.set(r),
          error: () => this.statsLoading.set(false),
          complete: () => this.statsLoading.set(false),
        });
    } else {
      this.statsLoading.set(false);
    }

    // Weekly chart (requires reports feature)
    if (hasReports) {
      this.http
        .get<SalesReport>(`${api}/reports/sales`, { params: { period: 'weekly' } })
        .subscribe({
          next: (r) => {
            this.weeklySalesReport.set(r);
            this.buildChartData(r);
          },
          error: () => {
            this.buildChartData(null);
            this.chartLoading.set(false);
          },
          complete: () => this.chartLoading.set(false),
        });
    } else {
      this.chartLoading.set(false);
    }

    // Recent sales (always available)
    this.http.get<Sale[]>(`${api}/sales/daily`).subscribe({
      next: (sales) => this.recentSales.set(sales.slice(0, 5)),
      error: () => {},
      complete: () => this.salesLoading.set(false),
    });

    // Low stock (always available)
    this.http.get<Product[]>(`${api}/inventory/low-stock`).subscribe({
      next: (products) => this.lowStockProducts.set(products),
      error: () => {},
      complete: () => this.lowStockLoading.set(false),
    });

    // Active products count (always available)
    this.http.get<Product[]>(`${api}/products`).subscribe({
      next: (products) => {
        const activeCount = products.filter((p) => p.is_active).length;
        this.totalProducts.set(activeCount);
      },
      error: () => {},
      complete: () => this.productsLoading.set(false),
    });

    // CONDITIONAL: Admin-only + Reports feature
    if (this.storeCtx.isAdmin() && hasReports) {
      // Best selling products
      this.http
        .get<BestSellingItem[]>(`${api}/reports/best-selling`, {
          params: { period: 'monthly', limit: '5' },
        })
        .subscribe({
          next: (items) => this.topSellingProducts.set(items),
          error: () => {},
          complete: () => this.topSellingLoading.set(false),
        });

      // Profit report
      this.http
        .get<ProfitReport>(`${api}/reports/profit`, { params: { period: 'daily' } })
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
    } else {
      // Skip API calls, set loading to false immediately
      this.topSellingLoading.set(false);
      this.profitLoading.set(false);
      this.inventoryLoading.set(false);
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
