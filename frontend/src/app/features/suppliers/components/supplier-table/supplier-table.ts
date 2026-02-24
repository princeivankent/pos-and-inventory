import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { Supplier } from '../../../../core/models/supplier.model';

@Component({
  selector: 'app-supplier-table',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule],
  templateUrl: './supplier-table.html',
  styleUrls: ['./supplier-table.scss'],
})
export class SupplierTableComponent {
  @Input() suppliers: Supplier[] = [];
  @Input() loading = false;
  @Input() isAdmin = false;

  @Output() edit = new EventEmitter<Supplier>();
  @Output() delete = new EventEmitter<Supplier>();
}
