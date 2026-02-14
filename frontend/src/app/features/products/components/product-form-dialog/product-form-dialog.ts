import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CreateProductDto } from '../../../../core/models/product.model';
import { Category } from '../../../../core/models/category.model';

@Component({
  selector: 'app-product-form-dialog',
  standalone: true,
  imports: [
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
  ],
  templateUrl: './product-form-dialog.html',
  styleUrls: ['./product-form-dialog.scss'],
})
export class ProductFormDialogComponent {
  @Input() visible: boolean = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() editMode: boolean = false;
  @Input() form!: CreateProductDto & { barcode?: string; description?: string };
  @Input() categories: Category[] = [];
  @Input() saving: boolean = false;
  @Output() save = new EventEmitter<void>();

  onHide() {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onSave() {
    this.save.emit();
  }

  getMarginPercent(): number {
    if (this.form.cost_price === 0) return 0;
    return Math.round(
      ((this.form.retail_price - this.form.cost_price) / this.form.cost_price) * 100
    );
  }

  getMarginClass(): string {
    const margin = this.getMarginPercent();
    if (margin < 10) return 'margin-low';
    if (margin < 30) return 'margin-medium';
    return 'margin-good';
  }
}
