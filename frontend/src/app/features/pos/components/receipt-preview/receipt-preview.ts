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
  template: `
    <p-dialog
      header="Receipt"
      [(visible)]="visible"
      [modal]="true"
      [style]="{ width: '380px' }"
    >
      @if (sale) {
        <div class="receipt" id="receipt-content">
          <div class="receipt-header">
            <h3>{{ store?.name ?? 'Store' }}</h3>
            @if (store?.address) {
              <p>{{ store!.address }}</p>
            }
            @if (store?.tax_id) {
              <p>TIN: {{ store!.tax_id }}</p>
            }
          </div>

          <div class="receipt-meta">
            <p>{{ sale.sale_number }}</p>
            <p>{{ sale.sale_date | date:'MMM d, y h:mm a' }}</p>
          </div>

          <div class="receipt-items">
            @for (item of sale.items ?? []; track item.id) {
              <div class="receipt-item">
                <div class="item-line">
                  <span>{{ item.product?.name ?? 'Product' }}</span>
                  <span>{{ item.subtotal | phpCurrency }}</span>
                </div>
                <div class="item-detail">
                  {{ item.quantity }} x {{ item.unit_price | phpCurrency }}
                </div>
              </div>
            }
          </div>

          <div class="receipt-totals">
            <div class="total-line">
              <span>Subtotal</span>
              <span>{{ sale.subtotal | phpCurrency }}</span>
            </div>
            @if (sale.tax_amount > 0) {
              <div class="total-line">
                <span>VAT (12%)</span>
                <span>{{ sale.tax_amount | phpCurrency }}</span>
              </div>
            }
            @if (sale.discount_amount > 0) {
              <div class="total-line">
                <span>Discount</span>
                <span>-{{ sale.discount_amount | phpCurrency }}</span>
              </div>
            }
            <div class="total-line grand">
              <span>TOTAL</span>
              <span>{{ sale.total_amount | phpCurrency }}</span>
            </div>
            <div class="total-line">
              <span>Paid</span>
              <span>{{ sale.amount_paid | phpCurrency }}</span>
            </div>
            <div class="total-line">
              <span>Change</span>
              <span>{{ sale.change_amount | phpCurrency }}</span>
            </div>
          </div>

          <div class="receipt-footer">
            <p>Thank you for your purchase!</p>
          </div>
        </div>
      }

      <ng-template pTemplate="footer">
        <p-button
          label="Print"
          icon="pi pi-print"
          (onClick)="onPrint()"
        />
        <p-button
          label="Close"
          [text]="true"
          severity="secondary"
          (onClick)="visible = false"
        />
      </ng-template>
    </p-dialog>
  `,
  styles: `
    .receipt {
      font-family: 'Courier New', monospace;
      font-size: 0.8125rem;
      line-height: 1.4;
    }
    .receipt-header {
      text-align: center;
      padding-bottom: 0.75rem;
      border-bottom: 1px dashed var(--border-color);
      h3 { font-size: 1rem; margin: 0 0 0.25rem; }
      p { margin: 0; font-size: 0.75rem; color: var(--text-secondary); }
    }
    .receipt-meta {
      text-align: center;
      padding: 0.5rem 0;
      border-bottom: 1px dashed var(--border-color);
      p { margin: 0; font-size: 0.75rem; }
    }
    .receipt-items {
      padding: 0.5rem 0;
      border-bottom: 1px dashed var(--border-color);
    }
    .receipt-item {
      margin-bottom: 0.375rem;
    }
    .item-line {
      display: flex;
      justify-content: space-between;
    }
    .item-detail {
      font-size: 0.6875rem;
      color: var(--text-secondary);
      padding-left: 0.5rem;
    }
    .receipt-totals {
      padding: 0.5rem 0;
    }
    .total-line {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.125rem;
      &.grand {
        font-weight: 700;
        font-size: 1rem;
        padding: 0.375rem 0;
        border-top: 1px solid var(--text-primary);
        border-bottom: 1px solid var(--text-primary);
        margin: 0.25rem 0;
      }
    }
    .receipt-footer {
      text-align: center;
      padding-top: 0.75rem;
      border-top: 1px dashed var(--border-color);
      p { margin: 0; font-size: 0.75rem; }
    }
  `,
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
