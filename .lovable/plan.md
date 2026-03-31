
Objetivo: corregir de verdad el responsive de las secciones problemáticas del home (`hero`, `LeadForm`, banner de contacto y ubicaciones), priorizando mobile y eliminando los parches inconsistentes de hoy.

Lo que encontré:
- `src/App.css` ya no es el problema; el root boilerplate ya fue removido.
- La regresión principal ahora viene de `src/pages/Index.tsx`: en mobile se oculta por completo el hero desktop (`hidden lg:block`) y se reemplaza por una versión reducida distinta, con menos contenido y distinta jerarquía.
- El banner real de contacto (`ContactBar`) está desactivado en mobile (`hidden lg:block`) y fue sustituido por un bloque improvisado de 2 botones, por eso “no se ve el banner”.
- La sección de ubicaciones sigue usando clases dinámicas del tema (`${t.textMuted}`), igual que partes del formulario; eso mantiene el riesgo de texto invisible o inconsistente.
- `LeadForm.tsx` todavía tiene varios patrones poco mobile: botones secundarios muy apretados en horizontal, labels con clases dinámicas, grid de montos demasiado rígido y estados/pasos con estilos mezclados.

Plan de implementación:
1. Unificar el hero
- Rehacer el bloque superior de `src/pages/Index.tsx` para que sea una sola estructura responsive, no dos héroes distintos.
- Mantener H1, subtítulo, badges y CTA dentro del mismo flujo, apilados en mobile y en dos columnas solo desde `lg`.
- Así evitamos que mobile tenga una versión “recortada” o desalineada respecto a desktop.

2. Recuperar el banner de contacto en mobile
- Convertir `src/components/shared/ContactBar.tsx` en un componente realmente responsive.
- Usarlo también en mobile, con layout vertical, botones full-width y espaciado compacto.
- Eliminar el bloque duplicado de “Llamar / WhatsApp” de `Index.tsx` para no seguir manteniendo dos implementaciones.

3. Corregir el `LeadForm` para 390px
- En `src/components/shared/LeadForm.tsx`, cambiar todos los textos críticos de estas secciones a color inline estable: títulos, subtítulos, labels, textos de ayuda, botones secundarios y estado success.
- Pasar botones “Atrás / Siguiente” a stack vertical en mobile y horizontal en pantallas mayores.
- Ajustar el paso de ahorro para que el grid sea 2 columnas en mobile y 3 en desktop.
- Revisar el campo teléfono para que select + input no queden comprimidos; si hace falta, apilar en mobile.
- Compactar paddings y alturas sin perder legibilidad.

4. Arreglar ubicaciones y bloque inferior del hero
- En `src/pages/Index.tsx`, rehacer la tarjeta de oficinas/horarios con tipografía explícita, mejor separación vertical y stacking limpio en mobile.
- Mantener direcciones legibles, sin líneas demasiado largas ni contraste dudoso.

5. Limpiar la estrategia responsive de estas secciones
- Reemplazar los `hidden lg:block` / `lg:hidden` que hoy rompen consistencia por una sola base responsive.
- Dejar solo diferencias de layout, no de contenido.
- Reducir márgenes superiores/inferiores para evitar “saltos” raros entre hero, form, banner, marquee y oficinas.

Detalles técnicos:
- Archivos foco: `src/pages/Index.tsx`, `src/components/shared/LeadForm.tsx`, `src/components/shared/ContactBar.tsx`.
- Mantendré el sistema visual actual (teal, glass cards, tipografías), pero con mobile-first real.
- Para evitar más fallos de color, en estas secciones usaré valores explícitos/estables en los textos importantes en vez de depender de combinaciones dinámicas de Tailwind.

Validación esperada:
- En 390px deben verse correctamente: H1, subtítulo, formulario completo, CTA de contacto, marquee y ubicaciones.
- En tablet y desktop debe conservarse la composición actual sin duplicación de bloques.
