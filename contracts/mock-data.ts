// contracts/mock-data.ts
import { ForensicReport } from './api-spec';

export const MOCK_FORGERY_REPORT: ForensicReport = {
  documentId: "doc_hackathon_99812",
  isAuthentic: false,
  fraudRiskScore: 87.5,
  verdict: "FORGERY_DETECTED",
  forensicBreakdown: {
    elaScore: 84.2,
    metadataTampered: true,
    softwareFingerprintDetected: "Adobe Photoshop 24.1 (Windows)",
    semanticDiscrepancy: true,
  },
  detectedAnomalies: [
    {
      x: 18.5,
      y: 42.0,
      width: 25.0,
      height: 8.5,
      label: "Pixel Splicing & ELA Spike",
      confidence: 0.94,
    },
    {
      x: 52.0,
      y: 68.3,
      width: 30.0,
      height: 12.0,
      label: "Font Inconsistency & Alignment Artifact",
      confidence: 0.88,
    },
  ],
  tamperHeatmapBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  forensicSummary: "High confidence document alteration detected. Error Level Analysis (ELA) identified distinct compression level mismatches near the financial totals box. EXIF analysis confirms metadata modification via Adobe Photoshop. Font spacing and glyph metrics deviate significantly from standard bank statement templates.",
  processingTimeMs: 412,
};

export const MOCK_AUTHENTIC_REPORT: ForensicReport = {
  documentId: "doc_hackathon_99813",
  isAuthentic: true,
  fraudRiskScore: 4.2,
  verdict: "VERIFIED_AUTHENTIC",
  forensicBreakdown: {
    elaScore: 5.1,
    metadataTampered: false,
    softwareFingerprintDetected: undefined,
    semanticDiscrepancy: false,
  },
  detectedAnomalies: [],
  tamperHeatmapBase64: undefined,
  forensicSummary: "Document passed all automated visual, metadata, and structural integrity checks. No pixel splicing, font anomalies, or software modification traces detected.",
  processingTimeMs: 295,
};
