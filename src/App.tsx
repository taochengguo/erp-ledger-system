import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  ShoppingBag,
  DollarSign,
  Settings,
  Menu,
} from 'lucide-react';
import {
  ProjectLedger,
  OrderRecord,
  PurchaseRecord,
  SalesRecord,
  OperationLog,
  BackupInfo,
  ScreenType,
} from './types';
import {
  api,
  BackendBackupInfo,
  BackendOperationLog,
  BackendOrderRecord,
  BackendProjectLedger,
  BackendPurchaseRecord,
  BackendSalesRecord,
} from './api';

import DashboardScreen from './components/DashboardScreen';
import LedgerScreen from './components/LedgerScreen';
import OrdersScreen from './components/OrdersScreen';
import PurchasesScreen from './components/PurchasesScreen';
import SalesScreen from './components/SalesScreen';
import SystemScreen from './components/SystemScreen';

const fallbackText = '-';
const ztfsIconLogo = new URL('./logo/中通服图标LOGO.png', import.meta.url).href;

function dateOnly(value: string | null | undefined) {
  return value ? value.slice(0, 10) : '';
}

function optionalNumber(value: number | null | undefined) {
  return value === null || value === undefined ? undefined : Number(value);
}

function mapLedger(item: BackendProjectLedger): ProjectLedger {
  return {
    id: item.project_code,
    clientUnit: item.customer_unit_name || fallbackText,
    projectName: item.project_name || fallbackText,
    orderAmount: Number(item.order_amount || 0),
    purchaseAmount: Number(item.purchase_amount || 0),
    totalReceived: Number(item.total_received || 0),
    department: item.department || fallbackText,
    manager: item.account_manager || fallbackText,
    orderId: `${item.order_count || 0} 个订单`,
    orderStatus: item.computed_close_status || fallbackText,
    orderDate: dateOnly(item.last_order_date || item.first_order_date),
  };
}

function mapOrder(item: BackendOrderRecord): OrderRecord {
  return {
    amountType: item.amount_type || '',
    projectId: item.project_code,
    projectName: item.project_name || '',
    department: item.department || '',
    branchCompany: item.branch_company || '',
    manager: item.account_manager || '',
    orderId: item.order_no,
    orderDate: dateOnly(item.order_date),
    statisticalCategory: item.statistical_category || '',
    teamName: item.team_name || '',
    goodsName: item.goods_name || fallbackText,
    userName: item.user_name || '',
    regionalPlatform: item.regional_platform || '',
    specModel: item.spec_model || '',
    unitName: item.unit_name || '',
    quantity: `${Number(item.quantity || 0)} ${item.unit_name || ''}`.trim(),
    netUnitPrice: optionalNumber(item.net_unit_price),
    unitPrice: optionalNumber(item.unit_price),
    netRevenue: optionalNumber(item.net_revenue),
    orderValue: Number(item.order_value || 0),
    deliveredQty: Number(item.delivery_quantity || 0),
    businessType: item.business_type || fallbackText,
    clientUnit: item.customer_unit_name || fallbackText,
    supplierName: item.supplier_name || '',
    purchaseUnitPriceNoTax: optionalNumber(item.purchase_unit_price_no_tax),
    purchaseUnitPrice: optionalNumber(item.purchase_unit_price),
    costNoTax: optionalNumber(item.cost_no_tax),
    purchaseAmount: optionalNumber(item.purchase_amount),
    deliveryDate: dateOnly(item.delivery_date),
    deliveryRevenueNoTax: optionalNumber(item.delivery_revenue_no_tax),
    deliveryValue: optionalNumber(item.delivery_value),
    deliveryCostNoTax: optionalNumber(item.delivery_cost_no_tax),
    deliveryCost: optionalNumber(item.delivery_cost),
    pendingDeliveryQuantity: optionalNumber(item.pending_delivery_quantity),
    pendingDeliveryAmountNoTax: optionalNumber(item.pending_delivery_amount_no_tax),
    pendingDeliveryAmount: optionalNumber(item.pending_delivery_amount),
  };
}

function mapPurchase(item: BackendPurchaseRecord): PurchaseRecord {
  return {
    projectId: item.project_code,
    orderId: item.order_no,
    manager: item.account_manager || fallbackText,
    department: item.department || fallbackText,
    contractNo: item.purchase_contract_no || fallbackText,
    contractAmount: Number(item.purchase_contract_signed_amount || 0),
    invoiceAmount: Number(item.purchase_amount || 0),
    paymentAmount: Number(item.total_paid || 0),
    supplier: item.supplier_name || fallbackText,
  };
}

function mapSale(item: BackendSalesRecord): SalesRecord {
  return {
    projectId: item.project_code,
    orderId: item.order_no,
    manager: item.account_manager || fallbackText,
    department: item.department || fallbackText,
    contractNo: item.sales_contract_no || fallbackText,
    contractDate: dateOnly(item.sales_contract_signed_date),
    contractValue: Number(item.sales_contract_value || 0),
    invoiceAmount: Number(item.sales_invoice_amount || 0),
  };
}

function mapLog(item: BackendOperationLog): OperationLog {
  return {
    id: String(item.id),
    user: item.user_name || 'system',
    module: item.module_name,
    details: `${item.action_name}：${item.detail}`,
    status: item.status === 'success' ? '成功' : item.status === 'failed' ? '失败' : '进行中',
    time: dateOnly(item.created_at),
  };
}

function mapBackup(item: BackendBackupInfo): BackupInfo {
  return {
    id: String(item.id),
    fileName: item.file_name,
    size: item.file_size_label || fallbackText,
    backupTime: dateOnly(item.backup_time),
  };
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [ledgers, setLedgers] = useState<ProjectLedger[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [sales, setSales] = useState<SalesRecord[]>([]);
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [lastUpdated, setLastUpdated] = useState('');
  const [error, setError] = useState('');

  async function loadBackendData() {
    setError('');
    try {
      const [, ledgerData, orderData, purchaseData, salesData, logData, backupData] = await Promise.all([
        api.health(),
        api.ledgers({ limit: 500 }),
        api.orders({ limit: 500 }),
        api.purchases({ limit: 500 }),
        api.sales({ limit: 500 }),
        api.logs(),
        api.backups(),
      ]);

      setLedgers(ledgerData.items.map(mapLedger));
      setOrders(orderData.items.map(mapOrder));
      setPurchases(purchaseData.items.map(mapPurchase));
      setSales(salesData.items.map(mapSale));
      setLogs(logData.items.map(mapLog));
      setBackups(backupData.items.map(mapBackup));
      setLastUpdated(new Date().toLocaleTimeString('zh-CN', { hour12: false }));
    } catch (err) {
      setError(err instanceof Error ? err.message : '后端数据加载失败');
    }
  }

  useEffect(() => {
    loadBackendData();
  }, []);

  const addLog = (module: string, details: string) => {
    const now = new Date();
    const newLog: OperationLog = {
      id: `local-${Date.now()}`,
      user: '当前用户 (管理员)',
      module,
      details,
      status: '成功',
      time: now.toLocaleString('zh-CN', { hour12: false }),
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  const handleAddLedger = (newItem: ProjectLedger) => {
    setLedgers((prev) => [newItem, ...prev]);
    addLog('台账管理', `本地新增项目台账 "${newItem.projectName}" (${newItem.id})`);
  };

  const handleAddOrder = (newItem: OrderRecord) => {
    setOrders((prev) => [newItem, ...prev]);
    addLog('订单管理', `本地录入订单 "${newItem.orderId}"`);
  };

  const handleAddPurchase = (newItem: PurchaseRecord) => {
    setPurchases((prev) => [newItem, ...prev]);
    addLog('采购管理', `本地新增采购合同 ${newItem.contractNo}`);
  };

  const handleAddSales = (newItem: SalesRecord) => {
    setSales((prev) => [newItem, ...prev]);
    addLog('销售管理', `本地登记销售合同 ${newItem.contractNo}`);
  };

  const handleAddBackup = (newItem: BackupInfo) => {
    setBackups((prev) => [newItem, ...prev]);
    addLog('系统维护', `本地创建备份记录 ${newItem.fileName}`);
  };

  const handleRefreshAll = () => {
    void loadBackendData();
  };

  const getSidebarLinkClass = (screen: ScreenType) => {
    const baseClass = 'flex items-center gap-3 px-6 py-2.5 transition-all duration-150 text-[13px] font-medium ';
    if (currentScreen === screen) {
      return baseClass + 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500';
    }
    return baseClass + 'text-slate-300 hover:bg-slate-800 hover:text-white';
  };

  const screenNameMap: Record<ScreenType, string> = {
    dashboard: '首页仪表盘',
    ledger: '台账管理',
    orders: '订单详情',
    purchases: '采购详情',
    sales: '销售详情',
    system: '系统管理',
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex font-sans text-slate-900 select-none overflow-hidden">
      <aside
        id="sidebar"
        className={`fixed left-0 top-0 h-full bg-[#0F172A] text-slate-300 border-r border-slate-800 z-[60] flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'w-[72px]' : 'w-56'
        }`}
      >
        <div className="h-14 flex items-center px-4 gap-2.5 border-b border-slate-800 overflow-hidden shrink-0">
          <div className="min-w-[32px] h-8 w-8 rounded bg-white flex items-center justify-center shrink-0 overflow-hidden">
            <img src={ztfsIconLogo} alt="中通服图标LOGO" className="h-full w-full object-contain" />
          </div>
          {!sidebarCollapsed && (
            <span className="font-bold text-white text-[12px] tracking-tight whitespace-nowrap">中通服供应链安徽分公司</span>
          )}
        </div>

        <nav className="flex-1 py-4 text-[13px] space-y-0.5 overflow-y-auto">
          {!sidebarCollapsed && (
            <div className="px-6 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">核心业务</div>
          )}
          {[
            ['dashboard', '首页仪表盘', <LayoutDashboard className="w-4 h-4 shrink-0 mr-1" />],
            ['ledger', '台账管理', <BookOpen className="w-4 h-4 shrink-0 mr-1" />],
            ['orders', '订单详情', <FileText className="w-4 h-4 shrink-0 mr-1" />],
            ['purchases', '采购详情', <ShoppingBag className="w-4 h-4 shrink-0 mr-1" />],
            ['sales', '销售详情', <DollarSign className="w-4 h-4 shrink-0 mr-1" />],
          ].map(([key, label, icon]) => (
            <a
              key={key as string}
              href={`#${key}`}
              onClick={(event) => {
                event.preventDefault();
                setCurrentScreen(key as ScreenType);
              }}
              className={getSidebarLinkClass(key as ScreenType)}
            >
              {icon}
              {!sidebarCollapsed && <span className="sidebar-text whitespace-nowrap">{label}</span>}
            </a>
          ))}

          {!sidebarCollapsed && (
            <div className="mt-4 px-6 py-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">设置</div>
          )}
          <a
            id="nav-system"
            href="#system"
            onClick={(event) => {
              event.preventDefault();
              setCurrentScreen('system');
            }}
            className={getSidebarLinkClass('system')}
          >
            <Settings className="w-4 h-4 shrink-0 mr-1" />
            {!sidebarCollapsed && <span className="sidebar-text whitespace-nowrap">系统管理</span>}
          </a>
        </nav>

        <div className="p-4 border-t border-slate-800 flex items-center space-x-3 shrink-0 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-slate-700 shrink-0 flex items-center justify-center font-bold text-slate-300 text-xs">
            管
          </div>
          {!sidebarCollapsed && (
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-white leading-tight">管理员</p>
              <p className="text-[10px] text-slate-500 truncate font-mono">admin@sys.com</p>
            </div>
          )}
        </div>
      </aside>

      <div
        id="main-content"
        className="flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? '72px' : '224px' }}
      >
        <header
          id="top-nav"
          className="fixed top-0 right-0 z-50 bg-white border-b border-slate-200 px-6 flex items-center justify-between h-14 shrink-0 shadow-sm transition-all duration-300"
          style={{ left: sidebarCollapsed ? '72px' : '224px' }}
        >
          <div className="flex items-center space-x-4">
            <button
              id="toggle-sidebar"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <nav className="text-sm text-slate-400 font-medium hidden md:block">
              <ol className="flex space-x-2">
                <li>系统核心</li>
                <li className="text-slate-300">/</li>
                <li className="text-blue-600 font-semibold">{screenNameMap[currentScreen]}</li>
              </ol>
            </nav>
          </div>

          <div className="flex items-center space-x-4 text-xs">
            <span className="text-slate-500 font-mono hidden sm:inline">最后更新: {lastUpdated || '--:--:--'}</span>
          </div>
        </header>

        <main className="flex-1 min-w-0 p-6 space-y-6 mt-14 overflow-y-auto overflow-x-hidden w-full max-w-[1600px] mx-auto bg-[#F3F4F6]">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm font-medium">
              {error}
            </div>
          )}
          {currentScreen === 'dashboard' && (
            <DashboardScreen logs={logs} ledgers={ledgers} orders={orders} onNavigate={setCurrentScreen} />
          )}
          {currentScreen === 'ledger' && (
            <LedgerScreen
              ledgers={ledgers}
              orders={orders}
              purchases={purchases}
              sales={sales}
              onAddLedger={handleAddLedger}
            />
          )}
          {currentScreen === 'orders' && <OrdersScreen orders={orders} onAddOrder={handleAddOrder} />}
          {currentScreen === 'purchases' && <PurchasesScreen purchases={purchases} onAddPurchase={handleAddPurchase} />}
          {currentScreen === 'sales' && <SalesScreen sales={sales} onAddSales={handleAddSales} />}
          {currentScreen === 'system' && (
            <SystemScreen logs={logs} backups={backups} onAddBackup={handleAddBackup} onRefresh={handleRefreshAll} />
          )}
        </main>
      </div>
    </div>
  );
}
