export interface SalesReport {
  period: string;
  start_date: string;
  end_date: string;
  total_sales: number;
  total_transactions: number;
  total_tax: number;
  total_discount: number;
  net_sales: number;
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
  total_revenue: number;
  total_cost: number;
  gross_profit: number;
  profit_margin: number;
}

export interface ReportDateRange {
  start_date: string;
  end_date: string;
}
