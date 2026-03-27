// Archivo: dashboard.js
// Lógica para renderizar datos en dashboard.html

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar sesión
    const user = await window.checkUser('dashboard');
    if (!user) return;

    // Elementos del DOM
    const userGreeting = document.getElementById('user-greeting');
    const statPendiente = document.getElementById('stat-pendiente');
    const statProgreso = document.getElementById('stat-progreso');
    const statCompletada = document.getElementById('stat-completada');
    const alertsText = document.getElementById('alerts-text');
    const upcomingTasksList = document.getElementById('upcoming-tasks-list');

    // 2. Mostrar nombre
    if (userGreeting && user.displayName) {
        let nombre = user.displayName;
        // Capitalizar
        nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1);
        userGreeting.textContent = `Hola, ${nombre}`;
    }

    // 3. Cargar Tareas
    async function cargarDashboard() {
        const tareas = await window.api.getTareas();
        
        let pendientes = 0;
        let progreso = 0;
        let completadas = 0;
        let tareasVencerPronto = [];
        let ahora = new Date();
        let enTresDias = new Date();
        enTresDias.setDate(ahora.getDate() + 3);

        const proximasTareas = [];

        tareas.forEach(t => {
            // Contar estados
            if (t.estado === 'pendiente') pendientes++;
            else if (t.estado === 'en_progreso') progreso++;
            else if (t.estado === 'completada') completadas++;

            // Verificar si vence pronto o está vencida
            let fechaEntrega = new Date(t.fecha_entrega);
            
            // Tareas para "Próximas Tareas" (Ocultamos completadas)
            if (t.estado !== 'completada') {
                proximasTareas.push(t);
                
                // Tareas en riesgo de vencer (Próximos 3 días o vencidas y no completadas)
                if (fechaEntrega <= enTresDias) {
                    tareasVencerPronto.push(t);
                }
            }
        });

        // Actualizar Stats
        if(statPendiente) statPendiente.textContent = pendientes;
        if(statProgreso) statProgreso.textContent = progreso;
        if(statCompletada) statCompletada.textContent = completadas;

        // Actualizar Alertas
        if(alertsText) {
            if (tareasVencerPronto.length > 0) {
                alertsText.textContent = `Tienes ${tareasVencerPronto.length} tareas por vencer en los próximos 3 días`;
            } else {
                alertsText.textContent = "¡Estás al día! No hay tareas próximas a vencer.";
            }
        }

        // Renderizar Tareas Próximas (Máximo 3)
        if (upcomingTasksList) {
            upcomingTasksList.innerHTML = '';
            
            if (proximasTareas.length === 0) {
                upcomingTasksList.innerHTML = '<p class="text-on-surface-variant text-sm col-span-full">No tienes tareas pendientes urgentes.</p>';
            } else {
                // Tomamos solo las 3 primeras (supuestamente ordenadas por fecha)
                proximasTareas.slice(0, 3).forEach(t => {
                    const div = document.createElement('div');
                    div.className = "bg-surface-container-lowest p-5 rounded-2xl flex items-center gap-4 group hover:ring-2 hover:ring-primary/5 transition-all";
                    
                    const materiaInfo = t.materias ? t.materias : { nombre: 'Sin materia', color: '#c4c7c9' };
                    let bgColorPriority = 'bg-secondary-container';
                    let textColorPriority = 'text-secondary';
                    if(t.prioridad === 'alta') { bgColorPriority = 'bg-[#ffdad6]'; textColorPriority = 'text-[#93000a]'; }
                    else if(t.prioridad === 'media') { bgColorPriority = 'bg-primary-fixed'; textColorPriority = 'text-primary'; }

                    // Formatear fecha
                    const d = new Date(t.fecha_entrega);
                    const isOverdue = d < ahora && t.estado !== 'completada';
                    
                    div.innerHTML = `
                        <div class="w-3 h-12 rounded-full" style="background-color: ${materiaInfo.color}"></div>
                        <div class="flex-1">
                            <h3 class="font-headline font-bold text-on-surface line-clamp-1">${t.titulo}</h3>
                            <p class="${isOverdue ? 'text-error font-bold' : 'text-on-surface-variant'} text-sm flex items-center gap-1 mt-0.5">
                                <span class="material-symbols-outlined text-sm">calendar_today</span>
                                ${d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                        <div class="flex flex-col items-end gap-1">
                            <span class="${bgColorPriority} ${textColorPriority} text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">${t.prioridad}</span>
                            <span class="text-xs font-medium text-on-surface-variant/70 truncate max-w-[80px]" title="${materiaInfo.nombre}">${materiaInfo.nombre}</span>
                        </div>
                    `;
                    upcomingTasksList.appendChild(div);
                });
            }
        }
    }

    cargarDashboard();
});
