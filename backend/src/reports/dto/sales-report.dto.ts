import { TrendMetadataDto } from './trend-metadata.dto';

export class DailySalesDto {
  date: string;
  total_sales: number;
  transaction_count: number;
}

export class SalesReportDto {
  period: string;
  start_date: Date;
  end_date: Date;
  total_sales: number;
  total_sales_trend?: TrendMetadataDto;
  total_transactions: number;
  total_transactions_trend?: TrendMetadataDto;
  total_tax: number;
  total_tax_trend?: TrendMetadataDto;
  net_sales: number;
  net_sales_trend?: TrendMetadataDto;
  total_discount: number;
  daily_breakdown?: DailySalesDto[];
}
