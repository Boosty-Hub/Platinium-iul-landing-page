

# Plan: Actualizar número de teléfono y resolver dominio custom

## 1. Cambiar número de teléfono

Reemplazar todas las ocurrencias del número viejo `+17869562771` / `(786) 956-2771` por el nuevo `+16893082809` / `(689) 308-2809` en 3 archivos:

- **`src/pages/Index.tsx`** (línea 450) — botón "Llámanos ahora" en el hero
- **`src/components/shared/Footer.tsx`** (línea 50-52) — link de teléfono en el footer
- **`src/components/shared/ContactBar.tsx`** (línea 31) — botón "Llamar ahora" en la barra de contacto

## 2. Dominio custom — `platiniuminsuranceusa.com`

El proyecto **sí está publicado** y es público, pero el dominio custom `platiniuminsuranceusa.com` muestra "Your app will be live here" — eso significa que el dominio necesita ser (re)conectado o que falta hacer click en **Update** en el diálogo de publicación para desplegar la última versión al dominio custom.

**Acción requerida por ti:**
1. Ve a **Settings → Domains** en Lovable
2. Si el dominio `platiniuminsuranceusa.com` no aparece, conéctalo siguiendo el flujo
3. Si ya aparece, verifica que el status sea **Active** — si dice "Action required" o "Offline", revisa los registros DNS (A record apuntando a `185.158.133.1`)
4. Haz click en **Publish → Update** para desplegar la última versión

No es un problema de código — es de configuración de dominio/publicación.

