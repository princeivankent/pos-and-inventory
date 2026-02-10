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
  templateUrl: './low-stock-alerts.html',
  styleUrls: ['./low-stock-alerts.scss'],
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
