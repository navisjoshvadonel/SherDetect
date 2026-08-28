# contracts/api_spec.py
from typing import List, Optional
from pydantic import BaseModel, Field

class AnomalyBoundingBox(BaseModel):
    x: float = Field(..., description="Percentage (0 - 100) from left")
    y: float = Field(..., description="Percentage (0 - 100) from top")
    width: float = Field(..., description="Percentage (0 - 100)")
    height: float = Field(..., description="Percentage (0 - 100)")
    label: str = Field(..., description="e.g. Pixel Splicing, Font Inconsistency")
    confidence: float = Field(..., description="Confidence score from 0.0 to 1.0")

class ForensicBreakdown(BaseModel):
    elaScore: float = Field(..., description="Error Level Analysis score (0 - 100)")
    metadataTampered: bool = Field(..., description="Whether metadata signatures indicate tampering")
    softwareFingerprintDetected: Optional[str] = Field(None, description="e.g. Adobe Photoshop CS6, Canva")
    semanticDiscrepancy: bool = Field(..., description="Whether mathematical or semantic logic failed")

class ForensicReport(BaseModel):
    documentId: str
    isAuthentic: bool
    fraudRiskScore: float = Field(..., description="0 (Safe) to 100 (Critical Fraud)")
    verdict: str = Field(..., description="VERIFIED_AUTHENTIC | SUSPICIOUS | FORGERY_DETECTED")
    forensicBreakdown: ForensicBreakdown
    detectedAnomalies: List[AnomalyBoundingBox] = Field(default_factory=list)
    tamperHeatmapBase64: Optional[str] = None
    forensicSummary: str
    processingTimeMs: int
