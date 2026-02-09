import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { Product } from '../../core/models/product.model';
import { ToastService } from '../../core/services/toast.service';
import { StoreContextService } from '../../core/services/store-context.service';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { PhpCurrencyPipe } from '../../shared/pipes/php-currency.pipe';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-inventory-overview',
  standalone: true,
  imports: [
    RouterLink, TableModule, ButtonModule, DialogModule, InputNumberModule,
    InputTextModule, SelectModule, FormsModule, PageHeader, PhpCurrencyPipe, StatusBadge,
  ],
  template: `
    <app-page-header title="Inventory" subtitle="Stock levels and management">
      @if (storeCtx.isAdmin()) {
        <p-button label="Stock In" icon="pi pi-plus" (onClick)="openStockIn()" />
      }
      <a routerLink="/inventory/low-stock">
        <p-button label="Low Stock" icon="pi pi-exclamation-triangle" severity="warn" [outlined]="true" />
      </a>
      <a routerLink="/inventory/movements">
        <p-button label="Movements" icon="pi pi-history" severity="secondary" [outlined]="true" />
      </a>
    </app-page-header>

    <div class="card">
      <p-table
        [value]="products()"
        [paginator]="true"
        [rows]="20"
        [loading]="loading()"
        dataKey="id"
        [sortField]="'name'"
        [sortOrder]="1"
      >
        <ng-template pTemplate="header">
          <tr>
            <th pSortableColumn="name">Product <p-sortIcon field="name" /></th>
            <th>SKU</th>
            <th pSortableColumn="current_stock" style="text-align:right">Stock <p-sortIcon field="current_stock" /></th>
            <th style="text-align:right">Cost Value</th>
            <th style="text-align:right">Retail Value</th>
            <th>Status</th>
            @if (storeCtx.isAdmin()) {
              <th style="width:80px">Adjust</th>
            }
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-p>
          <tr>
            <td class="font-medium">{{ p.name }}</td>
            <td>{{ p.sku }}</td>
            <td style="text-align:right">{{ p.current_stock }} {{ p.unit }}</td>
            <td style="text-align:right">{{ p.current_stock * p.cost_price | phpCurrency }}</td>
            <td style="text-align:right">{{ p.current_stock * p.retail_price | phpCurrency }}</td>
            <td>
              @if (p.current_stock <= 0) {
                <app-status-badge label="Out of Stock" severity="danger" />
              } @else if (p.current_stock <= p.reorder_level) {
                <app-status-badge label="Low Stock" severity="warn" />
              } @else {
                <app-status-badge label="In Stock" severity="success" />
              }
            </td>
            @if (storeCtx.isAdmin()) {
              <td>
                <p-button icon="pi pi-sliders-h" [rounded]="true" [text]="true" (onClick)="openAdjust(p)" />
              </td>
            }
          </tr>
        </ng-template>
      </p-table>
    </div>

    <!-- Stock In Dialog -->
    <p-dialog
      [(visible)]="stockInVisible"
      header="Stock In"
      [modal]="true"
      [style]="{ width: '440px' }"
    >
      <div class="form-grid">
        <div class="field">
          <label>Product</label>
          <p-select
            [(ngModel)]="stockInForm.product_id"
            [options]="products()"
            optionLabel="name"
            optionValue="id"
            placeholder="Select a product"
            styleClass="w-full"
            [filter]="true"
            appendTo="body"
          />
        </div>
        <div class="field">
          <label>Quantity</label>
          <p-inputNumber [(ngModel)]="stockInForm.quantity" [min]="1" styleClass="w-full" />
        </div>
        <div class="field">
          <label>Unit Cost (optional)</label>
          <p-inputNumber [(ngModel)]="stockInForm.unit_cost" [min]="0" [minFractionDigits]="2" [maxFractionDigits]="2" styleClass="w-full" placeholder="Leave blank to use product cost price" />
        </div>
        <div class="field">
          <label>Notes</label>
          <input pInputText [(ngModel)]="stockInForm.notes" class="w-full" placeholder="e.g. Purchase from supplier" />
        </div>
      </div>

      <ng-template pTemplate="footer">
        <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="stockInVisible = false" />
        <p-button label="Stock In" icon="pi pi-plus" (onClick)="applyStockIn()" [loading]="saving()" />
      </ng-template>
    </p-dialog>

    <!-- Stock Out / Adjustment Dialog -->
    <p-dialog
      [(visible)]="adjustVisible"
      header="Stock Adjustment"
      [modal]="true"
      [style]="{ width: '400px' }"
    >
      @if (adjustProduct) {
        <div class="form-grid">
          <p class="text-secondary text-sm">Adjusting: <strong>{{ adjustProduct.name }}</strong> (Current: {{ adjustProduct.current_stock }} {{ adjustProduct.unit }})</p>
          <div class="field">
            <label>Type</label>
            <p-select
              [(ngModel)]="adjustForm.type"
              [options]="adjustTypes"
              optionLabel="label"
              optionValue="value"
              styleClass="w-full"
              appendTo="body"
            />
          </div>
          <div class="field">
            <label>Quantity</label>
            <p-inputNumber [(ngModel)]="adjustForm.quantity" [min]="1" [max]="adjustProduct.current_stock" styleClass="w-full" />
          </div>
          <div class="field">
            <label>Notes</label>
            <input pInputText [(ngModel)]="adjustForm.notes" class="w-full" placeholder="Reason for adjustment" />
          </div>
        </div>
      }

      <ng-template pTemplate="footer">
        <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="adjustVisible = false" />
        <p-button label="Apply" icon="pi pi-check" severity="danger" (onClick)="applyAdjustment()" [loading]="saving()" />
      </ng-template>
    </p-dialog>
  `,
  styles: `
    .form-grid { display: flex; flex-direction: column; gap: 1rem; }
    .field { display: flex; flex-direction: column; gap: 0.375rem; label { font-size: 0.875rem; font-weight: 500; } }
    .w-full { width: 100%; }
  `,
})
export class InventoryOverviewComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  storeCtx = inject(StoreContextService);

  products = signal<Product[]>([]);
  loading = signal(false);
  saving = signal(false);

  // Stock In dialog
  stockInVisible = false;
  stockInForm = { product_id: '', quantity: 1, unit_cost: null as number | null, notes: '' };

  // Stock Out / Adjust dialog
  adjustVisible = false;
  adjustProduct: Product | null = null;
  adjustForm = { type: 'stock_out' as 'stock_in' | 'stock_out', quantity: 1, notes: '' };

  adjustTypes = [
    { label: 'Stock Out (Remove)', value: 'stock_out' },
  ];

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.loading.set(true);
    this.http.get<Product[]>(`${environment.apiUrl}/products`).subscribe({
      next: (p) => { this.products.set(p); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openStockIn(product?: Product) {
    this.stockInForm = {
      product_id: product?.id ?? '',
      quantity: 1,
      unit_cost: null,
      notes: '',
    };
    this.stockInVisible = true;
  }

  applyStockIn() {
    if (!this.stockInForm.product_id) {
      this.toast.error('Please select a product');
      return;
    }
    this.saving.set(true);
    const payload: any = {
      product_id: this.stockInForm.product_id,
      type: 'stock_in',
      quantity: this.stockInForm.quantity,
      notes: this.stockInForm.notes,
    };
    if (this.stockInForm.unit_cost != null) {
      payload.unit_cost = this.stockInForm.unit_cost;
    }
    this.http.post(`${environment.apiUrl}/inventory/adjust`, payload).subscribe({
      next: () => {
        this.toast.success('Stock added successfully');
        this.stockInVisible = false;
        this.saving.set(false);
        this.loadProducts();
      },
      error: () => this.saving.set(false),
    });
  }

  openAdjust(product: Product) {
    this.adjustProduct = product;
    this.adjustForm = { type: 'stock_out', quantity: 1, notes: '' };
    this.adjustVisible = true;
  }

  applyAdjustment() {
    if (!this.adjustProduct) return;
    this.saving.set(true);
    this.http.post(`${environment.apiUrl}/inventory/adjust`, {
      product_id: this.adjustProduct.id,
      type: this.adjustForm.type,
      quantity: this.adjustForm.quantity,
      notes: this.adjustForm.notes,
    }).subscribe({
      next: () => {
        this.toast.success('Stock adjusted');
        this.adjustVisible = false;
        this.saving.set(false);
        this.loadProducts();
      },
      error: () => this.saving.set(false),
    });
  }
}
