/*
# Create certificates table for certificate authentication system

1. Purpose
   Stores records of certificates issued for health and safety courses.
   Each certificate has a unique ID that is encoded in a QR code.
   When the QR code is scanned, it opens a public verification page
   that confirms the certificate is authentic and shows its details.

2. New Tables
   - `certificates`
     - `id` (uuid, primary key) — unique certificate identifier, encoded in QR codes
     - `student_name` (text, not null) — full name of the student who completed the course
     - `course_name` (text, not null) — name of the health and safety course
     - `course_date` (date, not null) — date the course was completed
     - `expiry_date` (date, nullable) — date the certification expires (null = never expires)
     - `issuer_name` (text, not null) — name of the issuing organization or instructor
     - `certificate_number` (text, not null, unique) — human-readable certificate number (e.g. HSC-2024-0001)
     - `status` (text, not null, default 'active') — 'active', 'revoked', or 'expired'
     - `created_at` (timestamptz, default now()) — when the record was created

3. Security
   - Enable RLS on `certificates`.
   - This is a single-tenant app (no sign-in screen) where the issuer manages all certificates.
   - Allow anon + authenticated CRUD because the issuer creates and manages certificates from the browser.
   - The verification page reads certificate data publicly (anyone scanning the QR code must be able to read it).
*/

CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_name text NOT NULL,
  course_name text NOT NULL,
  course_date date NOT NULL,
  expiry_date date,
  issuer_name text NOT NULL,
  certificate_number text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_certificates" ON certificates;
CREATE POLICY "anon_select_certificates" ON certificates FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_certificates" ON certificates;
CREATE POLICY "anon_insert_certificates" ON certificates FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_certificates" ON certificates;
CREATE POLICY "anon_update_certificates" ON certificates FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_certificates" ON certificates;
CREATE POLICY "anon_delete_certificates" ON certificates FOR DELETE
  TO anon, authenticated USING (true);
