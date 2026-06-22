# Boosty — Estándar de Seguridad (Supabase + Web)

**Aplica a TODO proyecto Supabase/web de Boosty (no a otros stacks como Prisma).** Copia canónica del equipo, versionada en cada repo. 

---

## 🥇 REGLA DE ORO
La clave **`anon`/publishable es PÚBLICA** — va dentro del bundle del frontend, cualquiera la extrae. **Rotarla NO protege nada** (la nueva también es pública). La seguridad real es: **RLS correcto + permisos mínimos (least-privilege) + guards en funciones**. **Asume que el atacante ya tiene la anon key y conoce el esquema.** Lo único secreto de verdad: `service_role`/`secret` key (solo en edge) y el token `sbp_` de Management (solo en `.env` gitignored).

---

## ✅ CHECKLIST PRE-LANZAMIENTO (rápido — todos lo ejecutan igual)

**Llaves / secretos**
- [ ] **Repo PRIVADO** (un repo público filtra esquema, RPCs, anon key, lógica de guards).
- [ ] **Cero claves quemadas (hardcoded) en el código.** Todo por `import.meta.env.VITE_*` (frontend) / `Deno.env.get()` (edge). *(Bug real: `client.ts` tenía la URL+anon key hardcodeadas.)*
- [ ] Usar el **sistema NUEVO de API keys** (`sb_publishable_…` / `sb_secret_…`), **deshabilitar las legacy JWT keys** (Dashboard → API Keys). Las legacy filtradas quedan muertas.
- [ ] `service_role`/`sb_secret` **NUNCA** en el frontend — solo en env de edge functions.
- [ ] Token `sbp_` de Management API solo en `.env` **gitignored**; nunca commiteado (revisar `git log -p -- .env`).
- [ ] **Ningún secreto en tablas legibles por anon/no-admin** ni en GUC legibles (`current_setting`). Secretos al **Vault** o tabla con RLS sin grants a anon/authenticated.

**Base de datos**
- [ ] **NUNCA `GRANT ALL … TO anon`.** anon recibe SOLO lo que las rutas públicas necesitan.
- [ ] `REVOKE EXECUTE … FROM PUBLIC` en todas las funciones (Postgres da EXECUTE a PUBLIC por default → anon lo hereda).
- [ ] **Toda función `SECURITY DEFINER` que devuelve datos o escribe → guard interno** (bypasea RLS).
- [ ] Tablas financieras/PII con RLS por `is_sistema_user()`, **no** `USING(true)` para authenticated.
- [ ] `search_path` fijado en toda función SECDEF.
- [ ] Contraseñas de login hasheadas por GoTrue (bcrypt) — **nunca** guardar contraseñas en texto plano en tablas.
- [ ] Roles read-only **sin** editar/eliminar.
- [ ] Cuentas admin genéricas/compartidas (ej. `admin@…`) **eliminadas** — solo cuentas nominales.

**Auth**
- [ ] Signup **deshabilitado** salvo que el negocio lo requiera (y entonces: por dominio + captcha + autoconfirm off).
- [ ] **MFA** para admins · **Captcha** en login/forms públicos.

**Edge functions**
- [ ] Toda función `verify_jwt=false` con **gate de auth interno** (`authorizeAdminOrInternal`) o **firma HMAC** (webhooks).

**Storage**
- [ ] Buckets de **PII (firmas, comprobantes, documentos de identidad) PRIVADOS + signed URLs**. `getPublicUrl` SOLO para assets verdaderamente públicos (logos, imágenes de catálogo).

**Frontend / Deploy**
- [ ] Route guards reales: `AdminRoute` valida staff vía RPC `is_sistema_user` (NO query directo a `usuarios_sistema` — RLS lo bloquea). Recordar: el guard de cliente es solo UX; **la barrera real es RLS**.
- [ ] Sanitizar HTML enriquecido (DOMPurify) — anti-XSS.
- [ ] Config SPA del host correcta (build command + publish dir + redirect `/* → /index.html`).

**Auditoría**
- [ ] Triggers/`pgAudit` a nivel DB sobre tablas sensibles (el audit log de la app es ciego a escrituras de `service_role`/SQL).
- [ ] Log drains para trazabilidad HTTP >24h.

---

## 1. LLAVES Y SECRETOS

1. **Nada hardcodeado.** Frontend lee `import.meta.env.VITE_*`; edge lee `Deno.env.get()`. Fallback opcional a la **publishable** (pública), nunca a un secreto.
2. **Sistema nuevo de keys** (`sb_publishable_`/`sb_secret_`) y **legacy deshabilitadas**. Rotar la anon key NO es una medida de seguridad por sí sola.
3. **Llaves para cron/trigger → edge:** NO uses la `service_role` key (si se filtra, da acceso total). Usa un **secret interno de bajo privilegio** (`INTERNAL_FUNCTION_SECRET`) enviado en header `x-internal-secret`, guardado en una **tabla protegida**:
   ```sql
   CREATE TABLE public._app_secrets (clave text PRIMARY KEY, valor text NOT NULL);
   ALTER TABLE public._app_secrets ENABLE ROW LEVEL SECURITY;   -- sin policies → anon/auth denegados
   REVOKE ALL ON public._app_secrets FROM anon, authenticated, public;  -- solo postgres/service_role
   ```
   El trigger (SECDEF) lo lee y lo manda; el edge lo valida con `authorizeAdminOrInternal`. Si se filtra, el daño es acotado (solo invocar funciones guardadas, no acceso a DB).
4. **Nunca** un secreto en GUC `app.settings.*` legible por `current_setting`, ni en una tabla con grant/policy a anon (caso ProTaps secrets → mover a Vault).

---

## 2. BASE DE DATOS — RLS, GRANTS, FUNCIONES (el núcleo)

### 2.1 El anti-patrón que causó la brecha
`GRANT ALL ON ALL TABLES TO anon` + funciones SECDEF con `EXECUTE` a `PUBLIC` (default de Postgres). RLS estaba "encendido" pero **las funciones SECDEF bypasean RLS** y anon las heredaba. Resultado: `get_users_with_roles()` y `get_reembolsos_stats()` llamables por anon → fuga de usuarios y finanzas.

### 2.2 Reglas
- **anon least-privilege.** Revoca todo y re-otorga solo lo de rutas públicas:
  ```sql
  REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
  REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;   -- cierra la herencia
  ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
  REVOKE CREATE ON SCHEMA public FROM PUBLIC;
  -- luego: GRANT SELECT/INSERT/EXECUTE puntual solo a lo público
  ```
- **Guard en toda SECDEF que devuelve datos / escribe.** Patrón seguro (permite staff + service/triggers null-uid, bloquea autenticado-no-staff):
  ```sql
  IF auth.uid() IS NOT NULL AND NOT public.is_sistema_user() THEN
    RAISE EXCEPTION 'No autorizado' USING ERRCODE = 'insufficient_privilege';
  END IF;
  ```
  Usa `is_admin()` para operaciones admin-only; `is_sistema_user()` para staff general. Las funciones `sql` puras conviértelas a `plpgsql` para poder guardarlas.
- **Predicados SECDEF** (`is_admin`, `is_sistema_user`, `is_admin_or_manager`) deben ser `SECURITY DEFINER`, devolver boolean y **tener `EXECUTE` para anon+authenticated** (las RLS policies los invocan; sin grant, la evaluación RLS de anon falla).
- **RLS sin subquery directo a tablas protegidas.** Una policy con `EXISTS (SELECT 1 FROM usuarios_sistema …)` rompe a anon (no puede leer esa tabla). Usa el helper SECDEF: `USING (public.is_sistema_user())`. *(Bug real: policies de `eventos`/`cursos`.)*
- **Financiero/PII → `is_sistema_user()`**, no `USING(true)` para authenticated (estudiantes/artistas también son `authenticated`).
- **`search_path` fijado** en toda SECDEF: `SET search_path = public, pg_temp` (anti-hijacking).
- **Funciones de "SQL arbitrario"** (`execute_readonly_query` y similares) → solo `service_role`, jamás anon/authenticated.
- **Escritura pública (canje, inscripción) = RPC SECDEF** que inserta y devuelve, **NO** `.insert().select().single()` desde el cliente (anon no tiene SELECT para el `RETURNING`). Patrón: `crear_canje_publico`, `inscribir_estudiante_curso_publico`.
- **Roles:** un rol "Ver Todo" debe tener `crear/editar/eliminar = false`. Revisar el seed de permisos.
- **Vistas:** `security_invoker = true`; nunca `GRANT SELECT` de una vista a anon si subyace data sensible.

---

## 3. AUTH
- **Signup off** por default. Si se necesita: restringido por dominio + captcha + `mailer_autoconfirm=false`.
- **MFA** para admins; **Captcha** (hCaptcha/Turnstile) en auth/forms públicos.
- Contraseñas de login: bcrypt vía GoTrue. **Nunca** texto plano en tablas. (Caso a vigilar: campos `*_password` de plataformas externas → cifrar en reposo / Vault.)
- **Sin cuentas genéricas/compartidas** (admin@…). Cuentas nominales; al sacar a alguien, banear (`banned_until`) + reasignar referencias antes de borrar perfil.

---

## 4. EDGE FUNCTIONS
- Toda `verify_jwt=false` necesita gate interno. Helper reutilizable `_shared/auth.ts` → `authorizeAdminOrInternal(req, supabaseAdmin)` que acepta: (1) bearer == service_role, (2) header `x-internal-secret` == `INTERNAL_FUNCTION_SECRET`, (3) usuario admin (getUser + `is_admin_by_email`); rechaza la anon key.
  ```ts
  const authz = await authorizeAdminOrInternal(req, supabase)
  if (!authz.ok) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403, headers })
  ```
- **Webhooks** (verify_jwt=false por diseño): **firma HMAC-SHA256 sobre `{timestamp}.{rawBody}` + anti-replay (>5min rechaza)**, header `X-Webhook-Signature` (hex) + `X-Webhook-Timestamp`. Fail-closed cuando el `enforce` esté activo. Coordinar con el proveedor antes de activar para no parar producción.
- **Cero secretos hardcodeados** (`Deno.env.get` siempre).

---

## 5. STORAGE
- **Buckets de PII privados** (`public=false`) + `createSignedUrl(path, ttl)`. Guardar el **path**, no `getPublicUrl`. *(Casos: `artistas-firmas`, `comprobantes-pago`.)*
- Subida pública (anon) con policy **INSERT** acotada al bucket; **sin** policy de SELECT a anon en buckets de PII.
- Buckets públicos solo para assets realmente públicos (logos, imágenes de cursos).

---

## 6. FRONTEND
- Cero llaves quemadas (env). La publishable como fallback es aceptable (es pública).
- Route guards: `AdminRoute` valida staff con **RPC `is_sistema_user`** (no query directo a `usuarios_sistema`). `StudentProtectedRoute` para portal de estudiantes. **El guard de cliente solo oculta UI; RLS es la barrera real.**
- No mostrar secretos en claro (enmascarar + toggle de revelar).
- Sanitizar HTML enriquecido (DOMPurify) antes de `dangerouslySetInnerHTML`.

---

## 7. REPO / DEPLOY
- **Repo PRIVADO.** `.env` gitignored. Escanear historial por secretos.
- Gitignore de artefactos (`.playwright-mcp/`, `dist/`).
- Config SPA del host: build command + publish dir + redirect `/* → /index.html` (sin esto, deploy en blanco).

---

## 8. AUDITORÍA / MONITOREO
- El audit log de la app NO captura escrituras crudas de `service_role`/SQL → agregar **triggers de auditoría a nivel DB** o `pgAudit` sobre tablas sensibles.
- **Log drains** para trazabilidad HTTP >24h.

---

## 9. RUNBOOK DE INCIDENTE (contención reversible, sin pérdida de datos)
1. **Cortar anon:** `REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;` + `REVOKE EXECUTE ON ALL FUNCTIONS … FROM PUBLIC, anon;`
2. **Kill switch total (reversible 1 línea):** `REVOKE USAGE ON SCHEMA public FROM anon, authenticated;` (`service_role` conserva para webhooks).
3. **Logout global + ban:** `DELETE FROM auth.sessions; DELETE FROM auth.refresh_tokens; UPDATE auth.users SET banned_until='infinity';`
4. **Bloquear login/signup:** auth config `external_email_enabled=false, disable_signup=true`.
5. **Deshabilitar legacy keys** (Management API `PUT /api-keys/legacy?enabled=false`).
6. **Forense + restaurar:** hardening (sección 2) ANTES de reabrir → `GRANT USAGE` a authenticated → des-banear solo staff + reset password → re-grant **mínimo** a anon → smoke test → login por fases.
