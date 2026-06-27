import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Archive,
  BarChart3,
  BookOpen,
  Database,
  FileText,
  RefreshCw,
  Search,
  ShoppingBag,
  Wallet,
} from 'lucide-react';
import { api } from './api';
import {
  BackupInfo,
  DashboardSummary,
  DashboardTrend,
  DepartmentRanking,
  OperationLog,
  OrderRecord,
  ProjectLedger,
  PurchaseRecord,
  SalesRecord,
  ScreenType,
} from './types';

const navItems: Array<{ key: ScreenType; label: string; icon: React.ReactNode }> = [
  { key: 'dashboard', label: '首页仪表盘', icon: <BarChart3 size={18} /> },
  { key: 'ledger', label: '台账管理', icon: <BookOpen size={18} /> },
  { key: 'orders', label: '订单详情', icon: <FileText size={18} /> },
  { key: 'purchases', label: '采购详情', icon: <ShoppingBag size={18} /> },
  { key: 'sales', label: '销售详情', icon: <Wallet size={18} /> },
  { key: 'system', label: '系统管理', icon: <Database size={18} /> },
];

const screenTitle: Record<ScreenType, string> = {
  dashboard: '仪表盘概览',
  ledger: '项目台账总览',
  orders: '订单详情列表',
  purchases: '采购详情',
  sales: '销售详情',
  system: '系统信息与维护',
};

const screenDesc: Record<ScreenType, string> = {
  dashboard: '查看订单、毛利、应收应付和最近系统动作。',
  ledger: '按项目编号汇总订单、采购、回款、应收和利润。',
  orders: '查看项目下多个订单号和订单明细行。',
  purchases: '跟踪采购合同、供应商、付款与应付账款。',
  sales: '跟踪销售合同、开票、回款与应收账款。',
  system: '查看导入日志、备份记录和数据库连接状态。',
};

function money(value: number | null | undefined) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function numberValue(value: number | null | undefined, digits = 2) {
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: digits }).format(Number(value || 0));
}

function dateValue(value: string | null | undefined) {
  return value ? value.slice(0, 10) : '-';
}

function App() {
  const [screen, setScreen] = useState<ScreenType>('dashboard');
  const [health, setHealth] = useState<{ status: string; database: string; importedRows: number; error?: string } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    api.health().then(setHealth).catch((err) => setError(err.message));
  }, [refreshKey]);

  const refresh = () => setRefreshKey((value) => value + 1);

  async function runImport() {
    setLoading(true);
    setError('');
    try {
      await api.importExcel();
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">ERP</span>
          <span>智能经营管理系统</span>
        </div>
        <div className="nav-group">
          <div className="nav-label">核心业务</div>
          {navItems.slice(0, 5).map((item) => (
            <button
              key={item.key}
              className={`nav-item ${screen === item.key ? 'active' : ''}`}
              onClick={() => setScreen(item.key)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          <div className="nav-label">设置</div>
          {navItems.slice(5).map((item) => (
            <button
              key={item.key}
              className={`nav-item ${screen === item.key ? 'active' : ''}`}
              onClick={() => setScreen(item.key)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
        <div className="sidebar-footer">
          <strong>管理员</strong>
          <div>admin@erp.local</div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>系统核心 / <strong>{screenTitle[screen]}</strong></div>
          <div className="status-pill">
            <Activity size={14} />
            {health ? `${health.database} · ${health.importedRows} 行` : '正在检查后端'}
          </div>
        </header>
        <section className="content">
          <div className="page-title">
            <div>
              <h1>{screenTitle[screen]}</h1>
              <p>{screenDesc[screen]}</p>
            </div>
            <button className="btn" onClick={refresh}>
              <RefreshCw size={16} /> 刷新
            </button>
          </div>
          {error && <div className="error">{error}</div>}
          {screen === 'dashboard' && <DashboardView refreshKey={refreshKey} />}
          {screen === 'ledger' && <LedgerView refreshKey={refreshKey} />}
          {screen === 'orders' && <OrdersView refreshKey={refreshKey} />}
          {screen === 'purchases' && <PurchasesView refreshKey={refreshKey} />}
          {screen === 'sales' && <SalesView refreshKey={refreshKey} />}
          {screen === 'system' && (
            <SystemView
              health={health}
              loading={loading}
              refreshKey={refreshKey}
              onImport={runImport}
            />
          )}
        </section>
      </main>
    </div>
  );
}

function DashboardView({ refreshKey }: { refreshKey: number }) {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<DashboardTrend[]>([]);
  const [ranking, setRanking] = useState<DepartmentRanking[]>([]);
  const [logs, setLogs] = useState<OperationLog[]>([]);

  useEffect(() => {
    Promise.all([
      api.dashboardSummary(),
      api.dashboardTrends(),
      api.departmentRanking(),
      api.logs(),
    ]).then(([summaryData, trendData, rankData, logData]) => {
      setSummary(summaryData);
      setTrends(trendData);
      setRanking(rankData);
      setLogs(logData.items.slice(0, 5));
    });
  }, [refreshKey]);

  if (!summary) return <div className="loading">正在加载仪表盘数据...</div>;

  const maxTrend = Math.max(...trends.map((item) => item.order_amount), 1);
  const maxRank = Math.max(...ranking.map((item) => item.order_amount), 1);

  return (
    <>
      <div className="metric-grid">
        <Metric label="订单总金额" value={money(summary.orderAmount)} />
        <Metric label="毛利润" value={money(summary.grossProfit)} />
        <Metric label="订单总数" value={numberValue(summary.orderCount, 0)} />
        <Metric label="应收账款" value={money(summary.accountsReceivable)} />
        <Metric label="应付账款" value={money(summary.accountsPayable)} />
        <Metric label="已关闭订单" value={numberValue(summary.closedCount, 0)} />
      </div>
      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">订单与毛利润趋势</div>
          <div className="panel-body">
            {trends.map((item) => (
              <div className="bar-row" key={item.month}>
                <span>{item.month}</span>
                <span className="bar"><i style={{ width: `${(item.order_amount / maxTrend) * 100}%` }} /></span>
                <strong>{money(item.order_amount)}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-header">部门订单排行</div>
          <div className="panel-body">
            {ranking.map((item) => (
              <div className="bar-row compact" key={item.department}>
                <span>{item.department}</span>
                <span className="bar"><i style={{ width: `${(item.order_amount / maxRank) * 100}%` }} /></span>
                <strong>{money(item.order_amount)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="panel">
        <div className="panel-header">最近操作日志</div>
        <DataTable
          columns={['用户', '模块', '动作', '详情', '时间']}
          rows={logs.map((log) => [
            log.user_name || 'system',
            log.module_name,
            log.action_name,
            log.detail,
            dateValue(log.created_at),
          ])}
        />
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function LedgerView({ refreshKey }: { refreshKey: number }) {
  const [items, setItems] = useState<ProjectLedger[]>([]);
  const [filters, setFilters] = useState({ project_id: '', department: '', manager: '', client_unit: '', order_id: '' });

  useEffect(() => {
    api.ledgers(filters).then((result) => setItems(result.items));
  }, [refreshKey]);

  function search() {
    api.ledgers(filters).then((result) => setItems(result.items));
  }

  return (
    <>
      <Filters
        fields={[
          ['project_id', '项目编号'],
          ['department', '部门'],
          ['manager', '客户经理'],
          ['client_unit', '客户单位'],
          ['order_id', '订单号'],
        ]}
        values={filters}
        onChange={setFilters}
        onSearch={search}
      />
      <div className="panel">
        <div className="panel-header">项目台账 ({items.length})</div>
        <DataTable
          columns={['项目编号', '客户单位', '项目名称', '订单数', '订单金额', '采购金额', '回款合计', '应收款', '毛利润']}
          rows={items.map((item) => [
            item.project_code,
            item.customer_unit_name || '-',
            item.project_name || '-',
            item.order_count,
            money(item.order_amount),
            money(item.purchase_amount),
            money(item.total_received),
            money(item.accounts_receivable),
            money(item.gross_profit),
          ])}
          numeric={[3, 4, 5, 6, 7, 8]}
        />
      </div>
    </>
  );
}

function OrdersView({ refreshKey }: { refreshKey: number }) {
  const [items, setItems] = useState<OrderRecord[]>([]);
  const [filters, setFilters] = useState({ project_id: '', order_id: '', business_type: '', client_unit: '' });

  useEffect(() => {
    api.orders(filters).then((result) => setItems(result.items));
  }, [refreshKey]);

  return (
    <>
      <Filters
        fields={[
          ['project_id', '项目编号'],
          ['order_id', '订单号'],
          ['business_type', '业务类型'],
          ['client_unit', '客户单位'],
        ]}
        values={filters}
        onChange={setFilters}
        onSearch={() => api.orders(filters).then((result) => setItems(result.items))}
      />
      <div className="panel">
        <div className="panel-header">订单明细 ({items.length})</div>
        <DataTable
          columns={['项目编号', '订单号', '订单日期', '货物名称', '数量', '单位', '订单价值', '交付数量', '业务类型']}
          rows={items.map((item) => [
            item.project_code,
            item.order_no,
            dateValue(item.order_date),
            item.goods_name || '-',
            numberValue(item.quantity, 4),
            item.unit_name || '-',
            money(item.order_value),
            numberValue(item.delivery_quantity, 4),
            item.business_type || '-',
          ])}
          numeric={[4, 6, 7]}
        />
      </div>
    </>
  );
}

function PurchasesView({ refreshKey }: { refreshKey: number }) {
  const [items, setItems] = useState<PurchaseRecord[]>([]);
  const [filters, setFilters] = useState({ project_id: '', order_id: '', manager: '', department: '' });

  useEffect(() => {
    api.purchases(filters).then((result) => setItems(result.items));
  }, [refreshKey]);

  return (
    <>
      <Filters
        fields={[
          ['project_id', '项目编号'],
          ['order_id', '订单号'],
          ['manager', '客户经理'],
          ['department', '部门'],
        ]}
        values={filters}
        onChange={setFilters}
        onSearch={() => api.purchases(filters).then((result) => setItems(result.items))}
      />
      <div className="panel">
        <div className="panel-header">采购明细 ({items.length})</div>
        <DataTable
          columns={['项目编号', '订单号', '客户经理', '部门', '供应商', '采购合同号', '合同金额', '采购金额', '已付款', '应付账款']}
          rows={items.map((item) => [
            item.project_code,
            item.order_no,
            item.account_manager || '-',
            item.department || '-',
            item.supplier_name || '-',
            item.purchase_contract_no || '-',
            money(item.purchase_contract_signed_amount),
            money(item.purchase_amount),
            money(item.total_paid),
            money(item.accounts_payable),
          ])}
          numeric={[6, 7, 8, 9]}
        />
      </div>
    </>
  );
}

function SalesView({ refreshKey }: { refreshKey: number }) {
  const [items, setItems] = useState<SalesRecord[]>([]);
  const [filters, setFilters] = useState({ project_id: '', order_id: '', manager: '', department: '' });

  useEffect(() => {
    api.sales(filters).then((result) => setItems(result.items));
  }, [refreshKey]);

  return (
    <>
      <Filters
        fields={[
          ['project_id', '项目编号'],
          ['order_id', '订单号'],
          ['manager', '客户经理'],
          ['department', '部门'],
        ]}
        values={filters}
        onChange={setFilters}
        onSearch={() => api.sales(filters).then((result) => setItems(result.items))}
      />
      <div className="panel">
        <div className="panel-header">销售明细 ({items.length})</div>
        <DataTable
          columns={['项目编号', '订单号', '客户经理', '部门', '销售合同号', '签订日期', '合同价值', '开票金额', '回款合计', '应收款']}
          rows={items.map((item) => [
            item.project_code,
            item.order_no,
            item.account_manager || '-',
            item.department || '-',
            item.sales_contract_no || '-',
            dateValue(item.sales_contract_signed_date),
            money(item.sales_contract_value),
            money(item.sales_invoice_amount),
            money(item.total_received),
            money(item.accounts_receivable),
          ])}
          numeric={[6, 7, 8, 9]}
        />
      </div>
    </>
  );
}

function SystemView({
  health,
  loading,
  refreshKey,
  onImport,
}: {
  health: { status: string; database: string; importedRows: number; error?: string } | null;
  loading: boolean;
  refreshKey: number;
  onImport: () => void;
}) {
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [backups, setBackups] = useState<BackupInfo[]>([]);

  useEffect(() => {
    Promise.all([api.logs(), api.backups()]).then(([logData, backupData]) => {
      setLogs(logData.items);
      setBackups(backupData.items);
    });
  }, [refreshKey]);

  return (
    <>
      <div className="panel system-card">
        <div>
          <strong>后端状态</strong>
          <p>{health ? `${health.status} / ${health.database} / ${health.importedRows} 行` : '正在检查'}</p>
          {health?.error && <p className="danger">{health.error}</p>}
        </div>
        <button className="btn primary" disabled={loading} onClick={onImport}>
          <Archive size={16} /> {loading ? '正在导入...' : '重新导入 Excel'}
        </button>
      </div>
      <div className="panel">
        <div className="panel-header">操作日志</div>
        <DataTable
          columns={['用户', '模块', '动作', '详情', '状态', '时间']}
          rows={logs.map((log) => [
            log.user_name || 'system',
            log.module_name,
            log.action_name,
            log.detail,
            log.status,
            dateValue(log.created_at),
          ])}
        />
      </div>
      <div className="panel">
        <div className="panel-header">备份记录</div>
        <DataTable
          columns={['文件名', '大小', '类型', '状态', '路径', '时间']}
          rows={backups.map((item) => [
            item.file_name,
            item.file_size_label || '-',
            item.backup_type,
            item.status,
            item.storage_path || '-',
            dateValue(item.backup_time),
          ])}
        />
      </div>
    </>
  );
}

function Filters<T extends Record<string, string>>({
  fields,
  values,
  onChange,
  onSearch,
}: {
  fields: Array<[keyof T & string, string]>;
  values: T;
  onChange: (value: T) => void;
  onSearch: () => void;
}) {
  return (
    <div className="toolbar">
      <div className="filter-grid">
        {fields.map(([key, label]) => (
          <div className="field" key={key}>
            <label>{label}</label>
            <input
              value={values[key] || ''}
              onChange={(event) => onChange({ ...values, [key]: event.target.value })}
              placeholder={`请输入${label}`}
            />
          </div>
        ))}
      </div>
      <div className="actions">
        <button className="btn" onClick={() => onChange(Object.fromEntries(fields.map(([key]) => [key, ''])) as T)}>
          重置
        </button>
        <button className="btn primary" onClick={onSearch}>
          <Search size={16} /> 查询
        </button>
      </div>
    </div>
  );
}

function DataTable({ columns, rows, numeric = [] }: { columns: string[]; rows: Array<Array<React.ReactNode>>; numeric?: number[] }) {
  const numericSet = useMemo(() => new Set(numeric), [numeric]);
  if (rows.length === 0) {
    return <div className="empty">暂无数据</div>;
  }
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={column} className={numericSet.has(index) ? 'num' : ''}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className={numericSet.has(cellIndex) ? 'num' : ''}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
