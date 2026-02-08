import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="empty-state">
      <i [class]="'pi ' + icon" class="empty-icon"></i>
      <h3>{{ title }}</h3>
      @if (message) {
        <p>{{ message }}</p>
      }
      <ng-content />
    </div>
  `,
  styles: `
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1.5rem;
      text-align: center;
    }
    .empty-icon {
      font-size: 2.5rem;
      color: var(--text-tertiary, #9ca3af);
      margin-bottom: 1rem;
    }
    h3 {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.5rem;
    }
    p {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin: 0;
      max-width: 24rem;
    }
  `,
})
export class EmptyState {
  @Input({ required: true }) title!: string;
  @Input() message?: string;
  @Input() icon = 'pi-inbox';
}
