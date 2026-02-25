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
import { Supplier } from '../../core/models/supplier.model';
import { SupplierService } from '../../core/services/supplier.service';
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
  templateUrl: './inventory-overview.html',
  styleUrls: ['./inventory-overview.scss'],
})
export class InventoryOverviewComponent implements OnInit {
  private http = inject(HttpClient);
  private supplierService = inject(SupplierService);
  private toast = inject(ToastService);
  storeCtx = inject(StoreContextService);

  products = signal<Product[]>([]);
  suppliers = signal<Supplier[]>([]);
  suppliersLoading = signal(false);
  loading = signal(false);
  saving = signal(false);

  // Stock In dialog
  stockInVisible = false;
  stockInForm = { product_id: '', quantity: 1, unit_cost: null as number | null, notes: '', supplier_id: null as string | null };

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
      supplier_id: null,
    };
    this.stockInVisible = true;
    this.loadSuppliers();
  }

  loadSuppliers() {
    this.suppliersLoading.set(true);
    this.supplierService.getAll().subscribe({
      next: (s) => { this.suppliers.set(s); this.suppliersLoading.set(false); },
      error: () => this.suppliersLoading.set(false),
    });
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
    if (this.stockInForm.supplier_id) {
      payload.supplier_id = this.stockInForm.supplier_id;
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
