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
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, ButtonModule, InputTextModule, PasswordModule, RouterLink],
  template: `
    <div class="register-page">
      <div class="register-card">
        <div class="register-header">
          <h1>Create Account</h1>
          <p>Set up your store in minutes</p>
        </div>

        <form (ngSubmit)="onRegister()" class="register-form">
          <div class="field">
            <label for="fullName">Full Name</label>
            <input
              pInputText
              id="fullName"
              [(ngModel)]="fullName"
              name="fullName"
              placeholder="Your full name"
              class="w-full"
              required
            />
          </div>

          <div class="field">
            <label for="storeName">Store Name</label>
            <input
              pInputText
              id="storeName"
              [(ngModel)]="storeName"
              name="storeName"
              placeholder="Your store name"
              class="w-full"
              required
            />
          </div>

          <div class="field">
            <label for="email">Email</label>
            <input
              pInputText
              id="email"
              type="email"
              [(ngModel)]="email"
              name="email"
              placeholder="your@email.com"
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
              placeholder="Minimum 6 characters"
              [toggleMask]="true"
              styleClass="w-full"
              inputStyleClass="w-full"
            />
          </div>

          <p-button
            type="submit"
            label="Create Account"
            styleClass="w-full"
            [loading]="loading()"
            [disabled]="!fullName || !storeName || !email || !password"
          />
        </form>

        <div class="register-footer">
          <span>Already have an account?</span>
          <a routerLink="/login">Sign in</a>
        </div>
      </div>
    </div>
  `,
  styles: `
    .register-page {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: var(--bg-secondary);
    }
    .register-card {
      width: 100%;
      max-width: 400px;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      padding: 2.5rem;
    }
    .register-header {
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
    .register-form {
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
    .register-footer {
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
export class RegisterComponent {
  private auth = inject(AuthService);
  private storeContext = inject(StoreContextService);
  private toast = inject(ToastService);
  private router = inject(Router);

  fullName = '';
  storeName = '';
  email = '';
  password = '';
  loading = signal(false);

  onRegister() {
    this.loading.set(true);
    this.auth
      .register({
        full_name: this.fullName,
        store_name: this.storeName,
        email: this.email,
        password: this.password,
      })
      .subscribe({
        next: () => {
          this.storeContext.initializeStore();
          this.router.navigate(['/dashboard']);
          this.toast.success('Welcome!', 'Your account is ready.');
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }
}
