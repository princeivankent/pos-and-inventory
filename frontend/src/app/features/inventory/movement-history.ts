import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { environment } from '../../../environments/environment';
import { StockMovement } from '../../core/models/inventory.model';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-movement-history',
  standalone: true,
  imports: [DatePipe, RouterLink, TableModule, ButtonModule, PageHeader, StatusBadge],
  template: `
    <app-page-header title="Stock Movements" subtitle="Track inventory changes">
      <a routerLink="/inventory">
        <p-button label="Back to Inventory" icon="pi pi-arrow-left" severity="secondary" [outlined]="true" />
      </a>
    </app-page-header>

    <div class="card">
      <p-table
        [value]="movements()"
        [paginator]="true"
        [rows]="20"
        [loading]="loading()"
        [lazy]="true"
        [totalRecords]="totalRecords()"
        (onLazyLoad)="onPageChange($event)"
        dataKey="id"
      >
        <ng-template pTemplate="header">
          <tr>
            <th>Date</th>
            <th>Product</th>
            <th>Type</th>
            <th style="text-align:right">Quantity</th>
            <th>Notes</th>
            <th>By</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-m>
          <tr>
            <td>{{ m.created_at | date:'MMM d, y h:mm a' }}</td>
            <td class="font-medium">{{ m.batch?.product?.name ?? 'N/A' }}</td>
            <td>
              <app-status-badge
                [label]="m.movement_type"
                [severity]="getTypeSeverity(m.movement_type)"
              />
            </td>
            <td style="text-align:right" [class.positive]="m.quantity > 0" [class.negative]="m.quantity < 0">
              {{ m.quantity > 0 ? '+' : '' }}{{ m.quantity }}
            </td>
            <td class="text-secondary text-sm">{{ m.notes ?? '-' }}</td>
            <td>{{ m.creator?.full_name ?? '-' }}</td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr><td colspan="6" class="text-center text-secondary" style="padding:2rem">No movements recorded</td></tr>
        </ng-template>
      </p-table>
    </div>
  `,
  styles: `
    .positive { color: var(--color-success); font-weight: 500; }
    .negative { color: var(--color-danger); font-weight: 500; }
  `,
})
export class MovementHistoryComponent implements OnInit {
  private http = inject(HttpClient);

  movements = signal<StockMovement[]>([]);
  loading = signal(false);
  totalRecords = signal(0);

  ngOnInit() {
    this.load(0, 20);
  }

  onPageChange(event: any) {
    this.load(event.first ?? 0, event.rows ?? 20);
  }

  load(offset: number, limit: number) {
    this.loading.set(true);
    this.http
      .get<{ data: StockMovement[]; total: number }>(`${environment.apiUrl}/inventory/movements`, {
        params: { offset: offset.toString(), limit: limit.toString() },
      })
      .subscribe({
        next: (res) => {
          this.movements.set(res.data);
          this.totalRecords.set(res.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  getTypeSeverity(type: string): 'success' | 'danger' | 'warn' | 'info' | 'neutral' {
    switch (type) {
      case 'purchase': return 'success';
      case 'sale': return 'info';
      case 'return': return 'warn';
      case 'adjustment': return 'neutral';
      case 'damaged': case 'expired': return 'danger';
      default: return 'neutral';
    }
  }
}
