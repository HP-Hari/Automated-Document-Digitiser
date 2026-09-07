import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileImage,
  Sparkles,
  SlidersHorizontal,
  Check,
  ArrowRight,
  ShieldCheck,
  Camera,
  Clipboard,
  X,
} from 'lucide-react';
import { PreprocessOptions } from '../types';

interface UploadDropzoneProps {
  onProcessInvoice: (
    fileData: { base64: string; mimeType: string; fileName: string },
    options: PreprocessOptions
  ) => void;
  isProcessing: boolean;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onProcessInvoice,
  isProcessing,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{
    base64: string;
    mimeType: string;
    fileName: string;
  } | null>(null);

  const [preprocessOptions, setPreprocessOptions] = useState<PreprocessOptions>({
    denoise: true,
    contrastEnhancement: true,
    autoRotate: true,
    binarization: false,
  });

  const [showOptions, setShowOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Allow pasting an image from clipboard directly anywhere on the page
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            handleFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // If not an image (e.g. PDF), read directly
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setPreviewUrl(base64);
        setSelectedFile({
          base64,
          mimeType: file.type || 'application/pdf',
          fileName: file.name,
        });
      };
      reader.readAsDataURL(file);
      return;
    }

    // High-resolution image optimizer: resize max dimension to 1800px for instant upload and zero 504 timeouts
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX_DIMENSION = 1800;
      let width = img.width;
      let height = img.height;

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const quality = mimeType === 'image/png' ? undefined : 0.92;
        const base64 = canvas.toDataURL(mimeType, quality);
        setPreviewUrl(base64);
        setSelectedFile({
          base64,
          mimeType,
          fileName: file.name,
        });
        return;
      }

      // Fallback if canvas is not available
      const fallbackReader = new FileReader();
      fallbackReader.onload = (event) => {
        const base64 = event.target?.result as string;
        setPreviewUrl(base64);
        setSelectedFile({
          base64,
          mimeType: file.type || 'image/jpeg',
          fileName: file.name,
        });
      };
      fallbackReader.readAsDataURL(file);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      const fallbackReader = new FileReader();
      fallbackReader.onload = (event) => {
        const base64 = event.target?.result as string;
        setPreviewUrl(base64);
        setSelectedFile({
          base64,
          mimeType: file.type || 'image/jpeg',
          fileName: file.name,
        });
      };
      fallbackReader.readAsDataURL(file);
    };

    img.src = objectUrl;
  };

  const triggerProcess = () => {
    if (selectedFile) {
      onProcessInvoice(selectedFile, preprocessOptions);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 md:p-6 mb-6 transition-colors">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3 mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Upload Scanned Invoice Document</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Ingest invoices via drag & drop, file browse, mobile camera, or paste (Ctrl+V)
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowOptions(!showOptions)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition self-start sm:self-auto cursor-pointer"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>Pre-processing Options</span>
          <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded font-bold">
            {Object.values(preprocessOptions).filter(Boolean).length}
          </span>
        </button>
      </div>

      {/* Pre-processing Settings Panel */}
      {showOptions && (
        <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-750 rounded-lg text-xs transition-colors">
          <div className="font-semibold text-slate-800 dark:text-slate-200 mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Automated Image Pre-processing Controls
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
              Applied prior to OCR recognition
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-slate-800 p-2.5 rounded border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 transition">
              <input
                type="checkbox"
                checked={preprocessOptions.denoise}
                onChange={(e) =>
                  setPreprocessOptions({ ...preprocessOptions, denoise: e.target.checked })
                }
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-slate-800 dark:text-slate-200">Noise Filtering</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Filters paper speckles</div>
              </div>
            </label>

            <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-slate-800 p-2.5 rounded border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 transition">
              <input
                type="checkbox"
                checked={preprocessOptions.contrastEnhancement}
                onChange={(e) =>
                  setPreprocessOptions({
                    ...preprocessOptions,
                    contrastEnhancement: e.target.checked,
                  })
                }
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-slate-800 dark:text-slate-200">Contrast Boost</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Sharpens faint printer ink</div>
              </div>
            </label>

            <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-slate-800 p-2.5 rounded border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 transition">
              <input
                type="checkbox"
                checked={preprocessOptions.autoRotate}
                onChange={(e) =>
                  setPreprocessOptions({ ...preprocessOptions, autoRotate: e.target.checked })
                }
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-slate-800 dark:text-slate-200">Auto Deskew</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Straightens tilted scans</div>
              </div>
            </label>

            <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-slate-800 p-2.5 rounded border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 transition">
              <input
                type="checkbox"
                checked={preprocessOptions.binarization}
                onChange={(e) =>
                  setPreprocessOptions({ ...preprocessOptions, binarization: e.target.checked })
                }
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-slate-800 dark:text-slate-200">Binarization (B&W)</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Otsu threshold mode</div>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Main Drag-and-Drop Area */}
      <div>
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => {
            if (!previewUrl) {
              fileInputRef.current?.click();
            }
          }}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-all flex flex-col items-center justify-center min-h-[220px] ${
            dragActive
              ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 ring-4 ring-blue-100 dark:ring-blue-900/30 cursor-copy'
              : previewUrl
              ? 'border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/20 dark:bg-emerald-950/20'
              : 'border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 hover:border-blue-400 cursor-pointer'
          }`}
        >
          {/* Hidden Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf"
            className="hidden"
            onChange={handleFileInputChange}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileInputChange}
          />

          {previewUrl ? (
            <div className="flex flex-col md:flex-row items-center gap-6 w-full max-w-2xl py-2">
              <div className="w-32 h-40 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden relative shrink-0">
                <img
                  src={previewUrl}
                  alt="Invoice Preview"
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute top-1 right-1 bg-emerald-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                  Loaded
                </div>
              </div>

              <div className="text-left flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {selectedFile?.fileName || 'Scanned_Invoice.png'}
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" /> Ready for OCR
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Document loaded. Click below to run OCR text extraction and NLP entity categorization.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerProcess();
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{isProcessing ? 'Extracting Text...' : 'Digitize & Extract Text (OCR + NLP)'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Change File
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewUrl(null);
                      setSelectedFile(null);
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                    title="Remove document"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 mx-auto">
                <FileImage className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Drag & Drop Scanned Invoice Image
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Upload PNG, JPG, or WEBP invoice scans. Optical character recognition and NLP will extract raw text, vendor details, dates, items, tax, and line items.
              </p>
              
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Browse Document</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    cameraInputRef.current?.click();
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg shadow-2xs transition cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Scan with Camera</span>
                </button>
              </div>

              <div className="mt-3 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
                <Clipboard className="w-3 h-3" />
                <span>Tip: You can also paste an image from your clipboard (Ctrl + V)</span>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

