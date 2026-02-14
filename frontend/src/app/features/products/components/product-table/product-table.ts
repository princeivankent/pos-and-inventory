import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { Product } from '../../../../core/models/product.model';
import { PhpCurrencyPipe } from '../../../../shared/pipes/php-currency.pipe';
import { StatusBadge } from '../../../../shared/components/status-badge/status-badge';
import { StoreContextService } from '../../../../core/services/store-context.service';

@Component({
  selector: 'app-product-table',
  standalone: true,
  imports: [TableModule, ButtonModule, PhpCurrencyPipe, StatusBadge],
  templateUrl: './product-table.html',
  styleUrls: ['./product-table.scss'],
})
export class ProductTableComponent {
  storeCtx = inject(StoreContextService);

  @Input() products: Product[] = [];
  @Input() loading: boolean = false;
  @Output() edit = new EventEmitter<Product>();
  @Output() delete = new EventEmitter<Product>();

  onEdit(product: Product) {
    this.edit.emit(product);
  }

  onDelete(product: Product) {
    this.delete.emit(product);
  }

  getCategoryColor(product: Product): string {
    const CATEGORY_COLORS = [
      '#3b82f6', '#8b5cf6', '#ec4899', '#f97316',
      '#10b981', '#06b6d4', '#6366f1', '#ef4444',
    ];
    const name = product.category?.name || product.category_id || '';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
  }

  getStockBadgeClass(product: Product): string {
    if (product.current_stock === 0) return 'stock-out';
    if (product.current_stock <= product.reorder_level) return 'stock-low';
    return 'stock-good';
  }

  getMarginPercent(product: Product): number {
    if (product.cost_price === 0) return 0;
    return Math.round(((product.retail_price - product.cost_price) / product.cost_price) * 100);
  }

  getMarginClass(product: Product): string {
    const margin = this.getMarginPercent(product);
    if (margin < 10) return 'margin-low';
    if (margin < 30) return 'margin-medium';
    return 'margin-good';
  }
}
