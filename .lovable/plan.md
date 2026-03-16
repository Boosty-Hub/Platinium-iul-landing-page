
Objetivo: corregir el 401/RLS del formulario y endurecer el envío contra bots/spam sin cambiar el payload que recibirá n8n.

Diagnóstico
- En el código fuente actual (`src/pages/Index.tsx`, `submitLead`) ya no veo un `.select("id")`, así que el `POST .../leads?select=id` que aparece en runtime apunta a que la preview está corriendo un bundle viejo o a que el flujo público sigue dependiendo de la versión anterior.
- Aun así, el problema de fondo sigue siendo el mismo: el navegador está intentando insertar directo en `public.leads`, y cualquier desajuste entre validación del cliente y la policy RLS termina en `42501`.
- Además, hoy el webhook de n8n está expuesto en el frontend y la protección anti-bot actual (honeypot + tiempo mínimo) se puede saltar fácilmente.

Plan de implementación
1. Mover el ingreso del lead a una backend function pública
- Crear una función tipo `submit-lead`.
- El frontend dejará de insertar directo en `leads`.
- La función recibirá el formulario, validará/sanitizará server-side, capturará IP y user-agent reales, insertará el lead y luego enviará n8n + Kommo desde backend.
- Esto elimina la dependencia del RLS para el submit público y oculta el webhook de n8n del navegador.

2. Simplificar el frontend
- En `src/pages/Index.tsx`, reemplazar este bloque:
  - `supabase.from("leads").insert(...)`
  - `fetch("https://n8n...")`
  - `supabase.functions.invoke("sync-lead-to-kommo")`
- Por una sola llamada a `submit-lead`.
- Mantener el wizard y los mensajes de éxito/error igual de simples para el usuario.

3. Alinear validación cliente + backend
- Endurecer validación visible antes de enviar:
  - nombre: 2–200
  - teléfono: 7–40
  - email: regex real, no solo `@` y `.`
  - año: rango válido
- Repetir exactamente las mismas reglas en backend para que no vuelva a existir diferencia entre “parece válido” y “RLS lo rechaza”.

4. Antibot / antispam real
- Conservar honeypot y tiempo mínimo en cliente.
- Repetir esas comprobaciones en backend.
- Añadir rate limit por IP/ventana de tiempo.
- Opcionalmente registrar intentos bloqueados en una tabla auxiliar protegida para poder auditar spam.

5. Base de datos
- Mantener `leads` sin lectura pública.
- Dejar de depender del INSERT público desde el navegador.
- Como endurecimiento final, retirar la policy pública de INSERT y permitir que solo el backend cree leads.
- Si agrego una tabla de rate limiting o logs de spam, quedará protegida sin acceso público.

Detalles técnicos
- Archivos a tocar:
  - `src/pages/Index.tsx`
  - `supabase/functions/submit-lead/index.ts`
  - nueva migración SQL para endurecer policies y, si hace falta, tabla de rate limiting/logs
- Reutilizaré `supabase/functions/sync-lead-to-kommo/index.ts` desde backend para no duplicar lógica.
- Mantendré estable el esquema de datos hacia n8n para que puedas configurarlo ya.

Payload exacto que llegará a n8n
Voy a conservar estas claves:
```json
{
  "lead_id": "uuid",
  "nombre": "string",
  "telefono": "string",
  "email": "string",
  "interes": "string",
  "anio_nacimiento": "string|null",
  "ahorro_semanal": "string|null",
  "fuente": "landing-iul",
  "referrer": "string",
  "utm_source": "string|null",
  "utm_medium": "string|null",
  "utm_campaign": "string|null",
  "utm_content": "string|null",
  "utm_term": "string|null",
  "notas": "string",
  "created_at": "ISO-8601 string"
}
```

Notas para n8n
- `lead_id`: UUID generado por backend
- `fuente`: siempre `landing-iul`
- `anio_nacimiento` y `ahorro_semanal`: pueden llegar como `null`
- `created_at`: fecha ISO del momento de recepción
- `notas`: texto consolidado del wizard

Resultado esperado
- Desaparece el error 401 / `new row violates row-level security policy`.
- n8n deja de estar expuesto desde el navegador.
- El formulario queda bastante más resistente a bots y spam.
- Tú puedes ir configurando n8n con el payload anterior sin esperar más cambios de campos.
