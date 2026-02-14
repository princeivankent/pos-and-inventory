import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Product } from '../../../../core/models/product.model';
import { PhpCurrencyPipe } from '../../../../shared/pipes/php-currency.pipe';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [ButtonModule, PhpCurrencyPipe],
  templateUrl: './product-card.html',
  styleUrls: ['./product-card.scss'],
})
export class ProductCardComponent {
  @Input() product!: Product;
  @Input() categoryColor: string = '#3b82f6';
  @Input() showActions: boolean = true;
  @Output() edit = new EventEmitter<Product>();
  @Output() delete = new EventEmitter<Product>();

  onEdit() {
    this.edit.emit(this.product);
  }

  onDelete() {
    this.delete.emit(this.product);
  }

  getInitial(): string {
    return this.product.name.charAt(0).toUpperCase();
  }

  getStockBadgeClass(): string {
    if (this.product.current_stock === 0) return 'stock-out';
    if (this.product.current_stock <= this.product.reorder_level) return 'stock-low';
    return 'stock-good';
  }

  getMarginPercent(): number {
    if (this.product.cost_price === 0) return 0;
    return Math.round(((this.product.retail_price - this.product.cost_price) / this.product.cost_price) * 100);
  }

  getMarginClass(): string {
    const margin = this.getMarginPercent();
    if (margin < 10) return 'margin-low';
    if (margin < 30) return 'margin-medium';
    return 'margin-good';
  }
}
