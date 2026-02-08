import { Component, inject, signal, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Product } from '../../core/models/product.model';
import { Sale } from '../../core/models/sale.model';
import { Store } from '../../core/models/store.model';
import { CartService } from './services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { StoreContextService } from '../../core/services/store-context.service';
import { ProductSearchComponent } from './components/product-search/product-search';
import { CategoryTabsComponent } from './components/category-tabs/category-tabs';
import { ProductGridComponent } from './components/product-grid/product-grid';
import { CartPanelComponent } from './components/cart-panel/cart-panel';
import { PaymentDialogComponent } from './components/payment-dialog/payment-dialog';
import { ReceiptPreviewComponent } from './components/receipt-preview/receipt-preview';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [
    ProductSearchComponent,
    CategoryTabsComponent,
    ProductGridComponent,
    CartPanelComponent,
    PaymentDialogComponent,
    ReceiptPreviewComponent,
  ],
  template: `
    <div class="pos-layout">
      <div class="pos-products">
        <app-product-search (productSelected)="addToCart($event)" />
        <app-category-tabs (categoryChanged)="onCategoryChange($event)" />
        <app-product-grid
          [products]="filteredProducts()"
          (productSelected)="addToCart($event)"
        />
      </div>
      <div class="pos-cart">
        <app-cart-panel (charge)="openPayment()" />
      </div>
    </div>

    <app-payment-dialog
      #paymentDialog
      [totalAmount]="cart.total()"
      [processing]="loading()"
      (completed)="completeSale($event)"
    />
    <app-receipt-preview
      #receiptPreview
      [sale]="lastSale()"
      [store]="currentStore()"
    />
  `,
  styles: `
    .pos-layout {
      display: flex;
      gap: 1rem;
      height: calc(100vh - var(--header-height) - 3rem);
    }
    .pos-products {
      flex: 3;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      overflow-y: auto;
    }
    .pos-cart {
      flex: 2;
      min-width: 320px;
      max-width: 400px;
    }
    @media (max-width: 1024px) {
      .pos-layout {
        flex-direction: column;
        height: auto;
      }
      .pos-cart {
        max-width: none;
        min-height: 300px;
      }
    }
  `,
})
export class PosComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private storeContext = inject(StoreContextService);
  cart = inject(CartService);

  @ViewChild('paymentDialog') paymentDialog!: PaymentDialogComponent;
  @ViewChild('receiptPreview') receiptPreview!: ReceiptPreviewComponent;

  products = signal<Product[]>([]);
  selectedCategory = signal<string | null>(null);
  lastSale = signal<Sale | null>(null);
  currentStore = signal<Store | null>(null);
  loading = signal(false);

  filteredProducts = signal<Product[]>([]);

  ngOnInit() {
    this.loadProducts();
    this.loadStore();
    this.cart.clear();
  }

  loadProducts(categoryId?: string | null) {
    const params: Record<string, string> = {};
    if (categoryId) params['category_id'] = categoryId;

    this.http
      .get<Product[]>(`${environment.apiUrl}/products`, { params })
      .subscribe((products) => {
        this.products.set(products);
        this.filteredProducts.set(products.filter((p) => p.is_active));
      });
  }

  loadStore() {
    this.http
      .get<Store>(`${environment.apiUrl}/stores/${this.storeContext.storeId()}`)
      .subscribe((store) => {
        this.currentStore.set(store);
        if (store.settings?.tax_enabled !== undefined) {
          this.cart.taxEnabled.set(store.settings.tax_enabled);
        }
        if (store.settings?.tax_rate !== undefined) {
          this.cart.taxRate.set(store.settings.tax_rate / 100);
        }
      });
  }

  addToCart(product: Product) {
    this.cart.addItem(product);
  }

  onCategoryChange(categoryId: string | null) {
    this.selectedCategory.set(categoryId);
    this.loadProducts(categoryId);
  }

  openPayment() {
    this.paymentDialog.open();
  }

  completeSale(amountPaid: number) {
    const items = this.cart.items().map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));

    this.loading.set(true);

    this.http
      .post<Sale>(`${environment.apiUrl}/sales`, {
        items,
        amount_paid: amountPaid,
      })
      .subscribe({
        next: (sale) => {
          this.loading.set(false);
          this.paymentDialog.close();
          this.toast.success('Sale completed!', `#${sale.sale_number}`);
          this.lastSale.set(sale);
          this.cart.clear();
          this.loadProducts(this.selectedCategory());
          this.receiptPreview.open();
        },
        error: () => {
          this.loading.set(false);
          this.toast.error('Sale failed', 'Please try again');
        },
      });
  }
}
