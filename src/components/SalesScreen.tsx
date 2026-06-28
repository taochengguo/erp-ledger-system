import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  FileSpreadsheet,
  MoreVertical,
  Banknote
} from 'lucide-react';
import { SalesRecord } from '../types';

interface SalesScreenProps {
  sales: SalesRecord[];
  onAddSales: (sale: SalesRecord) => void;
}

function getPaginationItems(totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 4) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  return [1, 2, 'ellipsis', totalPages - 1, totalPages];
}

export default function SalesScreen({ sales, onAddSales }: SalesScreenProps) {
  // Query Filters State
  const [projectId, setProjectId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [manager, setManager] = useState('');
  const [department, setDepartment] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // New Sale Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSale, setNewSale] = useState({
    projectId: '',
    orderId: '',
    manager: '',
    department: 'IT基础设施部',
    contractNo: '',
    contractDate: new Date().toISOString().split('T')[0],
    contractValue: '',
    invoiceAmount: ''
  });

  // Reset Filters
  const handleReset = () => {
    setProjectId('');
    setOrderId('');
    setManager('');
    setDepartment('');
    setCurrentPage(1);
  };

  // Filtered Sales
  const filteredSales = useMemo(() => {
    return sales.filter(item => {
      if (projectId && !item.projectId.toLowerCase().includes(projectId.toLowerCase())) return false;
      if (orderId && !item.orderId.toLowerCase().includes(orderId.toLowerCase())) return false;
      if (manager && !item.manager.toLowerCase().includes(manager.toLowerCase())) return false;
      if (department && item.department !== department) return false;
      return true;
    });
  }, [sales, projectId, orderId, manager, department]);

  // Paginated Sales
  const paginatedSales = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSales.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSales, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / itemsPerPage));
  const paginationItems = getPaginationItems(totalPages);

  // Form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSale.projectId || !newSale.orderId || !newSale.manager || !newSale.contractNo || !newSale.contractValue) {
      alert('请填写所有必填字段 (* 标记)。');
      return;
    }

    onAddSales({
      projectId: newSale.projectId,
      orderId: newSale.orderId,
      manager: newSale.manager,
      department: newSale.department,
      contractNo: newSale.contractNo,
      contractDate: newSale.contractDate,
      contractValue: parseFloat(newSale.contractValue) || 0,
      invoiceAmount: parseFloat(newSale.invoiceAmount) || 0
    });

    // Reset Form Data
    setNewSale({
      projectId: '',
      orderId: '',
      manager: '',
      department: 'IT基础设施部',
      contractNo: '',
      contractDate: new Date().toISOString().split('T')[0],
      contractValue: '',
      invoiceAmount: ''
    });

    setShowAddModal(false);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">销售详情</h1>
          <p className="text-sm text-slate-500 font-sans mt-1">核算与监控销售收入、合同账期与开票情况</p>
        </div>
        <div className="flex items-center self-start sm:self-center">
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>新增销售</span>
          </button>
        </div>
      </div>

      {/* Filter / Query Bar */}
      <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Project ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">项目编号</label>
            <input 
              type="text" 
              placeholder="输入项目编号"
              value={projectId}
              onChange={e => { setProjectId(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-xs text-slate-700"
            />
          </div>

          {/* Order ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">订单号</label>
            <input 
              type="text" 
              placeholder="输入订单号"
              value={orderId}
              onChange={e => { setOrderId(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-xs text-slate-700"
            />
          </div>

          {/* Manager */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">客户经理</label>
            <input 
              type="text" 
              placeholder="请输入客户经理姓名"
              value={manager}
              onChange={e => { setManager(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-xs text-slate-700"
            />
          </div>

          {/* Department */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">部门</label>
            <select 
              value={department}
              onChange={e => { setDepartment(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white text-xs text-slate-700"
            >
              <option value="">全部部门</option>
              <option value="IT基础设施部">IT基础设施部</option>
              <option value="安防事业部">安防事业部</option>
              <option value="数据研发中心">数据研发中心</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button 
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg shadow-sm transition-all text-xs font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>重置</span>
          </button>
          <button 
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all text-xs font-semibold"
          >
            <Search className="w-3.5 h-3.5" />
            <span>查询</span>
          </button>
        </div>
      </section>

      {/* Main Table */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span>销售列表</span>
          </h3>
          <button 
            onClick={() => alert('销售明细表报表导出成功！')}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold"
          >
            导出报表
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200">
                <th className="px-6 py-3.5 font-semibold text-xs text-slate-500 w-[140px]">项目编号</th>
                <th className="px-6 py-3.5 font-semibold text-xs text-slate-500 w-[160px]">订单号</th>
                <th className="px-6 py-3.5 font-semibold text-xs text-slate-500 w-[120px]">客户经理</th>
                <th className="px-6 py-3.5 font-semibold text-xs text-slate-500 w-[140px]">公司合同号</th>
                <th className="px-6 py-3.5 font-semibold text-xs text-slate-500 w-[120px]">合同签订日期</th>
                <th className="px-6 py-3.5 font-semibold text-xs text-slate-500 text-right w-[140px]">合同价值</th>
                <th className="px-6 py-3.5 font-semibold text-xs text-slate-500 text-right w-[140px]">开票金额</th>
                <th className="px-6 py-3.5 font-semibold text-xs text-slate-500 text-center w-[80px]">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-slate-400 text-sm">
                    暂无符合条件的销售记录
                  </td>
                </tr>
              ) : (
                paginatedSales.map((item, index) => (
                  <tr key={`${item.contractNo}-${index}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono text-slate-500">{item.projectId}</td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-500 truncate" title={item.orderId}>{item.orderId}</td>
                    <td className="px-6 py-4 text-xs text-slate-700 font-medium">{item.manager}</td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-800">{item.contractNo}</td>
                    <td className="px-6 py-4 text-xs text-slate-600 font-mono">{item.contractDate}</td>
                    <td className="px-6 py-4 text-xs text-right font-mono font-medium text-slate-900">
                      ¥{new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2 }).format(item.contractValue)}
                    </td>
                    <td className="px-6 py-4 text-xs text-right font-mono text-emerald-600 font-medium">
                      ¥{new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2 }).format(item.invoiceAmount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between overflow-x-auto">
          <span className="text-xs text-slate-500">
            显示 {filteredSales.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} 到 {Math.min(currentPage * itemsPerPage, filteredSales.length)} 条，共 {filteredSales.length} 条记录
          </span>
          <div className="flex items-center gap-1">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-1.5 rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {paginationItems.map((item, index) =>
              item === 'ellipsis' ? (
                <span key={`ellipsis-${index}`} className="px-2 text-xs font-semibold text-slate-400">
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  onClick={() => setCurrentPage(item)}
                  className={`w-8 h-8 rounded text-xs font-bold transition-all ${
                    currentPage === item
                      ? 'bg-blue-600 text-white border border-blue-600 shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {item}
                </button>
              ),
            )}

            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="p-1.5 rounded border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="ml-3 flex items-center gap-1 text-xs text-slate-500">
              <span>跳转至</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={e => {
                  const val = parseInt(e.target.value);
                  if (val >= 1 && val <= totalPages) {
                    setCurrentPage(val);
                  }
                }}
                className="w-12 h-8 border border-slate-200 rounded text-center text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
              <span>页</span>
            </div>
          </div>
        </div>
      </section>

      {/* Add New Sale Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden transform transition-all scale-100 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Banknote className="w-4 h-4 text-blue-600" />
                <span>录入新销售合同</span>
              </h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-semibold"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Project Id */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">项目编号 *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="如: PRJ-2023-018"
                    value={newSale.projectId}
                    onChange={e => setNewSale({...newSale, projectId: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Order Id */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">订单号 *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="如: SO-20231201-112"
                    value={newSale.orderId}
                    onChange={e => setNewSale({...newSale, orderId: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Manager */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">客户经理 *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="如: 李娜"
                    value={newSale.manager}
                    onChange={e => setNewSale({...newSale, manager: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                  />
                </div>

                {/* Department */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">负责部门 *</label>
                  <select 
                    value={newSale.department}
                    onChange={e => setNewSale({...newSale, department: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="IT基础设施部">IT基础设施部</option>
                    <option value="安防事业部">安防事业部</option>
                    <option value="数据研发中心">数据研发中心</option>
                  </select>
                </div>

                {/* Company Contract No */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">公司合同号 *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="如: CONT-D-154"
                    value={newSale.contractNo}
                    onChange={e => setNewSale({...newSale, contractNo: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                  />
                </div>

                {/* Contract Date */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">合同签订日期 *</label>
                  <input 
                    type="date" 
                    required
                    value={newSale.contractDate}
                    onChange={e => setNewSale({...newSale, contractDate: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                  />
                </div>

                {/* Contract Value */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">合同价值 (元) *</label>
                  <input 
                    type="number" 
                    required
                    placeholder="0.00"
                    value={newSale.contractValue}
                    onChange={e => setNewSale({...newSale, contractValue: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                  />
                </div>

                {/* Invoice Amount */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">开票金额 (元)</label>
                  <input 
                    type="number" 
                    placeholder="0.00"
                    value={newSale.invoiceAmount}
                    onChange={e => setNewSale({...newSale, invoiceAmount: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                >
                  保存销售
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
