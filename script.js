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

// Sistema de mensajes
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

// Cerrar sesión y volver al inicio
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

// Limpiar error al escribir
document.getElementById('userPin').addEventListener('input', clearMessage);

// Configuración del Menú Principal según el usuario
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

// Cargar productos de Firebase al iniciar el cuadre manteniendo estructura completa tipo Excel
window.iniciarCuadre = async function() {
    document.getElementById('mainApp').classList.remove('active');
    document.getElementById('cuadreSection').classList.add('active');
    
    const container = document.getElementById('listaProductosContainer');
    container.innerHTML = '<p style="text-align: center; padding: 20px;">Cargando inventario...</p>';

    const esYoandri = (currentUser === 'yoandri');

    try {
        const querySnapshot = await getDocs(collection(db, "productos"));
        let productosArray = [];
        querySnapshot.forEach((docSnap) => {
            productosArray.push({ id: docSnap.id, ...docSnap.data() });
        });

        let html = '<table style="width: 100%; font-size: 13px; border-collapse: collapse; background: white;">';
        html += '<tr style="background: #f4f4f5; border-bottom: 2px solid #d1d5db; text-align: center; position: sticky; top: 0; z-index: 10;">';
        html += '<th style="padding: 10px; text-align: left;">PRODUCTO</th>';
        html += '<th style="padding: 10px;">INICIO</th>';
        html += '<th style="padding: 10px;">ENTRADA</th>';
        html += '<th style="padding: 10px;">BAJA</th>';
        html += '<th style="padding: 10px;">FINAL</th>';
        html += '<th style="padding: 10px;">VENTA</th>';
        
        if (!esYoandri) {
            html += '<th style="padding: 10px;">PRECIO COMP</th>';
        }
        html += '<th style="padding: 10px;">PRECIO VNTA</th>';
        html += '<th style="padding: 10px;">TOTAL VNTA</th>';
        
        if (!esYoandri) {
            html += '<th style="padding: 10px;">GANANCIA U</th>';
            html += '<th style="padding: 10px;">GANANCIA T</th>';
        }
        html += '</tr>';

        let categoriaActual = "";

        productosArray.forEach((p, index) => {
            if (p.categoria && p.categoria !== categoriaActual) {
                categoriaActual = p.categoria;
                html += `<tr style="background: #e4e4e7; font-weight: bold;"><td colspan="${esYoandri ? 8 : 11}" style="padding: 8px; text-align: left; color: #3f3f46;">*** ${categoriaActual.toUpperCase()} ***</td></tr>`;
            }

            html += `<tr style="border-bottom: 1px solid #f3f4f6; text-align: center;" data-index="${index}">`;
            html += `<td style="padding: 8px; text-align: left; font-weight: 500;">${p.nombre}</td>`;
            
            // Entradas de inventario (Inicio, Entrada, Baja, Final) con evento de cálculo automático
            html += `<td style="padding: 4px;"><input type="number" class="input-cell input-inicio" data-index="${index}" placeholder="-" style="width: 45px; padding: 4px; text-align: center; border: 1px solid #d1d5db; border-radius: 4px;" oninput="calcularFilaProducto(${index}, ${p.precioVenta || 0}, ${p.precioCompra || 0})"></td>`;
            html += `<td style="padding: 4px;"><input type="number" class="input-cell input-entrada" data-index="${index}" placeholder="-" style="width: 45px; padding: 4px; text-align: center; border: 1px solid #d1d5db; border-radius: 4px;" oninput="calcularFilaProducto(${index}, ${p.precioVenta || 0}, ${p.precioCompra || 0})"></td>`;
            html += `<td style="padding: 4px;"><input type="number" class="input-cell input-baja" data-index="${index}" placeholder="-" style="width: 45px; padding: 4px; text-align: center; border: 1px solid #d1d5db; border-radius: 4px;" oninput="calcularFilaProducto(${index}, ${p.precioVenta || 0}, ${p.precioCompra || 0})"></td>`;
            html += `<td style="padding: 4px;"><input type="number" class="input-cell input-final" data-index="${index}" placeholder="-" style="width: 45px; padding: 4px; text-align: center; border: 1px solid #d1d5db; border-radius: 4px;" oninput="calcularFilaProducto(${index}, ${p.precioVenta || 0}, ${p.precioCompra || 0})"></td>`;
            
            // Celdas calculadas por producto
            html += `<td style="padding: 8px; color: #71717A;" id="venta-${index}">-</td>`;
            
            if (!esYoandri) {
                html += `<td style="padding: 8px;">${p.precioCompra > 0 ? '$' + p.precioCompra : '-'}</td>`;
            }
            
            html += `<td style="padding: 8px; font-weight: bold;" id="pventa-${index}">${p.precioVenta > 0 ? '$' + p.precioVenta : '-'}</td>`;
            html += `<td style="padding: 8px; font-weight: bold; color: #10B981;" id="totalVenta-${index}">-</td>`;
            
            if (!esYoandri) {
                html += `<td style="padding: 8px; color: #059669;" id="gananciaU-${index}">${p.precioVenta > 0 && p.precioCompra > 0 ? '$' + (p.precioVenta - p.precioCompra) : '-'}</td>`;
                html += `<td style="padding: 8px; color: #059669;" id="gananciaT-${index}">-</td>`;
            }
            
            html += `</tr>`;
        });

        html += '</table>';
        container.innerHTML = html;

    } catch (error) {
        console.error("Error al cargar productos:", error);
        container.innerHTML = '<p style="color: red; text-align: center; padding: 20px;">Error al cargar el inventario.</p>';
    }
}

// Cálculo en tiempo real por cada producto de la tabla
window.calcularFilaProducto = function(index, precioVenta, precioCompra) {
    const row = document.querySelector(`tr[data-index="${index}"]`);
    if (!row) return;

    const inicio = parseFloat(row.querySelector('.input-inicio').value) || 0;
    const entrada = parseFloat(row.querySelector('.input-entrada').value) || 0;
    const baja = parseFloat(row.querySelector('.input-baja').value) || 0;
    const final = parseFloat(row.querySelector('.input-final').value) || 0;

    // Venta = (Inicio + Entrada) - (Baja + Final) [Ajustable según tu fórmula estándar de inventario]
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

    // Actualizar el cierre financiero general cada vez que se modifique un producto
    calcularCierreFinanciero();
}

// Funciones para filas dinámicas financieras
window.agregarTransferencia = function() {
    const container = document.getElementById('transferenciasContainer');
    const div = document.createElement('div');
    div.style.cssText = "display: flex; gap: 8px; margin-bottom: 6px;";
    div.innerHTML = `<input type="number" placeholder="Monto de transferencia" class="input-transf" style="width: 100%; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;" oninput="calcularCierreFinanciero()">
                     <button type="button" onclick="this.parentElement.remove(); calcularCierreFinanciero();" style="background:#EF4444; color:white; border:none; border-radius:4px; padding:0 10px; cursor:pointer;">X</button>`;
    container.appendChild(div);
}

window.agregarGasto = function() {
    const container = document.getElementById('gastosContainer');
    const div = document.createElement('div');
    div.style.cssText = "display: flex; gap: 8px; margin-bottom: 6px;";
    div.innerHTML = `<input type="text" placeholder="Motivo del gasto" class="input-gasto-motivo" style="flex: 2; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                     <input type="number" placeholder="Monto" class="input-gasto-monto" style="flex: 1; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;" oninput="calcularCierreFinanciero()">
                     <button type="button" onclick="this.parentElement.remove(); calcularCierreFinanciero();" style="background:#EF4444; color:white; border:none; border-radius:4px; padding:0 10px; cursor:pointer;">X</button>`;
    container.appendChild(div);
}

window.agregarSalario = function() {
    const container = document.getElementById('salariosContainer');
    const div = document.createElement('div');
    div.style.cssText = "display: flex; gap: 8px; margin-bottom: 6px;";
    div.innerHTML = `<input type="text" placeholder="Nombre o Cargo" class="input-salario-nombre" style="flex: 2; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;">
                     <input type="number" placeholder="Salario" class="input-salario-monto" style="flex: 1; padding: 6px; border: 1px solid #d1d5db; border-radius: 4px;" oninput="calcularCierreFinanciero()">
                     <button type="button" onclick="this.parentElement.remove(); calcularCierreFinanciero();" style="background:#EF4444; color:white; border:none; border-radius:4px; padding:0 10px; cursor:pointer;">X</button>`;
    container.appendChild(div);
}

// Cálculo general y comparativa automática con el efectivo
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

    // Total Final: Venta total menos transferencias, gastos y salarios
    let totalFinalEsperado = ventaTotalEsperada - totalTransferencias - totalGastos - totalSalarios;

    const lblTotalVenta = document.getElementById('lblTotalVenta');
    const lblTotalFinal = document.getElementById('lblTotalFinalCalculado');
    if (lblTotalVenta) lblTotalVenta.innerText = ventaTotalEsperada;
    if (lblTotalFinal) lblTotalFinal.innerText = totalFinalEsperado;

    let diferencia = efectivoCaja - totalFinalEsperado;
    const lblResultado = document.getElementById('lblResultadoDiferencia');

    if (!lblResultado) return;

    if (efectivoCaja === 0 && ventaTotalEsperada === 0) {
        lblResultado.innerText = "Realiza el conteo para ver la comparativa...";
        lblResultado.style.color = "#71717A";
        return;
    }

    if (diferencia === 0) {
        lblResultado.innerText = "¡Perfecto! El cuadre está exacto (0 CUP de diferencia).";
        lblResultado.style.color = "#10B981";
    } else if (diferencia > 0) {
        lblResultado.innerText = `Alerta: ¡SOBRA dinero! Hay un excedente de ${diferencia} CUP.`;
        lblResultado.style.color = "#F59E0B";
    } else {
        lblResultado.innerText = `Alerta: ¡FALTA dinero! Hay un faltante de ${Math.abs(diferencia)} CUP.`;
        lblResultado.style.color = "#EF4444";
    }
}

// Función para volver al menú principal desde el cuadre
window.cancelarCuadre = function() {
    const seccionCuadre = document.getElementById('cuadreSection');
    if (seccionCuadre) {
        seccionCuadre.classList.remove('active');
    }
    document.getElementById('mainApp').classList.add('active');
    clearMessage();
}

// Guardar el cuadre definitivo calculando la hora al terminar
window.guardarCuadreFinal = function() {
    const ahora = new Date();
    const hora = ahora.getHours();
    let nombreTurno = "";

    if (hora >= 6 && hora < 14) { 
        nombreTurno = "Turno de la Noche (Cierre Mañana)";
    } else if (hora >= 18 && hora <= 23 || hora < 6) {
        nombreTurno = "Turno del Día (Cierre Noche)";
    } else {
        nombreTurno = "Turno Especial"; 
    }

    alert(`¡Cuadre guardado con éxito!\nRegistrado como: ${nombreTurno}\nHora exacta: ${ahora.toLocaleTimeString()}`);
    
    setTimeout(() => {
        cancelarCuadre();
    }, 1500);
}

window.verHistorial = function() {
    alert("Historial en construcción. Aún no hay cuadres.");
}

window.verAlmacen = function() {
    alert("Control de almacén en construcción.");
}

// Exponer funciones globales necesarias
window.selectUser = selectUser;
window.goBack = goBack;
window.logout = logout;
window.verifyPin = verifyPin;
