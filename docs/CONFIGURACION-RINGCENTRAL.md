# RingCentral + Advisor Cockpit — Guía de configuración (Platinium IUL)

> Qué hace el sistema, **qué ya está hecho**, y **qué tenés que hacer vos** para que el flujo completo quede 100% operativo.
> Última actualización: incluye el Advisor Cockpit (softphone en la app, pop-up en vivo, grabaciones, scorecard).

---

## 0. El flujo completo en una línea

**Lead entra → se crea en Kommo → el sistema llama a los asesores disponibles (en orden) → el asesor contesta DENTRO de la app y ve la data del lead → se conecta al cliente → se asigna el asesor en Kommo + se graba la llamada + queda en el scorecard del admin.**

---

## 1. El flujo completo (detalle)

```
1) Lead llena el formulario
2) Se crea el CONTACTO en Kommo (con toda la data + nota + edad) y entra a la cola (DB)
3) ¿Estamos en horario laboral?
     · No  → se agenda para la próxima apertura
     · Sí  → el motor empieza a marcar
4) Suena la EXTENSIÓN del asesor #1 (RingOut)  [solo si está conectado/disponible]
     · Al mismo tiempo, en el cockpit del asesor aparece un POP-UP con la data del lead
       (nombre, teléfono, interés, edad, ahorro, ciudad, fuente) + sonido + "Abrir en Kommo"
     · El asesor CONTESTA en el navegador (softphone embebido) o en su teléfono RC
     · Si no contesta en ~15s → se cancela y suena el asesor #2, #3…
5) Cuando un asesor contesta → RingCentral marca al CLIENTE
     · Cliente contesta  → CONTACTADO:
          - se asigna ese asesor en el campo "Responsable" de Kommo (match por nombre)
          - Status Call = call_completed
          - el asesor puede escribir una NOTA en vivo → se postea en Kommo
     · Cliente no contesta → se reencola: 5 → 15 → 30 min (hasta 3 intentos);
          agotados → etapa "no contestó llamada" + Status Call = call_no_answer
6) Termina la llamada → a los ~2 min el sistema trae la GRABACIÓN de RC a un bucket privado
7) Todo queda reflejado en el SCORECARD del admin (marcadas, contestadas, tiempos, grabaciones…)
```

> ⚠️ **No usamos la "Call Queue" de RingCentral (ext 12).** El motor marca **directo a la extensión** de cada asesor. La "cola" de nuestro sistema es una tabla en la base (`call_queue`).
>
> ⚠️ **El origen SIEMPRE es la extensión de un asesor real** — nunca el número principal (ese tiene IVR y el cliente terminaría hablando con el contestador).

---

## 2. Las DOS apps de RingCentral (esto es clave)

Una app de RingCentral solo puede tener **un** método de autenticación (JWT **o** OAuth), no los dos. Por eso el sistema usa **dos apps**:

| App | Auth | Para qué | Client ID | ¿Tocar? |
|---|---|---|---|---|
| **App del motor** | **JWT** (server-to-server) | El sistema marca las llamadas (RingOut, call-log, grabaciones) | `es9e9Ferph0c3WAnr5lMeg` | **NO tocar** |
| **App del softphone** | **OAuth 3-legged** (SPA) | El asesor inicia sesión y contesta en el navegador | `XAECTYxrMwHfuCu2emLmlo` | Ya creada — verificar scopes |

> Si cambiás la app JWT a OAuth, **dejan de salir las llamadas**. Son apps separadas a propósito.

**La app del softphone (SPA) necesita:**
- Tipo: *Client-side web app (SPA, JavaScript)* + *3-legged OAuth (authorization code)*
- Redirect URI: `https://apps.ringcentral.com/integration/ringcentral-embeddable/latest/redirect.html`
- Scopes: **Read Accounts, RingOut, VoIP Calling, Read Call Log, Read Presence**
- *Interactive Messages* y demás features de App Features: **dejar apagados** (no se usan).

---

## 3. ✅ Lo que YA está hecho

- ✅ Modelo de datos completo (cola, intentos, asesores, presencia, grabaciones, scorecard).
- ✅ Motor de llamadas: secuencial por orden, horario laboral, reintentos, asignación automática en Kommo (Responsable + Status Call), disparado por cron cada minuto.
- ✅ Disponibilidad inteligente: el motor **salta** a los asesores que no están conectados/disponibles (y si nadie abrió el cockpit, igual marca a su teléfono).
- ✅ Cockpit del asesor: presencia, **pop-up en vivo** con la data del lead, sonido, notas → Kommo, "Abrir en Kommo".
- ✅ Roles: admin (configura todo) vs asesor (ve solo lo suyo) — con RLS en la base.
- ✅ Gestión de usuarios (admins + asesores) desde el dashboard.
- ✅ Grabaciones: barrido automático de RC → bucket privado + reproductor seguro (el token RC nunca se expone).
- ✅ Scorecard del admin por asesor.
- ✅ Softphone embebido **cableado a la app SPA correcta** (`XAECTYxr…`).
- ✅ Las **dos apps** de RingCentral creadas; el `clientId` del softphone ya está en el código.
- ✅ Las 7 extensiones (102–110) mapeadas por nombre al campo "Responsable" de Kommo.

---

## 4. ☐ Lo que TENÉS que hacer (para que quede 100% operativo)

1. **☐ Activar grabación automática de salientes** en RingCentral
   `Admin → Phone System → Users (extensiones de asesores) → Call Recording → Automatic Call Recording → ON para salientes`.
   *Sin esto: las llamadas funcionan, pero el scorecard muestra 0 grabaciones.*

2. **☐ Cada asesor hace "Sign In" una vez** en el widget de RingCentral del cockpit
   Entra a `/asesor/cockpit` → click en el widget flotante de RC → inicia sesión con **su** usuario de RingCentral. Es una sola vez por navegador. A partir de ahí **contesta las llamadas dentro de la app**.

3. **☐ Verificar la app SPA del softphone** (la nueva, `XAECTYxr…`)
   Que tenga los scopes **Read Accounts, RingOut, VoIP Calling, Read Call Log, Read Presence** y el redirect URI del Embeddable (ver §2).

4. **☐ Los asesores deben estar conectados y "Disponible"**
   En el cockpit, el toggle **Disponible** debe estar verde para recibir llamadas. (Si nadie abrió el cockpit, el sistema igual marca a la extensión — pero lo ideal es que estén en la app.)

5. **☐ Variables en Netlify** (deploy del frontend) — SOLO estas 3:
   - `VITE_SUPABASE_URL` = `https://bnpusllwkahhipllprpi.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = `sb_publishable_x1fIstl-zP0rdU_shuB_fg_uFpuXe4K`
   - `VITE_RC_CLIENT_ID` = `XAECTYxrMwHfuCu2emLmlo`
   Build: `npm run build` · Publish dir: `dist` · (el `_redirects` ya está incluido).
   *Los secretos (SUPABASE_ACCESS_TOKEN, SB_SECRET_KEY, INTERNAL_TASK_SECRET, etc.) **NO van en Netlify**.*

6. **☐ Pasar el dominio de Netlify** para actualizar el `site_url` de Supabase (hoy apunta a localhost).

7. **☐ Prueba real con 2 teléfonos** (un asesor + un cliente) para validar el ciclo completo punta a punta.

---

## 5. Mapa de asesores (RingCentral ↔ Kommo)

El asesor que contesta se asigna en el campo **"Responsable" de Kommo** (match por nombre). Mapeo sembrado:

| Orden | Asesor | Ext. RC | Número directo (DID) | Responsable (Kommo) |
|---|---|---|---|---|
| 1 | Edgar Chirinos | 102 | +1 689 304 0457 | Edgar Chirinos |
| 2 | Gabriela Chirinos | 103 | +1 689 304 0525 | Gabriela Chirinos |
| 3 | Laura Niño | 104 | +1 689 285 3932 | Laura Niño |
| 4 | lizbeth Prieto | 105 | +1 689 308 2840 | lizbeth Prieto |
| 5 | Mariana Franco | 106 | +1 689 285 3929 | Mariana Franco |
| 6 | Alexandra Lopez | 107 | +1 689 220 4657 | Alexandra Lopez |
| 7 | Felix Meneses | 110 | +1 689 308 2874 | Felix Meneses |

> El **orden** = prioridad de llamado. Activá/desactivá y reordená desde **Configuración → Asesores**. Un asesor desactivado no recibe llamadas. Para darle acceso a la app a un asesor: **Usuarios → Crear usuario → Asesor**, vinculándolo a su extensión.

---

## 6. Horario laboral

Configurable en **Configuración → Horario y reintentos**:
- Zona horaria: **America/New_York**
- Lun–Vie 09:00–18:00 (sáb/dom desactivados por defecto)
- Fuera de horario → el lead se agenda y se llama al abrir.
- Reintentos al cliente: 5 → 15 → 30 min (hasta 3), luego mueve a "no contestó llamada".

---

## 7. Resolución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| El asesor no recibe la llamada | No está logueado/disponible en el cockpit ni en su extensión RC | Abrir `/asesor/cockpit` + Disponible, o tener la app RC abierta (§4.2, §4.4) |
| El softphone muestra error al "Sign In" | App SPA sin OAuth/redirect/scopes | Revisar la app `XAECTYxr…` (§2, §4.3) |
| El cliente habla con un contestador | Origen = número principal (IVR) | Ya está resuelto: el origen es la extensión del asesor |
| No hay grabación en el scorecard | Grabación automática desactivada en RC | Activar Automatic Call Recording (§4.1) |
| Las llamadas no salen | JWT de la app del motor revocado/expirado | Renovar el JWT en el Developer Console y actualizarlo en Configuración → RingCentral |
| Rutas dan 404 en Netlify al refrescar | Falta el SPA fallback | Ya incluido (`public/_redirects`) |
| Lead internacional no se llama | International Calling deshabilitado | Habilitar el país en RingCentral |

---

## 8. Notas técnicas (para afinar más adelante)

- **Doble marcado**: el "claim" de la cola todavía no es atómico — a bajo volumen el riesgo es mínimo, pero conviene un `SELECT … FOR UPDATE SKIP LOCKED`.
- **Match de grabación**: con llamadas **simultáneas** la grabación podría asignarse al intento equivocado. Se mitiga con grabación por extensión.
- **Transcripción/IA**: diferida a propósito (sin Deepgram ni RingSense). Las columnas existen en la base pero no hay pipeline.
