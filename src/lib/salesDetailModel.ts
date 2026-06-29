type ReceiptLike = { phase_no?: number | null };

type SalesDraftSource = {
  contractValue: number;
  invoiceAmount: number;
};

type SalesOrderRow = Record<string, string | number | null | undefined>;

const aggregateAmountKeys = [
  'order_value',
  'purchase_amount',
  'delivery_value',
  'purchase_contract_signed_amount',
  'sales_contract_value',
  'sales_invoice_amount',
  'total_received',
  'accounts_receivable',
  'gross_profit',
];

export function getNextReceiptPhase(receipts: ReceiptLike[]) {
  return receipts.length + 1;
}

export function buildSalesInvoiceDraft(source: SalesDraftSource) {
  const pendingAmount = Math.max(0, Number(source.contractValue || 0) - Number(source.invoiceAmount || 0));
  return {
    invoice_doc_no: '',
    invoice_date: '',
    invoice_no: '',
    invoice_amount: String(Number(source.invoiceAmount || 0)),
    pending_invoice_amount: String(pendingAmount),
    delivered_not_invoiced_amount: '',
  };
}

export function aggregateSalesOrderRows(rows: SalesOrderRow[]) {
  const first = rows[0] || {};
  const aggregate: SalesOrderRow = {};

  Object.entries(first).forEach(([key, value]) => {
    aggregate[key] = value;
  });

  aggregateAmountKeys
    .filter((key) => rows.some((row) => Object.prototype.hasOwnProperty.call(row, key)))
    .forEach((key) => {
      aggregate[key] = rows.reduce((total, row) => total + Number(row[key] || 0), 0);
    });

  rows.forEach((row) => {
    Object.entries(row).forEach(([key, value]) => {
      if ((aggregate[key] === null || aggregate[key] === undefined || aggregate[key] === '') && value !== null && value !== undefined && value !== '') {
        aggregate[key] = value;
      }
    });
  });

  aggregate.matched_line_count = rows.length;
  return aggregate;
}
