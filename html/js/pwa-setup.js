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

// 2. Helpers
const isIos = () => /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone) || window.matchMedia('(display-mode: standalone)').matches;

const setupInstallUI = (actionCallback) => {
  const banner = document.getElementById('pwa-install-banner');
  const actionBtn = document.getElementById('pwa-install-action');
  const closeBtn = document.getElementById('pwa-close-btn');

  // Fallback to old button if banner doesn't exist on other pages
  const oldBtn = document.getElementById('install-app-btn');

  if (banner && actionBtn) {
    banner.classList.remove('hidden');
    banner.classList.add('flex');
    
    if (isIos()) {
        const desc = document.getElementById('pwa-install-desc');
        if(desc) desc.textContent = "Toca el ícono 'Compartir' en la barra inferior y luego 'Añadir a inicio'.";
        actionBtn.innerHTML = '<span class="material-symbols-outlined mr-2 align-middle">ios_share</span> Entendido';
    }

    // Replace event listeners to avoid duplicates
    const newActionBtn = actionBtn.cloneNode(true);
    actionBtn.parentNode.replaceChild(newActionBtn, actionBtn);
    
    newActionBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (isIos()) {
        banner.classList.add('hidden');
        banner.classList.remove('flex');
      } else {
        await actionCallback();
        banner.classList.add('hidden');
        banner.classList.remove('flex');
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        banner.classList.add('hidden');
        banner.classList.remove('flex');
      });
    }
  } else if (oldBtn) {
    oldBtn.style.display = 'inline-flex';
    oldBtn.classList.remove('hidden');
    
    if (isIos()) {
        const iconSpan = oldBtn.querySelector('.material-symbols-outlined');
        if (iconSpan) iconSpan.textContent = 'ios_share';
        const textSpan = oldBtn.querySelector('span:nth-child(2)');
        if (textSpan) textSpan.textContent = '+ Añadir a inicio en Safari';
    }

    const newOldBtn = oldBtn.cloneNode(true);
    oldBtn.parentNode.replaceChild(newOldBtn, oldBtn);

    newOldBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (isIos()) {
        alert('Para instalar en iOS: presiona "Compartir" en el navegador y selecciona "Añadir a la pantalla de inicio".');
      } else {
        await actionCallback();
        newOldBtn.style.display = 'none';
      }
    });
  }
};

window.addEventListener('load', () => {
  // En iOS no hay beforeinstallprompt, forzamos mostrar la UI si no está instalada
  if (isIos() && !isInStandaloneMode()) {
    setTimeout(() => setupInstallUI(() => {}), 1000); // Pequeño retraso para que el usuario procese el UI
  }
});

// 3. Manejar el evento para instalar la PWA (Android / Desktop)
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  if (!isInStandaloneMode()) {
    // Retraso ligero para que sea un pop up visible y no abrume cargas iniciales
    setTimeout(() => {
      setupInstallUI(async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User choice: ${outcome}`);
        deferredPrompt = null;
      });
    }, 500);
  }
});

window.addEventListener('appinstalled', () => {
  const banner = document.getElementById('pwa-install-banner');
  if (banner) {
    banner.classList.add('hidden');
    banner.classList.remove('flex');
  }
  const oldBtn = document.getElementById('install-app-btn');
  if (oldBtn) oldBtn.style.display = 'none';
  console.log('Aplicación instalada');
});
