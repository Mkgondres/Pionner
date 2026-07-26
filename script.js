import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

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

// Sistema de mensajes (Solo para errores)
function showMessage(text, type) {
    const msgBox = document.getElementById('feedbackMessage');
    msgBox.textContent = text;
    msgBox.className = 'feedback-message ' + type;
}

function clearMessage() {
    const msgBox = document.getElementById('feedbackMessage');
    msgBox.className = 'feedback-message';
    msgBox.textContent = '';
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
                // PIN CORRECTO: Entra directo a la aplicación sin mensajes
                document.getElementById('authSection').classList.remove('active');
                document.getElementById('mainApp').classList.add('active');
                document.getElementById('welcomeUserText').textContent = 'Usuario activo: ' + currentUserName;
                
            } else {
                // PIN INCORRECTO: Muestra el mensaje de error integrado
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

// Exponer funciones
window.selectUser = selectUser;
window.goBack = goBack;
window.logout = logout;
window.verifyPin = verifyPin;
// --- LÓGICA DEL MENÚ PRINCIPAL ---

// Esta función configura qué botones ve cada usuario
window.configurarPantallaPrincipal = function(userId, userName) {
    document.getElementById('welcomeUserText').innerText = `Hola, ${userName}`;
    
    const btnCuadre = document.getElementById('btnIniciarCuadre');
    const btnAjustes = document.getElementById('btnAjustesMenu');

    if (userId === 'yoandri') {
        // Vista Operativa (Yoandri)
        btnCuadre.style.display = 'block';
        btnAjustes.style.display = 'none';
    } else {
        // Vista Administrativa (Marikarla y María del Carmen)
        btnCuadre.style.display = 'none';
        btnAjustes.style.display = 'block';
    }
}

// Lógica inteligente de los turnos por hora
window.iniciarCuadre = function() {
    const ahora = new Date();
    const hora = ahora.getHours();
    let nombreTurno = "";

    // Si es por la mañana (ej. entre 6:00 AM y 2:00 PM), está cerrando la madrugada
    if (hora >= 6 && hora < 14) { 
        nombreTurno = "Turno de la Noche";
    } 
    // Si es por la tarde/noche (ej. entre 6:00 PM y 11:59 PM), está cerrando el día
    else if (hora >= 18 && hora <= 23) {
        nombreTurno = "Turno del Día";
    } 
    // Si lo hace a una hora inusual
    else {
        nombreTurno = "Turno Especial"; 
    }

    alert(`Has iniciado un nuevo cuadre.\nSe registrará como: ${nombreTurno}\nHora exacta: ${ahora.toLocaleTimeString()}`);
    
    // Aquí pondremos el código para abrir la pantalla de la tabla con los productos
}

window.verHistorial = function() {
    alert("Revisando la base de datos... Aún no hay cuadres registrados.");
}

window.verAlmacen = function() {
    alert("Abriendo el Control de Almacén...");
}
