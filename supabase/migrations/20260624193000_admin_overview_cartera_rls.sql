-- admin_overview v2: agrega "cartera" (leads asignados) y "cartera_activa" por asesor,
-- para que el admin vea cuántos leads tiene cada asesor.
-- Además endurece el RLS de call_queue: el SELECT permisivo (is_sistema_user) dejaba que
-- CUALQUIER usuario_sistema —incluidos asesores— viera TODA la cola. Ahora: admin ve todo;
-- asesor ve solo lo suyo (vía la policy cq_asesor_select existente).

create or replace function public.admin_overview(p_from timestamptz, p_to timestamptz)
returns json language plpgsql security definer set search_path = public as $$
declare result json;
begin
  if auth.role() = 'anon' or (auth.role() = 'authenticated' and not public.is_admin()) then
    raise exception 'No autorizado' using errcode = 'insufficient_privilege';
  end if;
  select json_build_object(
    'funnel', json_build_object(
      'leads', (select count(*) from leads l where l.created_at >= p_from and l.created_at < p_to),
      'contactados', (select count(distinct ca.lead_id) from call_attempts ca where ca.outcome='contactado' and ca.inicio_at >= p_from and ca.inicio_at < p_to),
      'cotizaciones', (select count(*) from leads l where l.cotizacion_enviada_at >= p_from and l.cotizacion_enviada_at < p_to),
      'ganados', (select count(distinct s.lead_id) from seguimientos s where s.disposicion='ganado' and s.creado_en >= p_from and s.creado_en < p_to),
      'perdidos', (select count(distinct s.lead_id) from seguimientos s where s.disposicion in ('no_interesado','numero_equivocado') and s.creado_en >= p_from and s.creado_en < p_to),
      'monto_prom', (select coalesce(round(avg(l.cotizacion_monto)::numeric,0),0) from leads l where l.cotizacion_enviada_at >= p_from and l.cotizacion_enviada_at < p_to and l.cotizacion_monto is not null)
    ),
    'asesores', (select coalesce(json_agg(row_to_json(a)), '[]'::json) from (
      select ase.id, ase.nombre,
        (select count(*) from call_queue cq where cq.asesor_id=ase.id) as cartera,
        (select count(*) from call_queue cq where cq.asesor_id=ase.id and cq.estado='pending') as cartera_activa,
        (select count(*) from call_attempts ca where ca.asesor_id=ase.id and ca.inicio_at >= p_from and ca.inicio_at < p_to) as dials,
        (select count(distinct ca.lead_id) from call_attempts ca where ca.asesor_id=ase.id and ca.outcome='contactado' and ca.inicio_at >= p_from and ca.inicio_at < p_to) as contactados,
        (select count(distinct s.lead_id) from seguimientos s where s.asesor_id=ase.id and s.disposicion='cotizacion_enviada' and s.creado_en >= p_from and s.creado_en < p_to) as cotizaciones,
        (select count(distinct s.lead_id) from seguimientos s where s.asesor_id=ase.id and s.disposicion='ganado' and s.creado_en >= p_from and s.creado_en < p_to) as ganados,
        (select coalesce(round(avg(ca.talk_time_sec)::numeric,0),0) from call_attempts ca where ca.asesor_id=ase.id and ca.outcome='contactado' and ca.inicio_at >= p_from and ca.inicio_at < p_to) as avg_talk_sec,
        (select count(*) from seguimientos s where s.asesor_id=ase.id and s.estado in ('pendiente','avisado')) as seg_pendientes,
        (select count(*) from seguimientos s where s.asesor_id=ase.id and s.estado in ('pendiente','avisado') and s.programado_para < now()) as seg_vencidos
      from asesores ase where ase.activo = true order by ase.orden
    ) a),
    'seguimientos', json_build_object(
      'pendientes', (select count(*) from seguimientos s where s.estado in ('pendiente','avisado')),
      'vencidos', (select count(*) from seguimientos s where s.estado in ('pendiente','avisado') and s.programado_para < now()),
      'hoy', (select count(*) from seguimientos s where s.estado in ('pendiente','avisado') and s.programado_para::date = (now() at time zone 'America/New_York')::date)
    )
  ) into result;
  return result;
end; $$;
revoke execute on function public.admin_overview(timestamptz, timestamptz) from public;
grant execute on function public.admin_overview(timestamptz, timestamptz) to authenticated;

drop policy if exists call_queue_select on public.call_queue;
create policy call_queue_select on public.call_queue for select using (public.is_admin());
