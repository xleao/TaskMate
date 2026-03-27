const fs = require('fs');
const path = require('path');

const folder = 'c:/Users/Leonardo/Desktop/LovePoints/Tareas/html/';
const files = ['dashboard.html', 'tareas.html', 'calendario.html', 'materias.html'];

files.forEach(file => {
    const filePath = path.join(folder, file);
    if (!fs.existsSync(filePath)) {
        console.log(`Skipping ${file}, not found.`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Expresión regular para buscar etiquetas <a> que tengan href="#" o href="" y contengan los textos clave
    content = content.replace(/<a([^>]*?)href=(["'])(?:#|)(["'])([^>]*?)(>[\s\S]*?>Dashboard\s*<\/span>\s*<\/a>)/g, '<a$1href="./dashboard.html"$4$5');
    content = content.replace(/<a([^>]*?)href=(["'])(?:#|)(["'])([^>]*?)(>[\s\S]*?>Tasks\s*<\/span>\s*<\/a>)/g, '<a$1href="./tareas.html"$4$5');
    content = content.replace(/<a([^>]*?)href=(["'])(?:#|)(["'])([^>]*?)(>[\s\S]*?>Calendar\s*<\/span>\s*<\/a>)/g, '<a$1href="./calendario.html"$4$5');
    content = content.replace(/<a([^>]*?)href=(["'])(?:#|)(["'])([^>]*?)(>[\s\S]*?>Subjects\s*<\/span>\s*<\/a>)/g, '<a$1href="./materias.html"$4$5');

    // Also update "Ver Tareas" buttons on dashboard just in case
    if (file === 'dashboard.html') {
        content = content.replace(/<button class="bg-surface-container-lowest text-primary/g, '<button onclick="window.location.href=\'./tareas.html\'" class="bg-surface-container-lowest text-primary');
        content = content.replace(/<button class="text-primary font-bold text-sm hover:underline">Ver Todo<\/button>/g, '<button onclick="window.location.href=\'./tareas.html\'" class="text-primary font-bold text-sm hover:underline">Ver Todo</button>');
    }

    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
});
