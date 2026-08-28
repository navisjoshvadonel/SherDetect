# SherDetect — Autonomous AI Forensic Investigator

> Multi-layer Document Fraud & Forgery Detection Platform

## Architecture Pipeline
1. **Layer 1: Pixel Forensics (OpenCV / PIL)** — Error Level Analysis (ELA) and re-compression differential anomaly mapping.
2. **Layer 2: Metadata & Cryptographic Audit** — PDF byte-stream parsing for editing fingerprints (Photoshop, Canva, Acrobat) and timestamp mismatches.
3. **Layer 3: Multimodal Semantic Reasoner (Gemini / Groq)** — Mathematical consistency verification, date logic checks, and tax/ID checksums.

## Team Workflows & Contracts
- **TypeScript API Contract:** `contracts/api-spec.ts`
- **Python Pydantic Schema:** `contracts/api_spec.py`
- **Frontend Mock Fixtures:** `contracts/mock-data.ts`
