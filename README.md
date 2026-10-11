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

- **Backend / DB:** Supabase (Postgres administrado + autenticación incluida)
- **Hosting:** Render o Fly.io (capa gratuita)
- **Alcance v1:** una sola empresa (EBS). Cada tabla incluye una columna `company_id` desde el día uno para que soportar multi-empresa después sea un cambio de permisos/UI, no una migración de datos.
- **Dominio:** URL gratuita por ahora (sin dominio propio todavía)

## Estructura del repo

```
legacy/         # la app monolítica actual (HTML/JS/CSS en un solo archivo), punto de partida
docs/           # decisiones de arquitectura, notas de migración
```

A medida que avance la migración, el código se irá separando en un frontend y un backend propios, y `legacy/` quedará solo como referencia histórica.
