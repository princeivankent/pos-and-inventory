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
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
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
