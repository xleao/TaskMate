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

        // Refuerzo para iOS y Safari: Revisar inmediatamente cuando el usuario vuelve a abrir la app (foreground)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.checkTasks();
            }
        });
    }

    async checkTasks() {
        if (Notification.permission !== 'granted') return;
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) return;

        try {
            const tareas = await window.api.getTareas();
            const now = new Date();

            // Programar notificaciones "cerradas" (background offline)
            this.scheduleOfflineNotifications(tareas);

            // Revisión de respaldo (fallback por si falla la nativa y la app sigue abierta)
            tareas.forEach(tarea => {
                if (tarea.estado !== 'pendiente' || !tarea.fecha_entrega) return;
                
                const taskDate = new Date(tarea.fecha_entrega);
                const timeDiffMs = taskDate.getTime() - now.getTime();
                const timeDiffMinutes = timeDiffMs / (1000 * 60);

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

    async scheduleOfflineNotifications(tareas) {
        if (!('serviceWorker' in navigator)) return;
        try {
            const reg = await navigator.serviceWorker.ready;
            
            // Verificar si el navegador soporta Notification Triggers (Android Chrome)
            if (!('showTrigger' in Notification.prototype)) {
                return; // Fallback al interval si el navegador no soporta triggers offline
            }

            const now = new Date();
            const scheduledTasks = new Set(JSON.parse(localStorage.getItem('scheduledTasks') || '[]'));

            tareas.forEach(tarea => {
                if (tarea.estado !== 'pendiente' || !tarea.fecha_entrega) return;
                
                const taskDate = new Date(tarea.fecha_entrega);
                const triggerTime = taskDate.getTime() - (10 * 60 * 1000); // 10 mins antes

                // Si es en el futuro y no la hemos programado ya
                if (triggerTime > now.getTime() && !scheduledTasks.has(tarea.id)) {
                    const materiaNombre = tarea.materias ? tarea.materias.nombre : 'Sin materia asignada';
                    const taskTime = taskDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                    
                    // Programar directamente en el Service Worker
                    reg.showNotification('¡Tarea por Vencer! ⏰', {
                        body: `La tarea "${tarea.titulo}" (${materiaNombre}) debe entregarse a las ${taskTime}. ¡Prepárate!`,
                        icon: '../img/logo.jpg',
                        badge: '../img/logo.jpg',
                        vibrate: [200, 100, 200, 100, 400],
                        tag: `task-${tarea.id}`,
                        requireInteraction: true,
                        data: { url: './tareas.html' },
                        showTrigger: new TimestampTrigger(triggerTime)
                    });

                    scheduledTasks.add(tarea.id);
                }
            });
            localStorage.setItem('scheduledTasks', JSON.stringify([...scheduledTasks]));
        } catch (e) {
            console.log("Aviso: Programación en segundo plano no soportada plenamente.", e);
        }
    }

    showNotification(tarea) {
        if (!('serviceWorker' in navigator)) return;
        const materiaNombre = tarea.materias ? tarea.materias.nombre : 'Sin materia asignada';
        const taskTime = new Date(tarea.fecha_entrega).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        
        navigator.serviceWorker.ready.then(reg => {
            reg.showNotification('¡Tarea por Vencer! ⏰', {
                body: `La tarea "${tarea.titulo}" (${materiaNombre}) debe entregarse a las ${taskTime}. ¡Prepárate!`,
                icon: '../img/logo.jpg',
                badge: '../img/logo.jpg',
                vibrate: [200, 100, 200, 100, 400],
                tag: `task-fallback-${tarea.id}`, 
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
