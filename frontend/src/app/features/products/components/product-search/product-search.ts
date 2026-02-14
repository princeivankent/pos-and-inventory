import { Component, inject, Output, EventEmitter, model, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AutoCompleteModule, AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { Product } from '../../../../core/models/product.model';
import { PhpCurrencyPipe } from '../../../../shared/pipes/php-currency.pipe';

@Component({
  selector: 'app-product-search',
  standalone: true,
  imports: [FormsModule, AutoCompleteModule, IconFieldModule, InputIconModule, PhpCurrencyPipe],
  templateUrl: './product-search.html',
  styleUrls: ['./product-search.scss'],
})
export class ProductSearchComponent implements OnChanges {
  private http = inject(HttpClient);

  @Input() allProducts: Product[] = [];
  @Output() productSelected = new EventEmitter<Product>();
  @Output() searchQueryChange = new EventEmitter<string>();

  searchText = model<string>('');
  suggestions: Product[] = [];
  private searchTimeout: any;

  ngOnChanges(changes: SimpleChanges) {
    // When products change, update suggestions if there's an active search
    if (changes['allProducts'] && this.searchText()) {
      this.filterProducts(this.searchText());
    }
  }

  search(event: AutoCompleteCompleteEvent) {
    const query = event.query.trim();

    // Debounce the search query change emission
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.searchQueryChange.emit(query);
    }, 300);

    // Filter products client-side for autocomplete
    if (query.length < 1) {
      this.suggestions = [];
      return;
    }

    this.filterProducts(query);
  }

  private filterProducts(query: string) {
    const lowerQuery = query.toLowerCase();
    this.suggestions = this.allProducts
      .filter((p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.sku.toLowerCase().includes(lowerQuery) ||
        (p.barcode && p.barcode.toLowerCase().includes(lowerQuery))
      )
      .slice(0, 10); // Limit to top 10 suggestions
  }

  onSelect(event: AutoCompleteSelectEvent) {
    this.productSelected.emit(event.value as Product);
  }

  onClear() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchText.set('');
    this.searchQueryChange.emit('');
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
}
