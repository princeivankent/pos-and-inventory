import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { AuthService } from '../../../core/services/auth.service';
import { StoreContextService } from '../../../core/services/store-context.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ButtonModule, InputTextModule, PasswordModule, CheckboxModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class LoginComponent implements OnInit {
  private auth = inject(AuthService);
  private storeContext = inject(StoreContextService);
  private toast = inject(ToastService);
  private router = inject(Router);

  email = '';
  password = '';
  rememberMe = false;
  loading = signal(false);

  ngOnInit() {
    // Load remembered email if exists
    const rememberedEmail = localStorage.getItem('remembered_email');
    if (rememberedEmail) {
      this.email = rememberedEmail;
      this.rememberMe = true;
    }
  }

  onLogin() {
    this.loading.set(true);

    // Save email to localStorage if "Remember me" is checked
    if (this.rememberMe) {
      localStorage.setItem('remembered_email', this.email);
    } else {
      localStorage.removeItem('remembered_email');
    }

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

  onForgotPassword(event: Event) {
    event.preventDefault();
    // TODO: Implement forgot password functionality
    this.toast.info('Forgot password feature coming soon!');
  }
}
