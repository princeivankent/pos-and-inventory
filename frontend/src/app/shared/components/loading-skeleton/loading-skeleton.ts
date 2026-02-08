import { Component, Input } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  imports: [SkeletonModule],
  template: `
    <div class="skeleton-container">
      @for (_ of rows; track $index) {
        <p-skeleton [height]="height" styleClass="mb-2" />
      }
    </div>
  `,
  styles: `
    .skeleton-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
  `,
})
export class LoadingSkeleton {
  @Input() count = 5;
  @Input() height = '1.5rem';

  get rows() {
    return Array(this.count);
  }
}
