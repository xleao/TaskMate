// Archivo: tareas.js
// Lógica para renderizar y gestionar tareas

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar sesión
    await window.checkUser('tareas');

    const tasksList = document.getElementById('tasks-list');
    const addTaskBtn = document.getElementById('add-task-fab');
    const taskModal = document.getElementById('task-modal');
    const closeTaskModalBtn = document.getElementById('close-task-modal');
    const taskForm = document.getElementById('task-form');
    
    // Selectores del modal
    const taskMateriasSelect = document.getElementById('task-materia');

    // Cargar materias para el select
    async function cargarMateriasSelect() {
        if (!taskMateriasSelect) return;
        const materias = await window.api.getMaterias();
        taskMateriasSelect.innerHTML = '<option value="">Sin Materia</option>';
        materias.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id;
            opt.textContent = m.nombre;
            taskMateriasSelect.appendChild(opt);
        });
    }

    // Modal behavior
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', () => {
            taskForm.reset();
            cargarMateriasSelect();
            taskModal.classList.remove('hidden');
        });
    }

    if (closeTaskModalBtn) {
        closeTaskModalBtn.addEventListener('click', () => {
            taskModal.classList.add('hidden');
        });
    }

    // Formatear Fecha
    function formatFecha(isoString) {
        const d = new Date(isoString);
        return d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    function getPriorityColor(prioridad) {
        if (prioridad === 'alta') return 'text-error';
        if (prioridad === 'media') return 'text-yellow-600';
        return 'text-emerald-600';
    }

    function getStateBadge(estado) {
        if (estado === 'pendiente') return `<span class="bg-secondary-container text-secondary px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter cursor-pointer switch-state-btn">Pendiente</span>`;
        if (estado === 'en_progreso') return `<span class="bg-primary-container text-primary px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter cursor-pointer switch-state-btn">En progreso</span>`;
        if (estado === 'completada') return `<span class="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter cursor-pointer switch-state-btn">Completada</span>`;
        return `<span class="bg-error-container text-error px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter cursor-pointer switch-state-btn">Vencida</span>`;
    }

    // Renderizar Tareas
    async function renderTareas() {
        if (!tasksList) return;
        tasksList.innerHTML = '<p class="text-center text-on-surface-variant col-span-full">Cargando tareas...</p>';
        const tareas = await window.api.getTareas();

        if (tareas.length === 0) {
            tasksList.innerHTML = `
                <div class="text-center py-8 col-span-full">
                    <span class="material-symbols-outlined text-4xl text-outline mb-2">assignment</span>
                    <p class="text-outline font-medium">Aún no tienes tareas asignadas.</p>
                </div>
            `;
            return;
        }

        tasksList.innerHTML = '';
        tareas.forEach(t => {
            const div = document.createElement('div');
            div.className = "bg-surface-container-lowest p-5 rounded-xl transition-all hover:translate-y-[-2px] relative";
            
            const materiaInfo = t.materias ? t.materias : { nombre: 'Sin materia', color: '#c4c7c9' };
            const priorityColor = getPriorityColor(t.prioridad);
            const isCompleted = t.estado === 'completada';

            div.innerHTML = `
                <div class="${isCompleted ? 'opacity-50' : ''}">
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex items-center gap-2">
                            <div class="w-2.5 h-2.5 rounded-full" style="background-color: ${materiaInfo.color}"></div>
                            <span class="text-xs font-semibold text-outline uppercase tracking-wider font-label">${materiaInfo.nombre}</span>
                        </div>
                        <div data-id="${t.id}" data-estado="${t.estado}">
                            ${getStateBadge(t.estado)}
                        </div>
                    </div>
                    <h3 class="text-lg font-bold text-on-surface font-headline leading-tight mb-2 ${isCompleted ? 'line-through' : ''}">${t.titulo}</h3>
                    ${t.descripcion ? `<p class="text-on-surface-variant text-sm font-body line-clamp-2 mb-4">${t.descripcion}</p>` : '<div class="mb-4"></div>'}
                    
                    <div class="flex justify-between items-center pt-4 border-t border-outline-variant/15">
                        <div class="flex items-center gap-1.5 ${t.estado === 'vencida' ? 'text-error' : 'text-on-surface-variant'}">
                            <span class="material-symbols-outlined text-[18px]" data-icon="schedule">schedule</span>
                            <span class="text-xs font-medium">${formatFecha(t.fecha_entrega)}</span>
                        </div>
                        <div class="flex items-center gap-1 ${priorityColor}">
                            <span class="material-symbols-outlined text-[16px]" data-icon="priority_high" data-weight="fill" style="font-variation-settings: 'FILL' 1;">priority_high</span>
                            <span class="text-[10px] font-bold uppercase tracking-widest">${t.prioridad}</span>
                        </div>
                    </div>
                </div>
                <!-- Delete Layer -->
                <button class="delete-task-btn absolute -top-2 -right-2 bg-error text-white w-8 h-8 rounded-full shadow-md flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity" data-id="${t.id}">
                    <span class="material-symbols-outlined text-[16px]">close</span>
                </button>
            `;
            // Add class for group so delete button shows on hover
            div.classList.add('group');

            // Toggle state logic
            const stateBtn = div.querySelector('.switch-state-btn');
            stateBtn.addEventListener('click', async () => {
                let nextState = 'pendiente';
                if (t.estado === 'pendiente') nextState = 'en_progreso';
                else if (t.estado === 'en_progreso') nextState = 'completada';
                else if (t.estado === 'completada') nextState = 'pendiente';

                await window.api.updateEstadoTarea(t.id, nextState);
                renderTareas();
            });

            // Delete task logic
            const delBtn = div.querySelector('.delete-task-btn');
            delBtn.addEventListener('click', async () => {
                if(confirm('¿Seguro de borrar esta tarea?')) {
                    await window.api.deleteTarea(t.id);
                    renderTareas();
                }
            });

            tasksList.appendChild(div);
        });
    }

    // Submit new task
    if (taskForm) {
        taskForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('save-task-submit');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Guardando...';

            const titulo = document.getElementById('task-title').value;
            const descripcion = document.getElementById('task-desc').value;
            const materia_id = document.getElementById('task-materia').value || null;
            const fecha_entrega = document.getElementById('task-date').value;
            const prioridad = document.getElementById('task-priority').value;

            try {
                await window.api.addTarea({
                    titulo, descripcion, materia_id, fecha_entrega, prioridad, estado: 'pendiente'
                });
                taskModal.classList.add('hidden');
                taskForm.reset();
                renderTareas();
            } catch (err) {
                alert('Error al guardar: ' + err.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Guardar Tarea';
            }
        });
    }

    // Initialize
    renderTareas();
});
