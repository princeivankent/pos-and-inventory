import { Component, inject, signal, Output, EventEmitter, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { environment } from '../../../../../environments/environment';
import { Category } from '../../../../core/models/category.model';

@Component({
  selector: 'app-category-tabs',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <div class="category-tabs">
      <p-button
        [label]="'All'"
        [outlined]="selectedId() !== null"
        [severity]="selectedId() === null ? undefined : 'secondary'"
        size="small"
        (onClick)="select(null)"
      />
      @for (cat of categories(); track cat.id) {
        <p-button
          [label]="cat.name"
          [outlined]="selectedId() !== cat.id"
          [severity]="selectedId() === cat.id ? undefined : 'secondary'"
          size="small"
          (onClick)="select(cat.id)"
        />
      }
    </div>
  `,
  styles: `
    .category-tabs {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      padding-bottom: 0.25rem;
      &::-webkit-scrollbar { height: 4px; }
      &::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 2px; }
    }
  `,
})
export class CategoryTabsComponent implements OnInit {
  private http = inject(HttpClient);

  @Output() categoryChanged = new EventEmitter<string | null>();

  categories = signal<Category[]>([]);
  selectedId = signal<string | null>(null);

  ngOnInit() {
    this.http
      .get<Category[]>(`${environment.apiUrl}/categories`)
      .subscribe((cats) => this.categories.set(cats));
  }

  select(id: string | null) {
    this.selectedId.set(id);
    this.categoryChanged.emit(id);
  }
}
