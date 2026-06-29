import assert from 'node:assert/strict';

import { aggregateSalesOrderRows, buildSalesInvoiceDraft, getNextReceiptPhase } from '../src/lib/salesDetailModel';

assert.equal(getNextReceiptPhase([]), 1);
assert.equal(getNextReceiptPhase([{ phase_no: 1 }, { phase_no: 2 }]), 3);

assert.deepEqual(
  buildSalesInvoiceDraft({ contractValue: 1000, invoiceAmount: 250 }),
  {
    invoice_doc_no: '',
    invoice_date: '',
    invoice_no: '',
    invoice_amount: '250',
    pending_invoice_amount: '750',
    delivered_not_invoiced_amount: '',
  },
);

assert.deepEqual(
  aggregateSalesOrderRows([
    {
      project_code: 'AH-1',
      order_no: 'SO-1',
      account_manager: '张三',
      department: '科贸部',
      order_value: 100,
      purchase_amount: 30,
      delivery_value: 80,
      sales_contract_value: 90,
      sales_invoice_amount: 20,
      total_received: 10,
      accounts_receivable: 90,
    },
    {
      project_code: 'AH-1',
      order_no: 'SO-1',
      account_manager: '张三',
      department: '科贸部',
      order_value: 250,
      purchase_amount: 70,
      delivery_value: 200,
      sales_contract_value: 260,
      sales_invoice_amount: 40,
      total_received: 30,
      accounts_receivable: 220,
    },
  ]),
  {
    project_code: 'AH-1',
    order_no: 'SO-1',
    account_manager: '张三',
    department: '科贸部',
    order_value: 350,
    purchase_amount: 100,
    delivery_value: 280,
    sales_contract_value: 350,
    sales_invoice_amount: 60,
    total_received: 40,
    accounts_receivable: 310,
    matched_line_count: 2,
  },
);

console.log('sales detail model tests passed');
