ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS region text;

ALTER TABLE public.leads REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;

DROP POLICY IF EXISTS "public_read_leads_panel" ON public.leads;
CREATE POLICY "public_read_leads_panel" ON public.leads
  FOR SELECT TO anon, authenticated USING (true);