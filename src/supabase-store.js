// Reemplazo de Store (IndexedDB) usando Supabase, con la MISMA interfaz
// que ya usa legacy/marabunta.html: get(key) / set(key,value) / delete(key).
// Por eso no hace falta tocar persistProyectos(), persistPersonas(), etc. —
// solo apuntar `const Store = ...` a window.SupabaseStore cuando haya sesión.
//
// Guarda cada colección completa (proyectos, personas, giras, venues, ...)
// como un bloque en app_state, igual que hacía IndexedDB. Es el paso de
// menor riesgo para tener persistencia real y compartida ya; separar cada
// proyecto en su propia fila (tabla `proyectos` de schema.sql) es el
// siguiente paso, una vez que esto esté probado con el equipo.
//
// Carga ANTES de este archivo, en este orden:
//   1. src/supabase-config.js
//   2. SDK de Supabase (CDN)
//   3. src/supabase-client.js   (da window.marabuntaDB.client)
//   4. este archivo             (da window.SupabaseStore)

(function () {
  if (!window.marabuntaDB || !window.marabuntaDB.client) {
    console.error('[Marabunta] supabase-client.js debe cargar antes que supabase-store.js');
    return;
  }
  const client = window.marabuntaDB.client;

  let cachedCompanyId = null;
  async function companyId() {
    if (cachedCompanyId) return cachedCompanyId;
    const { data: session } = await client.auth.getSession();
    const uid = session?.session?.user?.id;
    if (!uid) throw new Error('No hay sesión activa — inicia sesión primero.');
    const { data, error } = await client.from('profiles').select('company_id').eq('id', uid).single();
    if (error) throw error;
    cachedCompanyId = data.company_id;
    return cachedCompanyId;
  }

  window.SupabaseStore = {
    async get(key) {
      const cid = await companyId();
      const { data, error } = await client
        .from('app_state')
        .select('value')
        .eq('company_id', cid)
        .eq('key', key)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('not found');
      return { key, value: data.value, shared: true };
    },
    async set(key, value) {
      const cid = await companyId();
      const { error } = await client
        .from('app_state')
        .upsert({ company_id: cid, key, value, updated_at: new Date().toISOString() }, { onConflict: 'company_id,key' });
      if (error) throw error;
      return { key, value, shared: true };
    },
    async delete(key) {
      const cid = await companyId();
      const { error } = await client.from('app_state').delete().eq('company_id', cid).eq('key', key);
      if (error) throw error;
      return { key, deleted: true, shared: true };
    },
  };
})();
