import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'phpCurrency', standalone: true })
export class PhpCurrencyPipe implements PipeTransform {
  private formatter = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  transform(value: number | string | null | undefined): string {
    if (value == null) return '₱0.00';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '₱0.00';
    return this.formatter.format(num);
  }
}
