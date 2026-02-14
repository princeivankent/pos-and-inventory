import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { CreditStatement } from '../../../../core/models/customer.model';

@Component({
  selector: 'app-credit-statement-dialog',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    DatePipe,
    DialogModule,
    TableModule,
    TagModule,
    ProgressSpinnerModule,
  ],
  templateUrl: './credit-statement-dialog.html',
  styleUrls: ['./credit-statement-dialog.scss'],
})
export class CreditStatementDialogComponent {
  @Input() visible = false;
  @Input() statement: CreditStatement | null = null;
  @Input() loading = false;

  @Output() visibleChange = new EventEmitter<boolean>();

  onHide() {
    this.visibleChange.emit(false);
  }
}
