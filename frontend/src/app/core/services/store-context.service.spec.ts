import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { StoreContextService } from './store-context.service';
import { AuthService } from './auth.service';
import { StoreAccess } from '../models/user.model';
import { UserRole } from '../models/enums';

function makeStore(overrides: Partial<StoreAccess> = {}): StoreAccess {
  return {
    id: 'store-1',
    name: 'My Store',
    role: UserRole.CASHIER,
    is_default: false,
    ...overrides,
  };
}

describe('StoreContextService', () => {
  let service: StoreContextService;
  let controller: HttpTestingController;
  let storesSignal: ReturnType<typeof signal<StoreAccess[]>>;

  beforeEach(() => {
    localStorage.clear();
    storesSignal = signal<StoreAccess[]>([]);

    const mockAuth = { stores: storesSignal };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: mockAuth },
      ],
    });

    service = TestBed.inject(StoreContextService);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  // --- Init ---
  it('activeStore is null when localStorage is empty', () => {
    expect(service.activeStore()).toBeNull();
  });

  it('loads activeStore from localStorage on init', () => {
    const store = makeStore({ id: 'store-from-storage' });
    localStorage.setItem('active_store', JSON.stringify(store));

    TestBed.resetTestingModule();
    storesSignal = signal<StoreAccess[]>([]);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { stores: storesSignal } },
      ],
    });
    const fresh = TestBed.inject(StoreContextService);
    expect(fresh.activeStore()?.id).toBe('store-from-storage');
    TestBed.inject(HttpTestingController).verify();
  });

  // --- storeId ---
  it('storeId returns empty string when no active store', () => {
    expect(service.storeId()).toBe('');
  });

  it('storeId returns store id when active store set', () => {
    service['setActiveStore'](makeStore({ id: 'abc-123' }));
    expect(service.storeId()).toBe('abc-123');
  });

  // --- currentRole ---
  it('currentRole is CASHIER when no active store', () => {
    expect(service.currentRole()).toBe(UserRole.CASHIER);
  });

  it('currentRole is ADMIN when store role is ADMIN', () => {
    service['setActiveStore'](makeStore({ role: UserRole.ADMIN }));
    expect(service.currentRole()).toBe(UserRole.ADMIN);
  });

  it('currentRole is CASHIER when store role is CASHIER', () => {
    service['setActiveStore'](makeStore({ role: UserRole.CASHIER }));
    expect(service.currentRole()).toBe(UserRole.CASHIER);
  });

  // --- isAdmin ---
  it('isAdmin is false when no active store', () => {
    expect(service.isAdmin()).toBe(false);
  });

  it('isAdmin is true when role is ADMIN', () => {
    service['setActiveStore'](makeStore({ role: UserRole.ADMIN }));
    expect(service.isAdmin()).toBe(true);
  });

  it('isAdmin is false when role is CASHIER', () => {
    service['setActiveStore'](makeStore({ role: UserRole.CASHIER }));
    expect(service.isAdmin()).toBe(false);
  });

  // --- initializeStore ---
  it('initializeStore is no-op when stores list is empty', () => {
    storesSignal.set([]);
    service.initializeStore();
    expect(service.activeStore()).toBeNull();
  });

  it('initializeStore picks is_default store', () => {
    storesSignal.set([
      makeStore({ id: 'first', is_default: false }),
      makeStore({ id: 'default', is_default: true }),
    ]);
    service.initializeStore();
    expect(service.activeStore()?.id).toBe('default');
  });

  it('initializeStore falls back to first store when none is default', () => {
    storesSignal.set([
      makeStore({ id: 'first', is_default: false }),
      makeStore({ id: 'second', is_default: false }),
    ]);
    service.initializeStore();
    expect(service.activeStore()?.id).toBe('first');
  });

  it('initializeStore persists selected store to localStorage', () => {
    storesSignal.set([makeStore({ id: 'persisted', is_default: true })]);
    service.initializeStore();
    const stored = JSON.parse(localStorage.getItem('active_store')!);
    expect(stored.id).toBe('persisted');
  });

  // --- switchStore ---
  it('switchStore POSTs to /api/auth/switch-store and updates activeStore', () => {
    const newStore = makeStore({ id: 'store-2', name: 'Second Store', role: UserRole.ADMIN });
    service.switchStore('store-2').subscribe();

    const req = controller.expectOne('/api/auth/switch-store');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ store_id: 'store-2' });
    req.flush({ store: newStore });

    expect(service.activeStore()?.id).toBe('store-2');
    expect(localStorage.getItem('active_store')).toContain('store-2');
  });
});
