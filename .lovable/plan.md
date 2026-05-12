## Problema

Los UTMs (`utm_source`, `utm_medium`, `utm_campaign`, etc.), `gclid` y `fbclid` solo se leen desde `window.location.search` **en el momento exacto del submit**, dentro de `getUTMParams()` en `src/components/shared/LeadForm.tsx` (línea 52).

Esto significa que si el usuario:
- Llega con `?utm_source=facebook&fbclid=...` y **navega a otra página** antes de enviar el form → los UTMs se pierden.
- Hace scroll, espera, recarga, o el SPA cambia la URL → se pierden.
- Llega a `/cotiza` desde un anuncio pero el form lo envía después de moverse → se pierden.

Por eso llegan en `null` al webhook de n8n aunque el anuncio sí los traía.

## Solución

Capturar UTMs + `gclid` + `fbclid` **una sola vez al cargar la app** y persistirlos en `sessionStorage` (con fallback a `localStorage` con TTL de 90 días para atribución cross-session típica de Meta/Google Ads). Al enviar el lead, leer desde el storage en vez de la URL actual.

### Cambios

**1. Nuevo archivo `src/lib/attribution.ts`**
- `captureAttribution()`: lee UTMs, `gclid`, `fbclid` y `referrer` de la URL/documento actual. Si hay alguno nuevo, lo guarda en `localStorage` con timestamp. Solo sobrescribe si llegan parámetros nuevos (no pisa una atribución previa con vacío).
- `getStoredAttribution()`: devuelve los UTMs guardados si tienen menos de 90 días, sino `{}`.
- TTL: 90 días (estándar de atribución de Meta/Google).

**2. `src/main.tsx`** (o `src/App.tsx`)
- Llamar a `captureAttribution()` al arrancar la app, **antes** del primer render, así se captura aunque el usuario navegue por el SPA.

**3. `src/components/shared/LeadForm.tsx`**
- Reemplazar `getUTMParams()` por `getStoredAttribution()` desde `@/lib/attribution`.
- Mantener fallback: si no hay nada en storage, leer de la URL actual igual que antes.

**4. (Opcional) `supabase/functions/submit-lead/index.ts`**
- Ya acepta `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `gclid`. **Agregar también `fbclid`** (Meta Ads) para que se guarde en DB y se reenvíe al webhook de n8n. Hoy se está perdiendo aunque el frontend lo mande.
- Esto requiere agregar la columna `fbclid` a la tabla `leads` (migración corta).

### Archivos
- **Crear**: `src/lib/attribution.ts`
- **Modificar**: `src/main.tsx`, `src/components/shared/LeadForm.tsx`, `supabase/functions/submit-lead/index.ts`
- **Migración DB**: agregar columna `fbclid TEXT` a `public.leads`

### Resultado
- Un usuario que llega desde `https://platiniuminsuranceusa.com/cotiza?utm_source=facebook&utm_campaign=iul-mayo&fbclid=xyz` y completa el form 5 minutos después (incluso si navegó a otras páginas) llegará al webhook de n8n con todos los UTMs poblados.
- Atribución correcta en Kommo por campaña.