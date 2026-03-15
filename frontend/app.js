const API_URL = 'http://localhost:3000/api';

let usuarioActual = null;
let rolActual = 'cliente';

// LOGIN
async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const rol = document.getElementById('rol').value;

    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, rol })
    });

    const data = await response.json();

    if (data.success) {
        usuarioActual = data;
        rolActual = rol;

        document.getElementById('loginSection').classList.add('hidden');
        document.getElementById('userInfo').classList.remove('hidden');
        document.getElementById('dashboard').classList.remove('hidden');

        document.getElementById('bienvenida').innerText = `👋 Bienvenido, ${data.nombre} (${rol})`;
        cargarMenu();
        mostrarPanel('inicio');
    } else {
        document.getElementById('loginError').innerText = data.error || 'Error al iniciar sesión';
        document.getElementById('loginError').classList.remove('hidden');
    }
}

function logout() {
    usuarioActual = null;
    document.getElementById('loginSection').classList.remove('hidden');
    document.getElementById('userInfo').classList.add('hidden');
    document.getElementById('dashboard').classList.add('hidden');
}

function cargarMenu() {
    let menuHtml = '';
    if (rolActual === 'cliente') {
        menuHtml = `
            <button onclick="mostrarPanel('saldos')">💰 Ver saldos</button>
            <button onclick="mostrarPanel('creditos')">📋 Mis créditos</button>
            <button onclick="mostrarPanel('solicitarCredito')">➕ Solicitar crédito</button>
            <button onclick="mostrarPanel('solicitarCuenta')">🏦 Solicitar cuenta</button>
        `;
    } else {
        menuHtml = `
            <button onclick="mostrarPanel('buscarCliente')">🔍 Buscar cliente</button>
            <button onclick="mostrarPanel('pagosVencer')">⚠️ Pagos por vencer</button>
            <button onclick="mostrarPanel('solicitarParaCliente')">📝 Solicitar para cliente</button>
        `;
    }
    document.getElementById('menuDinamico').innerHTML = menuHtml;
}

async function mostrarPanel(opcion) {
    let contenido = '<h3>Cargando...</h3>';
    document.getElementById('panelContenido').innerHTML = contenido;

    if (opcion === 'saldos') {
        contenido = await verSaldos();
    } else if (opcion === 'creditos') {
        contenido = await verCreditos();
    } else if (opcion === 'solicitarCredito') {
        contenido = formSolicitarCredito();
    } else if (opcion === 'solicitarCuenta') {
        contenido = formSolicitarCuenta();
    } else if (opcion === 'buscarCliente') {
        contenido = formBuscarCliente();
    } else if (opcion === 'pagosVencer') {
        contenido = await verPagosVencer();
    } else {
        contenido = '<h3>Selecciona una opción del menú</h3>';
    }

    document.getElementById('panelContenido').innerHTML = contenido;
}

// CLIENTE: Ver saldos
async function verSaldos() {
    const res = await fetch(`${API_URL}/clientes/${usuarioActual.idCliente}/cuentas-ahorro`);
    const data = await res.json();
    if (!data.success) return '<p>Error al cargar saldos</p>';

    let html = '<h3>💰 Mis saldos</h3><table><tr><th>Tipo</th><th>Saldo</th><th>Apertura</th></tr>';
    data.data.forEach(c => {
        html += `<tr><td>${c.TipoCuenta}</td><td>Q${c.Saldo}</td><td>${c.FechaAperturo}</td></tr>`;
    });
    html += '</table>';
    return html;
}

// CLIENTE: Ver créditos
async function verCreditos() {
    const res = await fetch(`${API_URL}/clientes/${usuarioActual.idCliente}/creditos`);
    const data = await res.json();
    if (!data.success) return '<p>Error al cargar créditos</p>';

    let html = '<h3>📋 Mis créditos</h3><table><tr><th>Producto</th><th>Monto</th><th>Pendiente</th><th>Vencimiento</th></tr>';
    data.data.forEach(c => {
        html += `<tr><td>${c.TipoCredito}</td><td>Q${c.MontoAprobado}</td><td>Q${c.SaldoPendiente}</td><td>${c.FechaVencimiento}</td></tr>`;
    });
    html += '</table>';
    return html;
}

// CLIENTE: Form solicitar crédito
function formSolicitarCredito() {
    return `
        <h3>➕ Solicitar nuevo crédito</h3>
        <div class="form-group"><label>Tipo:</label><input id="credTipo" value="Personal"></div>
        <div class="form-group"><label>Monto (Q):</label><input id="credMonto" type="number" value="10000"></div>
        <div class="form-group"><label>Plazo (meses):</label><input id="credPlazo" type="number" value="24"></div>
        <div class="form-group"><label>Descripción:</label><input id="credDesc" value="Préstamo"></div>
        <button onclick="enviarSolicitudCredito()">Enviar</button>
    `;
}

async function enviarSolicitudCredito() {
    const body = {
        idCliente: usuarioActual.idCliente,
        tipo: document.getElementById('credTipo').value,
        monto: document.getElementById('credMonto').value,
        plazo: document.getElementById('credPlazo').value,
        descripcion: document.getElementById('credDesc').value
    };
    await fetch(`${API_URL}/solicitar-credito`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    alert('Solicitud enviada (simulada)');
}

// COLABORADOR: Buscar cliente
function formBuscarCliente() {
    return `
        <h3>🔍 Buscar cliente</h3>
        <div class="form-group"><input id="buscarInput" placeholder="Nombre..."></div>
        <button onclick="buscarCliente()">Buscar</button>
        <div id="resultadoBusqueda"></div>
    `;
}

async function buscarCliente() {
    const termino = document.getElementById('buscarInput').value;
    const res = await fetch(`${API_URL}/buscar-clientes?termino=${termino}`);
    const data = await res.json();
    if (!data.success) return;
    let html = '<h4>Resultados:</h4><ul>';
    data.data.forEach(c => html += `<li>${c.NombreCompleto} - ${c.TelefonoLaboral || 'sin teléfono'}</li>`);
    html += '</ul>';
    document.getElementById('resultadoBusqueda').innerHTML = html;
}

// COLABORADOR: Ver pagos por vencer
async function verPagosVencer() {
    const res = await fetch(`${API_URL}/pagos-por-vencer`);
    const data = await res.json();
    if (!data.success) return '<p>Error al cargar</p>';
    let html = '<h3>⚠️ Pagos próximos a vencer</h3><table><tr><th>Cliente</th><th>Teléfono</th><th>Producto</th><th>Próximo pago</th><th>Monto</th></tr>';
    data.data.forEach(p => {
        html += `<tr><td>${p.Cliente}</td><td>${p.TelefonoLaboral}</td><td>${p.TipoCredito}</td><td>${p.FechaProximoPago}</td><td>Q${p.MontoCuota}</td></tr>`;
    });
    html += '</table>';
    return html;
}

// CLIENTE: Form solicitar cuenta
function formSolicitarCuenta() {
    return `
        <h3>🏦 Solicitar nueva cuenta</h3>
        <div class="form-group"><label>Tipo:</label><input id="ctaTipo" value="Ahorros"></div>
        <div class="form-group"><label>Monto inicial (Q):</label><input id="ctaMonto" type="number" value="500"></div>
        <button onclick="enviarSolicitudCuenta()">Enviar</button>
    `;
}

async function enviarSolicitudCuenta() {
    const body = {
        idCliente: usuarioActual.idCliente,
        tipoCuenta: document.getElementById('ctaTipo').value,
        montoInicial: document.getElementById('ctaMonto').value
    };
    await fetch(`${API_URL}/solicitar-cuenta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    alert('Solicitud enviada (simulada)');
}