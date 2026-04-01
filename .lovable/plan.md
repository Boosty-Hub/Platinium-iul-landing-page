

# Plan: Fondo teal general con contraste coherente

## Cambio principal

Cambiar el fondo general de la página de oscuro (`#0B1A1E`) a un teal similar al de los botones, y ajustar todos los colores de contraste para que textos, cards, navbar, footer e inputs sigan siendo legibles.

## Paleta propuesta

- **Fondo principal**: `#1d9fa9` (teal brand) → se usará un tono ligeramente más oscuro para no cegar: `#178A93` o directamente `#1d9fa9`
- **Fondo secundario** (cards, footer): `#157A82` (teal más oscuro) con glassmorphism
- **Navbar**: `#1d9fa9/95` con backdrop-blur
- **Textos**: blanco `#FFFFFF` para títulos, `#E0F7FA` para texto medio, `#B2EBF2` para muted
- **Cards**: `#0E6B73/60` con borde blanco/10 — glassmorphism sobre teal
- **Inputs**: `#0D5F66` con borde blanco/20
- **Dividers**: `border-white/10`

## Archivos a modificar

### 1. `src/components/shared/theme.ts`
Actualizar la paleta del modo oscuro (que es el default) con los nuevos valores teal:
- `bg` → `bg-[#1d9fa9]`
- `bg2` → `bg-[#178A93]`
- `card` → `bg-[#0E6B73]/60 border-white/15`
- `text` → `text-white`
- `textMid` → `text-[#E0F7FA]`
- `textMuted` → `text-[#B2EBF2]`
- `nav` → `bg-[#1d9fa9]/92`
- `input` → `bg-[#0D5F66] border-white/20 text-white`
- Ajustar `brandBg`, `divider`, etc.

### 2. `src/components/shared/Footer.tsx`
Verificar que los colores hardcoded de texto/links no choquen con el nuevo fondo teal. Ajustar si es necesario.

### 3. `src/components/shared/LeadForm.tsx`
Revisar estilos inline de color que puedan chocar con el nuevo fondo. El form card debería resaltar sobre el fondo teal con un glassmorphism más contrastante (fondo más oscuro o blanco semitransparente).

### 4. `src/pages/Index.tsx`
Revisar colores inline hardcoded en hero, stats, secciones — asegurar que contrasten con el fondo teal.

### 5. `src/components/shared/ContactBar.tsx`
Los botones teal sobre fondo teal perderían contraste — cambiar CTAs a blanco con texto teal, o agregar borde/sombra para diferenciar.

## Notas
- El modo light no se toca (el sitio usa dark por default con `useState(false)` pero el dark theme es el que se usa visualmente).
- Se mantendrá coherencia: cards más oscuros sobre fondo teal, textos blancos, CTAs con suficiente contraste.

