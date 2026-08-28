# SherDetect — Autonomous AI Forensic Investigator

> Multi-layer Document Fraud & Forgery Detection Platform for 24-Hour Hackathon

---

## 📁 Role-Based Directory Structure

```
SherDetect/
├── contracts/             # Shared API Specs & Data Fixtures (Single Source of Truth)
│   ├── api-spec.ts        # TypeScript Contract Interface
│   ├── api_spec.py        # Python Pydantic Models
│   ├── mock-data.ts       # Frontend Mock Data Fixtures
│   └── index.ts           # Exports
│
├── frontend/              # 💻 FRONTEND ROLE (Next.js / React)
│   └── src/app/page.tsx   # Interactive Forensic Canvas & Risk Meter UI
│
├── backend/               # ⚡ BACKEND ROLE (FastAPI App & API Endpoints)
│   └── app/main.py        # /api/verify-document & /health endpoints
│
├── ai_engine/             # 🧠 AI ENGINEER ROLE (Computer Vision & LLM Models)
│   ├── ela_engine.py      # Layer 1: Pixel Compression (ELA) & OpenCV Anomaly Localization
│   ├── ai_validator.py    # Layer 2 & 3: Gemini Multimodal Semantic & Heuristic Reasoner
│   └── tests/             # AI Unit Tests
│
└── README.md              # Project Architecture & Workflow Documentation
```

---

## 🎯 Role Responsibilities & Workflows

### 💻 1. Frontend Role (`/frontend`)
- **Dashboard UI**: Drag-and-drop document audit zone.
- **Visual Canvas**: Percentage-based `AnomalyBoundingBox` overlay for responsive rendering.
- **Heatmap Toggle**: ELA `tamperHeatmapBase64` layer toggle.
- **Metrics**: Real-time Fraud Risk Score (0-100) & verdict status badges.

### ⚡ 2. Backend Role (`/backend`)
- **FastAPI API Orchestrator**: `POST /api/verify-document` & `GET /health`.
- **CORS & Buffering**: File upload parsing and streaming to AI engine.
- **Schema Parity**: Validates outputs using `contracts/api_spec.py`.

### 🧠 3. AI Engineer Role (`/ai_engine`)
- **Pixel Forensics (`ela_engine.py`)**: Re-compression error differential analysis + OpenCV contour detection.
- **Semantic Reasoning (`ai_validator.py`)**: Gemini 1.5 Flash multimodal inspection for math/date parity with offline fallback.

---

## ⚡ Quick Start

```bash
# 1. AI Engine Tests
python ai_engine/tests/test_ai_engine.py

# 2. Start Backend API Server
cd backend
uvicorn app.main:app --reload --port 8000

# 3. Start Frontend Dashboard
cd frontend
npm run dev
```
