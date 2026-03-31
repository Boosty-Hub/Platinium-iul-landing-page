

# Plan: 7 Cambios al Formulario/Hero + Restricción Geográfica

## Cambio 1: Botones de selección — fondo azul oscuro, texto blanco, glow blanco

**Archivo:** `src/components/shared/LeadForm.tsx` (líneas 194-206, 259-271)

- Botones de selección (interés y ahorro): `bg-[#0B1A1E] text-white border-white/10`
- Hover: `hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]`
- Seleccionado: `border-white/50 shadow-[0_0_20px_rgba(255,255,255,0.35)]`
- Los montos de ahorro (`$25`, etc.) pasan de `text-[#1d9fa9]` a `text-white`

## Cambio 2: Título y subtítulo del formulario

**Archivo:** `src/components/shared/LeadForm.tsx` (líneas 164-168)

- Título: `¡Cotiza tu IUL Gratis ahora!`
- Subtítulo: `Completa el formulario`

## Cambio 3: Debajo del form inline — solo "¿Prefieres hablar ahora?"

**Archivo:** `src/components/shared/ContactBar.tsx`

- Añadir prop `compact?: boolean`
- Si `compact=true`: solo mostrar "¿Prefieres hablar ahora?" + botones Llamar/WhatsApp (sin icono grande, sin horarios)

**Archivo:** `src/pages/Index.tsx` (línea 125)

- Cambiar `<ContactBar t={t} />` a `<ContactBar t={t} compact />`

## Cambio 4: Banda de logos con scroll infinito

**Archivo:** `src/index.css` — añadir keyframe `marquee`

**Archivo:** `src/pages/Index.tsx` — nueva sección después del ContactBar compacto con logos placeholder repetidos en loop infinito

## Cambio 5: Oficinas y horarios debajo de la banda de logos

**Archivo:** `src/pages/Index.tsx` — nueva sección con las 3 oficinas (Miami, Orlando, Houston) y horarios, misma data que el Footer

## Cambio 6: Eliminar textos redundantes en cada paso del form

**Archivo:** `src/components/shared/LeadForm.tsx`

- Eliminar subtítulo de paso 1 ("Selecciona una opción" — línea 186)
- Eliminar subtítulo de paso 2 ("Esto nos ayuda a calcular..." — línea 224)
- Eliminar subtítulo de paso 3 ("Selecciona el monto..." — línea 256)
- Eliminar subtítulo de paso 4 (líneas 296-298)
- Eliminar subtítulo de paso 5 ("Para enviarte tu proyección..." — línea 316)
- Dejar solo las preguntas principales

## Cambio 7: Pantalla de éxito post-submit

**Archivo:** `src/components/shared/LeadForm.tsx` (líneas 414-428)

Reemplazar por:
- "¡Gracias por completar el formulario!"
- "Estamos generando su cotización en PDF, atienda nuestra llamada para confirmar los datos telefónicamente."
- "O si desea recibir aún más rápido su presupuesto:"
- Botón "Llamar Ahora" → `tel:+16893082809`

## Restricción geográfica (US only)

**Archivo:** nuevo componente `src/components/shared/GeoGate.tsx`

- Al montar la app, hacer fetch a un servicio gratuito de geolocalización IP (ej: `https://ipapi.co/json/`)
- Si `country_code !== "US"`, mostrar un overlay/modal con mensaje: "Nuestros servicios están disponibles exclusivamente para residentes de Estados Unidos. Si resides en EE.UU. y estás usando VPN, por favor desactívala."
- Botón para cerrar y continuar de todos modos (no bloqueo duro)

**Archivo:** `src/App.tsx` — envolver rutas con `<GeoGate>`

---

## Archivos a modificar/crear
1. `src/components/shared/LeadForm.tsx` — Cambios 1, 2, 6, 7
2. `src/components/shared/ContactBar.tsx` — Cambio 3
3. `src/pages/Index.tsx` — Cambios 3, 4, 5
4. `src/index.css` — Cambio 4 (keyframe marquee)
5. `src/components/shared/GeoGate.tsx` — Nuevo (restricción geográfica)
6. `src/App.tsx` — Integrar GeoGate

