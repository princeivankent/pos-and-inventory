import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { environment } from '../../../environments/environment';
import { Product } from '../../core/models/product.model';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-low-stock-alerts',
  standalone: true,
  imports: [RouterLink, TableModule, ButtonModule, PageHeader, StatusBadge],
  template: `
    <app-page-header title="Low Stock Alerts" subtitle="Products below reorder level">
      <a routerLink="/inventory">
        <p-button label="Back to Inventory" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" />
      </a>
    </app-page-header>

    <div class="card">
      <p-table
        [value]="products()"
        [loading]="loading()"
        dataKey="id"
        [sortField]="'current_stock'"
        [sortOrder]="1"
      >
        <ng-template pTemplate="header">
          <tr>
            <th pSortableColumn="name">Product <p-sortIcon field="name" /></th>
            <th>SKU</th>
            <th pSortableColumn="current_stock" style="text-align:right">Current Stock <p-sortIcon field="current_stock" /></th>
            <th style="text-align:right">Reorder Level</th>
            <th>Status</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-p>
          <tr>
            <td class="font-medium">{{ p.name }}</td>
            <td>{{ p.sku }}</td>
            <td style="text-align:right">{{ p.current_stock }} {{ p.unit }}</td>
            <td style="text-align:right">{{ p.reorder_level }} {{ p.unit }}</td>
            <td>
              @if (p.current_stock <= 0) {
                <app-status-badge label="Out of Stock" severity="danger" />
              } @else {
                <app-status-badge label="Low Stock" severity="warn" />
              }
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr><td colspan="5" class="text-center text-secondary" style="padding:2rem">All products are well stocked!</td></tr>
        </ng-template>
      </p-table>
    </div>
  `,
})
export class LowStockAlertsComponent implements OnInit {
  private http = inject(HttpClient);

  products = signal<Product[]>([]);
  loading = signal(false);

  ngOnInit() {
    this.loading.set(true);
    this.http.get<Product[]>(`${environment.apiUrl}/inventory/low-stock`).subscribe({
      next: (p) => { this.products.set(p); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
