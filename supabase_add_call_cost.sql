-- ═══════════════════════════════════════════════════════════════
-- Agregar columnas de costo a la tabla llamadas
-- Retell devuelve combined_cost (centavos USD) por cada call.
-- ═══════════════════════════════════════════════════════════════

alter table public.llamadas
  add column if not exists costo_usd     numeric(10,4) default 0,
  add column if not exists costo_detalle jsonb;

-- Vista actualizada de KPIs con costo
create or replace view public.kpi_resumen
with (security_invoker = on) as
select
  (select count(*) from public.leads where estatus = 'Pendiente de llamar') as leads_pendientes,
  (select count(*) from public.leads where temperatura = 'Hot')              as leads_hot,
  (select count(*) from public.visitas where fecha_hora >= now()
                                          and estado in ('Solicitada','Confirmada')) as visitas_proximas,
  (select count(*) from public.llamadas where created_at >= now() - interval '24 hours') as llamadas_24h,
  (select count(*) from public.propiedades where disponible)                 as propiedades_disponibles,
  (select coalesce(sum(costo_usd), 0) from public.llamadas
     where created_at >= now() - interval '24 hours')                        as costo_24h_usd,
  (select coalesce(sum(costo_usd), 0) from public.llamadas)                  as costo_total_usd;

select 'OK: columnas costo + vista actualizada' as resultado;
