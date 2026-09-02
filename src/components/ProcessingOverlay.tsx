import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Scan,
  Sliders,
  BrainCircuit,
  Tag,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface ProcessingOverlayProps {
  fileName?: string;
}

export const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ fileName = 'Scanned Invoice' }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps = [
    {
      id: 'preprocess',
      title: 'Image Pre-processing',
      detail: 'Eliminating noise, boosting edge contrast, and normalizing scan skew...',
      icon: Sliders,
    },
    {
      id: 'ocr',
      title: 'Optical Character Recognition (OCR)',
      detail: 'Extracting line-by-line raw text, bounding regions, and tabular glyphs...',
      icon: Scan,
    },
    {
      id: 'nlp',
      title: 'NLP & Named Entity Recognition (NER)',
      detail: 'Identifying Vendor, GSTIN, Invoice No, Invoice Date, and Line Items...',
      icon: BrainCircuit,
    },
    {
      id: 'categorize',
      title: 'Categorization & Financial Validation',
      detail: 'Verifying mathematical consistency, GST calculation & classifying business domain...',
      icon: Tag,
    },
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => setCurrentStepIndex(1), 350);
    const timer2 = setTimeout(() => setCurrentStepIndex(2), 850);
    const timer3 = setTimeout(() => setCurrentStepIndex(3), 1350);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 text-slate-800 dark:text-slate-200 transition-colors"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 animate-pulse">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
              Digitizing Invoice
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{fileName}</p>
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-3.5 mb-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isDone = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={step.id}
                className={`flex items-start gap-3 p-3 rounded-xl transition-all border ${
                  isCurrent
                    ? 'bg-blue-50/80 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 shadow-xs'
                    : isDone
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-800/60 text-slate-700 dark:text-slate-300'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 opacity-50'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  ) : isCurrent ? (
                    <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center text-[10px] text-slate-400 dark:text-slate-500 font-bold">
                      {idx + 1}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4
                      className={`text-xs font-bold ${
                        isCurrent
                          ? 'text-blue-900 dark:text-blue-300'
                          : isDone
                          ? 'text-slate-800 dark:text-slate-200'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {step.title}
                    </h4>
                    {isDone && (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        Done
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    {step.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-400 dark:text-slate-500">
          Running neural OCR & NLP parsing pipeline...
        </div>
      </motion.div>
    </div>
  );
};
