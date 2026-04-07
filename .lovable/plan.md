

## Cambios en el formulario — Botón de llamada y color naranja

### 1. Ocultar ContactBar antes del formulario completado

Actualmente el `<ContactBar>` aparece justo debajo del `<LeadForm>` en todas las páginas, visible siempre. El cambio es **mover el botón de llamada al interior del formulario**, mostrándolo solo en el estado `success`.

**En todas las páginas** (Index, Contacto, ProteccionFamiliar, SeguroVidaIUL, BeneficiosEnVida, IULParaJubilacion, IULParaIndocumentados, IULEmprendedores, SeguroSinExamen, IULvs401k):
- Eliminar `<div className="px-6 pb-12"><ContactBar t={t} /></div>` que aparece debajo del `<LeadForm>`.

**En `LeadForm.tsx`** (estado success, líneas 456-477):
- Mantener el botón "Llamar Ahora" que ya existe en el estado success — este se queda.
- Agregar también el botón de WhatsApp del ContactBar en el estado success para no perder esa opción.

### 2. Botones "Continuar" y "Llamar" en color naranja

**En `LeadForm.tsx`**:
- Cambiar todos los botones de acción (Continuar, Siguiente, "Sí quiero ver mis números", submit, y "Llamar Ahora" en success) del gradiente teal actual (`from-[#1d9fa9] to-[#177D85]`) a un gradiente naranja: `from-[#F97316] to-[#EA580C]`.
- Esto afecta los botones en los pasos 1-6 y el botón de llamar post-envío.
- Los botones "Atrás" mantienen su estilo actual (outline gris).

### Archivos a modificar
- `src/components/shared/LeadForm.tsx` — gradiente naranja + WhatsApp en success
- 10 páginas — eliminar `<ContactBar>` debajo del form

