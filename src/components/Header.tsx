import React from 'react';
import { FileSpreadsheet, ScanText, Sparkles, CheckCircle2, AlertTriangle, Database, Sun, Moon } from 'lucide-react';
import { DigitizedInvoice } from '../types';

interface HeaderProps {
  invoices: DigitizedInvoice[];
  hasGeminiKey: boolean;
  onNewScan: () => void;
  onExportAllExcel: () => void;
  activeView: 'digitize' | 'database';
  setActiveView: (view: 'digitize' | 'database') => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  invoices,
  hasGeminiKey,
  onNewScan,
  onExportAllExcel,
  activeView,
  setActiveView,
  theme,
  onToggleTheme,
}) => {
  const verifiedCount = invoices.filter((i) => i.status === 'verified').length;
  const anomaliesCount = invoices.filter((i) => i.anomalies.length > 0).length;
  const avgConfidence =
    invoices.length > 0
      ? Math.round(invoices.reduce((sum, i) => sum + i.confidenceScore, 0) / invoices.length)
      : 0;

  return (
    <header className="bg-slate-900 dark:bg-slate-950 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3.5 gap-3">
          
          {/* Brand & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 ring-2 ring-blue-400/30">
              <ScanText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">
                  Automated Document Digitizer
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  OCR & NLP Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Extracts, validates & categorizes text from scanned invoices with AI
              </p>
            </div>
          </div>

          {/* Metrics Pill Bar */}
          <div className="hidden lg:flex items-center gap-4 bg-slate-800/80 dark:bg-slate-900/90 px-3.5 py-1.5 rounded-lg border border-slate-700/60 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span>Invoices: <strong className="text-white font-semibold">{invoices.length}</strong></span>
            </div>
            <div className="w-px h-3.5 bg-slate-700 dark:bg-slate-800" />
            <div className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified: <strong className="text-emerald-400 font-semibold">{verifiedCount}</strong></span>
            </div>
            {anomaliesCount > 0 && (
              <>
                <div className="w-px h-3.5 bg-slate-700 dark:bg-slate-800" />
                <div className="flex items-center gap-1.5 text-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Flags: <strong className="text-amber-300 font-semibold">{anomaliesCount}</strong></span>
                </div>
              </>
            )}
            <div className="w-px h-3.5 bg-slate-700 dark:bg-slate-800" />
            <div className="flex items-center gap-1.5 text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Avg Accuracy: <strong className="text-purple-300 font-semibold">{avgConfidence}%</strong></span>
            </div>
          </div>

          {/* Navigation & Actions */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center bg-slate-800 dark:bg-slate-900 p-1 rounded-lg border border-slate-700 dark:border-slate-800 text-xs font-medium">
              <button
                id="tab-digitize-view"
                onClick={() => setActiveView('digitize')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  activeView === 'digitize'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Scan & Extract
              </button>
              <button
                id="tab-database-view"
                onClick={() => setActiveView('database')}
                className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'database'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <span>Database</span>
                <span className="px-1.5 py-0.2 bg-slate-700 dark:bg-slate-800 text-slate-200 rounded text-[10px]">
                  {invoices.length}
                </span>
              </button>
            </div>

            <button
              id="btn-export-excel"
              onClick={onExportAllExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition cursor-pointer"
              title="Export all digitized invoice records to an Excel workbook"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Export Excel</span>
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              id="btn-toggle-theme"
              type="button"
              onClick={onToggleTheme}
              className="p-2 rounded-lg bg-slate-800 dark:bg-slate-900 hover:bg-slate-700 dark:hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 dark:border-slate-800 transition cursor-pointer flex items-center justify-center"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme mode"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-300" />
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};

