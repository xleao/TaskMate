// Archivo: pwa-setup.js
// Manejo de la instalación de PWA y Service Worker

let deferredPrompt;

// 1. Registrar el Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((registration) => {
        console.log('Service Worker registrado con éxito: ', registration.scope);
      })
      .catch((error) => {
        console.log('Error al registrar Service Worker: ', error);
      });
  });
}

// 2. Manejar el evento para instalar la PWA
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevenir que el prompt por defecto aparezca
  e.preventDefault();
  // Guardar el evento para poder dispararlo luego
  deferredPrompt = e;
  
  // Mostrar el botón o banner de instalación en la UI
  const installBtn = document.getElementById('install-app-btn');
  if (installBtn) {
    installBtn.style.display = 'inline-flex';
    installBtn.classList.remove('hidden');

    installBtn.addEventListener('click', async () => {
      // Ocultar botón
      installBtn.style.display = 'none';
      // Mostrar el prompt en pantalla
      deferredPrompt.prompt();
      // Esperar la respuesta del usuario
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`El usuario ha elegido: ${outcome}`);
      // Limpiar el variable pues solo puede usarse una vez
      deferredPrompt = null;
    });
  }
});

window.addEventListener('appinstalled', () => {
  // Ocultar elementos de instalación
  const installBtn = document.getElementById('install-app-btn');
  if (installBtn) {
    installBtn.style.display = 'none';
  }
  console.log('Aplicación instalada');
});
