import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { SubscriptionService } from './subscription.service';
import { SubscriptionInfo } from '../models/subscription.model';

function makeSubscription(overrides: Partial<SubscriptionInfo> = {}): SubscriptionInfo {
  return {
    status: 'active',
    plan_code: 'negosyo',
    plan_name: 'Negosyo',
    features: { reports: true, utang_management: true, fifo_inventory: true },
    usage: { max_stores: 3, max_users_per_store: 5, max_products_per_store: 2000 },
    ...overrides,
  };
}

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let controller: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(SubscriptionService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  // --- Init ---
  it('subscription signal is null when localStorage is empty', () => {
    expect(service.subscription()).toBeNull();
  });

  it('loads subscription from localStorage on init', () => {
    const sub = makeSubscription();
    localStorage.setItem('subscription', JSON.stringify(sub));

    // Re-create service to trigger constructor
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fresh = TestBed.inject(SubscriptionService);
    expect(fresh.subscription()?.plan_code).toBe('negosyo');
    TestBed.inject(HttpTestingController).verify();
  });

  it('handles corrupt JSON in localStorage gracefully', () => {
    localStorage.setItem('subscription', 'NOT_VALID_JSON');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fresh = TestBed.inject(SubscriptionService);
    expect(fresh.subscription()).toBeNull();
    TestBed.inject(HttpTestingController).verify();
  });

  // --- hasActiveSubscription ---
  it('hasActiveSubscription is false when null', () => {
    expect(service.hasActiveSubscription()).toBeFalsy();
  });

  it('hasActiveSubscription is true for active status', () => {
    service.setSubscription(makeSubscription({ status: 'active' }));
    expect(service.hasActiveSubscription()).toBeTruthy();
  });

  it('hasActiveSubscription is true for trial status', () => {
    service.setSubscription(makeSubscription({ status: 'trial' }));
    expect(service.hasActiveSubscription()).toBeTruthy();
  });

  it('hasActiveSubscription is false for cancelled status', () => {
    service.setSubscription(makeSubscription({ status: 'cancelled' }));
    expect(service.hasActiveSubscription()).toBeFalsy();
  });

  it('hasActiveSubscription is false for expired status', () => {
    service.setSubscription(makeSubscription({ status: 'expired' }));
    expect(service.hasActiveSubscription()).toBeFalsy();
  });

  // --- currentPlan ---
  it('currentPlan is null when no subscription', () => {
    expect(service.currentPlan()).toBeNull();
  });

  it('currentPlan returns plan_code when subscription set', () => {
    service.setSubscription(makeSubscription({ plan_code: 'kadena' }));
    expect(service.currentPlan()).toBe('kadena');
  });

  // --- isTrialing ---
  it('isTrialing is false when status is active', () => {
    service.setSubscription(makeSubscription({ status: 'active' }));
    expect(service.isTrialing()).toBe(false);
  });

  it('isTrialing is true when status is trial', () => {
    service.setSubscription(makeSubscription({ status: 'trial' }));
    expect(service.isTrialing()).toBe(true);
  });

  // --- hasFeature ---
  it('hasFeature returns false when subscription is null', () => {
    expect(service.hasFeature('reports')).toBe(false);
  });

  it('hasFeature returns true when feature key is true', () => {
    service.setSubscription(makeSubscription({ features: { reports: true } }));
    expect(service.hasFeature('reports')).toBe(true);
  });

  it('hasFeature returns false when feature key is absent', () => {
    service.setSubscription(makeSubscription({ features: {} }));
    expect(service.hasFeature('export_data')).toBe(false);
  });

  it('hasFeature returns false when feature key is false', () => {
    service.setSubscription(makeSubscription({ features: { reports: false } }));
    expect(service.hasFeature('reports')).toBe(false);
  });

  // --- hasFeatureSignal ---
  it('hasFeatureSignal returns computed that reflects current subscription', () => {
    const sig = service.hasFeatureSignal('reports');
    expect(sig()).toBe(false);
    service.setSubscription(makeSubscription({ features: { reports: true } }));
    expect(sig()).toBe(true);
    service.clear();
    expect(sig()).toBe(false);
  });

  // --- setSubscription ---
  it('setSubscription updates signal and persists to localStorage', () => {
    const sub = makeSubscription();
    service.setSubscription(sub);
    expect(service.subscription()).toEqual(sub);
    const stored = JSON.parse(localStorage.getItem('subscription')!);
    expect(stored.plan_code).toBe('negosyo');
  });

  it('setSubscription with null clears signal and localStorage', () => {
    service.setSubscription(makeSubscription());
    service.setSubscription(null);
    expect(service.subscription()).toBeNull();
    expect(localStorage.getItem('subscription')).toBeNull();
  });

  // --- clear ---
  it('clear sets signal to null and removes localStorage key', () => {
    service.setSubscription(makeSubscription());
    service.clear();
    expect(service.subscription()).toBeNull();
    expect(localStorage.getItem('subscription')).toBeNull();
  });

  // --- loadPlans ---
  it('loadPlans GETs /api/subscription-plans and updates availablePlans', () => {
    const plans = [{ id: '1', plan_code: 'tindahan', name: 'Tindahan', price_php: 799, max_stores: 1, max_users_per_store: 2, max_products_per_store: 500, features: {}, sort_order: 1 }];
    service.loadPlans().subscribe();
    const req = controller.expectOne('/api/subscription-plans');
    expect(req.request.method).toBe('GET');
    req.flush(plans);
    expect(service.availablePlans().length).toBe(1);
    expect(service.availablePlans()[0].plan_code).toBe('tindahan');
  });

  // --- refreshSubscription ---
  it('refreshSubscription GETs /api/billing/subscription and calls setSubscription', () => {
    const sub = makeSubscription({ plan_code: 'kadena' });
    service.refreshSubscription().subscribe();
    const req = controller.expectOne('/api/billing/subscription');
    expect(req.request.method).toBe('GET');
    req.flush(sub);
    expect(service.subscription()?.plan_code).toBe('kadena');
  });

  // --- loadUsage ---
  it('loadUsage GETs /api/billing/usage and returns observable', () => {
    const usage = { subscription: { id: '1', status: 'active', plan_code: 'negosyo', plan_name: 'Negosyo' }, stores: { current: 1, limit: 3 }, store_details: [], features: {} };
    let received: any;
    service.loadUsage().subscribe((u) => (received = u));
    const req = controller.expectOne('/api/billing/usage');
    req.flush(usage);
    expect(received.stores.limit).toBe(3);
  });
});
