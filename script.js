import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

// Tu configuración de Firebase
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

// Función cuando tocas tu nombre
function selectUser(userId, userName) {
    currentUser = userId;
    currentUserName = userName;
    
    document.getElementById('userNameDisplay').textContent = '¡Bienvenido/a, ' + userName + '!';
    document.getElementById('roleSelection').style.display = 'none';
    document.getElementById('authSection').classList.add('active');
}

// Función del botón cancelar
function goBack() {
    document.getElementById('userPin').value = ''; 
    currentUser = '';
    currentUserName = '';
    
    document.getElementById('authSection').classList.remove('active');
    document.getElementById('roleSelection').style.display = 'flex';
}

// Función del botón Entrar (Verifica en Firebase)
async function verifyPin() {
    const userPinInput = document.getElementById('userPin');
    const pinIngresado = userPinInput.value;

    if (pinIngresado === '') {
        alert('Por favor, digite su PIN de 4 números.');
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
                alert('¡Acceso concedido, ' + currentUserName + '!');
            } else {
                alert('PIN incorrecto. Por favor, inténtelo de nuevo.');
                userPinInput.value = '';
            }
        } else {
            alert('Aún no se ha configurado el PIN de este usuario.');
        }
    } catch (error) {
        console.error("Error:", error);
        alert('Error de conexión.');
    }

    btnSubmit.textContent = 'Entrar';
    btnSubmit.disabled = false;
}

// Esto conecta las funciones con los botones del HTML
window.selectUser = selectUser;
window.goBack = goBack;
window.verifyPin = verifyPin;
