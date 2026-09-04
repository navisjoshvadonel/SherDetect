"""
ai_engine/tenant_config.py
--------------------------
Multi-Tenancy Configuration & Customizable Risk Threshold Engine.

Allows enterprise business units and regions to customize forensic risk tolerance thresholds:
- KYC / Finance: Strict (Lower threshold = 40.0 for escalation)
- HR / Payroll: Moderate (Threshold = 60.0)
- Academic / General: Standard (Threshold = 70.0)
"""

from typing import Dict, Any, Optional
from pydantic import BaseModel, Field

class SectorThresholdConfig(BaseModel):
    kyc_identity: float = Field(default=40.0, description="Strict threshold for KYC ID verification")
    finance_tax: float = Field(default=45.0, description="Strict threshold for invoices/tax forms")
    hr_payroll: float = Field(default=60.0, description="Moderate threshold for paystubs/resumes")
    legal_contracts: float = Field(default=55.0, description="Moderate threshold for binding contracts")
    academic_degrees: float = Field(default=70.0, description="Standard threshold for diplomas")
    medical_insurance: float = Field(default=50.0, description="Strict threshold for claims")


class TenantConfig(BaseModel):
    tenant_id: str = Field(..., description="Unique enterprise tenant ID e.g. AcmeCorp-EU")
    tenant_name: str = Field(..., description="Human-readable business unit name")
    region: str = Field(default="EU-WEST", description="Data residency jurisdiction")
    locale: str = Field(default="en-US", description="Default UI/PDF affidavit locale (en-US, de-DE, fr-FR, es-ES)")
    webhook_url: Optional[str] = Field(default=None, description="Client Webhook endpoint for async verdicts")
    webhook_secret: Optional[str] = Field(default=None, description="HMAC-SHA256 signing key for webhook security")
    thresholds: SectorThresholdConfig = Field(default_factory=SectorThresholdConfig)


# Global Tenant Registry
_TENANT_REGISTRY: Dict[str, TenantConfig] = {
    "default": TenantConfig(
        tenant_id="default",
        tenant_name="Default Enterprise Sovereign Unit",
        region="GLOBAL-PRIMARY",
        locale="en-US"
    )
}


class TenantManager:
    @classmethod
    def get_tenant_config(cls, tenant_id: str = "default") -> TenantConfig:
        return _TENANT_REGISTRY.get(tenant_id, _TENANT_REGISTRY["default"])

    @classmethod
    def register_or_update_tenant(cls, config: TenantConfig) -> TenantConfig:
        _TENANT_REGISTRY[config.tenant_id] = config
        return config

    @classmethod
    def get_effective_threshold(cls, tenant_id: str, sector: str) -> float:
        config = cls.get_tenant_config(tenant_id)
        sector_normalized = sector.lower().replace(" ", "_").replace("&", "")
        if "kyc" in sector_normalized or "identity" in sector_normalized:
            return config.thresholds.kyc_identity
        elif "finance" in sector_normalized or "tax" in sector_normalized:
            return config.thresholds.finance_tax
        elif "hr" in sector_normalized or "payroll" in sector_normalized:
            return config.thresholds.hr_payroll
        elif "legal" in sector_normalized or "contract" in sector_normalized:
            return config.thresholds.legal_contracts
        elif "medical" in sector_normalized or "insurance" in sector_normalized:
            return config.thresholds.medical_insurance
        else:
            return config.thresholds.academic_degrees
