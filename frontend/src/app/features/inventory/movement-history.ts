import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { StockMovement } from '../../core/models/inventory.model';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { SubscriptionService } from '../../core/services/subscription.service';
import { CsvExportService } from '../../core/services/csv-export.service';

interface TypeFilter {
  label: string;
  value: string | null;
}

@Component({
  selector: 'app-movement-history',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, FormsModule, TableModule, ButtonModule, PageHeader],
  templateUrl: './movement-history.html',
  styleUrls: ['./movement-history.scss'],
})
export class MovementHistoryComponent implements OnInit {
  private http = inject(HttpClient);
  private subscriptionService = inject(SubscriptionService);
  private csvExport = inject(CsvExportService);

  canExport = this.subscriptionService.hasFeatureSignal('export_data');

  movements = signal<StockMovement[]>([]);
  loading = signal(false);
  totalRecords = signal(0);

  activeTypeFilter: string | null = null;

  typeFilters: TypeFilter[] = [
    { label: 'All', value: null },
    { label: 'Purchase', value: 'purchase' },
    { label: 'Sale', value: 'sale' },
    { label: 'Return', value: 'return' },
    { label: 'Adjustment', value: 'adjustment' },
    { label: 'Damaged', value: 'damaged' },
    { label: 'Expired', value: 'expired' },
  ];

  ngOnInit() {
    this.load(0, 15);
  }

  onPageChange(event: any) {
    this.load(event.first ?? 0, event.rows ?? 15);
  }

  setTypeFilter(value: string | null) {
    this.activeTypeFilter = value;
    this.load(0, 15);
  }

  load(offset: number, limit: number) {
    this.loading.set(true);
    const params: Record<string, string> = {
      offset: offset.toString(),
      limit: limit.toString(),
    };
    if (this.activeTypeFilter) {
      params['movement_type'] = this.activeTypeFilter;
    }
    this.http
      .get<{ data: StockMovement[]; total: number }>(`${environment.apiUrl}/inventory/movements`, { params })
      .subscribe({
        next: (res) => {
          this.movements.set(res.data);
          this.totalRecords.set(res.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  // Exports the currently loaded page of movements (not all records — data is lazy-loaded)
  exportCsv() {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const typeStr = this.activeTypeFilter ?? 'all';
    this.csvExport.export(this.movements(), [
      { field: 'created_at', header: 'Date' },
      { field: 'batch.product.name', header: 'Product' },
      { field: 'batch.product.sku', header: 'SKU' },
      { field: 'movement_type', header: 'Type' },
      { field: 'quantity', header: 'Quantity' },
      { field: 'batch.supplier.name', header: 'Supplier' },
      { field: 'batch.batch_number', header: 'Batch #' },
      { field: 'notes', header: 'Notes' },
      { field: 'creator.full_name', header: 'Created By' },
    ], `stock-movements-${typeStr}-${dateStr}.csv`);
  }

  getTypeConfig(type: string): { label: string; cls: string } {
    switch (type) {
      case 'purchase':   return { label: 'Purchase',   cls: 'type-purchase' };
      case 'sale':       return { label: 'Sale',       cls: 'type-sale' };
      case 'return':     return { label: 'Return',     cls: 'type-return' };
      case 'adjustment': return { label: 'Adjustment', cls: 'type-adjustment' };
      case 'damaged':    return { label: 'Damaged',    cls: 'type-damaged' };
      case 'expired':    return { label: 'Expired',    cls: 'type-expired' };
      default:           return { label: type,         cls: 'type-adjustment' };
    }
  }
}
