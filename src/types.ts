export type ScreenType = 'dashboard' | 'ledger' | 'orders' | 'purchases' | 'sales' | 'system';

export interface DashboardSummary {
  orderAmount: number;
  grossProfit: number;
  orderCount: number;
  accountsReceivable: number;
  accountsPayable: number;
  closedCount: number;
}

export interface DashboardTrend {
  month: string;
  order_amount: number;
  gross_profit: number;
}

export interface DepartmentRanking {
  department: string;
  order_amount: number;
  gross_profit: number;
}

export interface ProjectLedger {
  project_code: string;
  project_name: string | null;
  department: string | null;
  branch_company: string | null;
  account_manager: string | null;
  customer_unit_name: string | null;
  first_order_date: string | null;
  last_order_date: string | null;
  order_count: number;
  order_amount: number;
  purchase_amount: number;
  total_received: number;
  accounts_receivable: number;
  accounts_payable: number;
  gross_profit: number;
  computed_close_status: string;
}

export interface OrderRecord {
  project_code: string;
  order_no: string;
  order_date: string | null;
  goods_name: string | null;
  unit_name: string | null;
  quantity: number | null;
  order_value: number | null;
  delivery_quantity: number | null;
  business_type: string | null;
  customer_unit_name: string | null;
}

export interface PurchaseRecord {
  project_code: string;
  order_no: string;
  account_manager: string | null;
  department: string | null;
  supplier_name: string | null;
  purchase_contract_no: string | null;
  purchase_contract_signed_amount: number | null;
  purchase_amount: number | null;
  total_paid: number | null;
  accounts_payable: number | null;
}

export interface SalesRecord {
  project_code: string;
  order_no: string;
  account_manager: string | null;
  department: string | null;
  sales_contract_no: string | null;
  sales_contract_signed_date: string | null;
  sales_contract_value: number | null;
  sales_invoice_amount: number | null;
  total_received: number | null;
  accounts_receivable: number | null;
}

export interface OperationLog {
  id: number;
  user_name: string | null;
  module_name: string;
  action_name: string;
  detail: string;
  status: string;
  created_at: string;
}

export interface BackupInfo {
  id: number;
  file_name: string;
  file_size_label: string | null;
  backup_type: string;
  status: string;
  storage_path: string | null;
  backup_time: string;
}

export interface PageResult<T> {
  total: number;
  items: T[];
}
