import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { Category } from '../../../../core/models/category.model';

@Component({
  selector: 'app-category-filter',
  standalone: true,
  imports: [ButtonModule],
  templateUrl: './category-filter.html',
  styleUrls: ['./category-filter.scss'],
})
export class CategoryFilterComponent implements AfterViewInit {
  @Input() categories: Category[] = [];
  @Input() selectedCategoryId: string | null = null;
  @Output() categoryChange = new EventEmitter<string | null>();
  @ViewChild('filterContainer') filterContainer!: ElementRef<HTMLDivElement>;

  showLeftFade = false;
  showRightFade = false;

  ngAfterViewInit() {
    setTimeout(() => this.checkScroll(), 100);
  }

  selectCategory(categoryId: string | null) {
    this.categoryChange.emit(categoryId);
  }

  onScroll() {
    this.checkScroll();
  }

  private checkScroll() {
    if (!this.filterContainer) return;
    const el = this.filterContainer.nativeElement;
    this.showLeftFade = el.scrollLeft > 8;
    this.showRightFade = el.scrollLeft < el.scrollWidth - el.clientWidth - 8;
  }
}
