# Configuración de Resend (envío de cotizaciones por email) — Platinium IUL

> Qué hay que hacer en Resend para que el sistema envíe la cotización al correo del lead automáticamente.

---

## ¿Para qué se usa?
Cuando una llamada con un cliente supera los **2 minutos** (conversación real), el sistema le **envía automáticamente al correo** la cotización de su póliza — armada con los datos que llenó en el formulario (nombre, email, edad, género) + la tabla de montos según **género + edad + monto**. También se puede enviar/re-enviar manual desde el panel.

El email se manda con **Resend** (servicio de correo transaccional). Esto es lo único que tenés que hacer del lado de Resend.

---

## Pasos en Resend (una sola vez)

### 1. Crear la cuenta
- Entrá a **https://resend.com** y registrate (plan gratuito alcanza para empezar: 3.000 emails/mes, 100/día).

### 2. Verificar un dominio de envío  ⭐ (lo más importante)
Para que los correos lleguen a la bandeja (no a spam) hay que enviar **desde tu dominio**, verificado.
- En Resend → **Domains → Add Domain**.
- Recomendado: un subdominio dedicado, p. ej. **`mail.platiniuminsuranceusa.com`** (no afecta el correo normal del dominio).
- Resend te va a dar **registros DNS** para agregar donde administrás el dominio (Cloudflare, GoDaddy, Netlify DNS, etc.):
  - **TXT** (SPF) — autoriza a Resend a enviar.
  - **TXT / CNAME** (DKIM) — firma los correos (2-3 registros).
  - **TXT** (DMARC) — opcional pero recomendado.
- Agregá los registros y dale **Verify**. Suele tardar de minutos a un par de horas.

### 3. Crear la API Key
- En Resend → **API Keys → Create API Key**.
- Permiso: **Sending access** (alcanza). Nombre: p. ej. `platinium-cotizaciones`.
- **Copiá la key** (empieza con `re_...`) — se muestra una sola vez.

### 4. Definir el remitente (From)
- Elegí una dirección **en el dominio verificado**, p. ej. **`cotizaciones@mail.platiniuminsuranceusa.com`**.
- Nombre visible sugerido: **`Platinium Insurance Group`**.
- (Opcional) un **Reply-To** para que las respuestas vayan a un buzón real (ej. el correo de ventas o del asesor).

---

## Lo que me pasás a mí (y yo configuro)
Cuando tengas la cuenta lista, pasame **3 cosas** y las cargo en el panel (Configuración → Email), guardadas como secreto:

1. **API Key** (`re_...`)
2. **From** (ej. `cotizaciones@mail.platiniuminsuranceusa.com`)
3. **Nombre del remitente** (ej. `Platinium Insurance Group`) y, si querés, el **Reply-To**.

> La API key se guarda **encriptada en el backend** (nunca en el navegador), igual que Kommo y RingCentral. El envío ocurre en el servidor.

---

## Notas
- **Mientras tanto** (sin dominio verificado) Resend permite probar enviando **solo a tu propio correo** desde `onboarding@resend.dev`. Sirve para testear el diseño del email antes de verificar el dominio.
- Si en el futuro querés también **adjuntar el PDF** de la cotización (además del email), se puede generar y adjuntar — avisame.
- Logos del email: usa los de tu dominio (`platiniuminsuranceusa.com/...`) para que se vean siempre.

---

## Resolución de problemas
| Síntoma | Causa | Solución |
|---|---|---|
| El correo cae en spam | Dominio sin verificar o sin DKIM | Verificar el dominio + DKIM (paso 2) |
| Error "domain not verified" | From de un dominio no verificado | Usar una dirección del dominio verificado |
| No llega nada | API key inválida o sin permiso de envío | Regenerar la API key con Sending access |
| Llega solo a tu correo | Estás en modo prueba (`onboarding@resend.dev`) | Verificar tu dominio y usar tu From |
