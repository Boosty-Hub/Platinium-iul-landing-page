## Arreglos del panel `/form-panel`

### Problemas detectados

1. **Se desconecta después de un rato.** El canal Realtime de Supabase se cae por inactividad o cambio de red (o cuando la pestaña queda en segundo plano y el WebSocket cierra). Hoy no hay reconexión: cuando el status cambia a `CHANNEL_ERROR`, `TIMED_OUT` o `CLOSED`, el indicador se pone rojo y no vuelve solo.

2. **Si entra otro lead inmediato, no se actualiza.** Cuando llega un lead, se abre el modal y se setea `alertLead`. Si llega un segundo lead mientras el modal aún está abierto, `setAlertLead(newLead2)` reemplaza el estado, pero como el modal ya está montado con el lead anterior y el `useEffect` del audio depende de `lead`, en algunos navegadores el cambio se pisa y el modal puede quedar mostrando el lead viejo o saltar el segundo. Además, no hay cola: si llegan 3 leads seguidos, el operador solo ve el último.

---

### Solución

#### 1. Auto-reconexión del Realtime (`src/pages/FormPanel.tsx`)

- Envolver la suscripción en una función `connect()` que se reinvoque al detectar `CHANNEL_ERROR`, `TIMED_OUT` o `CLOSED`, con backoff (1s → 2s → 5s, máx 5s).
- **Heartbeat de seguridad:** cada 30s, si `connected` es `false`, forzar reconexión.
- **Resync al reconectar:** después de cada reconexión exitosa, hacer un `select` de los leads creados después del `created_at` más reciente que ya tenemos y prependerlos. Esto cubre cualquier `INSERT` que se haya perdido durante la caída.
- **Reconexión al volver a la pestaña:** listener de `visibilitychange` → si la pestaña vuelve a ser visible y `connected === false`, reconectar + resync inmediato.
- **Polling de respaldo:** cada 20s, hacer un `select` ligero del último lead. Si su `id` no está en el state, lo agregamos (esto garantiza que aunque Realtime falle silenciosamente, ningún lead se pierda).

#### 2. Cola de alertas (no perder leads simultáneos)

- Reemplazar `alertLead: Lead | null` por `alertQueue: Lead[]`.
- Cuando llega un lead nuevo (por Realtime o por el polling de respaldo), se hace `setAlertQueue(q => [...q, newLead])` siempre que su `id` no esté ya en la cola ni haya sido mostrado (set de `id`s vistos en un `useRef`).
- El `LeadAlertModal` muestra `alertQueue[0]`. El botón "Cerrar" o "Ver en Kommo" hace `shift()` de la cola → el modal se vuelve a montar con el siguiente lead y la alarma vuelve a sonar.
- Badge en el modal: **"Lead 1 de N"** cuando hay más de uno encolado, para que el operador sepa que vienen más.
- Botón extra **"Cerrar todos"** cuando `alertQueue.length > 1`.

#### 3. Detalles UX

- Indicador del header: agregar **"Reconectando…"** (amarillo pulsante) entre `Conectado` y `Desconectado`.
- Toast discreto cuando se recupera la conexión: "Conexión restaurada".

---

### Archivos a modificar

- `src/pages/FormPanel.tsx` — reconexión, polling de respaldo, cola de leads, estados de conexión.
- `src/components/panel/LeadAlertModal.tsx` — soporte para cola (badge "1 de N", botón "Cerrar todos"), reset de audio al cambiar de lead encolado.

### Sin cambios en backend

La tabla `leads` ya tiene Realtime habilitado y RLS pública de SELECT. No hace falta migración ni tocar la edge function.
