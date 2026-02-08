import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../../../core/services/auth.service';
import { StoreContextService } from '../../../core/services/store-context.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ButtonModule, InputTextModule, PasswordModule, RouterLink],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-header">
          <h1>POS & Inventory</h1>
          <p>Sign in to your account</p>
        </div>

        <form (ngSubmit)="onLogin()" class="login-form">
          <div class="field">
            <label for="email">Email</label>
            <input
              pInputText
              id="email"
              type="email"
              [(ngModel)]="email"
              name="email"
              placeholder="Enter your email"
              class="w-full"
              required
            />
          </div>

          <div class="field">
            <label for="password">Password</label>
            <p-password
              id="password"
              [(ngModel)]="password"
              name="password"
              placeholder="Enter your password"
              [toggleMask]="true"
              [feedback]="false"
              styleClass="w-full"
              inputStyleClass="w-full"
            />
          </div>

          <p-button
            type="submit"
            label="Sign In"
            styleClass="w-full"
            [loading]="loading()"
            [disabled]="!email || !password"
          />
        </form>

        <div class="login-footer">
          <span>Don't have an account?</span>
          <a routerLink="/register">Register</a>
        </div>
      </div>
    </div>
  `,
  styles: `
    .login-page {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: var(--bg-secondary);
    }
    .login-card {
      width: 100%;
      max-width: 400px;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      padding: 2.5rem;
    }
    .login-header {
      text-align: center;
      margin-bottom: 2rem;
      h1 {
        font-size: 1.5rem;
        color: var(--color-primary);
        margin-bottom: 0.5rem;
      }
      p {
        color: var(--text-secondary);
        font-size: 0.875rem;
        margin: 0;
      }
    }
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-primary);
      }
    }
    .w-full { width: 100%; }
    .login-footer {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
      a {
        color: var(--color-primary);
        text-decoration: none;
        margin-left: 0.25rem;
        font-weight: 500;
        &:hover { text-decoration: underline; }
      }
    }
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private storeContext = inject(StoreContextService);
  private toast = inject(ToastService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);

  onLogin() {
    this.loading.set(true);
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.storeContext.initializeStore();
        this.router.navigate(['/dashboard']);
        this.toast.success('Welcome back!');
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
