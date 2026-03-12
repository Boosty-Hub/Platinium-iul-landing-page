
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS anio_nacimiento integer,
ADD COLUMN IF NOT EXISTS ahorro_semanal text;
