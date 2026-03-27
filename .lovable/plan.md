

# Plan: Implementar Estrategia SEO y Contenido Optimizada

## Cambios Principales

La estrategia propone URLs nuevas, meta tags optimizados, keywords expandidas, y 4 páginas adicionales. Dado que ya tienes 6 páginas funcionando (Fase 1), el trabajo se divide en dos bloques.

---

## Bloque A — Actualizar páginas existentes (SEO + URLs)

### 1. Cambiar URLs para mejor posicionamiento

| Actual | Nueva URL | Razón |
|--------|-----------|-------|
| `/iul-para-jubilacion` | `/jubilacion-sin-401k` | Captura "jubilación sin 401k" directamente |
| `/iul-para-indocumentados` | `/seguro-vida-itin` | Menos estigma, más preciso |

Las otras URLs (`/seguro-de-vida-iul`, `/iul-vs-401k`, `/contacto`) se mantienen.

Añadir redirects de las URLs viejas a las nuevas para no perder tráfico.

### 2. Actualizar meta tags en cada página

- **Home**: Meta title → "Seguro de Vida IUL Miami | Ahorro + Protección para Hispanos | Platinium Insurance"
- **Pilar IUL**: Sin cambios significativos
- **Jubilación**: Title → "Jubilación para Hispanos sin 401k Miami | Seguro IUL | Platinium Insurance"
- **ITIN**: Title → "Seguro de Vida con ITIN Miami | Para Inmigrantes sin Seguro Social | Platinium"
- **vs 401k**: Title → "IUL vs 401k para Hispanos | Comparativa Completa | Platinium Insurance Miami"

### 3. Expandir keywords en cada página

Agregar las long-tail keywords de la estrategia al campo `keywords` del SEOHead y distribuirlas naturalmente en el contenido H2/H3 y párrafos.

### 4. Añadir menciones geográficas

Incluir "Miami", "Hialeah", "Doral", "South Florida", "condado Miami-Dade" en textos de cada página para SEO local.

---

## Bloque B — Crear páginas nuevas (Fase 2)

### 4 páginas nuevas:

1. **`/proteccion-familiar`** — Protección familiar, beneficio por fallecimiento, hipoteca
2. **`/iul-emprendedores`** — Self-employed, 1099, dueños de negocio
3. **`/seguro-vida-sin-examen-medico`** — No-exam, aprobación rápida
4. **`/beneficios-en-vida`** — Living benefits, enfermedades crónicas/críticas/terminales

Cada página sigue el mismo patrón: Layout + SEOHead + Breadcrumbs + Hero + Secciones de contenido + LeadForm + ContactBar.

Las páginas `/dejar-herencia` y `/iul-para-jovenes` quedan para una fase posterior.

---

## Bloque C — Actualizar navegación y sitemap

1. **Navbar dropdown** y **Footer**: Añadir las 4 páginas nuevas a `SERVICE_PAGES` en `data.ts`
2. **App.tsx**: Añadir rutas nuevas + redirects de URLs viejas
3. **sitemap.xml**: Añadir las nuevas URLs, eliminar las viejas

---

## Archivos a modificar

- `src/pages/Index.tsx` — Meta tags + keywords + geo mentions
- `src/pages/IULParaJubilacion.tsx` — Renombrar conceptualmente, actualizar SEO
- `src/pages/IULParaIndocumentados.tsx` — Actualizar SEO + canonical
- `src/pages/IULvs401k.tsx` — Actualizar meta tags
- `src/pages/SeguroVidaIUL.tsx` — Expandir keywords
- `src/components/shared/data.ts` — Actualizar SERVICE_PAGES con nuevas URLs
- `src/App.tsx` — Nuevas rutas + redirects
- `public/sitemap.xml` — Nuevas URLs

## Archivos a crear

- `src/pages/ProteccionFamiliar.tsx`
- `src/pages/IULEmprendedores.tsx`
- `src/pages/SeguroSinExamen.tsx`
- `src/pages/BeneficiosEnVida.tsx`

---

## Orden de implementación

1. Actualizar SEO de páginas existentes (meta tags, keywords, geo)
2. Cambiar URLs (`jubilacion-sin-401k`, `seguro-vida-itin`) con redirects
3. Crear las 4 páginas nuevas
4. Actualizar navegación, footer y sitemap

