# 🔍 SherDetect - Project Context & Technical Blueprint

> **System Overview for Developers, Judges & LLMs (Claude / GPT)**  
> **Repository**: [github.com/navisjoshvadonel/SherDetect](https://github.com/navisjoshvadonel/SherDetect)  
> **License**: MIT  

---

## 📌 1. Project Vision & Identity

**SherDetect** is an autonomous, full-stack multi-domain document forensics platform designed to detect digital forgery, document tampering, pixel splicing, text superimposition, and mathematical inconsistencies across enterprise documents.

### Key Problem Solved
Document fraud (altered resumes, tampered utility bills, fake identity cards, modified tax invoices, and altered legal deeds) costs global enterprises over **$40 Billion annually**. Standard OCR tools only extract text—they cannot detect altered pixels, font splicing, or modified amounts created in software like Adobe Photoshop or Canva.

### Covered Domains (6 Multi-Domain Sectors)
1. **HR & Resumes**: CVs, Offer Letters, Employment Experience Certificates
2. **KYC & Identity**: Passports, Driver's Licenses, National ID / Aadhaar Cards
3. **Finance & Billing**: Utility Bills, Tax Invoices, Receipts, Expense Claims
4. **Education & Academics**: University Diplomas, Transcripts, Certifications
5. **Legal & Real Estate**: Deeds, Property Leases, Contracts, Agreements
6. **Medical & Health**: Health Records, Medical Claims, Hospital Bills

---

## 🧠 2. The 6-Layer Forensic Detection Architecture

SherDetect fuses 6 independent forensic vectors into a unified **0 to 100 Fraud Risk Score**:

```
 ┌─────────────────────────────────────────────────────────────────────────┐
 │                      SHERDETECT AI FORENSIC PIPELINE                     │
 └─────────────────────────────────────────────────────────────────────────┘
                                     │
   ┌─────────────────────────────────┼─────────────────────────────────┐
   │                                 │                                 │
   ▼                                 ▼                                 ▼
[ Layer 1: Pixel ELA ]    [ Layer 2: EXIF Metadata ]   [ Layer 3: Edge Sharpness ]
OpenCV JPEG re-comp.       Scans binary streams for     Laplacian Variance σ²(I)
maps splicing heatmaps     Photoshop / Canva footprints  detects digital text overlay
   │                                 │                                 │
   ├─────────────────────────────────┼─────────────────────────────────┤
   │                                 │                                 │
   ▼                                 ▼                                 ▼
[ Layer 4: Benford Law ]  [ Layer 5: Checksums ]       [ Layer 6: Gemini LLM ]
First-digit logarithmic   Verhoeff (Base-10 D5) &      Multimodal semantic reasoner
frequency divergence      Luhn (Mod-10) ID checks      with privacy PII masking
   │                                 │                                 │
   └─────────────────────────────────┼─────────────────────────────────┘
                                     │
                                     ▼
                      [ Risk Scorer Fusion Engine ]
                     Weighted Risk Score (0 - 100%)
                     Verdict: AUTHENTIC / FORGERY
```

### Module Breakdown (`ai_engine/`)
* **`ela_engine.py`**: Computes JPEG Error Level Analysis (ELA) by re-compressing images at 95% quality and calculating pixel variance ($I_{diff} = |I_{orig} - I_{comp}|$). Generates base64 heatmaps and maps bounding boxes `(x, y, w, h)`.
* **`metadata_scanner.py`**: Binary stream & EXIF scanner. Searches for signatures of editing software (`Adobe Photoshop`, `Canva`, `GIMP`, `Pixlr`, `Illustrator`, `InDesign`, `CorelDRAW`) and modified EXIF dates.
* **`sharpness_inspector.py`**: Laplacian variance inspector ($\sigma^2(\text{Laplacian}(I))$). Identifies patches with abnormally sharp edge gradients (digital text superimposed on scanned paper).
* **`benford_inspector.py`**: Evaluates numeric distributions against Benford’s First-Digit Law ($P(d) = \log_{10}(1 + 1/d)$) to catch synthetic accounting figures.
* **`checksum_validator.py`**: Validates 12-digit UIDs (Verhoeff algorithm) and 16-digit payment card IDs (Luhn algorithm).
* **`pii_sanitizer.py`**: Scrubbing engine that redacts citizen PII (Aadhaar, PAN, card numbers, emails) before sending text to AI models.
* **`ai_validator.py`**: Gemini 1.5 Flash multimodal reasoner for math parity check (Subtotal + Tax = Total) with zero-downtime offline fallback heuristics.
* **`risk_scorer.py`**: Weighted fusion engine calculating final Fraud Risk Score (0–100) and generating investigator summary narratives.
* **`sample_generator.py`**: Autonomous synthetic test sample generator (`GET /api/sample-documents`).

---

## 🎨 3. UI/UX Design System & Frontend Architecture

* **Framework**: Next.js 14 (App Router) + React + Tailwind CSS
* **Design Philosophy**: **Neo-Brutalist Aesthetic** (bold black borders `border-2.5`, vibrant primary palette: `#FFE500` Yellow, `#00F0FF` Cyan, `#FF0055` Pink, `#00FF66` Green, hard offset shadows `shadow-brutal`).
* **Screen-Fitted Layout**: Custom viewport bounds ensuring all views fit seamlessly without unnecessary scrollbars.
* **Dual Role Switcher**:
  - **Submitter View**: Upload portal with drag-and-drop zone, file format badges, category filters, and live document submission table with instant search.
  - **Verifier / Reviewer View**: Officer worklist, instant search, status filters (`Pending`, `Verified`, `Rejected`), and full Forensic Inspection Canvas.
* **Interactive Forensic Canvas**:
  - **Risk Score Gauge**: 0–100 risk badge with animated progress bar.
  - **Zoom & Pan Controls**: Interactive `+`, `-`, and `Reset` zoom buttons (up to 250% magnification).
  - **Animated Re-Scan Button**: Live re-audit simulation with scanner overlay.
  - **ELA Heatmap Toggle**: Switch between visual original bounding boxes and ELA compression heatmaps.
  - **Export Audit Report**: Export official JSON audit certificates for compliance archiving.

---

## 📁 4. Project Repository Structure

```
SherDetect/
├── ai_engine/                         # Python AI Forensic Engine (FastAPI)
│   ├── __init__.py
│   ├── server.py                      # FastAPI Application Server (Port 8000)
│   ├── ela_engine.py                  # Layer 1: Pixel ELA & OpenCV Heatmaps
│   ├── metadata_scanner.py            # Layer 2: EXIF & Binary Software Scanner
│   ├── sharpness_inspector.py         # Layer 3: Edge Sharpness Inconsistency
│   ├── benford_inspector.py           # Layer 4: Benford's Law Accounting Audit
│   ├── checksum_validator.py          # Layer 5: Verhoeff & Luhn ID Checksums
│   ├── pii_sanitizer.py               # Layer 6a: PII Redaction Engine
│   ├── ai_validator.py                # Layer 6b: Gemini AI & Offline Heuristics
│   ├── risk_scorer.py                 # Multi-Vector Risk Scorer (0-100 Score)
│   ├── sample_generator.py            # Synthetic Demo Sample Generator
│   └── tests/                         # Pytest Suite (12 Unit Tests)
│       └── test_ai_engine.py
├── frontend/                          # Next.js 14 Web Application (Port 3000)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx               # Primary Dashboard Router
│   │   │   ├── globals.css            # Neo-Brutalist CSS System & Animations
│   │   │   ├── layout.tsx             # Root Application Layout
│   │   │   ├── types.ts               # Shared TypeScript Data Models
│   │   │   └── components/
│   │   │       ├── Header.tsx         # Top Branding & Role Switcher Header
│   │   │       ├── DomainBanner.tsx   # Domain Selector Grid
│   │   │       ├── SubmitterView.tsx  # Submitter Upload & Document Queue
│   │   │       ├── ReviewerView.tsx   # Verifier Worklist & Decision Form
│   │   │       ├── ForensicCanvas.tsx # Visual Inspector Canvas & Zoom
│   │   │       ├── AuditTrail.tsx     # Timeline Audit Log
│   │   │       └── ToastOverlay.tsx   # Micro-Notification Toasts
├── contracts/                         # Enforced Schema Specifications
│   ├── api-spec.ts                    # TypeScript Contract Specification
│   ├── api_spec.py                    # Python Pydantic Model Specification
│   └── mock-data.ts                   # Seed Data & Demo Fixtures
├── .env.example                       # Environment Configuration Blueprint
├── README.md                          # Repository Documentation
└── PROJECT_CONTEXT.md                 # Technical Architecture Blueprint
```

---

## 🔌 5. API Endpoints & Specifications

### 1. Verification Endpoint
* **URL**: `POST /api/verify-document`
* **Content-Type**: `multipart/form-data`
* **Request Payload**: `file: UploadFile`
* **Response Contract (`ForensicReport`)**:
```json
{
  "documentId": "DOC-8214",
  "isAuthentic": false,
  "fraudRiskScore": 88.5,
  "verdict": "FORGERY_DETECTED",
  "forensicBreakdown": {
    "elaScore": 88.2,
    "metadataTampered": true,
    "softwareFingerprintDetected": "Adobe Photoshop",
    "semanticDiscrepancy": true
  },
  "detectedAnomalies": [
    {
      "x": 62.5,
      "y": 41.2,
      "width": 18.0,
      "height": 6.5,
      "label": "Pixel Splicing & Compression Anomaly",
      "confidence": 0.96
    }
  ],
  "tamperHeatmapBase64": "data:image/png;base64,...",
  "forensicSummary": "Critical tampering detected. Error Level Analysis indicates re-compression artifacts...",
  "processingTimeMs": 119
}
```

### 2. Demo Samples Endpoint
* **URL**: `GET /api/sample-documents`
* **Response**: List of 5 synthetic test cases for live pitches.

### 3. System Health Check
* **URL**: `GET /health`
* **Response**: `{"status": "ok", "service": "SherDetect AI Forensic Engine", "version": "1.1.0"}`

---

## 🚀 6. Setup & Execution Commands

### Prerequisites
* Node.js v18+ & npm
* Python 3.10+ & pip

### Backend Setup (FastAPI Python Engine)
```bash
# Navigate to project root
cd d:\SherDetect

# Install Python dependencies
pip install fastapi uvicorn pillow opencv-python-headless numpy google-generativeai python-dotenv pytest

# Start FastAPI server on Port 8000
python -m uvicorn ai_engine.server:app --port 8000 --host 0.0.0.0
```

### Frontend Setup (Next.js Application)
```bash
# Navigate to frontend directory
cd d:\SherDetect\frontend

# Install dependencies
npm install

# Run development server on Port 3000
npm run dev

# Run production build validation
npm run build
```

### Running Test Suites
```bash
# Run Python backend unit tests (12 tests)
python -m pytest ai_engine/tests/
```

---

## 💡 7. Quick Summary for AI Assistants (Claude / GPT)

When assisting on this codebase, keep in mind:
1. **Separation of Concerns**: Python backend logic lives strictly in `ai_engine/`, frontend UI components live in `frontend/src/app/components/`, and contracts live in `contracts/`.
2. **Contract Enforcements**: Always maintain parity between `contracts/api-spec.ts` and `contracts/api_spec.py`.
3. **UI Consistency**: Maintain the **Neo-Brutalist** styling system (`neo-card`, `neo-btn`, `neo-input`, `neo-badge`, `border-2.5 border-brutal-black`).
4. **Resilience**: `ai_validator.py` includes an offline fallback heuristic engine that must never crash even if Gemini API keys are absent.
