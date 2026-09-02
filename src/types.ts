export type InvoiceCategory =
  | 'Electronics'
  | 'Food & Beverage'
  | 'Travel & Hospitality'
  | 'Office Supplies'
  | 'Medical & Healthcare'
  | 'Utilities'
  | 'Logistics & Freight'
  | 'Professional Services'
  | 'Retail & Others';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  hsnCode?: string;
  confidence?: number;
}

export interface InvoiceAnomaly {
  id: string;
  type: 'math_mismatch' | 'missing_tax' | 'unusual_date' | 'missing_field' | 'duplicate_detected' | 'high_value' | 'tax_calculation_error';
  severity: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  field?: string;
}

export interface ProcessingStepStatus {
  step: 'upload' | 'preprocess' | 'ocr' | 'nlp' | 'categorize' | 'validation' | 'complete';
  label: string;
  description: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  durationMs?: number;
}

export interface DigitizedInvoice {
  id: string;
  fileName: string;
  fileSize?: string;
  imageUrl: string;
  thumbnailUrl?: string;

  // Extracted core fields
  vendorName: string;
  vendorGstin?: string;
  vendorAddress?: string;
  vendorPhone?: string;
  vendorEmail?: string;

  customerName?: string;
  customerAddress?: string;

  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;

  // Financial info
  subtotal: number;
  taxGst: number;
  taxRatePercent?: number;
  discount: number;
  totalAmount: number;
  currency: string;
  paymentMethod?: string;

  // Categorization & Line Items
  category: InvoiceCategory;
  categoryReasoning?: string;
  items: InvoiceItem[];

  // OCR & NLP raw outputs
  rawOcrText: string;
  cleanedText?: string;
  entitiesExtracted?: Array<{ entity: string; type: string; confidence: number }>;

  // Quality & Risk Metrics
  confidenceScore: number; // 0 - 100
  fieldConfidences: {
    vendorName: number;
    invoiceNumber: number;
    invoiceDate: number;
    totalAmount: number;
    taxGst: number;
    items: number;
    category: number;
  };
  anomalies: InvoiceAnomaly[];
  isDuplicate?: boolean;
  duplicateOfId?: string;

  // Metadata
  processedAt: string;
  status: 'verified' | 'needs_review' | 'flagged';
  processingTimeMs: {
    preprocessMs: number;
    ocrMs: number;
    nlpMs: number;
    totalMs: number;
  };
}

export interface PreprocessOptions {
  denoise: boolean;
  contrastEnhancement: boolean;
  autoRotate: boolean;
  binarization: boolean;
}
