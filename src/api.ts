const API_BASE = ((import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_API_BASE_URL) || '/api';

export interface BackendHealth {
  status: string;
  database: string;
  importedRows: number;
  error?: string | null;
}

export interface BackendDashboardSummary {
  orderAmount: number;
  grossProfit: number;
  orderCount: number;
  accountsReceivable: number;
  accountsPayable: number;
  closedCount: number;
}

export interface BackendProjectLedger {
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

export interface BackendOrderRecord {
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

export interface BackendPurchaseRecord {
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

export interface BackendSalesRecord {
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

export interface BackendOperationLog {
  id: number;
  user_name: string | null;
  module_name: string;
  action_name: string;
  detail: string;
  status: string;
  created_at: string;
}

export interface BackendBackupInfo {
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

function query(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  });
  const value = search.toString();
  return value ? `?${value}` : '';
}

export const api = {
  health: () => request<BackendHealth>('/health'),
  importExcel: () => request<{ success_rows: number; failed_rows: number }>('/import/excel', { method: 'POST' }),
  dashboardSummary: () => request<BackendDashboardSummary>('/dashboard/summary'),
  ledgers: (params: Record<string, string | number | undefined> = {}) =>
    request<PageResult<BackendProjectLedger>>(`/ledgers${query(params)}`),
  orders: (params: Record<string, string | number | undefined> = {}) =>
    request<PageResult<BackendOrderRecord>>(`/orders${query(params)}`),
  purchases: (params: Record<string, string | number | undefined> = {}) =>
    request<PageResult<BackendPurchaseRecord>>(`/purchases${query(params)}`),
  sales: (params: Record<string, string | number | undefined> = {}) =>
    request<PageResult<BackendSalesRecord>>(`/sales${query(params)}`),
  logs: () => request<PageResult<BackendOperationLog>>('/logs?limit=100'),
  backups: () => request<PageResult<BackendBackupInfo>>('/backups?limit=100'),
};
