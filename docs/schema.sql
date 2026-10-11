-- Marabunta — esquema inicial para Supabase (Postgres)
-- Ver docs/architecture.md para el razonamiento detrás de estas decisiones.
--
-- Patrón: entidades compartidas como columnas reales; el cuerpo de cada
-- proyecto como JSONB (misma forma que ya usa legacy/marabunta.html),
-- para no bloquear la migración en una normalización completa todavía.

-- ========== Empresas (multi-tenant desde el día 1, un solo registro por ahora) ==========
create table companies (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  created_at  timestamptz not null default now()
);

insert into companies (nombre) values ('EBS Group');

-- ========== Perfiles de usuario (1:1 con auth.users de Supabase) ==========
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references companies(id),
  nombre      text not null default '',
  puesto      text not null default '',
  created_at  timestamptz not null default now()
);

-- ========== Catálogo de áreas y rubros (editable en Configuración) ==========
create table areas_catalogo (
  id          uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  nombre      text not null,
  tipo        text not null default 'generico', -- 'steel' | 'eps' | 'generico'
  rubros      jsonb not null default '[]',       -- lista de sub-grupos (ej. Stage, Roof System, Wings...)
  orden       int not null default 0,
  created_at  timestamptz not null default now()
);

-- ========== Roster de personas (se reutilizan entre proyectos) ==========
create table roster_personas (
  id          uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  data        jsonb not null default '{}', -- nombre, empresa, puesto, telefono, email, areaId, etc.
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ========== Proveedores (empresas con catálogo de servicios) ==========
create table proveedores (
  id          uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  data        jsonb not null default '{}', -- nombre, contacto, telefono, email, servicios[]
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ========== Venues ==========
create table venues (
  id          uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  data        jsonb not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ========== Giras (tours) ==========
create table giras (
  id          uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id),
  nombre      text not null,
  artista     text not null default '',
  created_at  timestamptz not null default now()
);

-- ========== Proyectos (el núcleo: Brief, Planner, Crew, Mockup, etc.) ==========
create table proyectos (
  id            uuid primary key default gen_random_uuid(),
  company_id   uuid not null references companies(id),
  gira_id      uuid references giras(id),
  venue_id     uuid references venues(id),
  nombre        text not null default '',
  estado        text not null default 'prospecto', -- prospecto | confirmado | en_curso | cerrado
  data          jsonb not null default '{}', -- areas, fechas, responsablesPorArea, reqGenerico(Grupos),
                                               -- reqSteel/reqDelay/reqPanel/reqCable, secciones de planner, mockup
  created_by   uuid references profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_proyectos_company on proyectos(company_id);
create index idx_roster_company on roster_personas(company_id);
create index idx_proveedores_company on proveedores(company_id);

-- ========== Row Level Security: cada usuario solo ve datos de su propia empresa ==========
alter table companies enable row level security;
alter table profiles enable row level security;
alter table areas_catalogo enable row level security;
alter table roster_personas enable row level security;
alter table proveedores enable row level security;
alter table venues enable row level security;
alter table giras enable row level security;
alter table proyectos enable row level security;

-- Función auxiliar: company_id del usuario autenticado
create or replace function current_company_id()
returns uuid language sql stable as $$
  select company_id from profiles where id = auth.uid()
$$;

-- Política genérica: leer/escribir solo filas de la propia empresa.
-- (Se repite por tabla porque Postgres no permite políticas "globales".)
create policy "misma empresa" on profiles
  for all using (company_id = current_company_id());
create policy "misma empresa" on areas_catalogo
  for all using (company_id = current_company_id());
create policy "misma empresa" on roster_personas
  for all using (company_id = current_company_id());
create policy "misma empresa" on proveedores
  for all using (company_id = current_company_id());
create policy "misma empresa" on venues
  for all using (company_id = current_company_id());
create policy "misma empresa" on giras
  for all using (company_id = current_company_id());
create policy "misma empresa" on proyectos
  for all using (company_id = current_company_id());
