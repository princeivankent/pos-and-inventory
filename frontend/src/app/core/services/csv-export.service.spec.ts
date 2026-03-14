import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CsvExportService } from './csv-export.service';

describe('CsvExportService', () => {
  let service: CsvExportService;
  let clickSpy: ReturnType<typeof vi.fn>;
  let createdAnchor: HTMLAnchorElement;

  beforeEach(() => {
    service = new CsvExportService();

    // Mock URL APIs
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn(),
    });

    // Capture the anchor element created during export
    clickSpy = vi.fn();
    const originalCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        createdAnchor = originalCreate('a') as HTMLAnchorElement;
        createdAnchor.click = clickSpy as unknown as () => void;
        return createdAnchor;
      }
      return originalCreate(tag);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('builds CSV with header row and data rows', () => {
    const data = [{ name: 'Coffee', price: 120 }];
    const columns = [
      { field: 'name', header: 'Product Name' },
      { field: 'price', header: 'Price' },
    ];

    service.export(data, columns, 'test.csv');

    const blob: Blob = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0][0];
    return blob.text().then((text) => {
      expect(text).toBe('Product Name,Price\nCoffee,120');
    });
  });

  it('wraps values containing commas in double quotes', () => {
    const data = [{ name: 'Milk, Full Cream', price: 50 }];
    const columns = [
      { field: 'name', header: 'Product' },
      { field: 'price', header: 'Price' },
    ];

    service.export(data, columns, 'test.csv');

    const blob: Blob = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0][0];
    return blob.text().then((text) => {
      expect(text).toContain('"Milk, Full Cream"');
    });
  });

  it('escapes double quotes within values', () => {
    const data = [{ name: 'He said "hello"', price: 10 }];
    const columns = [
      { field: 'name', header: 'Product' },
      { field: 'price', header: 'Price' },
    ];

    service.export(data, columns, 'test.csv');

    const blob: Blob = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0][0];
    return blob.text().then((text) => {
      expect(text).toContain('"He said ""hello"""');
    });
  });

  it('resolves nested dot-notation fields', () => {
    const data = [{ category: { name: 'Beverages' }, sku: 'BEV-1' }];
    const columns = [
      { field: 'category.name', header: 'Category' },
      { field: 'sku', header: 'SKU' },
    ];

    service.export(data, columns, 'test.csv');

    const blob: Blob = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0][0];
    return blob.text().then((text) => {
      expect(text).toBe('Category,SKU\nBeverages,BEV-1');
    });
  });

  it('outputs empty string for null/undefined nested fields', () => {
    const data = [{ batch: null }];
    const columns = [{ field: 'batch.product.name', header: 'Product' }];

    service.export(data, columns, 'test.csv');

    const blob: Blob = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0][0];
    return blob.text().then((text) => {
      expect(text).toBe('Product\n');
    });
  });

  it('sets the correct download filename on the anchor', () => {
    service.export([{ x: 1 }], [{ field: 'x', header: 'X' }], 'products-2026-03-14.csv');
    expect(createdAnchor.download).toBe('products-2026-03-14.csv');
  });

  it('triggers anchor click to download', () => {
    service.export([{ x: 1 }], [{ field: 'x', header: 'X' }], 'test.csv');
    expect(clickSpy).toHaveBeenCalledOnce();
  });

  it('revokes the object URL after download', () => {
    service.export([{ x: 1 }], [{ field: 'x', header: 'X' }], 'test.csv');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('exports an empty data array as header-only CSV', () => {
    service.export([], [{ field: 'name', header: 'Product' }], 'empty.csv');

    const blob: Blob = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0][0];
    return blob.text().then((text) => {
      expect(text).toBe('Product');
    });
  });

  it('handles multiple rows correctly', () => {
    const data = [
      { name: 'Coffee', price: 120 },
      { name: 'Tea', price: 80 },
    ];
    const columns = [
      { field: 'name', header: 'Product' },
      { field: 'price', header: 'Price' },
    ];

    service.export(data, columns, 'test.csv');

    const blob: Blob = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock.calls[0][0];
    return blob.text().then((text) => {
      const lines = text.split('\n');
      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe('Product,Price');
      expect(lines[1]).toBe('Coffee,120');
      expect(lines[2]).toBe('Tea,80');
    });
  });
});
