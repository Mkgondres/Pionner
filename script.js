import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { 
    getFirestore, doc, getDoc, getDocs, collection, addDoc, 
    serverTimestamp, query, where, enableIndexedDbPersistence 
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

// 👉 ACTIVAR PERSISTENCIA OFFLINE (Para la situación en Cuba) 👈
enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        console.warn("La persistencia falló: Varias pestañas abiertas.");
    } else if (err.code == 'unimplemented') {
        console.warn("El navegador no soporta persistencia offline.");
    }
});

let currentUser = '';
let currentUserName = '';

// --- SISTEMA DE MENSAJES Y LOGIN ---
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

    const btnSubmit = document.querySelector('.btn-primary');
    btnSubmit.textContent = 'Verificando...';
    btnSubmit.disabled = true;

    try {
        const docRef = doc(db, "usuarios", currentUser);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const pinReal = docSnap.data().pin;
            if (pinIngresado === pinReal) {
                document.getElementById('authSection').classList.remove('active');
                document.getElementById('mainApp').classList.add('active');
                configurarPantallaPrincipal(currentUser, currentUserName);
                verificarNotificacionesPendientes(); // Ver si hay alertas
            } else {
                showMessage('PIN incorrecto. Por favor, intenta de nuevo.', 'error');
                userPinInput.value = '';
            }
        } else {
            showMessage('Error: Usuario no encontrado.', 'error');
        }
    } catch (error) {
        console.error("Error:", error);
        showMessage('Modo Offline: Verificando PIN local...', 'success');
        // Aquí Firebase permite el login si ya entró antes offline
    }
    btnSubmit.textContent = 'Entrar';
    btnSubmit.disabled = false;
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

// --- LÓGICA DEL CUADRE (ORDEN MAESTRO) ---
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

let productosMapCache = {}; // Guardar datos financieros para el envío final

window.iniciarCuadre = async function() {
    document.getElementById('mainApp').classList.remove('active');
    document.getElementById('cuadreSection').classList.add('active');
    const container = document.getElementById('listaProductosContainer');
    container.innerHTML = '<p style="text-align: center; color: #fff;">Cargando inventario ordenado...</p>';

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

// --- CIERRE FINANCIERO Y SYNC ---
window.agregarTransferencia = function() {
    const container = document.getElementById('transferenciasContainer');
    const div = document.createElement('div');
    div.className = 'dynamic-row';
    div.innerHTML = `<span style="font-size:12px;color:#94A3B8;">Monto:</span><div class="input-group-row"><input type="number" class="input-transf" oninput="calcularCierreFinanciero()"><button onclick="this.closest('.dynamic-row').remove();calcularCierreFinanciero();">X</button></div>`;
    container.appendChild(div);
}

window.agregarGasto = function() {
    const container = document.getElementById('gastosContainer');
    const div = document.createElement('div');
    div.className = 'dynamic-row';
    div.innerHTML = `<span style="font-size:12px;color:#94A3B8;">Motivo:</span><input type="text" class="input-gasto-motivo"><span style="font-size:12px;color:#94A3B8;">Monto:</span><div class="input-group-row"><input type="number" class="input-gasto-monto" oninput="calcularCierreFinanciero()"><button onclick="this.closest('.dynamic-row').remove();calcularCierreFinanciero();">X</button></div>`;
    container.appendChild(div);
}

window.agregarSalario = function() {
    const container = document.getElementById('salariosContainer');
    const div = document.createElement('div');
    div.className = 'dynamic-row';
    div.innerHTML = `<span style="font-size:12px;color:#94A3B8;">Nombre:</span><input type="text" class="input-salario-nombre"><span style="font-size:12px;color:#94A3B8;">Salario:</span><div class="input-group-row"><input type="number" class="input-salario-monto" oninput="calcularCierreFinanciero()"><button onclick="this.closest('.dynamic-row').remove();calcularCierreFinanciero();">X</button></div>`;
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

window.guardarCuadreFinal = async function() {
    const ahora = new Date();
    const hora = ahora.getHours();
    let nombreTurno = (hora >= 6 && hora < 14) ? "Cierre Mañana" : "Cierre Noche";

    let detalle = [];
    document.querySelectorAll('tr[data-index]').forEach(row => {
        const nombre = row.dataset.nombre;
        const pInfo = productosMapCache[nombre];
        detalle.push({
            nombre,
            inicio: row.querySelector('.input-inicio').value || 0,
            entrada: row.querySelector('.input-entrada').value || 0,
            baja: row.querySelector('.input-baja').value || 0,
            final: row.querySelector('.input-final').value || 0,
            venta: row.querySelector('[id^="venta-"]').innerText,
            totalVenta: row.querySelector('[id^="totalVenta-"]').innerText,
            // 👉 GUARDAMOS DATOS FINANCIEROS SIEMPRE (Aunque Yoandri no los vea) 👈
            precioCompra: pInfo?.precioCompra || 0,
            precioVenta: pInfo?.precioVenta || 0,
            gananciaT: (parseFloat(row.querySelector('[id^="venta-"]').innerText) * (pInfo?.precioVenta - pInfo?.precioCompra)) || 0
        });
    });

    const datos = {
        usuario: currentUserName,
        turno: nombreTurno,
        timestamp: serverTimestamp(),
        productos: detalle,
        efectivo: document.getElementById('efectivoCaja').value,
        totalVenta: document.getElementById('lblVentaTotal').innerText,
        totalFinal: document.getElementById('lblFinal').innerText
    };

    try {
        await addDoc(collection(db, "historial_cuadres"), datos);
        await addDoc(collection(db, "notificaciones"), { leido: false, msg: `Nuevo cuadre de ${currentUserName}`, time: serverTimestamp() });
        alert("Cuadre Guardado (Se sincronizará automáticamente al detectar internet)");
        cancelarCuadre();
    } catch (e) { alert("Error al guardar localmente."); }
}

window.verificarNotificacionesPendientes = async function() {
    const q = query(collection(db, "notificaciones"), where("leido", "==", false));
    const snap = await getDocs(q);
    document.getElementById('contadorCampanita').innerText = snap.size;
}

window.cancelarCuadre = function() {
    document.getElementById('cuadreSection').classList.remove('active');
    document.getElementById('mainApp').classList.add('active');
}

// Exponer funciones globales
window.selectUser = selectUser; window.goBack = goBack; window.logout = logout; window.verifyPin = verifyPin;
window.iniciarCuadre = iniciarCuadre; window.cancelarCuadre = cancelarCuadre;
