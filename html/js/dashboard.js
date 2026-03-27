// Archivo: dashboard.js
// Lógica para renderizar datos en dashboard.html e interactuar con tareas

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

    // Modal elements
    const detailModal = document.getElementById('task-detail-modal');
    const closeDetailModal = document.getElementById('close-detail-modal');
    const editForm = document.getElementById('edit-task-form');
    const editTaskId = document.getElementById('edit-task-id');
    const editTitle = document.getElementById('edit-task-title');
    const editDesc = document.getElementById('edit-task-desc');
    const editDate = document.getElementById('edit-task-date');
    const editPriority = document.getElementById('edit-task-priority');
    const editMateria = document.getElementById('edit-task-materia');
    const editEstadoChips = document.getElementById('detail-estado-chips');
    const deleteDetailBtn = document.getElementById('delete-task-detail-btn');

    let currentEditEstado = '';

    // 2. Mostrar nombre
    if (userGreeting && user.displayName) {
        let nombre = user.displayName;
        nombre = nombre.charAt(0).toUpperCase() + nombre.slice(1);
        userGreeting.textContent = `Hola, ${nombre}`;
    }

    // --- MODAL LOGIC (Copiado de tareas.js para consistencia) ---
    async function cargarMateriasSelect(selectEl) {
        if (!selectEl) return;
        const materias = await window.api.getMaterias();
        selectEl.innerHTML = '<option value="">Sin Materia</option>';
        materias.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = m.nombre;
            selectEl.appendChild(opt);
        });
    }

    function updateEstadoChips(activeEstado) {
        if (!editEstadoChips) return;
        editEstadoChips.querySelectorAll('.estado-chip').forEach(chip => {
            const estado = chip.dataset.estado;
            if (estado === activeEstado) {
                chip.className = 'estado-chip px-4 py-2 rounded-full text-sm font-semibold transition-all bg-primary text-white shadow-md';
            } else {
                chip.className = 'estado-chip px-4 py-2 rounded-full text-sm font-semibold transition-all bg-surface-container-high text-on-surface-variant';
            }
        });
        currentEditEstado = activeEstado;
    }

    if (editEstadoChips) {
        editEstadoChips.querySelectorAll('.estado-chip').forEach(chip => {
            chip.addEventListener('click', () => updateEstadoChips(chip.dataset.estado));
        });
    }

    function openDetailModal(tarea) {
        if (!detailModal) return;
        editTaskId.value = tarea.id;
        editTitle.value = tarea.titulo;
        editDesc.value = tarea.descripcion || '';
        editPriority.value = tarea.prioridad;
        currentEditEstado = tarea.estado;

        if (tarea.fecha_entrega) {
            const d = new Date(tarea.fecha_entrega);
            const pad = n => String(n).padStart(2, '0');
            editDate.value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        }

        cargarMateriasSelect(editMateria).then(() => {
            editMateria.value = tarea.materia_id || '';
        });

        updateEstadoChips(tarea.estado);
        detailModal.classList.remove('hidden');
    }

    if (closeDetailModal) {
        closeDetailModal.addEventListener('click', () => detailModal.classList.add('hidden'));
    }

    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('save-edit-btn');
            btn.disabled = true;
            btn.textContent = 'Guardando...';
            try {
                await window.api.updateTarea(editTaskId.value, {
                    titulo: editTitle.value,
                    descripcion: editDesc.value,
                    fecha_entrega: editDate.value,
                    prioridad: editPriority.value,
                    materia_id: editMateria.value || null,
                    estado: currentEditEstado
                });
                detailModal.classList.add('hidden');
                cargarDashboard(); // Recargar datos
            } catch (err) {
                alert('Error: ' + err.message);
            } finally {
                btn.disabled = false;
                btn.textContent = 'Guardar Cambios';
            }
        });
    }

    if (deleteDetailBtn) {
        deleteDetailBtn.addEventListener('click', async () => {
            if (confirm('¿Eliminar esta tarea?')) {
                await window.api.deleteTarea(editTaskId.value);
                detailModal.classList.add('hidden');
                cargarDashboard();
            }
        });
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
            if (t.estado === 'pendiente') pendientes++;
            else if (t.estado === 'en_progreso') progreso++;
            else if (t.estado === 'completada') completadas++;

            let fechaEntrega = new Date(t.fecha_entrega);
            if (t.estado !== 'completada') {
                proximasTareas.push(t);
                if (fechaEntrega <= enTresDias) {
                    tareasVencerPronto.push(t);
                }
            }
        });

        if(statPendiente) statPendiente.textContent = pendientes;
        if(statProgreso) statProgreso.textContent = progreso;
        if(statCompletada) statCompletada.textContent = completadas;

        if(alertsText) {
            alertsText.textContent = tareasVencerPronto.length > 0 
                ? `Tienes ${tareasVencerPronto.length} tareas por vencer en los próximos 3 días` 
                : "¡Estás al día! No hay tareas próximas a vencer.";
        }

        if (upcomingTasksList) {
            upcomingTasksList.innerHTML = '';
            if (proximasTareas.length === 0) {
                upcomingTasksList.innerHTML = '<p class="text-on-surface-variant text-sm col-span-full">No tienes tareas pendientes urgentes.</p>';
            } else {
                proximasTareas.slice(0, 3).forEach(t => {
                    const div = document.createElement('div');
                    div.className = "bg-surface-container-lowest p-5 rounded-2xl flex items-center gap-4 group hover:ring-2 hover:ring-primary/5 transition-all cursor-pointer active:scale-[0.98]";
                    
                    const materiaInfo = t.materias ? t.materias : { nombre: 'Sin materia', color: '#c4c7c9' };
                    let bgColorPriority = 'bg-secondary-container';
                    let textColorPriority = 'text-secondary';
                    if(t.prioridad === 'alta') { bgColorPriority = 'bg-[#ffdad6]'; textColorPriority = 'text-[#93000a]'; }
                    else if(t.prioridad === 'media') { bgColorPriority = 'bg-primary-fixed'; textColorPriority = 'text-primary'; }

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
                    // EVENTO CLICK: Abrir detalle
                    div.addEventListener('click', () => openDetailModal(t));
                    upcomingTasksList.appendChild(div);
                });
            }
        }
    }

    cargarDashboard();
});
