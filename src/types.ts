/**
 * Shared types and interfaces for the Enterprise Management System
 */

export interface ProjectLedger {
  id: string; // 项目编号 (e.g. PJ-2023-001)
  clientUnit: string; // 客户单位
  projectName: string; // 项目名称
  orderAmount: number; // 订单金额
  purchaseAmount: number; // 采购金额
  totalReceived: number; // 回款合计
  department: string; // 部门
  manager: string; // 客户经理
  orderId: string; // 订单号
  orderStatus: string; // 订单状态
  orderDate: string; // 订单日期
}

export interface OrderRecord {
  projectId: string; // 项目编号
  orderId: string; // 订单号
  orderDate: string; // 订单日期
  goodsName: string; // 货物名称
  quantity: string; // 数量 (e.g. "1 套", "5 节点")
  orderValue: number; // 订单价值 (订单金额)
  deliveredQty: number; // 交付数量
  businessType: string; // 业务类型
  clientUnit: string; // 客户单位
}

export interface PurchaseRecord {
  projectId: string; // 项目编号
  orderId: string; // 订单号
  manager: string; // 客户经理
  department: string; // 部门
  contractNo: string; // 公司合同号
  contractAmount: number; // 合同金额
  invoiceAmount: number; // 收票金额
  paymentAmount: number; // 付款金额
  supplier: string; // 供应商
}

export interface SalesRecord {
  projectId: string; // 项目编号
  orderId: string; // 订单号
  manager: string; // 客户经理
  department: string; // 部门
  contractNo: string; // 公司合同号
  contractDate: string; // 合同签订日期
  contractValue: number; // 合同价值
  invoiceAmount: number; // 开票金额
}

export interface OperationLog {
  id: string;
  user: string; // 操作人/用户 (e.g. "张伟 (管理员)", "李明 (开发)")
  module: string; // 操作模块
  details: string; // 详情
  status: '成功' | '失败' | '进行中'; // 状态
  time: string; // 操作时间 (YYYY-MM-DD HH:mm:ss)
}

export interface BackupInfo {
  id: string;
  fileName: string; // 文件名
  size: string; // 大小 (e.g. "124.5 MB")
  backupTime: string; // 备份时间 (YYYY-MM-DD HH:mm:ss)
}

export type ScreenType = 'dashboard' | 'ledger' | 'orders' | 'purchases' | 'sales' | 'system';
