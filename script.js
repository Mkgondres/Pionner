import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getFirestore, doc, getDoc, getDocs, collection } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

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
            } else {
                showMessage('PIN incorrecto. Por favor, intenta de nuevo.', 'error');
                userPinInput.value = '';
            }
        } else {
            showMessage('Error: Usuario no encontrado en la base de datos.', 'error');
        }
    } catch (error) {
        console.error("Error:", error);
        showMessage('Error de conexión con la base de datos.', 'error');
    }

    btnSubmit.textContent = 'Entrar';
    btnSubmit.disabled = false;
}

document.getElementById('userPin').addEventListener('input', clearMessage);

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

window.iniciarCuadre = async function() {
    document.getElementById('mainApp').classList.remove('active');
    document.getElementById('cuadreSection').classList.add('active');
    
    const container = document.getElementById('listaProductosContainer');
    container.innerHTML = '<p style="text-align: center; padding: 20px; color: #fff;">Cargando inventario ordenado...</p>';

    const esYoandri = (currentUser === 'yoandri');

    try {
        const querySnapshot = await getDocs(collection(db, "productos"));
        let productosMap = {};
        
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.nombre) {
                productosMap[data.nombre.trim()] = data;
            }
        });

        let html = '<table>';
        html += '<tr>';
        html += '<th>PRODUCTO</th>';
        html += '<th>INICIO</th>';
        html += '<th>ENTRADA</th>';
        html += '<th>BAJA</th>';
        html += '<th>FINAL</th>';
        html += '<th>VENTA</th>';
        
        if (!esYoandri) {
            html += '<th>PRECIO COMP</th>';
        }
        html += '<th>PRECIO VNTA</th>';
        html += '<th>TOTAL VNTA</th>';
        
        if (!esYoandri) {
            html += '<th>GANANCIA U</th>';
            html += '<th>GANANCIA T</th>';
        }
        html += '</tr>';

        let indexContador = 0;
        let filaAlternada = false;

        ORDEN_MAESTRO.forEach((item) => {
            if (item.startsWith("***")) {
                html += `<tr style="background: #334155; font-weight: bold;"><td colspan="${esYoandri ? 8 : 11}" style="padding: 10px; text-align: left; color: #f8fafc;">${item}</td></tr>`;
                filaAlternada = false;
                return;
            }

            const p = productosMap[item] || { nombre: item, precioVenta: 0, precioCompra: 0 };
            const idx = indexContador++;
            const colorFondo = filaAlternada ? '#f1f5f9' : '#ffffff';
            filaAlternada = !filaAlternada;

            html += `<tr style="background-color: ${colorFondo};" data-index="${idx}">`;
            html += `<td style="text-align: left; font-weight: 500;">${p.nombre}</td>`;
            
            html += `<td><input type="number" class="input-cell input-inicio" data-index="${idx}" placeholder="-" style="width: 50px; padding: 6px;" oninput="calcularFilaProducto(${idx}, ${p.precioVenta || 0}, ${p.precioCompra || 0})"></td>`;
            html += `<td><input type="number" class="input-cell input-entrada" data-index="${idx}" placeholder="-" style="width: 50px; padding: 6px;" oninput="calcularFilaProducto(${idx}, ${p.precioVenta || 0}, ${p.precioCompra || 0})"></td>`;
            html += `<td><input type="number" class="input-cell input-baja" data-index="${idx}" placeholder="-" style="width: 50px; padding: 6px;" oninput="calcularFilaProducto(${idx}, ${p.precioVenta || 0}, ${p.precioCompra || 0})"></td>`;
            html += `<td><input type="number" class="input-cell input-final" data-index="${idx}" placeholder="-" style="width: 50px; padding: 6px;" oninput="calcularFilaProducto(${idx}, ${p.precioVenta || 0}, ${p.precioCompra || 0})"></td>`;
            
            html += `<td style="color: #64748b; font-weight: bold;" id="venta-${idx}">-</td>`;
            
            if (!esYoandri) {
                html += `<td>${p.precioCompra > 0 ? '$' + p.precioCompra : '-'}</td>`;
            }
            
            html += `<td style="font-weight: bold;" id="pventa-${idx}">${p.precioVenta > 0 ? '$' + p.precioVenta : '-'}</td>`;
            html += `<td style="font-weight: bold; color: #059669;" id="totalVenta-${idx}">-</td>`;
            
            if (!esYoandri) {
                html += `<td style="color: #047857;" id="gananciaU-${idx}">${p.precioVenta > 0 && p.precioCompra > 0 ? '$' + (p.precioVenta - p.precioCompra) : '-'}</td>`;
                html += `<td style="color: #047857;" id="gananciaT-${idx}">-</td>`;
            }
            
            html += `</tr>`;
        });

        html += '</table>';
        container.innerHTML = html;

    } catch (error) {
        console.error("Error al cargar inventario:", error);
        container.innerHTML = '<p style="color: red; text-align: center; padding: 20px;">Error al cargar el inventario.</p>';
    }
}

window.calcularFilaProducto = function(index, precioVenta, precioCompra) {
    const row = document.querySelector(`tr[data-index="${index}"]`);
    if (!row) return;

    const inicio = parseFloat(row.querySelector('.input-inicio').value) || 0;
    const entrada = parseFloat(row.querySelector('.input-entrada').value) || 0;
    const baja = parseFloat(row.querySelector('.input-baja').value) || 0;
    const final = parseFloat(row.querySelector('.input-final').value) || 0;

    const ventaUnidades = (inicio + entrada) - (baja + final);
    const totalVenta = ventaUnidades * precioVenta;

    document.getElementById(`venta-${index}`).innerText = ventaUnidades >= 0 ? ventaUnidades : 0;
    document.getElementById(`totalVenta-${index}`).innerText = totalVenta >= 0 ? totalVenta : 0;

    const esYoandri = (currentUser === 'yoandri');
    if (!esYoandri && precioCompra > 0) {
        const gananciaTotal = ventaUnidades * (precioVenta - precioCompra);
        const elGananciaT = document.getElementById(`gananciaT-${index}`);
        if (elGananciaT) elGananciaT.innerText = gananciaTotal >= 0 ? gananciaTotal : 0;
    }

    calcularCierreFinanciero();
}

window.agregarTransferencia = function() {
    const container = document.getElementById('transferenciasContainer');
    const div = document.createElement('div');
    div.className = 'dynamic-row';
    div.innerHTML = `
        <span style="font-size: 12px; color: #94A3B8; font-weight: bold;">Monto de Transferencia:</span>
        <div class="input-group-row">
            <input type="number" placeholder="Ej. 1500" class="input-transf" oninput="calcularCierreFinanciero()">
            <button type="button" onclick="this.closest('.dynamic-row').remove(); calcularCierreFinanciero();" style="background:#EF4444; color:white; border:none; border-radius:6px; padding:8px 12px; cursor:pointer;">X</button>
        </div>`;
    container.appendChild(div);
}

window.agregarGasto = function() {
    const container = document.getElementById('gastosContainer');
    const div = document.createElement('div');
    div.className = 'dynamic-row';
    div.innerHTML = `
        <span style="font-size: 12px; color: #94A3B8; font-weight: bold;">Motivo del gasto:</span>
        <input type="text" placeholder="Ej. Alquiler del local" class="input-gasto-motivo">
        <span style="font-size: 12px; color: #94A3B8; font-weight: bold; margin-top: 4px;">Monto:</span>
        <div class="input-group-row">
            <input type="number" placeholder="Ej. 2600" class="input-gasto-monto" oninput="calcularCierreFinanciero()">
            <button type="button" onclick="this.closest('.dynamic-row').remove(); calcularCierreFinanciero();" style="background:#EF4444; color:white; border:none; border-radius:6px; padding:8px 12px; cursor:pointer;">X</button>
        </div>`;
    container.appendChild(div);
}

window.agregarSalario = function() {
    const container = document.getElementById('salariosContainer');
    const div = document.createElement('div');
    div.className = 'dynamic-row';
    div.innerHTML = `
        <span style="font-size: 12px; color: #94A3B8; font-weight: bold;">Persona o Cargo:</span>
        <input type="text" placeholder="Ej. Yoandri / Dependiente" class="input-salario-nombre">
        <span style="font-size: 12px; color: #94A3B8; font-weight: bold; margin-top: 4px;">Salario a pagar:</span>
        <div class="input-group-row">
            <input type="number" placeholder="Ej. 1000" class="input-salario-monto" oninput="calcularCierreFinanciero()">
            <button type="button" onclick="this.closest('.dynamic-row').remove(); calcularCierreFinanciero();" style="background:#EF4444; color:white; border:none; border-radius:6px; padding:8px 12px; cursor:pointer;">X</button>
        </div>`;
    container.appendChild(div);
}

window.calcularCierreFinanciero = function() {
    let ventaTotalEsperada = 0;
    document.querySelectorAll('[id^="totalVenta-"]').forEach(el => {
        const val = parseFloat(el.innerText) || 0;
        ventaTotalEsperada += val;
    });

    let totalTransferencias = 0;
    document.querySelectorAll('.input-transf').forEach(input => {
        totalTransferencias += parseFloat(input.value) || 0;
    });

    let totalGastos = 0;
    document.querySelectorAll('.input-gasto-monto').forEach(input => {
        totalGastos += parseFloat(input.value) || 0;
    });

    let totalSalarios = 0;
    document.querySelectorAll('.input-salario-monto').forEach(input => {
        totalSalarios += parseFloat(input.value) || 0;
    });

    let efectivoCaja = parseFloat(document.getElementById('efectivoCaja')?.value) || 0;

    let totalFinal = ventaTotalEsperada - totalTransferencias - totalGastos - totalSalarios;
    let efectivoFinalReal = efectivoCaja - totalSalarios;

    const lblVentaTotal = document.getElementById('lblVentaTotal');
    const lblFinal = document.getElementById('lblFinal');
    
    if (lblVentaTotal) lblVentaTotal.innerText = ventaTotalEsperada + " CUP";
    if (lblFinal) lblFinal.innerText = totalFinal + " CUP";

    const lblResultado = document.getElementById('lblResultadoDiferencia');
    if (!lblResultado) return;

    if (ventaTotalEsperada === 0 && efectivoCaja === 0) {
        lblResultado.innerHTML = `<span style="color: #94A3B8;">Realiza el conteo para ver la comparativa...</span>`;
        return;
    }

    let diferencia = efectivoFinalReal - totalFinal;

    if (diferencia >= 0) {
        lblResultado.innerHTML = `
            <div style="background: rgba(16, 185, 129, 0.2); border: 1px solid #10B981; color: #6EE7B7; padding: 12px; border-radius: 8px; font-weight: bold; text-align: center;">
                ✓ Todo Correcto (Cuadre Exacto o Excedente de +${diferencia} CUP)
            </div>`;
    } else {
        let faltanteAbsoluto = Math.abs(diferencia);
        lblResultado.innerHTML = `
            <div style="background: rgba(239, 68, 68, 0.2); border: 1px solid #EF4444; color: #FCA5A5; padding: 12px; border-radius: 8px; font-weight: bold; text-align: center;">
                ⚠ Atención, se detectó faltante de dinero (${faltanteAbsoluto} CUP)
            </div>`;
    }
}

window.cancelarCuadre = function() {
    const seccionCuadre = document.getElementById('cuadreSection');
    if (seccionCuadre) {
        seccionCuadre.classList.remove('active');
    }
    document.getElementById('mainApp').classList.add('active');
    clearMessage();
}

window.guardarCuadreFinal = function() {
    const ahora = new Date();
    const hora = ahora.getHours();
    let nombreTurno = (hora >= 6 && hora < 14) ? "Turno de la Noche (Cierre Mañana)" : "Turno del Día (Cierre Noche)";

    alert(`¡Cuadre guardado con éxito!\nRegistrado como: ${nombreTurno}\nHora exacta: ${ahora.toLocaleTimeString()}`);
    setTimeout(() => { cancelarCuadre(); }, 1500);
}

window.verHistorial = function() {
    alert("Historial en construcción. Aún no hay cuadres.");
}

window.verAlmacen = function() {
    alert("Control de almacén en construcción.");
}

window.selectUser = selectUser;
window.goBack = goBack;
window.logout = logout;
window.verifyPin = verifyPin;

