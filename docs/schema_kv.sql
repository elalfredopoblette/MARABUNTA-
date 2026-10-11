-- Marabunta — tabla puente para la migración del Store (llave/valor)
--
-- La app actual persiste todo como bloques llave/valor (Store.get/set):
-- 'proyectos' guarda TODOS los proyectos en un solo arreglo, 'personas'
-- todo el roster, etc. Esta tabla replica esa misma forma en Supabase,
-- para poder sustituir el motor de guardado (IndexedDB -> Supabase) sin
-- reescribir la lógica de negocio todavía.
--
-- Las tablas ya creadas en schema.sql (proyectos, roster_personas, etc.)
-- siguen siendo el destino final una vez que se separe cada proyecto en
-- su propia fila; esta tabla es el paso intermedio de menor riesgo.

create table app_state (
  company_id  uuid not null references companies(id),
  key         text not null,
  value       text not null,
  updated_at  timestamptz not null default now(),
  primary key (company_id, key)
);

alter table app_state enable row level security;

create policy "misma empresa" on app_state
  for all using (company_id = current_company_id());
