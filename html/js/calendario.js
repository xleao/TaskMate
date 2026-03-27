// Archivo: calendario.js
// Lógica para renderizar el calendario y filtrar tareas por día

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar sesión
    const user = await window.checkUser('calendario');
    if (!user) return;

    // Elementos del DOM
    const monthTitle = document.getElementById('month-title');
    const calendarGrid = document.getElementById('calendar-grid-cells');
    const dayTasksList = document.getElementById('day-tasks-list');
    const selectedDayTitle = document.getElementById('selected-day-title');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');

    let currentDate = new Date();
    let tareasDB = [];

    // Nombres de meses en español
    const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    // Cargar Tareas desde Supabase
    async function cargarTareasParaCalendario() {
        tareasDB = await window.api.getTareas();
        renderCalendar();
    }

    // Renderizar Calendario
    function renderCalendar() {
        if (!calendarGrid) return;
        
        calendarGrid.innerHTML = '';
        
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // Actualizar título (Ej: Octubre 2026)
        monthTitle.textContent = `${monthNames[month]} ${year}`;

        // Obtener primer día del mes y cantidad de días
        // getDay() devuelve 0 (Domingo) a 6 (Sábado). Ajustamos para que Lunes sea 1
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Espacios vacíos antes del día 1
        
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        const today = new Date();
        const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

        // Renderizar días del mes anterior (opacos)
        for (let i = startOffset - 1; i >= 0; i--) {
            const dayNum = daysInPrevMonth - i;
            const div = document.createElement('div');
            div.className = "bg-surface-container-lowest h-24 p-2 text-on-surface-variant/40 text-sm";
            div.textContent = dayNum;
            calendarGrid.appendChild(div);
        }

        // Renderizar días del mes actual
        for (let day = 1; day <= daysInMonth; day++) {
            const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            // Buscar tareas que caigan en este día
            const tareasDelDia = tareasDB.filter(t => {
                if (!t.fecha_entrega) return false;
                // La fecha en DB viene en formato ISO
                const tDate = new Date(t.fecha_entrega);
                return tDate.getFullYear() === year && 
                       tDate.getMonth() === month && 
                       tDate.getDate() === day;
            });

            const div = document.createElement('div');
            div.className = "bg-surface-container-lowest h-24 p-2 flex flex-col items-center relative group cursor-pointer hover:bg-surface-container-low transition-colors";
            
            // Highlight si es hoy
            if (isCurrentMonth && day === today.getDate()) {
                div.innerHTML = `
                    <div class="absolute inset-1 rounded-xl bg-primary/10 border-2 border-primary/20"></div>
                    <span class="relative z-10 bg-primary text-on-primary w-8 h-8 flex items-center justify-center rounded-full mt-1 font-bold shadow-md">${day}</span>
                `;
            } else {
                div.innerHTML = `<span class="mt-1 font-semibold text-on-surface">${day}</span>`;
            }

            // Puntos de tareas
            if (tareasDelDia.length > 0) {
                const dotsContainer = document.createElement('div');
                dotsContainer.className = "flex flex-wrap justify-center gap-1 mt-auto pb-2 relative z-10 w-full px-1";
                
                // Mostrar hasta 4 puntitos, el resto se esconde
                tareasDelDia.slice(0, 4).forEach(t => {
                    const materiaInfo = t.materias ? t.materias : { color: '#c4c7c9' };
                    const dot = document.createElement('span');
                    dot.className = "w-2 h-2 rounded-full shadow-sm";
                    dot.style.backgroundColor = materiaInfo.color;
                    dotsContainer.appendChild(dot);
                });

                if (tareasDelDia.length > 4) {
                    const plus = document.createElement('span');
                    plus.className = "text-[10px] font-bold text-on-surface-variant leading-none";
                    plus.textContent = "+";
                    dotsContainer.appendChild(plus);
                }
                
                div.appendChild(dotsContainer);
            }

            // Evento al clicar el día
            div.addEventListener('click', () => {
                mostrarTareasDelDia(day, month, year, tareasDelDia);
            });

            calendarGrid.appendChild(div);
        }

        // Rellenar final de la grilla (hasta múltiplo de 7)
        const totalCells = startOffset + daysInMonth;
        const remainder = totalCells % 7;
        if (remainder !== 0) {
            const endFill = 7 - remainder;
            for (let i = 1; i <= endFill; i++) {
                const div = document.createElement('div');
                div.className = "bg-surface-container-lowest h-24 p-2 text-on-surface-variant/40 text-sm";
                div.textContent = i;
                calendarGrid.appendChild(div);
            }
        }
    }

    // Mostrar tareas del día clickeado en la barra lateral
    function mostrarTareasDelDia(day, month, year, tareasDelDia) {
        if (!selectedDayTitle || !dayTasksList) return;

        const dateObj = new Date(year, month, day);
        const options = { weekday: 'long', month: 'short', day: 'numeric' };
        let titleStr = dateObj.toLocaleDateString('es-ES', options);
        titleStr = titleStr.charAt(0).toUpperCase() + titleStr.slice(1);
        
        selectedDayTitle.textContent = titleStr;
        dayTasksList.innerHTML = '';

        if (tareasDelDia.length === 0) {
            dayTasksList.innerHTML = `<p class="text-sm text-on-surface-variant text-center my-8">No hay tareas programadas para este día.</p>`;
            return;
        }

        tareasDelDia.forEach(t => {
            const materiaInfo = t.materias ? t.materias : { nombre: 'Sin materia', color: '#c4c7c9' };
            const isCompleted = t.estado === 'completada';
            
            // Obtener la hora
            const d = new Date(t.fecha_entrega);
            const timeStr = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

            const div = document.createElement('div');
            div.className = `flex gap-4 p-4 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors ${isCompleted ? 'opacity-50' : ''}`;
            
            div.innerHTML = `
                <div class="w-1.5 h-12 rounded-full" style="background-color: ${materiaInfo.color}"></div>
                <div class="flex-1">
                    <div class="flex justify-between items-start">
                        <h4 class="font-bold text-on-surface leading-tight ${isCompleted ? 'line-through' : ''}">${t.titulo}</h4>
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ml-2" style="color: ${materiaInfo.color}; background-color: ${materiaInfo.color}20">${timeStr}</span>
                    </div>
                    <p class="text-xs font-bold text-on-surface-variant/70 uppercase tracking-widest mt-1">${materiaInfo.nombre}</p>
                    ${t.descripcion ? `<p class="text-sm text-on-surface-variant mt-1 line-clamp-1 italic">${t.descripcion}</p>` : ''}
                </div>
            `;
            dayTasksList.appendChild(div);
        });
    }

    // Controles de mes
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }

    // Iniciar
    cargarTareasParaCalendario();
});
