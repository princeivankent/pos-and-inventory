import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';

export interface CreateStoreForm {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  tax_id?: string;
}

@Component({
  selector: 'app-create-store-dialog',
  standalone: true,
  imports: [FormsModule, DialogModule, InputTextModule, TextareaModule, ButtonModule],
  templateUrl: './create-store-dialog.html',
  styleUrls: ['./create-store-dialog.scss'],
})
export class CreateStoreDialogComponent {
  @Input() visible = false;
  @Input() form: CreateStoreForm = { name: '' };
  @Input() saving = false;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() save = new EventEmitter<void>();

  get isValid(): boolean {
    return !!(this.form.name?.trim());
  }

  onHide() { this.visibleChange.emit(false); }
}
