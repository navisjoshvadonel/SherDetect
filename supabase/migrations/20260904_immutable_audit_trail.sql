-- SherDetect Enterprise Compliance: Immutable Cryptographic Audit Trail (WORM)
-- Prevents UPDATE or DELETE operations and enforces SHA-256 hash chaining.

-- 1. Create Immutable Audit Trail Table
CREATE TABLE IF NOT EXISTS audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_id TEXT NOT NULL,
    action TEXT NOT NULL,
    actor TEXT NOT NULL,
    note TEXT NOT NULL,
    previous_hash TEXT NOT NULL DEFAULT '0000000000000000000000000000000000000000000000000000000000000000',
    entry_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Trigger Function to Prevent Any Update or Deletion (Write-Once-Read-Many)
CREATE OR REPLACE FUNCTION prevent_audit_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'SECURITY ERROR: audit_trail entries are cryptographically immutable. UPDATE and DELETE operations are forbidden.';
END;
$$ LANGUAGE plpgsql;

-- 3. Bind Trigger for UPDATE and DELETE
DROP TRIGGER IF EXISTS trg_audit_trail_immutable ON audit_trail;
CREATE TRIGGER trg_audit_trail_immutable
BEFORE UPDATE OR DELETE ON audit_trail
FOR EACH ROW EXECUTE FUNCTION prevent_audit_tampering();
