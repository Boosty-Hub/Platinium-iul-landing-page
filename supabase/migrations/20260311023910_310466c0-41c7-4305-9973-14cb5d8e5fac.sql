CREATE TABLE public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  nombre TEXT NOT NULL,
  telefono TEXT NOT NULL,
  email TEXT NOT NULL,
  interes TEXT DEFAULT '',
  fuente TEXT DEFAULT 'landing-iul',
  referrer TEXT DEFAULT '',
  kommo_synced BOOLEAN DEFAULT false,
  kommo_lead_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  notas TEXT DEFAULT ''
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_insert_leads"
  ON public.leads FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "auth_select_leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "auth_update_leads"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (true);

CREATE INDEX idx_leads_created ON public.leads (created_at DESC);
CREATE INDEX idx_leads_email ON public.leads (email);
CREATE INDEX idx_leads_kommo ON public.leads (kommo_synced);