import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ButtonModule, PasswordModule],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.scss'],
})
export class ResetPasswordComponent implements OnInit {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  token = '';
  newPassword = '';
  confirmPassword = '';

  loading = signal(false);
  success = signal(false);
  error = signal('');

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.error.set('Invalid reset link. Please request a new one.');
    }
  }

  get passwordsMatch(): boolean {
    return this.newPassword === this.confirmPassword;
  }

  onSubmit() {
    if (!this.token || !this.newPassword || !this.confirmPassword || this.loading()) return;

    if (!this.passwordsMatch) {
      this.error.set('Passwords do not match.');
      return;
    }

    if (this.newPassword.length < 6) {
      this.error.set('Password must be at least 6 characters.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.authService.resetPassword(this.token, this.newPassword).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Invalid or expired reset link.');
      },
    });
  }
}
