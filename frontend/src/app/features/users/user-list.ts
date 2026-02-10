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
  templateUrl: './user-list.html',
  styleUrls: ['./user-list.scss'],
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
