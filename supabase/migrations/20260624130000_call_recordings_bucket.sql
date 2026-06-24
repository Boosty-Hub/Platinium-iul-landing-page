-- ════════════════════════════════════════════════════════════════════════════
-- Slice 3: private Storage bucket for call recordings.
-- Bucket is private (public=false); access only via get-recording signed URLs.
-- Anon / PUBLIC are denied via Storage RLS (no SELECT policy for anon).
-- recording_fetch_attempts counter column for process-recording retry tracking.
-- ════════════════════════════════════════════════════════════════════════════

-- 1. Create the private bucket (idempotent)
INSERT INTO storage.buckets (id, name, public)
VALUES ('call-recordings', 'call-recordings', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Add retry counter to call_attempts (forward-compat, nullable, idempotent)
ALTER TABLE public.call_attempts
  ADD COLUMN IF NOT EXISTS recording_fetch_attempts INTEGER DEFAULT 0;

-- 3. Storage RLS — deny anon; allow service_role (edge functions use service client)
--    By default Storage RLS on objects is controlled by storage.objects policies.
--    We add a restrictive policy: only authenticated + service_role can access objects
--    in the call-recordings bucket.  The get-recording edge function uses the service
--    client to call createSignedUrl, which bypasses RLS.  Direct anon access is blocked.

-- Revoke any accidental public grants (defensive; bucket public=false already blocks)
-- Storage objects table policies for call-recordings:
DROP POLICY IF EXISTS "call_recordings_anon_deny"    ON storage.objects;
DROP POLICY IF EXISTS "call_recordings_service_read" ON storage.objects;
DROP POLICY IF EXISTS "call_recordings_service_write" ON storage.objects;

-- Only service_role (used by edge fns) can read/write objects in this bucket.
-- Signed URL generation is server-side; the anon key never touches this bucket directly.
CREATE POLICY "call_recordings_service_write"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'call-recordings');

CREATE POLICY "call_recordings_service_read"
  ON storage.objects FOR SELECT
  TO service_role
  USING (bucket_id = 'call-recordings');

CREATE POLICY "call_recordings_service_update"
  ON storage.objects FOR UPDATE
  TO service_role
  USING (bucket_id = 'call-recordings');
