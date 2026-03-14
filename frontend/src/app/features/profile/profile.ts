import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { PageHeader } from '../../shared/components/page-header/page-header';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, PasswordModule, TooltipModule, PageHeader],
  templateUrl: './profile.html',
  styleUrls: ['./profile.scss'],
})
export class ProfileComponent {
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  currentUser = this.authService.currentUser;

  // Profile form
  fullName = signal(this.currentUser()?.full_name ?? '');
  savingProfile = signal(false);

  // Password form
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  savingPassword = signal(false);
  passwordError = signal('');

  initials = computed(() => {
    const name = this.currentUser()?.full_name ?? '';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  });

  get passwordsMatch(): boolean {
    return this.newPassword === this.confirmPassword;
  }

  saveProfile() {
    if (!this.fullName().trim() || this.savingProfile()) return;

    this.savingProfile.set(true);
    this.authService.updateProfile({ full_name: this.fullName().trim() }).subscribe({
      next: () => {
        this.savingProfile.set(false);
        this.toast.success('Profile updated', 'Your name has been saved.');
      },
      error: () => {
        this.savingProfile.set(false);
        this.toast.error('Error', 'Failed to update profile.');
      },
    });
  }

  savePassword() {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword || this.savingPassword()) return;

    if (!this.passwordsMatch) {
      this.passwordError.set('New passwords do not match.');
      return;
    }

    if (this.newPassword.length < 6) {
      this.passwordError.set('New password must be at least 6 characters.');
      return;
    }

    this.savingPassword.set(true);
    this.passwordError.set('');

    this.authService
      .changePassword({ current_password: this.currentPassword, new_password: this.newPassword })
      .subscribe({
        next: () => {
          this.savingPassword.set(false);
          this.currentPassword = '';
          this.newPassword = '';
          this.confirmPassword = '';
          this.toast.success('Password changed', 'Your password has been updated.');
        },
        error: (err) => {
          this.savingPassword.set(false);
          this.passwordError.set(err?.error?.message || 'Failed to change password.');
        },
      });
  }
}
