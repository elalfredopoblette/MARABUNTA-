# Marabunta

Plataforma operativa para EBS Group — planeación de proyectos, costeo, roster/crew, ruta crítica, mockup isométrico de estructuras, documentación operativa (protocolos de clima, estaciones WeatherLink) y proveedores.

## Estado actual

Esta es la primera versión del repo. Contiene la app monolítica (un solo archivo HTML, sin backend) tal como se venía desarrollando y publicando como artifact. Vive en `legacy/marabunta.html` mientras migramos a una arquitectura con backend real.

**No abrir `legacy/marabunta.html` esperando que sea la versión final** — es el punto de partida para la migración, no el producto migrado.

## Por qué migrar

La versión actual usa IndexedDB en el navegador: sin cuentas, sin sincronización entre dispositivos, y cada usuario tiene su propia copia de los datos. Para probarlo con el equipo real y presentarlo a inversionistas, necesita:

- Un backend con base de datos real (persistencia compartida, no por navegador)
- Autenticación (saber quién hizo qué)
- Una URL estable, accesible desde cualquier dispositivo

## Plan de migración (en progreso)

- **Backend / DB:** Supabase (Postgres administrado + autenticación incluida) — proyecto ya creado
- **Hosting:** Vercel (capa gratuita), desplegado directo desde este repo
- **Alcance v1:** una sola empresa (EBS). Cada tabla incluye una columna `company_id` desde el día uno para que soportar multi-empresa después sea un cambio de permisos/UI, no una migración de datos.
- **Dominio:** URL gratuita por ahora (sin dominio propio todavía)

Ver `docs/architecture.md` para el razonamiento completo.

## Estado de la migración

- [x] Repo creado, app actual guardada en `legacy/`
- [x] Esquema de base de datos diseñado (`docs/schema.sql`)
- [x] Proyecto de Supabase creado y conectado (`src/supabase-config.js`, `src/supabase-client.js`)
- [x] Esquema corrido en Supabase (tablas + RLS por empresa)
- [x] Pantalla de login
- [x] Store (IndexedDB) sustituido por Supabase (`src/supabase-store.js`) — como toda la app ya pasaba por esa misma pieza, Proyectos, Roster, Proveedores, Giras, Venues, catálogo de áreas y Protocolos quedaron conectados de un jalón
- [x] Desplegado en Vercel: https://marabunta.vercel.app/legacy/marabunta.html
- [x] Probado de punta a punta: login real + carga de la app — funcionando
- [ ] Probar que guardar datos nuevos (crear un proyecto de prueba) persiste y se ve igual desde otro dispositivo/sesión
- [ ] Separar `proyectos` en filas propias en vez de un solo bloque (ver tablas ya creadas en `docs/schema.sql`) — optimización para después, no bloquea el uso actual
- [ ] Dominio propio (cuando se decida)

## Estructura del repo

```
legacy/         # la app monolítica actual (HTML/JS/CSS en un solo archivo), punto de partida
src/            # capa de conexión a Supabase (cliente, config) que va sustituyendo a Store/IndexedDB
docs/           # decisiones de arquitectura, esquema de base de datos
```

A medida que avance la migración, el código se irá separando en un frontend propio, y `legacy/` quedará solo como referencia histórica.
