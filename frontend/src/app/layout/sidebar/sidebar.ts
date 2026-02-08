import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { StoreContextService } from '../../core/services/store-context.service';
import { UserRole } from '../../core/models/enums';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <div class="sidebar-brand">
        <span class="brand-icon">
          <i class="pi pi-shopping-cart"></i>
        </span>
        <span class="brand-text">POS System</span>
      </div>

      <nav class="sidebar-nav">
        @for (item of visibleItems; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
            class="nav-item"
          >
            <i [class]="'pi ' + item.icon"></i>
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>
    </aside>
  `,
  styles: `
    .sidebar {
      width: var(--sidebar-width);
      height: 100vh;
      background: var(--bg-primary);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      position: fixed;
      left: 0;
      top: 0;
      z-index: 100;
    }
    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border-color);
      height: var(--header-height);
    }
    .brand-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      background: var(--color-primary);
      color: white;
      border-radius: var(--border-radius-sm);
      font-size: 0.875rem;
    }
    .brand-text {
      font-weight: 600;
      font-size: 1rem;
      color: var(--text-primary);
    }
    .sidebar-nav {
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      flex: 1;
      overflow-y: auto;
    }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0.75rem;
      border-radius: var(--border-radius-sm);
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all var(--transition-fast);
      &:hover {
        background: var(--bg-secondary);
        color: var(--text-primary);
      }
      &.active {
        background: var(--color-primary-light);
        color: var(--color-primary);
      }
      i {
        font-size: 1.125rem;
        width: 1.25rem;
        text-align: center;
      }
    }
  `,
})
export class SidebarComponent {
  private storeContext = inject(StoreContextService);

  private navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'pi-home', route: '/dashboard' },
    { label: 'POS', icon: 'pi-calculator', route: '/pos' },
    { label: 'Products', icon: 'pi-box', route: '/products' },
    { label: 'Categories', icon: 'pi-tags', route: '/categories', adminOnly: true },
    { label: 'Inventory', icon: 'pi-warehouse', route: '/inventory' },
    { label: 'Sales', icon: 'pi-receipt', route: '/sales' },
    { label: 'Reports', icon: 'pi-chart-bar', route: '/reports', adminOnly: true },
    { label: 'Users', icon: 'pi-users', route: '/users', adminOnly: true },
    { label: 'Settings', icon: 'pi-cog', route: '/settings', adminOnly: true },
  ];

  get visibleItems(): NavItem[] {
    const isAdmin = this.storeContext.isAdmin();
    return this.navItems.filter((item) => !item.adminOnly || isAdmin);
  }
}
