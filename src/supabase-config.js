// Configuración de conexión a Supabase para Marabunta.
//
// La "anon key" es segura de exponer en el navegador — así está diseñado
// Supabase: los permisos reales los decide Row Level Security en la base
// de datos (ver docs/schema.sql), no el secreto de esta llave. Lo que
// NUNCA debe aparecer aquí ni en ningún archivo del repo es la
// "service_role key" (esa sí da acceso total, sin RLS).
//
// Cargar este archivo con <script src="src/supabase-config.js"></script>
// ANTES del SDK de Supabase y antes de la lógica de la app.

window.MARABUNTA_SUPABASE_URL = 'https://bbqirrgsgbokozarlpwc.supabase.co';
window.MARABUNTA_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJicWlycmdzZ2Jva296YXJscHdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2OTA4NzgsImV4cCI6MjEwNzI2Njg3OH0.iGb34l5zmFSlIPbAD7eZK_NGxnXp3PMoshN3NaWqzDM';
