-- ═══════════════════════════════════════════════════════════════
-- Fix linter: unindexed_foreign_keys (3 FKs)
-- Ejecutar en SQL Editor del Supabase del proyecto.
-- ═══════════════════════════════════════════════════════════════
-- Sin estos índices, eliminar/actualizar un perfil o propiedad
-- forza un seq scan en la tabla hija para validar la FK.

create index if not exists idx_leads_ejecutivo    on public.leads(ejecutivo_id);
create index if not exists idx_visitas_propiedad  on public.visitas(propiedad_id);
create index if not exists idx_visitas_ejecutivo  on public.visitas(ejecutivo_id);

-- Verificación
select tablename, indexname
from pg_indexes
where schemaname = 'public'
  and indexname in ('idx_leads_ejecutivo','idx_visitas_propiedad','idx_visitas_ejecutivo')
order by tablename, indexname;

select 'OK: 3 indices FK creados' as resultado;
