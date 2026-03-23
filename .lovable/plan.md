

# Plan: Arquitectura Multi-Página para Platinium Insurance USA

## Estado Actual

- Una sola landing page monolítica (~1,600 líneas en `Index.tsx`)
- Stack: React + Vite + Tailwind (NO Next.js — el proyecto usa React Router)
- Edge Function `submit-lead` funcional con webhook a n8n/Kommo
- SEO con react-helmet-async, JSON-LD, sitemap.xml
- Brand tokens, dark mode, formulario multi-step ya implementados

---

## 1. Arquitectura del Sitio

```text
platiniuminsuranceusa.com/
├── /                              ← Homepage (hub principal)
├── /seguro-de-vida-iul            ← Página pilar IUL
├── /iul-para-jubilacion           ← Ahorro y retiro
├── /iul-proteccion-familiar       ← Protección por fallecimiento
├── /iul-para-emprendedores        ← Negocios y 1099
├── /iul-para-indocumentados       ← ITIN / sin SSN
├── /iul-vs-401k                   ← Comparativa
├── /iul-para-jovenes              ← Millennials / Gen Z
├── /iul-herencia-legado           ← Patrimonio familiar
├── /seguro-vida-sin-examen-medico ← No-exam life insurance
├── /sobre-nosotros                ← Quiénes somos
├── /contacto                      ← Formulario dedicado
├── /blog                          ← Hub de artículos (fase 2)
└── /calculadora-iul               ← Herramienta interactiva (fase 3)
```

---

## 2. Detalle de Cada Página

### HOMEPAGE `/`
- **H1:** "Seguro de Vida IUL para Latinos en Miami"
- **Meta title:** "Seguro de Vida IUL para Latinos en Miami | Platinium Insurance"
- **Meta desc:** "Protege a tu familia y construye tu retiro con un IUL. Consulta gratuita en español. Aceptamos ITIN. Miami, FL."
- **Keywords:** seguro de vida IUL, seguro de vida con ahorro, IUL para latinos
- **Contenido:** Hero, stats, pain points resumidos, 6 beneficios, CTA principal, testimonios destacados, FAQ corto (5)
- **CTA:** "Agenda tu Consulta Gratis"
- **Enlaces internos:** Links a cada página de servicio desde tarjetas de beneficios

### `/seguro-de-vida-iul` — Página Pilar
- **H1:** "¿Qué es un Seguro de Vida Universal Indexado (IUL)?"
- **Meta title:** "Seguro de Vida Universal Indexado (IUL) Explicado en Español"
- **Meta desc:** "Guía completa del IUL: cómo funciona, beneficios, costos y para quién es ideal. Información clara en español para hispanos en EE.UU."
- **Keywords:** seguro de vida universal indexado (1,900/mes), seguro de vida IUL (2,400/mes)
- **Secciones:** Definición, cómo funciona el indexing, cap/floor/spread, componentes de la póliza, riders disponibles, tabla comparativa completa, FAQ extendido (8-10), CTA
- **Enlaces:** A todas las sub-páginas de servicio

### `/iul-para-jubilacion` — Ahorro y Retiro
- **H1:** "Plan de Retiro con IUL: Ahorra para tu Jubilación sin 401(k)"
- **Meta title:** "Ahorro para Jubilación sin 401k | Plan de Retiro IUL"
- **Meta desc:** "¿Sin 401k ni pensión? El IUL te permite construir un plan de retiro con crecimiento indexado y acceso libre de impuestos. Consulta gratis."
- **Keywords:** ahorro para jubilación sin 401k (720/mes), seguro de vida con ahorro (3,100/mes)
- **Secciones:** Problema (sin 401k como 1099), solución IUL, simulación de crecimiento a 20/30 años, ventajas fiscales, casos reales, CTA
- **CTA:** "Calcula tu Plan de Retiro"

### `/iul-proteccion-familiar`
- **H1:** "Protege a tu Familia con un Seguro de Vida Permanente IUL"
- **Meta title:** "Seguro de Vida para Familias Hispanas | Protección IUL Miami"
- **Meta desc:** "Asegura el futuro de tu familia con un IUL: beneficio por fallecimiento, riders para enfermedades graves y valor en efectivo. Consulta gratis en español."
- **Keywords:** mejor seguro de vida para hispanos (1,200/mes)
- **Secciones:** Escenario sin protección, beneficio por fallecimiento, riders en vida, cobertura hipoteca, testimonios de familias, CTA

### `/iul-para-emprendedores`
- **H1:** "IUL para Emprendedores y Trabajadores Independientes (1099)"
- **Meta title:** "Seguro IUL para Emprendedores y Contratistas 1099 | Miami"
- **Meta desc:** "Sin beneficios de empleador, sin 401k. El IUL es tu solución: protección, ahorro y plan de retiro para dueños de negocio y trabajadores 1099."
- **Keywords:** seguro de vida para contratistas, IUL para negocios
- **Secciones:** Realidad del 1099 (sin beneficios), IUL como "beneficio propio", protección del negocio, sucesión patrimonial, perfiles (restaurantes, construcción, transporte), CTA

### `/iul-para-indocumentados`
- **H1:** "Seguro de Vida IUL con ITIN — Sin Necesidad de Seguro Social"
- **Meta title:** "Seguro de Vida para Indocumentados con ITIN | Sin SSN"
- **Meta desc:** "¿Tienes ITIN pero no SSN? Puedes aplicar a un seguro de vida IUL. Protege a tu familia y ahorra para el futuro. Explicación en español."
- **Keywords:** seguro de vida para indocumentados (590/mes), IUL con ITIN
- **Secciones:** Requisitos reales (ITIN, tax returns), mitos vs realidad, proceso de aplicación, privacidad y seguridad, FAQ específico, CTA
- **Tono:** Especialmente empático y tranquilizador

### `/iul-vs-401k`
- **H1:** "IUL vs 401(k): ¿Cuál es Mejor para tu Retiro?"
- **Meta title:** "IUL vs 401k: Comparación Completa en Español | 2026"
- **Meta desc:** "Compara IUL vs 401k vs Roth IRA: ventajas fiscales, acceso al dinero, protección familiar. Guía completa para hispanos en EE.UU."
- **Keywords:** IUL vs 401k (880/mes)
- **Secciones:** Tabla comparativa detallada (IUL vs 401k vs Roth IRA vs Term Life vs banco), escenarios reales, cuándo usar cada uno, por qué combinarlos, CTA
- **Formato:** Muy visual con tablas y checkmarks

### `/iul-para-jovenes`
- **H1:** "IUL para Jóvenes: Empieza a los 25 y Retírate a los 55"
- **Meta title:** "Seguro de Vida IUL para Jóvenes Profesionales | Empieza Hoy"
- **Meta desc:** "A los 25, $200/mes se convierten en $300,000+ a los 55. El poder del interés compuesto trabaja para ti. Consulta gratis."
- **Keywords:** seguro de vida para jóvenes, IUL interés compuesto
- **Secciones:** Poder del tiempo, simulación 25 vs 35 vs 45, costo de esperar, protección temprana, CTA

### `/iul-herencia-legado`
- **H1:** "Deja un Legado a tu Familia con un IUL"
- **Meta title:** "Herencia y Legado Familiar con Seguro de Vida IUL"
- **Meta desc:** "El IUL te permite dejar un legado financiero libre de impuestos a tus hijos. Planifica tu herencia con asesoría en español."
- **Keywords:** seguro de vida para herencia, legado familiar
- **Secciones:** Herencia sin impuestos, planificación patrimonial, protección multi-generacional, escenarios de beneficio, CTA

### `/seguro-vida-sin-examen-medico`
- **H1:** "Seguro de Vida sin Examen Médico — Aprobación Rápida"
- **Meta title:** "Seguro de Vida sin Examen Médico | Aprobación en 48hrs"
- **Meta desc:** "Obtén un seguro de vida IUL sin examen médico. Proceso simplificado, aprobación rápida. Consulta gratuita en español."
- **Keywords:** seguro de vida sin examen médico (2,100/mes)
- **Secciones:** Proceso simplificado, quién califica, tiempos de aprobación, comparación con proceso tradicional, CTA

### `/sobre-nosotros`
- **H1:** "Sobre Platinium Insurance Group"
- **Contenido:** Historia, misión, equipo, licencias, compromiso con la comunidad hispana, fotos

### `/contacto`
- **H1:** "Agenda tu Consulta Gratuita"
- **Contenido:** Formulario completo, teléfono, WhatsApp, dirección, mapa, horarios

---

## 3. Implementación Técnica

### Refactorización del Código

1. **Extraer componentes compartidos** del monolito `Index.tsx`:
   - `Layout.tsx` — navbar + footer + dark mode wrapper
   - `Navbar.tsx` — navegación actualizada con links a páginas
   - `Footer.tsx` — footer con sitemap links
   - `LeadForm.tsx` — formulario reutilizable (con prop `interes` pre-seleccionado)
   - `SEOHead.tsx` — componente reutilizable con props para cada página
   - `Testimonials.tsx`, `FAQ.tsx`, `ComparisonTable.tsx` — secciones reutilizables
   - Hooks: `useInView`, `useScrollY` a `src/hooks/`

2. **Crear páginas** en `src/pages/` — cada una con su SEO, contenido y CTA contextual

3. **Actualizar `App.tsx`** con todas las rutas

4. **Actualizar `sitemap.xml`** con todas las URLs

5. **Agregar JSON-LD** específico por página (Service, FAQPage, BreadcrumbList)

6. **Formulario contextual** — cada página pasa `interes` pre-seleccionado al form (ej: "jubilación", "protección familiar")

### Navegación

- Navbar con dropdown "Servicios" que lista las sub-páginas
- Breadcrumbs en cada página interna
- Footer con mapa del sitio completo
- Links internos contextuales en el contenido de cada página

---

## 4. Estrategia de Enlaces Internos

```text
Homepage ←→ Página Pilar IUL ←→ Todas las sub-páginas
Cada sub-página → 2-3 páginas relacionadas
Todas → Homepage y Contacto
FAQ cruzados entre páginas relevantes
```

---

## 5. Priorización por Fases

### Fase 1 (Inmediata)
- Refactorizar componentes compartidos del monolito
- Homepage optimizada
- `/seguro-de-vida-iul` (página pilar)
- `/iul-para-jubilacion`
- `/iul-para-indocumentados`
- `/iul-vs-401k`
- `/contacto`
- Navbar y Footer actualizados
- Sitemap actualizado

### Fase 2
- `/iul-proteccion-familiar`
- `/iul-para-emprendedores`
- `/seguro-vida-sin-examen-medico`
- `/iul-para-jovenes`
- `/iul-herencia-legado`
- `/sobre-nosotros`
- `/blog` (estructura + primeros 3 artículos)

### Fase 3
- `/calculadora-iul` (herramienta interactiva)
- Blog posts adicionales
- Landing pages para campañas PPC
- Páginas de localización (Doral, Hialeah, Homestead)

---

## 6. Detalles Técnicos

- **Rutas:** React Router (ya instalado), no SSR — SEO via react-helmet-async + JSON-LD + sitemap.xml
- **Componentes:** Extraer ~8 componentes del monolito actual
- **Formulario:** Un solo `LeadForm` reutilizable con campo `fuente` dinámico por página
- **Database:** Sin cambios — la tabla `leads` y Edge Function ya soportan el campo `interes`/`fuente`
- **Performance:** Lazy loading de páginas con `React.lazy()` + `Suspense`

