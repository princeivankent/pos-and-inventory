import { Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { PhpCurrencyPipe } from '../../../../shared/pipes/php-currency.pipe';
import { Sale, SaleItem } from '../../../../core/models/sale.model';
import { Store } from '../../../../core/models/store.model';

@Component({
  selector: 'app-receipt-preview',
  standalone: true,
  imports: [DialogModule, ButtonModule, PhpCurrencyPipe, DatePipe],
  templateUrl: './receipt-preview.html',
  styleUrls: ['./receipt-preview.scss'],
})
export class ReceiptPreviewComponent {
  @Input() sale: Sale | null = null;
  @Input() store: Store | null = null;
  visible = false;

  open() {
    this.visible = true;
  }

  onPrint() {
    const content = document.getElementById('receipt-content');
    if (!content) return;

    const printWindow = window.open('', '_blank', 'width=380,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html><head><title>Receipt</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 13px; padding: 10px; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
      </style>
      </head><body>${content.innerHTML}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  }
}
