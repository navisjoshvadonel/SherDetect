// contracts/mock-data.ts
import { ForensicReport } from "./api-spec";

export const MOCK_FORGERY_REPORT: ForensicReport = {
  documentId: "DOC-FORGERY-9821",
  isAuthentic: false,
  fraudRiskScore: 94.5,
  verdict: "FORGERY_DETECTED",
  forensicBreakdown: {
    elaScore: 88.2,
    metadataTampered: true,
    softwareFingerprintDetected: "Adobe Photoshop CC 2023 (Macintosh)",
    semanticDiscrepancy: true,
  },
  detectedAnomalies: [
    {
      x: 62.5,
      y: 41.2,
      width: 18.0,
      height: 6.5,
      label: "Pixel Splicing & Compression Anomaly",
      confidence: 0.96,
    },
    {
      x: 70.1,
      y: 78.4,
      width: 22.0,
      height: 5.0,
      label: "Font Kerning & Alignment Discrepancy",
      confidence: 0.89,
    },
  ],
  tamperHeatmapBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  forensicSummary:
    "Critical tampering detected. Error Level Analysis indicates re-compression artifacts on line-item values. Metadata reveals Adobe Photoshop export signatures with mismatched PDF creation dates.",
  processingTimeMs: 1420,
};

export const MOCK_AUTHENTIC_REPORT: ForensicReport = {
  documentId: "DOC-AUTH-1044",
  isAuthentic: true,
  fraudRiskScore: 4.2,
  verdict: "VERIFIED_AUTHENTIC",
  forensicBreakdown: {
    elaScore: 6.5,
    metadataTampered: false,
    softwareFingerprintDetected: undefined,
    semanticDiscrepancy: false,
  },
  detectedAnomalies: [],
  tamperHeatmapBase64: undefined,
  forensicSummary:
    "Document passed all forensic audits. Compression levels are uniform across all layers, metadata headers are intact, and mathematical parity is verified.",
  processingTimeMs: 890,
};
