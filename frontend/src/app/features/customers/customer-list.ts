import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { Customer, CreateCustomerDto, RecordPaymentDto, CreditStatement } from '../../core/models/customer.model';
import { CustomerService } from '../../core/services/customer.service';
import { ToastService } from '../../core/services/toast.service';
import { StoreContextService } from '../../core/services/store-context.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { CustomerTableComponent } from './components/customer-table/customer-table';
import { CustomerFormDialogComponent } from './components/customer-form-dialog/customer-form-dialog';
import { CreditStatementDialogComponent } from './components/credit-statement-dialog/credit-statement-dialog';
import { RecordPaymentDialogComponent } from './components/record-payment-dialog/record-payment-dialog';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    InputTextModule,
    ConfirmDialogModule,
    PageHeader,
    CustomerTableComponent,
    CustomerFormDialogComponent,
    CreditStatementDialogComponent,
    RecordPaymentDialogComponent,
  ],
  templateUrl: './customer-list.html',
  styleUrls: ['./customer-list.scss'],
})
export class CustomerListComponent implements OnInit {
  private customerService = inject(CustomerService);
  private toast = inject(ToastService);
  private confirmService = inject(ConfirmationService);
  storeCtx = inject(StoreContextService);
  private subscriptionService = inject(SubscriptionService);

  customers = signal<Customer[]>([]);
  loading = signal(false);
  saving = signal(false);
  searchQuery = '';

  // Subscription feature check
  hasUtangFeature = this.subscriptionService.hasFeatureSignal('utang_management');

  // Form dialog
  formDialogVisible = false;
  editMode = false;
  editId = '';
  form: CreateCustomerDto = this.emptyForm();

  // Statement dialog
  statementDialogVisible = false;
  statement = signal<CreditStatement | null>(null);
  statementLoading = signal(false);

  // Payment dialog
  paymentDialogVisible = false;
  paymentCustomer = signal<Customer | null>(null);

  private searchTimeout: any;

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.loading.set(true);
    this.customerService.getAll(this.searchQuery).subscribe({
      next: (customers) => {
        this.customers.set(customers);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadCustomers(), 300);
  }

  openNew() {
    this.form = this.emptyForm();
    this.editMode = false;
    this.editId = '';
    this.formDialogVisible = true;
  }

  editCustomer(customer: Customer) {
    this.form = {
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || undefined,
      address: customer.address || undefined,
      credit_limit: customer.credit_limit,
    };
    this.editId = customer.id;
    this.editMode = true;
    this.formDialogVisible = true;
  }

  saveCustomer() {
    this.saving.set(true);
    const obs = this.editMode
      ? this.customerService.update(this.editId, this.form)
      : this.customerService.create(this.form);

    obs.subscribe({
      next: () => {
        this.toast.success(this.editMode ? 'Customer updated' : 'Customer created');
        this.formDialogVisible = false;
        this.saving.set(false);
        this.loadCustomers();
      },
      error: () => this.saving.set(false),
    });
  }

  confirmDelete(customer: Customer) {
    this.confirmService.confirm({
      message: `Deactivate "${customer.name}"? This will hide them from the customer list.`,
      header: 'Confirm Deactivate',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.customerService.deactivate(customer.id).subscribe({
          next: () => {
            this.toast.success('Customer deactivated');
            this.loadCustomers();
          },
        });
      },
    });
  }

  viewStatement(customer: Customer) {
    this.statementLoading.set(true);
    this.statementDialogVisible = true;
    this.customerService.getStatement(customer.id).subscribe({
      next: (stmt) => {
        this.statement.set(stmt);
        this.statementLoading.set(false);
      },
      error: () => this.statementLoading.set(false),
    });
  }

  openPayment(customer: Customer) {
    this.paymentCustomer.set(customer);
    this.paymentDialogVisible = true;
  }

  submitPayment(dto: RecordPaymentDto) {
    const customer = this.paymentCustomer();
    if (!customer) return;

    this.saving.set(true);
    this.customerService.recordPayment(customer.id, dto).subscribe({
      next: () => {
        this.toast.success('Payment recorded');
        this.paymentDialogVisible = false;
        this.saving.set(false);
        this.loadCustomers();
      },
      error: () => this.saving.set(false),
    });
  }

  private emptyForm(): CreateCustomerDto {
    return { name: '', phone: '', email: undefined, address: undefined, credit_limit: 0 };
  }
}
