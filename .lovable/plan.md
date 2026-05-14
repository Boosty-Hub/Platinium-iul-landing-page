# Panel de Leads — Mostrar origen (UTMs) y rediseñar tabla

## Objetivo
1. Que cada lead muestre **de dónde viene** (campaña, fuente, medio, contenido) de forma clara y resumida.
2. Reorganizar la tabla para que **no se vea saturada** y funcione bien en **móvil/tablet/desktop**, sin perder información.

---

## 1. Traer los datos de atribución desde la base

Hoy `FormPanel.tsx` solo selecciona:
`id, created_at, nombre, telefono, email, city, region, ip_address, interes`

Voy a ampliar el SELECT para incluir:
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`
- `gclid`, `fbclid`
- `referrer`, `fuente`
- `ahorro_semanal`, `anio_nacimiento`, `genero` (útiles para el agente al llamar)

La RLS ya permite SELECT público al panel, así que no hace falta migración.

---

## 2. Lógica de "Origen" (resumen humano)

Crear un helper `getLeadOrigin(lead)` que devuelva un objeto:
```
{
  channel: "Facebook Ads" | "Google Ads" | "Instagram" | "TikTok" | "Orgánico" | "Directo" | "Referido",
  campaign: string | null,    // utm_campaign legible
  detail: string | null,      // utm_content / utm_term / referrer corto
  badgeColor: string,         // color por canal
  icon: emoji o ícono
}
```

Reglas:
- `fbclid` o `utm_source=facebook|fb|meta|ig|instagram` → **Facebook/Instagram Ads**
- `gclid` o `utm_source=google|adwords` con `utm_medium=cpc|paid` → **Google Ads**
- `utm_source=tiktok` → **TikTok Ads**
- `utm_medium=organic` o `utm_source=google` sin gclid → **Búsqueda orgánica**
- `referrer` con dominio (no propio) → **Referido (dominio)**
- Sin nada → **Directo**

Cada canal tiene color y emoji distinto para escaneo visual rápido.

---

## 3. Rediseño de la tabla (desktop)

Estructura nueva con 2 líneas por fila para densidad sin saturación:

```text
┌──────────┬─────────────────────────┬──────────────────────┬─────────────────────────┐
│ Hora     │ Contacto                │ Ubicación / IP       │ Origen                  │
├──────────┼─────────────────────────┼──────────────────────┼─────────────────────────┤
│ 14:32:05 │ Juan Pérez              │ Miami, FL            │ [FB Ads] iul-mayo-25    │
│ 12/05    │ +1 414 202 1709         │ 190.12.x.x           │ creative-A · interes-fam│
│          │ juan@gmail.com          │                      │                         │
└──────────┴─────────────────────────┴──────────────────────┴─────────────────────────┘
```

Columnas finales (4 en lugar de 7):
1. **Hora** — hh:mm:ss + dd/mm
2. **Contacto** — Nombre (bold), tel (link), email (link, text-xs)
3. **Ubicación** — Ciudad, Estado + IP debajo (text-xs muted)
4. **Origen** — Badge de canal (color) + campaña + detalle (utm_content/term) debajo

El campo "Interés" + edad/género/ahorro pasa a una fila expandible (click en la fila → fila secundaria con esos detalles + UTMs crudos para debug).

---

## 4. Responsive

**Desktop (≥1024px):** tabla con 4 columnas como arriba.

**Tablet (768–1023px):** se ocultan las columnas IP y "detalle" del origen (se queda solo el badge + campaña).

**Móvil (<768px):** la tabla se convierte en **lista de tarjetas**:
```
┌─────────────────────────────────┐
│ Juan Pérez          14:32 · 12/05│
│ +1 414 202 1709                 │
│ juan@gmail.com                  │
│ ─────────────────────────────── │
│ 📍 Miami, FL  ·  190.12.x.x     │
│ 🎯 [FB Ads] iul-mayo-25         │
│ 💬 Proteger a mi familia        │
│ [▾ Ver más]                     │
└─────────────────────────────────┘
```
Tap "Ver más" abre detalles (UTMs, gclid, fbclid, ahorro, edad, género, user agent).

---

## 5. Cambios técnicos concretos

**Archivos a editar:**
- `src/pages/FormPanel.tsx` — ampliar `SELECT_COLS`, ampliar interface `Lead`, integrar nuevo componente de tabla.

**Archivos a crear:**
- `src/lib/leadOrigin.ts` — helper `getLeadOrigin()` con la lógica del canal.
- `src/components/panel/LeadRow.tsx` — fila de tabla (desktop/tablet) con expansión.
- `src/components/panel/LeadCard.tsx` — tarjeta para móvil.
- `src/components/panel/OriginBadge.tsx` — badge de canal con color.

**Sin migración de DB**, sin tocar el formulario de captura ni el edge function.

---

## Resultado esperado
- En desktop: tabla limpia de 4 columnas, escaneable de un vistazo, con el origen del lead visible y coloreado.
- En móvil: tarjetas apiladas, sin scroll horizontal.
- Click/tap en una fila/tarjeta muestra todos los detalles crudos (UTMs, gclid, etc.) por si el agente los necesita.
