import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { SubscriptionService } from './subscription.service';
import { UserRole } from '../models/enums';
import { SubscriptionInfo } from '../models/subscription.model';

const MOCK_USER = { id: 'u1', email: 'test@test.com', full_name: 'Test User' };
const MOCK_STORE = { id: 's1', name: 'Store 1', role: UserRole.CASHIER, is_default: true };
const MOCK_LOGIN_RESP = {
  access_token: 'access-tok',
  refresh_token: 'refresh-tok',
  user: MOCK_USER,
  stores: [MOCK_STORE],
  default_store: MOCK_STORE,
};

function makeSubscription(): SubscriptionInfo {
  return {
    status: 'trial',
    plan_code: 'tindahan',
    plan_name: 'Tindahan',
    features: { pos: true },
    usage: { max_stores: 1, max_users_per_store: 2, max_products_per_store: 500 },
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let controller: HttpTestingController;
  let mockSubscriptionService: { setSubscription: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    mockSubscriptionService = {
      setSubscription: vi.fn(),
      clear: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: SubscriptionService, useValue: mockSubscriptionService },
      ],
    });

    service = TestBed.inject(AuthService);
    controller = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => controller.verify());

  // --- Init ---
  it('currentUser is null when localStorage is empty', () => {
    expect(service.currentUser()).toBeNull();
  });

  it('loads currentUser from localStorage on init', () => {
    localStorage.setItem('user', JSON.stringify(MOCK_USER));

    TestBed.resetTestingModule();
    mockSubscriptionService = { setSubscription: vi.fn(), clear: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: SubscriptionService, useValue: mockSubscriptionService },
      ],
    });
    const fresh = TestBed.inject(AuthService);
    expect(fresh.currentUser()?.email).toBe('test@test.com');
    TestBed.inject(HttpTestingController).verify();
  });

  it('loads stores from localStorage on init', () => {
    localStorage.setItem('stores', JSON.stringify([MOCK_STORE]));

    TestBed.resetTestingModule();
    mockSubscriptionService = { setSubscription: vi.fn(), clear: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: SubscriptionService, useValue: mockSubscriptionService },
      ],
    });
    const fresh = TestBed.inject(AuthService);
    expect(fresh.stores().length).toBe(1);
    TestBed.inject(HttpTestingController).verify();
  });

  // --- isAuthenticated ---
  it('isAuthenticated is false when no user', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('isAuthenticated is false when user set but no token', () => {
    service.currentUser.set(MOCK_USER);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('isAuthenticated is true when both user and token exist', () => {
    service.currentUser.set(MOCK_USER);
    localStorage.setItem('access_token', 'tok');
    expect(service.isAuthenticated()).toBe(true);
  });

  // --- getToken ---
  it('getToken returns null when no token in localStorage', () => {
    expect(service.getToken()).toBeNull();
  });

  it('getToken returns token string when present', () => {
    localStorage.setItem('access_token', 'my-tok');
    expect(service.getToken()).toBe('my-tok');
  });

  // --- login ---
  it('login POSTs to /api/auth/login and stores tokens/user/stores', () => {
    service.login({ email: 'a@b.com', password: 'pass' }).subscribe();

    const req = controller.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(MOCK_LOGIN_RESP);

    expect(localStorage.getItem('access_token')).toBe('access-tok');
    expect(localStorage.getItem('refresh_token')).toBe('refresh-tok');
    expect(JSON.parse(localStorage.getItem('user')!).email).toBe('test@test.com');
    expect(JSON.parse(localStorage.getItem('stores')!).length).toBe(1);
    expect(service.currentUser()?.id).toBe('u1');
    expect(service.stores().length).toBe(1);
  });

  it('login calls subscriptionService.setSubscription when subscription present', () => {
    service.login({ email: 'a@b.com', password: 'pass' }).subscribe();
    const req = controller.expectOne('/api/auth/login');
    req.flush({ ...MOCK_LOGIN_RESP, subscription: makeSubscription() });
    expect(mockSubscriptionService.setSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ plan_code: 'tindahan' }),
    );
  });

  it('login does not call setSubscription when subscription absent', () => {
    service.login({ email: 'a@b.com', password: 'pass' }).subscribe();
    const req = controller.expectOne('/api/auth/login');
    req.flush(MOCK_LOGIN_RESP); // no subscription field
    expect(mockSubscriptionService.setSubscription).not.toHaveBeenCalled();
  });

  // --- register ---
  it('register POSTs to /api/auth/register and stores data', () => {
    service.register({ email: 'a@b.com', password: 'pass', full_name: 'Test', store_name: 'Store' }).subscribe();
    const req = controller.expectOne('/api/auth/register');
    expect(req.request.method).toBe('POST');
    req.flush(MOCK_LOGIN_RESP);
    expect(service.currentUser()?.id).toBe('u1');
  });

  it('register calls setSubscription when subscription present', () => {
    service.register({ email: 'a@b.com', password: 'pass', full_name: 'Test', store_name: 'Store' }).subscribe();
    const req = controller.expectOne('/api/auth/register');
    req.flush({ ...MOCK_LOGIN_RESP, subscription: makeSubscription() });
    expect(mockSubscriptionService.setSubscription).toHaveBeenCalled();
  });

  // --- logout ---
  it('logout removes all localStorage keys and resets signals', () => {
    localStorage.setItem('access_token', 'tok');
    localStorage.setItem('refresh_token', 'rtok');
    localStorage.setItem('user', JSON.stringify(MOCK_USER));
    localStorage.setItem('stores', JSON.stringify([MOCK_STORE]));
    localStorage.setItem('active_store', JSON.stringify(MOCK_STORE));
    service.currentUser.set(MOCK_USER);
    service.stores.set([MOCK_STORE]);

    service.logout();

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(localStorage.getItem('stores')).toBeNull();
    expect(localStorage.getItem('active_store')).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.stores()).toEqual([]);
  });

  it('logout calls subscriptionService.clear()', () => {
    service.logout();
    expect(mockSubscriptionService.clear).toHaveBeenCalled();
  });

  it('logout navigates to /login', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    service.logout();
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });
});
