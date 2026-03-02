import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { signal } from '@angular/core';
import { adminGuard } from './role.guard';
import { StoreContextService } from '../services/store-context.service';
import { UserRole } from '../models/enums';

describe('adminGuard', () => {
  function setup(role: UserRole) {
    const mockStoreContext = { currentRole: signal(role) };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: StoreContextService, useValue: mockStoreContext },
      ],
    });

    const mockRoute = {} as ActivatedRouteSnapshot;
    const mockState = { url: '/reports' } as RouterStateSnapshot;
    return { mockRoute, mockState };
  }

  it('returns true when role is ADMIN', () => {
    const { mockRoute, mockState } = setup(UserRole.ADMIN);
    const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
    expect(result).toBe(true);
  });

  it('returns UrlTree to /dashboard when role is CASHIER', () => {
    const { mockRoute, mockState } = setup(UserRole.CASHIER);
    const result = TestBed.runInInjectionContext(() => adminGuard(mockRoute, mockState));
    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/dashboard');
  });
});
