import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
  const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

  function setup(token: string | null) {
    const mockAuth = { getToken: vi.fn().mockReturnValue(token) };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: mockAuth },
      ],
    });

    return {
      http: TestBed.inject(HttpClient),
      controller: TestBed.inject(HttpTestingController),
    };
  }

  it('adds Authorization header when token is present', () => {
    const { http, controller } = setup('my-token-abc');

    http.get('/api/products').subscribe();

    const req = controller.expectOne('/api/products');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-token-abc');
    req.flush({});
    controller.verify();
  });

  it('does not add Authorization header when token is null', () => {
    const { http, controller } = setup(null);

    http.get('/api/products').subscribe();

    const req = controller.expectOne('/api/products');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
    controller.verify();
  });

  it('passes the request through to next handler', () => {
    const { http, controller } = setup('tok');
    let received = false;
    http.get('/api/products').subscribe(() => (received = true));

    const req = controller.expectOne('/api/products');
    req.flush({ data: 'ok' });
    controller.verify();

    expect(received).toBe(true);
  });

  it('does not log token details', () => {
    const { http, controller } = setup('secret-token');

    http.get('/api/products').subscribe();

    const req = controller.expectOne('/api/products');
    req.flush({});
    controller.verify();

    expect(consoleLogSpy).not.toHaveBeenCalled();
  });
});
