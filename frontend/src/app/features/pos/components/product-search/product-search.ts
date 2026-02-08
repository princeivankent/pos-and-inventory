import { Component, inject, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AutoCompleteModule, AutoCompleteCompleteEvent, AutoCompleteSelectEvent } from 'primeng/autocomplete';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { Product } from '../../../../core/models/product.model';

@Component({
  selector: 'app-product-search',
  standalone: true,
  imports: [FormsModule, AutoCompleteModule],
  template: `
    <p-autocomplete
      [(ngModel)]="searchText"
      [suggestions]="suggestions"
      (completeMethod)="search($event)"
      (onSelect)="onSelect($event)"
      optionLabel="name"
      placeholder="Search products or scan barcode..."
      [minLength]="1"
      [delay]="300"
      styleClass="pos-search"
      inputStyleClass="pos-search-input"
      [showClear]="true"
    >
      <ng-template let-product pTemplate="item">
        <div class="search-item">
          <span class="search-item-name">{{ product.name }}</span>
          <span class="search-item-meta">
            {{ product.sku }} &middot; {{ product.current_stock }} {{ product.unit }}
          </span>
        </div>
      </ng-template>
    </p-autocomplete>
  `,
  styles: `
    :host { display: block; }
    :host ::ng-deep .pos-search { width: 100%; }
    :host ::ng-deep .pos-search-input {
      width: 100%;
      font-size: 1rem;
      padding: 0.75rem 1rem;
    }
    .search-item {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      padding: 0.25rem 0;
    }
    .search-item-name {
      font-weight: 500;
      font-size: 0.875rem;
    }
    .search-item-meta {
      font-size: 0.75rem;
      color: var(--text-secondary);
    }
  `,
})
export class ProductSearchComponent {
  private http = inject(HttpClient);

  @Output() productSelected = new EventEmitter<Product>();

  searchText: string | Product = '';
  suggestions: Product[] = [];

  search(event: AutoCompleteCompleteEvent) {
    this.http
      .get<Product[]>(`${environment.apiUrl}/products/search`, {
        params: { q: event.query },
      })
      .subscribe((products) => {
        this.suggestions = products;
      });
  }

  onSelect(event: AutoCompleteSelectEvent) {
    this.productSelected.emit(event.value as Product);
    this.searchText = '';
  }
}
