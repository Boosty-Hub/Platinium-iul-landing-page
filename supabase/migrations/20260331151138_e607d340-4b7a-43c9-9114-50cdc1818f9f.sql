-- Drop overly permissive RLS policies
DROP POLICY IF EXISTS "authenticated_can_select_leads" ON public.leads;
DROP POLICY IF EXISTS "authenticated_can_update_leads" ON public.leads;
DROP POLICY IF EXISTS "authenticated_can_delete_leads" ON public.leads;

-- RLS remains enabled with no policies = deny all client-side access
-- Inserts are handled by the submit-lead edge function using the service_role key (bypasses RLS)