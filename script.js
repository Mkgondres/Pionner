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

// Cargar productos de Firebase al iniciar el cuadre
window.iniciarCuadre = async function() {
    document.getElementById('mainApp').classList.remove('active');
    document.getElementById('cuadreSection').classList.add('active');
    
    const container = document.getElementById('listaProductosContainer');
    container.innerHTML = '<p style="text-align: center;">Cargando inventario...</p>';

    try {
        const querySnapshot = await getDocs(collection(db, "productos"));
        let html = '<table style="width: 100%; font-size: 14px; border-collapse: collapse;">';
        html += '<tr style="border-bottom: 2px solid #e5e7eb; text-align: left;"><th>Producto</th><th>Precio</th><th>Conteo Final</th></tr>';

        querySnapshot.forEach((docSnap) => {
            const p = docSnap.data();
            if (p.precioVenta > 0) {
                html += `<tr style="border-bottom: 1px solid #f3f4f6;">
                    <td style="padding: 8px 4px;">${p.nombre}</td>
                    <td style="padding: 8px 4px;">$${p.precioVenta}</td>
                    <td style="padding: 8px 4px;"><input type="number" class="input-conteo" data-precio="${p.precioVenta}" data-nombre="${p.nombre}" placeholder="0" style="width: 70px; padding: 5px; border: 1px solid #d1d5db; border-radius: 4px;"></td>
                </tr>`;
            }
        });

        html += '</table>';
        container.innerHTML = html;

    } catch (error) {
        console.error("Error al cargar productos:", error);
        container.innerHTML = '<p style="color: red; text-align: center;">Error al cargar el inventario.</p>';
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

    const gastos = parseFloat(document.getElementById('gastosTurno').value) || 0;

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
