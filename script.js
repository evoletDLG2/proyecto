// ============================================================================
// SISTEMA DE EQUIPOS v2.0 - VERSIÓN MEJORADA
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

// ============ CARGAR Y PROCESAR CSV (MEJORADO) ============

let archivosTemp = {};

function cargarCSV(tipo) {
    const input = document.getElementById(`csv${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`);
    if (!input.files[0]) {
        alert('Selecciona un archivo');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        archivosTemp[tipo] = e.target.result;
        alert(`✅ Archivo cargado. Ahora haz click en "Cargar"`);
    };
    reader.readAsText(input.files[0]);
}

function procesarCSV(tipo) {
    if (!archivosTemp[tipo]) return alert('Carga un archivo primero');

    try {
        const contenido = archivosTemp[tipo].trim();
        const lineas = contenido.split(/\r?\n/).filter(l => l.trim().length > 0);

        if (lineas.length === 0) {
            alert('El archivo está vacío');
            return;
        }

        if (tipo === 'estudiantes') {
            datos.estudiantes = [];
            let contador = 0;

            // Saltar encabezado si existe
            const inicio = lineas[0].toLowerCase().includes('nombre') ? 1 : 0;

            for (let i = inicio; i < lineas.length; i++) {
                const partes = lineas[i].split(',').map(p => p.trim()).filter(p => p.length > 0);
                
                if (partes.length >= 2) {
                    const nombre = partes[0];
                    const rol = partes[1];

                    // Validar que el rol sea válido
                    const rolesValidos = ['Líder', 'Comunicador', 'Ejecutor', 'Estratega', 'Motivador'];
                    if (rolesValidos.includes(rol)) {
                        datos.estudiantes.push({
                            id: Date.now() + i,
                            nombre: nombre,
                            rol: rol,
                            puntosPersonales: 0,
                            puntosEquipo: 0,
                            pasos: 0,
                            logros: [],
                            equipoId: null
                        });
                        contador++;
                    }
                }
            }

            if (contador > 0) {
                alert(`✅ ${contador} estudiantes cargados exitosamente`);
                guardarDatos();
                actualizarPanelProfesor();
            } else {
                alert('❌ No se cargaron estudiantes. Verifica el formato CSV');
            }
        }

        if (tipo === 'actividades') {
            datos.actividades = [];
            let contador = 0;

            const inicio = lineas[0].toLowerCase().includes('nombre') ? 1 : 0;

            for (let i = inicio; i < lineas.length; i++) {
                const partes = lineas[i].split(',').map(p => p.trim()).filter(p => p.length > 0);
                
                if (partes.length >= 1) {
                    const nombre = partes[0];
                    const descripcion = partes[1] || 'Sin descripción';

                    datos.actividades.push({
                        id: i,
                        nombre: nombre,
                        descripcion: descripcion
                    });
                    contador++;
                }
            }

            // Agregar Caminata como módulo secreto
            datos.actividades.push({
                id: 999,
                nombre: 'Caminata',
                descripcion: 'Módulo secreto - Registra tus pasos'
            });

            if (contador > 0) {
                alert(`✅ ${contador} actividades cargadas`);
                guardarDatos();
            } else {
                alert('❌ No se cargaron actividades');
            }
        }

        if (tipo === 'adversidades') {
            datos.adversidades = [];
            let contador = 0;

            for (let i = 0; i < lineas.length; i++) {
                const texto = lineas[i].trim();
                if (texto.length > 0) {
                    datos.adversidades.push({
                        id: i,
                        texto: texto
                    });
                    contador++;
                }
            }

            if (contador > 0) {
                alert(`✅ ${contador} adversidades cargadas`);
                guardarDatos();
            } else {
                alert('❌ No se cargaron adversidades');
            }
        }

    } catch (error) {
        alert('❌ Error al procesar archivo: ' + error.message);
    }
}

// ============ PANEL PROFESOR (INFORMACIÓN) ============

function actualizarPanelProfesor() {
    const container = document.getElementById('tabCargar');
    
    // Mostrar información de estudiantes cargados
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

    // Reemplazar contenido
    const cargarTab = document.getElementById('tabCargar');
    const existingInfo = cargarTab.querySelector('[style*="e8f8f5"]');
    if (existingInfo) {
        existingInfo.parentElement.innerHTML = infoHTML + existingInfo.parentElement.innerHTML;
    }
}

// ============ FICHAS Y EQUIPOS ============

function mostrarFichas() {
    const grid = document.getElementById('gridFichas');
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
    const fichas = document.querySelectorAll('.ficha');

    fichas.forEach(ficha => {
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
    equipo.miembros.push({
        id: estudiante.id,
        nombre: estudiante.nombre,
        rol: estudiante.rol
    });

    estudiante.equipoId = usuarioActual.equipoId;
    actualizarMiEquipo();
    mostrarFichas();
    guardarDatos();
}

function actualizarMiEquipo() {
    const container = document.getElementById('miEquipoContent');
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
        html += `
            <div class="agregar-miembro" onclick="mostrarFichas(); cambiarTab('fichas')">
                ➕
            </div>
        `;
    }

    html += '</div>';
    container.innerHTML = html;
}

// ============ RULETA ============

function girarRuleta() {
    if (datos.actividades.length === 0) {
        return alert('El profesor debe cargar actividades primero');
    }

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
        const actividad = datos.actividades[Math.floor(Math.random() * (datos.actividades.length - 1))];
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
    alert('✅ ¡Aceptado! Se sumaron puntos a tu equipo');
}

function rechazarActividad() {
    alert('❌ Sin problema, ¡para la próxima!');
}

// ============ PUNTUACIÓN ============

function actualizarPuntos() {
    const puntos = usuarioActual.puntosPersonales || 0;
    document.getElementById('puntosHeader').textContent = `Pts: ${puntos}`;
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

// ============ RANKING ============

function actualizarRanking() {
    const container = document.getElementById('tablaRanking');
    const ranking = [...datos.equipos].sort((a, b) => b.puntosEquipo - a.puntosEquipo);

    let html = '<table class="tabla-ranking"><tbody>';
    ranking.forEach((equipo, idx) => {
        const miembros = equipo.miembros.map(m => m.nombre).join(', ');
        html += `
            <tr>
                <td>${idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</td>
                <td>${miembros}</td>
                <td>${equipo.puntosEquipo} pts</td>
            </tr>
        `;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

// ============ LOGROS ============

function actualizarLogros() {
    const container = document.getElementById('logrosGrid');
    container.innerHTML = '';

    const logrosDisponibles = [
        { id: 1, nombre: 'Primer Paso', emoji: '👣', condicion: () => usuarioActual.pasos > 0 },
        { id: 2, nombre: 'Campeón', emoji: '🏆', condicion: () => usuarioActual.puntosPersonales > 30 },
        { id: 3, nombre: 'Explorador', emoji: '🔍', condicion: () => true },
        { id: 4, nombre: 'Equipo Perfecto', emoji: '👥', condicion: () => true }
    ];

    logrosDisponibles.forEach(logro => {
        const desbloqueado = logro.condicion();
        const html = `
            <div class="logro ${desbloqueado ? '' : 'bloqueado'}">
                <div class="logro-emoji">${logro.emoji}</div>
                <div class="logro-nombre">${logro.nombre}</div>
            </div>
        `;
        container.innerHTML += html;
    });
}

// ============ MÓDULO SECRETO PASOS ============

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
    if (equipo) {
        equipo.pasos = (equipo.pasos || 0) + pasos;
    }

    document.getElementById('totalPasos').textContent = usuarioActual.pasos;
    document.getElementById('inputPasos').value = '';
    guardarDatos();
    alert('✅ Pasos registrados');
}

// ============ NAVEGACIÓN ============

function cambiarTab(nombre) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    const tabId = nombre === 'miEquipo' ? 'tabMiEquipo' : nombre === 'fichas' ? 'tabFichas' : 'tab' + nombre.charAt(0).toUpperCase() + nombre.slice(1);
    const tab = document.getElementById(tabId);
    if (tab) {
        tab.classList.remove('hidden');
    }
    
    event.target.classList.add('active');

    if (nombre === 'ranking') actualizarRanking();
    if (nombre === 'logros') actualizarLogros();
    if (nombre === 'miEquipo') actualizarMiEquipo();
}

function cambiarTabProf(nombre) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    const tabId = 'tab' + nombre.charAt(0).toUpperCase() + nombre.slice(1);
    document.getElementById(tabId).classList.remove('hidden');
    event.target.classList.add('active');

    if (nombre === 'equipos') actualizarEquiposProf();
    if (nombre === 'resumen') actualizarResumenProf();
}

// ============ PANEL PROFESOR ============

function actualizarEquiposProf() {
    const container = document.getElementById('equiposProfesor');
    container.innerHTML = '';

    if (datos.equipos.length === 0) {
        container.innerHTML = '<p>Sin equipos formados aún</p>';
        return;
    }

    datos.equipos.forEach(equipo => {
        const miembros = equipo.miembros.map(m => `${m.nombre} (${m.rol})`).join(', ');
        const html = `
            <div class="seccion">
                <h3>Equipo ${equipo.id}</h3>
                <p><strong>Miembros:</strong> ${miembros}</p>
                <p><strong>Puntos:</strong> ${equipo.puntosEquipo}</p>
            </div>
        `;
        container.innerHTML += html;
    });

    actualizarSelectEquipos();
}

function actualizarSelectEquipos() {
    const select = document.getElementById('selectEquipo');
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
    const ranking = [...datos.equipos].sort((a, b) => b.puntosEquipo - a.puntosEquipo);

    let html = `
        <p><strong>Estudiantes:</strong> ${datos.estudiantes.length}</p>
        <p><strong>Equipos:</strong> ${datos.equipos.length}</p>
        <p><strong>Actividades:</strong> ${datos.actividades.length}</p>
        <br>
        <table class="tabla-ranking"><tbody>
    `;

    ranking.forEach((equipo, idx) => {
        const miembros = equipo.miembros.map(m => m.nombre).join(', ');
        html += `
            <tr>
                <td>${idx + 1}</td>
                <td>${miembros}</td>
                <td>${equipo.puntosEquipo} pts</td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    container.innerHTML = html;
}

// ============ ALMACENAMIENTO ============

function guardarDatos() {
    localStorage.setItem('sistemaEquipos', JSON.stringify(datos));
}

function cargarDatos() {
    const guardados = localStorage.getItem('sistemaEquipos');
    if (guardados) {
        Object.assign(datos, JSON.parse(guardados));
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', cargarDatos);
