import { Component, inject } from '@angular/core';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../core/services/auth.service';
import { StoreContextService } from '../../core/services/store-context.service';
import { ToastService } from '../../core/services/toast.service';
import { StoreAccess } from '../../core/models/user.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [SelectModule, FormsModule, ButtonModule, MenuModule],
  template: `
    <header class="app-header">
      <div class="header-left">
        <p-select
          [options]="stores()"
          [(ngModel)]="selectedStoreId"
          optionLabel="name"
          optionValue="id"
          placeholder="Select store"
          (onChange)="onStoreChange($event.value)"
          styleClass="store-select"
          appendTo="body"
        />
      </div>

      <div class="header-right">
        <span class="user-name">{{ auth.currentUser()?.full_name }}</span>
        <p-button
          icon="pi pi-sign-out"
          [text]="true"
          severity="secondary"
          (onClick)="onLogout()"
          pTooltip="Sign out"
        />
      </div>
    </header>
  `,
  styles: `
    .app-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: var(--header-height);
      padding: 0 1.5rem;
      background: var(--bg-primary);
      border-bottom: 1px solid var(--border-color);
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .user-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-primary);
    }
    :host ::ng-deep .store-select {
      min-width: 200px;
    }
  `,
})
export class HeaderComponent {
  auth = inject(AuthService);
  private storeContext = inject(StoreContextService);
  private toast = inject(ToastService);

  stores = this.auth.stores;
  selectedStoreId = this.storeContext.storeId();

  onStoreChange(storeId: string) {
    this.storeContext.switchStore(storeId).subscribe({
      next: (res) => {
        this.toast.success('Store switched', `Now using ${res.store.name}`);
        window.location.reload();
      },
      error: () => {
        this.selectedStoreId = this.storeContext.storeId();
      },
    });
  }

  onLogout() {
    this.auth.logout();
  }
}
