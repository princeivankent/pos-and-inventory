import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { errorInterceptor } from './error.interceptor';
import { ToastService } from '../services/toast.service';
import { AuthService } from '../services/auth.service';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let mockToast: { error: ReturnType<typeof vi.fn>; success: ReturnType<typeof vi.fn> };
  let mockAuth: { getToken: ReturnType<typeof vi.fn>; logout: ReturnType<typeof vi.fn> };

  function flush(url: string, status: number, body: object = { message: 'Some error' }) {
    http.get(url).subscribe({ error: () => {} });
    const req = controller.expectOne(url);
    req.flush(body, { status, statusText: 'Error' });
  }

  beforeEach(() => {
    mockToast = { error: vi.fn(), success: vi.fn() };
    mockAuth = { getToken: vi.fn().mockReturnValue('token'), logout: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: ToastService, useValue: mockToast },
        { provide: AuthService, useValue: mockAuth },
      ],
    });

    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  // 401 — non-auth URL, token exists → logout + Session Expired
  it('401 non-auth URL with token: calls logout and shows Session Expired', () => {
    flush('/api/products', 401);
    expect(mockAuth.logout).toHaveBeenCalled();
    expect(mockToast.error).toHaveBeenCalledWith('Session Expired', 'Please sign in again');
  });

  // 401 — non-auth URL, no token → no logout, no toast (avoid cascade)
  it('401 non-auth URL without token: no logout, no toast', () => {
    mockAuth.getToken.mockReturnValue(null);
    flush('/api/products', 401);
    expect(mockAuth.logout).not.toHaveBeenCalled();
    expect(mockToast.error).not.toHaveBeenCalled();
  });

  // 401 — auth URL → Login Failed
  it('401 on /auth/login URL: shows Login Failed toast', () => {
    flush('/api/auth/login', 401, { message: 'Invalid credentials' });
    expect(mockAuth.logout).not.toHaveBeenCalled();
    expect(mockToast.error).toHaveBeenCalledWith('Login Failed', 'Invalid credentials');
  });

  // 402 — Subscription Required
  it('402: shows Subscription Required toast', () => {
    flush('/api/products', 402);
    expect(mockToast.error).toHaveBeenCalledWith(
      'Subscription Required',
      expect.any(String),
    );
  });

  // 403 — feature gate message → Feature Locked
  it('403 with feature gate message: shows Feature Locked toast', () => {
    flush('/api/reports/sales', 403, { message: 'Plan does not include this feature' });
    expect(mockToast.error).toHaveBeenCalledWith('Feature Locked', expect.any(String));
  });

  it('403 with Please upgrade message: shows Feature Locked toast', () => {
    flush('/api/reports/sales', 403, { message: 'Please upgrade your plan' });
    expect(mockToast.error).toHaveBeenCalledWith('Feature Locked', expect.any(String));
  });

  // 403 — generic → Access Denied
  it('403 generic: shows Access Denied toast with message', () => {
    flush('/api/users', 403, { message: 'Forbidden' });
    expect(mockToast.error).toHaveBeenCalledWith('Access Denied', 'Forbidden');
  });

  // 404 — Not Found
  it('404: shows Not Found toast', () => {
    flush('/api/products/nonexistent', 404, { message: 'Product not found' });
    expect(mockToast.error).toHaveBeenCalledWith('Not Found', 'Product not found');
  });

  // 0 — Connection Error
  it('status 0: shows Connection Error toast', () => {
    flush('/api/products', 0, {});
    expect(mockToast.error).toHaveBeenCalledWith('Connection Error', 'Unable to reach the server');
  });

  // 500 — default branch
  it('500: shows generic Error toast', () => {
    flush('/api/products', 500, { message: 'Internal server error' });
    expect(mockToast.error).toHaveBeenCalledWith('Error', 'Internal server error');
  });

  // 2xx — no toast
  it('2xx success: no toast called', () => {
    http.get('/api/products').subscribe();
    const req = controller.expectOne('/api/products');
    req.flush([]);
    expect(mockToast.error).not.toHaveBeenCalled();
  });

  // Error is always re-thrown
  it('re-throws error so subscriber error handler fires', () => {
    let errorFired = false;
    http.get('/api/products').subscribe({ error: () => (errorFired = true) });
    const req = controller.expectOne('/api/products');
    req.flush({ message: 'fail' }, { status: 500, statusText: 'Error' });
    expect(errorFired).toBe(true);
  });
});
