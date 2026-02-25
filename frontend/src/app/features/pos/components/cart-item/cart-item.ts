import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { PhpCurrencyPipe } from '../../../../shared/pipes/php-currency.pipe';
import { CartItem } from '../../services/cart.service';

@Component({
  selector: 'app-cart-item',
  standalone: true,
  imports: [ButtonModule, TooltipModule, PhpCurrencyPipe],
  templateUrl: './cart-item.html',
  styleUrls: ['./cart-item.scss'],
})
export class CartItemComponent {
  @Input({ required: true }) item!: CartItem;
  @Output() quantityChanged = new EventEmitter<number>();
  @Output() removed = new EventEmitter<void>();

  private hasValue(value: number | null | undefined): value is number {
    return value != null && !Number.isNaN(value);
  }

  showFifoInfo(): boolean {
    const fifo = this.item.product.next_fifo_unit_cost;
    if (!this.hasValue(fifo)) return false;
    return Math.abs(Number(fifo) - Number(this.item.product.cost_price)) > 0.009;
  }

  getFifoTooltip(): string {
    const sellingPrice = Number(this.item.unit_price || 0);
    const fifo = Number(this.item.product.next_fifo_unit_cost || 0);
    const currentCost = Number(this.item.product.cost_price || 0);
    const diffTag = fifo < currentCost ? 'Older batch is being used first (FIFO).' : 'A different FIFO batch cost is currently in effect.';
    const unitGross = sellingPrice - fifo;
    const sourceDate = this.item.product.next_fifo_purchase_date
      ? new Date(this.item.product.next_fifo_purchase_date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : 'N/A';

    return [
      `Selling price: ${sellingPrice.toFixed(2)}`,
      `FIFO supplier cost: ${fifo.toFixed(2)}`,
      `Current product cost: ${currentCost.toFixed(2)}`,
      `Source batch date: ${sourceDate}`,
      `Expected unit gross: ${unitGross.toFixed(2)}`,
      diffTag,
    ].join(' | ');
  }

  increment() {
    if (this.item.quantity < this.item.product.current_stock) {
      this.quantityChanged.emit(this.item.quantity + 1);
    }
  }

  decrement() {
    this.quantityChanged.emit(this.item.quantity - 1);
  }
}
