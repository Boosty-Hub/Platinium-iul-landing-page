-- Endurecer políticas de leads para evitar exposición de PII y eliminar reglas demasiado permisivas
DROP POLICY IF EXISTS auth_select_leads ON public.leads;
DROP POLICY IF EXISTS auth_update_leads ON public.leads;
DROP POLICY IF EXISTS public_submit_leads ON public.leads;
DROP POLICY IF EXISTS anon_insert_leads ON public.leads;

CREATE POLICY "public_submit_leads"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  nombre IS NOT NULL
  AND char_length(btrim(nombre)) BETWEEN 2 AND 200
  AND telefono IS NOT NULL
  AND char_length(btrim(telefono)) BETWEEN 7 AND 40
  AND email IS NOT NULL
  AND char_length(btrim(email)) BETWEEN 5 AND 254
  AND email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'
  AND (interes IS NULL OR char_length(interes) <= 200)
  AND (referrer IS NULL OR char_length(referrer) <= 1000)
  AND (user_agent IS NULL OR char_length(user_agent) <= 500)
  AND (anio_nacimiento IS NULL OR anio_nacimiento BETWEEN 1900 AND 2100)
  AND (ahorro_semanal IS NULL OR char_length(ahorro_semanal) <= 50)
  AND (notas IS NULL OR char_length(notas) <= 2000)
  AND (fuente IS NULL OR fuente = 'landing-iul')
  AND (utm_source IS NULL OR char_length(utm_source) <= 200)
  AND (utm_medium IS NULL OR char_length(utm_medium) <= 200)
  AND (utm_campaign IS NULL OR char_length(utm_campaign) <= 200)
  AND (utm_content IS NULL OR char_length(utm_content) <= 200)
  AND (utm_term IS NULL OR char_length(utm_term) <= 200)
);