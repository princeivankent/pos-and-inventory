import { Component, inject, HostListener } from '@angular/core';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { StoreContextService } from '../../core/services/store-context.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [SelectModule, FormsModule, RouterLink],
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
})
export class HeaderComponent {
  auth = inject(AuthService);
  private storeContext = inject(StoreContextService);
  private toast = inject(ToastService);

  stores = this.auth.stores;
  selectedStoreId = this.storeContext.storeId();
  menuOpen = false;

  get userInitials(): string {
    const name = this.auth.currentUser()?.full_name ?? '';
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }

  get isAdmin(): boolean {
    return this.storeContext.isAdmin();
  }

  get isPlatformAdmin(): boolean {
    return this.storeContext.isPlatformAdmin();
  }

  toggleMenu(event: Event): void {
    event.stopPropagation();
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.menuOpen = false;
  }

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

  onLogout(): void {
    this.menuOpen = false;
    this.auth.logout();
  }
}
