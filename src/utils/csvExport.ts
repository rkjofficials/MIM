import { Asset, Bill, Server } from '../types';

/**
 * Escapes CSV field value according to RFC 4180
 */
function escapeCsv(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates CSV content from array of Assets
 */
export function exportAssetsToCsv(assets: Asset[]): string {
  const headers = [
    'Asset Tag',
    'Asset Name',
    'Category',
    'Property',
    'Serial Number',
    'Vendor ID',
    'Location',
    'Purchase Date',
    'Warranty Expiry',
    'Cost (USD)',
    'Status',
    'Notes'
  ];

  const rows = assets.map(a => [
    escapeCsv(a.assetTag),
    escapeCsv(a.name),
    escapeCsv(a.category),
    escapeCsv(a.propertyName || a.propertyId || ''),
    escapeCsv(a.serialNumber),
    escapeCsv(a.vendorId || ''),
    escapeCsv(a.location),
    escapeCsv(a.purchaseDate),
    escapeCsv(a.warrantyExpiry),
    escapeCsv(a.cost ?? ''),
    escapeCsv(a.status),
    escapeCsv(a.notes || '')
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
}

/**
 * Generates CSV content from array of Bills
 */
export function exportBillsToCsv(bills: Bill[]): string {
  const headers = [
    'Bill / Invoice Number',
    'Vendor Name',
    'Property',
    'Amount (USD)',
    'Category',
    'Status',
    'Issue Date',
    'Due Date',
    'PO Number',
    'Payment Reference',
    'Paid Date',
    'Submitted By',
    'Notes'
  ];

  const rows = bills.map(b => [
    escapeCsv(b.billNumber),
    escapeCsv(b.vendorName),
    escapeCsv(b.propertyName),
    escapeCsv(b.amount),
    escapeCsv(b.billingCategory),
    escapeCsv(b.status),
    escapeCsv(b.issueDate),
    escapeCsv(b.dueDate),
    escapeCsv(b.poNumber || ''),
    escapeCsv(b.paymentReference || ''),
    escapeCsv(b.paidDate || ''),
    escapeCsv(b.submittedBy),
    escapeCsv(b.notes || '')
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
}

/**
 * Triggers browser download of CSV string file
 */
export function triggerCsvDownload(csvContent: string, filename: string): void {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
