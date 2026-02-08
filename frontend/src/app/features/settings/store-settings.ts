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
  template: `
    <app-page-header title="Settings" subtitle="Store configuration" />

    @if (store()) {
      <div class="settings-grid">
        <div class="card">
          <h3>Store Information</h3>
          <div class="form-grid">
            <div class="field">
              <label>Store Name</label>
              <input pInputText [(ngModel)]="storeForm.name" class="w-full" />
            </div>
            <div class="field">
              <label>Address</label>
              <textarea pTextarea [(ngModel)]="storeForm.address" class="w-full" rows="2"></textarea>
            </div>
            <div class="field-row">
              <div class="field">
                <label>Phone</label>
                <input pInputText [(ngModel)]="storeForm.phone" class="w-full" />
              </div>
              <div class="field">
                <label>Email</label>
                <input pInputText [(ngModel)]="storeForm.email" class="w-full" type="email" />
              </div>
            </div>
            <div class="field">
              <label>BIR TIN (Tax ID)</label>
              <input pInputText [(ngModel)]="storeForm.tax_id" class="w-full" placeholder="000-000-000-000" />
            </div>
            <p-button label="Save Store Info" icon="pi pi-check" (onClick)="saveStoreInfo()" [loading]="saving()" />
          </div>
        </div>

        <div class="card">
          <h3>Tax Configuration</h3>
          <div class="form-grid">
            <div class="field">
              <label>Enable VAT</label>
              <p-toggleswitch [(ngModel)]="settings.tax_enabled" />
            </div>
            @if (settings.tax_enabled) {
              <div class="field">
                <label>Tax Rate (%)</label>
                <p-inputNumber [(ngModel)]="settings.tax_rate" [min]="0" [max]="100" suffix="%" styleClass="w-full" />
              </div>
            }
          </div>

          <h3 style="margin-top: 1.5rem">Receipt Settings</h3>
          <div class="form-grid">
            <div class="field">
              <label>Receipt Header</label>
              <textarea pTextarea [(ngModel)]="settings.receipt_header" class="w-full" rows="2" placeholder="Printed at top of receipt"></textarea>
            </div>
            <div class="field">
              <label>Receipt Footer</label>
              <textarea pTextarea [(ngModel)]="settings.receipt_footer" class="w-full" rows="2" placeholder="Printed at bottom of receipt"></textarea>
            </div>
            <p-button label="Save Settings" icon="pi pi-check" (onClick)="saveSettings()" [loading]="savingSettings()" />
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .settings-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    @media (max-width: 768px) {
      .settings-grid { grid-template-columns: 1fr; }
    }
    h3 { margin-bottom: 1rem; }
    .form-grid { display: flex; flex-direction: column; gap: 1rem; }
    .field { display: flex; flex-direction: column; gap: 0.375rem; flex: 1; label { font-size: 0.875rem; font-weight: 500; } }
    .field-row { display: flex; gap: 1rem; }
    .w-full { width: 100%; }
  `,
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
