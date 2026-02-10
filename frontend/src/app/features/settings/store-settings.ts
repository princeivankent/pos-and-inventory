import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { environment } from '../../../environments/environment';
import { Store, UpdateStoreDto, StoreSettings } from '../../core/models/store.model';
import { StoreContextService } from '../../core/services/store-context.service';
import { ToastService } from '../../core/services/toast.service';
import { PageHeader } from '../../shared/components/page-header/page-header';

@Component({
  selector: 'app-store-settings',
  standalone: true,
  imports: [
    FormsModule, ButtonModule, InputTextModule, InputNumberModule,
    TextareaModule, ToggleSwitchModule, PageHeader,
  ],
  templateUrl: './store-settings.html',
  styleUrls: ['./store-settings.scss'],
})
export class StoreSettingsComponent implements OnInit {
  private http = inject(HttpClient);
  private storeCtx = inject(StoreContextService);
  private toast = inject(ToastService);

  store = signal<Store | null>(null);
  saving = signal(false);
  savingSettings = signal(false);

  storeForm: UpdateStoreDto = {};
  settings: StoreSettings = { tax_enabled: true, tax_rate: 12, receipt_header: '', receipt_footer: '' };

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
}
