# 🔌 SherDetect Enterprise API Integration & Onboarding Guide

**SDK Version**: 2.0.0  
**API Specification**: OpenAPI 3.0 (FastAPI Compliant)  
**Authentication**: Bearer JWT / API Key  

---

## 1. 🚀 Quickstart Onboarding Guide

SherDetect allows enterprise clients to seamlessly integrate automated document forgery detection into existing HR, KYC, and Finance workflows.

### Endpoint Base URLs:
- **Production Primary**: `https://api.sherdetect.com`
- **Staging / Sandbox**: `https://staging-api.sherdetect.com`

---

## 2. 💻 Code Integration Examples

### 1. Python Integration:
```python
import requests

API_KEY = "sd_live_secret_key_12345"
URL = "https://api.sherdetect.com/api/verify-document"

headers = {"Authorization": f"Bearer {API_KEY}"}
files = {"file": ("employee_paystub.pdf", open("paystub.pdf", "rb"), "application/pdf")}

response = requests.post(URL, headers=headers, files=files)
result = response.json()

print(f"Document Verdict: {result['report']['verdict']}")
print(f"Fraud Risk Score: {result['report']['fraudRiskScore']}%")
```

### 2. TypeScript / Node.js Integration:
```typescript
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

async function verifyDocument(filePath: string) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));

  const response = await axios.post('https://api.sherdetect.com/api/verify-document', form, {
    headers: {
      ...form.getHeaders(),
      'Authorization': 'Bearer sd_live_secret_key_12345'
    }
  });

  return response.data;
}
```

### 3. cURL CLI Integration:
```bash
curl -X POST "https://api.sherdetect.com/api/verify-document" \
  -H "Authorization: Bearer sd_live_secret_key_12345" \
  -F "file=@passport_scan.png;type=image/png"
```

---

## 3. 📜 Core OpenAPI Endpoint Reference

| Route | Method | Access Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/verify-document` | `POST` | User / API Key | Submits document for 6-layer forensic analysis |
| `/api/documents/status/{job_id}` | `GET` | User / API Key | Polls status of async verification job |
| `/api/documents/{doc_id}/explanation` | `GET` | Verifier Officer | Retrieves GDPR Art. 22 explanation artifact |
| `/api/privacy/gdpr-erasure` | `POST` | DPO / Admin | Submits GDPR Art. 17 right-to-erasure request |
| `/api/governance/benchmarks` | `GET` | Admin | Fetches empirical precision/recall benchmarks |
| `/metrics` | `GET` | Monitor Agent | Exposes Prometheus APM telemetry metrics |

---

## 4. 💼 Enterprise SLA & Support Tiers

| SLA Tier | Target Uptime | Response Time (P1) | Response Time (P2) | Support Channel |
| :--- | :--- | :--- | :--- | :--- |
| **Platinum Sovereign** | **99.99%** | **< 15 Mins** | **< 1 Hour** | 24/7 Dedicated Hotline & Slack |
| **Enterprise Gold** | **99.90%** | **< 1 Hour** | **< 4 Hours** | 24/7 Email & Web Portal |
| **Standard Silver** | **99.00%** | **< 4 Hours** | **< 24 Hours** | Business Hours Support |
