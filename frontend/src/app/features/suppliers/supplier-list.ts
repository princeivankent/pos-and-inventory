import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { Supplier, CreateSupplierDto } from '../../core/models/supplier.model';
import { SupplierService } from '../../core/services/supplier.service';
import { ToastService } from '../../core/services/toast.service';
import { StoreContextService } from '../../core/services/store-context.service';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { SupplierTableComponent } from './components/supplier-table/supplier-table';
import { SupplierFormDialogComponent } from './components/supplier-form-dialog/supplier-form-dialog';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    ConfirmDialogModule,
    PageHeader,
    SupplierTableComponent,
    SupplierFormDialogComponent,
  ],
  templateUrl: './supplier-list.html',
  styleUrls: ['./supplier-list.scss'],
})
export class SupplierListComponent implements OnInit {
  private supplierService = inject(SupplierService);
  private toast = inject(ToastService);
  private confirmService = inject(ConfirmationService);
  storeCtx = inject(StoreContextService);

  suppliers = signal<Supplier[]>([]);
  loading = signal(false);
  saving = signal(false);
  searchQuery = '';
  pageSize = 20;

  pageSizeOptions = [
    { label: '10 / page', value: 10 },
    { label: '20 / page', value: 20 },
    { label: '50 / page', value: 50 },
  ];

  formDialogVisible = false;
  editMode = false;
  editId = '';
  form: CreateSupplierDto = this.emptyForm();

  private searchTimeout: any;

  ngOnInit() {
    this.loadSuppliers();
  }

  loadSuppliers() {
    this.loading.set(true);
    this.supplierService.getAll(this.searchQuery).subscribe({
      next: (suppliers) => {
        this.suppliers.set(suppliers);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearch() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadSuppliers(), 300);
  }

  openNew() {
    this.form = this.emptyForm();
    this.editMode = false;
    this.editId = '';
    this.formDialogVisible = true;
  }

  editSupplier(supplier: Supplier) {
    this.form = {
      name: supplier.name,
      contact_person: supplier.contact_person || undefined,
      phone: supplier.phone || undefined,
      email: supplier.email || undefined,
      address: supplier.address || undefined,
    };
    this.editId = supplier.id;
    this.editMode = true;
    this.formDialogVisible = true;
  }

  saveSupplier() {
    this.saving.set(true);
    const obs = this.editMode
      ? this.supplierService.update(this.editId, this.form)
      : this.supplierService.create(this.form);

    obs.subscribe({
      next: () => {
        this.toast.success(this.editMode ? 'Supplier updated' : 'Supplier created');
        this.formDialogVisible = false;
        this.saving.set(false);
        this.loadSuppliers();
      },
      error: () => this.saving.set(false),
    });
  }

  confirmDeactivate(supplier: Supplier) {
    this.confirmService.confirm({
      message: `Deactivate "${supplier.name}"? This will hide them from the supplier list.`,
      header: 'Confirm Deactivate',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.supplierService.deactivate(supplier.id).subscribe({
          next: () => {
            this.toast.success('Supplier deactivated');
            this.loadSuppliers();
          },
        });
      },
    });
  }

  private emptyForm(): CreateSupplierDto {
    return { name: '', contact_person: undefined, phone: undefined, email: undefined, address: undefined };
  }
}
