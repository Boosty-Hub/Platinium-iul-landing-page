# Configuración de RingCentral — Platinium IUL

> Guía de lo que el sistema usa de RingCentral y lo que **vos tenés que asegurar** para que las llamadas funcionen perfecto.

---

## 1. Cómo llama el sistema (importante: NO usamos la "cola" de RingCentral)

Hay una confusión común, así que empecemos por acá:

- En RingCentral existe una **Call Queue (ext 12 "Llamadas en Cola")**. **Nuestro sistema NO la usa.**
- Nuestro motor llama a los asesores **uno por uno, en orden** (marcado directo a la extensión de cada asesor) usando **RingOut**. La "cola" de nuestro sistema es una **tabla en la base de datos** (`call_queue`), no la cola de RingCentral.

**Flujo real de una llamada:**

```
Lead entra → se crea en Kommo → entra a nuestra cola (DB)
   ↓ (en horario laboral)
RingOut: suena el TELÉFONO del asesor #1
   ├─ no contesta en ~15s → se cancela, suena el asesor #2, #3…
   └─ contesta → RingCentral marca al CLIENTE
         ├─ cliente contesta → quedan conectados (asesor ↔ cliente)
         └─ cliente no contesta → reintento más tarde (5 → 15 → 30 min)
```

> ⚠️ **Lección de la prueba inicial:** si se usa el **número principal de la empresa** como origen, contesta el **IVR** automáticamente y el cliente queda hablando con el contestador, no con un asesor. Por eso el origen SIEMPRE es la extensión de un **asesor real**.

---

## 2. ✅ Lo que YA está configurado (no tocar)

| Ítem | Valor |
|---|---|
| App / autenticación | JWT (server-to-server), credenciales cargadas en el dashboard de admin |
| Servidor | `https://platform.ringcentral.com` (producción) |
| Plan | RingEX Advanced |
| Extensiones de asesores | 102–110 (ver tabla abajo) |

---

## 3. ⚠️ Lo que TENÉS que asegurar para que funcione perfecto

### 3.1 — El asesor DEBE estar accesible en su extensión (lo más importante)

Cuando el motor llama al asesor, RingCentral hace sonar **su extensión**. Para que el teléfono del asesor realmente suene, cada asesor necesita **al menos una** de estas:

1. **App de RingCentral** abierta y con sesión iniciada en su extensión (escritorio y/o celular), **o**
2. Un **teléfono de escritorio** físico asociado a la extensión, **o**
3. **Reenvío de llamadas (Call Forwarding)** de su extensión a su celular personal.

> Si un asesor no está logueado en ningún lado, el sistema lo va a saltar (suena, no contesta) y pasará al siguiente. **Recomendado:** cada asesor con la app de RingCentral abierta en escritorio + celular.

### 3.2 — Grabación de llamadas (para ver las grabaciones en el dashboard)

Para que el dashboard muestre las grabaciones, hay que activar la **grabación automática de llamadas salientes**:

`RingCentral Admin → Phone System → Auto-Receptionist / Users → Call Recording → Automatic Call Recording → activar para llamadas salientes` (para las extensiones de asesores).

> Sin esto, las llamadas funcionan igual, pero no habrá grabación para reproducir.

### 3.3 — Caller ID (qué número ve el cliente)

Por defecto el cliente ve el número del asesor que lo llama. Si querés que **siempre vean el número principal de la empresa** (más profesional y consistente), avisame y lo fijo en el sistema (`callerId` del RingOut).

### 3.4 — Llamadas internacionales (solo si hay leads fuera de EE.UU.)

Los leads de EE.UU. (+1) ya funcionan (verificado en el historial de llamadas). Si alguna vez se llaman números **internacionales**, hay que habilitar **International Calling** en RingCentral para el país correspondiente.

### 3.5 — El credencial JWT no debe revocarse

La autenticación usa un **JWT credential** de la app. Si se revoca o expira, las llamadas dejan de salir. Si hay que renovarlo, se genera uno nuevo en el Developer Console de RingCentral y se actualiza en el dashboard de admin (Configuración → RingCentral).

---

## 4. Mapa de asesores (RingCentral ↔ Kommo)

El sistema asigna al asesor que contesta en el campo **"Responsable" de Kommo** (match por nombre). Este es el mapeo sembrado:

| Orden | Asesor | Ext. RC | Número directo (DID) | Responsable (Kommo) |
|---|---|---|---|---|
| 1 | Edgar Chirinos | 102 | +1 689 304 0457 | Edgar Chirinos |
| 2 | Gabriela Chirinos | 103 | +1 689 304 0525 | Gabriela Chirinos |
| 3 | Laura Niño | 104 | +1 689 285 3932 | Laura Niño |
| 4 | lizbeth Prieto | 105 | +1 689 308 2840 | lizbeth Prieto |
| 5 | Mariana Franco | 106 | +1 689 285 3929 | Mariana Franco |
| 6 | Alexandra Lopez | 107 | +1 689 220 4657 | Alexandra Lopez |
| 7 | Felix Meneses | 110 | +1 689 308 2874 | Felix Meneses |

> El **orden** = prioridad de llamado (suena primero el 1). Activá/desactivá y reordená cada asesor desde **Configuración → Asesores** en el dashboard. Un asesor desactivado no recibe llamadas.

---

## 5. Horario laboral

El motor solo llama en **horario laboral** (configurable en Configuración → Horario y reintentos):

- Zona horaria: **America/New_York**
- Lun–Vie 09:00–18:00 (sáb/dom desactivados por defecto)
- Fuera de horario → el lead se agenda y se llama al abrir.

---

## 6. Resolución de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| El teléfono del asesor no suena | No está logueado en su extensión | Abrir la app de RingCentral o configurar reenvío (3.1) |
| El cliente habla con un contestador | Se usó el número principal como origen | Verificar que el origen sea la extensión del asesor (ya está así) |
| No hay grabación en el dashboard | Grabación automática desactivada | Activar Automatic Call Recording (3.2) |
| Las llamadas no salen | JWT revocado/expirado | Renovar el JWT credential (3.5) |
| Lead internacional no se llama | International Calling deshabilitado | Habilitar el país en RingCentral (3.4) |
