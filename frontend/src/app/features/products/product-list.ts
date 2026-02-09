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
  template: `
    <app-page-header title="Products" subtitle="Manage your product catalog">
      @if (storeCtx.isAdmin()) {
        <p-button label="Add Product" icon="pi pi-plus" (onClick)="openNew()" />
      }
    </app-page-header>

    <div class="card">
      <p-table
        [value]="products()"
        [paginator]="true"
        [rows]="15"
        [rowsPerPageOptions]="[15, 30, 50]"
        [globalFilterFields]="['name', 'sku', 'barcode']"
        [loading]="loading()"
        dataKey="id"
        [sortField]="'name'"
        [sortOrder]="1"
      >
        <ng-template pTemplate="header">
          <tr>
            <th pSortableColumn="name">Name <p-sortIcon field="name" /></th>
            <th pSortableColumn="sku">SKU <p-sortIcon field="sku" /></th>
            <th>Category</th>
            <th pSortableColumn="retail_price" style="text-align:right">Price <p-sortIcon field="retail_price" /></th>
            <th pSortableColumn="cost_price" style="text-align:right">Cost <p-sortIcon field="cost_price" /></th>
            <th pSortableColumn="current_stock" style="text-align:right">Stock <p-sortIcon field="current_stock" /></th>
            <th>Status</th>
            @if (storeCtx.isAdmin()) {
              <th style="width:100px">Actions</th>
            }
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-product>
          <tr>
            <td>
              <span class="font-medium">{{ product.name }}</span>
              @if (product.barcode) {
                <br><span class="text-xs text-secondary">{{ product.barcode }}</span>
              }
            </td>
            <td>{{ product.sku }}</td>
            <td>{{ product.category?.name ?? '-' }}</td>
            <td style="text-align:right">{{ product.retail_price | phpCurrency }}</td>
            <td style="text-align:right">{{ product.cost_price | phpCurrency }}</td>
            <td style="text-align:right" [class.text-danger]="product.current_stock <= product.reorder_level">
              {{ product.current_stock }} {{ product.unit }}
            </td>
            <td>
              <app-status-badge
                [label]="product.is_active ? 'Active' : 'Inactive'"
                [severity]="product.is_active ? 'success' : 'neutral'"
              />
            </td>
            @if (storeCtx.isAdmin()) {
              <td>
                <div class="flex gap-2">
                  <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="info" (onClick)="editProduct(product)" />
                  <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (onClick)="confirmDelete(product)" />
                </div>
              </td>
            }
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr><td [attr.colspan]="storeCtx.isAdmin() ? 8 : 7" class="text-center text-secondary" style="padding:2rem">No products found</td></tr>
        </ng-template>
      </p-table>
    </div>

    <!-- Product Form Dialog -->
    <p-dialog
      [(visible)]="dialogVisible"
      [header]="editMode ? 'Edit Product' : 'New Product'"
      [modal]="true"
      [style]="{ width: '500px' }"
    >
      <div class="form-grid">
        <div class="field">
          <label>Name *</label>
          <input pInputText [(ngModel)]="form.name" class="w-full" />
        </div>
        <div class="field-row">
          <div class="field">
            <label>SKU *</label>
            <input pInputText [(ngModel)]="form.sku" class="w-full" />
          </div>
          <div class="field">
            <label>Barcode</label>
            <input pInputText [(ngModel)]="form.barcode" class="w-full" />
          </div>
        </div>
        <div class="field">
          <label>Category *</label>
          <p-select
            [(ngModel)]="form.category_id"
            [options]="categories()"
            optionLabel="name"
            optionValue="id"
            placeholder="Select category"
            styleClass="w-full"
            appendTo="body"
          />
        </div>
        <div class="field">
          <label>Description</label>
          <input pInputText [(ngModel)]="form.description" class="w-full" />
        </div>
        <div class="field-row">
          <div class="field">
            <label>Retail Price *</label>
            <p-inputNumber [(ngModel)]="form.retail_price" mode="currency" currency="PHP" locale="en-PH" styleClass="w-full" />
          </div>
          <div class="field">
            <label>Cost Price *</label>
            <p-inputNumber [(ngModel)]="form.cost_price" mode="currency" currency="PHP" locale="en-PH" styleClass="w-full" />
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <label>Unit</label>
            <input pInputText [(ngModel)]="form.unit" class="w-full" placeholder="pcs" />
          </div>
          <div class="field">
            <label>Reorder Level</label>
            <p-inputNumber [(ngModel)]="form.reorder_level" [min]="0" styleClass="w-full" />
          </div>
        </div>
      </div>

      <ng-template pTemplate="footer">
        <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="dialogVisible = false" />
        <p-button
          [label]="editMode ? 'Update' : 'Create'"
          icon="pi pi-check"
          (onClick)="saveProduct()"
          [loading]="saving()"
          [disabled]="!form.name || !form.sku || !form.category_id"
        />
      </ng-template>
    </p-dialog>
  `,
  styles: `
    .text-danger { color: var(--color-danger); }
    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      flex: 1;
      label { font-size: 0.875rem; font-weight: 500; }
    }
    .field-row {
      display: flex;
      gap: 1rem;
    }
    .w-full { width: 100%; }
  `,
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
