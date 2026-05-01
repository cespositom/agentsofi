-- ═══════════════════════════════════════════════════════════════
-- Agregar columnas de costo a la tabla llamadas
-- Retell devuelve combined_cost (LLM+TTS+STT) en centavos USD.
-- Twilio (carrier) se cobra aparte por minuto en BYOC SIP trunking.
-- ═══════════════════════════════════════════════════════════════

alter table public.llamadas
  add column if not exists costo_retell_usd numeric(10,4) default 0,
  add column if not exists costo_twilio_usd numeric(10,4) default 0,
  add column if not exists costo_detalle    jsonb;

-- Migración suave: si ya existía costo_usd (de la versión anterior), copiar a costo_retell_usd
do $$ begin
  if exists (select 1 from information_schema.columns
              where table_schema='public' and table_name='llamadas' and column_name='costo_usd') then
    update public.llamadas
       set costo_retell_usd = coalesce(costo_usd, 0)
     where costo_retell_usd = 0 and costo_usd is not null;
    -- Mantenemos la columna vieja por compatibilidad pero el código nuevo usa las nuevas
  end if;
end $$;

-- Tarifa Twilio outbound móvil Chile (USD/min). Editable acá si cambia.
create or replace function public.twilio_rate_per_min() returns numeric
language sql immutable set search_path = '' as $$
  select 0.20::numeric
$$;

-- Vista actualizada de KPIs con desglose Retell + Twilio + Total
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
  (select coalesce(sum(costo_retell_usd + costo_twilio_usd), 0) from public.llamadas) as costo_total_usd;

select 'OK: columnas costo Retell + Twilio + vista actualizada' as resultado;
