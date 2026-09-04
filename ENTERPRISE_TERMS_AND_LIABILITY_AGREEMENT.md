# ⚖️ SherDetect Enterprise Terms of Service & Liability Agreement

**Effective Date**: September 4, 2026  
**Document Version**: 2.0.0  
**Target Audience**: Enterprise Procurement, Legal Counsel, Risk & Insurance Officers  

---

## 1. 📜 Scope & AI Decision Support Framework

1.1 **Human-in-the-Loop (HITL) Imperative**: SherDetect operates strictly as an **Artificial Intelligence Forensic Decision-Support System**. All risk scores, Error Level Analysis (ELA) heatmaps, and multimodal LLM findings are provided to assist authorized enterprise verification officers ("Verifiers").

1.2 **No Automated Legal Verdicts**: SherDetect does not execute sole automated legal determinations under GDPR Article 22 without human officer review. Final hiring, lending, or legal enforcement actions remain the sole responsibility of the Enterprise Client.

---

## 2. 🛡️ Limitation of Liability & Warranties

2.1 **Accuracy Disclaimer**: While SherDetect maintains an empirical sector accuracy standard (precision `>99.4%` across HR, KYC, and Finance sectors as published in our Model Cards), document forgery techniques evolve dynamically. SherDetect provides analysis on an **"AS IS" and "AS AVAILABLE"** basis without express warranties of 100% error-free detection.

2.2 **Liability Cap**: Under no circumstances shall SherDetect or its parent entity be liable for indirect, consequential, punitive, or special damages arising from false positives or false negatives. Total liability is limited to the fees paid by the Enterprise Client in the **twelve (12) months preceding the incident**.

2.3 **Cyber Insurance Coverage**: SherDetect carries a **$10,000,000 Cyber Liability & Professional Errors & Omissions (E&O) Insurance Policy** covering data security breaches and algorithmic indemnity claims.

---

## 3. 🚨 Verdict Dispute & Escalation Workflow

```mermaid
graph TD
    A[Verifier / Client Disputes Verdict] -->|POST /api/governance/alerts| B[SherDetect Forensic Escalation Desk]
    B -->|Level 1 Review (2 Hours)| C[Senior Forensic Engineer Audit]
    C -->|Level 2 Re-calibration| D[Model Feedback Tuner Retraining]
    D -->|Signed Court Affidavit| E[Updated Legal Forensic Certificate]
```

3.1 **Dispute Portal**: Enterprise clients can lodge a verdict dispute directly via `POST /api/governance/alerts` or by submitting a ticket to `forensic-escalations@sherdetect.com`.

3.2 **Escalation SLAs**:
- **P1 Verdict Escalation** (Critical KYC/Lending Block): Initial review within **2 Hours**.
- **P2 Standard Escalation**: Initial review within **24 Hours**.
