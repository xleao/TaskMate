// Archivo: calendario.js
// Lógica para renderizar el calendario y filtrar tareas por día

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar sesión
    const user = await window.checkUser('calendario');
    if (!user) return;

    // Elementos del DOM
    const monthTitle = document.getElementById('month-title');
    const calendarGrid = document.getElementById('calendar-grid-cells');
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');

    const monthViewContainer = document.getElementById('month-view-container');
    const dayViewContainer = document.getElementById('day-view-container');
    const backToMonthBtn = document.getElementById('back-to-month-btn');
    const timelineHoursContainer = document.getElementById('timeline-hours-container');
    const dayViewTitle = document.getElementById('day-view-title');
    const areasEnfoqueList = document.getElementById('areas-enfoque-list');

    if (backToMonthBtn) {
        backToMonthBtn.addEventListener('click', () => {
            dayViewContainer.classList.add('hidden');
            dayViewContainer.classList.remove('flex');
            monthViewContainer.classList.remove('hidden');
        });
    }

    let currentDate = new Date();
    let tareasDB = [];
    let calendarViewMode = 'mensual'; // 'semanal' o 'mensual'

    // Botones de vistas
    const viewSemanalBtn = document.getElementById('view-semanal-btn');
    const viewMensualBtn = document.getElementById('view-mensual-btn');

    if (viewSemanalBtn && viewMensualBtn) {
        viewSemanalBtn.addEventListener('click', () => {
            calendarViewMode = 'semanal';
            viewSemanalBtn.classList.replace('text-on-surface-variant', 'text-primary');
            viewSemanalBtn.classList.replace('hover:text-primary', 'bg-surface-container-lowest');
            viewSemanalBtn.classList.add('shadow-sm', 'pointer-events-none');
            
            viewMensualBtn.classList.replace('text-primary', 'text-on-surface-variant');
            viewMensualBtn.classList.replace('bg-surface-container-lowest', 'hover:text-primary');
            viewMensualBtn.classList.remove('shadow-sm', 'pointer-events-none');
            renderCalendar();
        });

        viewMensualBtn.addEventListener('click', () => {
            calendarViewMode = 'mensual';
            viewMensualBtn.classList.replace('text-on-surface-variant', 'text-primary');
            viewMensualBtn.classList.replace('hover:text-primary', 'bg-surface-container-lowest');
            viewMensualBtn.classList.add('shadow-sm', 'pointer-events-none');
            
            viewSemanalBtn.classList.replace('text-primary', 'text-on-surface-variant');
            viewSemanalBtn.classList.replace('bg-surface-container-lowest', 'hover:text-primary');
            viewSemanalBtn.classList.remove('shadow-sm', 'pointer-events-none');
            renderCalendar();
        });
    }

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
        const today = new Date();
        const daysToRender = [];

        if (calendarViewMode === 'mensual') {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            monthTitle.textContent = `${monthNames[month]} ${year}`;

            const firstDayOfMonth = new Date(year, month, 1).getDay();
            const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const daysInPrevMonth = new Date(year, month, 0).getDate();

            // Días mes anterior
            for (let i = startOffset - 1; i >= 0; i--) {
                daysToRender.push({
                    date: new Date(year, month - 1, daysInPrevMonth - i),
                    isCurrentMonth: false
                });
            }
            // Días mes actual
            for (let day = 1; day <= daysInMonth; day++) {
                daysToRender.push({
                    date: new Date(year, month, day),
                    isCurrentMonth: true
                });
            }
            // Días próximo mes para rellenar semana
            const remainder = daysToRender.length % 7;
            if (remainder !== 0) {
                const endFill = 7 - remainder;
                for (let i = 1; i <= endFill; i++) {
                    daysToRender.push({
                        date: new Date(year, month + 1, i),
                        isCurrentMonth: false
                    });
                }
            }
        } else {
            // Vista Semanal
            const jsDay = currentDate.getDay(); // 0 es domingo
            const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1; // 0 es Lunes
            
            const monday = new Date(currentDate);
            monday.setDate(currentDate.getDate() - dayOfWeek);
            
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            
            if (monday.getMonth() === sunday.getMonth()) {
                monthTitle.textContent = `${monthNames[monday.getMonth()]} ${monday.getFullYear()}`;
            } else {
                monthTitle.textContent = `${monthNames[monday.getMonth()].substring(0,3)} - ${monthNames[sunday.getMonth()].substring(0,3)} ${sunday.getFullYear()}`;
            }

            for (let i = 0; i < 7; i++) {
                const d = new Date(monday);
                d.setDate(monday.getDate() + i);
                daysToRender.push({
                    date: d,
                    isCurrentMonth: true // treat all days in a weekly view as fully opaque
                });
            }
        }

        // Renderizado del HTML con la lista daysToRender
        daysToRender.forEach(cell => {
            const d = cell.date;
            const isToday = d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
            
            if (!cell.isCurrentMonth && calendarViewMode === 'mensual') {
                const div = document.createElement('div');
                div.className = "bg-surface-container-lowest h-24 p-2 text-on-surface-variant/40 text-sm";
                div.textContent = d.getDate();
                calendarGrid.appendChild(div);
                return;
            }

            const tareasDelDia = tareasDB.filter(t => {
                if (!t.fecha_entrega) return false;
                const tDate = new Date(t.fecha_entrega);
                return tDate.getFullYear() === d.getFullYear() && tDate.getMonth() === d.getMonth() && tDate.getDate() === d.getDate();
            });

            const div = document.createElement('div');
            // Weekly grid items can have slightly rounded borders on mobile, basically same style
            div.className = "bg-surface-container-lowest h-24 p-2 flex flex-col items-center relative group cursor-pointer hover:bg-surface-container-low transition-colors";
            
            if (calendarViewMode === 'semanal') {
                 div.className += " border-x border-outline-variant/10 first:rounded-l-xl last:rounded-r-xl first:border-l-0 last:border-r-0";
            }

            if (isToday) {
                 // Sutil highlight para hoy en ambos modos
                 div.innerHTML = `<span class="mt-1 font-extrabold text-primary underline decoration-2 underline-offset-4">${d.getDate()}</span>`;
            } else {
                 div.innerHTML = `<span class="mt-1 font-semibold text-on-surface">${d.getDate()}</span>`;
            }

            if (tareasDelDia.length > 0) {
                const dotsContainer = document.createElement('div');
                dotsContainer.className = "flex flex-wrap justify-center gap-1 mt-auto pb-2 relative z-10 w-full px-1";
                
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

            div.addEventListener('click', () => {
                mostrarTareasDelDia(d.getDate(), d.getMonth(), d.getFullYear(), tareasDelDia);
            });

            calendarGrid.appendChild(div);
        });

        // Áreas de Enfoque usando el mes actual de `currentDate`
        const tareasDelMes = tareasDB.filter(t => {
            if (!t.fecha_entrega) return false;
            const tDate = new Date(t.fecha_entrega);
            return tDate.getFullYear() === currentDate.getFullYear() && tDate.getMonth() === currentDate.getMonth();
        });
        renderAreasEnfoque(tareasDelMes);
    }

    // Mostrar tareas del día clickeado en la barra lateral
    function mostrarTareasDelDia(day, month, year, tareasDelDia) {
        if (!monthViewContainer || !dayViewContainer) return;

        monthViewContainer.classList.add('hidden');
        dayViewContainer.classList.remove('hidden');
        dayViewContainer.classList.add('flex');

        const dateObj = new Date(year, month, day);
        const options = { weekday: 'long', month: 'long', day: 'numeric' };
        let titleStr = dateObj.toLocaleDateString('es-ES', options);
        dayViewTitle.textContent = titleStr.charAt(0).toUpperCase() + titleStr.slice(1);

        timelineHoursContainer.innerHTML = '';

        for (let i = 0; i < 24; i++) {
            const tareasHora = tareasDelDia.filter(t => {
                const d = new Date(t.fecha_entrega);
                return d.getHours() === i;
            });

            const hourDiv = document.createElement('div');
            hourDiv.className = "w-72 md:w-80 flex-shrink-0 bg-surface-container-lowest rounded-3xl p-6 shadow-md border border-outline-variant/10 min-h-[300px] flex flex-col hover:border-primary/20 transition-all snap-center";
            
            const hourText = i === 0 ? '12:00 AM' : (i < 12 ? `${i}:00 AM` : (i === 12 ? '12:00 PM' : `${i-12}:00 PM`));
            
            let htmlStr = `<div class="flex items-center justify-between border-b border-outline-variant/15 pb-4 mb-4">
                <span class="text-lg font-extrabold text-on-surface-variant font-headline tracking-tight">${hourText}</span>
                <span class="text-xs font-bold px-2 py-1 rounded-md bg-surface-container ${tareasHora.length > 0 ? 'text-primary' : 'text-on-surface-variant/60'}">${tareasHora.length} tareas</span>
            </div>`;
            
            let tasksHtml = '<div class="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">';
            
            if (tareasHora.length === 0) {
                tasksHtml += `<div class="h-full flex flex-col items-center justify-center text-sm font-medium text-on-surface-variant/40 italic"><span class="material-symbols-outlined text-4xl mb-2 opacity-30">coffee</span>Libre</div>`;
            } else {
                tareasHora.forEach(t => {
                    const materiaInfo = t.materias ? t.materias : { nombre: 'Sin materia', color: '#c4c7c9' };
                    const isCompleted = t.estado === 'completada';
                    const timeStr = new Date(t.fecha_entrega).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                    
                    tasksHtml += `
                    <div class="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/15 relative overflow-hidden group hover:shadow-lg hover:border-outline-variant/40 transition-all cursor-default ${isCompleted ? 'opacity-50' : ''}">
                        <div class="absolute left-0 top-0 bottom-0 w-2" style="background-color: ${materiaInfo.color}"></div>
                        <div class="pl-3">
                            <h4 class="font-bold text-on-surface text-base leading-tight mb-2 ${isCompleted ? 'line-through' : ''}">${t.titulo}</h4>
                            <div class="flex justify-between items-center">
                                <span class="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/70 truncate mr-2" title="${materiaInfo.nombre}">${materiaInfo.nombre}</span>
                                <span class="text-[11px] font-extrabold px-2 py-0.5 rounded-lg whitespace-nowrap" style="color: ${materiaInfo.color}; background-color: ${materiaInfo.color}20">${timeStr}</span>
                            </div>
                        </div>
                    </div>`;
                });
            }
            tasksHtml += '</div>';
            
            hourDiv.innerHTML = htmlStr + tasksHtml;
            timelineHoursContainer.appendChild(hourDiv);
        }

        // --- Renderizar Minimapa y Scroll Sync ---
        const scrollArea = document.getElementById('timeline-scroll-area');
        const minimap = document.getElementById('day-timeline-minimap');

        if (minimap && scrollArea) {
            minimap.innerHTML = '';
            
            // Thumb del scroll
            const thumb = document.createElement('div');
            thumb.className = "absolute h-full bg-outline-variant/30 rounded-full transition-all duration-75 min-w-[32px] md:min-w-[48px] z-10";
            minimap.appendChild(thumb);

            // Generar Puntos de Tareas
            tareasDelDia.forEach(t => {
                const materiaInfo = t.materias ? t.materias : { color: '#c4c7c9' };
                const dt = new Date(t.fecha_entrega);
                const hrs = dt.getHours();
                const mins = dt.getMinutes();
                // Calcular posicion x en el minimapa (0-100%) en base a la hora de las 24
                const percent = ((hrs + (mins / 60)) / 24) * 100;

                const dot = document.createElement('div');
                dot.className = "absolute w-2 h-2 rounded-full transform -translate-x-1/2 z-20 hover:scale-[2] transition-transform shadow-[0_0_8px_rgba(0,0,0,0.2)]";
                dot.style.backgroundColor = materiaInfo.color;
                dot.style.left = `${percent}%`;
                
                // Click en un punto salta a esa hora
                dot.addEventListener('click', (e) => {
                    e.stopPropagation();
                    scrollArea.scrollTo({
                        left: Math.max(0, hrs - 1) * 344, // 344 es approx el ancho de un bloque
                        behavior: 'smooth'
                    });
                });
                minimap.appendChild(dot);
            });

            // Actualizar thumb
            const updateMinimap = () => {
                const maxScrollLeft = scrollArea.scrollWidth - scrollArea.clientWidth;
                if (maxScrollLeft <= 0) {
                    thumb.style.width = '100%';
                    thumb.style.transform = `translateX(0px)`;
                    return;
                }
                const scrollPercent = scrollArea.scrollLeft / maxScrollLeft;
                const thumbWidthPercent = (scrollArea.clientWidth / scrollArea.scrollWidth) * 100;
                thumb.style.width = `${Math.max(10, thumbWidthPercent)}%`;
                
                const maxThumbX = minimap.clientWidth - thumb.clientWidth;
                const leftPx = scrollPercent * maxThumbX;
                thumb.style.transform = `translateX(${leftPx}px)`;
            };

            // Ligar evento de scroll
            scrollArea.onscroll = updateMinimap;

            // Click generico en minimapa
            minimap.onclick = (e) => {
                if(e.target === thumb) return;
                const rect = minimap.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const percent = clickX / minimap.clientWidth;
                
                scrollArea.scrollTo({
                    left: percent * (scrollArea.scrollWidth - scrollArea.clientWidth),
                    behavior: 'smooth'
                });
            };

            // Auto-scroll inicial a la primera tarea
            setTimeout(() => {
                let sortTareas = [...tareasDelDia].sort((a,b) => new Date(a.fecha_entrega) - new Date(b.fecha_entrega));
                const firstHourWithTask = sortTareas.length > 0 ? new Date(sortTareas[0].fecha_entrega).getHours() : 8;
                
                scrollArea.scrollTo({
                    left: Math.max(0, firstHourWithTask - 1) * 344, 
                    behavior: 'smooth'
                });
                updateMinimap();
            }, 100);
        }
    }

    // Renderizar Áreas de Enfoque este mes
    function renderAreasEnfoque(tareasMesActivo) {
        if (!areasEnfoqueList) return;
        
        const materiaCounts = {};
        let plazosCriticos = 0;
        const now = new Date();
        const next3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

        tareasMesActivo.forEach(t => {
            if (t.estado !== 'completada') {
                const date = new Date(t.fecha_entrega);
                if (date <= next3Days && date >= now) plazosCriticos++;
                
                if (t.materias) {
                    if (!materiaCounts[t.materias.id]) {
                        materiaCounts[t.materias.id] = { info: t.materias, count: 0 };
                    }
                    materiaCounts[t.materias.id].count++;
                }
            }
        });

        const sortedMaterias = Object.values(materiaCounts).sort((a,b) => b.count - a.count).slice(0, 3);

        areasEnfoqueList.innerHTML = '';

        if (sortedMaterias.length === 0 && plazosCriticos === 0) {
            areasEnfoqueList.innerHTML = '<p class="text-sm text-on-surface-variant font-medium text-center">Sin tareas pendientes este mes.</p>';
            return;
        }

        sortedMaterias.forEach(m => {
            areasEnfoqueList.innerHTML += `
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full" style="background-color: ${m.info.color}"></span>
                    <span class="text-sm font-medium text-on-surface-variant truncate max-w-[140px]">${m.info.nombre}</span>
                </div>
                <span class="text-sm font-extrabold text-on-surface">${m.count} tareas</span>
            </div>`;
        });

        if (plazosCriticos > 0) {
            areasEnfoqueList.innerHTML += `
            <div class="flex items-center justify-between mt-4 pt-4 border-t border-error/20 bg-error/5 -mx-6 px-6 pb-2 rounded-b-xl">
                <div class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full bg-error animate-pulse"></span>
                    <span class="text-sm font-bold text-error flex items-center gap-1">Plazos Críticos</span>
                </div>
                <span class="text-sm font-extrabold text-error">${plazosCriticos} asignaciones</span>
            </div>`;
        }
    }

    // Controles de mes
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            if (calendarViewMode === 'mensual') {
                currentDate.setMonth(currentDate.getMonth() - 1);
            } else {
                currentDate.setDate(currentDate.getDate() - 7);
            }
            renderCalendar();
        });
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            if (calendarViewMode === 'mensual') {
                currentDate.setMonth(currentDate.getMonth() + 1);
            } else {
                currentDate.setDate(currentDate.getDate() + 7);
            }
            renderCalendar();
        });
    }

    // Iniciar
    cargarTareasParaCalendario();
});
