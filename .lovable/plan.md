

## Nueva sección de video debajo de "Descubre más"

### Resumen

Agregar una sección con el video subido por el usuario entre el bloque "Descubre más" (línea ~214) y la sección "STATS BAR" (línea ~216) en `Index.tsx`. La sección incluirá el video con un título contextual, descripción breve y un CTA que scrollea al formulario.

### Cambios

**1. Copiar el video al proyecto**
- Copiar `user-uploads://document_5103092790338783902_1.mp4` a `public/videos/ahorro-planificacion.mp4`

**2. Modificar `src/pages/Index.tsx`**

Insertar una nueva sección después de la línea 214 (cierre de la sección hero/descubre más) y antes de la sección STATS BAR:

- Fondo alternado (`t.bg2`) para separar visualmente del hero
- Título: "Ahorra para ti y tu familia, no para el gobierno"
- Subtítulo breve sobre planificación financiera con estructura correcta
- Video con `<video>` nativo (controls, poster frame auto, rounded corners, max-width)
- Botón CTA naranja (mismo gradiente `from-[#F97316] to-[#EA580C]`) con anchor link `#lead-form` que scrollea al formulario
- Todo envuelto en `<Anim>` para consistencia visual

### Estilo visual
- Consistente con el design system existente (Playfair Display para títulos, DM Sans para cuerpo, gradiente naranja para CTA)
- Video centrado con `max-w-3xl`, bordes redondeados y sombra sutil
- Responsive: video ocupa 100% en mobile

