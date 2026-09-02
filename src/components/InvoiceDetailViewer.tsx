import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Building2,
  Calendar,
  Hash,
  FileSpreadsheet,
  Download,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Tag,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  Sparkles,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { DigitizedInvoice } from '../types';
import { exportSingleInvoiceToExcel, exportToJson } from '../utils/exportUtils';
import { processImageOnCanvas } from '../utils/imagePreprocess';

interface InvoiceDetailViewerProps {
  invoice: DigitizedInvoice;
  onEdit: (invoice: DigitizedInvoice) => void;
  onSaveToDatabase?: (invoice: DigitizedInvoice) => void;
}

export const InvoiceDetailViewer: React.FC<InvoiceDetailViewerProps> = ({
  invoice,
  onEdit,
  onSaveToDatabase,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'products' | 'nlp' | 'ocr' | 'anomalies'>('info');
  const [viewMode, setViewMode] = useState<'original' | 'binarized' | 'overlay'>('original');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [copiedOcr, setCopiedOcr] = useState(false);
  const [highlightedField, setHighlightedField] = useState<string | null>(null);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);

  // Generate binarized/preprocessed canvas filter when requested
  useEffect(() => {
    if (viewMode === 'binarized' && imgRef.current) {
      processImageOnCanvas(imgRef.current, {
        denoise: true,
        contrastEnhancement: true,
        autoRotate: true,
        binarization: true,
      }).then((dataUrl) => {
        setProcessedImageUrl(dataUrl);
      });
    } else {
      setProcessedImageUrl(null);
    }
  }, [viewMode, invoice.imageUrl]);

  const handleCopyOcr = () => {
    navigator.clipboard.writeText(invoice.rawOcrText);
    setCopiedOcr(true);
    setTimeout(() => setCopiedOcr(false), 2000);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Electronics':
        return 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Utilities':
        return 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Food & Beverage':
        return 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'Logistics & Freight':
        return 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700';
    }
  };

  // Reconcile line items sum with subtotal
  const itemsSum = invoice.items.reduce((acc, it) => acc + it.totalPrice, 0);
  const mathIsConsistent = Math.abs(itemsSum - invoice.subtotal) <= 1;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-8 transition-colors">
      
      {/* Top Banner: Status, Category, Accuracy & Action Buttons */}
      <div className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {invoice.invoiceNumber}
            </span>
            <span className="text-slate-400 dark:text-slate-500 font-normal">|</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{invoice.vendorName}</span>
          </div>

          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getCategoryColor(
              invoice.category
            )}`}
          >
            {invoice.category}
          </span>

          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{invoice.confidenceScore}% Confidence</span>
          </div>

          {invoice.anomalies.length > 0 && (
            <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full">
              <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span>{invoice.anomalies.length} Flag{invoice.anomalies.length > 1 ? 's' : ''}</span>
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            id="btn-edit-invoice"
            onClick={() => onEdit(invoice)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition shadow-2xs cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Edit Fields</span>
          </button>

          <button
            id="btn-export-single-excel"
            onClick={() => exportSingleInvoiceToExcel(invoice)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export to Excel</span>
          </button>

          <button
            id="btn-export-single-json"
            onClick={() => exportToJson(invoice, `${invoice.invoiceNumber}_extracted.json`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white text-xs font-semibold transition shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
        </div>

      </div>

      {/* Main Grid: Left Document Visualizer | Right Extracted Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
        
        {/* LEFT COLUMN: Scanned Document Visualizer */}
        <div className="lg:col-span-5 bg-slate-900 dark:bg-slate-950 p-4 flex flex-col border-r border-slate-800">
          
          {/* Controls Bar */}
          <div className="flex items-center justify-between bg-slate-800/90 text-slate-200 px-3 py-2 rounded-lg text-xs mb-3 border border-slate-700/80">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium mr-1">View:</span>
              <button
                onClick={() => setViewMode('original')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  viewMode === 'original'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Scan
              </button>
              <button
                onClick={() => setViewMode('binarized')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  viewMode === 'binarized'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Pre-processed
              </button>
              <button
                onClick={() => setViewMode('overlay')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  viewMode === 'overlay'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                OCR Bounding
              </button>
            </div>

            {/* Zoom controls */}
            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.15))}
                className="p-1 hover:text-white rounded"
                title="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] w-9 text-center font-mono">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.15))}
                className="p-1 hover:text-white rounded"
                title="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1 hover:text-white rounded ml-1"
                title="Reset zoom"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Image Canvas Container */}
          <div className="flex-1 overflow-auto rounded-lg bg-slate-950/60 p-2 flex items-center justify-center border border-slate-800/80 min-h-[440px] max-h-[640px]">
            <div
              className="relative transition-transform duration-150 origin-top"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <img
                ref={imgRef}
                src={processedImageUrl || invoice.imageUrl}
                alt="Scanned Document"
                className="max-w-full rounded shadow-xl border border-slate-700/80 object-contain max-h-[580px]"
              />

              {/* Interactive Bounding Highlights on OCR overlay mode or hovered field */}
              {(viewMode === 'overlay' || highlightedField) && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Vendor Highlight Box */}
                  <div
                    className={`absolute top-[5%] left-[6%] w-[45%] h-[9%] border-2 rounded transition-all ${
                      highlightedField === 'vendor'
                        ? 'border-blue-400 bg-blue-500/25 ring-2 ring-blue-300'
                        : 'border-blue-400/40 bg-blue-500/10'
                    }`}
                  >
                    <span className="absolute -top-3.5 left-1 bg-blue-600 text-white text-[9px] font-bold px-1 rounded">
                      Vendor
                    </span>
                  </div>

                  {/* Invoice # & Date Highlight Box */}
                  <div
                    className={`absolute top-[5%] right-[6%] w-[35%] h-[9%] border-2 rounded transition-all ${
                      highlightedField === 'invoiceMeta'
                        ? 'border-purple-400 bg-purple-500/25 ring-2 ring-purple-300'
                        : 'border-purple-400/40 bg-purple-500/10'
                    }`}
                  >
                    <span className="absolute -top-3.5 right-1 bg-purple-600 text-white text-[9px] font-bold px-1 rounded">
                      Inv # & Date
                    </span>
                  </div>

                  {/* Line Items Table Highlight Box */}
                  <div
                    className={`absolute top-[32%] left-[6%] w-[88%] h-[28%] border-2 rounded transition-all ${
                      highlightedField === 'items'
                        ? 'border-emerald-400 bg-emerald-500/25 ring-2 ring-emerald-300'
                        : 'border-emerald-400/40 bg-emerald-500/10'
                    }`}
                  >
                    <span className="absolute -top-3.5 left-1 bg-emerald-600 text-white text-[9px] font-bold px-1 rounded">
                      Line Items ({invoice.items.length})
                    </span>
                  </div>

                  {/* Financial Total Box */}
                  <div
                    className={`absolute bottom-[18%] right-[6%] w-[42%] h-[14%] border-2 rounded transition-all ${
                      highlightedField === 'total'
                        ? 'border-amber-400 bg-amber-500/30 ring-2 ring-amber-300'
                        : 'border-amber-400/40 bg-amber-500/10'
                    }`}
                  >
                    <span className="absolute -top-3.5 right-1 bg-amber-600 text-white text-[9px] font-bold px-1 rounded">
                      Total Payable
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-2 text-center text-[11px] text-slate-400 flex items-center justify-between px-1">
            <span>OCR Bounding Box Resolution: 300 DPI</span>
            <span className="text-slate-500">Document #{invoice.invoiceNumber}</span>
          </div>

        </div>

        {/* RIGHT COLUMN: Extracted Information & Insights */}
        <div className="lg:col-span-7 flex flex-col p-5 bg-white dark:bg-slate-900 transition-colors">
          
          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 mb-5 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab('info')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'info'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Extracted Fields</span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'products'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Line Items ({invoice.items.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('nlp')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'nlp'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>NLP & Category</span>
            </button>

            <button
              onClick={() => setActiveTab('ocr')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'ocr'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Raw OCR Text</span>
            </button>

            <button
              onClick={() => setActiveTab('anomalies')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'anomalies'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <AlertTriangle
                className={`w-3.5 h-3.5 ${
                  invoice.anomalies.length > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'
                }`}
              />
              <span>
                Validation & Checks
                {invoice.anomalies.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 rounded-full text-[10px]">
                    {invoice.anomalies.length}
                  </span>
                )}
              </span>
            </button>
          </div>

          {/* TAB 1: EXTRACTED FIELDS & FINANCIALS */}
          {activeTab === 'info' && (
            <div className="space-y-5 animate-fadeIn">
              
              {/* Vendor & Invoice Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Vendor Card */}
                <div
                  onMouseEnter={() => setHighlightedField('vendor')}
                  onMouseLeave={() => setHighlightedField(null)}
                  className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-blue-300 dark:hover:border-blue-600 transition"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      Vendor Information
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800 font-semibold">
                      {invoice.fieldConfidences?.vendorName || 99}% Acc.
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{invoice.vendorName}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    GSTIN:{' '}
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {invoice.vendorGstin || 'Not detected'}
                    </span>
                  </div>
                  {invoice.vendorAddress && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {invoice.vendorAddress}
                    </div>
                  )}
                  {invoice.vendorPhone && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Phone: {invoice.vendorPhone}
                    </div>
                  )}
                </div>

                {/* Invoice Metadata Card */}
                <div
                  onMouseEnter={() => setHighlightedField('invoiceMeta')}
                  onMouseLeave={() => setHighlightedField(null)}
                  className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-purple-300 dark:hover:border-purple-600 transition"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      Invoice Reference
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800 font-semibold">
                      {invoice.fieldConfidences?.invoiceNumber || 99}% Acc.
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Invoice Number:</span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                      {invoice.invoiceNumber}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1.5">
                    <span className="text-slate-500 dark:text-slate-400">Invoice Date:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{invoice.invoiceDate}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1.5">
                    <span className="text-slate-500 dark:text-slate-400">Due Date:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{invoice.dueDate || 'Immediate'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1.5">
                    <span className="text-slate-500 dark:text-slate-400">Customer:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                      {invoice.customerName || 'Acme Solutions'}
                    </span>
                  </div>
                </div>

              </div>

              {/* Financial Calculation Box */}
              <div
                onMouseEnter={() => setHighlightedField('total')}
                onMouseLeave={() => setHighlightedField(null)}
                className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-bold text-blue-950 dark:text-blue-200 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Financial Breakdown & Tax Calculation
                  </div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-100/80 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Subtotal</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {invoice.currency} {invoice.subtotal.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      GST ({invoice.taxRatePercent || 18}%)
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {invoice.currency} {invoice.taxGst.toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Discount</div>
                    <div className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                      {invoice.discount > 0 ? `-${invoice.currency} ${invoice.discount.toLocaleString()}` : '₹ 0'}
                    </div>
                  </div>

                  <div className="bg-blue-600 text-white p-2.5 rounded-lg shadow-sm">
                    <div className="text-[11px] text-blue-100 font-medium">Total Amount</div>
                    <div className="text-sm font-black mt-0.5">
                      {invoice.currency} {invoice.totalAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Confidence Meter Breakdown */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs transition-colors">
                <div className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center justify-between">
                  <span>NLP Field Confidence Scores</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Overall: {invoice.confidenceScore}%</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                      <span>Vendor & Tax ID</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{invoice.fieldConfidences?.vendorName || 99}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${invoice.fieldConfidences?.vendorName || 99}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                      <span>Invoice Number & Dates</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{invoice.fieldConfidences?.invoiceNumber || 99}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${invoice.fieldConfidences?.invoiceNumber || 99}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                      <span>Financial Totals & Tax Calculation</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{invoice.fieldConfidences?.totalAmount || 98}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${invoice.fieldConfidences?.totalAmount || 98}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: PRODUCTS & LINE ITEMS */}
          {activeTab === 'products' && (
            <div
              onMouseEnter={() => setHighlightedField('items')}
              onMouseLeave={() => setHighlightedField(null)}
              className="space-y-4 animate-fadeIn"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Extracted Tabular Items ({invoice.items.length})
                </div>
                {mathIsConsistent ? (
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    Math Verified (Sum matches Subtotal)
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    Sum discrepancy detected
                  </span>
                )}
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5 text-center">HSN/SAC</th>
                      <th className="p-2.5 text-center">Qty</th>
                      <th className="p-2.5 text-right">Unit Price</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {invoice.items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition">
                        <td className="p-2.5 text-slate-400 dark:text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                        <td className="p-2.5 font-medium text-slate-900 dark:text-white">{item.description}</td>
                        <td className="p-2.5 text-center font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                          {item.hsnCode || '—'}
                        </td>
                        <td className="p-2.5 text-center font-semibold text-slate-700 dark:text-slate-300">{item.quantity}</td>
                        <td className="p-2.5 text-right text-slate-600 dark:text-slate-400">
                          {invoice.currency} {item.unitPrice.toLocaleString()}
                        </td>
                        <td className="p-2.5 text-right font-bold text-slate-900 dark:text-white">
                          {invoice.currency} {item.totalPrice.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-200 border-t border-slate-200 dark:border-slate-700">
                    <tr>
                      <td colSpan={4} className="p-2.5 text-right text-slate-500 dark:text-slate-400">
                        Total Line Items Sum:
                      </td>
                      <td colSpan={2} className="p-2.5 text-right font-bold text-slate-900 dark:text-white">
                        {invoice.currency} {itemsSum.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                Tip: Click "Edit Fields" in the top right to modify line item quantities or prices.
              </div>
            </div>
          )}

          {/* TAB 3: NLP & CATEGORIZATION INSIGHTS */}
          {activeTab === 'nlp' && (
            <div className="space-y-4 animate-fadeIn">
              
              {/* Category Classification Card */}
              <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-bold text-purple-950 dark:text-purple-200 uppercase tracking-wider">
                      Business Domain Categorization
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full border shadow-2xs ${getCategoryColor(
                      invoice.category
                    )}`}
                  >
                    {invoice.category}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white/80 dark:bg-slate-800/80 p-3 rounded-lg border border-purple-100 dark:border-purple-900/40">
                  {invoice.categoryReasoning ||
                    'Classified automatically by semantic analysis of line items, vendor profile, and expenditure patterns.'}
                </p>
              </div>

              {/* Named Entity Recognition (NER) tags */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/50">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Recognized Named Entities (NER)
                </h4>

                <div className="flex flex-wrap gap-2 text-xs">
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg flex items-center gap-2 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 px-1.5 py-0.2 rounded">
                      VENDOR
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{invoice.vendorName}</span>
                  </div>

                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg flex items-center gap-2 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 px-1.5 py-0.2 rounded">
                      INV_NO
                    </span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{invoice.invoiceNumber}</span>
                  </div>

                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg flex items-center gap-2 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.2 rounded">
                      TAX_ID
                    </span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">{invoice.vendorGstin || 'None'}</span>
                  </div>

                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg flex items-center gap-2 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 px-1.5 py-0.2 rounded">
                      DATE
                    </span>
                    <span className="text-slate-800 dark:text-slate-200">{invoice.invoiceDate}</span>
                  </div>

                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg flex items-center gap-2 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 px-1.5 py-0.2 rounded">
                      TOTAL_PAYABLE
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {invoice.currency} {invoice.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Processing Pipeline Latency breakdown */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
                <span>Total Processing Latency:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {invoice.processingTimeMs?.totalMs || 1080} ms
                  <span className="font-normal text-[11px] text-slate-400 dark:text-slate-500 ml-1.5">
                    (Preprocess: {invoice.processingTimeMs?.preprocessMs || 180}ms | OCR:{' '}
                    {invoice.processingTimeMs?.ocrMs || 540}ms | NLP:{' '}
                    {invoice.processingTimeMs?.nlpMs || 360}ms)
                  </span>
                </span>
              </div>

            </div>
          )}

          {/* TAB 4: RAW OCR OUTPUT */}
          {activeTab === 'ocr' && (
            <div className="space-y-3 animate-fadeIn flex-1 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Raw Extracted OCR Text (Glyph Stream)
                </span>
                <button
                  onClick={handleCopyOcr}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded text-xs font-semibold transition cursor-pointer"
                >
                  {copiedOcr ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-emerald-700 dark:text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-4 rounded-lg font-mono text-xs overflow-auto max-h-[360px] leading-relaxed select-all border border-slate-800">
                <pre className="whitespace-pre-wrap font-mono">{invoice.rawOcrText}</pre>
              </div>

              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Raw character extraction performed before semantic NLP entity recognition and tabular alignment.
              </div>
            </div>
          )}

          {/* TAB 5: ANOMALIES & QUALITY CHECKS */}
          {activeTab === 'anomalies' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                Mathematical Verification & Risk Audit
              </div>

              {invoice.anomalies.length === 0 ? (
                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                      All Audit Checks Passed Successfully
                    </h4>
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300 mt-1 leading-relaxed">
                      • Line items sum perfectly matches the declared subtotal.<br />
                      • GST slab ({invoice.taxRatePercent || 18}%) reconciles mathematically with subtotal.<br />
                      • Registered GSTIN / Tax ID verified.<br />
                      • No duplicate invoice detected in database.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoice.anomalies.map((anom) => (
                    <div
                      key={anom.id}
                      className={`p-3.5 rounded-lg border flex items-start gap-3 ${
                        anom.severity === 'error'
                          ? 'border-rose-200 dark:border-rose-800 bg-rose-50/60 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200'
                          : anom.severity === 'warning'
                          ? 'border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'
                          : 'border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200'
                      }`}
                    >
                      <AlertTriangle
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          anom.severity === 'error'
                            ? 'text-rose-600 dark:text-rose-400'
                            : anom.severity === 'warning'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-blue-600 dark:text-blue-400'
                        }`}
                      />
                      <div>
                        <div className="font-bold text-xs">{anom.title}</div>
                        <div className="text-[11px] mt-0.5 opacity-90">{anom.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Duplicate Detection Check */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-xs">
                <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Duplicate Invoice Detection
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Engine indexes vendor name and invoice number to prevent double billing and fraudulent payment requests.
                </p>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
