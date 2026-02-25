export interface TrendMetadata {
  value: number;
  change_amount: number;
  change_percentage: number;
  trend: 'up' | 'down' | 'neutral';
  previous_value: number;
}

export interface SalesReport {
  period: string;
  start_date: string;
  end_date: string;
  total_sales: number;
  total_sales_trend?: TrendMetadata;
  total_transactions: number;
  total_transactions_trend?: TrendMetadata;
  total_tax: number;
  total_tax_trend?: TrendMetadata;
  total_discount: number;
  net_sales: number;
  net_sales_trend?: TrendMetadata;
  daily_breakdown?: DailySales[];
}

export interface DailySales {
  date: string;
  total_sales: number;
  transaction_count: number;
}

export interface InventoryReport {
  total_products: number;
  total_stock_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
  products: InventoryReportItem[];
}

export interface InventoryReportItem {
  product_id: string;
  name: string;
  sku: string;
  current_stock: number;
  retail_price: number;
  cost_price: number;
  stock_value: number;
  reorder_level: number;
}

export interface BestSellingItem {
  product_id: string;
  name: string;
  sku: string;
  total_quantity: number;
  total_revenue: number;
}

export interface ProfitReport {
  period: string;
  start_date: string;
  end_date: string;
  costing_method?: string;
  legacy_fallback_rows?: number;
  warnings?: string[];
  total_revenue: number;
  total_revenue_trend?: TrendMetadata;
  total_cost: number;
  total_cost_trend?: TrendMetadata;
  gross_profit: number;
  gross_profit_trend?: TrendMetadata;
  profit_margin: number;
  profit_margin_trend?: TrendMetadata;
  total_discount?: number;
  total_tax?: number;
  total_transactions?: number;
}

export interface ReportDateRange {
  start_date: string;
  end_date: string;
}
