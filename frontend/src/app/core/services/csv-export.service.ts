import { Injectable } from '@angular/core';

export interface CsvColumn {
  field: string;   // key in data object (supports dot notation for nested: 'product.name')
  header: string;  // CSV column header label
}

@Injectable({ providedIn: 'root' })
export class CsvExportService {
  export(data: any[], columns: CsvColumn[], filename: string): void {
    const header = columns.map(c => c.header).join(',');
    const rows = data.map(row =>
      columns.map(c => {
        const value = this.resolve(row, c.field) ?? '';
        const str = String(value);
        // Wrap in quotes if contains comma, quote, or newline
        return /[,"\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private resolve(obj: any, path: string): any {
    return path.split('.').reduce((o, k) => o?.[k], obj);
  }
}
