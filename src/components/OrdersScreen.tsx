import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Trash2, 
  Info,
  Layers,
  Sparkles,
  ShoppingBag,
  MoreVertical
} from 'lucide-react';
import { OrderRecord } from '../types';

interface OrdersScreenProps {
  orders: OrderRecord[];
  onAddOrder: (order: OrderRecord) => void;
}

function getPaginationItems(totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 4) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  return [1, 2, 'ellipsis', totalPages - 1, totalPages];
}

export default function OrdersScreen({ orders, onAddOrder }: OrdersScreenProps) {
  // Query Filters State
  const [projectId, setProjectId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [clientUnit, setClientUnit] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // New Order Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newOrder, setNewOrder] = useState({
    projectId: '',
    orderId: '',
    orderDate: new Date().toISOString().split('T')[0],
    goodsName: '',
    quantityVal: '',
    quantityUnit: '套',
    orderValue: '',
    deliveredQty: '0',
    businessType: '咨询服务',
    clientUnit: ''
  });

  // Reset Filters
  const handleReset = () => {
    setProjectId('');
    setOrderId('');
    setOrderDate('');
    setBusinessType('');
    setClientUnit('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(item => {
      if (projectId && !item.projectId.toLowerCase().includes(projectId.toLowerCase())) return false;
      if (orderId && !item.orderId.toLowerCase().includes(orderId.toLowerCase())) return false;
      if (orderDate && item.orderDate !== orderDate) return false;
      if (businessType && !item.businessType.toLowerCase().includes(businessType.toLowerCase())) return false;
      if (clientUnit && !item.clientUnit.toLowerCase().includes(clientUnit.toLowerCase())) return false;
      if (startDate && item.orderDate < startDate) return false;
      if (endDate && item.orderDate > endDate) return false;
      return true;
    });
  }, [orders, projectId, orderId, orderDate, businessType, clientUnit, startDate, endDate]);

  // Paginated Orders
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const paginationItems = getPaginationItems(totalPages);

  // Form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.projectId || !newOrder.orderId || !newOrder.goodsName || !newOrder.clientUnit) {
      alert('请填写所有必填字段（* 标记）。');
      return;
    }

    onAddOrder({
      projectId: newOrder.projectId,
      orderId: newOrder.orderId,
      orderDate: newOrder.orderDate,
      goodsName: newOrder.goodsName,
      quantity: `${newOrder.quantityVal} ${newOrder.quantityUnit}`,
      orderValue: parseFloat(newOrder.orderValue) || 0,
      deliveredQty: parseInt(newOrder.deliveredQty) || 0,
      businessType: newOrder.businessType,
      clientUnit: newOrder.clientUnit
    });

    // Reset Form Data
    setNewOrder({
      projectId: '',
      orderId: '',
      orderDate: new Date().toISOString().split('T')[0],
      goodsName: '',
      quantityVal: '',
      quantityUnit: '套',
      orderValue: '',
      deliveredQty: '0',
      businessType: '咨询服务',
      clientUnit: ''
    });

    setShowAddModal(false);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 min-w-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">订单详情列表</h1>
          <p className="text-sm text-slate-500 font-sans mt-1">查看和管理全平台的客户订单与项目进度详情</p>
        </div>
        <div className="flex items-center self-start sm:self-center">
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>新增订单</span>
          </button>
        </div>
      </div>

      {/* Filter / Query Bar */}
      <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4 overflow-x-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end min-w-0">
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

          {/* Order Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">订单日期</label>
            <input 
              type="date" 
              value={orderDate}
              onChange={e => { setOrderDate(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-xs text-slate-700"
            />
          </div>

          {/* Business Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">业务类型</label>
            <input
              type="text"
              placeholder="输入业务类型"
              value={businessType}
              onChange={e => { setBusinessType(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-xs text-slate-700"
            />
          </div>

          {/* Client Unit */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-500">客户单位</label>
            <input 
              type="text" 
              placeholder="输入客户名称"
              value={clientUnit}
              onChange={e => { setClientUnit(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-xs text-slate-700"
            />
          </div>

          {/* Date range selection */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-medium text-slate-500">订单日期范围</label>
            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={startDate}
                onChange={e => { setStartDate(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-xs text-slate-700"
              />
              <span className="text-slate-400 text-xs">至</span>
              <input 
                type="date" 
                value={endDate}
                onChange={e => { setEndDate(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-xs text-slate-700"
              />
            </div>
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

      {/* Table Section */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-w-0">
        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-left border-collapse table-fixed min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200">
                <th className="px-6 py-3.5 font-semibold text-xs text-slate-500 w-[140px]">项目编号</th>
                <th className="px-6 py-3.5 font-semibold text-xs text-slate-500 w-[160px]">订单号</th>
                <th className="px-6 py-3.5 font-semibold text-xs text-slate-500 w-[120px]">订单日期</th>
                <th className="px-6 py-3.5 font-semibold text-xs text-slate-500 w-[240px]">货物名称</th>
                <th className="px-6 py-3.5 font-semibold text-xs text-slate-500 text-center w-[90px]">数量</th>
                <th className="px-6 py-3.5 font-semibold text-xs text-slate-500 text-right w-[140px]">订单价值</th>
                <th className="px-6 py-3.5 font-semibold text-xs text-slate-500 text-center w-[90px]">交付数量</th>
                <th className="px-6 py-3.5 font-semibold text-xs text-slate-500 text-center w-[80px]">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-slate-400 text-sm">
                    暂无符合条件的订单记录
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((item, index) => (
                  <tr key={`${item.orderId}-${index}`} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 text-xs font-mono text-slate-500">{item.projectId}</td>
                    <td className="px-6 py-4 text-xs font-mono font-semibold text-blue-600">{item.orderId}</td>
                    <td className="px-6 py-4 text-xs text-slate-600 font-mono">{item.orderDate}</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-900 truncate" title={item.goodsName}>{item.goodsName}</td>
                    <td className="px-6 py-4 text-xs text-center text-slate-700 font-sans">{item.quantity}</td>
                    <td className="px-6 py-4 text-xs text-right font-mono font-medium text-slate-900">
                      ¥{new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2 }).format(item.orderValue)}
                    </td>
                    <td className="px-6 py-4 text-xs text-center font-mono font-semibold text-slate-800">{item.deliveredQty}</td>
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

        {/* Pagination Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between overflow-x-auto">
          <span className="text-xs text-slate-500">
            显示 {filteredOrders.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} 到 {Math.min(currentPage * itemsPerPage, filteredOrders.length)} 条，共 {filteredOrders.length} 条记录
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

      {/* Add New Order Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden transform transition-all scale-100 duration-150">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-blue-600" />
                <span>新增客户订单</span>
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
                    placeholder="如: PRJ-2023-001"
                    value={newOrder.projectId}
                    onChange={e => setNewOrder({...newOrder, projectId: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Order Id */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">订单号 *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="如: ORD-2023-9009"
                    value={newOrder.orderId}
                    onChange={e => setNewOrder({...newOrder, orderId: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Order Date */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">订单日期 *</label>
                  <input 
                    type="date" 
                    required
                    value={newOrder.orderDate}
                    onChange={e => setNewOrder({...newOrder, orderDate: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Business Type */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">业务类型 *</label>
                  <input
                    type="text"
                    required
                    placeholder="输入业务类型"
                    value={newOrder.businessType}
                    onChange={e => setNewOrder({...newOrder, businessType: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                  />
                </div>

                {/* Client Unit */}
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-600">客户单位 *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="如: 中国航天科技集团"
                    value={newOrder.clientUnit}
                    onChange={e => setNewOrder({...newOrder, clientUnit: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                  />
                </div>

                {/* Goods Name */}
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-600">货物/服务名称 *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="如: 网络安全态势感知平台软件"
                    value={newOrder.goodsName}
                    onChange={e => setNewOrder({...newOrder, goodsName: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                  />
                </div>

                {/* Quantity */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">数量 *</label>
                  <div className="flex gap-1.5">
                    <input 
                      type="number" 
                      required
                      placeholder="1"
                      value={newOrder.quantityVal}
                      onChange={e => setNewOrder({...newOrder, quantityVal: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                    />
                    <select 
                      value={newOrder.quantityUnit}
                      onChange={e => setNewOrder({...newOrder, quantityUnit: e.target.value})}
                      className="px-2 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 bg-white w-20"
                    >
                      <option value="套">套</option>
                      <option value="节点">节点</option>
                      <option value="台">台</option>
                      <option value="人月">人月</option>
                      <option value="项">项</option>
                    </select>
                  </div>
                </div>

                {/* Order Value */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">订单价值 (元) *</label>
                  <input 
                    type="number" 
                    required
                    placeholder="0.00"
                    value={newOrder.orderValue}
                    onChange={e => setNewOrder({...newOrder, orderValue: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500"
                  />
                </div>

                {/* Delivered quantity */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">交付数量</label>
                  <input 
                    type="number" 
                    placeholder="0"
                    value={newOrder.deliveredQty}
                    onChange={e => setNewOrder({...newOrder, deliveredQty: e.target.value})}
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
                  确认保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
