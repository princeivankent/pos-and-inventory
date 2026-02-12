import { Component, inject, signal, OnInit, ViewChild, HostListener } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Product } from '../../core/models/product.model';
import { Sale } from '../../core/models/sale.model';
import { Store } from '../../core/models/store.model';
import { Customer } from '../../core/models/customer.model';
import { CartService } from './services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { StoreContextService } from '../../core/services/store-context.service';
import { ProductSearchComponent } from './components/product-search/product-search';
import { CategoryTabsComponent } from './components/category-tabs/category-tabs';
import { ProductGridComponent } from './components/product-grid/product-grid';
import { CartPanelComponent } from './components/cart-panel/cart-panel';
import { PaymentDialogComponent } from './components/payment-dialog/payment-dialog';
import { ReceiptPreviewComponent } from './components/receipt-preview/receipt-preview';
import { CustomerSearchDialogComponent } from './components/customer-search-dialog/customer-search-dialog';
import { DiscountDialogComponent } from './components/discount-dialog/discount-dialog';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [
    ButtonModule,
    ProductSearchComponent,
    CategoryTabsComponent,
    ProductGridComponent,
    CartPanelComponent,
    PaymentDialogComponent,
    ReceiptPreviewComponent,
    CustomerSearchDialogComponent,
    DiscountDialogComponent,
  ],
  templateUrl: './pos.html',
  styleUrls: ['./pos.scss'],
})
export class PosComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private storeContext = inject(StoreContextService);
  cart = inject(CartService);

  @ViewChild('paymentDialog') paymentDialog!: PaymentDialogComponent;
  @ViewChild('receiptPreview') receiptPreview!: ReceiptPreviewComponent;
  @ViewChild('customerDialog') customerDialog!: CustomerSearchDialogComponent;
  @ViewChild('discountDialog') discountDialog!: DiscountDialogComponent;

  products = signal<Product[]>([]);
  selectedCategory = signal<string | null>(null);
  lastSale = signal<Sale | null>(null);
  currentStore = signal<Store | null>(null);
  loading = signal(false);

  filteredProducts = signal<Product[]>([]);

  @HostListener('document:keydown.f2', ['$event'])
  onF2(event: Event) {
    event.preventDefault();
    const input = document.querySelector<HTMLInputElement>('.pos-search-input');
    input?.focus();
  }

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

  openCustomerDialog() {
    this.customerDialog.open();
  }

  openDiscountDialog() {
    this.discountDialog.open();
  }

  onCustomerSelected(customer: Customer | null) {
    this.cart.customer.set(customer);
  }

  holdOrder() {
    if (this.cart.items().length === 0) return;
    this.cart.holdCurrentOrder();
    this.toast.success('Order held', `${this.cart.heldOrders().length} order(s) on hold`);
  }

  recallOrder() {
    const held = this.cart.heldOrders();
    if (held.length === 0) return;
    // Recall the most recent held order
    this.cart.recallOrder(held[held.length - 1].id);
    this.toast.success('Order recalled', 'Held order restored to cart');
  }

  completeSale(amountPaid: number) {
    const items = this.cart.items().map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));

    const payload: Record<string, unknown> = {
      items,
      amount_paid: amountPaid,
    };

    // Send discount if applied
    if (this.cart.discountValue() > 0) {
      payload['discount_amount'] = this.cart.discountAmount();
      payload['discount_type'] = this.cart.discountType();
    }

    // TODO: Send customer_id when backend CreateSaleDto supports it
    // if (this.cart.customer()) {
    //   payload['customer_id'] = this.cart.customer()!.id;
    // }

    // TODO: Send payment_method when backend supports non-cash methods
    // payload['payment_method'] = this.cart.paymentMethod();

    this.loading.set(true);

    this.http
      .post<Sale>(`${environment.apiUrl}/sales`, payload)
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
