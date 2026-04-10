

## Banner de cookies + Página de Política de Privacidad

### 1. Crear página `/politica-de-privacidad`

Nueva página `src/pages/PoliticaPrivacidad.tsx` con contenido legal completo en español, adaptado a:
- **Marca**: Platinium Insurance Group, agencia de seguros de vida IUL
- **Ubicación**: Miami FL, con oficinas en Orlando y Houston
- **Leyes aplicables**: Ley federal de EE.UU. (no hay ley federal única de privacidad, pero se cubren estándares de la industria), CCPA/CPRA (California), y buenas prácticas generales
- **Contacto**: info@platiniuminsuranceusa.com, (689) 308-2809

Secciones del contenido:
- Información que recopilamos (nombre, teléfono, edad, datos del formulario de cotización)
- Cómo usamos la información (contactar al usuario, cotizaciones, CRM/Kommo)
- Cookies y tecnologías de rastreo (Google Tag Manager, analytics)
- Compartición con terceros (aseguradoras, CRM)
- Derechos del usuario (acceso, eliminación, opt-out)
- Seguridad de datos
- Menores de edad
- Cambios a la política
- Contacto

Usará `Layout` y `SEOHead` como las demás páginas. Estilo visual consistente con el resto del sitio.

### 2. Crear banner de cookies `src/components/shared/CookieBanner.tsx`

- Banner fijo en la parte inferior de la pantalla (similar al de la imagen de referencia)
- Texto: "Usamos cookies para mejorar tu experiencia y mantener tus datos seguros."
- Link a "Política de Privacidad" (`/politica-de-privacidad`)
- Botón "Aceptar" (estilo primario)
- Botón secundario "Gestionar preferencias" (texto link)
- Se guarda la preferencia en `localStorage` para no volver a mostrar
- Glassmorphism card style consistente con el design system

### 3. Integrar en App.tsx

- Agregar ruta `/politica-de-privacidad` 
- Renderizar `<CookieBanner />` a nivel global (dentro del BrowserRouter pero fuera de Routes)

### 4. Agregar link en Footer

- Añadir enlace "Política de Privacidad" en la sección inferior del footer, junto al copyright

### 5. Actualizar sitemap y llms.txt

- Agregar `/politica-de-privacidad` al sitemap.xml y al llms.txt

### Archivos a crear/modificar
- **Crear**: `src/pages/PoliticaPrivacidad.tsx`, `src/components/shared/CookieBanner.tsx`
- **Modificar**: `src/App.tsx` (ruta + banner), `src/components/shared/Footer.tsx` (link), `public/sitemap.xml`, `public/llms.txt`

