# Arquitectura — Plan de migración

## Stack elegido

| Capa | Tecnología | Por qué |
|---|---|---|
| Base de datos | **Supabase (Postgres)** | Postgres real y administrado, con autenticación incluida (no hay que construir login/sesiones a mano) y una API REST/JS autogenerada sobre la base de datos (PostgREST), así que para v1 no necesitamos un backend propio aparte. |
| Autenticación | **Supabase Auth** | Email/password o magic link, suficiente para el equipo de prueba inicial. Cada fila queda asociada a un usuario real. |
| Frontend / hosting | **Vercel** (capa gratuita) | Despliegue automático en cada push a `main` desde este repo de GitHub. URL gratuita (`marabunta.vercel.app` o similar) hasta que se conecte un dominio propio. |
| Control de acceso a datos | **Row Level Security (RLS) de Postgres** | En vez de escribir reglas de permisos en un backend, se escriben como políticas en la base de datos — más difícil de saltarse por accidente. |

No se eligió un backend separado (FastAPI, Node, etc.) para v1: Supabase ya da base de datos + auth + API, y eso es suficiente para una sola empresa cliente con un equipo razonable de usuarios. Si más adelante se necesita lógica de negocio que no puede vivir en el navegador (por ejemplo, generación de PDFs del lado del servidor, integraciones con terceros, trabajos programados), se agregan **Supabase Edge Functions** sin tener que montar un servidor aparte.

## Principio de diseño: multi-empresa desde el día uno, sin construirlo todavía

v1 corre con una sola empresa cliente (la que esté probando el producto). Pero cada tabla que representa datos de negocio (no catálogos globales del sistema) tiene una columna `company_id`. Esto significa que:

- Hoy: todas las filas tienen el mismo `company_id` (el de esa empresa de prueba).
- El día que se necesite una segunda empresa cliente: es un cambio de permisos (RLS) y de UI (selector de empresa), no una migración de esquema ni una reescritura de datos.

## Principio de diseño: documento JSONB por "aggregate", no normalización total todavía

La app actual (`legacy/marabunta.html`) tiene una forma de datos muy anidada y todavía cambiante: cada proyecto tiene áreas con sub-grupos variables, requerimientos genéricos por área, secciones de planner con celdas por fecha, etc. Esa forma ha cambiado de versión en versión conforme se descubren necesidades reales del negocio de producción técnica de eventos.

Normalizar todo esto en tablas relacionales ahora — antes de que la forma esté estable — significaría una migración de esquema cada vez que cambie un detalle del Brief o del Planner. En vez de eso, v1 de la migración usa un patrón intermedio:

- **Entidades compartidas y consultables** (empresa, usuarios, catálogo de áreas/rubros, roster de personas, proveedores, venues, giras) → columnas reales, porque se buscan, filtran y reutilizan entre proyectos.
- **El cuerpo de cada proyecto** (brief, fechas, responsables por área, requerimientos, planner, mockup) → una sola columna `data JSONB` por proyecto, con la misma forma que ya usa la app hoy.

Esto da de inmediato lo que falta — persistencia real compartida, multiusuario, con historial de updates — sin forzar una re-arquitectura completa del modelo de datos antes de migrar. La normalización de partes específicas (por ejemplo, Planner como tablas propias) se puede hacer después, cuando esa parte del modelo esté estable, sin bloquear la migración completa.

## Fases

1. **Esquema inicial en Supabase** (`docs/schema.sql`) — tablas descritas arriba + políticas RLS básicas por `company_id`.
2. **Capa de datos en el frontend**: sustituir las funciones de `Store` (que hoy leen/escriben IndexedDB) por llamadas al cliente de Supabase (`supabase-js`), manteniendo el resto de la app (UI, lógica de negocio) sin tocar donde sea posible.
3. **Login**: pantalla de autenticación simple (Supabase Auth) antes de entrar a la app.
4. **Despliegue**: conectar el repo a Vercel, variables de entorno con la URL y la llave pública (`anon key`) de Supabase.
5. **Prueba con el equipo real** → ajustes → preparar para presentar a inversionistas.

## Lo que el usuario necesita hacer (no se puede hacer desde aquí)

Crear la cuenta/proyecto de Supabase requiere login humano (no hay forma de automatizarlo de forma segura desde esta sesión). Pasos:

1. Ir a https://supabase.com y crear una cuenta (gratis, con GitHub funciona directo).
2. Crear un nuevo proyecto — elegir una región cercana a México (ej. `us-east-1` o la más cercana disponible) y una contraseña de base de datos (guardarla, no se vuelve a mostrar).
3. Una vez creado, en **Project Settings → API** copiar:
   - `Project URL`
   - `anon public key`
4. Compartir esos dos valores (no la `service_role key`, esa nunca se comparte ni se sube al repo) para continuar con la conexión del frontend.
