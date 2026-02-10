import { Component, Input } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  imports: [SkeletonModule],
  templateUrl: './loading-skeleton.html',
  styleUrls: ['./loading-skeleton.scss'],
})
export class LoadingSkeleton {
  @Input() count = 5;
  @Input() height = '1.5rem';

  get rows() {
    return Array(this.count);
  }
}
