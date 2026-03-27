// Archivo: supabase-config.js
// Configuración de Supabase para TaskMate

const SUPABASE_URL = 'https://hopntawptfjgqczjganm.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HsNrCxAAkiulDa5z46M0dw_1yU8AllD';

// Inicialización del cliente de Supabase
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Exportar para uso global
window.supabaseClient = supabaseClient;
