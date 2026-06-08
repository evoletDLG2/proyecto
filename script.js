// ============================================================================
// SISTEMA DE EQUIPOS v2.0 - VERSIÓN MEJORADA (MÓVIL & GITHUB PAGES)
// ============================================================================

// DATOS GLOBALES
const datos = {
    estudiantes: [],
    equipos: [],
    actividades: [],
    adversidades: [],
    puntuaciones: {},
    pasos: {},
    logros: []
};

let usuarioActual = null;
const PASSWORD = '1234';

// Nombres exactos de tus archivos en GitHub
const ARCHIVO_ESTUDIANTES = 'Estudiantes_y_Roles.csv';
const ARCHIVO_ACTIVIDADES = 'Actividades_Completas_Unico_Archivo.csv';
const ARCHIVO_ADVERSIDADES = 'Adversidades_Directas.csv';

// ============ BÚSQUEDA FUZZY ============
function busquedaFuzzy(patron, texto) {
    patron = patron.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    texto = texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    let patronIdx = 0;
    for (let i = 0; i < texto.length; i++) {
        if (patron[patronIdx] === texto[i]) {
            patronIdx++;
        }
        if (patronIdx === patron.length) return true;
    }
    return false;
}

// ============ LOGIN ============
function mostrarLoginAlumno() {
    document.getElementById('loginAlumno').classList.remove('hidden');
    document.getElementById('loginProfesor').classList.add('hidden');
}

function mostrarLoginProfesor() {
    document.getElementById('loginProfesor').classList.remove('hidden');
    document.getElementById('loginAlumno').classList.add('hidden');
}

function volverLogin() {
    document.getElementById('loginAlumno').classList.add('hidden');
    document.getElementById('loginProfesor').classList.add('hidden');
}

function loginAlumnoFunc() {
    const nombre = document.getElementById('inputNombreAlumno').value.trim();
    if (!nombre) return alert('Escribe tu nombre');

    if (datos.estudiantes.length === 0) {
        return alert('Las listas aún se están cargando desde el servidor. Intenta de nuevo en 3 segundos.');
    }

    const estudiante = datos.estudiantes.find(e => busquedaFuzzy(nombre, e.nombre));
    
    if (!estudiante) {
        return alert('Nombre no encontrado. Verifica la ortografía.');
    }

    usuarioActual = { tipo: 'alumno', ...estudiante };
    abrirPanelAlumno();
}

function loginProfesorFunc() {
    const password = document.getElementById('inputPasswordProfesor').value;
    if (password !== PASSWORD) return alert('Contraseña incorrecta');

    usuarioActual = { tipo: 'profesor' };
    abrirPanelProfesor();
}

function abrirPanelAlumno() {
    document.getElementById('pantallaLogin').classList.add('hidden');
    document.getElementById('panelAlumno').classList.remove('hidden');
    
    document.getElementById('nombreAlumnoHeader').textContent = usuarioActual.nombre;
    document.getElementById('rolBadge').textContent = usuarioActual.rol;
    actualizarPuntos();
    mostrarFichas();
}

function abrirPanelProfesor() {
    document.getElementById('pantallaLogin').classList.add('hidden');
    document.getElementById('panelProfesor').classList.remove('hidden');
    actualizarPanelProfesor();
}

function logout() {
    usuarioActual = null;
    document.getElementById('pantallaLogin').classList.remove('hidden');
    document.getElementById('panelAlumno').classList.add('hidden');
    document.getElementById('panelProfesor').classList.add('hidden');
}

// ============ NUEVA FUNCIÓN: CARGAR AUTOMÁTICAMENTE DESDE GITHUB ============
async function cargarArchivosDesdeGitHub() {
    console.log("Iniciando carga automática de archivos CSV...");
    
    // 1. Cargar Estudiantes
    try {
        const res = await fetch(ARCHIVO_ESTUDIANTES);
        if (res.ok) {
            const texto = await res.text();
            procesarContenidoCSV('estudiantes', texto);
        } else {
            console.error("No se encontró el archivo de estudiantes en GitHub.");
        }
    } catch (err) { console.error("Error cargando estudiantes:", err); }

    // 2. Cargar Actividades
    try {
        const res = await fetch(ARCHIVO_ACTIVIDADES);
        if (res.ok) {
            const texto = await res.text();
            procesarContenidoCSV('actividades', texto);
        }
    } catch (err) { console.error("Error cargando actividades:", err); }

    // 3. Cargar Adversidades
    try {
        const res = await fetch(ARCHIVO_ADVERSIDADES);
        if (res.ok) {
            const texto = await res.text();
            procesarContenidoCSV('adversidades', texto);
        }
    } catch (err) { console.error("Error cargando adversidades:", err); }
}

// ============ PROCESAR DATOS CSV (ADAPTADO) ============
function procesarContenidoCSV(tipo, contenido) {
    try {
        const lineas = contenido.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
        if (lineas.length === 0) return;

        if (tipo === 'estudiantes') {
            // Mantener equipos existentes si ya se guardaron en localStorage
            const equiposPrevios = datos.estudiantes.reduce((acc, curr) => {
                if (curr.equipoId) acc[curr.nombre] = curr;
                return acc;
            }, {});

            datos.estudiantes = [];
            const inicio = lineas[0].toLowerCase().includes('nombre') ? 1 : 0;

            for (let i = inicio; i < lineas.length; i++) {
                const partes = lineas[i].split(',').map(p => p.trim()).filter(p => p.length > 0);
                if (partes.length >= 2) {
                    const nombre = partes[0];
                    const rol = partes[1];
                    const rolesValidos = ['Líder', 'Comunicador', 'Ejecutor', 'Estratega', 'Motivador'];
                    
                    if (rolesValidos.includes(rol)) {
                        // Si el alumno ya tenía progreso local, lo conservamos
                        const previo = equiposPrevios[nombre];
                        
                        datos.estudiantes.push({
                            id: previo ? previo.id : Date.now() + i,
                            nombre: nombre,
                            rol: rol,
                            puntosPersonales: previo ? previo.puntosPersonales : 0,
                            puntosEquipo: previo ? previo.puntosEquipo : 0,
                            pasos: previo ? previo.pasos : 0,
                            logros: previo ? previo.logros : [],
                            equipoId: previo ? previo.equipoId : null
                        });
                    }
                }
            }
            console.log(`✅ ${datos.estudiantes.length} estudiantes listos.`);
        }

        if (tipo === 'actividades') {
            datos.actividades = [];
            const inicio = lineas[0].toLowerCase().includes('nombre') ? 1 : 0;

            for (let i = inicio; i < lineas.length; i++) {
                const partes = lineas[i].split(',').map(p => p.trim()).filter(p => p.length > 0);
                if (partes.length >= 1) {
                    datos.actividades.push({
                        id: i,
                        nombre: partes[0],
                        descripcion: partes[1] || 'Sin descripción'
                    });
                }
            }
            datos.actividades.push({ id: 999, nombre: 'Caminata', descripcion: 'Módulo secreto - Registra tus pasos' });
            console.log(`✅ ${datos.actividades.length} actividades listas.`);
        }

        if (tipo === 'adversidades') {
            datos.adversidades = [];
            for (let i = 0; i < lineas.length; i++) {
                const texto = lineas[i].trim();
                if (texto.length > 0) {
                    datos.adversidades.push({ id: i, texto: texto });
                }
            }
            console.log(`✅ ${datos.adversidades.length} adversidades listas.`);
        }

        guardarDatos();
    } catch (error) {
        console.error('Error procesando CSV automático:', error.message);
    }
}

// (El resto de tus funciones se mantienen igual para no alterar tu juego)

let archivosTemp = {};
function cargarCSV(tipo) {
    const input = document.getElementById(`csv${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`);
    if (!input.files[0]) return alert('Selecciona un archivo');
    const reader = new FileReader();
    reader.onload = (e) => {
        archivosTemp[tipo] = e.target.result;
        alert(`✅ Archivo cargado manualmente. Haz click en "Procesar"`);
    };
    reader.readAsText(input.files[0]);
}

function procesarCSV(tipo) {
    if (!archivosTemp[tipo]) return alert('Carga un archivo primero');
    procesarContenidoCSV(tipo, archivosTemp[tipo]);
    alert(`✅ Procesado manual de ${tipo} completado.`);
    if (tipo === 'estudiantes') actualizarPanelProfesor();
}

function actualizarPanelProfesor() {
    const container = document.getElementById('tabCargar');
    if (!container) return;
    
    let infoHTML = `
        <div style="background: #e8f8f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #2c3e50; margin-bottom: 15px;">📊 INFORMACIÓN ACTUAL</h3>
            <p><strong>Estudiantes cargados:</strong> ${datos.estudiantes.length}</p>
            <p><strong>Actividades cargadas:</strong> ${datos.actividades.length}</p>
            <p><strong>Adversidades cargadas:</strong> ${datos.adversidades.length}</p>
            <p><strong>Equipos formados:</strong> ${datos.equipos.length}</p>
        </div>
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #2c3e50; margin-bottom: 15px;">👥 ESTUDIANTES REGISTRADOS</h3>
    `;

    if (datos.estudiantes.length > 0) {
        infoHTML += '<div style="max-height: 300px; overflow-y: auto;">';
        datos.estudiantes.forEach((est, idx) => {
            infoHTML += `<p style="padding: 5px; border-bottom: 1px solid #ddd;"><strong>${idx + 1}.</strong> ${est.nombre} - <span style="background: #4ECDC4; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${est.rol}</span></p>`;
        });
        infoHTML += '</div>';
    } else {
        infoHTML += '<p style="color: #666;">No hay estudiantes cargados aún</p>';
    }
    infoHTML += '</div>';

    const existingInfo = container.querySelector('[style*="e8f8f5"]');
    if (existingInfo) {
        existingInfo.parentElement.innerHTML = infoHTML + existingInfo.parentElement.innerHTML;
    }
}

function mostrarFichas() {
    const grid = document.getElementById('gridFichas');
    if (!grid) return;
    grid.innerHTML = '';
    const miRol = usuarioActual.rol;

    datos.estudiantes.forEach(est => {
        if (est.id === usuarioActual.id) return;
        if (est.equipoId) return;
        if (est.rol === miRol) return;

        const ficha = document.createElement('div');
        ficha.className = 'ficha';
        ficha.innerHTML = `
            <div class="ficha-nombre">${est.nombre}</div>
            <div class="ficha-rol">${est.rol}</div>
        `;
        ficha.onclick = () => invitarAlEquipo(est.id);
        grid.appendChild(ficha);
    });
}

function filtrarCompaneros() {
    const filtro = document.getElementById('buscarCompanero').value;
    document.querySelectorAll('.ficha').forEach(ficha => {
        ficha.style.display = busquedaFuzzy(filtro, ficha.textContent) ? 'block' : 'none';
    });
}

function invitarAlEquipo(estudianteId) {
    const estudiante = datos.estudiantes.find(e => e.id === estudianteId);
    if (!usuarioActual.equipoId) {
        const nuevoEquipo = {
            id: Date.now(),
            miembros: [
                { id: usuarioActual.id, nombre: usuarioActual.nombre, rol: usuarioActual.rol },
                { id: estudiante.id, nombre: estudiante.nombre, rol: estudiante.rol }
            ],
            puntosEquipo: 0
        };
        datos.equipos.push(nuevoEquipo);
        usuarioActual.equipoId = nuevoEquipo.id;
        estudiante.equipoId = nuevoEquipo.id;
        actualizarMiEquipo();
        mostrarFichas();
        guardarDatos();
    }
}

function agregarMiembroAlEquipo(estudianteId) {
    const equipo = datos.equipos.find(e => e.id === usuarioActual.equipoId);
    if (!equipo || equipo.miembros.length >= 3) return alert('El equipo está completo');

    const estudiante = datos.estudiantes.find(e => e.id === estudianteId);
    equipo.miembros.push({ id: estudiante.id, nombre: estudiante.nombre, rol: estudiante.rol });
    estudiante.equipoId = usuarioActual.equipoId;
    actualizarMiEquipo();
    mostrarFichas();
    guardarDatos();
}

function actualizarMiEquipo() {
    const container = document.getElementById('miEquipoContent');
    if (!container) return;
    const equipo = datos.equipos.find(e => e.id === usuarioActual.equipoId);

    if (!equipo) {
        container.innerHTML = '<p>Sin equipo aún. Ve a "Fichas" para invitar compañeros.</p>';
        return;
    }

    let html = '<div class="equipo-container">';
    equipo.miembros.forEach(miembro => {
        html += `
            <div class="miembro-equipo">
                <div class="miembro-equipo-nombre">${miembro.nombre}</div>
                <div class="miembro-equipo-rol">${miembro.rol}</div>
            </div>
        `;
    });
    if (equipo.miembros.length < 3) {
        html += `<div class="agregar-miembro" onclick="mostrarFichas(); cambiarTab('fichas')">➕</div>`;
    }
    html += '</div>';
    container.innerHTML = html;
}

function girarRuleta() {
    if (datos.actividades.length === 0) return alert('No hay actividades cargadas.');
    const btn = document.getElementById('btnGirar');
    btn.disabled = true;
    const ruleta = document.querySelector('.ruleta');
    ruleta.style.transform = 'rotate(0deg)';
    ruleta.style.transition = 'none';

    setTimeout(() => {
        ruleta.style.transition = 'transform 3s ease-out';
        ruleta.style.transform = `rotate(${Math.random() * 360 + 720}deg)`;
    }, 10);

    setTimeout(() => {
        const de VerdadActividades = datos.actividades.filter(a => a.id !== 999);
        const actividad = de VerdadActividades[Math.floor(Math.random() * de VerdadActividades.length)] || datos.actividades[0];
        const adversidad = datos.adversidades[Math.floor(Math.random() * datos.adversidades.length)];

        document.getElementById('actividadNombre').textContent = actividad.nombre;
        document.getElementById('actividadDescripcion').textContent = actividad.descripcion;
        document.getElementById('actividadActual').classList.remove('hidden');

        if (adversidad) {
            document.getElementById('adversidadTexto').textContent = adversidad.texto;
            document.getElementById('adversidadActual').classList.remove('hidden');
        }
        btn.disabled = false;
    }, 3000);
}

function aceptarActividad() {
    const equipo = datos.equipos.find(e => e.id === usuarioActual.equipoId);
    if (equipo) {
        equipo.puntosEquipo += 5;
        usuarioActual.puntosPersonales += 3;
    }
    actualizarPuntos();
    guardarDatos();
    alert('✅ ¡Aceptado! Se sumaron puntos');
}

function jalarLocalStorage() {
    const guardados = localStorage.getItem('sistemaEquipos');
    if (guardados) {
        const locales = JSON.parse(guardados);
        if (locales.equipos) datos.equipos = locales.equipos;
        if (locales.estudiantes && datos.estudiantes.length > 0) {
            // Sincronizar puntos guardados localmente
            locales.estudiantes.forEach(lEst => {
                const match = datos.estudiantes.find(e => e.nombre === lEst.nombre);
                if (match) {
                    match.puntosPersonales = lEst.puntosPersonales;
                    match.equipoId = lEst.equipoId;
                    match.pasos = lEst.pasos;
                }
            });
        }
    }
}

function registrarPuntuacionProf() {
    const equipoId = document.getElementById('selectEquipo').value;
    const personal = parseInt(document.getElementById('inputPuntosPersonal').value) || 0;
    const equipo = parseInt(document.getElementById('inputPuntosEquipo').value) || 0;
    const equipoObj = datos.equipos.find(e => e.id == equipoId);
    if (!equipoObj) return alert('Selecciona un equipo');

    equipoObj.puntosEquipo += equipo;
    equipoObj.miembros.forEach(m => {
        const est = datos.estudiantes.find(e => e.id === m.id);
        if (est) est.puntosPersonales += personal;
    });
    guardarDatos();
    alert('✅ Puntuación registrada');
}

function actualizarPuntos() {
    const puntos = usuarioActual.puntosPersonales || 0;
    document.getElementById('puntosHeader').textContent = `Pts: ${puntos}`;
}

function actualizarRanking() {
    const container = document.getElementById('tablaRanking');
    if (!container) return;
    const ranking = [...datos.equipos].sort((a, b) => b.puntosEquipo - a.puntosEquipo);
    let html = '<table class="tabla-ranking"><tbody>';
    ranking.forEach((equipo, idx) => {
        const miembros = equipo.miembros.map(m => m.nombre).join(', ');
        html += `<tr><td>${idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</td><td>${miembros}</td><td>${equipo.puntosEquipo} pts</td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

function actualizarLogros() {
    const container = document.getElementById('logrosGrid');
    if (!container) return;
    container.innerHTML = '';
    const logrosDisponibles = [
        { id: 1, nombre: 'Primer Paso', emoji: '👣', condicion: () => usuarioActual.pasos > 0 },
        { id: 2, nombre: 'Campeón', emoji: '🏆', condicion: () => usuarioActual.puntosPersonales > 30 },
        { id: 3, nombre: 'Explorador', emoji: '🔍', condicion: () => true },
        { id: 4, nombre: 'Equipo Perfecto', emoji: '👥', condicion: () => true }
    ];
    logrosDisponibles.forEach(logro => {
        const desbloqueado = logro.condicion();
        container.innerHTML += `<div class="logro ${desbloqueado ? '' : 'bloqueado'}"><div class="logro-emoji">${logro.emoji}</div><div class="logro-nombre">${logro.nombre}</div></div>`;
    });
}

document.addEventListener('click', function(e) {
    if (e.target.id === 'nombreAlumnoHeader') {
        let clicks = parseInt(sessionStorage.getItem('clicks') || 0) + 1;
        sessionStorage.setItem('clicks', clicks);
        if (clicks === 5) {
            document.getElementById('moduloPasos').classList.remove('hidden');
            sessionStorage.setItem('clicks', 0);
        }
    }
});

function registrarPasos() {
    const pasos = parseInt(document.getElementById('inputPasos').value) || 0;
    usuarioActual.pasos += pasos;
    const equipo = datos.equipos.find(e => e.id === usuarioActual.equipoId);
    if (equipo) equipo.pasos = (equipo.pasos || 0) + pasos;
    document.getElementById('totalPasos').textContent = usuarioActual.pasos;
    document.getElementById('inputPasos').value = '';
    guardarDatos();
    alert('✅ Pasos registrados');
}

function cambiarTab(nombre) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const tabId = nombre === 'miEquipo' ? 'tabMiEquipo' : nombre === 'fichas' ? 'tabFichas' : 'tab' + nombre.charAt(0).toUpperCase() + nombre.slice(1);
    const tab = document.getElementById(tabId);
    if (tab) tab.classList.remove('hidden');
    if (event && event.target) event.target.classList.add('active');
    if (nombre === 'ranking') actualizarRanking();
    if (nombre === 'logros') actualizarLogros();
    if (nombre === 'miEquipo') actualizarMiEquipo();
}

function cambiarTabProf(nombre) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById('tab' + nombre.charAt(0).toUpperCase() + nombre.slice(1)).classList.remove('hidden');
    if (event && event.target) event.target.classList.add('active');
    if (nombre === 'equipos') actualizarEquiposProf();
    if (nombre === 'resumen') actualizarResumenProf();
}

function actualizarEquiposProf() {
    const container = document.getElementById('equiposProfesor');
    if (!container) return;
    container.innerHTML = '';
    if (datos.equipos.length === 0) {
        container.innerHTML = '<p>Sin equipos formados aún</p>';
        return;
    }
    datos.equipos.forEach(equipo => {
        const miembros = equipo.miembros.map(m => `${m.nombre} (${m.rol})`).join(', ');
        container.innerHTML += `<div class="seccion"><h3>Equipo ${equipo.id}</h3><p><strong>Miembros:</strong> ${miembros}</p><p><strong>Puntos:</strong> ${equipo.puntosEquipo}</p></div>`;
    });
    actualizarSelectEquipos();
}

function actualizarSelectEquipos() {
    const select = document.getElementById('selectEquipo');
    if (!select) return;
    select.innerHTML = '<option value="">-- Selecciona equipo --</option>';
    datos.equipos.forEach(equipo => {
        const miembros = equipo.miembros.map(m => m.nombre).join(', ');
        const option = document.createElement('option');
        option.value = equipo.id;
        option.textContent = `${miembros} (${equipo.puntosEquipo} pts)`;
        select.appendChild(option);
    });
}

function actualizarResumenProf() {
    const container = document.getElementById('resumenGeneral');
    if (!container) return;
    const ranking = [...datos.equipos].sort((a, b) => b.puntosEquipo - a.puntosEquipo);
    let html = `<p><strong>Estudiantes:</strong> ${datos.estudiantes.length}</p><p><strong>Equipos:</strong> ${datos.equipos.length}</p><p><strong>Actividades:</strong> ${datos.actividades.length}</p><br><table class="tabla-ranking"><tbody>`;
    ranking.forEach((equipo, idx) => {
        const miembros = equipo.miembros.map(m => m.nombre).join(', ');
        html += `<tr><td>${idx + 1}</td><td>${miembros}</td><td>${equipo.puntosEquipo} pts</td></tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

function guardarDatos() {
    localStorage.setItem('sistemaEquipos', JSON.stringify(datos));
}

// NUEVA INICIALIZACIÓN COMPUESTA
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Descargar los archivos CSV reales desde GitHub de forma asíncrona
    await cargarArchivosDesdeGitHub();
    // 2. Traer el progreso guardado localmente en el dispositivo (puntos, equipos formados)
    jalarLocalStorage();
});
