// Archivo: auth.js
// Lógica de Autenticación con Usuarios Fijos (Bypass Custom)

// Definimos los únicos usuarios permitidos y su mapeo a correos internos para Supabase
const USERS = {
  "milagros": { email: "milagros@taskmate.com", pass: "milagros123" },
  "leonardo": { email: "leonardo@taskmate.com", pass: "leonardo123" }
};

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form-local');
  
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const usernameInput = document.getElementById('username').value.trim().toLowerCase();
      const passwordInput = document.getElementById('password').value;
      const submitBtn = document.getElementById('submit-login-btn');

      // 1. Validar que el usuario exista en nuestra lista fija
      if (!USERS[usernameInput] || USERS[usernameInput].pass !== passwordInput) {
        alert('Usuario o contraseña incorrectos. Solo "milagros" o "leonardo" tienen acceso.');
        return;
      }

      // 2. Si las credenciales son válidas, conectamos con Supabase en segundo plano
      submitBtn.disabled = true;
      submitBtn.textContent = "Ingresando...";

      const userEmail = USERS[usernameInput].email;
      const userPass = USERS[usernameInput].pass;

      try {
        // Intentar Iniciar Sesión en Supabase
        let { data, error } = await window.supabaseClient.auth.signInWithPassword({
          email: userEmail,
          password: userPass,
        });

        // Si falla porque no existe el usuario en Supabase, lo CREAMOS automáticamente
        if (error && error.message.includes('Invalid login credentials')) {
            const signUpResponse = await window.supabaseClient.auth.signUp({
                email: userEmail,
                password: userPass,
            });
            
            if (signUpResponse.error) throw signUpResponse.error;
            data = signUpResponse.data;
            
            // Iniciar sesión inmediatamente tras crear la cuenta
            await window.supabaseClient.auth.signInWithPassword({
                email: userEmail,
                password: userPass,
            });
        } else if (error) {
            throw error; // Otro tipo de error
        }

        // Éxito: Guardar nombre en localStorage solo para visualización
        localStorage.setItem('taskmate_display_name', usernameInput);
        
        // Redirigir al dashboard
        window.location.href = './dashboard.html';

      } catch (error) {
        alert('Error conectando a Supabase: ' + error.message);
        console.error(error);
        submitBtn.disabled = false;
        submitBtn.textContent = "Ingresar";
      }
    });
  }
});

// Función para cerrar sesión
async function logout() {
  localStorage.removeItem('taskmate_display_name');
  const { error } = await window.supabaseClient.auth.signOut();
  if (error) {
    console.error('Error al cerrar sesión:', error.message);
  }
  window.location.href = './login.html';
}

// Verificar sesión activa en las demás páginas
async function checkUser(currentPage) {
  const { data: { session } } = await window.supabaseClient.auth.getSession();
  const user = session?.user;

  if (!user && currentPage !== 'login') {
    window.location.href = './login.html';
  } else if (user && currentPage === 'login') {
    window.location.href = './dashboard.html';
  }
  
  // Agregar el nombre correcto al objeto user si se requiere info visual
  if (user) {
      user.displayName = localStorage.getItem('taskmate_display_name') || user.email.split('@')[0];
  }
  
  return user;
}
