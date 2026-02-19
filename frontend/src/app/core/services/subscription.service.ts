import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SubscriptionInfo, SubscriptionPlan, UsageResponse } from '../models/subscription.model';

@Injectable({
  providedIn: 'root',
})
export class SubscriptionService {
  private http = inject(HttpClient);
  private readonly STORAGE_KEY = 'subscription';

  // State signals
  subscription = signal<SubscriptionInfo | null>(null);
  availablePlans = signal<SubscriptionPlan[]>([]);

  // Computed signals
  hasActiveSubscription = computed(() => {
    const sub = this.subscription();
    return sub && ['trial', 'active'].includes(sub.status);
  });

  currentPlan = computed(() => this.subscription()?.plan_code ?? null);
  isTrialing = computed(() => this.subscription()?.status === 'trial');

  constructor() {
    this.loadFromStorage();
  }

  // Feature checking
  hasFeature(feature: string): boolean {
    const features = this.subscription()?.features ?? {};
    return features[feature] === true;
  }

  hasFeatureSignal(feature: string) {
    return computed(() => this.hasFeature(feature));
  }

  // Initialize from login response
  setSubscription(sub: SubscriptionInfo | null) {
    if (sub) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sub));
    } else {
      localStorage.removeItem(this.STORAGE_KEY);
    }
    this.subscription.set(sub);
  }

  // Load from localStorage on init
  private loadFromStorage() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const sub = JSON.parse(stored);
        this.subscription.set(sub);
      } catch (e) {
        console.error('Failed to parse stored subscription', e);
        localStorage.removeItem(this.STORAGE_KEY);
      }
    }
  }

  // Load available plans for upgrade dialog
  loadPlans() {
    return this.http
      .get<SubscriptionPlan[]>(`${environment.apiUrl}/subscription-plans`)
      .pipe(tap((plans) => this.availablePlans.set(plans)));
  }

  // Reload subscription from API and update state (after upgrade/downgrade)
  // GET /billing/subscription returns SubscriptionInfo directly (no wrapper object)
  refreshSubscription() {
    return this.http
      .get<SubscriptionInfo>(`${environment.apiUrl}/billing/subscription`)
      .pipe(tap((sub) => this.setSubscription(sub)));
  }

  // Load usage data from API
  loadUsage() {
    return this.http.get<UsageResponse>(`${environment.apiUrl}/billing/usage`);
  }

  // Clear on logout
  clear() {
    localStorage.removeItem(this.STORAGE_KEY);
    this.subscription.set(null);
  }

  // Get minimum plan needed for a feature
  getMinimumPlanForFeature(feature: string): 'negosyo' | 'kadena' {
    if (feature === 'export_data') return 'kadena';
    return 'negosyo';
  }
}
