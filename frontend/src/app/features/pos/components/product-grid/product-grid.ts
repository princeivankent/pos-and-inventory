import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Product } from '../../../../core/models/product.model';
import { PhpCurrencyPipe } from '../../../../shared/pipes/php-currency.pipe';

@Component({
  selector: 'app-product-grid',
  standalone: true,
  imports: [PhpCurrencyPipe],
  templateUrl: './product-grid.html',
  styleUrls: ['./product-grid.scss'],
})
export class ProductGridComponent {
  @Input() products: Product[] = [];
  @Output() productSelected = new EventEmitter<Product>();

  onSelect(product: Product) {
    this.productSelected.emit(product);
  }
}
