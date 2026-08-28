# SherDetect — Autonomous Multi-Domain AI Forensic & Verification Engine

> Multi-layer Document Fraud & Forgery Detection Suite • Resumes, Bills, IDs, Credentials & Legal

---

## 📁 Repository Structure

```
SherDetect/
├── ai_engine/             # 🧠 AI Forensic Engine & FastAPI Server
│   ├── server.py          # Live FastAPI Backend Server (Port 8000)
│   ├── ela_engine.py      # Layer 1: Pixel Error Level Analysis (ELA) & OpenCV Anomaly Localization
│   ├── ai_validator.py    # Layer 2 & 3: Gemini Multimodal AI & Offline Fallback Heuristics
│   ├── benford_inspector.py# Layer 4: Benford's Law Statistical Frequency Analysis
│   ├── checksum_validator.py# Layer 5: Math Parity & Tax Checksum Verification
│   ├── pii_sanitizer.py   # Layer 6: Text Redaction & PII Masking
│   ├── risk_scorer.py     # Multi-Factor Forensic Fraud Risk Calculator (0-100)
│   └── tests/             # Comprehensive Pytest Suite (9/9 Passed)
│
├── frontend/              # 💻 Next.js 14 Neo-Brutalist Dashboard UI
│   ├── src/app/page.tsx   # Multi-Domain Verification Dashboard
│   ├── src/app/components/# Header, DomainBanner, SubmitterView, ReviewerView, ForensicCanvas, AuditTrail
│   └── src/contracts/     # Shared API Specifications & Mock Data Fixtures
│
├── contracts/             # Shared API Contracts & Schemas
└── README.md              # System Architecture & Quick Start Guide
```

---

## ⚡ Quick Start Guide

### 1. Run Python AI Engine Tests
```bash
python -m pytest ai_engine/tests/
```

### 2. Start Live Python AI Engine Backend (Port 8000)
```bash
python -m uvicorn ai_engine.server:app --port 8000 --host 0.0.0.0
```

### 3. Start Next.js Frontend Dashboard (Port 3000)
```bash
cd frontend
npm run dev
```

---

## 🛡️ Multi-Domain Coverage
- **HR & Resumes**: CVs, Offer Letters, Experience Certificates
- **Identity & Passports**: Passports, Driver Licenses, National IDs
- **Bills & Invoices**: Utility Bills, Financial Receipts, Tax Filings
- **Education & Degrees**: Diplomas, Academic Transcripts, Certifications
- **Legal Contracts**: Property Deeds, Leases, Legal Agreements
- **Medical & Health**: Health Records, Medical Claims
