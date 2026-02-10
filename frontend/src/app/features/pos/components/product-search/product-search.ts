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
  templateUrl: './product-search.html',
  styleUrls: ['./product-search.scss'],
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
