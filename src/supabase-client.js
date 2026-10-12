// Cliente de Supabase para Marabunta.
//
// Carga ANTES de este archivo, en este orden, en el HTML:
//   1. src/supabase-config.js
//   2. SDK de Supabase (CDN): https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2
//   3. este archivo (src/supabase-client.js)
//
// Expone window.marabuntaDB, el punto único de acceso a la base de datos.
// La idea es que las funciones que hoy leen/escriben en Store (IndexedDB)
// se vayan sustituyendo, una por una, por llamadas a marabuntaDB — sin
// tener que reescribir toda la app de golpe.

(function () {
  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('[Marabunta] SDK de Supabase no cargado. Revisa el orden de los <script> en el HTML.');
    return;
  }
  if (!window.MARABUNTA_SUPABASE_URL || !window.MARABUNTA_SUPABASE_ANON_KEY) {
    console.error('[Marabunta] Faltan credenciales de Supabase. Revisa src/supabase-config.js.');
    return;
  }

  const client = window.supabase.createClient(
    window.MARABUNTA_SUPABASE_URL,
    window.MARABUNTA_SUPABASE_ANON_KEY
  );

  let cachedCompanyId = null;
  async function miCompanyId() {
    if (cachedCompanyId) return cachedCompanyId;
    const { data: session } = await client.auth.getSession();
    const uid = session?.session?.user?.id;
    if (!uid) throw new Error('No hay sesión activa — inicia sesión primero.');
    const { data, error } = await client.from('profiles').select('company_id').eq('id', uid).single();
    if (error) throw error;
    cachedCompanyId = data.company_id;
    return cachedCompanyId;
  }

  window.marabuntaDB = {
    client,
    companyId: miCompanyId,

    // ---- Autenticación ----
    async signIn(email, password) {
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },
    async signOut() {
      const { error } = await client.auth.signOut();
      if (error) throw error;
    },
    async sesionActual() {
      const { data } = await client.auth.getSession();
      return data.session;
    },

    // ---- Proyectos ----
    // Cada proyecto se guarda como una fila con su cuerpo completo en
    // data (JSONB) — misma forma que ya usa la app hoy (ver docs/schema.sql).
    // Se guarda/borra por id de proyecto, nunca reescribiendo la tabla
    // entera, para que dos personas editando proyectos distintos al mismo
    // tiempo no se pisen el trabajo.
    async listarProyectos() {
      const { data, error } = await client
        .from('proyectos')
        .select('id, nombre, estado, data, updated_at')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    async obtenerProyecto(id) {
      const { data, error } = await client
        .from('proyectos')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    async guardarProyecto(proyecto) {
      return window.marabuntaTrackWrite((async () => {
        // proyecto.data debe ser el objeto completo que hoy produce ensureProyecto().
        const payload = {
          id: proyecto.id,
          company_id: await miCompanyId(),
          nombre: proyecto.nombre || proyecto.data?.artista || proyecto.data?.eventoId || '',
          estado: proyecto.data?.estado || 'prospecto',
          data: proyecto.data,
          updated_at: new Date().toISOString(),
        };
        const { data, error } = await client
          .from('proyectos')
          .upsert(payload)
          .select()
          .single();
        if (error) throw error;
        return data;
      })());
    },
    async eliminarProyecto(id) {
      return window.marabuntaTrackWrite((async () => {
        const { error } = await client.from('proyectos').delete().eq('id', id);
        if (error) throw error;
      })());
    },
    async eliminarTodosLosProyectos() {
      return window.marabuntaTrackWrite((async () => {
        const cid = await miCompanyId();
        const { error } = await client.from('proyectos').delete().eq('company_id', cid);
        if (error) throw error;
      })());
    },

    // ---- Roster, proveedores, venues, giras, catálogo de áreas ----
    // Mismo patrón para las demás entidades compartidas; se agregan
    // conforme se van sustituyendo las llamadas a Store en la app.
  };
})();
