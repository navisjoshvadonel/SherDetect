import { ForensicReport } from "../contracts/api-spec";

export type DomainKey =
  | "hr_employment"
  | "identity_kyc"
  | "billing_finance"
  | "education_academics"
  | "legal_contracts"
  | "medical_insurance";

export type DocumentStatus = "pending" | "under_review" | "verified" | "rejected" | "resubmit";

export interface CategoryOption {
  val: string;
  label: string;
}

export const DOMAIN_CATEGORIES: Record<DomainKey, CategoryOption[]> = {
  hr_employment: [
    { val: "resume", label: "Resume / Curriculum Vitae (PDF/DOCX)" },
    { val: "offer_letter", label: "Offer Letter & Employment Agreement" },
    { val: "experience_cert", label: "Work Experience Certificate" },
    { val: "pay_stub", label: "Payslip / Salary Statement" },
  ],
  identity_kyc: [
    { val: "passport", label: "Passport Scan (Photo & Info Page)" },
    { val: "national_id", label: "National ID Card / Aadhaar / Social Security" },
    { val: "driver_license", label: "Driver's License (Front & Back)" },
    { val: "signature_specimen", label: "Signature Specimen Scan" },
  ],
  billing_finance: [
    { val: "utility_bill", label: "Utility Bill (Electricity, Water, Gas)" },
    { val: "invoice", label: "Commercial Vendor Invoice / Receipt" },
    { val: "tax_return", label: "Tax Statement / W-2 Form" },
    { val: "bank_statement", label: "Account Financial Statement" },
  ],
  education_academics: [
    { val: "degree_diploma", label: "University Degree / High School Diploma" },
    { val: "academic_transcript", label: "Official Academic Transcript (PDF/XLSX)" },
    { val: "skill_cert", label: "Professional Skill Certification" },
  ],
  legal_contracts: [
    { val: "lease_agreement", label: "Rental & Property Lease Agreement" },
    { val: "property_deed", label: "Property Title Deed & Land Ownership" },
    { val: "power_of_attorney", label: "Legal Power of Attorney / Affidavit" },
  ],
  medical_insurance: [
    { val: "medical_report", label: "Medical Audit Report / Health Record" },
    { val: "insurance_claim", label: "Insurance Claim Document & Receipts" },
  ],
};

export const DOMAIN_LABELS: Record<DomainKey, string> = {
  hr_employment: "HR & Resumes",
  identity_kyc: "Identity & Passports",
  billing_finance: "Bills & Invoices",
  education_academics: "Education & Degrees",
  legal_contracts: "Legal Contracts",
  medical_insurance: "Medical & Health",
};

export interface DocumentItem {
  id: string;
  domain: DomainKey;
  domainDisplay: string;
  docType: string;
  docTypeDisplay: string;
  fileName: string;
  fileExt: string;
  fileSizeBytes?: number;
  uploadDate: string;
  status: DocumentStatus;
  notes?: string;
  customerName: string;
  report?: ForensicReport;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  docId: string;
  action: "submitted" | "status_change" | "verified" | "rejected" | "resubmit";
  user: string;
  note: string;
}

export interface ToastMessage {
  id: string;
  type: "success" | "danger" | "warning" | "info";
  message: string;
}
