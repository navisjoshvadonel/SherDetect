# 🏛️ SherDetect Enterprise Compliance, Legal & Governance Framework

This document outlines the enterprise legal, compliance, and regulatory governance framework for the **SherDetect Document Integrity & Forgery Detection Platform**, enabling deployment across multinational B2B enterprise procurement environments (EU GDPR, US CCPA/FCPA, India DPDP Act, SOC 2 Type II, ISO 27001, and FATF AML/KYC guidelines).

---

## 1. 🛡️ Regulatory & Compliance Standards Alignment

| Standard | Scope / Jurisdiction | Implementation in SherDetect | Status |
| :--- | :--- | :--- | :--- |
| **SOC 2 Type II** | Global B2B SaaS Security & Confidentiality | TLS 1.3 in-transit, AES-256 at-rest, RBAC role segregation, rate limiting. | **Compliant Framework** |
| **ISO/IEC 27001** | Information Security Management System | Zero-trust architecture, magic-byte malware inspection, circuit breakers. | **Compliant Framework** |
| **EU GDPR (Art. 17)** | European Union (Right-to-Erasure) | Dedicated `POST /api/privacy/gdpr-erasure` with signed Deletion Certificates. | **Implemented & Active** |
| **EU GDPR (Art. 22)** | European Union (Automated Decision-Making) | Legal `GET /api/documents/{id}/explanation` Right-to-Explanation certificate. | **Implemented & Active** |
| **US CCPA / FCPA** | United States Privacy & Credit Reporting | Citizen data opt-out, PII scrubbing before LLM processing, explainability. | **Implemented & Active** |
| **FATF / AML / KYC** | Global Financial Task Force Alignment | Anti-tamper verification for identity passports, utility bills, and paystubs. | **Implemented & Active** |

---

## 2. 🔐 Immutable Cryptographic Audit Trail (WORM Architecture)

To ensure forensic determinations stand up in legal proceedings and regulatory audits, SherDetect enforces a **Write-Once-Read-Many (WORM)** audit trail using SHA-256 hash chaining.

### Hash Chaining Mechanics:
$$\text{Entry Hash}_n = \text{SHA-256}(\text{Entry Hash}_{n-1} \parallel \text{DocID} \parallel \text{Action} \parallel \text{Actor} \parallel \text{Timestamp} \parallel \text{Note})$$

1. **Tamper Prevention**: PostgreSQL triggers (`prevent_audit_tampering()`) forbid any `UPDATE` or `DELETE` statements on the `audit_trail` table.
2. **Cryptographic Continuity**: Modifying any past historical entry breaks the hash chain for all subsequent entries, immediately alerting security auditors.

---

## 3. 📜 Sub-Processor Disclosure & Data Processing Agreement (DPA)

SherDetect utilizes **Google Gemini 1.5 Flash** via `google.genai` as an external sub-processor for Layer 6 (Multimodal Semantic & AI Generation Artifact Inspection).

### Data Safeguards for Sub-Processing:
- **PII Anonymization**: All citizen PII (Aadhaar numbers, SSNs, credit card numbers, personal addresses) is scrubbed via `PIISanitizer` prior to transmitting text to the sub-processor.
- **Data Retention by Sub-Processor**: Zero data retention agreement (transmitted data is processed ephemeral in-memory and not used to train base foundation models).
- **Circuit Breaker Isolation**: If the external sub-processor experiences downtime or latency, `GeminiCircuitBreaker` seamlessly decouples Layer 6 and routes analysis to deterministic offline heuristics.

---

## 4. 🧠 AI Model Risk Assessment & Governance (Model Card)

| Parameter | Specification |
| :--- | :--- |
| **Model Name** | SherDetect Multi-Vector Forensic Ensemble v2.0 |
| **Primary Vectors** | 1. Pixel Error Level Analysis (ELA)<br>2. EXIF Metadata Fingerprinting<br>3. Laplacian Edge Sharpness Variance<br>4. Benford First-Digit Distribution<br>5. Cryptographic ID Checksum Validation<br>6. Gemini 1.5 Multimodal Semantic Audit |
| **Format Bias Mitigation** | File quality (low-res JPG vs clean PDF) is explicitly ignored; only extracted content, pixel variance, and issuer facts are evaluated. |
| **Human-in-the-Loop** | High-risk verdicts (>60% Fraud Risk) trigger mandatory Human Officer Review in the dashboard prior to final rejection. |

---

## 5. ⚖️ GDPR Article 17 Erasure & Article 22 Explanation Endpoints

### 1. Execute Right-to-Erasure:
```http
POST /api/privacy/gdpr-erasure
Content-Type: application/json
Authorization: Bearer <OFFICER_JWT>

{
  "documentId": "DOC-9842-FORGED",
  "requestedBy": "compliance@enterprise-client.com",
  "reason": "GDPR Article 17 Right-to-Erasure Request"
}
```
**Response**: Returns a digitally signed `ErasureCertificate` verifying permanent zero-overwritten scrubbing from all storage buckets.

### 2. Generate Right-to-Explanation Certificate:
```http
GET /api/documents/DOC-9842-FORGED/explanation
Authorization: Bearer <OFFICER_JWT>
```
**Response**: Returns an automated decision breakdown certificate satisfying EU GDPR Article 22(3) requirements.
