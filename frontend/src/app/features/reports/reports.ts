import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TabsModule } from 'primeng/tabs';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { environment } from '../../../environments/environment';
import { SalesReport, InventoryReport, BestSellingItem, ProfitReport, DailySales, TrendMetadata } from '../../core/models/report.model';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { PhpCurrencyPipe } from '../../shared/pipes/php-currency.pipe';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [DecimalPipe, FormsModule, RouterLink, TabsModule, SelectModule, TableModule, ChartModule, ButtonModule, SkeletonModule, ProgressSpinnerModule, PageHeader, PhpCurrencyPipe],
  templateUrl: './reports.html',
  styleUrls: ['./reports.scss'],
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
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
        cornerRadius: 6,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { callback: (v: number) => '₱' + v.toLocaleString() },
      },
      x: {
        grid: { display: false },
      },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  };

  horizontalChartOptions = {
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 6,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
      },
      y: {
        grid: { display: false },
      },
    },
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
          // Create gradient chart with area fill
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          let gradient = null;
          if (ctx) {
            gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(99, 102, 241, 0.2)');
            gradient.addColorStop(1, 'rgba(99, 102, 241, 0.02)');
          }

          this.salesChartData.set({
            labels: r.daily_breakdown.map((d: DailySales) => {
              const dt = new Date(d.date);
              return `${dt.getMonth() + 1}/${dt.getDate()}`;
            }),
            datasets: [{
              label: 'Sales',
              data: r.daily_breakdown.map((d: DailySales) => d.total_sales),
              backgroundColor: gradient || 'rgba(99, 102, 241, 0.1)',
              borderColor: '#6366f1',
              borderWidth: 2,
              fill: true,
              tension: 0.4,
              pointRadius: 3,
              pointHoverRadius: 5,
              pointBackgroundColor: '#6366f1',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
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
          // Use distinct colors for top products (gold, silver, bronze theme)
          const colors = items.map((_, index) => {
            if (index === 0) return '#fbbf24'; // Gold
            if (index === 1) return '#9ca3af'; // Silver
            if (index === 2) return '#f97316'; // Bronze
            return '#6366f1'; // Default purple
          });

          this.bestSellingChartData.set({
            labels: items.map((i) => i.name),
            datasets: [{
              label: 'Quantity Sold',
              data: items.map((i) => i.total_quantity),
              backgroundColor: colors,
              borderRadius: 6,
              barThickness: 'flex',
              maxBarThickness: 40,
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

  // --- Trend helper methods ---

  /**
   * Get PrimeNG icon class based on trend direction
   */
  getTrendIcon(trend?: 'up' | 'down' | 'neutral'): string {
    if (!trend) return 'pi-minus';
    return trend === 'up'
      ? 'pi-arrow-up'
      : trend === 'down'
        ? 'pi-arrow-down'
        : 'pi-minus';
  }

  /**
   * Get CSS class for trend styling
   */
  getTrendClass(trend?: 'up' | 'down' | 'neutral'): string {
    if (!trend) return 'trend-neutral';
    return `trend-${trend}`;
  }

  /**
   * Format trend text with percentage and period
   */
  formatTrend(trendData?: TrendMetadata, period?: string): string {
    if (!trendData) return 'No comparison data';

    const periodText =
      period === 'daily' ? 'day' : period === 'weekly' ? 'week' : period === 'monthly' ? 'month' : 'period';

    const sign = trendData.change_percentage > 0 ? '+' : '';
    return `${sign}${trendData.change_percentage}% vs last ${periodText}`;
  }

  /**
   * Check if trend data exists
   */
  hasTrendData(trendData?: TrendMetadata): boolean {
    return !!trendData;
  }
}
