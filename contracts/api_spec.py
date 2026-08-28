"""
Python Pydantic Schema representation of contracts/api-spec.ts for Backend & AI Engineer team.
Ensure 1:1 schema parity with Frontend TypeScript interfaces.
"""

from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class AnomalyBoundingBox(BaseModel):
    x: float = Field(..., description="Percentage (0 - 100) from left")
    y: float = Field(..., description="Percentage (0 - 100) from top")
    width: float = Field(..., description="Percentage (0 - 100)")
    height: float = Field(..., description="Percentage (0 - 100)")
    label: str = Field(..., description='Anomaly label e.g., "Pixel Splicing", "Font Inconsistency"')
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score 0.0 to 1.0")


class ForensicBreakdown(BaseModel):
    elaScore: float = Field(..., description="Error Level Analysis score (0 - 100)")
    metadataTampered: bool = Field(..., description="Whether document EXIF metadata shows modification traces")
    softwareFingerprintDetected: Optional[str] = Field(None, description='e.g., "Adobe Photoshop CS6", "Canva"')
    semanticDiscrepancy: bool = Field(..., description="Whether content semantic verification failed")


class ForensicReport(BaseModel):
    documentId: str
    isAuthentic: bool
    fraudRiskScore: float = Field(..., ge=0.0, le=100.0, description="0 (Safe) to 100 (Critical Fraud)")
    verdict: Literal["VERIFIED_AUTHENTIC", "SUSPICIOUS", "FORGERY_DETECTED"]
    forensicBreakdown: ForensicBreakdown
    detectedAnomalies: List[AnomalyBoundingBox]
    tamperHeatmapBase64: Optional[str] = Field(None, description="Base64 encoded PNG overlay of tamper heatmap")
    forensicSummary: str = Field(..., description="AI generated textual report summary")
    processingTimeMs: int
