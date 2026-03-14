import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { environment } from '../../../environments/environment';
import { Store, UpdateStoreDto, StoreSettings } from '../../core/models/store.model';
import { StoreContextService } from '../../core/services/store-context.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import { UsageResponse } from '../../core/models/subscription.model';
import { UserRole } from '../../core/models/enums';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { CreateStoreDialogComponent, CreateStoreForm } from './components/create-store-dialog/create-store-dialog';

@Component({
  selector: 'app-store-settings',
  standalone: true,
  imports: [
    FormsModule, ButtonModule, InputTextModule, InputNumberModule,
    TextareaModule, ToggleSwitchModule, TooltipModule, PageHeader,
    CreateStoreDialogComponent,
  ],
  templateUrl: './store-settings.html',
  styleUrls: ['./store-settings.scss'],
})
export class StoreSettingsComponent implements OnInit {
  private http = inject(HttpClient);
  private storeCtx = inject(StoreContextService);
  private toast = inject(ToastService);
  private authService = inject(AuthService);
  private subscriptionService = inject(SubscriptionService);

  store = signal<Store | null>(null);
  saving = signal(false);
  savingSettings = signal(false);
  usage = signal<UsageResponse | null>(null);
  savingNewStore = signal(false);

  storeForm: UpdateStoreDto = {};
  settings: StoreSettings = { tax_enabled: true, tax_rate: 12, receipt_header: '', receipt_footer: '' };
  createStoreDialogVisible = false;
  createStoreForm: CreateStoreForm = { name: '' };

  stores = this.authService.stores;
  activeStoreId = this.storeCtx.storeId;
  hasMultiStore = this.subscriptionService.hasFeatureSignal('multi_store');
  hasReceiptCustomization = this.subscriptionService.hasFeatureSignal('receipt_customization');
  storeUsage = computed(() => this.usage()?.stores ?? null);
  isAtStoreLimit = computed(() => {
    const u = this.storeUsage();
    return u ? u.current >= u.limit : false;
  });

  ngOnInit() {
    this.http.get<Store>(`${environment.apiUrl}/stores/${this.storeCtx.storeId()}`).subscribe((s) => {
      this.store.set(s);
      this.storeForm = {
        name: s.name,
        address: s.address ?? undefined,
        phone: s.phone ?? undefined,
        email: s.email ?? undefined,
        tax_id: s.tax_id ?? undefined,
      };
      this.settings = {
        tax_enabled: s.settings?.tax_enabled ?? true,
        tax_rate: s.settings?.tax_rate ?? 12,
        receipt_header: s.settings?.receipt_header ?? '',
        receipt_footer: s.settings?.receipt_footer ?? '',
      };
    });

    if (this.hasMultiStore()) {
      this.loadUsage();
    }
  }

  saveStoreInfo() {
    this.saving.set(true);
    this.http.patch(`${environment.apiUrl}/stores/${this.storeCtx.storeId()}`, this.storeForm).subscribe({
      next: () => { this.toast.success('Store info updated'); this.saving.set(false); },
      error: () => this.saving.set(false),
    });
  }

  saveSettings() {
    this.savingSettings.set(true);
    this.http.patch(`${environment.apiUrl}/stores/${this.storeCtx.storeId()}/settings`, this.settings).subscribe({
      next: () => { this.toast.success('Settings saved'); this.savingSettings.set(false); },
      error: () => this.savingSettings.set(false),
    });
  }

  loadUsage() {
    this.subscriptionService.loadUsage().subscribe((data) => this.usage.set(data));
  }

  openCreateStoreDialog() {
    this.createStoreForm = { name: '' };
    this.createStoreDialogVisible = true;
  }

  createStore() {
    if (!this.createStoreForm.name?.trim()) return;
    this.savingNewStore.set(true);
    this.http.post<Store>(`${environment.apiUrl}/stores`, this.createStoreForm).subscribe({
      next: (newStore) => {
        this.toast.success('Store created', `"${newStore.name}" is ready to use.`);
        this.createStoreDialogVisible = false;
        this.savingNewStore.set(false);
        this.authService.addStore({
          id: newStore.id,
          name: newStore.name,
          role: UserRole.ADMIN,
          is_default: false,
        });
        this.loadUsage();
      },
      error: () => this.savingNewStore.set(false),
    });
  }
}
