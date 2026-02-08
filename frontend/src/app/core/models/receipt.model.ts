import { Store } from './store.model';
import { Sale, SaleItem } from './sale.model';

export interface ReceiptData {
  store: Store;
  sale: Sale;
  items: SaleItem[];
}
