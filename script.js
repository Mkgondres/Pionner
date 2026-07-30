import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { 
    getFirestore, doc, getDoc, getDocs, collection, addDoc, 
    serverTimestamp, query, where, enableIndexedDbPersistence, deleteDoc, orderBy, limit, setDoc
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
let notificacionesCache = {}; // <-- NUEVO: Para guardar los detalles de la notificación en memoria temporal

/* ========================================== */
/* SISTEMA DE NAVEGACIÓN NATIVA Y CARGA       */
/* ========================================== */

history.replaceState({ id: 'roleSelection' }, ''); 

window.mostrarCarga = function(mostrar, texto = 'Cargando...') {
    let loader = document.getElementById('globalLoader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'globalLoader';
        loader.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15,23,42,0.9); z-index:9999; display:flex; flex-direction:column; justify-content:center; align-items:center; color:#10B981; backdrop-filter:blur(8px);';
        loader.innerHTML = `
            <i class="fas fa-spinner fa-spin" style="font-size:3.5rem; margin-bottom:20px; text-shadow: 0 0 15px rgba(16,185,129,0.5);"></i>
            <p id="loaderText" style="color:#F8FAFC; font-weight:600; font-size:1.1rem; letter-spacing:1px;"></p>
        `;
        document.body.appendChild(loader);
    }
    if (mostrar) {
        document.getElementById('loaderText').innerText = texto;
        loader.style.display = 'flex';
    } else {
        loader.style.display = 'none';
    }
};

window.addEventListener('popstate', (event) => {
    const targetId = (event.state && event.state.id) ? event.state.id : 'roleSelection';
    
    const currentActive = document.querySelector('.screen.active');
    if (currentActive && currentActive.id === 'seccion-ajustes-inventario' && inventarioModificado) {
        history.pushState({ id: 'seccion-ajustes-inventario' }, ''); 
        solicitarConfirmacion({
            icono: "⚠️",
            titulo: "Cambios sin guardar",
            mensaje: "Tienes ajustes pendientes. Si sales ahora, se perderán todos los cambios.",
            textoBoton: "Descartar",
            colorBoton: "#EF4444",
            alConfirmar: () => {
                inventarioModificado = false;
                history.back(); 
            }
        });
        return;
    }

    if (targetId === 'roleSelection') {
        currentUser = '';
        currentUserName = '';
        clearMessage();
    }

    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(targetId).classList.add('active');
});

/* ========================================== */

function limpiarNombreTurno(turnoStr) {
    if (!turnoStr) return "Turno Desconocido";
    if (turnoStr === "Cierre Noche") return "Turno de Noche";
    if (turnoStr === "Cierre Día") return "Turno de Día";
    return turnoStr.replace("Cierre ", "").trim();
}

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
    history.pushState({ id: 'authSection' }, ''); 
}

function goBack() {
    history.back();
}

function logout() {
    window.location.reload(); 
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
        mostrarCarga(true, 'Iniciando sesión...');
        
        // Buscamos el documento en Firebase
        const docRef = doc(db, "usuarios", currentUser);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const pinBaseDatos = String(docSnap.data().pin).trim();
            const pinUsuario = String(pinIngresado).trim();

            if (pinUsuario === pinBaseDatos) {
                // Entra exitosamente
                try {
                    const ordenSnap = await getDoc(doc(db, "configuracion", "orden_inventario"));
                    if (ordenSnap.exists() && ordenSnap.data().orden) {
                        ORDEN_MAESTRO = ordenSnap.data().orden;
                    }
                } catch(e) { console.log("Cargando orden por defecto"); }

                document.getElementById('authSection').classList.remove('active');
                document.getElementById('mainApp').classList.add('active');
                
                history.pushState({ id: 'mainApp' }, ''); 
                
                configurarPantallaPrincipal(currentUser, currentUserName);
                verificarNotificacionesPendientes();
                mostrarCarga(false);
            } else {
                mostrarCarga(false);
                // CHISME 1: Nos dirá si está leyendo mal el PIN
                alert(`Error de PIN:\nTú escribiste: "${pinUsuario}"\nFirebase tiene: "${pinBaseDatos}"`);
                showMessage('PIN incorrecto.', 'error');
                userPinInput.value = '';
            }
        } else {
            mostrarCarga(false);
            // CHISME 2: Nos dirá si el ID del usuario no coincide exactamente con el de Firebase
            alert(`Error Crítico:\nNo se encontró el documento exacto para el ID: "${currentUser}" en Firebase. Revisa mayúsculas/minúsculas.`);
        }
    } catch (e) {
        mostrarCarga(false);
        // CHISME 3: Nos dirá si hay un error de conexión o permisos
        alert(`Error de sistema:\n${e.message}`);
        
        // Esto lo dejamos por si quieres que entre a la fuerza aunque falle el internet (modo offline)
        document.getElementById('authSection').classList.remove('active');
        document.getElementById('mainApp').classList.add('active');
        configurarPantallaPrincipal(currentUser, currentUserName);
    }
}




window.configurarPantallaPrincipal = function(userId, userName) {
    document.getElementById('welcomeUserText').innerText = `Usuario activo: ${userName}`;
    const btnCuadre = document.getElementById('btnIniciarCuadre');
    const btnAjustes = document.getElementById('btnAjustesMenu');
    const btnIpb = document.getElementById('btnIpbLimpio'); 

    if (userId === 'yoandri') {
        btnCuadre.style.display = 'block';
        btnIpb.style.display = 'block'; 
        btnAjustes.style.display = 'none';
    } else {
        btnCuadre.style.display = 'none';
        btnIpb.style.display = 'none'; 
        btnAjustes.style.display = 'block';
    }
}


let ORDEN_MAESTRO = [
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
    mostrarCarga(true, 'Preparando Cuadre...');
    const container = document.getElementById('listaProductosContainer');
    const esYoandri = (currentUser === 'yoandri');

    try {
        const querySnapshot = await getDocs(collection(db, "productos"));
        productosMapCache = {};
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.nombre) productosMapCache[data.nombre.trim()] = data;
        });

        let ultimosValoresFinales = {};
        try {
            const histRef = collection(db, "historial_cuadres");
            const qHist = query(histRef, orderBy("timestamp", "desc"), limit(1));
            const histSnap = await getDocs(qHist);
            
            if (!histSnap.empty) {
                const ultimoCuadre = histSnap.docs[0].data();
                if (ultimoCuadre.productos && Array.isArray(ultimoCuadre.productos)) {
                    ultimoCuadre.productos.forEach(prod => {
                        ultimosValoresFinales[prod.nombre.trim()] = prod.final;
                    });
                }
            }
        } catch(err) {}

        let html = '<table><tr><th>PRODUCTO</th><th>INICIO</th><th>ENTRADA</th><th>BAJA</th><th>FINAL</th><th>VENTA</th>';
        if (!esYoandri) html += '<th>PRECIO COMP</th>';
        html += '<th>PRECIO VNTA</th><th>TOTAL VNTA</th>';
        if (!esYoandri) html += '<th>GANANCIA U</th><th>GANANCIA T</th>';
        html += '</tr>';

        let indexContador = 0;
        let filaAlternada = false;

        ORDEN_MAESTRO.forEach((item) => {
            if (item.startsWith("***")) {
                html += `<tr style="background: #334155; font-weight: bold;"><td colspan="${esYoandri ? 8 : 11}" style="padding: 10px; color: #f8fafc; text-align: left;">${item}</td></tr>`;
                filaAlternada = false;
                return;
            }
            const p = productosMapCache[item] || { nombre: item, precioVenta: 0, precioCompra: 0 };
            const idx = indexContador++;
            const filaClase = filaAlternada ? 'row-alt' : 'row-normal';
            filaAlternada = !filaAlternada;

            const valorInicioPrevio = ultimosValoresFinales[p.nombre.trim()];
            const esHeredado = (valorInicioPrevio !== undefined && valorInicioPrevio !== null && valorInicioPrevio !== "");

            html += `<tr class="${filaClase}" data-index="${idx}" data-nombre="${p.nombre}">`;
            html += `<td>${p.nombre}</td>`;
            
            if (esHeredado) {
                html += `<td><input type="number" class="input-cell input-inicio" style="width: 50px; background-color: #cbd5e1; color: #0f172a;" value="${valorInicioPrevio}" readonly oninput="calcularFilaProducto(${idx}, ${p.precioVenta || 0}, ${p.precioCompra || 0})"></td>`;
            } else {
                html += `<td><input type="number" class="input-cell input-inicio" style="width: 50px;" oninput="calcularFilaProducto(${idx}, ${p.precioVenta || 0}, ${p.precioCompra || 0})"></td>`;
            }

            html += `<td><input type="number" class="input-cell input-entrada" style="width: 50px;" oninput="calcularFilaProducto(${idx}, ${p.precioVenta || 0}, ${p.precioCompra || 0})"></td>`;
            html += `<td><input type="number" class="input-cell input-baja" style="width: 50px;" oninput="calcularFilaProducto(${idx}, ${p.precioVenta || 0}, ${p.precioCompra || 0})"></td>`;
            html += `<td><input type="number" class="input-cell input-final" style="width: 50px;" oninput="calcularFilaProducto(${idx}, ${p.precioVenta || 0}, ${p.precioCompra || 0})"></td>`;
            html += `<td style="font-weight: bold;" id="venta-${idx}">0</td>`;
            if (!esYoandri) html += `<td>$${p.precioCompra}</td>`;
            html += `<td style="font-weight: bold;">$${p.precioVenta}</td>`;
            html += `<td style="color: #059669; font-weight: bold;" id="totalVenta-${idx}">0</td>`;
            if (!esYoandri) {
                html += `<td style="color: #047857;">$${(p.precioVenta - p.precioCompra)}</td>`;
                html += `<td style="color: #047857; font-weight: bold;" id="gananciaT-${idx}">0</td>`;
            }
            html += `</tr>`;
        });
        container.innerHTML = html + '</table>';

        document.querySelectorAll('tr[data-index]').forEach(row => {
            const idx = row.dataset.index;
            const nom = row.dataset.nombre;
            const pr = productosMapCache[nom] || { precioVenta: 0, precioCompra: 0 };
            const inpInicio = row.querySelector('.input-inicio');
            if(inpInicio && inpInicio.readOnly && inpInicio.value !== "") {
                calcularFilaProducto(idx, pr.precioVenta, pr.precioCompra);
            }
        });

        document.getElementById('mainApp').classList.remove('active');
        document.getElementById('cuadreSection').classList.add('active');
        history.pushState({ id: 'cuadreSection' }, '');

    } catch (e) { console.error(e); } 
    finally { mostrarCarga(false); }
}

window.calcularFilaProducto = function(index, precioVenta, precioCompra) {
    const row = document.querySelector(`tr[data-index="${index}"]`);
    if (!row) return;
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

    const lblRecaudado = document.getElementById('lblEfectivoRecaudado');
    if(lblRecaudado) {
        lblRecaudado.innerText = efectivoReal + " CUP";
    }

    const res = document.getElementById('lblResultadoDiferencia');
    let diff = efectivoReal - totalFinal;

    if (diff >= 0) {
        res.innerHTML = `<div style="background:rgba(16,185,129,0.2);border:1px solid #10B981;color:#6EE7B7;padding:12px;border-radius:8px;">✓ Cuadre Correcto (+${diff} CUP)</div>`;
    } else {
        res.innerHTML = `<div style="background:rgba(239,68,68,0.2);border:1px solid #EF4444;color:#FCA5A5;padding:12px;border-radius:8px;">⚠ Faltante Detectado (${Math.abs(diff)} CUP)</div>`;
    }
}

window.guardarCuadreFinal = async function() {
    const btnGuardar = document.querySelector('#cuadreSection .btn-primary');
    if (btnGuardar) {
        btnGuardar.disabled = true;
        btnGuardar.textContent = "Guardando...";
    }

    const ahora = new Date();
    const hora = ahora.getHours();
    let nombreTurno = (hora >= 6 && hora < 18) ? "Turno de Día" : "Turno de Noche";

    let detalle = [];
    let gananciaBrutaTotal = 0;

    document.querySelectorAll('tr[data-index]').forEach(row => {
        const nombre = row.dataset.nombre;
        const pInfo = productosMapCache[nombre];
        const venta = parseFloat(row.querySelector('[id^="venta-"]').innerText) || 0;
        const pVenta = pInfo?.precioVenta || 0;
        const pCompra = pInfo?.precioCompra || 0;
        const gananciaTItem = venta * (pVenta - pCompra);

        gananciaBrutaTotal += gananciaTItem;

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
            gananciaT: gananciaTItem
        });
    });

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
        const val = parseFloat(i.value) || 0;
        if(val > 0) transfArr.push(val);
    });

    const ventaTotalStr = document.getElementById('lblVentaTotal').innerText;
    const totalFinalStr = document.getElementById('lblFinal').innerText;
    const efectivoVal = document.getElementById('efectivoCaja').value || 0;

    const datos = {
        usuario: currentUserName,
        turno: nombreTurno,
        fecha: ahora.toLocaleString(),
        timestamp: serverTimestamp(),
        productos: detalle,
        financiero: {
            efectivo: efectivoVal,
            transferencias: transfArr,
            gastos: gastosArr,
            salarios: salariosArr,
            ventaTotal: ventaTotalStr,
            totalFinal: totalFinalStr,
            gananciaBruta: gananciaBrutaTotal
        }
    };

    try {
        const qCheck = query(collection(db, "historial_cuadres"), where("usuario", "==", currentUserName), where("turno", "==", nombreTurno));
        const snapCheck = await getDocs(qCheck);
        let duplicado = false;
        
        snapCheck.forEach(d => {
            const data = d.data();
            if(data.financiero?.ventaTotal === ventaTotalStr && data.financiero?.totalFinal === totalFinalStr) {
                duplicado = true;
            }
        });

        if(duplicado) {
            alert("⚠️ Este cuadre ya fue guardado anteriormente con los mismos valores.");
            if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.textContent = "Guardar Cuadre"; }
            return;
        }

        const nuevoCuadreRef = await addDoc(collection(db, "historial_cuadres"), datos);
        
        await addDoc(collection(db, "notificaciones"), { 
            leido: false, 
            msg: `Yoandri envió cuadre nuevo (${nombreTurno} - ${ahora.toLocaleDateString()})`, 
            time: serverTimestamp(),
            usuario: currentUserName,
            turno: nombreTurno,
            cuadreId: nuevoCuadreRef.id
        });
        
        document.getElementById('customModal').style.display = 'flex';
    } catch (e) {
        alert("Error al guardar localmente.");
    } finally {
        if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.textContent = "Guardar Cuadre"; }
    }
}

window.cerrarModalCustom = function() {
    document.getElementById('customModal').style.display = 'none';
    cancelarCuadre();
}

window.verificarNotificacionesPendientes = async function() {
    try {
        const q = query(collection(db, "notificaciones"), where("leido", "==", false));
        const snap = await getDocs(q);
        document.getElementById('contadorCampanita').innerText = snap.size;
    } catch(e) {}
}

/* MODIFICACIÓN 1: Cargar notificaciones usando caché para no romper el HTML visual */
window.verNotificaciones = async function() {
    const modal = document.getElementById('modalNotificaciones');
    const container = document.getElementById('listaNotificacionesContainer');
    modal.style.display = 'flex';
    container.innerHTML = '<p style="color:#94A3B8; text-align:center;">Cargando...</p>';

    try {
        const q = query(collection(db, "notificaciones"), where("leido", "==", false));
        const snap = await getDocs(q);
        let html = '';
        notificacionesCache = {}; 
        
        snap.forEach(docSnap => {
            const n = docSnap.data();
            notificacionesCache[docSnap.id] = n; 
            const textoNotif = n.msg || "Nueva notificación"; 
            
            html += `<div onclick="abrirAtajoNotificacion('${docSnap.id}')" style="background:rgba(15,23,42,0.8); padding:12px; border-radius:10px; margin-bottom:10px; border-left:4px solid #10B981; cursor:pointer;">
                <p style="color:#F8FAFC; font-size:0.9rem; font-weight:bold; margin-bottom:4px;">🔔 ${textoNotif}</p>
                <span style="color:#94A3B8; font-size:0.75rem;">Toca aquí para ver detalles</span>
            </div>`;
        });

        container.innerHTML = html || '<p style="color:#94A3B8; text-align:center;">No hay notificaciones pendientes.</p>';
    } catch(e) {
        container.innerHTML = '<p style="color:#EF4444; text-align:center;">Error al cargar.</p>';
    }
}

/* MODIFICACIÓN 2: Lógica inteligente del clic en la notificación (Detalle de Cuadre vs Ventana Emergente de Única Vista) */
window.abrirAtajoNotificacion = async function(notifId) {
    try {
        mostrarCarga(true, "Abriendo Notificación...");
        const n = notificacionesCache[notifId]; 
        
        // La marcamos como leída eliminándola inmediatamente de Firebase
        await deleteDoc(doc(db, "notificaciones", notifId));
        document.getElementById('modalNotificaciones').style.display = 'none';
        verificarNotificacionesPendientes();
        
        if (n && n.cuadreId && n.cuadreId !== 'undefined' && n.cuadreId !== 'null') {
            // Es un cuadre: vamos al detalle
            verDetalleCuadre(n.cuadreId);
        } else if (n && n.tipo === 'ajuste_inventario') {
            mostrarCarga(false); // Quitamos la carga porque no nos movemos de pantalla
            
            // Construimos la lista visual con lo que cambió
            let htmlDetalles = "";
            if (n.detalles && n.detalles.length > 0) {
                htmlDetalles = n.detalles.join('<br><br>');
            } else {
                htmlDetalles = "Se realizaron ajustes internos que no afectan el precio de venta.";
            }

            // Usamos tu modal genérico para el cartel emergente de vista única
            document.getElementById('modalIcon').innerText = "📋";
            document.getElementById('modalTitle').innerText = "Detalle de Ajustes";
            document.getElementById('modalMessage').innerHTML = `<div style="text-align:left; font-size:14px; margin-top:10px; padding:12px; background:#f8fafc; border-radius:6px; color:#0f172a; border: 1px solid #cbd5e1; max-height: 300px; overflow-y: auto;">${htmlDetalles}</div>`;
            
            const btnAceptarModal = document.querySelector('#customModal .btn-primary');
            btnAceptarModal.onclick = function() {
                document.getElementById('customModal').style.display = 'none';
                // Al darle a "Entendido", se cierra y como ya se borró de la DB, desaparece para siempre.
            };
            document.getElementById('customModal').style.display = 'flex';
        } else {
            mostrarCarga(false);
        }
    } catch(e) {
        alert("Error al procesar el atajo.");
        mostrarCarga(false);
    }
}

window.cerrarModalNotificaciones = function() {
    document.getElementById('modalNotificaciones').style.display = 'none';
}

window.verHistorial = async function() {
    mostrarCarga(true, 'Buscando Registros...');
    const container = document.getElementById('listaHistorialContainer');

    try {
        const qHistorial = query(collection(db, "historial_cuadres"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(qHistorial);
        
        const gruposPorFecha = {};
        
        querySnapshot.forEach((docSnap) => {
            const h = docSnap.data();
            const fechaCompleta = h.fecha || 'Sin fecha';
            const dateOnly = fechaCompleta.includes(',') ? fechaCompleta.split(',')[0].trim() : fechaCompleta.split(' ')[0].trim();
            
            if(!gruposPorFecha[dateOnly]) {
                gruposPorFecha[dateOnly] = [];
            }
            gruposPorFecha[dateOnly].push({ id: docSnap.id, ...h });
        });
        
        let html = '';
        let groupIdx = 0;
        
        for (const [date, cuadres] of Object.entries(gruposPorFecha)) {
            const isFirst = (groupIdx === 0);
            const displayStyle = isFirst ? 'block' : 'none'; 
            const icon = isFirst ? '▲' : '▼';
            
            html += `
            <div style="background: rgba(15,23,42,0.8); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; margin-bottom: 12px;">
                <div onclick="toggleDateGroup(${groupIdx})" style="padding: 14px 15px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; color: #F8FAFC; font-weight: bold; background: rgba(30,41,59,0.5); border-radius: 8px;">
                    <span>📅 Historial del ${date}</span>
                    <span id="icon-group-${groupIdx}">${icon}</span>
                </div>
                <div id="content-group-${groupIdx}" style="display: ${displayStyle}; padding: 12px; border-top: 1px solid rgba(255,255,255,0.05);">
            `;
            
            cuadres.forEach(h => {
                const nombreTurnoLimpio = limpiarNombreTurno(h.turno);
                const horaOnly = h.fecha ? (h.fecha.includes(',') ? h.fecha.split(',')[1].trim() : '') : '';
                
                html += `<div onclick="verDetalleCuadre('${h.id}')" style="background:rgba(30,41,59,0.7); border:1px solid rgba(255,255,255,0.1); padding:12px; border-radius:10px; margin-bottom:10px; cursor:pointer;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                        <strong style="color:#10B981;">${h.usuario}</strong>
                        <span style="color:#94A3B8; font-size:0.8rem;">${horaOnly}</span>
                    </div>
                    <p style="color:#F8FAFC; font-size:0.9rem; font-weight: bold;">${nombreTurnoLimpio}</p>
                    <div style="display:flex; justify-content:space-between; margin-top:6px; font-size:0.85rem; color:#cbd5e1;">
                        <span>Venta: ${h.financiero?.ventaTotal}</span>
                        <span>Final: ${h.financiero?.totalFinal}</span>
                    </div>
                </div>`;
            });
            
            html += `</div></div>`;
            groupIdx++;
        }
        
        if (html === '') {
            html = '<p style="text-align:center; color:#94A3B8;">No hay cuadres guardados aún.</p>';
        }
        container.innerHTML = html;

        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('historialSection').classList.add('active');
        history.pushState({ id: 'historialSection' }, '');

    } catch(e) {
        container.innerHTML = '<p style="text-align:center; color:#EF4444;">Error al cargar el historial.</p>';
    } finally {
        mostrarCarga(false);
    }
}

window.toggleDateGroup = function(idx) {
    const el = document.getElementById('content-group-' + idx);
    const icon = document.getElementById('icon-group-' + idx);
    if (el.style.display === 'none') {
        el.style.display = 'block';
        icon.innerText = '▲';
    } else {
        el.style.display = 'none';
        icon.innerText = '▼';
    }
}

window.cerrarHistorial = function() {
    history.back();
}

window.volverAlHistorial = function() {
    history.back();
}

window.verDetalleCuadre = async function(id) {
    mostrarCarga(true, 'Abriendo Detalle...');
    const container = document.getElementById('detalleContenidoContainer');
    const esYoandri = (currentUser === 'yoandri');

    try {
        const docRef = doc(db, "historial_cuadres", id);
        const docSnap = await getDoc(docRef);

        if(docSnap.exists()) {
            const h = docSnap.data();
            const nombreTurnoLimpio = limpiarNombreTurno(h.turno);
            
            document.getElementById('detalleTituloTurno').innerText = nombreTurnoLimpio;
            document.getElementById('detalleSubInfo').innerText = `Responsable: ${h.usuario} (${h.fecha})`;

            let html = '<table style="width: 100%; min-width: 800px; border-collapse: collapse; background: #ffffff; color: #0f172a;">';
            html += '<tr>';
            html += '<th style="position: sticky; top: 0; background: #1e293b; color: #ffffff; z-index: 50; padding: 12px 8px; font-size: 11px; text-align: left;">PRODUCTO</th>';
            html += '<th style="position: sticky; top: 0; background: #1e293b; color: #ffffff; z-index: 50; padding: 12px 8px; font-size: 11px; text-align: center;">INICIO</th>';
            html += '<th style="position: sticky; top: 0; background: #1e293b; color: #ffffff; z-index: 50; padding: 12px 8px; font-size: 11px; text-align: center;">ENTRADA</th>';
            html += '<th style="position: sticky; top: 0; background: #1e293b; color: #ffffff; z-index: 50; padding: 12px 8px; font-size: 11px; text-align: center;">BAJA</th>';
            html += '<th style="position: sticky; top: 0; background: #1e293b; color: #ffffff; z-index: 50; padding: 12px 8px; font-size: 11px; text-align: center;">FINAL</th>';
            html += '<th style="position: sticky; top: 0; background: #1e293b; color: #ffffff; z-index: 50; padding: 12px 8px; font-size: 11px; text-align: center;">VENTA</th>';
            if (!esYoandri) html += '<th style="position: sticky; top: 0; background: #1e293b; color: #ffffff; z-index: 50; padding: 12px 8px; font-size: 11px; text-align: center;">PRECIO COMP</th>';
            html += '<th style="position: sticky; top: 0; background: #1e293b; color: #ffffff; z-index: 50; padding: 12px 8px; font-size: 11px; text-align: center;">PRECIO VNTA</th>';
            html += '<th style="position: sticky; top: 0; background: #1e293b; color: #ffffff; z-index: 50; padding: 12px 8px; font-size: 11px; text-align: center;">TOTAL VNTA</th>';
            if (!esYoandri) {
                html += '<th style="position: sticky; top: 0; background: #1e293b; color: #ffffff; z-index: 50; padding: 12px 8px; font-size: 11px; text-align: center;">GANANCIA U</th>';
                html += '<th style="position: sticky; top: 0; background: #1e293b; color: #ffffff; z-index: 50; padding: 12px 8px; font-size: 11px; text-align: center;">GANANCIA T</th>';
            }
            html += '</tr>';

            if(h.productos && h.productos.length > 0) {
                let filaAlternada = false;
                const cajitaFakeCSS = "width: 50px; text-align: center; margin: 0 auto; font-weight: bold; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 0; color: #0f172a; display: block;";

                let prodGuardados = {};
                h.productos.forEach(p => {
                    prodGuardados[p.nombre.trim()] = p;
                });

                ORDEN_MAESTRO.forEach(item => {
                    if (item.startsWith("***")) {
                        html += `<tr style="background: #334155; font-weight: bold;"><td colspan="${esYoandri ? 8 : 11}" style="padding: 10px; color: #f8fafc; text-align: left;">${item}</td></tr>`;
                        filaAlternada = false;
                        return;
                    }

                    const p = prodGuardados[item.trim()];
                    if (p) {
                        const filaClase = filaAlternada ? 'row-alt' : 'row-normal';
                        filaAlternada = !filaAlternada;

                        html += `<tr class="${filaClase}">`;
                        html += `<td style="padding: 8px 6px; text-align: left; font-weight: 500;">${p.nombre}</td>`;
                        html += `<td style="padding: 8px 6px;"><div style="${cajitaFakeCSS}">${p.inicio}</div></td>`;
                        html += `<td style="padding: 8px 6px;"><div style="${cajitaFakeCSS}">${p.entrada}</div></td>`;
                        html += `<td style="padding: 8px 6px;"><div style="${cajitaFakeCSS}">${p.baja}</div></td>`;
                        html += `<td style="padding: 8px 6px;"><div style="${cajitaFakeCSS}">${p.final}</div></td>`;
                        html += `<td style="padding: 8px 6px; text-align: center; font-weight: bold;">${p.venta}</td>`;
                        
                        if (!esYoandri) html += `<td style="padding: 8px 6px; text-align: center;">$${p.precioCompra || 0}</td>`;
                        html += `<td style="padding: 8px 6px; text-align: center; font-weight: bold;">$${p.precioVenta || 0}</td>`;
                        html += `<td style="padding: 8px 6px; text-align: center; color:#059669; font-weight:bold;">$${p.totalVenta}</td>`;
                        
                        if (!esYoandri) {
                            html += `<td style="padding: 8px 6px; text-align: center; color:#047857;">$${p.gananciaU || 0}</td>`;
                            html += `<td style="padding: 8px 6px; text-align: center; color:#047857; font-weight:bold;">$${p.gananciaT || 0}</td>`;
                        }
                        html += `</tr>`;
                    }
                });
            }
            html += '</table>';

            const fin = h.financiero || {};
            let ventaTotalNum = parseFloat((fin.ventaTotal || "0").replace(/[^0-9.]/g, '')) || 0;
            let efectivoNum = parseFloat(fin.efectivo || 0) || 0;
            
            let transfArr = fin.transferencias || [];
            let sumaTransf = transfArr.reduce((a, b) => a + b, 0);
            let gastosArr = fin.gastos || [];
            let sumaGastos = gastosArr.reduce((acc, g) => acc + (parseFloat(g.monto) || 0), 0);
            let salariosArr = fin.salarios || [];
            let sumaSalarios = salariosArr.reduce((acc, s) => acc + (parseFloat(s.monto) || 0), 0);

            let gananciaBrutaNum = fin.gananciaBruta !== undefined ? fin.gananciaBruta : 0;
            if (gananciaBrutaNum === 0 && h.productos) {
                h.productos.forEach(p => { gananciaBrutaNum += (parseFloat(p.gananciaT) || 0); });
            }

            html += `<div style="background:#f8fafc; padding:15px; margin-top:15px; border-radius:8px; color:#0f172a; font-size:13px; border:1px solid #cbd5e1; text-align: left;">`;
            html += `<h4 style="margin-bottom:10px; border-bottom:2px solid #1e293b; padding-bottom:5px; color:#1e293b; font-size:15px;">Desglose Financiero</h4>`;
            html += `<h5 style="color:#0f766e; margin-bottom:6px; font-size:13px; text-transform:uppercase;">Datos:</h5>`;
            html += `<ul style="margin-left:15px; margin-bottom:10px; list-style-type:disc;">`;
            html += `<li><strong>Venta total:</strong> ${ventaTotalNum} CUP</li>`;
            html += `<li><strong>Efectivo en caja:</strong> ${efectivoNum} CUP</li>`;
            
            if (transfArr.length > 1) {
                html += `<li><strong>Transferencias (${transfArr.length}):</strong> ${sumaTransf} CUP</li>`;
            } else {
                html += `<li><strong>Transferencias:</strong> ${sumaTransf} CUP</li>`;
            }
            
            html += `<li><strong>Gastos del turno:</strong>`;
            if(gastosArr.length > 0) {
                html += `<ul style="margin-left:20px; margin-top:3px;">`;
                gastosArr.forEach(g => { html += `<li>${g.motivo} - ${g.monto} CUP</li>`; });
                html += `</ul>`;
            } else {
                html += ` Ninguno`;
            }
            html += `</li>`;

            html += `<li style="margin-top:5px;"><strong>Salarios pagados:</strong>`;
            if(salariosArr.length > 0) {
                html += `<ul style="margin-left:20px; margin-top:3px;">`;
                salariosArr.forEach(s => { html += `<li>${s.persona} - ${s.monto} CUP</li>`; });
                html += `</ul>`;
            } else {
                html += ` Ninguno`;
            }
            html += `</li>`;

            if (!esYoandri) {
                html += `<li style="margin-top:5px;"><strong>Ganancia Bruta:</strong> ${gananciaBrutaNum} CUP</li>`;
            }
            html += `</ul>`;

            let finalCalculado = ventaTotalNum - sumaTransf - sumaGastos - sumaSalarios;
            let efectivoRecaudado = efectivoNum - sumaSalarios;
            let gananciaNeta = gananciaBrutaNum - sumaGastos - sumaSalarios;

            html += `<h5 style="color:#0f766e; margin-bottom:6px; font-size:13px; text-transform:uppercase; border-top:1px dashed #cbd5e1; padding-top:8px;">Cálculos:</h5>`;
            html += `<div style="background:#ffffff; padding:10px; border-radius:6px; border:1px solid #e2e8f0; font-family:monospace; font-size:12px; margin-bottom:10px;">`;
            html += `  <div>${ventaTotalNum} &rarr; venta total</div>`;
            html += `  <div>- ${sumaTransf} &rarr; transferencias</div>`;
            html += `  <div>- ${sumaGastos} &rarr; gastos</div>`;
            html += `  <div>- ${sumaSalarios} &rarr; salarios</div>`;
            html += `  <div style="border-top:1px solid #0f172a; font-weight:bold; margin-top:2px; padding-top:2px;">= ${finalCalculado} &rarr; Final</div>`;
            html += `<br>`;
            html += `  <div>${efectivoNum} &rarr; Efectivo en caja</div>`;
            html += `  <div>- ${sumaSalarios} &rarr; salarios</div>`;
            html += `  <div style="border-top:1px solid #0f172a; font-weight:bold; margin-top:2px; padding-top:2px;">= ${efectivoRecaudado} &rarr; Efectivo recaudado</div>`;
            
            if (!esYoandri) {
                html += `<br>`;
                html += `  <div>${gananciaBrutaNum} &rarr; Ganancia Bruta</div>`;
                html += `  <div>- ${sumaGastos} &rarr; gastos</div>`;
                html += `  <div>- ${sumaSalarios} &rarr; salarios</div>`;
                html += `  <div style="border-top:1px solid #0f172a; font-weight:bold; margin-top:2px; padding-top:2px;">= ${gananciaNeta} &rarr; Ganancia Neta</div>`;
            }
            html += `</div>`;

            let diferenciaCaja = efectivoRecaudado - finalCalculado;
            let textoConclusionCaja = "";
            if (diferenciaCaja >= 0) {
                textoConclusionCaja = `El cuadre dio <strong style="color: #10B981;">correcto</strong>. Hay un sobrante de ${diferenciaCaja} CUP.`;
            } else {
                textoConclusionCaja = `Atención: Hay un <strong style="color: #EF4444;">faltante</strong> de ${Math.abs(diferenciaCaja)} CUP.`;
            }

            let porcentajeVenta = ventaTotalNum > 0 ? ((gananciaNeta / ventaTotalNum) * 100).toFixed(2) : "0.00";

            html += `<h5 style="color:#0f766e; margin-bottom:6px; font-size:13px; text-transform:uppercase; border-top:1px dashed #cbd5e1; padding-top:8px;">Conclusiones:</h5>`;
            html += `<ul style="margin-left:15px; margin-bottom:0; list-style-type:disc;">`;
            html += `<li>${textoConclusionCaja}</li>`;
            
            if (!esYoandri) {
                html += `<li style="margin-top:4px;">Ganancia neta: ${gananciaNeta} CUP, este monto representa el ${porcentajeVenta}% de la venta.</li>`;
            }
            html += `</ul>`;
            
            if (!esYoandri) {
                html += `<div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #cbd5e1;">
                            <button onclick="eliminarCuadre('${id}')" style="background-color: #EF4444; color: white; padding: 12px 20px; border: none; border-radius: 8px; font-weight: bold; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 100%; gap: 8px; box-shadow: 0 4px 6px rgba(239, 68, 68, 0.3);">
                                🗑️ Eliminar este Cuadre del Historial
                            </button>
                         </div>`;
            }

            html += `</div>`;

            container.innerHTML = html;

            document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
            document.getElementById('detalleCuadreSection').classList.add('active');
            history.pushState({ id: 'detalleCuadreSection' }, '');
        }
    } catch(e) {
        container.innerHTML = '<p style="text-align:center; color:#EF4444; padding:20px;">Error al cargar el detalle.</p>';
    } finally {
        mostrarCarga(false);
    }
}

window.eliminarCuadre = function(id) {
    solicitarConfirmacion({
        icono: "🗑️",
        titulo: "Eliminar Cuadre",
        mensaje: "¿Estás segura de que deseas eliminar este cuadre? Esta acción borrará el registro para siempre y no se puede deshacer.",
        textoBoton: "Sí, Eliminar",
        colorBoton: "#EF4444",
        alConfirmar: async () => {
            try {
                mostrarCarga(true, "Eliminando registro...");
                await deleteDoc(doc(db, "historial_cuadres", id));
                mostrarCarga(false);
                history.back();
                setTimeout(() => { verHistorial(); }, 100); 
            } catch (e) {
                mostrarCarga(false);
                alert("Hubo un error al intentar eliminar el cuadre. Revisa tu conexión.");
            }
        }
    });
}

window.cancelarCuadre = function() {
    history.back();
}

window.verAlmacen = function() { alert("Control de almacén en construcción."); }

window.selectUser = selectUser; window.goBack = goBack; window.logout = logout; window.verifyPin = verifyPin;
window.iniciarCuadre = iniciarCuadre; window.cancelarCuadre = cancelarCuadre;

window.descargarIPBLimpio = function() {
    const esYoandri = (currentUser === 'yoandri');
    
    let html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <title>IPV - Pionner</title>
        <style>
            @page { size: letter portrait; margin: 0.5cm; }
            body { font-family: Arial, sans-serif; font-size: 10px; color: #000; background: #fff; margin: 0; padding: 0; }
            h2 { text-align: center; margin-bottom: 5px; margin-top: 0; font-size: 14px; text-transform: uppercase; }
            .info-header { display: flex; justify-content: space-between; padding: 0 20px; margin-bottom: 8px; font-size: 11px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; table-layout: fixed; }
            thead { display: table-header-group; } 
            tr { page-break-inside: avoid; }
            th, td { border: 1px solid #000; padding: 2px 2px; text-align: center; height: 14px; background: #fff !important; color: #000 !important; font-size: 10px; word-wrap: break-word; }
            th { font-weight: bold; font-size: 9px; padding: 3px 2px; }
            .col-num { width: 3%; font-weight: bold; } 
            .col-prod { text-align: left; font-weight: bold; width: 22%; padding-left: 4px; }
            .categoria { text-align: left !important; padding: 3px 6px; font-size: 10px; font-weight: bold; font-style: italic; border-top: 1.5px solid #000; border-bottom: 1.5px solid #000; }
        </style>
    </head>
    <body>
        <h2>IPV - Pionner</h2>
        <div class="info-header">
            <span>Trabajador: _____________________________________________</span>
            <span>Fecha: ______________________</span>
        </div>
        <table>
            <thead>
                <tr>
                    <th class="col-num">#</th>
                    <th class="col-prod">PRODUCTO</th>
                    <th>INICIO</th>
                    <th>ENTRADA</th>
                    <th>BAJA</th>
                    <th>FINAL</th>
                    <th>VENTA</th>
                    ${!esYoandri ? '<th>PRECIO COMP</th>' : ''}
                    <th>PRECIO VNTA</th>
                    <th>TOTAL VNTA</th>
                    ${!esYoandri ? '<th>GANANCIA U</th><th>GANANCIA T</th>' : ''}
                </tr>
            </thead>
            <tbody>
    `;

    let contadorProductos = 1;

    ORDEN_MAESTRO.forEach(item => {
        if (item.startsWith("***")) {
            const colspan = esYoandri ? 9 : 12;
            html += `<tr><td colspan="${colspan}" class="categoria">${item}</td></tr>`;
        } else {
            html += `<tr>
                <td class="col-num">${contadorProductos++}</td>
                <td class="col-prod">${item}</td>
                <td></td><td></td><td></td><td></td><td></td>`;
            if (!esYoandri) html += `<td></td>`;
            html += `<td></td><td></td>`;
            if (!esYoandri) html += `<td></td><td></td>`;
            html += `</tr>`;
        }
    });

    html += `
            </tbody>
        </table>
        <script>
            window.onload = function() { setTimeout(() => { window.print(); }, 500); }
        </script>
    </body>
    </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
    } else {
        alert("Por favor, permite las ventanas emergentes (pop-ups) para descargar el IPV.");
    }
}

/* ========================================== */
/* LÓGICA: AJUSTES DE INVENTARIO              */
/* ========================================== */

let inventarioModificado = false;
let accionConfirmacionPendiente = null;
let motorArrastre = null;

function marcarCambios() {
    inventarioModificado = true;
}

document.getElementById('body-ajustes-inventario').addEventListener('input', (e) => {
    if(e.target.classList.contains('input-ajuste-precio')) {
        marcarCambios();
    }
});

function activarDragAndDrop() {
    const tbody = document.getElementById('body-ajustes-inventario');
    if (motorArrastre !== null) { motorArrastre.destroy(); }

    motorArrastre = new Sortable(tbody, {
        handle: '.drag-handle', 
        animation: 150,         
        filter: '.no-drag',     
        ghostClass: 'sortable-ghost', 
        forceFallback: true,    
        fallbackOnBody: true,   
        swapThreshold: 0.65,    
        onEnd: function () { marcarCambios(); }
    });
}

function cargarTablaAjustes() {
    const tbody = document.getElementById('body-ajustes-inventario');
    tbody.innerHTML = '';

    ORDEN_MAESTRO.forEach(item => {
        const tr = document.createElement('tr');

        if (item.startsWith('***')) {
            tr.className = 'fila-categoria-ajuste no-drag'; 
            tr.innerHTML = `<td colspan="5">${item}</td>`;
        } else {
            tr.className = 'fila-producto-ajuste';
            let prodData = productosMapCache[item] || {};
            let precioCompraActual = prodData.precioCompra || 0; 
            let precioVentaActual = prodData.precioVenta || 0;  

            tr.innerHTML = `
                <td class="col-drag"><i class="fas fa-bars drag-handle"></i></td>
                <td class="col-nombre">
                    <span class="nombre-prod-texto">${item}</span>
                    <input type="hidden" class="input-nombre" value="${item}">
                </td>
                <td class="col-precio">
                    <input type="number" class="input-ajuste-precio input-compra" value="${precioCompraActual}">
                </td>
                <td class="col-precio">
                    <input type="number" class="input-ajuste-precio input-venta" value="${precioVentaActual}">
                </td>
                <td class="col-accion">
                    <button class="btn-eliminar-fila"><i class="fas fa-trash"></i></button>
                </td>
            `;
        }
        tbody.appendChild(tr);
    });

    activarDragAndDrop();
}

document.getElementById('btn-add-producto').addEventListener('click', () => {
    document.getElementById('inputNuevoProducto').value = '';
    document.getElementById('modalAddProducto').style.display = 'flex';
});

window.confirmarAddProducto = function() {
    const nombreProducto = document.getElementById('inputNuevoProducto').value.trim();
    if (!nombreProducto) return; 

    const tbody = document.getElementById('body-ajustes-inventario');
    const tr = document.createElement('tr');
    tr.className = 'fila-producto-ajuste';
    
    tr.innerHTML = `
        <td class="col-drag"><i class="fas fa-bars drag-handle"></i></td>
        <td class="col-nombre">
            <span class="nombre-prod-texto" style="color: #28a745;">${nombreProducto} (Nuevo)</span>
            <input type="hidden" class="input-nombre" value="${nombreProducto}">
        </td>
        <td class="col-precio">
            <input type="number" class="input-ajuste-precio input-compra" value="0">
        </td>
        <td class="col-precio">
            <input type="number" class="input-ajuste-precio input-venta" value="0">
        </td>
        <td class="col-accion">
            <button class="btn-eliminar-fila"><i class="fas fa-trash"></i></button>
        </td>
    `;
    
    tbody.insertBefore(tr, tbody.firstChild);
    document.getElementById('modalAddProducto').style.display = 'none';
    marcarCambios();
}

function solicitarConfirmacion({ icono, titulo, mensaje, textoBoton, colorBoton, alConfirmar }) {
    document.getElementById('modalConfirmIcon').innerText = icono || "⚠️";
    document.getElementById('modalConfirmTitle').innerText = titulo;
    document.getElementById('modalConfirmMessage').innerText = mensaje;
    
    const btnAccion = document.getElementById('btnConfirmAction');
    btnAccion.innerText = textoBoton;
    btnAccion.style.backgroundColor = colorBoton || "#EF4444";
    
    accionConfirmacionPendiente = alConfirmar;
    document.getElementById('modalConfirmacionGenerico').style.display = 'flex';
}

window.cerrarModalConfirmacion = function() {
    document.getElementById('modalConfirmacionGenerico').style.display = 'none';
    accionConfirmacionPendiente = null;
};

document.getElementById('btnConfirmAction').addEventListener('click', () => {
    if (typeof accionConfirmacionPendiente === 'function') { accionConfirmacionPendiente(); }
    cerrarModalConfirmacion();
});

document.getElementById('body-ajustes-inventario').addEventListener('click', (e) => {
    const btnEliminar = e.target.closest('.btn-eliminar-fila');
    if (btnEliminar) {
        const fila = btnEliminar.closest('tr');
        const inputNombre = fila.querySelector('.input-nombre');
        const nombreProducto = inputNombre ? inputNombre.value : "este producto";
        
        solicitarConfirmacion({
            icono: "🗑️",
            titulo: "Eliminar Producto",
            mensaje: `¿Estás seguro de que deseas eliminar "${nombreProducto}" del inventario?`,
            textoBoton: "Eliminar",
            colorBoton: "#EF4444",
            alConfirmar: () => {
                fila.remove();
                marcarCambios();
            }
        });
    }
});

/* ========================================== */
/* ABRIR, CERRAR Y GUARDAR PANTALLA DE AJUSTES */
/* ========================================== */

window.gestionarMenu = async function() {
    mostrarCarga(true, 'Cargando Inventario...');

    try {
        const querySnapshot = await getDocs(collection(db, "productos"));
        productosMapCache = {};
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.nombre) {
                productosMapCache[data.nombre.trim()] = data;
                productosMapCache[data.nombre.trim()].idReal = docSnap.id; 
            }
        });

        cargarTablaAjustes();
        inventarioModificado = false; 

        document.getElementById('mainApp').classList.remove('active');
        document.getElementById('seccion-ajustes-inventario').classList.add('active');
        history.pushState({ id: 'seccion-ajustes-inventario' }, '');
    } catch (e) {
        console.error("Error al cargar ajustes:", e);
    } finally {
        mostrarCarga(false);
    }
}

window.cerrarAjustes = function() {
    if (inventarioModificado) {
        solicitarConfirmacion({
            icono: "⚠️",
            titulo: "Cambios sin guardar",
            mensaje: "Tienes ajustes pendientes. Si sales ahora, se perderán todos los cambios.",
            textoBoton: "Descartar",
            colorBoton: "#EF4444",
            alConfirmar: () => {
                inventarioModificado = false;
                history.back();
            }
        });
    } else {
        history.back();
    }
}

/* MODIFICACIÓN 3: Lógica inteligente de generar los reportes de ajustes para el cartel emergente */
document.getElementById('btn-guardar-ajustes').addEventListener('click', async () => {
    const btnGuardar = document.getElementById('btn-guardar-ajustes');
    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando cambios...';

    try {
        const filas = document.querySelectorAll('#body-ajustes-inventario tr');
        let nuevoOrden = [];
        let detallesAjuste = []; // <- Array que armará la lista visual de cambios
        let productosActuales = []; 

        for (let fila of filas) {
            if (fila.classList.contains('fila-categoria-ajuste')) {
                nuevoOrden.push(fila.innerText.trim());
            } else if (fila.classList.contains('fila-producto-ajuste')) {
                const nombre = fila.querySelector('.input-nombre').value.trim();
                const pCompra = parseFloat(fila.querySelector('.input-compra').value) || 0;
                const pVenta = parseFloat(fila.querySelector('.input-venta').value) || 0;
                
                nuevoOrden.push(nombre);
                productosActuales.push(nombre);

                const dataCache = productosMapCache[nombre];
                
                if (!dataCache) {
                    // Producto nuevo
                    await addDoc(collection(db, "productos"), { nombre: nombre, precioCompra: pCompra, precioVenta: pVenta });
                    detallesAjuste.push(`➕ <b>Añadido:</b> "${nombre}" a $${pVenta}`);
                } else if (dataCache.precioCompra !== pCompra || dataCache.precioVenta !== pVenta) {
                    
                    // Modificamos base de datos
                    const productoRef = doc(db, "productos", dataCache.idReal);
                    await setDoc(productoRef, { nombre: nombre, precioCompra: pCompra, precioVenta: pVenta }, { merge: true });
                    
                    // Solo revelamos en el detalle visual si el precio de VENTA cambió
                    if (dataCache.precioVenta !== pVenta) {
                        detallesAjuste.push(`🔄 <b>Modificado:</b> "${nombre}" pasó de $${dataCache.precioVenta || 0} a $${pVenta}`);
                    }
                }
            }
        }

        for (let nombreEnCache in productosMapCache) {
            if (!productosActuales.includes(nombreEnCache)) {
                // Producto eliminado
                const idRealEliminar = productosMapCache[nombreEnCache].idReal;
                if (idRealEliminar) {
                    await deleteDoc(doc(db, "productos", idRealEliminar));
                }
                detallesAjuste.push(`🗑️ <b>Eliminado:</b> "${nombreEnCache}"`);
            }
        }

        const ordenRef = doc(db, "configuracion", "orden_inventario");
        await setDoc(ordenRef, { orden: nuevoOrden });

        // Guardamos la notificación con todo el detalle inyectado si hubo cambios reportables
        if (detallesAjuste.length > 0) {
            await addDoc(collection(db, "notificaciones"), {
                leido: false, 
                msg: `${currentUserName} realizó cambios en el inventario.`, 
                detalles: detallesAjuste, // Aquí pasamos el arreglo completo
                time: serverTimestamp(),
                usuario: currentUserName, 
                tipo: "ajuste_inventario"
            });
        }

        inventarioModificado = false;
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar todos los cambios';

        document.getElementById('modalIcon').innerText = "✓";
        document.getElementById('modalTitle').innerText = "¡Guardado Exitoso!";
        document.getElementById('modalMessage').innerText = "El inventario fue actualizado. Los datos ya están sincronizados.";

        const btnAceptarModal = document.querySelector('#customModal .btn-primary');
        btnAceptarModal.onclick = function() {
            document.getElementById('customModal').style.display = 'none';
            ORDEN_MAESTRO = nuevoOrden;
            inventarioModificado = false; 
            history.back(); 
        };
        document.getElementById('customModal').style.display = 'flex';

    } catch (error) {
        document.getElementById('modalIcon').innerText = "⚠";
        document.getElementById('modalTitle').innerText = "Error al Guardar";
        document.getElementById('modalMessage').innerText = "Hubo un problema. Revisa tu internet y vuelve a intentarlo.";
        
        const btnAceptarModal = document.querySelector('#customModal .btn-primary');
        btnAceptarModal.onclick = function() { document.getElementById('customModal').style.display = 'none'; };
        document.getElementById('customModal').style.display = 'flex';

        btnGuardar.disabled = false;
        btnGuardar.innerHTML = '<i class="fas fa-save"></i> Guardar todos los cambios';
    }
});
