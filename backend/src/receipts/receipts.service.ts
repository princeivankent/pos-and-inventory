import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sale } from '../database/entities/sale.entity';
import { SaleItem } from '../database/entities/sale-item.entity';
import { Store } from '../database/entities/store.entity';
import { User } from '../database/entities/user.entity';
import * as PDFDocument from 'pdfkit';

export interface ReceiptData {
  store: {
    name: string;
    address: string;
    phone: string;
    tax_id: string;
    receipt_header?: string;
    receipt_footer?: string;
  };
  sale: {
    sale_number: string;
    sale_date: Date;
    cashier_name: string;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total_amount: number;
    amount_paid: number;
    change_amount: number;
    payment_method: string;
    notes: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>;
}

@Injectable()
export class ReceiptsService {
  constructor(
    @InjectRepository(Sale)
    private saleRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private saleItemRepository: Repository<SaleItem>,
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getReceiptData(saleId: string, storeId: string): Promise<ReceiptData> {
    const sale = await this.saleRepository.findOne({
      where: { id: saleId, store_id: storeId },
    });
    if (!sale) {
      throw new NotFoundException(`Sale with ID ${saleId} not found`);
    }

    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });

    const cashier = await this.userRepository.findOne({
      where: { id: sale.cashier_id },
    });

    const saleItems = await this.saleItemRepository.find({
      where: { sale_id: saleId },
      relations: ['product'],
    });

    // Aggregate items by product (in case of multiple batches)
    const itemMap = new Map<
      string,
      { name: string; quantity: number; unit_price: number; subtotal: number }
    >();
    for (const item of saleItems) {
      const key = item.product_id;
      if (itemMap.has(key)) {
        const existing = itemMap.get(key);
        existing.quantity += item.quantity;
        existing.subtotal += Number(item.subtotal);
      } else {
        itemMap.set(key, {
          name: item.product?.name || 'Unknown Product',
          quantity: item.quantity,
          unit_price: Number(item.unit_price),
          subtotal: Number(item.subtotal),
        });
      }
    }

    return {
      store: {
        name: store?.name || '',
        address: store?.address || '',
        phone: store?.phone || '',
        tax_id: store?.tax_id || '',
        receipt_header: store?.settings?.receipt_header,
        receipt_footer: store?.settings?.receipt_footer,
      },
      sale: {
        sale_number: sale.sale_number,
        sale_date: sale.sale_date,
        cashier_name: cashier?.full_name || 'Unknown',
        subtotal: Number(sale.subtotal),
        tax_amount: Number(sale.tax_amount),
        discount_amount: Number(sale.discount_amount),
        total_amount: Number(sale.total_amount),
        amount_paid: Number(sale.amount_paid),
        change_amount: Number(sale.change_amount),
        payment_method: sale.payment_method,
        notes: sale.notes,
      },
      items: Array.from(itemMap.values()),
    };
  }

  async generatePdf(saleId: string, storeId: string): Promise<Buffer> {
    const data = await this.getReceiptData(saleId, storeId);

    return new Promise((resolve, reject) => {
      // Thermal receipt width: ~58mm or ~80mm. Using 80mm = ~226 pts
      const doc = new PDFDocument({
        size: [226, 600],
        margins: { top: 10, bottom: 10, left: 10, right: 10 },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const width = 206; // page width minus margins
      const center = (text: string, fontSize = 8) => {
        doc.fontSize(fontSize);
        const textWidth = doc.widthOfString(text);
        const x = 10 + (width - textWidth) / 2;
        doc.text(text, x, undefined, { width });
      };

      // Header
      if (data.store.receipt_header) {
        center(data.store.receipt_header, 7);
        doc.moveDown(0.3);
      }

      center(data.store.name, 10);
      if (data.store.address) center(data.store.address, 7);
      if (data.store.phone) center(data.store.phone, 7);
      if (data.store.tax_id) center(`TIN: ${data.store.tax_id}`, 7);

      doc.moveDown(0.5);
      doc.fontSize(7).text('─'.repeat(38), 10);

      // Sale info
      doc.fontSize(7);
      doc.text(`Sale #: ${data.sale.sale_number}`, 10);
      doc.text(
        `Date: ${new Date(data.sale.sale_date).toLocaleString('en-PH')}`,
        10,
      );
      doc.text(`Cashier: ${data.sale.cashier_name}`, 10);

      doc.text('─'.repeat(38), 10);

      // Items
      for (const item of data.items) {
        doc.fontSize(7);
        doc.text(item.name, 10, undefined, { width: width * 0.6 });
        doc.text(
          `${item.quantity} x ${item.unit_price.toFixed(2)}`,
          10,
        );
        doc.text(item.subtotal.toFixed(2), 10, undefined, {
          width,
          align: 'right',
        });
        doc.moveDown(0.2);
      }

      doc.text('─'.repeat(38), 10);

      // Totals
      const rightAligned = (label: string, value: string) => {
        doc.fontSize(7);
        doc.text(label, 10, undefined, { continued: true, width: width * 0.6 });
        doc.text(value, { width: width * 0.4, align: 'right' });
      };

      rightAligned('Subtotal:', data.sale.subtotal.toFixed(2));
      if (data.sale.discount_amount > 0) {
        rightAligned(
          'Discount:',
          `-${data.sale.discount_amount.toFixed(2)}`,
        );
      }
      if (data.sale.tax_amount > 0) {
        rightAligned('VAT (12%):', data.sale.tax_amount.toFixed(2));
      }

      doc.fontSize(8).font('Helvetica-Bold');
      rightAligned('TOTAL:', data.sale.total_amount.toFixed(2));
      doc.font('Helvetica');

      doc.text('─'.repeat(38), 10);

      // Payment
      doc.fontSize(7);
      rightAligned('Cash:', data.sale.amount_paid.toFixed(2));
      rightAligned('Change:', data.sale.change_amount.toFixed(2));

      doc.moveDown(0.5);

      // Footer
      if (data.store.receipt_footer) {
        center(data.store.receipt_footer, 7);
      } else {
        center('Thank you for your purchase!', 7);
      }

      doc.end();
    });
  }
}
