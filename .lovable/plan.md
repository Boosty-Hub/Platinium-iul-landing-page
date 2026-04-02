

## Bloqueo geográfico estricto — Solo EE.UU.

Actualmente el componente `GeoGate` muestra un overlay para visitantes fuera de EE.UU. pero permite continuar con un botón "Soy residente de EE.UU., continuar →". El usuario quiere eliminar esa posibilidad y bloquear completamente el acceso.

### Cambios en `src/components/shared/GeoGate.tsx`

1. **Eliminar el estado `dismissed`** y el botón que lo activa — ya no habrá forma de cerrar el overlay.
2. **Eliminar `sessionStorage`** — cada visita verificará la ubicación (evita que alguien guarde el bypass en caché).
3. **Si el país NO es US, mostrar pantalla de bloqueo permanente** sin botón de continuar. Solo texto informativo.
4. **Mientras se verifica la ubicación**, mostrar una pantalla de carga mínima (spinner o blank) para evitar flash de contenido antes de confirmar que es US.
5. **Si el servicio de geo falla**, permitir acceso (fallback permisivo para no bloquear usuarios legítimos por error del API).

### Pantalla de bloqueo (sin escape)

- Mismo estilo visual actual (overlay oscuro, card blanca centrada)
- Emoji 🇺🇸, título, texto explicativo
- **Sin botón** — el usuario simplemente no puede continuar
- Texto adicional: "Si crees que esto es un error, contáctanos a [email/teléfono]" para dar una salida humana

