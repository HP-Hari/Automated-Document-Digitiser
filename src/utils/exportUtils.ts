import * as XLSX from 'xlsx';
import { DigitizedInvoice } from '../types';

export function exportToExcel(invoices: DigitizedInvoice[], fileName = 'Digitized_Invoices_Report.xlsx') {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Invoices Summary
  const summaryData = invoices.map((inv) => ({
    'Invoice Number': inv.invoiceNumber,
    'Vendor Name': inv.vendorName,
    'Vendor GSTIN': inv.vendorGstin || 'N/A',
    'Category': inv.category,
    'Invoice Date': inv.invoiceDate,
    'Due Date': inv.dueDate || 'N/A',
    'Subtotal': inv.subtotal,
    'Tax (GST)': inv.taxGst,
    'Discount': inv.discount,
    'Total Amount': inv.totalAmount,
    'Currency': inv.currency,
    'Confidence Score (%)': `${inv.confidenceScore}%`,
    'Status': inv.status,
    'Anomalies Count': inv.anomalies.length,
    'Items Count': inv.items.length,
    'Processed At': inv.processedAt,
  }));

  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Invoices_Summary');

  // Sheet 2: Detailed Line Items
  const itemsData: any[] = [];
  invoices.forEach((inv) => {
    inv.items.forEach((item, idx) => {
      itemsData.push({
        'Invoice Number': inv.invoiceNumber,
        'Vendor Name': inv.vendorName,
        'Category': inv.category,
        'Line Item #': idx + 1,
        'Description': item.description,
        'Quantity': item.quantity,
        'Unit Price': item.unitPrice,
        'Total Line Price': item.totalPrice,
        'HSN/SAC Code': item.hsnCode || 'N/A',
      });
    });
  });

  const wsItems = XLSX.utils.json_to_sheet(itemsData);
  XLSX.utils.book_append_sheet(wb, wsItems, 'Extracted_Line_Items');

  // Generate binary and download
  XLSX.writeFile(wb, fileName);
}

export function exportSingleInvoiceToExcel(invoice: DigitizedInvoice) {
  exportToExcel([invoice], `Invoice_${invoice.invoiceNumber}_Digitized.xlsx`);
}

export function exportToCsv(invoices: DigitizedInvoice[], fileName = 'Digitized_Invoices.csv') {
  const headers = [
    'Invoice Number',
    'Vendor Name',
    'GSTIN',
    'Date',
    'Category',
    'Subtotal',
    'Tax (GST)',
    'Total Amount',
    'Status',
    'Confidence',
  ];

  const rows = invoices.map((inv) => [
    `"${inv.invoiceNumber}"`,
    `"${inv.vendorName.replace(/"/g, '""')}"`,
    `"${inv.vendorGstin || ''}"`,
    `"${inv.invoiceDate}"`,
    `"${inv.category}"`,
    inv.subtotal,
    inv.taxGst,
    inv.totalAmount,
    `"${inv.status}"`,
    `"${inv.confidenceScore}%"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  downloadBlob(csvContent, 'text/csv;charset=utf-8;', fileName);
}

export function exportToJson(data: any, fileName = 'digitized_invoices.json') {
  const jsonStr = JSON.stringify(data, null, 2);
  downloadBlob(jsonStr, 'application/json;charset=utf-8;', fileName);
}

function downloadBlob(content: string, mimeType: string, filename: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
