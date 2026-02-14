import { Component, inject, signal, OnInit, computed, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ButtonGroupModule } from 'primeng/buttongroup';
import { environment } from '../../../environments/environment';
import { Product, CreateProductDto, UpdateProductDto } from '../../core/models/product.model';
import { Category } from '../../core/models/category.model';
import { ToastService } from '../../core/services/toast.service';
import { StoreContextService } from '../../core/services/store-context.service';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { ProductSearchComponent } from './components/product-search/product-search';
import { ProductCardComponent } from './components/product-card/product-card';
import { ProductTableComponent } from './components/product-table/product-table';
import { CategoryFilterComponent } from './components/category-filter/category-filter';
import { ProductFormDialogComponent } from './components/product-form-dialog/product-form-dialog';

const CATEGORY_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f97316',
  '#10b981', '#06b6d4', '#6366f1', '#ef4444',
];

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    ButtonGroupModule,
    ConfirmDialogModule,
    PageHeader,
    ProductSearchComponent,
    ProductCardComponent,
    ProductTableComponent,
    CategoryFilterComponent,
    ProductFormDialogComponent,
  ],
  templateUrl: './product-list.html',
  styleUrls: ['./product-list.scss'],
})
export class ProductListComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private confirmService = inject(ConfirmationService);
  storeCtx = inject(StoreContextService);

  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(false);
  saving = signal(false);
  dialogVisible = false;
  editMode = false;
  editId = '';

  // View mode and filtering
  viewMode = signal<'table' | 'cards'>('table');
  selectedCategoryId = signal<string | null>(null);
  selectedProduct = signal<Product | null>(null);
  searchQuery = signal<string>('');

  // Computed filtered products
  filteredProducts = computed(() => {
    const categoryId = this.selectedCategoryId();
    const query = this.searchQuery().toLowerCase().trim();
    let filtered = this.products();

    // Filter by category
    if (categoryId) {
      filtered = filtered.filter((p) => p.category_id === categoryId);
    }

    // Filter by search query
    if (query.length >= 2) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        (p.barcode && p.barcode.toLowerCase().includes(query))
      );
    }

    return filtered;
  });

  form: CreateProductDto & { barcode?: string; description?: string } = this.emptyForm();

  // Keyboard shortcuts
  @HostListener('document:keydown.f2', ['$event'])
  onF2(event: Event) {
    event.preventDefault();
    const input = document.querySelector<HTMLInputElement>('.product-search-input');
    input?.focus();
  }

  @HostListener('document:keydown.control.n', ['$event'])
  onCtrlN(event: Event) {
    if (this.storeCtx.isAdmin()) {
      event.preventDefault();
      this.openNew();
    }
  }

  ngOnInit() {
    this.loadProducts();
    this.loadCategories();
  }

  loadProducts() {
    this.loading.set(true);
    this.http.get<Product[]>(`${environment.apiUrl}/products`).subscribe({
      next: (p) => { this.products.set(p); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  loadCategories() {
    this.http.get<Category[]>(`${environment.apiUrl}/categories`).subscribe(
      (c) => this.categories.set(c)
    );
  }

  toggleView(mode: 'table' | 'cards') {
    this.viewMode.set(mode);
  }

  onCategoryChange(categoryId: string | null) {
    this.selectedCategoryId.set(categoryId);
  }

  onSearchQueryChange(query: string) {
    this.searchQuery.set(query);
  }

  onProductSelected(product: Product) {
    this.selectedProduct.set(product);
    // Highlight the product in the current view
    setTimeout(() => {
      const element = document.querySelector(`[data-product-id="${product.id}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }

  getCategoryColor(product: Product): string {
    const name = product.category?.name || product.category_id || '';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
  }

  openNew() {
    this.form = this.emptyForm();
    this.editMode = false;
    this.dialogVisible = true;
  }

  editProduct(product: Product) {
    this.form = {
      name: product.name,
      sku: product.sku,
      barcode: product.barcode ?? undefined,
      category_id: product.category_id,
      description: product.description ?? undefined,
      retail_price: product.retail_price,
      cost_price: product.cost_price,
      unit: product.unit,
      reorder_level: product.reorder_level,
    };
    this.editId = product.id;
    this.editMode = true;
    this.dialogVisible = true;
  }

  saveProduct() {
    this.saving.set(true);
    const obs = this.editMode
      ? this.http.patch<Product>(`${environment.apiUrl}/products/${this.editId}`, this.form)
      : this.http.post<Product>(`${environment.apiUrl}/products`, this.form);

    obs.subscribe({
      next: () => {
        this.toast.success(this.editMode ? 'Product updated' : 'Product created');
        this.dialogVisible = false;
        this.saving.set(false);
        this.loadProducts();
      },
      error: () => this.saving.set(false),
    });
  }

  confirmDelete(product: Product) {
    this.confirmService.confirm({
      message: `Delete "${product.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.http.delete(`${environment.apiUrl}/products/${product.id}`).subscribe({
          next: () => {
            this.toast.success('Product deleted');
            this.loadProducts();
          },
        });
      },
    });
  }

  private emptyForm(): CreateProductDto & { barcode?: string; description?: string } {
    return {
      name: '', sku: '', barcode: '', category_id: '', description: '',
      retail_price: 0, cost_price: 0, unit: 'pcs', reorder_level: 0,
    };
  }
}
