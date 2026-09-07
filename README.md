# Automated Document Digitizer

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Gemini API](https://img.shields.io/badge/Gemini_API-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![License MIT](https://img.shields.io/badge/License-MIT-green.style=for-the-badge)

<p align="center">
  Full-stack invoice OCR, tabular data extraction, and financial reconciliation engine.
</p>

</div>

---

## Table of Contents

- [System Architecture](#system-architecture)
- [Extraction & Validation Pipeline](#extraction--validation-pipeline)
- [End-to-End Processing Workflow](#end-to-end-processing-workflow)
- [Execution Sequence Diagram](#execution-sequence-diagram)
- [Data Entity & Schema Model](#data-entity--schema-model)
- [Document Status Lifecycle](#document-status-lifecycle)
- [Core Functional Modules](#core-functional-modules)
- [Tech Stack](#tech-stack)
- [Project Directory Structure](#project-directory-structure)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [License](#license)

---

## System Architecture

The application combines browser-side canvas pre-processing with a server-side extraction and reconciliation pipeline:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT LAYER (React 19)                              │
│                                                                                        │
│  ┌───────────────────────┐   ┌────────────────────────┐   ┌─────────────────────────┐  │
│  │   Drag & Drop Zone    │──▶│  Canvas Preprocessor   │──▶│   Invoice Review Modal  │  │
│  │ (PDF / PNG / JPEG / …)│   │(Deskew/Contrast/Denoise│   │ (Edit Items & Amounts)  │  │
│  └───────────────────────┘   └────────────────────────┘   └────────────┬────────────┘  │
│                                           │                            │               │
└───────────────────────────────────────────┼────────────────────────────┼───────────────┘
                                            │ Base64 Payload             │
                                            ▼                            ▼
┌───────────────────────────────────────────────────────────┐ ┌──────────────────────────┐
│                   EXPRESS API BACKEND                     │ │      EXPORT ENGINE     │
│                                                           │ │                          │
│  ┌─────────────────────┐       ┌────────────────────────┐ │ │  ┌───────┐ ┌──────┐ ┌───┐│
│  │  POST /api/digitize │──────▶│ Mathematical Reconciler│─┼─┼─▶│ Excel │ │ CSV  │ │JSON│
│  └──────────┬──────────┘       │ (Totals / GST / Items) │ │ │  └───────┘ └──────┘ └───┘│
│             │                  └──────────▲─────────────┘ │ └──────────────────────────┘
└─────────────┼─────────────────────────────┼───────────────┘
              │                             │
              ▼                             │ Structured Response
┌───────────────────────────────────────────┼────────────────────────────────────────────┐
│                    MULTIMODAL INFERENCE ENGINE                                         │
│                                                                                        │
│   ┌────────────────────────────────┐            ┌──────────────────────────────────┐   │
│   │     gemini-2.5-flash           │──Fallback─▶│         gemini-3.8-flash         │   │
│   │ (Primary Low-Latency Pipeline) │  (On Load) │      (Cascading Redundancy)      │   │
│   └────────────────────────────────┘            └──────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Extraction & Validation Pipeline

The engine segments input documents into dedicated semantic extraction domains and subjects them to deterministic arithmetic audits:

```mermaid
graph TD
    classDef inputNode fill:#e2e8f0,stroke:#64748b,color:#0f172a,stroke-width:1.5px;
    classDef extractNode fill:#f0f9ff,stroke:#0284c7,color:#0369a1,stroke-width:1.5px;
    classDef auditNode fill:#fefce8,stroke:#ca8a04,color:#713f12,stroke-width:1.5px;
    classDef outputNode fill:#f0fdf4,stroke:#16a34a,color:#14532d,stroke-width:1.5px;

    subgraph InputStage["1. Input Conditioning"]
        IMG["Document Pixels<br/>(PNG / JPG / PDF)"]:::inputNode
        CANV["Canvas 2D Normalization<br/>• Deskew Rotation<br/>• Dynamic Range Stretching<br/>• Noise Filtering"]:::inputNode
    end

    subgraph DomainExtraction["2. Entity & Table Extraction"]
        VEND["Vendor & Identity<br/>• Legal Name<br/>• GSTIN / Tax ID<br/>• Address & Contact"]:::extractNode
        META["Document Metadata<br/>• Invoice Number<br/>• Issue & Due Dates<br/>• Currency Symbol"]:::extractNode
        TBL["Line-Item Grid<br/>• Description & Model Specs<br/>• Billed Quantity<br/>• Unit Rate & Line Total<br/>• HSN / SAC Classification"]:::extractNode
        FIN["Financial Balances<br/>• Subtotal / Taxable Base<br/>• Tax Rates (CGST / SGST / IGST)<br/>• Applied Discounts<br/>• Grand Total Payable"]:::extractNode
    end

    subgraph AuditStage["3. Deterministic Arithmetic Audit"]
        SUMCHK["Item Sum Reconciliation<br/>∑(Line Item Totals) == Subtotal"]:::auditNode
        BALCHK["Grand Total Reconciliation<br/>Subtotal + Tax - Discount == Total"]:::auditNode
        RULECHK["Constraint Checks<br/>• Phone Number Exclusion from Totals<br/>• HSN / Serial vs. Quantity Isolation<br/>• Required Tax Registration Checks"]:::auditNode
    end

    subgraph OutputStage["4. Structured Persistence & Export"]
        JSONOUT["Reconciled Invoice Record<br/>Status: Verified | Needs Review | Flagged"]:::outputNode
    end

    IMG --> CANV
    CANV --> VEND
    CANV --> META
    CANV --> TBL
    CANV --> FIN

    VEND --> RULECHK
    META --> RULECHK
    TBL --> SUMCHK
    FIN --> BALCHK
    SUMCHK --> BALCHK
    RULECHK --> JSONOUT
    BALCHK --> JSONOUT
```

---

## End-to-End Processing Workflow

The processing flow from document upload through verification:

```mermaid
flowchart TD
    classDef startNode fill:#2563eb,stroke:#1d4ed8,color:#ffffff,stroke-width:2px;
    classDef processNode fill:#f8fafc,stroke:#cbd5e1,color:#0f172a,stroke-width:1.5px;
    classDef decisionNode fill:#fef3c7,stroke:#f59e0b,color:#78350f,stroke-width:2px;
    classDef successNode fill:#ecfdf5,stroke:#10b981,color:#065f46,stroke-width:1.5px;
    classDef warningNode fill:#fff1f2,stroke:#f43f5e,color:#881337,stroke-width:1.5px;

    A([Document Uploaded]):::startNode --> B[Read Buffer & Detect MIME Type]:::processNode
    B --> C{Client Preprocessing Enabled?}:::decisionNode

    C -- Yes --> D[Canvas Normalization:<br/>Auto-Deskew, Contrast Stretch, Grayscale]:::processNode
    C -- No --> E[Encode Base64 Payload]:::processNode
    D --> E

    E --> F[POST /api/digitize Endpoint]:::processNode
    F --> G{API Key Configured?}:::decisionNode

    G -- Yes --> H[Invoke Primary Model with Structured Schema]:::processNode
    H --> I{Inference Successful?}:::decisionNode
    I -- Fallback --> J[Invoke Backup Model Pipeline]:::processNode
    J --> K[Parse Normalized Fields]:::processNode
    I -- Yes --> K

    G -- No / Offline --> L[Heuristic Coordinate & Regex Parser]:::processNode
    L --> K

    K --> M[Financial Mathematical Reconciler]:::processNode
    M --> N{Subtotal + Tax - Discount == Total?}:::decisionNode

    N -- Reconciled --> O[Set Status: Verified]:::successNode
    N -- Variance Detected --> P[Set Status: Flagged / Needs Review<br/>Attach Diagnostic Anomaly Flags]:::warningNode

    O --> Q[Line-Item Review & Adjustment Modal]:::processNode
    P --> Q

    Q --> R([Export to Excel .xlsx, CSV, or JSON]):::startNode
```

---

## Execution Sequence Diagram

Sequence of interactions across client, server, and inference endpoints:

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant App as React Frontend
    participant Canvas as Canvas Preprocessor
    participant Server as Express Server
    participant AI as Gemini API
    participant Export as Export Utility

    User->>App: Drop invoice file
    App->>Canvas: Execute deskew & contrast operations
    Canvas-->>App: Optimized base64 image data
    App->>Server: POST /api/digitize { imageBase64, options }
    
    activate Server
    Server->>AI: generateContent({ model: "gemini-2.5-flash", schema, contents })
    
    alt Model Success
        AI-->>Server: Structured JSON Response
    else Service Fallback
        Server->>AI: generateContent({ model: "gemini-3.8-flash", schema, contents })
        AI-->>Server: Structured JSON Response
    else Offline Mode
        Server->>Server: Run Local Regex & Heuristic Parser
    end

    Server->>Server: Execute Financial Reconciliation Rules
    Note over Server: Check subtotal + taxGst - discount == totalAmount<br/>Validate line item pricing & quantities
    Server-->>App: 200 OK (DigitizedInvoice + Anomalies)
    deactivate Server

    App->>User: Display invoice record & confidence indicators
    User->>App: (Optional) Modify values in Verification Modal
    App->>App: Update line items and re-audit totals
    User->>App: Select Export (.xlsx / .csv / .json)
    App->>Export: Generate output file
    Export-->>User: Trigger download
```

---

## Data Entity & Schema Model

Core TypeScript domain structure:

```mermaid
classDiagram
    class DigitizedInvoice {
        +string id
        +string fileName
        +string fileType
        +string rawOcrText
        +string vendorName
        +string vendorGstin
        +string vendorAddress
        +string vendorPhone
        +string customerName
        +string invoiceNumber
        +string invoiceDate
        +string dueDate
        +number subtotal
        +number taxGst
        +number taxRatePercent
        +number discount
        +number totalAmount
        +string currency
        +string category
        +number confidenceScore
        +InvoiceStatus status
        +ProcessingTimeMs processingTimeMs
    }

    class InvoiceItem {
        +string id
        +string description
        +number quantity
        +number unitPrice
        +number totalPrice
        +string hsnCode
    }

    class Anomaly {
        +string id
        +string type
        +string severity
        +string title
        +string message
        +string field
    }

    class FieldConfidences {
        +number vendorName
        +number invoiceNumber
        +number invoiceDate
        +number totalAmount
        +number taxGst
        +number items
        +number category
    }

    DigitizedInvoice "1" *-- "many" InvoiceItem : contains
    DigitizedInvoice "1" *-- "many" Anomaly : flags
    DigitizedInvoice "1" *-- "1" FieldConfidences : scores
```

---

## Document Status Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Uploading: File dropped
    Uploading --> Preprocessing: Read into memory
    Preprocessing --> Digitizing: Conditioned via Canvas
    
    state Digitizing {
        [*] --> MultimodalOCR: Primary Pipeline
        MultimodalOCR --> FallbackModel: Failover Triggered
        FallbackModel --> MathematicalAudit: JSON Structured
        MultimodalOCR --> MathematicalAudit: JSON Structured
    }

    Digitizing --> Verified: Calculations match & required fields present
    Digitizing --> NeedsReview: Minor variance or missing secondary field
    Digitizing --> Flagged: Line items mismatch subtotal or total calculation error

    NeedsReview --> UserReviewed: Manual edit saved
    Flagged --> UserReviewed: Manual edit saved
    Verified --> UserReviewed: Value modified
    
    UserReviewed --> Exported: Export triggered
    Verified --> Exported: Export triggered
    Exported --> [*]
```

---

## Core Functional Modules

### 1. Document Signal Conditioning
- HTML5 Canvas 2D image transformation:
  - **Auto-Deskew**: Angle detection and orientation realignment.
  - **Dynamic Range Optimization**: Contrast stretching for faded or thermal receipts.
  - **Noise Reduction**: Grayscale filtering to sharpen tabular borders and character glyphs.

### 2. Information Extraction
- Structured multimodal parsing:
  - **Header & Vendor Metadata**: Vendor legal name, tax registration number (GSTIN / Tax ID), address, invoice identifier, and billing dates.
  - **Field Disambiguation**: Prevents 10-digit telephone numbers, 6-digit postal PIN codes, bank account numbers, or date stamps from being mistaken for financial totals.
  - **Tabular Line Items**: Captures item description, unit price, billed quantity, line-item total, and HSN/SAC code without stripping model numbers or technical specifications.

### 3. Financial Audit & Mathematical Reconciliation
- Automated arithmetic verification:
  - Validates that $\sum (\text{Quantity} \times \text{Unit Price}) = \text{Subtotal}$.
  - Validates that $\text{Subtotal} + \text{Tax} - \text{Discount} = \text{Grand Total}$.
  - Flags rounding variances and missing tax registrations.

### 4. Review & Export
- Interactive verification modal for reviewing and updating extracted line items.
- Multi-format file export:
  - **Excel (.xlsx)** via SheetJS with structured headers and item tables.
  - **CSV** for spreadsheet import.
  - **JSON** for programmatic downstream integration.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Motion, Lucide Icons
- **Backend**: Node.js, Express, tsx, esbuild
- **AI & Processing**: `@google/genai` (Gemini API), Tesseract.js, HTML5 Canvas API
- **Data Export**: `xlsx` (SheetJS)

---

## Project Directory Structure

```text
├── Dockerfile                  # Multi-stage container build definition
├── docker-compose.yml          # Container orchestration specification
├── .dockerignore               # Container build exclusions
├── requirements.txt            # Python requirements (google-genai, requests, pillow, pydantic)
├── digitizer.py                # Standalone Python CLI & processing client
├── run.sh                      # Universal multi-mode run script
├── Makefile                    # Target shortcuts for developer workflows
├── index.html                  # HTML entry point
├── metadata.json               # Application metadata & permissions
├── package.json                # Dependencies and npm scripts
├── server.ts                   # Express backend API & Vite middleware
├── src/
│   ├── App.tsx                 # Main application UI and state management
│   ├── main.tsx                # React root mount
│   ├── types.ts                # TypeScript interfaces and entity types
│   ├── components/
│   │   ├── UploadDropzone.tsx  # Document upload area with image preprocessing
│   │   ├── EditInvoiceModal.tsx# Line item and financial verification modal
│   │   ├── InvoiceDetailViewer.tsx # Detailed invoice viewer & bounding overlay
│   │   ├── InvoiceDatabaseDashboard.tsx # Digitized invoice table & filter system
│   │   ├── ProcessingOverlay.tsx# Multi-stage extraction progress display
│   │   └── Header.tsx          # Header with actions and statistics
│   └── utils/
│       ├── exportUtils.ts      # CSV, JSON, and Excel export generators
│       ├── imagePreprocess.ts  # Canvas-based deskew, contrast, and denoising
│       └── numberFormat.ts     # Currency and numeric formatting helpers
└── vite.config.ts              # Vite configuration
```

---

## Universal Runnable Quickstart

The application is structured to run seamlessly across any environment—via Docker, Docker Compose, bare-metal Node.js, or local development.

### 1. One-Click Universal Script (`run.sh`)

An executable runner script is included to automatically configure your environment and launch the app in your desired mode:

```bash
# Make script executable (if needed)
chmod +x run.sh

# Start local live development (auto-creates .env and installs deps)
./run.sh dev

# Or build and launch with Docker in one step:
./run.sh docker

# Or run with Docker Compose:
./run.sh compose

# Or compile and launch in production mode:
./run.sh start
```

Available options:
- `./run.sh dev` - Starts development server with live reload at `http://localhost:3000`
- `./run.sh build` - Compiles frontend into `dist/` and bundles server into `dist/server.cjs`
- `./run.sh start` - Runs the production-optimized bundled server
- `./run.sh docker` - Builds Docker image and starts the container
- `./run.sh compose` - Orchestrates the application with Docker Compose
- `./run.sh lint` - Validates TypeScript types with zero compilation errors
- `./run.sh clean` - Purges build outputs and caches

---

### 2. Docker & Docker Compose (Containerized Execution)

#### Using Docker Compose (Recommended):
```bash
# 1. Provide your Gemini API key in .env
cp .env.example .env
# Edit .env and paste your GEMINI_API_KEY

# 2. Build and launch the container
docker compose up --build
```
Access the application at **`http://localhost:3000`**.

#### Using Standalone Docker:
```bash
# Build the production multi-stage image
docker build -t document-digitizer:latest .

# Run the container (with optional API key)
docker run -d \
  --name document-digitizer \
  -p 3000:3000 \
  -e GEMINI_API_KEY="your-gemini-api-key" \
  --restart unless-stopped \
  document-digitizer:latest
```

Health check verification:
```bash
curl http://localhost:3000/api/health
# {"status":"ok","hasGeminiKey":true}
```

---

### 3. Makefile Shortcuts

For developers using `make`:
```bash
make install       # Install dependencies
make dev           # Start Vite/Express development server
make build         # Compile production bundle
make start         # Launch compiled production bundle
make docker-build  # Build Docker container
make docker-run    # Run Docker container
make compose-up    # Launch with Docker Compose
make compose-down  # Stop Docker Compose
make lint          # Run TypeScript checks
```

---

### 4. Bare-Metal / Local Node.js Execution

#### Prerequisites:
- **Node.js** (v18, v20, or v22)
- **npm** (v9+)
- A **Gemini API Key** (optional: app automatically falls back to offline OCR + NLP if not provided)

#### Steps:
```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
# Edit .env and set GEMINI_API_KEY

# 3. Launch Development Server
npm run dev

# Or build and launch Production Server:
npm run build
npm start
```
The application runs on `http://localhost:3000`.

---

### 5. Python CLI & Automation (`digitizer.py` & `requirements.txt`)

For batch processing pipelines, terminal workflows, and Python applications:

#### Installation:
```bash
pip install -r requirements.txt
# Or using the runner script:
./run.sh py-install
```

#### Dual-Engine Modes: Online & Offline
The Python digitizer operates seamlessly in both online cloud vision and 100% air-gapped offline environments:

```bash
# Auto mode (attempts Gemini 2.5 Flash if GEMINI_API_KEY is present; automatically falls back to local offline OCR)
python digitizer.py path/to/invoice.jpg

# Force 100% OFFLINE mode (zero external network or cloud calls; uses local Tesseract OCR & Rule-Based NLP)
python digitizer.py path/to/invoice.jpg --mode offline

# Force ONLINE mode (requires GEMINI_API_KEY in .env)
python digitizer.py path/to/invoice.pdf --mode online

# Export structured JSON data:
python digitizer.py path/to/invoice.pdf --output invoice_data.json

# Export line items table directly to CSV:
python digitizer.py path/to/invoice.png --csv items.csv

# Process via running web server daemon:
python digitizer.py path/to/receipt.jpg --server http://localhost:3000

# Using the runner script shortcut:
./run.sh py path/to/invoice.jpg --mode offline --output result.json
```

---

## Online vs. Offline Processing Capabilities

| Feature | Online Mode (Gemini 2.5/3.8 Flash) | Offline Mode (Local Tesseract & NLP) |
| :--- | :--- | :--- |
| **Network Requirement** | Internet access + API Key | **Zero external network access** (Air-gapped compatible) |
| **OCR Mechanism** | Multimodal Vision Foundation Models | Local Pre-bundled Tesseract (`eng.traineddata`) |
| **Negative Address Isolation** | Semantic Spatial Extraction | Regex & Heuristic Boundary Filters |
| **Mathematical Reconciler** | Multi-Pass Cross-Verification | Deterministic Balance Equations ($\sum \text{Items} = \text{Subtotal}$) |
| **Decimal Point Restoration** | Context-Aware Scale Alignment | Statistical Order-of-Magnitude Correction |
| **Processing Speed** | ~1.2s - 2.5s | ~0.6s - 1.8s |
| **File Format Support** | JPEG, PNG, WebP, PDF | JPEG, PNG, WebP, TIFF, PDF |

---

## API Reference

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
Returns a structured `DigitizedInvoice` object containing extracted metadata, reconciled financials, line items, and anomaly flags.

### `GET /api/health`
Health check endpoint reporting API availability and key configuration status.

---

## License

This project is licensed under the MIT License.
