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
  templateUrl: './category-list.html',
  styleUrls: ['./category-list.scss'],
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
