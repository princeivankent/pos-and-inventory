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
  templateUrl: './movement-history.html',
  styleUrls: ['./movement-history.scss'],
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
