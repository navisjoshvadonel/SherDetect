-- ============================================================
-- SherDetect Supabase Schema Migration
-- Project: ieeruyttmratjqrmyixz
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ─── 1. AUDIT REPORTS TABLE ──────────────────────────────────────────────────
-- Stores every forensic verification result from the backend API
CREATE TABLE IF NOT EXISTS public.audit_reports (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id          TEXT NOT NULL,
  file_name            TEXT NOT NULL,
  is_authentic         BOOLEAN NOT NULL,
  verdict              TEXT NOT NULL CHECK (verdict IN ('VERIFIED_AUTHENTIC', 'SUSPICIOUS', 'FORGERY_DETECTED')),
  fraud_risk_score     FLOAT NOT NULL CHECK (fraud_risk_score >= 0 AND fraud_risk_score <= 100),
  ela_score            FLOAT NOT NULL DEFAULT 0,
  metadata_tampered    BOOLEAN NOT NULL DEFAULT FALSE,
  software_detected    TEXT,
  semantic_discrepancy BOOLEAN NOT NULL DEFAULT FALSE,
  forensic_summary     TEXT NOT NULL,
  processing_time_ms   INTEGER NOT NULL DEFAULT 0,
  anomaly_count        INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 2. DOCUMENT SUBMISSIONS TABLE ───────────────────────────────────────────
-- Tracks submitted documents and their workflow statuses
CREATE TABLE IF NOT EXISTS public.document_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name   TEXT NOT NULL DEFAULT 'Anonymous',
  domain          TEXT NOT NULL,
  doc_type        TEXT NOT NULL,
  file_name       TEXT NOT NULL,
  file_ext        TEXT NOT NULL DEFAULT 'bin',
  file_size_bytes INTEGER,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'under_review', 'verified', 'rejected', 'resubmit')),
  notes           TEXT,
  report_id       UUID REFERENCES public.audit_reports(id) ON DELETE SET NULL,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at     TIMESTAMPTZ
);

-- ─── 3. VERIFIER AUDIT TRAIL TABLE ───────────────────────────────────────────
-- Immutable log of every action taken by submitters and verifiers
CREATE TABLE IF NOT EXISTS public.audit_trail (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id      TEXT NOT NULL,
  action      TEXT NOT NULL CHECK (action IN ('submitted', 'under_review', 'verified', 'rejected', 'resubmit', 'inspected')),
  actor       TEXT NOT NULL DEFAULT 'System',
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 4. INDEXES FOR PERFORMANCE ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_audit_reports_verdict     ON public.audit_reports(verdict);
CREATE INDEX IF NOT EXISTS idx_audit_reports_created_at  ON public.audit_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_reports_authentic   ON public.audit_reports(is_authentic);
CREATE INDEX IF NOT EXISTS idx_submissions_status        ON public.document_submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_domain        ON public.document_submissions(domain);
CREATE INDEX IF NOT EXISTS idx_trail_doc_id              ON public.audit_trail(doc_id);
CREATE INDEX IF NOT EXISTS idx_trail_created_at          ON public.audit_trail(created_at DESC);

-- ─── 5. ROW LEVEL SECURITY (RLS) ──────────────────────────────────────────────
-- Enable RLS (required for Supabase exposed schemas)
ALTER TABLE public.audit_reports         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_submissions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_trail           ENABLE ROW LEVEL SECURITY;

-- Allow anon & authenticated roles to read audit reports (public forensic results)
CREATE POLICY "Allow public read on audit_reports"
  ON public.audit_reports FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow backend service to insert audit reports (via service_role key in backend)
CREATE POLICY "Allow insert on audit_reports"
  ON public.audit_reports FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow public read on submissions
CREATE POLICY "Allow public read on document_submissions"
  ON public.document_submissions FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow insert on submissions
CREATE POLICY "Allow insert on document_submissions"
  ON public.document_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow update status on submissions
CREATE POLICY "Allow update on document_submissions"
  ON public.document_submissions FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Allow public read on audit trail
CREATE POLICY "Allow public read on audit_trail"
  ON public.audit_trail FOR SELECT
  TO anon, authenticated
  USING (true);

-- Allow insert on audit trail
CREATE POLICY "Allow insert on audit_trail"
  ON public.audit_trail FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ─── 6. SEED DEMO DATA ────────────────────────────────────────────────────────
-- Insert sample audit records so the dashboard has data on first load
INSERT INTO public.audit_reports (
  document_id, file_name, is_authentic, verdict, fraud_risk_score,
  ela_score, metadata_tampered, software_detected, semantic_discrepancy,
  forensic_summary, processing_time_ms, anomaly_count
) VALUES
(
  'DOC-DEMO01', 'Alex_Taylor_Resume_2026.pdf', TRUE,
  'VERIFIED_AUTHENTIC', 3.8,
  6.5, FALSE, NULL, FALSE,
  'Document passed all compression, cryptographic checksum, and semantic parity checks.',
  119, 0
),
(
  'DOC-DEMO02', 'Forged_Electricity_Bill_July.pdf', FALSE,
  'FORGERY_DETECTED', 88.5,
  88.2, TRUE, 'Adobe Photoshop CC 2023', TRUE,
  'Critical tampering detected. ELA indicates re-compression artifacts on line-item values. EXIF metadata contains Adobe Photoshop export signature.',
  85, 1
),
(
  'DOC-DEMO03', 'Passport_Scan_Taylor.jpg', TRUE,
  'VERIFIED_AUTHENTIC', 4.1,
  5.2, FALSE, NULL, FALSE,
  'Document passed all compression, cryptographic checksum, and semantic parity checks.',
  98, 0
);

INSERT INTO public.audit_trail (doc_id, action, actor, note)
VALUES
('DOC-DEMO01', 'submitted', 'Alex Taylor', 'Uploaded resume PDF for HR verification audit.'),
('DOC-DEMO02', 'submitted', 'Alex Taylor', 'Uploaded electricity bill statement for verification audit.'),
('DOC-DEMO03', 'verified',  'Verifier Sarah Jenkins', 'Passport scan verified intact without ELA tampering.'),
('DOC-DEMO02', 'rejected',  'Verifier Officer', 'FORGERY_DETECTED: Total amount manipulated using image editing software.');

-- ─── DONE ─────────────────────────────────────────────────────────────────────
-- Verify tables were created:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
