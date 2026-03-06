import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { environment } from '../../../../environments/environment';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { ToastService } from '../../../core/services/toast.service';

interface PlatformSubscriptionItem {
  id: string;
  status: string;
  current_period_end?: string;
  plan: {
    code: string;
    name: string;
    price_php: number;
  };
  organization: {
    id: string;
    name: string;
    billing_email?: string;
  };
}

@Component({
  selector: 'app-platform-subscriptions',
  standalone: true,
  imports: [
    FormsModule,
    PageHeader,
    DatePipe,
    TitleCasePipe,
    DialogModule,
    ButtonModule,
    TableModule,
    TagModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    SelectModule,
  ],
  templateUrl: './platform-subscriptions.html',
  styleUrls: ['./platform-subscriptions.scss'],
})
export class PlatformSubscriptionsComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  statusOptions = [
    { label: 'All statuses', value: '' },
    { label: 'Trial', value: 'trial' },
    { label: 'Active', value: 'active' },
    { label: 'Past due', value: 'past_due' },
    { label: 'Suspended', value: 'suspended' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'Expired', value: 'expired' },
  ];

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch (status) {
      case 'active':     return 'success';
      case 'trial':      return 'info';
      case 'past_due':
      case 'suspended':  return 'warn';
      default:           return 'secondary';
    }
  }

  loading = signal(true);
  search = signal('');
  status = signal('');
  items = signal<PlatformSubscriptionItem[]>([]);
  actionLoading = signal(false);
  actionDialogVisible = signal(false);
  selectedItem = signal<PlatformSubscriptionItem | null>(null);
  pendingAction = signal<'suspend' | 'reactivate' | null>(null);

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    let params = new HttpParams().set('limit', '100');
    if (this.search().trim()) params = params.set('search', this.search().trim());
    if (this.status()) params = params.set('status', this.status());

    this.http
      .get<{ items: PlatformSubscriptionItem[] }>(`${environment.apiUrl}/admin/subscriptions`, { params })
      .subscribe({
        next: (res) => {
          this.items.set(res.items ?? []);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.toast.error('Failed to load subscriptions');
        },
      });
  }

  openActionDialog(item: PlatformSubscriptionItem, action: 'suspend' | 'reactivate') {
    this.selectedItem.set(item);
    this.pendingAction.set(action);
    this.actionDialogVisible.set(true);
  }

  confirmAction() {
    const item = this.selectedItem();
    const action = this.pendingAction();
    if (!item || !action) return;

    this.actionLoading.set(true);
    const endpoint =
      action === 'suspend'
        ? `${environment.apiUrl}/admin/subscriptions/${item.organization.id}/suspend`
        : `${environment.apiUrl}/admin/subscriptions/${item.organization.id}/reactivate`;
    const successSummary = action === 'suspend' ? 'Subscription suspended' : 'Subscription reactivated';
    const errorSummary = action === 'suspend' ? 'Suspend failed' : 'Reactivation failed';

    this.http
      .post(endpoint, {})
      .subscribe({
        next: () => {
          this.toast.success(successSummary, item.organization.name);
          this.actionDialogVisible.set(false);
          this.actionLoading.set(false);
          this.load();
        },
        error: (err) => {
          this.actionLoading.set(false);
          this.toast.error(errorSummary, err?.error?.message ?? 'Please try again.');
        },
      });
  }
}
