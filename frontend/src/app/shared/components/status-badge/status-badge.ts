import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="badge" [ngClass]="'badge--' + severity">{{ label }}</span>`,
  styles: `
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.625rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
      line-height: 1;
    }
    .badge--success { background: #ecfdf5; color: #059669; }
    .badge--danger { background: #fef2f2; color: #dc2626; }
    .badge--warn { background: #fffbeb; color: #d97706; }
    .badge--info { background: #eff6ff; color: #2563eb; }
    .badge--neutral { background: #f3f4f6; color: #6b7280; }
  `,
})
export class StatusBadge {
  @Input({ required: true }) label!: string;
  @Input() severity: 'success' | 'danger' | 'warn' | 'info' | 'neutral' = 'neutral';
}
