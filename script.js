// Referencias a los elementos de la pantalla
const roleSection = document.getElementById('roleSection');
const authSection = document.getElementById('authSection');
const authTitle = document.getElementById('authTitle');
const userNameInput = document.getElementById('userName');
const userPinInput = document.getElementById('userPin');
const btnBack = document.getElementById('btnBack');
const btnSubmit = document.getElementById('btnSubmit');
const roleButtons = document.querySelectorAll('.btn-role');

// Variable para guardar qué rol eligió el usuario en ese momento
let currentRole = '';

// Los PINs de seguridad que definimos para cada rol
const securityPins = {
    'subgerente': '4821',
    'gerente': '7394',
    'duena': '2568',
    'administradora': '1234'
};

// 1. Lógica cuando tocan un botón de rol
roleButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Guardamos internamente qué rol seleccionó
        currentRole = button.getAttribute('data-role');
        
        // Cambiamos el título para confirmar el rol (ej. "Acceso - Gerente")
        authTitle.textContent = 'Acceso - ' + button.textContent;
        
        // Ocultamos la lista de roles y mostramos el formulario del PIN
        roleSection.style.display = 'none';
        authSection.classList.add('active');
    });
});

// 2. Lógica para el botón "Volver"
btnBack.addEventListener('click', () => {
    // Limpiamos los campos por seguridad
    userNameInput.value = '';
    userPinInput.value = '';
    currentRole = '';
    
    // Ocultamos el formulario y volvemos a mostrar los roles
    authSection.classList.remove('active');
    roleSection.style.display = 'block';
});

// 3. Lógica para el botón "Continuar" (Verificación)
btnSubmit.addEventListener('click', () => {
    const name = userNameInput.value.trim();
    const pin = userPinInput.value;

    // Verificamos que no hayan dejado espacios en blanco
    if (name === '') {
        alert('Por favor, escriba su nombre.');
        return; // Detiene el código aquí si falta el nombre
    }

    if (pin === '') {
        alert('Por favor, digite su PIN de 4 números.');
        return; // Detiene el código aquí si falta el PIN
    }

    // Comparamos el PIN escrito con el PIN guardado en el sistema para ese rol
    if (securityPins[currentRole] === pin) {
        // Acceso correcto
        alert('¡Acceso concedido, ' + name + '!');
        
        // NOTA: Aquí en el futuro agregaremos el código para llevar a cada usuario a su pantalla correspondiente.
        
    } else {
        // Acceso denegado
        alert('PIN incorrecto. Por favor, inténtelo de nuevo.');
        userPinInput.value = ''; // Limpiamos solo el PIN para que lo vuelva a intentar
    }
});

