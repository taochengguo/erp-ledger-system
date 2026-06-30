import { OrderRecord, ProjectLedger, PurchaseRecord, SalesRecord } from '../types';

export type LedgerFilters = {
  projectId: string;
  department: string;
  manager: string;
  clientUnit: string;
  orderId: string;
  orderStatus: string;
  startDate: string;
  endDate: string;
};

export type OrderFilters = {
  projectId: string;
  orderId: string;
  orderDate: string;
  businessType: string;
  clientUnit: string;
  startDate: string;
  endDate: string;
};

export type PurchaseFilters = {
  projectId: string;
  orderId: string;
  manager: string;
  department: string;
};

export type SalesFilters = PurchaseFilters;

export const emptyLedgerFilters: LedgerFilters = {
  projectId: '',
  department: '',
  manager: '',
  clientUnit: '',
  orderId: '',
  orderStatus: '',
  startDate: '',
  endDate: '',
};

export const emptyOrderFilters: OrderFilters = {
  projectId: '',
  orderId: '',
  orderDate: '',
  businessType: '',
  clientUnit: '',
  startDate: '',
  endDate: '',
};

export const emptyPurchaseFilters: PurchaseFilters = {
  projectId: '',
  orderId: '',
  manager: '',
  department: '',
};

export const emptySalesFilters: SalesFilters = emptyPurchaseFilters;

export function submitQueryFilters<T extends Record<string, string>>(filters: T): T {
  return { ...filters };
}

function normalizeStatus(status: string) {
  if (status === 'closed' || status.includes('关') || status.includes('闭') || status.includes('完成')) {
    return 'closed';
  }
  return 'open';
}

export function applyLedgerFilters(ledgers: ProjectLedger[], filters: LedgerFilters) {
  return ledgers.filter((item) => {
    if (filters.projectId && !item.id.toLowerCase().includes(filters.projectId.toLowerCase())) return false;
    if (filters.department && item.department !== filters.department) return false;
    if (filters.manager && !item.manager.toLowerCase().includes(filters.manager.toLowerCase())) return false;
    if (filters.clientUnit && !item.clientUnit.toLowerCase().includes(filters.clientUnit.toLowerCase())) return false;
    if (filters.orderId && !item.orderId.toLowerCase().includes(filters.orderId.toLowerCase())) return false;
    if (filters.orderStatus && normalizeStatus(item.orderStatus) !== filters.orderStatus) return false;
    if (filters.startDate && item.orderDate < filters.startDate) return false;
    if (filters.endDate && item.orderDate > filters.endDate) return false;
    return true;
  });
}

export function applyOrderFilters(orders: OrderRecord[], filters: OrderFilters) {
  return orders.filter((item) => {
    if (filters.projectId && !item.projectId.toLowerCase().includes(filters.projectId.toLowerCase())) return false;
    if (filters.orderId && !item.orderId.toLowerCase().includes(filters.orderId.toLowerCase())) return false;
    if (filters.orderDate && item.orderDate !== filters.orderDate) return false;
    if (filters.businessType && !item.businessType.toLowerCase().includes(filters.businessType.toLowerCase())) return false;
    if (filters.clientUnit && !item.clientUnit.toLowerCase().includes(filters.clientUnit.toLowerCase())) return false;
    if (filters.startDate && item.orderDate < filters.startDate) return false;
    if (filters.endDate && item.orderDate > filters.endDate) return false;
    return true;
  });
}

export function applyPurchaseFilters(purchases: PurchaseRecord[], filters: PurchaseFilters) {
  return purchases.filter((item) => {
    if (filters.projectId && !item.projectId.toLowerCase().includes(filters.projectId.toLowerCase())) return false;
    if (filters.orderId && !item.orderId.toLowerCase().includes(filters.orderId.toLowerCase())) return false;
    if (filters.manager && !item.manager.toLowerCase().includes(filters.manager.toLowerCase())) return false;
    if (filters.department && item.department !== filters.department) return false;
    return true;
  });
}

export function applySalesFilters(sales: SalesRecord[], filters: SalesFilters) {
  return sales.filter((item) => {
    if (filters.projectId && !item.projectId.toLowerCase().includes(filters.projectId.toLowerCase())) return false;
    if (filters.orderId && !item.orderId.toLowerCase().includes(filters.orderId.toLowerCase())) return false;
    if (filters.manager && !item.manager.toLowerCase().includes(filters.manager.toLowerCase())) return false;
    if (filters.department && item.department !== filters.department) return false;
    return true;
  });
}
