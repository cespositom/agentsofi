-- ═══════════════════════════════════════════════════════════════
-- Sofia Voice Agent — Schema Supabase (self-hosted)
-- Ejecutar en SQL Editor del Supabase del proyecto.
-- ═══════════════════════════════════════════════════════════════

-- ─── Extensiones ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Enums ─────────────────────────────────────────────────────
do $$ begin
  create type lead_estatus as enum (
    'Pendiente de llamar', 'En proceso', 'Cita agendada',
    'No contestado', 'Sin interés', 'Cerrado'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type lead_temperatura as enum ('Hot', 'Warm', 'Cold');
exception when duplicate_object then null; end $$;

do $$ begin
  create type prop_operacion as enum ('Venta', 'Arriendo');
exception when duplicate_object then null; end $$;

do $$ begin
  create type prop_tipo as enum (
    'Casa', 'Departamento', 'Parcela', 'Oficina',
    'Local Comercial', 'Terreno', 'Bodega'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type llamada_tipo as enum ('Inbound', 'Outbound');
exception when duplicate_object then null; end $$;

do $$ begin
  create type llamada_resultado as enum (
    'Contestada', 'No contestada', 'Buzón', 'Colgada', 'Error'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type llamada_sentimiento as enum ('Positivo', 'Neutral', 'Negativo');
exception when duplicate_object then null; end $$;

do $$ begin
  create type visita_estado as enum (
    'Solicitada', 'Confirmada', 'Realizada', 'Cancelada', 'No-show'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_rol as enum ('admin', 'ejecutivo');
exception when duplicate_object then null; end $$;

-- ─── Perfiles (espejo de auth.users con rol) ───────────────────
create table if not exists public.perfiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nombre      text not null,
  email       text not null unique,
  rol         user_rol not null default 'ejecutivo',
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ─── Helper: rol del usuario actual ────────────────────────────
-- search_path = '' fija el resolver a vacío y obliga a calificar todo
-- (mitiga lint function_search_path_mutable de Supabase).
create or replace function public.auth_rol() returns public.user_rol
language sql stable security definer set search_path = '' as $$
  select rol from public.perfiles where id = auth.uid()
$$;

create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select rol = 'admin' from public.perfiles where id = auth.uid()), false)
$$;

-- ─── Trigger: auto-crear perfil al hacer signup ────────────────
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.perfiles (id, nombre, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Propiedades ───────────────────────────────────────────────
create table if not exists public.propiedades (
  id              uuid primary key default uuid_generate_v4(),
  nombre          text not null,
  tipo            prop_tipo not null,
  operacion       prop_operacion not null,
  precio          numeric not null,         -- UF para venta, CLP para arriendo
  comuna          text not null,
  dormitorios     int,
  banos           int,
  m2              int,
  amenidades      text[] default '{}',
  direccion       text,
  disponible      boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_propiedades_disponible on public.propiedades(disponible);
create index if not exists idx_propiedades_comuna on public.propiedades(comuna);
create index if not exists idx_propiedades_tipo on public.propiedades(tipo);

-- ─── Leads ─────────────────────────────────────────────────────
create table if not exists public.leads (
  id                  uuid primary key default uuid_generate_v4(),
  nombre              text not null,
  telefono            text not null unique,
  email               text,
  estatus             lead_estatus not null default 'En proceso',
  temperatura         lead_temperatura not null default 'Warm',
  fuente              text default 'Llamada entrante',
  presupuesto         numeric,
  comunas_interes     text[] default '{}',
  tipos_buscados      text[] default '{}',
  operacion_buscada   text,
  notas               text,
  siguiente_accion    text,
  resumen_ia          text,
  intentos            int not null default 0,
  ejecutivo_id        uuid references public.perfiles(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_leads_telefono on public.leads(telefono);
create index if not exists idx_leads_estatus on public.leads(estatus);
create index if not exists idx_leads_temperatura on public.leads(temperatura);
create index if not exists idx_leads_ejecutivo on public.leads(ejecutivo_id);  -- FK

-- ─── Llamadas ──────────────────────────────────────────────────
create table if not exists public.llamadas (
  id                uuid primary key default uuid_generate_v4(),
  lead_id           uuid references public.leads(id) on delete set null,
  titulo            text,
  tipo              llamada_tipo not null,
  resultado         llamada_resultado,
  telefono          text not null,
  nombre_lead       text,
  duracion_seg      int default 0,
  resumen           text,
  transcripcion     text,
  sentimiento       llamada_sentimiento default 'Neutral',
  cita_agendada     boolean default false,
  retell_call_id    text unique,
  created_at        timestamptz not null default now()
);

create index if not exists idx_llamadas_lead on public.llamadas(lead_id);
create index if not exists idx_llamadas_telefono on public.llamadas(telefono);
create index if not exists idx_llamadas_created on public.llamadas(created_at desc);

-- ─── Visitas (reemplaza Cal.com) ───────────────────────────────
create table if not exists public.visitas (
  id              uuid primary key default uuid_generate_v4(),
  lead_id         uuid references public.leads(id) on delete cascade,
  propiedad_id    uuid references public.propiedades(id) on delete set null,
  ejecutivo_id    uuid references public.perfiles(id),
  fecha_hora      timestamptz not null,
  duracion_min    int default 60,
  estado          visita_estado not null default 'Solicitada',
  notas           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_visitas_fecha on public.visitas(fecha_hora);
create index if not exists idx_visitas_lead on public.visitas(lead_id);
create index if not exists idx_visitas_estado on public.visitas(estado);
create index if not exists idx_visitas_propiedad on public.visitas(propiedad_id);   -- FK
create index if not exists idx_visitas_ejecutivo on public.visitas(ejecutivo_id);   -- FK

-- ─── Updated_at automático ─────────────────────────────────────
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_propiedades_updated on public.propiedades;
create trigger trg_propiedades_updated before update on public.propiedades
  for each row execute function public.set_updated_at();

drop trigger if exists trg_leads_updated on public.leads;
create trigger trg_leads_updated before update on public.leads
  for each row execute function public.set_updated_at();

drop trigger if exists trg_visitas_updated on public.visitas;
create trigger trg_visitas_updated before update on public.visitas
  for each row execute function public.set_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- RLS — todos los usuarios autenticados leen, admin gestiona
-- ═══════════════════════════════════════════════════════════════
alter table public.perfiles    enable row level security;
alter table public.propiedades enable row level security;
alter table public.leads       enable row level security;
alter table public.llamadas    enable row level security;
alter table public.visitas     enable row level security;

-- Perfiles: cada uno se ve a sí mismo, admin ve todos
drop policy if exists perfiles_select on public.perfiles;
create policy perfiles_select on public.perfiles for select to authenticated
  using (id = auth.uid() or es_admin());

drop policy if exists perfiles_update_self on public.perfiles;
create policy perfiles_update_self on public.perfiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid() and rol = (select rol from public.perfiles where id = auth.uid()));

drop policy if exists perfiles_admin_all on public.perfiles;
create policy perfiles_admin_all on public.perfiles for all to authenticated
  using (es_admin()) with check (es_admin());

-- Propiedades: lectura todos, escritura admin
drop policy if exists propiedades_select on public.propiedades;
create policy propiedades_select on public.propiedades for select to authenticated using (true);

drop policy if exists propiedades_admin on public.propiedades;
create policy propiedades_admin on public.propiedades for all to authenticated
  using (es_admin()) with check (es_admin());

-- Leads: lectura todos, modificación admin o ejecutivo asignado
drop policy if exists leads_select on public.leads;
create policy leads_select on public.leads for select to authenticated using (true);

drop policy if exists leads_insert on public.leads;
create policy leads_insert on public.leads for insert to authenticated with check (true);

drop policy if exists leads_update on public.leads;
create policy leads_update on public.leads for update to authenticated
  using (es_admin() or ejecutivo_id = auth.uid())
  with check (es_admin() or ejecutivo_id = auth.uid());

drop policy if exists leads_delete on public.leads;
create policy leads_delete on public.leads for delete to authenticated using (es_admin());

-- Llamadas: lectura todos, insertar/modificar admin (el backend usa service_role)
drop policy if exists llamadas_select on public.llamadas;
create policy llamadas_select on public.llamadas for select to authenticated using (true);

drop policy if exists llamadas_admin on public.llamadas;
create policy llamadas_admin on public.llamadas for all to authenticated
  using (es_admin()) with check (es_admin());

-- Visitas: lectura todos, modificación admin o ejecutivo dueño
drop policy if exists visitas_select on public.visitas;
create policy visitas_select on public.visitas for select to authenticated using (true);

drop policy if exists visitas_insert on public.visitas;
create policy visitas_insert on public.visitas for insert to authenticated with check (true);

drop policy if exists visitas_update on public.visitas;
create policy visitas_update on public.visitas for update to authenticated
  using (es_admin() or ejecutivo_id = auth.uid())
  with check (es_admin() or ejecutivo_id = auth.uid());

drop policy if exists visitas_delete on public.visitas;
create policy visitas_delete on public.visitas for delete to authenticated using (es_admin());

-- ═══════════════════════════════════════════════════════════════
-- Vista útil para el dashboard
-- ═══════════════════════════════════════════════════════════════
create or replace view public.kpi_resumen
with (security_invoker = on) as
select
  (select count(*) from public.leads where estatus = 'Pendiente de llamar') as leads_pendientes,
  (select count(*) from public.leads where temperatura = 'Hot')              as leads_hot,
  (select count(*) from public.visitas where fecha_hora >= now()
                                          and estado in ('Solicitada','Confirmada')) as visitas_proximas,
  (select count(*) from public.llamadas where created_at >= now() - interval '24 hours') as llamadas_24h,
  (select count(*) from public.propiedades where disponible)                 as propiedades_disponibles;

-- ═══════════════════════════════════════════════════════════════
-- Fin del schema. Para crear el primer admin:
--   1) Registrar usuario desde la webapp (/login → signup)
--   2) Ejecutar:  update public.perfiles set rol = 'admin' where email = 'tu@email.cl';
-- ═══════════════════════════════════════════════════════════════
