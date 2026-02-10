import { Component, inject, signal, Output, EventEmitter, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { environment } from '../../../../../environments/environment';
import { Category } from '../../../../core/models/category.model';

@Component({
  selector: 'app-category-tabs',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './category-tabs.html',
  styleUrls: ['./category-tabs.scss'],
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
