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
  templateUrl: './register.html',
  styleUrls: ['./register.scss'],
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
