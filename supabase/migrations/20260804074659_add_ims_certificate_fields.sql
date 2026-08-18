ALTER TABLE certificates
  ADD COLUMN IF NOT EXISTS id_number text,
  ADD COLUMN IF NOT EXISTS saqa_id text,
  ADD COLUMN IF NOT EXISTS nqf_level text,
  ADD COLUMN IF NOT EXISTS credits text,
  ADD COLUMN IF NOT EXISTS assessor_no text;
