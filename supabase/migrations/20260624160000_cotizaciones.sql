-- ════════════════════════════════════════════════════════════════════════════
-- Cotizaciones de pólizas — tabla de montos por genero + edad + monto (aporte
-- mensual). Editable desde el admin. RLS: admin escribe, staff/asesor lee.
-- ════════════════════════════════════════════════════════════════════════════
BEGIN;
CREATE TABLE IF NOT EXISTS public.cotizaciones (
  genero                  TEXT NOT NULL CHECK (genero IN ('MASCULINO','FEMENINO')),
  edad                    INTEGER NOT NULL,
  monto                   INTEGER NOT NULL,
  acum_10                 NUMERIC,
  acum_20                 NUMERIC,
  critica                 NUMERIC,
  cronica                 NUMERIC,
  terminal                NUMERIC,
  alzheimer               NUMERIC,
  beneficio_fallecimiento NUMERIC,
  db_65                   NUMERIC,
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (genero, edad, monto)
);
ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cotizaciones FROM anon, authenticated, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cotizaciones TO authenticated;
DROP POLICY IF EXISTS cotiz_select ON public.cotizaciones;
DROP POLICY IF EXISTS cotiz_admin ON public.cotizaciones;
CREATE POLICY cotiz_select ON public.cotizaciones FOR SELECT TO authenticated USING (public.is_sistema_user());
CREATE POLICY cotiz_admin  ON public.cotizaciones FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP TRIGGER IF EXISTS trg_cotiz_updated ON public.cotizaciones;
CREATE TRIGGER trg_cotiz_updated BEFORE UPDATE ON public.cotizaciones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
COMMIT;
