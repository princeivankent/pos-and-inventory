import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { environment } from '../../../environments/environment';
import { Category, CreateCategoryDto } from '../../core/models/category.model';
import { ToastService } from '../../core/services/toast.service';
import { PageHeader } from '../../shared/components/page-header/page-header';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [
    FormsModule, TableModule, ButtonModule, InputTextModule,
    DialogModule, SelectModule, ConfirmDialogModule, PageHeader,
  ],
  template: `
    <app-page-header title="Categories" subtitle="Organize your products">
      <p-button label="Add Category" icon="pi pi-plus" (onClick)="openNew()" />
    </app-page-header>

    <div class="card">
      <p-table
        [value]="categories()"
        [loading]="loading()"
        dataKey="id"
      >
        <ng-template pTemplate="header">
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Parent</th>
            <th style="width:100px">Actions</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-cat>
          <tr>
            <td>
              @if (cat.parent_id) {
                <span class="indent">&#8627; </span>
              }
              <span class="font-medium">{{ cat.name }}</span>
            </td>
            <td class="text-secondary">{{ cat.description ?? '-' }}</td>
            <td>{{ getParentName(cat.parent_id) }}</td>
            <td>
              <div class="flex gap-2">
                <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="info" (onClick)="editCategory(cat)" />
                <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (onClick)="confirmDelete(cat)" />
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr><td colspan="4" class="text-center text-secondary" style="padding:2rem">No categories found</td></tr>
        </ng-template>
      </p-table>
    </div>

    <p-dialog
      [(visible)]="dialogVisible"
      [header]="editMode ? 'Edit Category' : 'New Category'"
      [modal]="true"
      [style]="{ width: '420px' }"
    >
      <div class="form-grid">
        <div class="field">
          <label>Name *</label>
          <input pInputText [(ngModel)]="form.name" class="w-full" />
        </div>
        <div class="field">
          <label>Description</label>
          <input pInputText [(ngModel)]="form.description" class="w-full" />
        </div>
        <div class="field">
          <label>Parent Category</label>
          <p-select
            [(ngModel)]="form.parent_id"
            [options]="parentOptions()"
            optionLabel="name"
            optionValue="id"
            placeholder="None (top-level)"
            [showClear]="true"
            styleClass="w-full"
            appendTo="body"
          />
        </div>
      </div>

      <ng-template pTemplate="footer">
        <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="dialogVisible = false" />
        <p-button
          [label]="editMode ? 'Update' : 'Create'"
          icon="pi pi-check"
          (onClick)="saveCategory()"
          [loading]="saving()"
          [disabled]="!form.name"
        />
      </ng-template>
    </p-dialog>
  `,
  styles: `
    .indent { color: var(--text-tertiary); }
    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      label { font-size: 0.875rem; font-weight: 500; }
    }
    .w-full { width: 100%; }
  `,
})
export class CategoryListComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private confirmService = inject(ConfirmationService);

  categories = signal<Category[]>([]);
  loading = signal(false);
  saving = signal(false);
  dialogVisible = false;
  editMode = false;
  editId = '';

  form: CreateCategoryDto = { name: '' };

  parentOptions = signal<Category[]>([]);

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.loading.set(true);
    this.http.get<Category[]>(`${environment.apiUrl}/categories`).subscribe({
      next: (cats) => {
        this.categories.set(cats);
        this.parentOptions.set(cats.filter((c) => !c.parent_id));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getParentName(parentId: string | null): string {
    if (!parentId) return '-';
    return this.categories().find((c) => c.id === parentId)?.name ?? '-';
  }

  openNew() {
    this.form = { name: '' };
    this.editMode = false;
    this.dialogVisible = true;
  }

  editCategory(cat: Category) {
    this.form = {
      name: cat.name,
      description: cat.description ?? undefined,
      parent_id: cat.parent_id ?? undefined,
    };
    this.editId = cat.id;
    this.editMode = true;
    this.dialogVisible = true;
  }

  saveCategory() {
    this.saving.set(true);
    const obs = this.editMode
      ? this.http.patch<Category>(`${environment.apiUrl}/categories/${this.editId}`, this.form)
      : this.http.post<Category>(`${environment.apiUrl}/categories`, this.form);

    obs.subscribe({
      next: () => {
        this.toast.success(this.editMode ? 'Category updated' : 'Category created');
        this.dialogVisible = false;
        this.saving.set(false);
        this.loadCategories();
      },
      error: () => this.saving.set(false),
    });
  }

  confirmDelete(cat: Category) {
    this.confirmService.confirm({
      message: `Delete "${cat.name}"?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.http.delete(`${environment.apiUrl}/categories/${cat.id}`).subscribe({
          next: () => {
            this.toast.success('Category deleted');
            this.loadCategories();
          },
        });
      },
    });
  }
}
