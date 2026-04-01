

# Dark Mode por Defecto con Textos Más Claros

## Cambios

### 1. `src/components/shared/Layout.tsx`
- Cambiar `useState(false)` → `useState(true)` para que arranque en dark mode.

### 2. `src/components/shared/theme.ts`
- Ajustar el tema dark: mantener fondos verde oscuro (`#0B1A1E`, `#0F2229`) pero subir los textos a tonos más blancos/claros:
  - `text` → `text-white` o `text-[#F5FAFA]`
  - `textMid` → `text-[#C8DDE2]` (más claro que el actual `#94B3BB`)
  - `textMuted` → `text-[#9BB8C0]` (más claro que `#6A8E98`)
  - `card` → fondo ligeramente más claro/visible
  - `input` → texto más blanco, fondo un poco más claro
- El tema light queda igual (se convierte en el modo alternativo).

### 3. `src/components/shared/Navbar.tsx`
- Invertir las etiquetas del botón toggle: cuando está en dark (default) muestra "Light", cuando está en light muestra "Dark". Ya funciona así, no requiere cambio.

### Archivos modificados
1. `src/components/shared/Layout.tsx` — default state a `true`
2. `src/components/shared/theme.ts` — textos dark más blancos/brillantes

