import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

// Reemplaza esto con la configuración que copiamos de Firebase hace un rato
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

const roleSection = document.getElementById('roleSection');
const authSection = document.getElementById('authSection');
const authTitle = document.getElementById('authTitle');
const userPinInput = document.getElementById('userPin');
const btnBack = document.getElementById('btnBack');
const btnSubmit = document.getElementById('btnSubmit');
const roleButtons = document.querySelectorAll('.btn-role');

let currentUser = '';

// Nombres para mostrar en pantalla
const userNames = {
    'yoandri': 'Yoandri', 
    'dairan': 'Dairan',
    'mariadelcarmen': 'Maria Del Carmen',
    'marikarla': 'Marikarla'
};

roleButtons.forEach(button => {
    button.addEventListener('click', () => {
        currentUser = button.getAttribute('data-user');
        const personName = userNames[currentUser];
        
        authTitle.textContent = '¡Bienvenido/a, ' + personName + '!';
        roleSection.style.display = 'none';
        authSection.classList.add('active');
    });
});

btnBack.addEventListener('click', () => {
    userPinInput.value = ''; 
    currentUser = '';
    authSection.classList.remove('active');
    roleSection.style.display = 'block';
});

btnSubmit.addEventListener('click', async () => {
    const pinIngresado = userPinInput.value;

    if (pinIngresado === '') {
        alert('Por favor, digite su PIN de 4 números.');
        return;
    }

    btnSubmit.textContent = 'Verificando...';
    btnSubmit.disabled = true;

    try {
        const docRef = doc(db, "usuarios", currentUser);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const pinReal = docSnap.data().pin;
            
            if (pinIngresado === pinReal) {
                alert('¡Acceso concedido, ' + userNames[currentUser] + '!');
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
});
