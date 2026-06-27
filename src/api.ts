import {
  BackupInfo,
  DashboardSummary,
  DashboardTrend,
  DepartmentRanking,
  OperationLog,
  OrderRecord,
  PageResult,
  ProjectLedger,
  PurchaseRecord,
  SalesRecord,
} from './types';

const API_BASE = ((import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_API_BASE_URL) || '/api';

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
  health: () => request<{ status: string; database: string; importedRows: number; error?: string }>('/health'),
  importExcel: () => request<{ success_rows: number; failed_rows: number }>('/import/excel', { method: 'POST' }),
  dashboardSummary: () => request<DashboardSummary>('/dashboard/summary'),
  dashboardTrends: () => request<DashboardTrend[]>('/dashboard/trends'),
  departmentRanking: () => request<DepartmentRanking[]>('/dashboard/department-ranking'),
  ledgers: (params: Record<string, string | number | undefined>) =>
    request<PageResult<ProjectLedger>>(`/ledgers${query(params)}`),
  orders: (params: Record<string, string | number | undefined>) =>
    request<PageResult<OrderRecord>>(`/orders${query(params)}`),
  purchases: (params: Record<string, string | number | undefined>) =>
    request<PageResult<PurchaseRecord>>(`/purchases${query(params)}`),
  sales: (params: Record<string, string | number | undefined>) =>
    request<PageResult<SalesRecord>>(`/sales${query(params)}`),
  logs: () => request<PageResult<OperationLog>>('/logs?limit=100'),
  backups: () => request<PageResult<BackupInfo>>('/backups?limit=100'),
};
