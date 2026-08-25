/*
# Lock certificates table to authenticated admins

1. Purpose
   The app now has an admin login. Previously the table allowed anon CRUD (no sign-in).
   Now only authenticated admins can create/update/delete certificates.
   The public verification page still needs read access (anyone scanning a QR code).

2. Security changes
   - SELECT: keep open to anon + authenticated (verify page must work without login)
   - INSERT/UPDATE/DELETE: restrict to authenticated only (admins must be signed in)
*/

DROP POLICY IF EXISTS "anon_select_certificates" ON certificates;
CREATE POLICY "anon_select_certificates" ON certificates FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_certificates" ON certificates;
CREATE POLICY "authenticated_insert_certificates" ON certificates FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_certificates" ON certificates;
CREATE POLICY "authenticated_update_certificates" ON certificates FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_certificates" ON certificates;
CREATE POLICY "authenticated_delete_certificates" ON certificates FOR DELETE
  TO authenticated USING (true);
