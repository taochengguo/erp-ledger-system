import assert from 'node:assert/strict';

import {
  applyLedgerFilters,
  applyOrderFilters,
  emptyLedgerFilters,
  emptyOrderFilters,
  submitQueryFilters,
} from '../src/lib/queryFilterModel';

const ledgers = [
  {
    id: 'P-1',
    clientUnit: '客户A',
    projectName: '项目A',
    orderAmount: 100,
    purchaseAmount: 50,
    totalReceived: 20,
    department: '科贸部',
    manager: '张三',
    orderId: '1 个订单',
    orderStatus: 'open',
    orderDate: '2026-06-01',
  },
  {
    id: 'P-2',
    clientUnit: '客户B',
    projectName: '项目B',
    orderAmount: 200,
    purchaseAmount: 70,
    totalReceived: 100,
    department: '政企部',
    manager: '李四',
    orderId: '2 个订单',
    orderStatus: 'closed',
    orderDate: '2026-06-02',
  },
];

const orders = [
  {
    projectId: 'P-1',
    orderId: 'SO-1',
    orderDate: '2026-06-01',
    goodsName: '设备A',
    quantity: '1 台',
    orderValue: 100,
    deliveredQty: 1,
    businessType: '设备销售',
    clientUnit: '客户A',
  },
  {
    projectId: 'P-2',
    orderId: 'SO-2',
    orderDate: '2026-06-02',
    goodsName: '服务B',
    quantity: '1 项',
    orderValue: 200,
    deliveredQty: 0,
    businessType: '咨询服务',
    clientUnit: '客户B',
  },
];

const draftLedgerFilters = { ...emptyLedgerFilters, projectId: 'P-2' };
let submittedLedgerFilters = emptyLedgerFilters;

assert.equal(applyLedgerFilters(ledgers, submittedLedgerFilters).length, 2);
submittedLedgerFilters = submitQueryFilters(draftLedgerFilters);
assert.deepEqual(
  applyLedgerFilters(ledgers, submittedLedgerFilters).map((item) => item.id),
  ['P-2'],
);

const draftOrderFilters = { ...emptyOrderFilters, businessType: '咨询' };
let submittedOrderFilters = emptyOrderFilters;

assert.equal(applyOrderFilters(orders, submittedOrderFilters).length, 2);
submittedOrderFilters = submitQueryFilters(draftOrderFilters);
assert.deepEqual(
  applyOrderFilters(orders, submittedOrderFilters).map((item) => item.orderId),
  ['SO-2'],
);

console.log('query filter model tests passed');
