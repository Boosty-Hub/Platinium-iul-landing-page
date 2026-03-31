-- Ensure RLS is enabled on leads table
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- No SELECT/UPDATE/DELETE policies for anon = deny by default
-- No INSERT policy for anon either (edge function uses service role key to bypass RLS)

-- Allow authenticated users to read leads (for future admin dashboard)
CREATE POLICY "authenticated_can_select_leads" ON public.leads
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to update leads (for admin management)
CREATE POLICY "authenticated_can_update_leads" ON public.leads
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Allow authenticated users to delete leads (for admin management)  
CREATE POLICY "authenticated_can_delete_leads" ON public.leads
  FOR DELETE TO authenticated USING (true);