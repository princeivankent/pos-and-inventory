import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { CreateSupplierDto } from '../../../../core/models/supplier.model';

@Component({
  selector: 'app-supplier-form-dialog',
  standalone: true,
  imports: [
    FormsModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
  ],
  templateUrl: './supplier-form-dialog.html',
  styleUrls: ['./supplier-form-dialog.scss'],
})
export class SupplierFormDialogComponent {
  @Input() visible = false;
  @Input() editMode = false;
  @Input() form: CreateSupplierDto = { name: '' };
  @Input() saving = false;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<void>();

  get isValid(): boolean {
    return !!(this.form.name?.trim());
  }

  onHide() {
    this.visibleChange.emit(false);
  }
}
