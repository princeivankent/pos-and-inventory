import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { environment } from '../../../environments/environment';
import { UserWithStore } from '../../core/models/user.model';
import { UserRole } from '../../core/models/enums';
import { ToastService } from '../../core/services/toast.service';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    FormsModule, TableModule, ButtonModule, DialogModule,
    InputTextModule, SelectModule, ConfirmDialogModule, PageHeader, StatusBadge,
  ],
  template: `
    <app-page-header title="Users" subtitle="Manage store users and roles">
      <p-button label="Add User" icon="pi pi-plus" (onClick)="openNew()" />
    </app-page-header>

    <div class="card">
      <p-table [value]="users()" [loading]="loading()" dataKey="id">
        <ng-template pTemplate="header">
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th style="width:120px">Actions</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-user>
          <tr>
            <td class="font-medium">{{ user.full_name }}</td>
            <td>{{ user.email }}</td>
            <td>
              <app-status-badge
                [label]="user.role"
                [severity]="user.role === 'admin' ? 'info' : 'neutral'"
              />
            </td>
            <td>
              <app-status-badge
                [label]="user.is_active ? 'Active' : 'Inactive'"
                [severity]="user.is_active ? 'success' : 'danger'"
              />
            </td>
            <td>
              <div class="flex gap-2">
                <p-button icon="pi pi-pencil" [rounded]="true" [text]="true" severity="info" (onClick)="editRole(user)" />
                <p-button icon="pi pi-trash" [rounded]="true" [text]="true" severity="danger" (onClick)="confirmDeactivate(user)" />
              </div>
            </td>
          </tr>
        </ng-template>
        <ng-template pTemplate="emptymessage">
          <tr><td colspan="5" class="text-center text-secondary" style="padding:2rem">No users found</td></tr>
        </ng-template>
      </p-table>
    </div>

    <!-- Create User Dialog -->
    <p-dialog
      [(visible)]="createDialogVisible"
      header="Add User"
      [modal]="true"
      [style]="{ width: '420px' }"
    >
      <div class="form-grid">
        <div class="field">
          <label>Email *</label>
          <input pInputText [(ngModel)]="createForm.email" class="w-full" type="email" />
        </div>
        <div class="field">
          <label>Full Name *</label>
          <input pInputText [(ngModel)]="createForm.full_name" class="w-full" />
        </div>
        <div class="field">
          <label>Password *</label>
          <input pInputText [(ngModel)]="createForm.password" class="w-full" type="password" />
        </div>
        <div class="field">
          <label>Role</label>
          <p-select
            [(ngModel)]="createForm.role"
            [options]="roleOptions"
            optionLabel="label"
            optionValue="value"
            styleClass="w-full"
            appendTo="body"
          />
        </div>
      </div>

      <ng-template pTemplate="footer">
        <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="createDialogVisible = false" />
        <p-button
          label="Create"
          icon="pi pi-check"
          (onClick)="createUser()"
          [loading]="saving()"
          [disabled]="!createForm.email || !createForm.full_name || !createForm.password"
        />
      </ng-template>
    </p-dialog>

    <!-- Edit Role Dialog -->
    <p-dialog
      [(visible)]="roleDialogVisible"
      header="Change Role"
      [modal]="true"
      [style]="{ width: '350px' }"
    >
      @if (editingUser) {
        <div class="form-grid">
          <p>Change role for <strong>{{ editingUser.full_name }}</strong></p>
          <div class="field">
            <label>Role</label>
            <p-select
              [(ngModel)]="newRole"
              [options]="roleOptions"
              optionLabel="label"
              optionValue="value"
              styleClass="w-full"
              appendTo="body"
            />
          </div>
        </div>
      }

      <ng-template pTemplate="footer">
        <p-button label="Cancel" [text]="true" severity="secondary" (onClick)="roleDialogVisible = false" />
        <p-button label="Update" icon="pi pi-check" (onClick)="updateRole()" [loading]="saving()" />
      </ng-template>
    </p-dialog>
  `,
  styles: `
    .form-grid { display: flex; flex-direction: column; gap: 1rem; }
    .field { display: flex; flex-direction: column; gap: 0.375rem; label { font-size: 0.875rem; font-weight: 500; } }
    .w-full { width: 100%; }
  `,
})
export class UserListComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private confirmService = inject(ConfirmationService);

  users = signal<UserWithStore[]>([]);
  loading = signal(false);
  saving = signal(false);
  createDialogVisible = false;
  roleDialogVisible = false;
  editingUser: UserWithStore | null = null;
  newRole = UserRole.CASHIER;

  createForm = { email: '', full_name: '', password: '', role: UserRole.CASHIER };

  roleOptions = [
    { label: 'Admin', value: UserRole.ADMIN },
    { label: 'Cashier', value: UserRole.CASHIER },
  ];

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading.set(true);
    this.http.get<UserWithStore[]>(`${environment.apiUrl}/users`).subscribe({
      next: (u) => { this.users.set(u); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openNew() {
    this.createForm = { email: '', full_name: '', password: '', role: UserRole.CASHIER };
    this.createDialogVisible = true;
  }

  createUser() {
    this.saving.set(true);
    this.http.post(`${environment.apiUrl}/users`, this.createForm).subscribe({
      next: () => {
        this.toast.success('User created');
        this.createDialogVisible = false;
        this.saving.set(false);
        this.loadUsers();
      },
      error: () => this.saving.set(false),
    });
  }

  editRole(user: UserWithStore) {
    this.editingUser = user;
    this.newRole = user.role;
    this.roleDialogVisible = true;
  }

  updateRole() {
    if (!this.editingUser) return;
    this.saving.set(true);
    this.http.patch(`${environment.apiUrl}/users/${this.editingUser.id}/role`, { role: this.newRole }).subscribe({
      next: () => {
        this.toast.success('Role updated');
        this.roleDialogVisible = false;
        this.saving.set(false);
        this.loadUsers();
      },
      error: () => this.saving.set(false),
    });
  }

  confirmDeactivate(user: UserWithStore) {
    this.confirmService.confirm({
      message: `Deactivate "${user.full_name}"?`,
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.http.delete(`${environment.apiUrl}/users/${user.id}`).subscribe({
          next: () => {
            this.toast.success('User deactivated');
            this.loadUsers();
          },
        });
      },
    });
  }
}
