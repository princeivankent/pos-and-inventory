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
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss'],
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
    { label: 'Customers', icon: 'pi-id-card', route: '/customers' },
    { label: 'Reports', icon: 'pi-chart-bar', route: '/reports', adminOnly: true },
    { label: 'Users', icon: 'pi-users', route: '/users', adminOnly: true },
    { label: 'Settings', icon: 'pi-cog', route: '/settings', adminOnly: true },
  ];

  get visibleItems(): NavItem[] {
    const isAdmin = this.storeContext.isAdmin();
    return this.navItems.filter((item) => !item.adminOnly || isAdmin);
  }
}
