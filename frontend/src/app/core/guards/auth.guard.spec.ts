import { describe, it, expect, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  function setup(isAuthenticated: boolean) {
    const mockAuth = { isAuthenticated: vi.fn().mockReturnValue(isAuthenticated) };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuth },
      ],
    });

    const mockRoute = {} as ActivatedRouteSnapshot;
    const mockState = { url: '/dashboard' } as RouterStateSnapshot;
    return { mockAuth, mockRoute, mockState };
  }

  it('returns true when authenticated', () => {
    const { mockRoute, mockState } = setup(true);
    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
    expect(result).toBe(true);
  });

  it('returns UrlTree to /login when not authenticated', () => {
    const { mockRoute, mockState } = setup(false);
    const result = TestBed.runInInjectionContext(() => authGuard(mockRoute, mockState));
    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/login');
  });
});
