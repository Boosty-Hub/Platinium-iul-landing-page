

## Panel de monitoreo de leads en tiempo real

### Resumen
Crear una ruta pública `/form-panel` que escuche en tiempo real los nuevos leads de la tabla `leads` y dispare una alerta visual + sonora invasiva. Adicionalmente, enriquecer el flujo de captura existente para resolver la **ciudad** desde la IP automáticamente.

---

### 1. Backend: Captura de ciudad desde IP

**Modificar `supabase/functions/submit-lead/index.ts`:**
- Después de obtener `clientIp`, hacer fetch a `https://ipapi.co/{ip}/json/` para resolver `city`, `region`, `country`.
- Guardar `city` en una nueva columna de la tabla `leads`.
- Fire-and-forget con timeout de 2s: si falla la geolocalización, el lead se guarda igual con `city = null`.

**Migración SQL:**
```sql
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS region text;
```

**Realtime habilitado:**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER TABLE public.leads REPLICA IDENTITY FULL;
```

**RLS para SELECT público (temporal, según pedido del usuario):**
```sql
CREATE POLICY "public_read_leads_panel" ON public.leads
  FOR SELECT TO anon, authenticated USING (true);
```
> Nota de seguridad: esto expone PII (nombre, email, teléfono) a cualquiera con la URL. El usuario lo aceptó como temporal. Lo señalo en la entrega para reforzar que se debe proteger pronto con auth.

---

### 2. Página `/form-panel`

**Crear `src/pages/FormPanel.tsx`:**

**Layout:**
- Header oscuro con título "Panel de Leads en Vivo" + indicador verde pulsante ("● Conectado").
- Botón inicial **"🔔 Activar Alertas"** que el operador debe presionar una vez para desbloquear el autoplay de audio (requisito de navegadores).
- Tabla con columnas: **Hora · Nombre · Teléfono · Email · Ciudad · IP · Interés**.
- Filas ordenadas DESC por `created_at`. Resaltar las nuevas con animación fadeUp + fondo teal por 5s.
- Carga inicial: últimos 100 leads vía `supabase.from('leads').select(...).order('created_at', { ascending: false }).limit(100)`.

**Realtime:**
```ts
supabase.channel('leads-panel')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' },
      (payload) => { setLeads(prev => [payload.new, ...prev]); triggerAlert(payload.new); })
  .subscribe();
```

**Sin Navbar/Footer/GeoGate:** la ruta se monta fuera de `<GeoGate>` o lo bypassea, igual que `/links`.

---

### 3. Alerta pop-up invasiva con sonido

**Componente `LeadAlertModal`:**
- Overlay negro al 90% que bloquea interacción.
- Modal grande centrado con animación zoom-in + pulso teal.
- Texto: **"¡Acaba de llegar un lead! Atenderlo ahora."**
- Muestra resumen del lead recién llegado (nombre + teléfono + ciudad).
- Botón principal naranja gigante: **"Ver en Kommo"** → `window.open('https://agentplatiniuminsurancecom.kommo.com/leads/pipeline/', '_blank')`.
- Botón secundario: "Cerrar".

**Audio:**
- Archivo `/public/alarm.mp3` (el usuario debe subirlo, o usaré un placeholder web-safe).
- `<audio>` con `loop` activado mientras el modal esté abierto.
- Se detiene al hacer clic en cualquier botón.
- Volumen al 100%.

**Desbloqueo de autoplay:**
- Estado `audioEnabled` (default `false`). Mientras esté `false`, mostrar un overlay con botón "🔔 Activar Alertas" que llama a `audio.play().then(() => audio.pause())` para registrar el gesto del usuario.

---

### 4. Routing

**Modificar `src/App.tsx`:**
- Agregar lazy import: `const FormPanel = lazy(() => import("./pages/FormPanel.tsx"));`
- Agregar `<Route path="/form-panel" element={<FormPanel />} />` **fuera** del `<GeoGate>` para que sea accesible desde cualquier país (el equipo comercial podría estar fuera de US).

---

### 5. Pregunta sobre el archivo de audio

Necesito saber cómo proveer el sonido de alarma:

**Opción A (recomendada):** Tú subes un archivo `alarm.mp3` a `public/` y yo lo referencio.
**Opción B:** Genero un beep sintético con Web Audio API (sin archivo, sin dependencias, repetitivo y fuerte).
**Opción C:** Uso una URL pública de un sonido libre de derechos.

Si no respondes esta duda en el siguiente mensaje, implementaré la **Opción B** (Web Audio API) para no bloquear el desarrollo, y dejaré preparado el `<audio src="/alarm.mp3">` como fallback para que solo subas el archivo después.

---

### Archivos
- **Crear**: `src/pages/FormPanel.tsx`, `src/components/panel/LeadAlertModal.tsx`
- **Modificar**: `src/App.tsx`, `supabase/functions/submit-lead/index.ts`
- **Migración SQL**: agregar `city`/`region`, habilitar realtime, RLS pública SELECT
- **Opcional**: `public/alarm.mp3` (subido por el usuario)

