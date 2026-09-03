# Automated Document Digitizer

An intelligent, full-stack invoice digitization and document processing application powered by multimodal Gemini AI and client-side preprocessing. It accurately extracts, categorizes, reconciles, and validates text and tabular data from scanned receipts and invoices.

---

## Features

- **Multimodal AI OCR & NLP Extraction**:
  - Leverages Google Gemini models (`gemini-2.5-flash` with fallback to `gemini-3.8-flash`) for rapid, high-accuracy field and table parsing.
  - Extracts key metadata: Vendor Name, GSTIN / Tax ID, Invoice Number, Billing Date, Due Date, and Contact Information.
- **Itemized Table Extraction**:
  - Captures complete line items including item description, specifications, quantity, unit rate, total price, and HSN/SAC codes.
- **Automated Financial Reconciliation & Anomaly Detection**:
  - Validates arithmetic consistency across subtotal, GST/tax rates, discounts, line-item sums, and grand totals.
  - Automatically flags discrepancies such as arithmetic mismatches, missing GSTINs, or calculation rounding differences.
- **Adaptive Image Preprocessing**:
  - Client-side canvas preprocessing: auto-deskewing, contrast enhancement, grayscale normalization, and denoising.
- **Human-in-the-Loop Verification & Editing**:
  - In-place modal to review extracted values, modify line items, and trigger automatic financial recalculation.
- **Export Capabilities**:
  - Export digitized invoices to **CSV**, **JSON**, or formatted **Excel (.xlsx)** spreadsheets.
- **Dark & Light Mode**:
  - Accessible theme toggle with WCAG-compliant color palettes and local preference persistence.
- **Offline Fallback Parser**:
  - Robust regex and positional heuristic extraction engine for offline scenarios or local fallback processing.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Motion, Lucide Icons
- **Backend**: Node.js, Express, tsx, esbuild
- **AI & Processing**: `@google/genai` (Gemini API), Tesseract.js, Canvas 2D API
- **Data Export**: `xlsx` (SheetJS)

---

## Project Structure

```text
├── index.html                  # HTML entry point
├── metadata.json               # Platform metadata & permissions
├── package.json                # Project dependencies and npm scripts
├── server.ts                   # Express backend API & Vite development middleware
├── src/
│   ├── App.tsx                 # Main application UI and state management
│   ├── main.tsx                # React root mount
│   ├── types.ts                # TypeScript interfaces and entity types
│   ├── components/
│   │   ├── DropZone.tsx        # Drag-and-drop document upload area
│   │   ├── EditInvoiceModal.tsx# Line item and financial verification modal
│   │   ├── InvoiceDetail.tsx   # Detailed invoice viewer & bounding-box overlay
│   │   ├── InvoiceTable.tsx    # Digitized invoices list and status badges
│   │   └── ProcessingOverlay.tsx# Multi-stage extraction progress display
│   └── utils/
│       ├── exportUtils.ts      # CSV, JSON, and Excel export generators
│       └── imagePreprocess.ts  # Canvas-based deskew, contrast, and denoising
└── vite.config.ts              # Vite configuration
```

---

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** or **pnpm**
- **Gemini API Key** (available from [Google AI Studio](https://aistudio.google.com/))

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/automated-document-digitizer.git
   cd automated-document-digitizer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API key:
   ```env
   GEMINI_API_KEY="your-gemini-api-key-here"
   ```

---

## Running the Application

### Development Mode

Start the full-stack development server:
```bash
npm run dev
```
The application will be accessible at `http://localhost:3000`.

### Production Build

1. Build the frontend and server bundle:
   ```bash
   npm run build
   ```
2. Start the production server:
   ```bash
   npm run start
   ```

---

## API Endpoints

### `POST /api/digitize`
Uploads a base64-encoded invoice image or PDF for OCR extraction and financial analysis.

**Request Payload:**
```json
{
  "imageBase64": "data:image/png;base64,...",
  "mimeType": "image/png",
  "fileName": "invoice_102.png",
  "options": {
    "autoDeskew": true,
    "enhanceContrast": true,
    "denoise": true
  }
}
```

**Response:**
Returns the structured `DigitizedInvoice` object containing extracted metadata, reconciled financials, line items, and anomaly flags.

### `GET /api/health`
Health check endpoint reporting API availability and Gemini key status.

---

## License

This project is licensed under the MIT License.
