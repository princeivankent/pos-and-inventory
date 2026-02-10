import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { environment } from '../../../environments/environment';
import { Product, CreateProductDto, UpdateProductDto } from '../../core/models/product.model';
import { Category } from '../../core/models/category.model';
import { ToastService } from '../../core/services/toast.service';
import { StoreContextService } from '../../core/services/store-context.service';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { PhpCurrencyPipe } from '../../shared/pipes/php-currency.pipe';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    FormsModule, TableModule, ButtonModule, InputTextModule, DialogModule,
    SelectModule, InputNumberModule, CheckboxModule, ConfirmDialogModule,
    IconFieldModule, InputIconModule, PageHeader, PhpCurrencyPipe, StatusBadge,
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

  form: CreateProductDto & { barcode?: string; description?: string } = this.emptyForm();

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
