-- Permitir inserción de leads tanto para usuarios anónimos como autenticados
-- Manteniendo la misma restricción abierta existente (WITH CHECK true)
DROP POLICY IF EXISTS anon_insert_leads ON public.leads;

CREATE POLICY "public_submit_leads"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);