// 1. Importamos Firebase y la Base de Datos (Firestore)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

// 2. Tu configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAhueHCWyIWibnQCf_8gSH3KP6eliAW5Vk",
  authDomain: "pionner-7c1ef.firebaseapp.com",
  projectId: "pionner-7c1ef",
  storageBucket: "pionner-7c1ef.firebasestorage.app",
  messagingSenderId: "205435907267",
  appId: "1:205435907267:web:6bcd4a919afa5610a44676"
};

// 3. Inicializamos Firebase y la Base de Datos
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 4. Referencias a la pantalla
const roleSection = document.getElementById('roleSection');
const authSection = document.getElementById('authSection');
const authTitle = document.getElementById('authTitle');
const userPinInput = document.getElementById('userPin');
const btnBack = document.getElementById('btnBack');
const btnSubmit = document.getElementById('btnSubmit');
const roleButtons = document.querySelectorAll('.btn-role');

let currentRole = '';

// Nombres correspondientes a cada rol (SIN LOS PINES)
const userNames = {
    'subgerente': 'Yuandri', 
    'gerente': 'Nombre del Gerente',
    'duena': 'Nombre de la Dueña',
    'administradora': 'Tu Nombre'
};

// Lógica al tocar un rol
roleButtons.forEach(button => {
    button.addEventListener('click', () => {
        currentRole = button.getAttribute('data-role');
        const personName = userNames[currentRole];
        
        authTitle.textContent = '¡Bienvenido/a, ' + personName + '!';
        roleSection.style.display = 'none';
        authSection.classList.add('active');
    });
});

// Lógica para el botón "Volver"
btnBack.addEventListener('click', () => {
    userPinInput.value = ''; 
    currentRole = '';
    authSection.classList.remove('active');
    roleSection.style.display = 'block';
});

// Lógica para el botón "Entrar" (Conectado a Firebase)
btnSubmit.addEventListener('click', async () => {
    const pinIngresado = userPinInput.value;

    if (pinIngresado === '') {
        alert('Por favor, digite su PIN de 4 números.');
        return;
    }

    // Cambiamos el texto del botón mientras consulta a la base de datos
    btnSubmit.textContent = 'Verificando...';
    btnSubmit.disabled = true;

    try {
        // Consultamos la base de datos secreta de Firebase
        const docRef = doc(db, "usuarios", currentRole);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const pinReal = docSnap.data().pin;
            
            if (pinIngresado === pinReal) {
                alert('¡Acceso concedido, ' + userNames[currentRole] + '!');
                // Aquí luego programaremos qué pasa después de entrar
            } else {
                alert('PIN incorrecto. Por favor, inténtelo de nuevo.');
                userPinInput.value = '';
            }
        } else {
            alert('Aún no se ha configurado el PIN de este usuario en la base de datos.');
        }
    } catch (error) {
        console.error("Error:", error);
        alert('Error de conexión.');
    }

    // Volvemos a la normalidad el botón
    btnSubmit.textContent = 'Entrar';
    btnSubmit.disabled = false;
});
