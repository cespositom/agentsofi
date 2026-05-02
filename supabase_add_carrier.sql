-- ═══════════════════════════════════════════════════════════════
-- Agregar columna carrier a llamadas y KPIs por carrier
-- ═══════════════════════════════════════════════════════════════

alter table public.llamadas
  add column if not exists carrier text default 'twilio';

create index if not exists idx_llamadas_carrier on public.llamadas(carrier);

-- Vista actualizada con desglose por carrier
create or replace view public.kpi_resumen
with (security_invoker = on) as
select
  (select count(*) from public.leads where estatus = 'Pendiente de llamar') as leads_pendientes,
  (select count(*) from public.leads where temperatura = 'Hot')              as leads_hot,
  (select count(*) from public.visitas where fecha_hora >= now()
                                          and estado in ('Solicitada','Confirmada')) as visitas_proximas,
  (select count(*) from public.llamadas where created_at >= now() - interval '24 hours') as llamadas_24h,
  (select count(*) from public.propiedades where disponible)                 as propiedades_disponibles,
  -- Costos últimas 24h
  (select coalesce(sum(costo_retell_usd), 0) from public.llamadas
     where created_at >= now() - interval '24 hours')                        as costo_retell_24h_usd,
  (select coalesce(sum(costo_twilio_usd), 0) from public.llamadas
     where created_at >= now() - interval '24 hours')                        as costo_twilio_24h_usd,
  (select coalesce(sum(costo_retell_usd + costo_twilio_usd), 0) from public.llamadas
     where created_at >= now() - interval '24 hours')                        as costo_24h_usd,
  -- Costos histórico
  (select coalesce(sum(costo_retell_usd), 0) from public.llamadas)           as costo_retell_total_usd,
  (select coalesce(sum(costo_twilio_usd), 0) from public.llamadas)           as costo_twilio_total_usd,
  (select coalesce(sum(costo_retell_usd + costo_twilio_usd), 0) from public.llamadas) as costo_total_usd,
  -- Conteo por carrier (últimas 24h)
  (select count(*) from public.llamadas where carrier='twilio'
     and created_at >= now() - interval '24 hours')                          as calls_twilio_24h,
  (select count(*) from public.llamadas where carrier='telnyx'
     and created_at >= now() - interval '24 hours')                          as calls_telnyx_24h;

select 'OK: columna carrier + vista actualizada' as resultado;
