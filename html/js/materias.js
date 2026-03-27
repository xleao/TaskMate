// Archivo: materias.js
// Lógica para renderizar y gestionar materias en materias.html

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar sesión primero
    await window.checkUser('materias');

    const subjectsList = document.getElementById('subjects-list');
    const subjectNameInput = document.getElementById('subject-name');
    const colorButtons = document.querySelectorAll('.color-picker-btn');
    const saveButton = document.getElementById('save-subject-btn');
    let selectedColor = '#3525cd'; // Default color (Primary)

    // Configurar selección de color
    colorButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remover estilos visuales de selección previa
            colorButtons.forEach(b => {
                b.classList.remove('ring-offset-2', 'ring-2', 'ring-primary', 'ring-teal-500', 'ring-error', 'ring-secondary', 'ring-amber-500');
            });
            // Activar botón actual (esto depende de cómo está construido el HTML)
            btn.classList.add('ring-offset-2', 'ring-2', 'ring-gray-800');
            selectedColor = btn.getAttribute('data-color');
        });
    });

    // Cargar materias
    async function renderMaterias() {
        subjectsList.innerHTML = '<p class="text-center text-on-surface-variant py-4">Cargando materias...</p>';
        const materias = await window.api.getMaterias();

        if (materias.length === 0) {
            subjectsList.innerHTML = `
                <div class="text-center py-8">
                    <span class="material-symbols-outlined text-4xl text-outline mb-2">category</span>
                    <p class="text-outline font-medium">Aún no tienes materias, crea la primera.</p>
                </div>
            `;
            return;
        }

        subjectsList.innerHTML = '';
        materias.forEach(m => {
            // Generar item HTML
            const div = document.createElement('div');
            div.className = "bg-surface-container-lowest p-5 rounded-xl flex items-center justify-between group transition-all duration-300 hover:translate-x-1";
            div.innerHTML = `
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm" style="background-color: ${m.color}">
                        <div class="w-4 h-4 rounded-full bg-white/40 ring-4 ring-white/20"></div>
                    </div>
                    <div>
                        <p class="font-headline font-bold text-lg text-on-surface">${m.nombre}</p>
                        <span class="text-xs font-label text-on-surface-variant uppercase tracking-wider">Materia Guardada</span>
                    </div>
                </div>
                <div class="flex gap-1">
                    <button class="delete-btn p-2 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-lg transition-colors" data-id="${m.id}">
                        <span class="material-symbols-outlined text-[20px]" data-icon="delete">delete</span>
                    </button>
                </div>
            `;

            // Configurar botón eliminar
            div.querySelector('.delete-btn').addEventListener('click', async (e) => {
                if(confirm('¿Eliminar esta materia? Las tareas asociadas perderán su categoría.')) {
                    await window.api.deleteMateria(m.id);
                    renderMaterias(); // Recargar
                }
            });

            subjectsList.appendChild(div);
        });
    }

    // Guardar nueva materia
    if(saveButton) {
        saveButton.addEventListener('click', async () => {
            const nombre = subjectNameInput.value.trim();
            if (!nombre) return alert('El nombre es obligatorio');
            
            saveButton.disabled = true;
            saveButton.innerHTML = "Guardando...";

            try {
                await window.api.addMateria(nombre, selectedColor);
                subjectNameInput.value = ''; // limpiar
                renderMaterias(); // recargar
            } catch(e) {
                alert('Error al guardar: ' + e.message);
            } finally {
                saveButton.disabled = false;
                saveButton.innerHTML = `<span class="material-symbols-outlined" data-icon="save">save</span> Guardar Materia`;
            }
        });
    }

    // Inicializar app render
    renderMaterias();
});
