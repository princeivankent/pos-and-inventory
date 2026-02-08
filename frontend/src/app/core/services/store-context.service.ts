import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StoreAccess, SwitchStoreResponse } from '../models/user.model';
import { UserRole } from '../models/enums';
import { AuthService } from './auth.service';

const ACTIVE_STORE_KEY = 'active_store';

@Injectable({ providedIn: 'root' })
export class StoreContextService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  activeStore = signal<StoreAccess | null>(this.loadActiveStore());

  storeId = computed(() => this.activeStore()?.id ?? '');
  currentRole = computed(() => this.activeStore()?.role ?? UserRole.CASHIER);
  isAdmin = computed(() => this.currentRole() === UserRole.ADMIN);

  initializeStore() {
    const stores = this.auth.stores();
    if (stores.length > 0) {
      const defaultStore = stores.find((s) => s.is_default) ?? stores[0];
      this.setActiveStore(defaultStore);
    }
  }

  switchStore(storeId: string) {
    return this.http
      .post<SwitchStoreResponse>(`${environment.apiUrl}/auth/switch-store`, {
        store_id: storeId,
      })
      .pipe(
        tap((res) => {
          this.setActiveStore(res.store);
        })
      );
  }

  private setActiveStore(store: StoreAccess) {
    localStorage.setItem(ACTIVE_STORE_KEY, JSON.stringify(store));
    this.activeStore.set(store);
  }

  private loadActiveStore(): StoreAccess | null {
    const raw = localStorage.getItem(ACTIVE_STORE_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
