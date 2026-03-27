// Archivo: tareas.js
// Lógica para renderizar, filtrar y gestionar tareas con CRUD completo

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar sesión
    await window.checkUser('tareas');

    const tasksList = document.getElementById('tasks-list');
    const addTaskBtn = document.getElementById('add-task-fab');
    const taskModal = document.getElementById('task-modal');
    const closeTaskModalBtn = document.getElementById('close-task-modal');
    const taskForm = document.getElementById('task-form');
    const searchInput = document.getElementById('search-tasks-input');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');

    // Progress elements
    const progressPercent = document.getElementById('progress-percent');
    const progressCount = document.getElementById('progress-count');
    const progressBar = document.getElementById('progress-bar');

    // Detail/Edit Modal elements
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

    // Selectores del modal de creación
    const taskMateriasSelect = document.getElementById('task-materia');

    // --- FILTER STATE ---
    let allTareas = [];
    let currentEditEstado = '';
    let activeFilters = {
        materia: '',
        estado: '',
        prioridad: '',
        search: ''
    };

    // --- FILTER DROPDOWNS ---
    const filterButtons = {
        materia: document.getElementById('filter-materia-btn'),
        estado: document.getElementById('filter-estado-btn'),
        prioridad: document.getElementById('filter-prioridad-btn')
    };
    const filterDropdowns = {
        materia: document.getElementById('filter-materia-dropdown'),
        estado: document.getElementById('filter-estado-dropdown'),
        prioridad: document.getElementById('filter-prioridad-dropdown')
    };

    // Toggle dropdown visibility
    function toggleDropdown(name) {
        Object.keys(filterDropdowns).forEach(key => {
            if (key !== name) filterDropdowns[key].classList.add('hidden');
        });
        filterDropdowns[name].classList.toggle('hidden');
    }

    // Setup toggle listeners
    Object.keys(filterButtons).forEach(key => {
        if (filterButtons[key]) {
            filterButtons[key].addEventListener('click', (e) => {
                e.stopPropagation();
                toggleDropdown(key);
            });
        }
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.filter-dropdown-wrapper')) {
            Object.values(filterDropdowns).forEach(dd => dd.classList.add('hidden'));
        }
    });

    Object.values(filterDropdowns).forEach(dd => {
        dd.addEventListener('click', (e) => e.stopPropagation());
    });

    // --- FILTER: Estado options ---
    const estadoDropdown = document.getElementById('filter-estado-dropdown');
    if (estadoDropdown) {
        estadoDropdown.querySelectorAll('.filter-option').forEach(btn => {
            btn.addEventListener('click', () => {
                activeFilters.estado = btn.dataset.value;
                updateFilterChipStyle('estado', btn.dataset.value);
                estadoDropdown.classList.add('hidden');
                applyFilters();
            });
        });
    }

    // --- FILTER: Prioridad options ---
    const prioridadDropdown = document.getElementById('filter-prioridad-dropdown');
    if (prioridadDropdown) {
        prioridadDropdown.querySelectorAll('.filter-option').forEach(btn => {
            btn.addEventListener('click', () => {
                activeFilters.prioridad = btn.dataset.value;
                updateFilterChipStyle('prioridad', btn.dataset.value);
                prioridadDropdown.classList.add('hidden');
                applyFilters();
            });
        });
    }

    // --- FILTER: Materia (dynamic) ---
    async function cargarMateriasFiltro() {
        const materiaOptionsContainer = document.getElementById('filter-materia-options');
        if (!materiaOptionsContainer) return;

        const materias = await window.api.getMaterias();
        materiaOptionsContainer.innerHTML = '<button data-value="" class="filter-option w-full text-left px-4 py-3 text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors">Todas</button>';
        
        materias.forEach(m => {
            const btn = document.createElement('button');
            btn.dataset.value = m.id;
            btn.className = 'filter-option w-full text-left px-4 py-3 text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors flex items-center gap-2';
            btn.innerHTML = `<span class="w-2.5 h-2.5 rounded-full inline-block" style="background:${m.color}"></span> ${m.nombre}`;
            materiaOptionsContainer.appendChild(btn);
        });

        materiaOptionsContainer.querySelectorAll('.filter-option').forEach(btn => {
            btn.addEventListener('click', () => {
                activeFilters.materia = btn.dataset.value;
                updateFilterChipStyle('materia', btn.dataset.value);
                filterDropdowns.materia.classList.add('hidden');
                applyFilters();
            });
        });
    }

    // --- UPDATE CHIP STYLE ---
    function updateFilterChipStyle(filterName, value) {
        const btn = filterButtons[filterName];
        if (!btn) return;

        if (value) {
            btn.classList.remove('bg-surface-container-high', 'text-on-surface-variant');
            btn.classList.add('bg-primary', 'text-on-primary');
        } else {
            btn.classList.remove('bg-primary', 'text-on-primary');
            btn.classList.add('bg-surface-container-high', 'text-on-surface-variant');
        }

        const hasAnyFilter = activeFilters.materia || activeFilters.estado || activeFilters.prioridad || activeFilters.search;
        if (clearFiltersBtn) clearFiltersBtn.classList.toggle('hidden', !hasAnyFilter);
    }

    // --- SEARCH ---
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            activeFilters.search = searchInput.value.trim().toLowerCase();
            const hasAnyFilter = activeFilters.materia || activeFilters.estado || activeFilters.prioridad || activeFilters.search;
            if (clearFiltersBtn) clearFiltersBtn.classList.toggle('hidden', !hasAnyFilter);
            applyFilters();
        });
    }

    // --- CLEAR ALL FILTERS ---
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            activeFilters = { materia: '', estado: '', prioridad: '', search: '' };
            if (searchInput) searchInput.value = '';
            Object.keys(filterButtons).forEach(key => updateFilterChipStyle(key, ''));
            clearFiltersBtn.classList.add('hidden');
            applyFilters();
        });
    }

    // --- APPLY FILTERS ---
    function applyFilters() {
        let filtered = [...allTareas];
        if (activeFilters.materia) filtered = filtered.filter(t => t.materia_id === activeFilters.materia);
        if (activeFilters.estado) filtered = filtered.filter(t => t.estado === activeFilters.estado);
        if (activeFilters.prioridad) filtered = filtered.filter(t => t.prioridad === activeFilters.prioridad);
        if (activeFilters.search) {
            filtered = filtered.filter(t => {
                const titulo = (t.titulo || '').toLowerCase();
                const desc = (t.descripcion || '').toLowerCase();
                const materia = (t.materias?.nombre || '').toLowerCase();
                return titulo.includes(activeFilters.search) || desc.includes(activeFilters.search) || materia.includes(activeFilters.search);
            });
        }
        renderFilteredTareas(filtered);
    }

    // --- LOAD MATERIAS FOR SELECT ---
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

    // --- CREATE MODAL ---
    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', () => {
            taskForm.reset();
            cargarMateriasSelect(taskMateriasSelect);
            taskModal.classList.remove('hidden');
        });
    }
    if (closeTaskModalBtn) {
        closeTaskModalBtn.addEventListener('click', () => taskModal.classList.add('hidden'));
    }

    // --- DETAIL/EDIT MODAL ---
    function openDetailModal(tarea) {
        if (!detailModal) return;

        editTaskId.value = tarea.id;
        editTitle.value = tarea.titulo;
        editDesc.value = tarea.descripcion || '';
        editPriority.value = tarea.prioridad;
        currentEditEstado = tarea.estado;

        // Format date for datetime-local input
        if (tarea.fecha_entrega) {
            const d = new Date(tarea.fecha_entrega);
            const pad = n => String(n).padStart(2, '0');
            editDate.value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        }

        // Load materias and set current
        cargarMateriasSelect(editMateria).then(() => {
            editMateria.value = tarea.materia_id || '';
        });

        // Set estado chips
        updateEstadoChips(tarea.estado);

        detailModal.classList.remove('hidden');
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

    // Estado chip clicks
    if (editEstadoChips) {
        editEstadoChips.querySelectorAll('.estado-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                updateEstadoChips(chip.dataset.estado);
            });
        });
    }

    // Close detail modal
    if (closeDetailModal) {
        closeDetailModal.addEventListener('click', () => detailModal.classList.add('hidden'));
    }
    // Close on backdrop click
    if (detailModal) {
        detailModal.addEventListener('click', (e) => {
            if (e.target === detailModal) detailModal.classList.add('hidden');
        });
    }

    // Save edits
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const saveBtn = document.getElementById('save-edit-btn');
            saveBtn.disabled = true;
            saveBtn.textContent = 'Guardando...';

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
                await loadAllTareas();
            } catch (err) {
                alert('Error al guardar: ' + err.message);
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Guardar Cambios';
            }
        });
    }

    // Delete from detail modal
    if (deleteDetailBtn) {
        deleteDetailBtn.addEventListener('click', async () => {
            if (confirm('¿Seguro de borrar esta tarea?')) {
                try {
                    await window.api.deleteTarea(editTaskId.value);
                    detailModal.classList.add('hidden');
                    await loadAllTareas();
                } catch (err) {
                    alert('Error al eliminar: ' + err.message);
                }
            }
        });
    }

    // --- HELPERS ---
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
        if (estado === 'pendiente') return `<span class="bg-secondary-container text-secondary px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter">Pendiente</span>`;
        if (estado === 'en_progreso') return `<span class="bg-primary-container text-primary px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter">En progreso</span>`;
        if (estado === 'completada') return `<span class="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter">Completada</span>`;
        return `<span class="bg-error-container text-error px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter">Vencida</span>`;
    }

    // --- WEEKLY PROGRESS ---
    function updateWeeklyProgress() {
        if (!progressPercent || !progressCount || !progressBar) return;

        const now = new Date();
        const dayOfWeek = now.getDay();
        const monday = new Date(now);
        monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        monday.setHours(0, 0, 0, 0);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        const weekTasks = allTareas.filter(t => {
            const fecha = new Date(t.fecha_entrega);
            return fecha >= monday && fecha <= sunday;
        });

        const total = weekTasks.length;
        const completed = weekTasks.filter(t => t.estado === 'completada').length;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

        progressPercent.textContent = `${percent}%`;
        progressCount.textContent = total > 0 ? `${completed}/${total} tareas completadas` : 'Sin tareas esta semana';
        progressBar.style.width = `${percent}%`;
    }

    // --- RENDER TASKS ---
    function renderFilteredTareas(tareas) {
        if (!tasksList) return;

        if (tareas.length === 0) {
            const hasFilters = activeFilters.materia || activeFilters.estado || activeFilters.prioridad || activeFilters.search;
            tasksList.innerHTML = `
                <div class="text-center py-8 col-span-full">
                    <span class="material-symbols-outlined text-4xl text-outline mb-2">${hasFilters ? 'filter_alt' : 'assignment'}</span>
                    <p class="text-outline font-medium">${hasFilters ? 'No se encontraron tareas con estos filtros.' : 'Aún no tienes tareas asignadas.'}</p>
                </div>`;
            return;
        }

        tasksList.innerHTML = '';
        tareas.forEach(t => {
            const div = document.createElement('div');
            div.className = "bg-surface-container-lowest p-5 rounded-xl transition-all hover:translate-y-[-2px] relative cursor-pointer active:scale-[0.98]";
            
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
                        ${getStateBadge(t.estado)}
                    </div>
                    <h3 class="text-lg font-bold text-on-surface font-headline leading-tight mb-2 ${isCompleted ? 'line-through' : ''}">${t.titulo}</h3>
                    ${t.descripcion ? `<p class="text-on-surface-variant text-sm font-body line-clamp-2 mb-4">${t.descripcion}</p>` : '<div class="mb-4"></div>'}
                    
                    <div class="flex justify-between items-center pt-4 border-t border-outline-variant/15">
                        <div class="flex items-center gap-1.5 ${t.estado === 'vencida' ? 'text-error' : 'text-on-surface-variant'}">
                            <span class="material-symbols-outlined text-[18px]">schedule</span>
                            <span class="text-xs font-medium">${formatFecha(t.fecha_entrega)}</span>
                        </div>
                        <div class="flex items-center gap-1 ${priorityColor}">
                            <span class="material-symbols-outlined text-[16px]" style="font-variation-settings: 'FILL' 1;">priority_high</span>
                            <span class="text-[10px] font-bold uppercase tracking-widest">${t.prioridad}</span>
                        </div>
                    </div>
                </div>`;

            // Open detail modal on click
            div.addEventListener('click', () => openDetailModal(t));

            tasksList.appendChild(div);
        });
    }

    // --- MASTER LOAD ---
    async function loadAllTareas() {
        if (!tasksList) return;
        tasksList.innerHTML = '<p class="text-center text-on-surface-variant col-span-full">Cargando tareas...</p>';
        allTareas = await window.api.getTareas();
        updateWeeklyProgress();
        applyFilters();
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
                await loadAllTareas();
            } catch (err) {
                alert('Error al guardar: ' + err.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Guardar Tarea';
            }
        });
    }

    // Initialize
    await cargarMateriasFiltro();
    await loadAllTareas();
});
