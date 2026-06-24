# Sistema de Seguimiento — Diseño (Platinium IUL)

> Gestión de recontactos: leads que no contestaron, que contestaron y "no quedaron en nada", o que hay que **llamar después**. Todo desde **Mis Leads** (no pantalla aparte). Kommo se mantiene espejado.

---

## 1. Concepto central: Disposición + Seguimiento
Al terminar cada llamada (o desde Mis Leads), el asesor elige **una disposición** (resultado) en 1 clic. La disposición:
- Sincroniza **Kommo** (etapa + Status Call + Próxima cita).
- Guarda una **nota**.
- Opcionalmente **agenda un recontacto** (fecha/hora) → crea un **seguimiento**.

### Disposiciones y mapeo a Kommo (editable; defaults)
| Disposición | Agenda recontacto | Etapa Kommo (default) | Status Call |
|---|---|---|---|
| 📵 No contestó | el motor reintenta solo | no contestó llamada (100245771) | call_no_answer |
| 🟢 Contestó — interesado | opcional | LLAMADA RECIBIDA C/CONTACTO (106627488) | call_completed |
| 🕐 Llamar después | **sí (fecha/hora)** | llamada realizada (100245767) | call_rescheduled |
| 💸 Cotización enviada | opcional (ej. +3 días) | Cotización por enviar (100245779) | call_completed |
| 📅 Cita agendada | setea **Próxima cita** | llamada realizada (100245767) | call_rescheduled |
| ❌ No interesado | no | Venta Perdido (143) | call_completed |
| 🏆 Ganado | no | Logrado con éxito (142) | call_completed |
| ⚠️ Número equivocado | no | Venta Perdido (143) | call_no_answer |

> "LA PISCINA" queda obsoleta: el motor sigue marcando en horario laboral hasta que un asesor atienda.

---

## 2. El Historial del lead (timeline)
Lo que permite "ver toda la data de lo que se ha llevado con el lead". Junta lo que YA capturamos:
- cada **llamada** (`call_attempts`): fecha, asesor, resultado, duración, grabación, **nota**;
- **disposiciones** y recontactos (`seguimientos`);
- **cotización enviada**; cambios de **etapa**.

Se ve: (a) en el **pop-up** cuando entra un recontacto (el asesor llega con contexto), y (b) en **Mis Leads** al abrir un lead.

---

## 3. Recontacto agendado — el motor
1. Al poner "Llamar después / Cita", el asesor elige **fecha/hora** → se crea el seguimiento y se programa la cola **fijada a ese mismo asesor** (`solo_asesor_id`).
2. **5 min antes**: recordatorio **en vivo** al asesor ("vas a llamar a Juan en 5 min") + badge.
3. **A la hora**: el sistema **marca solo**, y suena **únicamente a ese asesor** (no rota). Si está ocupado/offline, reintenta a él un poco después.
4. Al contestar, el cockpit muestra el **historial del lead**.
5. Desde ahí, en 1 clic, el asesor agenda el **siguiente** recontacto.

---

## 4. Modelo de datos
**`seguimientos`** (nueva): `id, lead_id, asesor_id (dueño), disposicion, nota, programado_para (nullable), estado (pendiente|avisado|hecho|vencido|cancelado), creado_en, completado_en`.
**`leads`**: `disposicion_actual TEXT`.
**`call_queue`**: `solo_asesor_id UUID` (fija la llamada a un asesor; null = rotación normal).
**Mapeo disposición→etapa**: guardado en la config de Kommo (editable), con los defaults de arriba.

RLS: el asesor ve/gestiona **solo lo suyo**; el admin ve todo.

---

## 5. UI (dentro de Mis Leads)
- **Filtros nuevos**: *Para hoy · Vencidos · Esta semana · Todos* (seguimientos), junto a los de estado.
- **Detalle del lead** (drawer): el **timeline** + selector de **disposición** + "agendar recontacto" (fecha/hora) + las acciones que ya hay (Llamar, Nota, Cotización). *Nota: "Mover etapa" se quitó — la etapa de Kommo se actualiza sola al Registrar resultado, así que el botón manual era redundante.*
- **Badge** con la cantidad de seguimientos de hoy/vencidos.
- **Recordatorio**: pop-up en vivo 5 min antes (reusa el Realtime de llamadas entrantes).
- **Admin**: tablero de seguimientos (pendientes / vencidos / por asesor) + métricas en el Scorecard.

---

## 6. Fases
1. **Núcleo**: `seguimientos` + `disposicion` + Historial + sync Kommo + UI de disposición/agenda en Mis Leads.
2. **Motor de recontacto**: pin al asesor + recordatorio 5 min + auto-marca + pop-up con historia + reagendar.
3. **Admin**: tablero de seguimientos + métricas en Scorecard.

## Fuera de alcance (por ahora, decisión del owner)
- **PDF de la cotización → Kommo** (`COTIZACIÓN PDF`): requiere generar PDF server-side (servicio externo) — se difiere. El campo `Cotizacion Url` se omite.
- Recordatorio por **email** cuando el asesor está offline — futuro.
