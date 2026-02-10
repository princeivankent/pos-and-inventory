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
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
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
