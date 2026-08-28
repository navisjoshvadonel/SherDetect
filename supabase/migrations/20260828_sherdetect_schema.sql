-- ==============================================================================
-- SherDetect Production Database Schema & Security Migration
-- Migration ID: 20260828_sherdetect_schema
-- Description: Creates forensic audit tables with Row-Level Security (RLS) policies
-- ==============================================================================

-- 1. Create Document Submissions Tracking Table
CREATE TABLE IF NOT EXISTS public.document_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_id VARCHAR(64) NOT NULL UNIQUE,
    file_name VARCHAR(255) NOT NULL,
    file_ext VARCHAR(16) NOT NULL,
    domain VARCHAR(64) NOT NULL DEFAULT 'all',
    doc_type VARCHAR(64) NOT NULL DEFAULT 'general',
    customer_name VARCHAR(128) NOT NULL DEFAULT 'Anonymous Submitter',
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create Audit Reports Table (Forensic Inspection Results)
CREATE TABLE IF NOT EXISTS public.audit_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_id VARCHAR(64) NOT NULL REFERENCES public.document_submissions(doc_id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    is_authentic BOOLEAN NOT NULL DEFAULT FALSE,
    verdict VARCHAR(64) NOT NULL DEFAULT 'UNVERIFIED',
    ela_score NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    fraud_risk_score NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    metadata_tampered BOOLEAN NOT NULL DEFAULT FALSE,
    software_fingerprint VARCHAR(255),
    semantic_discrepancy BOOLEAN NOT NULL DEFAULT FALSE,
    forensic_summary TEXT,
    processing_time_ms INTEGER NOT NULL DEFAULT 0,
    detected_anomalies_count INTEGER NOT NULL DEFAULT 0,
    tamper_heatmap_base64 TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Audit Trail Log Table (Immutable Event History)
CREATE TABLE IF NOT EXISTS public.audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_id VARCHAR(64) NOT NULL,
    action VARCHAR(64) NOT NULL,
    actor VARCHAR(128) NOT NULL DEFAULT 'System',
    note TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── INDEXES FOR HIGH-THROUGHPUT FORENSIC LOOKUPS ────────────────────────────
CREATE INDEX IF NOT EXISTS idx_submissions_doc_id ON public.document_submissions(doc_id);
CREATE INDEX IF NOT EXISTS idx_submissions_domain ON public.document_submissions(domain);
CREATE INDEX IF NOT EXISTS idx_audit_reports_doc_id ON public.audit_reports(doc_id);
CREATE INDEX IF NOT EXISTS idx_audit_reports_verdict ON public.audit_reports(verdict);
CREATE INDEX IF NOT EXISTS idx_audit_trail_doc_id ON public.audit_trail(doc_id);

-- ==============================================================================
-- ROW-LEVEL SECURITY (RLS) ENABLEMENT & POLICIES
-- ==============================================================================

-- Enable Row-Level Security on all public forensic tables
ALTER TABLE public.document_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_trail ENABLE ROW LEVEL SECURITY;

-- ─── 1. document_submissions Policies ────────────────────────────────────────

-- Allow anon & authenticated users to view document submissions
CREATE POLICY "Allow public select on document_submissions"
ON public.document_submissions
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow anon & authenticated users to insert new document submissions
CREATE POLICY "Allow public insert on document_submissions"
ON public.document_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow authenticated users / service role to update document submission status
CREATE POLICY "Allow authenticated update on document_submissions"
ON public.document_submissions
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- ─── 2. audit_reports Policies ───────────────────────────────────────────────

-- Allow public select access to forensic audit reports
CREATE POLICY "Allow public select on audit_reports"
ON public.audit_reports
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow backend service API to write forensic reports
CREATE POLICY "Allow service insert on audit_reports"
ON public.audit_reports
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- ─── 3. audit_trail Policies ──────────────────────────────────────────────────

-- Allow public select on audit event trail
CREATE POLICY "Allow public select on audit_trail"
ON public.audit_trail
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow backend service API to append event logs
CREATE POLICY "Allow service insert on audit_trail"
ON public.audit_trail
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- ==============================================================================
-- INITIAL DEMO SEED DATA
-- ==============================================================================

INSERT INTO public.document_submissions (doc_id, file_name, file_ext, domain, doc_type, customer_name, status, notes)
VALUES
('DOC-DEMO01', 'Resume_Alex_Taylor.pdf', 'pdf', 'hr_employment', 'cv', 'Alex Taylor', 'pending', 'Uploaded resume PDF for HR verification audit.'),
('DOC-DEMO02', 'Utility_Bill_July2026.png', 'png', 'billing_finance', 'utility_bill', 'Alex Taylor', 'rejected', 'Uploaded electricity bill statement for verification audit.'),
('DOC-DEMO03', 'Passport_Scan_Taylor.jpg', 'jpg', 'identity_kyc', 'passport', 'Alex Taylor', 'verified', 'Uploaded passport scan for identity verification audit.')
ON CONFLICT (doc_id) DO NOTHING;

INSERT INTO public.audit_reports (
  doc_id, file_name, is_authentic, verdict, ela_score, fraud_risk_score,
  metadata_tampered, software_fingerprint, semantic_discrepancy, forensic_summary,
  processing_time_ms, detected_anomalies_count
) VALUES
(
  'DOC-DEMO01', 'Resume_Alex_Taylor.pdf', TRUE,
  'VERIFIED_AUTHENTIC', 5.2, 8.4, FALSE, NULL, FALSE,
  'Document passed all forensic audits. Compression levels are uniform across all layers, metadata headers are intact, and mathematical parity is verified.',
  112, 0
),
(
  'DOC-DEMO02', 'Utility_Bill_July2026.png', FALSE,
  'FORGERY_DETECTED', 88.2, 94.5, TRUE, 'Adobe Photoshop CC 2023 (Macintosh)', TRUE,
  'Critical tampering detected. Error Level Analysis indicates re-compression artifacts on line-item values. Metadata reveals Adobe Photoshop export signatures with mismatched creation dates.',
  145, 2
),
(
  'DOC-DEMO03', 'Passport_Scan_Taylor.jpg', TRUE,
  'VERIFIED_AUTHENTIC', 4.1, 5.2, FALSE, NULL, FALSE,
  'Document passed all compression, cryptographic checksum, and semantic parity checks.',
  98, 0
)
ON CONFLICT DO NOTHING;

INSERT INTO public.audit_trail (doc_id, action, actor, note)
VALUES
('DOC-DEMO01', 'submitted', 'Alex Taylor', 'Uploaded resume PDF for HR verification audit.'),
('DOC-DEMO02', 'submitted', 'Alex Taylor', 'Uploaded electricity bill statement for verification audit.'),
('DOC-DEMO03', 'verified',  'Verifier Sarah Jenkins', 'Passport scan verified intact without ELA tampering.'),
('DOC-DEMO02', 'rejected',  'Verifier Officer', 'FORGERY_DETECTED: Total amount manipulated using image editing software.');
