import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  FileSpreadsheet,
  Download,
  Eye,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Building2,
  Calendar,
  Layers,
  ArrowUpDown,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';
import { DigitizedInvoice, InvoiceCategory } from '../types';
import { exportToExcel, exportToCsv, exportToJson } from '../utils/exportUtils';

interface InvoiceDatabaseDashboardProps {
  invoices: DigitizedInvoice[];
  onSelectInvoice: (invoice: DigitizedInvoice) => void;
  onDeleteInvoice: (id: string) => void;
  onClearDatabase: () => void;
  onNewScan: () => void;
}

export const InvoiceDatabaseDashboard: React.FC<InvoiceDatabaseDashboardProps> = ({
  invoices,
  onSelectInvoice,
  onDeleteInvoice,
  onClearDatabase,
  onNewScan,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'confidence'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const categories = ['All', 'Electronics', 'Utilities', 'Logistics & Freight', 'Food & Beverage', 'Office Supplies'];

  // Filter and sort invoices
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        const matchesSearch =
          inv.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (inv.vendorGstin && inv.vendorGstin.toLowerCase().includes(searchQuery.toLowerCase())) ||
          inv.items.some((it) => it.description.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory = selectedCategory === 'All' || inv.category === selectedCategory;
        const matchesStatus = selectedStatus === 'All' || inv.status === selectedStatus;

        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortBy === 'date') {
          cmp = new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime();
        } else if (sortBy === 'amount') {
          cmp = b.totalAmount - a.totalAmount;
        } else if (sortBy === 'confidence') {
          cmp = b.confidenceScore - a.confidenceScore;
        }
        return sortOrder === 'desc' ? cmp : -cmp;
      });
  }, [invoices, searchQuery, selectedCategory, selectedStatus, sortBy, sortOrder]);

  const totalSpent = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalTax = invoices.reduce((sum, i) => sum + i.taxGst, 0);
  const flaggedCount = invoices.filter((i) => i.anomalies.length > 0).length;

  return (
    <div className="space-y-6">
      
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Total Digitized</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{invoices.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Scanned documents indexed</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Total Expenditure</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">
            ₹ {totalSpent.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Including ₹{totalTax.toLocaleString()} GST</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Average Confidence</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {invoices.length > 0
              ? Math.round(
                  invoices.reduce((acc, i) => acc + i.confidenceScore, 0) / invoices.length
                )
              : 0}
            %
          </div>
          <div className="text-[11px] text-emerald-700/80 mt-0.5">OCR & NER extraction rate</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-xs text-slate-500 font-medium">Flagged & Anomalies</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{flaggedCount}</div>
          <div className="text-[11px] text-amber-700/80 mt-0.5">Math & tax audit warnings</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3.5">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vendor, invoice #, item, or GSTIN..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Bulk Export & Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => exportToExcel(filteredInvoices)}
              disabled={filteredInvoices.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold transition shadow-2xs cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export to Excel</span>
            </button>

            <button
              onClick={() => exportToCsv(filteredInvoices)}
              disabled={filteredInvoices.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-xs font-semibold transition shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>CSV</span>
            </button>

            <button
              onClick={() => exportToJson(filteredInvoices, 'all_invoices_database.json')}
              disabled={filteredInvoices.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-xs font-semibold transition shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>JSON</span>
            </button>

            {invoices.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition shadow-2xs cursor-pointer ml-auto sm:ml-0"
                title="Clear all stored invoices"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Clear Database</span>
              </button>
            )}
          </div>

        </div>

        {/* Category Pills & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          
          <div className="flex items-center flex-wrap gap-1.5">
            <span className="text-slate-400 text-[11px] font-medium mr-1">Category:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px] font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-slate-700 focus:outline-hidden"
            >
              <option value="All">All Statuses</option>
              <option value="verified">Verified</option>
              <option value="needs_review">Needs Review</option>
              <option value="flagged">Flagged</option>
            </select>
          </div>

        </div>

      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {invoices.length === 0 ? (
          <div className="text-center py-16 px-4">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No Digitized Invoices Yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Scan or upload your first invoice document to begin automated OCR extraction, categorization, and audit validation.
            </p>
            <button
              onClick={onNewScan}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer"
            >
              Upload Invoice
            </button>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-12 px-4">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No invoices matched your query</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Try adjusting your search terms or changing the category/status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Vendor</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5 text-center">Items</th>
                  <th className="p-3.5 text-right">Subtotal</th>
                  <th className="p-3.5 text-right">Tax / GST</th>
                  <th className="p-3.5 text-right">Total</th>
                  <th className="p-3.5 text-center">Confidence</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => onSelectInvoice(inv)}
                    className="hover:bg-blue-50/40 cursor-pointer transition"
                  >
                    <td className="p-3.5 font-bold font-mono text-blue-600">{inv.invoiceNumber}</td>
                    
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{inv.vendorName}</div>
                      {inv.vendorGstin && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          GST: {inv.vendorGstin}
                        </div>
                      )}
                    </td>

                    <td className="p-3.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {inv.category}
                      </span>
                    </td>

                    <td className="p-3.5 text-slate-600 whitespace-nowrap">{inv.invoiceDate}</td>

                    <td className="p-3.5 text-center font-semibold text-slate-700">
                      {inv.items.length}
                    </td>

                    <td className="p-3.5 text-right text-slate-600">
                      {inv.currency || '₹'} {inv.subtotal.toLocaleString()}
                    </td>

                    <td className="p-3.5 text-right text-slate-600">
                      {inv.currency || '₹'} {inv.taxGst.toLocaleString()}
                    </td>

                    <td className="p-3.5 text-right font-bold text-slate-900 whitespace-nowrap">
                      {inv.currency || '₹'} {inv.totalAmount.toLocaleString()}
                    </td>

                    <td className="p-3.5 text-center">
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        {inv.confidenceScore}%
                      </span>
                    </td>

                    <td className="p-3.5 text-center">
                      {inv.anomalies.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Needs Review</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Verified</span>
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectInvoice(inv)}
                          className="p-1.5 rounded text-slate-500 hover:text-blue-600 hover:bg-slate-100"
                          title="View & inspect invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteInvoice(inv.id)}
                          className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Delete invoice"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Clear Database Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Clear All Stored Invoices?
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              This will permanently delete all {invoices.length} digitized invoices and reset your database. This action cannot be undone.
            </p>
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearDatabase();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Yes, Clear Database
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
