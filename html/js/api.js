// Archivo: api.js
// Funciones Globales para acceder a la BD (CRUD)

const api = {
  
  // -- MATERIAS --
  async getMaterias() {
    const { data: user } = await window.supabaseClient.auth.getUser();
    if (!user.user) return [];

    const { data, error } = await window.supabaseClient
      .from('materias')
      .select('*')
      .order('nombre', { ascending: true });
    
    if (error) {
      console.error('Error obteniendo materias:', error);
      return [];
    }
    return data;
  },

  async addMateria(nombre, color) {
    const { data: user } = await window.supabaseClient.auth.getUser();
    if (!user.user) throw new Error("No autenticado");

    const { data, error } = await window.supabaseClient
      .from('materias')
      .insert([
        { usuario_id: user.user.id, nombre, color }
      ])
      .select();

    if (error) throw error;
    return data;
  },

  async deleteMateria(id) {
    const { error } = await window.supabaseClient
      .from('materias')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // -- TAREAS --
  async getTareas() {
    const { data: user } = await window.supabaseClient.auth.getUser();
    if (!user.user) return [];

    // Obtener tareas junto con la info de la materia
    const { data, error } = await window.supabaseClient
      .from('tareas')
      .select(`*, materias (nombre, color)`)
      .order('fecha_entrega', { ascending: true });
    
    if (error) {
      console.error('Error obteniendo tareas:', error);
      return [];
    }
    return data;
  },

  async addTarea(tarea) {
    const { data: user } = await window.supabaseClient.auth.getUser();
    if (!user.user) throw new Error("No autenticado");

    tarea.usuario_id = user.user.id;

    const { data, error } = await window.supabaseClient
      .from('tareas')
      .insert([tarea])
      .select();

    if (error) throw error;
    return data;
  },

  async updateEstadoTarea(id, estado) {
    const { data, error } = await window.supabaseClient
      .from('tareas')
      .update({ estado, actualizado_en: new Date().toISOString() })
      .eq('id', id)
      .select();

    if (error) throw error;
    return data;
  },

  async deleteTarea(id) {
    const { error } = await window.supabaseClient
      .from('tareas')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  async updateTarea(id, updates) {
    updates.actualizado_en = new Date().toISOString();
    const { data, error } = await window.supabaseClient
      .from('tareas')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data;
  }
};

window.api = api;
