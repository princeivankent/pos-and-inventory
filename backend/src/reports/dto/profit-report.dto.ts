import { TrendMetadataDto } from './trend-metadata.dto';

export class ProfitReportDto {
  period: string;
  start_date: Date;
  end_date: Date;
  costing_method: string;
  legacy_fallback_rows: number;
  warnings: string[];
  total_revenue: number;
  total_revenue_trend?: TrendMetadataDto;
  total_cost: number;
  total_cost_trend?: TrendMetadataDto;
  gross_profit: number;
  gross_profit_trend?: TrendMetadataDto;
  profit_margin: number;
  profit_margin_trend?: TrendMetadataDto;
  total_discount: number;
  total_tax: number;
  total_transactions: number;
}
