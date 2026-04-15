

## Landing "Link in Bio" para Platinium Insurance

### Resumen
Crear una página standalone en `/links` estilo Linktree, sin navbar ni footer, con la marca Platinium Insurance adaptada al design system existente (teal + naranja). Optimizada para mobile-first pero con vista desktop contenida (max-width ~480px centrado).

### Página: `src/pages/Links.tsx`

**Estructura visual (inspirada en la referencia):**
- Fondo con gradiente oscuro (teal oscuro → negro) fullscreen
- Logo circular de la marca (`/logo.png`) centrado arriba
- Nombre: "Platinium Insurance Group"
- Subtítulo: "Seguros de Vida IUL · Asesoría en Español"
- Iconos de redes sociales (Instagram, WhatsApp, teléfono)
- 4 botones apilados con bordes redondeados y estilo semi-transparente:
  1. **💬 Chatear con un Asesor** → WhatsApp link (`https://wa.me/17866787863`)
  2. **📞 Llamar AHORA!** → `tel:+16893082809`
  3. **📊 Cotizar tu Proyección** → `/contacto` (o `#lead-form` en index)
  4. **📍 Oficinas** → `/contacto` con scroll a oficinas

**Diseño desktop:** Contenedor centrado con `max-w-md` (448px) para que los botones no se estiren. Fondo cubre toda la pantalla.

### Ruta: `src/App.tsx`
- Agregar ruta `/links` con lazy import
- No aparece en navbar ni footer (accesible solo por URL directa)

### Archivos
- **Crear**: `src/pages/Links.tsx`
- **Modificar**: `src/App.tsx` (agregar ruta)

