// Archivo: notificaciones.js
// Lógica para programar y mostrar notificaciones tipo Push (PWA) de forma nativa

class NotificationManager {
    constructor() {
        this.checkInterval = 60000; // Revisar cada 1 minuto (60000 ms)
        this.notifiedTasks = new Set(JSON.parse(localStorage.getItem('notifiedTasks') || '[]'));
        
        // Empezar a revisar constantemente las tareas
        setInterval(() => this.checkTasks(), this.checkInterval);
        
        // Primera revisión unos segundos después de cargar la app
        setTimeout(() => this.checkTasks(), 5000); 
    }

    async checkTasks() {
        // Solo procesar si el usuario permitió notificaciones
        if (Notification.permission !== 'granted') return;

        // Comprobar que hay una sesión iniciada
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) return;

        try {
            // Obtener tareas usando la API que ya tenemos
            const tareas = await window.api.getTareas();
            const now = new Date();

            tareas.forEach(tarea => {
                if (tarea.estado !== 'pendiente' || !tarea.fecha_entrega) return;
                
                const taskDate = new Date(tarea.fecha_entrega);
                const timeDiffMs = taskDate.getTime() - now.getTime();
                const timeDiffMinutes = timeDiffMs / (1000 * 60);

                // Si falta 10 minutos o menos (hasta 10.5 para margen de error) y no se ha notificado
                if (timeDiffMinutes >= 0 && timeDiffMinutes <= 11 && !this.notifiedTasks.has(tarea.id)) {
                    this.showNotification(tarea);
                    this.notifiedTasks.add(tarea.id);
                    localStorage.setItem('notifiedTasks', JSON.stringify([...this.notifiedTasks]));
                }
            });
        } catch (e) {
            console.error('Error al comprobar tareas para notificar:', e);
        }
    }

    showNotification(tarea) {
        if (!('serviceWorker' in navigator)) return;
        
        const materiaNombre = tarea.materias ? tarea.materias.nombre : 'Sin materia asignada';
        const taskTime = new Date(tarea.fecha_entrega).toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        // Usar Service Worker para enviar una notificación del sistema real, incluso en el celular
        navigator.serviceWorker.ready.then(reg => {
            reg.showNotification('¡Tarea por Vencer! ⏰', {
                body: `La tarea "${tarea.titulo}" (${materiaNombre}) debe entregarse a las ${taskTime}. ¡Prepárate!`,
                icon: '../img/logo.jpg', // Logo de TaskMate
                badge: '../img/logo.jpg', // Icono en la barra de estado
                vibrate: [200, 100, 200, 100, 400], // Patrón de vibración especial
                tag: `task-${tarea.id}`, // Agrupador para no duplicar
                requireInteraction: true,
                data: { url: './tareas.html' }
            });
        });
    }

    async requestPermission() {
        if (!('Notification' in window)) {
            alert("Lo siento, tu navegador no soporta notificaciones.");
            return false;
        }

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            return true;
        } else {
            alert("Has bloqueado las notificaciones. Puedes activarlas desde los ajustes de la aplicación/navegador.");
            return false;
        }
    }

    setupUI() {
        const prompt = document.getElementById('notification-prompt');
        const enableBtn = document.getElementById('enable-notifications-btn');
        
        if (prompt && 'Notification' in window && Notification.permission === 'default') {
            // Show only if we haven't asked yet
            prompt.classList.remove('hidden');
            
            enableBtn.addEventListener('click', async () => {
                const granted = await this.requestPermission();
                if (granted) {
                    prompt.classList.add('hidden'); // Hide on success
                }
            });
        }
    }
}

// Iniciar globalmente para que empiece a revisar en segundo plano (mientras la app esté viva)
window.notificationManager = new NotificationManager();

// Configurar la interfaz cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.notificationManager.setupUI();
});
