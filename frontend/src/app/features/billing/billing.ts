import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { DialogModule } from 'primeng/dialog';
import { SkeletonModule } from 'primeng/skeleton';
import { SubscriptionService } from '../../core/services/subscription.service';
import { SubscriptionPlan, UsageResponse } from '../../core/models/subscription.model';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { ToastService } from '../../core/services/toast.service';
import { PhpCurrencyPipe } from '../../shared/pipes/php-currency.pipe';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [
    ButtonModule,
    ProgressBarModule,
    DialogModule,
    SkeletonModule,
    PageHeader,
    PhpCurrencyPipe,
  ],
  templateUrl: './billing.html',
  styleUrls: ['./billing.scss'],
})
export class BillingComponent implements OnInit {
  private http = inject(HttpClient);
  private subscriptionService = inject(SubscriptionService);
  private toast = inject(ToastService);

  usage = signal<UsageResponse | null>(null);
  loading = signal(true);
  actionLoading = signal(false);
  cancelDialogVisible = signal(false);
  upgradeDialogVisible = signal(false);
  selectedUpgradePlan = signal<SubscriptionPlan | null>(null);
  // Payment bypass toggle — reads from environment (mirrors backend BYPASS_PAYMENT)
  readonly bypassPayment = environment.bypassPayment;
  upgradePaymentStep = signal(false);

  subscription = this.subscriptionService.subscription;
  plans = this.subscriptionService.availablePlans;
  currentPlanCode = this.subscriptionService.currentPlan;
  isTrialing = this.subscriptionService.isTrialing;

  ngOnInit() {
    this.loading.set(true);
    forkJoin({
      usage: this.http.get<UsageResponse>(`${environment.apiUrl}/billing/usage`),
      plans: this.subscriptionService.loadPlans(),
    }).subscribe({
      next: ({ usage }) => {
        this.usage.set(usage);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Failed to load billing information');
      },
    });
  }

  getDaysRemaining(): number {
    const sub = this.subscription();
    const dateStr = sub?.trial_ends_at ?? sub?.current_period_end;
    if (!dateStr) return 0;
    const end = new Date(dateStr);
    const now = new Date();
    return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }

  formatExpiryDate(): string {
    const sub = this.subscription();
    const dateStr = sub?.trial_ends_at ?? sub?.current_period_end;
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  getStatusBadgeClass(status: string): string {
    const map: Record<string, string> = {
      trial: 'status-trial',
      active: 'status-active',
      past_due: 'status-danger',
      suspended: 'status-secondary',
      cancelled: 'status-secondary',
      expired: 'status-secondary',
    };
    return map[status] ?? 'status-secondary';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      trial: 'Trial',
      active: 'Active',
      past_due: 'Past Due',
      suspended: 'Suspended',
      cancelled: 'Cancelled',
      expired: 'Expired',
    };
    return map[status] ?? status;
  }

  getPlanOrder(planCode: string): number {
    const order: Record<string, number> = { tindahan: 1, negosyo: 2, kadena: 3 };
    return order[planCode] ?? 0;
  }

  getPlanAction(plan: SubscriptionPlan): 'current' | 'upgrade' | 'downgrade' {
    const current = this.getPlanOrder(this.currentPlanCode() ?? '');
    const target = this.getPlanOrder(plan.plan_code);
    if (current === target) return 'current';
    return target > current ? 'upgrade' : 'downgrade';
  }

  getUsagePercent(current: number, limit: number): number {
    if (limit <= 0) return 0;
    return Math.min(100, Math.round((current / limit) * 100));
  }

  getUsageBarClass(percent: number): string {
    if (percent >= 90) return 'danger';
    if (percent >= 70) return 'warning';
    return 'success';
  }

  formatLimit(limit: number): string {
    return limit === -1 ? 'Unlimited' : limit.toString();
  }

  getPlanFeatureList(plan: SubscriptionPlan): string[] {
    const features: string[] = [];
    if (plan.features['pos']) features.push('Point of Sale');
    if (plan.features['basic_inventory']) features.push('Inventory management');
    if (plan.features['utang_management']) features.push('Customer credit (utang)');
    if (plan.features['reports']) features.push('Sales & profit reports');
    if (plan.features['fifo_inventory']) features.push('FIFO batch tracking');
    if (plan.features['multi_store']) features.push('Multi-store management');
    if (plan.features['receipt_customization']) features.push('Receipt customization');
    if (plan.features['export_data']) features.push('Data export');
    return features;
  }

  openUpgradeDialog(plan: SubscriptionPlan) {
    this.selectedUpgradePlan.set(plan);
    this.upgradePaymentStep.set(false);
    this.upgradeDialogVisible.set(true);
  }

  // Returns which features in the target plan are NOT in the current plan
  getNewFeatureSet(targetPlan: SubscriptionPlan): Set<string> {
    const currentPlan = this.plans().find((p) => p.plan_code === this.currentPlanCode());
    if (!currentPlan) return new Set(this.getPlanFeatureList(targetPlan));
    const currentFeatureLabels = new Set(this.getPlanFeatureList(currentPlan));
    return new Set(this.getPlanFeatureList(targetPlan).filter((f) => !currentFeatureLabels.has(f)));
  }

  // Entry point for the Confirm button in the upgrade dialog.
  // When bypassPayment=true (dev): upgrades directly.
  // When bypassPayment=false (prod): shows payment step first.
  confirmUpgrade() {
    if (this.bypassPayment) {
      this.doUpgrade();
    } else {
      this.upgradePaymentStep.set(true);
    }
  }

  // Called from payment step after payment is collected (or directly when bypassed).
  // TODO: When bypassPayment=false, call POST /payments/create-intent first, then doUpgrade() on success.
  doUpgrade() {
    const plan = this.selectedUpgradePlan();
    if (!plan) return;
    this.upgradeDialogVisible.set(false);
    this.actionLoading.set(true);
    this.http.post(`${environment.apiUrl}/billing/upgrade`, { plan_id: plan.id }).subscribe({
      next: () => {
        this.subscriptionService.refreshSubscription().subscribe(() => {
          this.toast.success('Plan upgraded', `You are now on the ${plan.name} plan.`);
          this.actionLoading.set(false);
          this.ngOnInit();
        });
      },
      error: (err) => {
        this.toast.error('Upgrade failed', err?.error?.message ?? 'Please try again.');
        this.actionLoading.set(false);
      },
    });
  }

  downgradePlan(plan: SubscriptionPlan) {
    this.actionLoading.set(true);
    this.http.post(`${environment.apiUrl}/billing/downgrade`, { plan_id: plan.id }).subscribe({
      next: () => {
        this.subscriptionService.refreshSubscription().subscribe(() => {
          this.toast.success('Plan downgraded', `You are now on the ${plan.name} plan.`);
          this.actionLoading.set(false);
          this.ngOnInit();
        });
      },
      error: (err) => {
        this.toast.error(
          'Downgrade failed',
          err?.error?.message ?? 'Your usage may exceed the lower plan limits.',
        );
        this.actionLoading.set(false);
      },
    });
  }

  showCancelDialog() {
    this.cancelDialogVisible.set(true);
  }

  cancelSubscription() {
    this.actionLoading.set(true);
    this.cancelDialogVisible.set(false);
    this.http.post(`${environment.apiUrl}/billing/cancel`, { immediate: false }).subscribe({
      next: () => {
        this.subscriptionService.refreshSubscription().subscribe();
        this.toast.success(
          'Subscription cancelled',
          'Your plan will remain active until the end of the billing period.',
        );
        this.actionLoading.set(false);
      },
      error: (err) => {
        this.toast.error('Cancellation failed', err?.error?.message ?? 'Please try again.');
        this.actionLoading.set(false);
      },
    });
  }
}
