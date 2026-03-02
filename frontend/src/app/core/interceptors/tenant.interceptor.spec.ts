import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { tenantInterceptor } from './tenant.interceptor';
import { StoreContextService } from '../services/store-context.service';

describe('tenantInterceptor', () => {
  function setup(storeId: string) {
    const mockStoreContext = { storeId: signal(storeId) };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([tenantInterceptor])),
        provideHttpClientTesting(),
        { provide: StoreContextService, useValue: mockStoreContext },
      ],
    });

    return {
      http: TestBed.inject(HttpClient),
      controller: TestBed.inject(HttpTestingController),
    };
  }

  it('adds X-Store-Id header when storeId is set and URL is normal', () => {
    const { http, controller } = setup('store-uuid-123');

    http.get('/api/products').subscribe();

    const req = controller.expectOne('/api/products');
    expect(req.request.headers.get('X-Store-Id')).toBe('store-uuid-123');
    req.flush([]);
    controller.verify();
  });

  it('does not add X-Store-Id when storeId is empty', () => {
    const { http, controller } = setup('');

    http.get('/api/products').subscribe();

    const req = controller.expectOne('/api/products');
    expect(req.request.headers.has('X-Store-Id')).toBe(false);
    req.flush([]);
    controller.verify();
  });

  it('does not add X-Store-Id for /auth/login URL', () => {
    const { http, controller } = setup('store-uuid-123');

    http.post('/api/auth/login', {}).subscribe();

    const req = controller.expectOne('/api/auth/login');
    expect(req.request.headers.has('X-Store-Id')).toBe(false);
    req.flush({});
    controller.verify();
  });

  it('does not add X-Store-Id for /auth/register URL', () => {
    const { http, controller } = setup('store-uuid-123');

    http.post('/api/auth/register', {}).subscribe();

    const req = controller.expectOne('/api/auth/register');
    expect(req.request.headers.has('X-Store-Id')).toBe(false);
    req.flush({});
    controller.verify();
  });
});
