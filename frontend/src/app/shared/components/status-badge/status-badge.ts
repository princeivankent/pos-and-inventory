import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.html',
  styleUrls: ['./status-badge.scss'],
})
export class StatusBadge {
  @Input({ required: true }) label!: string;
  @Input() severity: 'success' | 'danger' | 'warn' | 'info' | 'neutral' = 'neutral';
}
