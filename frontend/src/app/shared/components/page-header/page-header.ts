import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <div class="page-header">
      <div>
        <h1>{{ title }}</h1>
        @if (subtitle) {
          <p class="subtitle">{{ subtitle }}</p>
        }
      </div>
      <div class="actions">
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    h1 {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0;
      color: var(--text-primary);
    }
    .subtitle {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin: 0.25rem 0 0;
    }
    .actions {
      display: flex;
      gap: 0.5rem;
    }
  `,
})
export class PageHeader {
  @Input({ required: true }) title!: string;
  @Input() subtitle?: string;
}
