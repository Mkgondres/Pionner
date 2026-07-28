import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { 
    getFirestore, doc, getDoc, getDocs, collection, addDoc, 
    serverTimestamp, query, where, enableIndexedDbPersistence, updateDoc 
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAhueHCWyIWibnQCf_8gSH3KP6eliAW5Vk",
  authDomain: "pionner-7c1ef.firebaseapp.com",
  projectId: "pionner-7c1ef",
  storageBucket: "pionner-7c1ef.firebasestorage.app",
  messagingSenderId: "205435907267",
  appId: "1:205435907267:web:6bcd4a919afa5610a44676"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

enableIndexedDbPersistence(db).catch(() => {});

let currentUser = '';
let currentUserName = '';

function showMessage(text, type) {
    const msgBox = document.getElementById('feedbackMessage');
    if (msgBox) {
        msgBox.textContent = text;
        msgBox.className = 'feedback-message ' + type;
    }
}

function clearMessage() {
    const msgBox = document.getElementById('feedbackMessage');
    if (msgBox) {
        msgBox.className = 'feedback-message';
        msgBox.textContent = '';
    }
}

function selectUser(userId, userName) {
    currentUser = userId;
    currentUserName = userName;
    document.getElementById('userPin').value = '';
    clearMessage();
    document.getElementById('userNameDisplay').textContent = '¡Hola, ' + userName + '!';
    document.getElementById('roleSelection').classList.remove('active');
    document.getElementById('authSection').classList.add('active');
}

function goBack() {
    currentUser = '';
    currentUserName = '';
    clearMessage();
    document.getElementById('authSection').classList.remove('active');
    document.getElementById('roleSelection').classList.add('active');
}

function logout() {
    currentUser = '';
    currentUserName = '';
    document.getElementById('mainApp').classList.remove('active');
    document.getElementById('roleSelection').classList.add('active');
}

async function verifyPin() {
    const userPinInput = document.getElementById('userPin');
    const pinIngresado = userPinInput.value;
    clearMessage();

    if (pinIngresado === '') {
        showMessage('Por favor, ingresa tu PIN de 4 dígitos.', 'error');
        return;
    }

    try {
        const docRef = doc(db, "usuarios", currentUser);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            if (pinIngresado === docSnap.data().pin) {
                document.getElementById('authSection').classList.remove('active');
                document.getElementById('mainApp').classList.add('active');
                configurarPantallaPrincipal(currentUser, currentUserName);
                verificarNotificacionesPendientes();
            } else {
                showMessage('PIN incorrecto.', 'error');
                userPinInput.value = '';
            }
        }
    } catch (e) {
        document.getElementById('authSection').classList.remove('active');
        document.getElementById('mainApp').classList.add('active');
        configurarPantallaPrincipal(currentUser, currentUserName);
    }
}

window.configurarPantallaPrincipal = function(userId, userName) {
    document.getElementById('welcomeUserText').innerText = `Usuario activo: ${userName}`;
    const btnCuadre = document.getElementById('btnIniciarCuadre');
    const btnAjustes = document.getElementById('btnAjustesMenu');

    if (userId === 'yoandri') {
        btnCuadre.style.display = 'block';
        btnAjustes.style.display = 'none';
    } else {
        btnCuadre.style.display = 'none';
        btnAjustes.style.display = 'block';
    }
}

const ORDEN_MAESTRO = [
    "Tortica", "Pasteles", "Pan Suave", "Sal 1lb", "Sal 1kg",
    "*** Configuras y Snacks ***",
    "Caramelo Largo", "Chupa Chupa", "Bombones", "Huevito", "Menta Plus", "Peter", "Cono", "Huevo Sorpresa", "Maní", "Galleta Bro", "Galleta Brinki", "Galleta Sovio", "Galleta Funny", "Galleta Creme", "Galleta Plambir", "Galleta Porkeo Biscuit", "Galleta Dulceria", "Galleta Pastella", "Galleta Fofinho", "Galleta Soda", "Galleta Pica Pau", "Galleta Maria", "Galleta Maria", "Sorveto Kilate", "Sorveto Vistami", "Sorveto Duande", "Sorveto Limousine", "Sorveto Renata", "Donuts", "Panque Marmoliado", "Panque ChocoMosai", "Panque Marcela", "Papitas Pequeñas", "Marraneta", "Palomitas", "Potato", "Tigo Puf", "Nutella",
    "*** Cigarros ***",
    "Fosforera", "H.hupman Selecto", "Cigarro suelto", "H.hupman Sin Filtro", "Cigarro suelto", "H.hupman Con Filtro", "Cigarro Suelto", "Popular Rojo", "Cigarro suelto", "Englishman", "Cigarro suelto", "Flame", "Cigarro suelto",
    "*** Bebidas ***",
    "Refresco de Paquete", "Refresco de Lata", "Refr Pomo C.Montero", "Refr Pomo Keen", "Yogurt", "Nectar Cajita", "Nectar Lata", "Malta Guajira", "Malta Belga", "Malta Unlaguer", "Malta 1830", "Energizante Black Devil", "Energizante 5 Shot", "Energizante c/ Vodka", "Shaka", "Cerveza 3 Caballo", "Cerveza Chacal", "Cerveza Brewstar", "Cerveza Bucanero", "Vino Moscatel",
    "*** Mercado ***",
    "Jaba", "Pastilla de Pollo", "Azafran", "Sazón Dubai", "Sazón Iberia", "Sazón c/ Pollo", "Sazón Magy Completo", "Pomo de Condimento", "Café Bryderk", "Café Santa Bárbara", "Café Ziva", "Café Expreso", "Mantequilla Pequeña", "Mantequilla Pote", "Mayonesa Zer", "Mayonesa Tradicional", "Ketchup", "Pasta de Tomate", "Natilla", "Gelatina", "Maicena", "Lache Condensada", "Fanguito", "Barra de Guayaba", "Sopa", "Espaguetis", "Codito", "Arroz", "Frijoles", "Aceituna", "Atún", "Span de Cerdo", "Span de Res", "Vinagre", "Vino Seco", "Aceite", "Hamburguesa", "Chorizo de Pollo",
    "*** Aseo ***",
    "Maquina de Afeitar", "Papel Higienico", "Cepillo Dental", "Pasta Dental", "Jabón de Baño", "Jabón de Lavar", "Detergente 500gr", "Detergente Liq 300ml", "Detergente Liq 1Lt", "Detergente Liq 750ml", "Mascarilla Pequeña", "Mascarilla Facial", "Jaba de Culeros", "Paquete de Culeros"
];

let productosMapCache = {};

window.iniciarCuadre = async function() {
    document.getElementById('mainApp').classList.remove('active');
    document.getElementById('cuadreSection').classList.add('active');
    const container = document.getElementById('listaProductosContainer');
    container.innerHTML = '<p style="text-align: center; color: #fff;">Cargando inventario...</p>';

    const esYoandri = (currentUser === 'yoandri');

    try {
        const querySnapshot = await getDocs(collection(db, "productos"));
        productosMapCache = {};
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.nombre) productosMapCache[data.nombre.trim()] = data;
        });

        let html = '<table><tr><th>PRODUCTO</th><th>INICIO</th><th>ENTRADA</th><th>BAJA</th><th>FINAL</th><th>VENTA</th>';
        if (!esYoandri) html += '<th>PRECIO COMP</th>';
        html += '<th>PRECIO VNTA</th><th>TOTAL VNTA</th>';
        if (!esYoandri) html += '<th>GANANCIA U</th><th>GANANCIA T</th>';
        html += '</tr>';

        let indexContador = 0;
        let filaAlternada = false;

        ORDEN_MAESTRO.forEach((item) => {
            if (item.startsWith("***")) {
                html += `<tr style="background: #334155; font-weight: bold;"><td colspan="${esYoandri ? 8 : 11}" style="padding: 10px; color: #f8fafc;">${item}</td></tr>`;
                filaAlternada = false;
                return;
            }
            const p = productosMapCache[item] || { nombre: item, precioVenta: 0, precioCompra: 0 };
            const idx = indexContador++;
            const colorFondo = filaAlternada ? '#f1f5f9' : '#ffffff';
            filaAlternada = !filaAlternada;

            html += `<tr style="background-color: ${colorFondo};" data-index="${idx}" data-nombre="${p.nombre}">`;
            html += `<td style="text-align: left;">${p.nombre}</td>`;
            html += `<td><input type="number" class="input-cell input-inicio" style="width: 50px;" oninput="calcularFilaProducto(${idx}, ${p.precioVenta || 0}, ${p.precioCompra || 0})"></td>`;
            html += `<td><input type="number" class="input-cell input-entrada" style="width: 50px;" oninput="calcularFilaProducto(${idx}, ${p.precioVenta || 0}, ${p.precioCompra || 0})"></td>`;
            html += `<td><input type="number" class="input-cell input-baja" style="width: 50px;" oninput="calcularFilaProducto(${idx}, ${p.precioVenta || 0}, ${p.precioCompra || 0})"></td>`;
            html += `<td><input type="number" class="input-cell input-final" style="width: 50px;" oninput="calcularFilaProducto(${idx}, ${p.precioVenta || 0}, ${p.precioCompra || 0})"></td>`;
            html += `<td id="venta-${idx}">0</td>`;
            if (!esYoandri) html += `<td>$${p.precioCompra}</td>`;
            html += `<td style="font-weight: bold;">$${p.precioVenta}</td>`;
            html += `<td style="font-weight: bold; color: #059669;" id="totalVenta-${idx}">0</td>`;
            if (!esYoandri) {
                html += `<td>$${(p.precioVenta - p.precioCompra)}</td>`;
                html += `<td id="gananciaT-${idx}">0</td>`;
            }
            html += `</tr>`;
        });
        container.innerHTML = html + '</table>';
    } catch (e) { console.error(e); }
}

window.calcularFilaProducto = function(index, precioVenta, precioCompra) {
    const row = document.querySelector(`tr[data-index="${index}"]`);
    const inicio = parseFloat(row.querySelector('.input-inicio').value) || 0;
    const entrada = parseFloat(row.querySelector('.input-entrada').value) || 0;
    const baja = parseFloat(row.querySelector('.input-baja').value) || 0;
    const final = parseFloat(row.querySelector('.input-final').value) || 0;

    const venta = (inicio + entrada) - (baja + final);
    const totalVenta = venta * precioVenta;
    const gananciaT = venta * (precioVenta - precioCompra);

    document.getElementById(`venta-${index}`).innerText = venta >= 0 ? venta : 0;
    document.getElementById(`totalVenta-${index}`).innerText = totalVenta >= 0 ? totalVenta : 0;
    const gElem = document.getElementById(`gananciaT-${index}`);
    if (gElem) gElem.innerText = gananciaT >= 0 ? gananciaT : 0;

    calcularCierreFinanciero();
}

window.agregarTransferencia = function() {
    const container = document.getElementById('transferenciasContainer');
    const div = document.createElement('div');
    div.className = 'dynamic-row';
    div.innerHTML = `<span style="font-size:12px;color:#94A3B8;">Monto:</span><div class="input-group-row"><input type="number" class="input-transf" oninput="calcularCierreFinanciero()"><button onclick="this.closest('.dynamic-row').remove();calcularCierreFinanciero();" style="background:#EF4444;color:white;border:none;border-radius:6px;padding:8px 12px;cursor:pointer;">X</button></div>`;
    container.appendChild(div);
}

window.agregarGasto = function() {
    const container = document.getElementById('gastosContainer');
    const div = document.createElement('div');
    div.className = 'dynamic-row';
    div.innerHTML = `<span style="font-size:12px;color:#94A3B8;">Motivo:</span><input type="text" class="input-gasto-motivo"><span style="font-size:12px;color:#94A3B8;">Monto:</span><div class="input-group-row"><input type="number" class="input-gasto-monto" oninput="calcularCierreFinanciero()"><button onclick="this.closest('.dynamic-row').remove();calcularCierreFinanciero();" style="background:#EF4444;color:white;border:none;border-radius:6px;padding:8px 12px;cursor:pointer;">X</button></div>`;
    container.appendChild(div);
}

window.agregarSalario = function() {
    const container = document.getElementById('salariosContainer');
    const div = document.createElement('div');
    div.className = 'dynamic-row';
    div.innerHTML = `<span style="font-size:12px;color:#94A3B8;">Nombre:</span><input type="text" class="input-salario-nombre"><span style="font-size:12px;color:#94A3B8;">Salario:</span><div class="input-group-row"><input type="number" class="input-salario-monto" oninput="calcularCierreFinanciero()"><button onclick="this.closest('.dynamic-row').remove();calcularCierreFinanciero();" style="background:#EF4444;color:white;border:none;border-radius:6px;padding:8px 12px;cursor:pointer;">X</button></div>`;
    container.appendChild(div);
}

window.calcularCierreFinanciero = function() {
    let ventaTotal = 0;
    document.querySelectorAll('[id^="totalVenta-"]').forEach(el => ventaTotal += parseFloat(el.innerText) || 0);
    let trans = 0; document.querySelectorAll('.input-transf').forEach(i => trans += parseFloat(i.value) || 0);
    let gastos = 0; document.querySelectorAll('.input-gasto-monto').forEach(i => gastos += parseFloat(i.value) || 0);
    let salarios = 0; document.querySelectorAll('.input-salario-monto').forEach(i => salarios += parseFloat(i.value) || 0);
    let efectivo = parseFloat(document.getElementById('efectivoCaja').value) || 0;

    let totalFinal = ventaTotal - trans - gastos - salarios;
    let efectivoReal = efectivo - salarios;

    document.getElementById('lblVentaTotal').innerText = ventaTotal + " CUP";
    document.getElementById('lblFinal').innerText = totalFinal + " CUP";

    const res = document.getElementById('lblResultadoDiferencia');
    let diff = efectivoReal - totalFinal;

    if (diff >= 0) {
        res.innerHTML = `<div style="background:rgba(16,185,129,0.2);border:1px solid #10B981;color:#6EE7B7;padding:12px;border-radius:8px;">✓ Cuadre Correcto (+${diff} CUP)</div>`;
    } else {
        res.innerHTML = `<div style="background:rgba(239,68,68,0.2);border:1px solid #EF4444;color:#FCA5A5;padding:12px;border-radius:8px;">⚠ Faltante Detectado (${Math.abs(diff)} CUP)</div>`;
    }
}

// Guardar Cuadre Completo y Mostrar Modal Estilizado
window.guardarCuadreFinal = async function() {
    const ahora = new Date();
    const hora = ahora.getHours();
    let nombreTurno = (hora >= 6 && hora < 14) ? "Cierre Mañana" : "Cierre Noche";

    let detalle = [];
    document.querySelectorAll('tr[data-index]').forEach(row => {
        const nombre = row.dataset.nombre;
        const pInfo = productosMapCache[nombre];
        const venta = parseFloat(row.querySelector('[id^="venta-"]').innerText) || 0;
        const pVenta = pInfo?.precioVenta || 0;
        const pCompra = pInfo?.precioCompra || 0;

        detalle.push({
            nombre,
            inicio: row.querySelector('.input-inicio').value || 0,
            entrada: row.querySelector('.input-entrada').value || 0,
            baja: row.querySelector('.input-baja').value || 0,
            final: row.querySelector('.input-final').value || 0,
            venta: venta,
            precioCompra: pCompra,
            precioVenta: pVenta,
            totalVenta: venta * pVenta,
            gananciaU: pVenta - pCompra,
            gananciaT: venta * (pVenta - pCompra)
        });
    });

    // Recopilar Gastos y Salarios detallados
    let gastosArr = [];
    document.querySelectorAll('#gastosContainer .dynamic-row').forEach(r => {
        const motivo = r.querySelector('.input-gasto-motivo')?.value || "General";
        const monto = parseFloat(r.querySelector('.input-gasto-monto')?.value) || 0;
        if(monto > 0) gastosArr.push({ motivo, monto });
    });

    let salariosArr = [];
    document.querySelectorAll('#salariosContainer .dynamic-row').forEach(r => {
        const persona = r.querySelector('.input-salario-nombre')?.value || "Personal";
        const monto = parseFloat(r.querySelector('.input-salario-monto')?.value) || 0;
        if(monto > 0) salariosArr.push({ persona, monto });
    });

    let transfArr = [];
    document.querySelectorAll('.input-transf').forEach(i => {
        if(i.value) transfArr.push(parseFloat(i.value));
    });

    const datos = {
        usuario: currentUserName,
        turno: nombreTurno,
        fecha: ahora.toLocaleString(),
        timestamp: serverTimestamp(),
        productos: detalle,
        financiero: {
            efectivo: document.getElementById('efectivoCaja').value || 0,
            transferencias: transfArr,
            gastos: gastosArr,
            salarios: salariosArr,
            ventaTotal: document.getElementById('lblVentaTotal').innerText,
            totalFinal: document.getElementById('lblFinal').innerText
        },
        leidoNotificacion: false
    };

    try {
        await addDoc(collection(db, "historial_cuadres"), datos);
        await addDoc(collection(db, "notificaciones"), { 
            leido: false, 
            msg: `Nuevo cuadre realizado por ${currentUserName} (${nombreTurno})`, 
            time: serverTimestamp() 
        });
        
        // Mostrar Modal Estilizado en lugar de alert
        document.getElementById('customModal').style.display = 'flex';
    } catch (e) {
        alert("Error al guardar localmente.");
    }
}

window.cerrarModalCustom = function() {
    document.getElementById('customModal').style.display = 'none';
    cancelarCuadre();
}

// --- GESTIÓN DE LA CAMPANITA Y NOTIFICACIONES ---
window.verificarNotificacionesPendientes = async function() {
    try {
        const q = query(collection(db, "notificaciones"), where("leido", "==", false));
        const snap = await getDocs(q);
        document.getElementById('contadorCampanita').innerText = snap.size;
    } catch(e) {}
}

window.verNotificaciones = async function() {
    const modal = document.getElementById('modalNotificaciones');
    const container = document.getElementById('listaNotificacionesContainer');
    modal.style.display = 'flex';
    container.innerHTML = '<p style="color:#94A3B8; text-align:center;">Cargando...</p>';

    try {
        const q = query(collection(db, "notificaciones"));
        const snap = await getDocs(q);
        let html = '';
        
        snap.forEach(docSnap => {
            const n = docSnap.data();
            html += `<div style="background:rgba(15,23,42,0.6); padding:10px; border-radius:8px; margin-bottom:8px; border-left:4px solid ${n.leido ? '#64748b' : '#10B981'};">
                <p style="color:#F8FAFC; font-size:0.9rem; font-weight:500;">${n.msg}</p>
                <span style="color:#64748b; font-size:0.75rem;">${n.time ? new Date(n.time.seconds * 1000).toLocaleString() : 'Pendiente de sinc.'}</span>
            </div>`;
        });
        container.innerHTML = html || '<p style="color:#94A3B8; text-align:center;">No hay notificaciones.</p>';
    } catch(e) {
        container.innerHTML = '<p style="color:#EF4444; text-align:center;">Error al cargar.</p>';
    }
}

window.cerrarModalNotificaciones = async function() {
    document.getElementById('modalNotificaciones').style.display = 'none';
    // Marcar como leídas
    try {
        const q = query(collection(db, "notificaciones"), where("leido", "==", false));
        const snap = await getDocs(q);
        snap.forEach(async (d) => {
            await updateDoc(doc(db, "notificaciones", d.id), { leido: true });
        });
        verificarNotificacionesPendientes();
    } catch(e){}
}

// --- HISTORIAL DE CUADRES ---
window.verHistorial = async function() {
    document.getElementById('mainApp').classList.remove('active');
    document.getElementById('historialSection').classList.add('active');
    const container = document.getElementById('listaHistorialContainer');
    container.innerHTML = '<p style="text-align:center; color:#94A3B8;">Cargando historial...</p>';

    try {
        const querySnapshot = await getDocs(collection(db, "historial_cuadres"));
        let html = '';
        
        querySnapshot.forEach((docSnap) => {
            const h = docSnap.data();
            html += `<div onclick="verDetalleCuadre('${docSnap.id}')" style="background:rgba(30,41,59,0.7); border:1px solid rgba(255,255,255,0.1); padding:12px; border-radius:10px; margin-bottom:10px; cursor:pointer;">
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                    <strong style="color:#10B981;">${h.usuario}</strong>
                    <span style="color:#94A3B8; font-size:0.8rem;">${h.fecha || 'Sin fecha'}</span>
                </div>
                <p style="color:#F8FAFC; font-size:0.9rem;">Turno: ${h.turno}</p>
                <div style="display:flex; justify-content:space-between; margin-top:6px; font-size:0.85rem; color:#cbd5e1;">
                    <span>Venta: ${h.financiero?.ventaTotal || h.totalVenta}</span>
                    <span>Final: ${h.financiero?.totalFinal || h.totalFinal}</span>
                </div>
            </div>`;
        });
        container.innerHTML = html || '<p style="text-align:center; color:#94A3B8;">No hay cuadres guardados aún.</p>';
    } catch(e) {
        container.innerHTML = '<p style="text-align:center; color:#EF4444;">Error al cargar el historial.</p>';
    }
}

window.cerrarHistorial = function() {
    document.getElementById('historialSection').classList.remove('active');
    document.getElementById('mainApp').classList.add('active');
}

window.volverAlHistorial = function() {
    document.getElementById('detalleCuadreSection').classList.remove('active');
    document.getElementById('historialSection').classList.add('active');
}

// Ver Detalle Completo de un Cuadre del Historial (Con Columnas Ocultas Visibles para Administradoras)
window.verDetalleCuadre = async function(id) {
    document.getElementById('historialSection').classList.remove('active');
    document.getElementById('detalleCuadreSection').classList.add('active');
    const container = document.getElementById('detalleContenidoContainer');
    container.innerHTML = '<p style="text-align:center; color:#94A3B8; padding:20px;">Cargando detalle completo...</p>';

    try {
        const docRef = doc(db, "historial_cuadres", id);
        const docSnap = await getDoc(docRef);

        if(docSnap.exists()) {
            const h = docSnap.data();
            document.getElementById('detalleTituloTurno').innerText = `Turno: ${h.turno}`;
            document.getElementById('detalleSubInfo').innerText = `Responsable: ${h.usuario} (${h.fecha})`;

            let html = '<table style="width:100%; border-collapse:collapse; background:white; color:#0f172a; font-size:12px;">';
            html += '<tr style="background:#1e293b; color:white; text-align:center;">';
            html += '<th style="padding:8px; text-align:left;">PRODUCTO</th><th>INICIO</th><th>ENTRADA</th><th>BAJA</th><th>FINAL</th><th>VENTA</th><th>P. COMPRA</th><th>P. VENTA</th><th>TOTAL VENTA</th><th>GANANCIA U</th><th>GANANCIA T</th>';
            html += '</tr>';

            if(h.productos && h.productos.length > 0) {
                h.productos.forEach(p => {
                    html += `<tr style="border-bottom:1px solid #e2e8f0; text-align:center;">`;
                    html += `<td style="padding:6px; text-align:left; font-weight:500;">${p.nombre}</td>`;
                    html += `<td>${p.inicio}</td><td>${p.entrada}</td><td>${p.baja}</td><td>${p.final}</td><td style="font-weight:bold;">${p.venta}</td>`;
                    html += `<td>$${p.precioCompra || 0}</td><td>$${p.precioVenta || 0}</td><td style="color:#059669; font-weight:bold;">$${p.totalVenta}</td>`;
                    html += `<td style="color:#047857;">$${p.gananciaU || 0}</td><td style="color:#047857; font-weight:bold;">$${p.gananciaT || 0}</td>`;
                    html += `</tr>`;
                });
            }
            html += '</table>';

            // Añadir resumen financiero abajo
            html += `<div style="background:#f8fafc; padding:15px; margin-top:15px; border-radius:8px; color:#0f172a; font-size:13px;">`;
            html += `<p><strong>Efectivo en Caja:</strong> $${h.financiero?.efectivo || 0}</p>`;
            html += `<p><strong>Venta Total:</strong> ${h.financiero?.ventaTotal || h.totalVenta}</p>`;
            html += `<p><strong>Total Final:</strong> ${h.financiero?.totalFinal || h.totalFinal}</p>`;
            html += `</div>`;

            container.innerHTML = html;
        }
    } catch(e) {
        container.innerHTML = '<p style="text-align:center; color:#EF4444; padding:20px;">Error al cargar el detalle.</p>';
    }
}

window.cancelarCuadre = function() {
    document.getElementById('cuadreSection').classList.remove('active');
    document.getElementById('mainApp').classList.add('active');
}

window.verAlmacen = function() { alert("Control de almacén en construcción."); }

window.selectUser = selectUser; window.goBack = goBack; window.logout = logout; window.verifyPin = verifyPin;
window.iniciarCuadre = iniciarCuadre; window.cancelarCuadre = cancelarCuadre;
