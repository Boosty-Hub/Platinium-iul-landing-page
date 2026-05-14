export interface Lead {
  id: string;
  created_at: string;
  nombre: string;
  telefono: string;
  email: string;
  city?: string | null;
  region?: string | null;
  ip_address?: string | null;
  interes?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  referrer?: string | null;
  fuente?: string | null;
  ahorro_semanal?: string | null;
  anio_nacimiento?: number | null;
  genero?: string | null;
  user_agent?: string | null;
}

export const LEAD_SELECT_COLS =
  "id, created_at, nombre, telefono, email, city, region, ip_address, interes, utm_source, utm_medium, utm_campaign, utm_content, utm_term, gclid, fbclid, referrer, fuente, ahorro_semanal, anio_nacimiento, genero, user_agent";
