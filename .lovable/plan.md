## Landing dedicada para campaña Meta: `/cotiza`

### Objetivo
Crear una página independiente, ultra enfocada en conversión, sin navbar ni footer ni distracciones, para usar como destino del tráfico pagado de Meta Ads. Solo logo + formulario + prueba social mínima.

---

### Ruta
- Nueva ruta: **`/cotiza`** (corta, fácil de recordar y de poner en anuncios)
- Se mantiene el `GeoGate` (US-only) y el `CookieBanner` por compliance
- **NO** se incluye Navbar ni Footer ni links a otras páginas (evita fugas de tráfico pagado)

### Estructura de la página (mobile-first)
1. **Top bar mínima**
   - Logo de Platinum Insurance (centrado en mobile, izquierda en desktop)
   - Badge de confianza: "Licenciados en USA · Atención en Español"
   - Sin links de navegación
2. **Hero compacto** (encima del formulario en mobile, al lado en desktop)
   - Título grande: "Cotiza tu IUL Gratis con Platinum Insurance"
   - Subtítulo: beneficios en 3 bullets cortos (protección familiar, ahorro con interés, sin examen médico)
   - Iconos de confianza (5 estrellas, "+1,000 familias protegidas", "Respuesta en 24 hrs")
3. **Formulario de leads (protagonista absoluto)**
   - Reutiliza el componente actual `LeadForm` (mismo wizard de 6 pasos, misma validación, misma Edge Function `submit-lead`)
   - Captura automática de UTMs / `gclid` / `fbclid` (ya está implementado, solo se asegura `fbclid`)
4. **Mini prueba social debajo del form**
   - 1 testimonio corto con foto
   - Logos de aseguradoras partners (marquee actual reducido)
5. **Footer minimal**
   - Solo: copyright + WhatsApp + link a Política de Privacidad (requerido por Meta Ads)

### Atribución de campaña Meta
- Capturar y enviar al backend: `fbclid`, `utm_source=facebook`, `utm_medium=cta`, `utm_campaign=...`
- Ajuste menor en `getUTMParams()` (en `LeadForm.tsx`) para incluir `fbclid` en la lista de claves capturadas
- Estos datos viajan al webhook de n8n → Kommo (ya configurado), permitiendo identificar leads por campaña

### SEO / Indexación
- `noindex, nofollow` en esta página (es landing pagada, no debe aparecer en Google orgánico ni competir con SEO)
- Título y descripción optimizados para Meta Ads scraper (preview bonito al pegar el link)
- OG Image dedicada (usa la actual del sitio)

### Detalles técnicos
- **Crear**: `src/pages/Cotiza.tsx` (no usa `Layout` para evitar Navbar/Footer)
- **Modificar**: 
  - `src/App.tsx` → registrar la ruta `/cotiza` (lazy import)
  - `src/components/shared/LeadForm.tsx` → agregar `fbclid` a `getUTMParams()`
- **No** se modifica el formulario actual de las otras páginas (queda igual)
- **No** requiere migración de DB (los UTMs/fbclid se guardan en el campo existente)

### Resultado esperado
Una URL `platiniuminsuranceusa.com/cotiza` lista para pegar en los anuncios de Meta:
- 0 distracciones → mayor tasa de conversión
- Tracking automático de qué campaña/anuncio generó cada lead
- Mismo flujo de notificación en `/form-panel` (alarma sonora + sync a Kommo)

### Archivos
- **Crear**: `src/pages/Cotiza.tsx`
- **Modificar**: `src/App.tsx`, `src/components/shared/LeadForm.tsx`
