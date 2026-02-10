import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  templateUrl: './empty-state.html',
  styleUrls: ['./empty-state.scss'],
})
export class EmptyState {
  @Input({ required: true }) title!: string;
  @Input() message?: string;
  @Input() icon = 'pi-inbox';
}
