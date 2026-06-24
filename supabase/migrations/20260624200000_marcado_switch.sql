-- Switch maestro "Marcado automático": activa/pausa el motor de marcado saliente,
-- de forma independiente a la integración RingCentral. El motor (call_engine) hace
-- early-return si esta fila no está activa. Default OFF (seguro): no marca hasta que
-- un admin lo encienda explícitamente desde Configuración.
insert into public.app_integraciones (clave, nombre, config, activo)
values ('marcado', 'Marcado automático', '{}'::jsonb, false)
on conflict (clave) do nothing;
