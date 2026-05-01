-- ═══════════════════════════════════════════════════════════════
-- Fix linter: function_search_path_mutable (4 funciones)
-- Ejecutar en SQL Editor del Supabase del proyecto.
-- ═══════════════════════════════════════════════════════════════

alter function public.auth_rol()        set search_path = '';
alter function public.es_admin()        set search_path = '';
alter function public.handle_new_user() set search_path = '';
alter function public.set_updated_at()  set search_path = '';

-- Verificación
select n.nspname as schema,
       p.proname as function,
       coalesce(
         (select string_agg(c, ',') from unnest(p.proconfig) c where c like 'search_path=%'),
         '<mutable>'
       ) as search_path_setting
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('auth_rol', 'es_admin', 'handle_new_user', 'set_updated_at');

select 'OK: search_path fijado en las 4 funciones' as resultado;
