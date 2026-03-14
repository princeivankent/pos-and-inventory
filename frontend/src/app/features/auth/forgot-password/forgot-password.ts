import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../../core/services/auth.service';
import { EmailService } from '../../../core/services/email.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ButtonModule, InputTextModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.scss'],
})
export class ForgotPasswordComponent {
  private authService = inject(AuthService);
  private emailService = inject(EmailService);

  email = '';
  loading = signal(false);
  submitted = signal(false);
  error = signal('');

  async onSubmit() {
    if (!this.email || this.loading()) return;

    this.loading.set(true);
    this.error.set('');

    this.authService.forgotPassword(this.email).subscribe({
      next: async (res) => {
        // If backend returned reset details, send email via EmailJS
        if (res.reset_link && res.user_email) {
          try {
            await this.emailService.sendPasswordResetEmail(
              res.user_email,
              res.user_name || 'User',
              res.reset_link,
            );
          } catch {
            // EmailJS failure is non-fatal — still show success state
          }
        }
        this.loading.set(false);
        this.submitted.set(true);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Something went wrong. Please try again.');
      },
    });
  }
}
