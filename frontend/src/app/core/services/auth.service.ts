import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  StoreAccess,
} from '../models/user.model';

const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user';
const STORES_KEY = 'stores';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  currentUser = signal<{ id: string; email: string; full_name: string } | null>(
    this.loadUser()
  );
  stores = signal<StoreAccess[]>(this.loadStores());

  isAuthenticated = computed(() => !!this.currentUser() && !!this.getToken());

  login(credentials: LoginRequest) {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((res) => {
          localStorage.setItem(TOKEN_KEY, res.access_token);
          localStorage.setItem(REFRESH_TOKEN_KEY, res.refresh_token);
          localStorage.setItem(USER_KEY, JSON.stringify(res.user));
          localStorage.setItem(STORES_KEY, JSON.stringify(res.stores));
          this.currentUser.set(res.user);
          this.stores.set(res.stores);
        })
      );
  }

  register(data: RegisterRequest) {
    return this.http
      .post<RegisterResponse>(`${environment.apiUrl}/auth/register`, data)
      .pipe(
        tap((res) => {
          localStorage.setItem(TOKEN_KEY, res.access_token);
          localStorage.setItem(REFRESH_TOKEN_KEY, res.refresh_token);
          localStorage.setItem(USER_KEY, JSON.stringify(res.user));
          localStorage.setItem(STORES_KEY, JSON.stringify(res.stores));
          this.currentUser.set(res.user);
          this.stores.set(res.stores);
        })
      );
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(STORES_KEY);
    localStorage.removeItem('active_store');
    this.currentUser.set(null);
    this.stores.set([]);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private loadUser() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  private loadStores(): StoreAccess[] {
    const raw = localStorage.getItem(STORES_KEY);
    return raw ? JSON.parse(raw) : [];
  }
}
