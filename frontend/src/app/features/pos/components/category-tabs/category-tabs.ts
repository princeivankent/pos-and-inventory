import { Component, inject, signal, Output, EventEmitter, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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
export class CategoryTabsComponent implements OnInit, AfterViewInit {
  private http = inject(HttpClient);

  @Output() categoryChanged = new EventEmitter<string | null>();
  @ViewChild('tabsContainer') tabsContainer!: ElementRef<HTMLDivElement>;

  categories = signal<Category[]>([]);
  selectedId = signal<string | null>(null);
  showLeftFade = false;
  showRightFade = false;

  ngOnInit() {
    this.http
      .get<Category[]>(`${environment.apiUrl}/categories`)
      .subscribe((cats) => {
        this.categories.set(cats);
        setTimeout(() => this.checkScroll(), 100);
      });
  }

  ngAfterViewInit() {
    this.checkScroll();
  }

  select(id: string | null) {
    this.selectedId.set(id);
    this.categoryChanged.emit(id);
  }

  onScroll() {
    this.checkScroll();
  }

  private checkScroll() {
    if (!this.tabsContainer) return;
    const el = this.tabsContainer.nativeElement;
    this.showLeftFade = el.scrollLeft > 8;
    this.showRightFade = el.scrollLeft < el.scrollWidth - el.clientWidth - 8;
  }
}
