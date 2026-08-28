// contracts/api-spec.ts

export interface AnomalyBoundingBox {
  x: number; // percentage (0 - 100) from left
  y: number; // percentage (0 - 100) from top
  width: number; // percentage (0 - 100)
  height: number; // percentage (0 - 100)
  label: string; // e.g., "Pixel Splicing", "Font Inconsistency"
  confidence: number; // 0.0 to 1.0
}

export interface ForensicBreakdown {
  elaScore: number; // Error Level Analysis score (0 - 100)
  metadataTampered: boolean;
  softwareFingerprintDetected?: string; // e.g., "Adobe Photoshop CS6", "Canva"
  semanticDiscrepancy: boolean;
}

export interface ForensicReport {
  documentId: string;
  isAuthentic: boolean;
  fraudRiskScore: number; // 0 (Safe) to 100 (Critical Fraud)
  verdict: "VERIFIED_AUTHENTIC" | "SUSPICIOUS" | "FORGERY_DETECTED";
  forensicBreakdown: ForensicBreakdown;
  detectedAnomalies: AnomalyBoundingBox[];
  tamperHeatmapBase64?: string;
  forensicSummary: string;
  processingTimeMs: number;
}
