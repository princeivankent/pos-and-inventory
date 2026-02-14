import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { CreateCustomerDto } from '../../../../core/models/customer.model';

@Component({
  selector: 'app-customer-form-dialog',
  standalone: true,
  imports: [
    FormsModule,
    DialogModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    ButtonModule,
  ],
  templateUrl: './customer-form-dialog.html',
  styleUrls: ['./customer-form-dialog.scss'],
})
export class CustomerFormDialogComponent {
  @Input() visible = false;
  @Input() editMode = false;
  @Input() form: CreateCustomerDto = { name: '', phone: '' };
  @Input() saving = false;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<void>();

  get isValid(): boolean {
    return !!(this.form.name?.trim() && this.form.phone?.trim());
  }

  onHide() {
    this.visibleChange.emit(false);
  }
}
