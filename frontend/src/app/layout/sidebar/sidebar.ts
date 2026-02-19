import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { StoreContextService } from '../../core/services/store-context.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import { UserRole } from '../../core/models/enums';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
  requiresFeature?: string;
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
  private subscriptionService = inject(SubscriptionService);

  private navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'pi-home', route: '/dashboard' },
    { label: 'POS', icon: 'pi-calculator', route: '/pos' },
    { label: 'Products', icon: 'pi-box', route: '/products' },
    { label: 'Categories', icon: 'pi-tags', route: '/categories', adminOnly: true },
    { label: 'Inventory', icon: 'pi-warehouse', route: '/inventory' },
    { label: 'Sales', icon: 'pi-receipt', route: '/sales' },
    { label: 'Customers', icon: 'pi-id-card', route: '/customers' },
    {
      label: 'Reports',
      icon: 'pi-chart-bar',
      route: '/reports',
      adminOnly: true,
      requiresFeature: 'reports',
    },
    { label: 'Users', icon: 'pi-users', route: '/users', adminOnly: true },
    { label: 'Settings', icon: 'pi-cog', route: '/settings', adminOnly: true },
    { label: 'Billing', icon: 'pi-credit-card', route: '/billing', adminOnly: true },
  ];

  get visibleItems(): NavItem[] {
    const isAdmin = this.storeContext.isAdmin();

    return this.navItems.filter((item) => {
      // Check role requirement
      if (item.adminOnly && !isAdmin) return false;

      // Check feature requirement
      if (item.requiresFeature) {
        return this.subscriptionService.hasFeature(item.requiresFeature);
      }

      return true;
    });
  }
}
