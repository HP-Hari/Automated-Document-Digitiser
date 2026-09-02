import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { UploadDropzone } from './components/UploadDropzone';
import { InvoiceDetailViewer } from './components/InvoiceDetailViewer';
import { InvoiceDatabaseDashboard } from './components/InvoiceDatabaseDashboard';
import { ProcessingOverlay } from './components/ProcessingOverlay';
import { EditInvoiceModal } from './components/EditInvoiceModal';
import { DigitizedInvoice, PreprocessOptions } from './types';
import { exportToExcel } from './utils/exportUtils';
import { CheckCircle2, ScanLine } from 'lucide-react';

const STORAGE_KEY = 'digitized_invoices_v2';
const LEGACY_STORAGE_KEYS = ['digitized_invoices_v1', 'digitized_invoices'];

const JUNK_INVOICE_IDS = new Set(['inv-1', 'inv-2', 'inv-3', 'inv-4']);
const JUNK_VENDORS = ['abc electronics', 'apex cloud', 'global logistics', 'freshbite'];

function isJunkInvoice(inv: any): boolean {
  if (!inv || typeof inv !== 'object') return true;
  if (JUNK_INVOICE_IDS.has(inv.id)) return true;
  if (typeof inv.id === 'string' && (inv.id.endsWith('-e1') || inv.id.endsWith('-c1'))) return true;
  const vendor = (inv.vendorName || '').toLowerCase().trim();
  if (JUNK_VENDORS.some((v) => vendor.includes(v))) return true;
  const fileName = (inv.fileName || '').toLowerCase();
  if (fileName.includes('sample') || fileName.includes('abc_electronics') || fileName.includes('apex_cloud')) return true;
  return false;
}

export default function App() {
  const [invoices, setInvoices] = useState<DigitizedInvoice[]>(() => {
    try {
      // Purge legacy storage keys that held mock invoices
      LEGACY_STORAGE_KEYS.forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch {
          // ignore
        }
      });

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const sanitized = parsed.filter((inv) => !isJunkInvoice(inv));
          return sanitized;
        }
      }
    } catch (e) {
      console.error('Failed reading localStorage', e);
    }
    return [];
  });

  const [selectedInvoice, setSelectedInvoice] = useState<DigitizedInvoice | null>(null);
  const [activeView, setActiveView] = useState<'digitize' | 'database'>('digitize');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingFileName, setProcessingFileName] = useState('');
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<DigitizedInvoice | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(
    null
  );

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const savedTheme = localStorage.getItem('digitizer_theme');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme;
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('digitizer_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
    } catch (e) {
      console.error('Failed saving to localStorage', e);
    }
  }, [invoices]);

  // Check health on load
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setHasGeminiKey(Boolean(data.hasGeminiKey));
      })
      .catch(() => {
        setHasGeminiKey(false);
      });
  }, []);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleProcessInvoice = async (
    fileData: { base64: string; mimeType: string; fileName: string },
    options: PreprocessOptions
  ) => {
    setIsProcessing(true);
    setProcessingFileName(fileData.fileName);

    try {
      const response = await fetch('/api/digitize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: fileData.base64,
          mimeType: fileData.mimeType,
          fileName: fileData.fileName,
          options,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const digitized: DigitizedInvoice = await response.json();

      // Check for duplicate invoice in database
      const existingMatch = invoices.find(
        (inv) =>
          inv.invoiceNumber.toLowerCase() === digitized.invoiceNumber.toLowerCase() &&
          inv.vendorName.toLowerCase() === digitized.vendorName.toLowerCase()
      );

      if (existingMatch) {
        digitized.isDuplicate = true;
        digitized.duplicateOfId = existingMatch.id;
        digitized.anomalies.unshift({
          id: `anom-dup-${Date.now()}`,
          type: 'duplicate_detected',
          severity: 'warning',
          title: 'Duplicate Invoice Detected',
          message: `Invoice #${digitized.invoiceNumber} from ${digitized.vendorName} already exists in the database.`,
        });
      }

      // Add to list and select it
      setInvoices((prev) => [digitized, ...prev.filter((i) => i.id !== digitized.id)]);
      setSelectedInvoice(digitized);
      setActiveView('digitize');
      showToast(`Invoice ${digitized.invoiceNumber} digitized successfully!`);
    } catch (err: any) {
      console.error('Error digitizing invoice:', err);
      showToast(`Processing error: ${err.message || 'Check server connection'}`, 'info');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditSave = (updated: DigitizedInvoice) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === updated.id ? updated : inv)));
    setSelectedInvoice(updated);
    showToast(`Invoice ${updated.invoiceNumber} updated!`);
  };

  const handleDeleteInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    if (selectedInvoice?.id === id) {
      const remaining = invoices.filter((inv) => inv.id !== id);
      setSelectedInvoice(remaining.length > 0 ? remaining[0] : null);
    }
    showToast('Invoice removed from database');
  };

  const handleClearDatabase = () => {
    setInvoices([]);
    setSelectedInvoice(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      LEGACY_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignore
    }
    showToast('Database cleared successfully');
  };

  const handleExportAllExcel = () => {
    if (invoices.length === 0) {
      showToast('No invoices to export yet', 'info');
      return;
    }
    exportToExcel(invoices);
    showToast('Exported complete database to Excel workbook');
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white transition-colors duration-200">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 dark:bg-slate-800 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-800 dark:border-slate-700 flex items-center gap-2.5 text-xs animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <Header
        invoices={invoices}
        hasGeminiKey={hasGeminiKey}
        onNewScan={() => {
          setSelectedInvoice(null);
          setActiveView('digitize');
        }}
        onExportAllExcel={handleExportAllExcel}
        activeView={activeView}
        setActiveView={setActiveView}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeView === 'digitize' ? (
          <div>
            {/* Upload Area */}
            <UploadDropzone
              onProcessInvoice={handleProcessInvoice}
              isProcessing={isProcessing}
            />

            {/* Extracted Invoice Details Viewer */}
            {selectedInvoice ? (
              <InvoiceDetailViewer
                invoice={selectedInvoice}
                onEdit={(inv) => setEditingInvoice(inv)}
              />
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center text-slate-500 dark:text-slate-400 transition-colors">
                <ScanLine className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">No active invoice selected</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-md mx-auto">
                  Upload an invoice image above to begin automatic optical character recognition, NLP entity extraction, and audit verification.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Database View */
          <InvoiceDatabaseDashboard
            invoices={invoices}
            onSelectInvoice={(inv) => {
              setSelectedInvoice(inv);
              setActiveView('digitize');
            }}
            onDeleteInvoice={handleDeleteInvoice}
            onClearDatabase={handleClearDatabase}
            onNewScan={() => {
              setSelectedInvoice(null);
              setActiveView('digitize');
            }}
          />
        )}
      </main>

      {/* Animated Processing Overlay */}
      {isProcessing && <ProcessingOverlay fileName={processingFileName} />}

      {/* Edit Invoice Modal */}
      {editingInvoice && (
        <EditInvoiceModal
          invoice={editingInvoice}
          isOpen={Boolean(editingInvoice)}
          onClose={() => setEditingInvoice(null)}
          onSave={handleEditSave}
        />
      )}

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800/80 py-4 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Automated Document Digitizer • OCR & NLP Extraction Engine</span>
          <span className="text-slate-400 dark:text-slate-500">
            Compliant with GST & Standard Tax Invoice Layouts • Multi-format Export (Excel, CSV, JSON)
          </span>
        </div>
      </footer>

    </div>
  );
}

