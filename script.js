import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { 
    getFirestore, doc, getDoc, getDocs, collection, addDoc, 
    serverTimestamp, query, where, enableIndexedDbPersistence, deleteDoc, orderBy, limit 
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

    try {
        const docRef = doc(db, "usuarios", currentUser);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            if (pinIngresado === docSnap.data().pin) {
                document.getElementById('authSection').classList.remove('active');
                document.getElementById('mainApp').classList.add('active');
                configurarPantallaPrincipal(currentUser, currentUserName);
                verificarNotificacionesPendientes();
            } else {
                showMessage('PIN incorrecto.', 'error');
                userPinInput.value = '';
            }
        }
    } catch (e) {
        document.getElementById('authSection').classList.remove('active');
        document.getElementById('mainApp').classList.add('active');
        configurarPantallaPrincipal(currentUser, currentUserName);
    }
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

let productosMapCache = {};

window.iniciarCuadre = async function() {
    document.getElementById('mainApp').classList.remove('active');
    document.getElementById('cuadreSection').classList.add('active');
    const container = document.getElementById('listaProductosContainer');
    container.innerHTML = '<p style="text-align: center; color: #fff;">Cargando inventario...</p>';

    const esYoandri = (currentUser === 'yoandri');

    try {
        const querySnapshot = await getDocs(collection(db, "productos"));
        productosMapCache = {};
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.nombre) productosMapCache[data.nombre.trim()] = data;
        });

        // BÚSQUEDA DEL INICIO AUTOMÁTICO
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
        } catch(err) {
            console.log("Error al buscar inicio automático:", err);
        }

        let html = '<table><tr><th>PRODUCTO</th><th>INICIO</th><th>ENTRADA</th><th>BAJA</th><th>FINAL</th><th>VENTA</th>';
        if (!esYoandri) html += '<th>PRECIO COMP</th>';
        html += '<th>PRECIO VNTA</th><th>TOTAL VNTA</th>';
        if (!esYoandri) html += '<th>GANANCIA U</th><th>GANANCIA T</th>';
        html += '</tr>';

        let indexContador = 0;
        let filaAlternada = false;

        ORDEN_MAESTRO.forEach((item) => {
            if (item.startsWith("***")) {
                html += `<tr style="background: #334155; font-weight: bold;"><td colspan="${esYoandri ? 8 : 11}" style="padding: 10px; color: #f8fafc; text-align: center;">${item}</td></tr>`;
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
                html += `<td><input type="number" class="input-cell input-inicio" value="${valorInicioPrevio}" readonly oninput="calcularFilaProducto(${idx}, ${p.precioVenta || 0}, ${p.precioCompra || 0})"></td>`;
            } else {
                html += `<td><input type="number" class="input-cell input-inicio" oninput="calcularFilaProducto(${idx}, ${p.precioVenta || 0}, ${p.precioCompra || 0})"></td>`;
            }

            html += `<td><input type="number" class="input-cell input-entrada" oninput="calcularFilaProducto(${idx}, ${p.precioVenta || 0}, ${p.precioCompra || 0})"></td>`;
            html += `<td><input type="number" class="input-cell input-baja" oninput="calcularFilaProducto(${idx}, ${p.precioVenta || 0}, ${p.precioCompra || 0})"></td>`;
            html += `<td><input type="number" class="input-cell input-final" oninput="calcularFilaProducto(${idx}, ${p.precioVenta || 0}, ${p.precioCompra || 0})"></td>`;
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

        // Recalcular los heredados automáticamente al cargar
        document.querySelectorAll('tr[data-index]').forEach(row => {
            const idx = row.dataset.index;
            const nom = row.dataset.nombre;
            const pr = productosMapCache[nom] || { precioVenta: 0, precioCompra: 0 };
            const inpInicio = row.querySelector('.input-inicio');
            if(inpInicio && inpInicio.readOnly && inpInicio.value !== "") {
                calcularFilaProducto(idx, pr.precioVenta, pr.precioCompra);
            }
        });

    } catch (e) { console.error(e); }
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
    let nombreTurno = (hora >= 6 && hora < 14) ? "Turno de Noche" : "Turno de Día"; // Nombre limpio

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
            alert("⚠️ Este cuadre ya fue guardado anteriormente.");
            if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.textContent = "Guardar Cuadre"; }
            return;
        }

        await addDoc(collection(db, "historial_cuadres"), datos);
        await addDoc(collection(db, "notificaciones"), { 
            leido: false, 
            msg: `Yoandri envió cuadre nuevo (${nombreTurno} - ${ahora.toLocaleDateString()})`, 
            time: serverTimestamp(),
            usuario: currentUserName,
            turno: nombreTurno
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

window.verNotificaciones = async function() {
    const modal = document.getElementById('modalNotificaciones');
    const container = document.getElementById('listaNotificacionesContainer');
    modal.style.display = 'flex';
    container.innerHTML = '<p style="color:#94A3B8; text-align:center;">Cargando...</p>';

    try {
        const q = query(collection(db, "notificaciones"), where("leido", "==", false));
        const snap = await getDocs(q);
        let html = '';
        
        snap.forEach(docSnap => {
            const n = docSnap.data();
            html += `<div onclick="abrirAtajoNotificacion('${docSnap.id}')" style="background:rgba(15,23,42,0.8); padding:12px; border-radius:10px; margin-bottom:10px; border-left:4px solid #10B981; cursor:pointer;">
                <p style="color:#F8FAFC; font-size:0.9rem; font-weight:bold; margin-bottom:4px;">🔔 ${n.msg}</p>
                <span style="color:#94A3B8; font-size:0.75rem;">Toca aquí para ver el cuadre y cerrar la alerta</span>
            </div>`;
        });
        container.innerHTML = html || '<p style="color:#94A3B8; text-align:center;">No hay notificaciones pendientes.</p>';
    } catch(e) {
        container.innerHTML = '<p style="color:#EF4444; text-align:center;">Error al cargar.</p>';
    }
}

window.abrirAtajoNotificacion = async function(notifId) {
    try {
        await deleteDoc(doc(db, "notificaciones", notifId));
        document.getElementById('modalNotificaciones').style.display = 'none';
        verificarNotificacionesPendientes();
        verHistorial();
    } catch(e) {
        alert("Error al procesar el atajo.");
    }
}

window.cerrarModalNotificaciones = function() {
    document.getElementById('modalNotificaciones').style.display = 'none';
}

window.verHistorial = async function() {
    document.getElementById('mainApp').classList.remove('active');
    document.getElementById('historialSection').classList.add('active');
    const container = document.getElementById('listaHistorialContainer');
    container.innerHTML = '<p style="text-align:center; color:#94A3B8;">Cargando historial...</p>';

    try {
        const querySnapshot = await getDocs(collection(db, "historial_cuadres"));
        let html = '';
        
        querySnapshot.forEach((docSnap) => {
            const h = docSnap.data();
            html += `<div onclick="verDetalleCuadre('${docSnap.id}')" style="background:rgba(30,41,59,0.7); border:1px solid rgba(255,255,255,0.1); padding:12px; border-radius:10px; margin-bottom:10px; cursor:pointer;">
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                    <strong style="color:#10B981;">${h.usuario}</strong>
                    <span style="color:#94A3B8; font-size:0.8rem;">${h.fecha || 'Sin fecha'}</span>
                </div>
                <p style="color:#F8FAFC; font-size:0.9rem;">Turno: ${h.turno}</p>
                <div style="display:flex; justify-content:space-between; margin-top:6px; font-size:0.85rem; color:#cbd5e1;">
                    <span>Venta: ${h.financiero?.ventaTotal}</span>
                    <span>Final: ${h.financiero?.totalFinal}</span>
                </div>
            </div>`;
        });
        container.innerHTML = html || '<p style="text-align:center; color:#94A3B8;">No hay cuadres guardados aún.</p>';
    } catch(e) {
        container.innerHTML = '<p style="text-align:center; color:#EF4444;">Error al cargar el historial.</p>';
    }
}

window.cerrarHistorial = function() {
    document.getElementById('historialSection').classList.remove('active');
    document.getElementById('mainApp').classList.add('active');
}

window.volverAlHistorial = function() {
    document.getElementById('detalleCuadreSection').classList.remove('active');
    document.getElementById('historialSection').classList.add('active');
}

window.verDetalleCuadre = async function(id) {
    document.getElementById('historialSection').classList.remove('active');
    document.getElementById('detalleCuadreSection').classList.add('active');
    const container = document.getElementById('detalleContenidoContainer');
    container.innerHTML = '<p style="text-align:center; color:#94A3B8; padding:20px;">Cargando detalle completo...</p>';

    const esYoandri = (currentUser === 'yoandri');

    try {
        const docRef = doc(db, "historial_cuadres", id);
        const docSnap = await getDoc(docRef);

        if(docSnap.exists()) {
            const h = docSnap.data();
            document.getElementById('detalleTituloTurno').innerText = `Turno: ${h.turno}`;
            document.getElementById('detalleSubInfo').innerText = `Responsable: ${h.usuario} (${h.fecha})`;

            // TABLA LIMPIA USANDO LAS CLASES DEL CSS
            let html = '<table>';
            html += '<tr>';
            html += '<th>PRODUCTO</th><th>INICIO</th><th>ENTRADA</th><th>BAJA</th><th>FINAL</th><th>VENTA</th>';
            if (!esYoandri) html += '<th>PRECIO COMP</th>';
            html += '<th>PRECIO VNTA</th><th>TOTAL VNTA</th>';
            if (!esYoandri) {
                html += '<th>GANANCIA U</th><th>GANANCIA T</th>';
            }
            html += '</tr>';

            if(h.productos && h.productos.length > 0) {
                let filaAlternada = false;
                h.productos.forEach(p => {
                    const filaClase = filaAlternada ? 'row-alt' : 'row-normal';
                    filaAlternada = !filaAlternada;

                    html += `<tr class="${filaClase}">`;
                    html += `<td>${p.nombre}</td>`;
                    html += `<td>${p.inicio}</td><td>${p.entrada}</td><td>${p.baja}</td><td>${p.final}</td><td style="font-weight:bold;">${p.venta}</td>`;
                    
                    if (!esYoandri) html += `<td>$${p.precioCompra || 0}</td>`;
                    html += `<td style="font-weight: bold;">$${p.precioVenta || 0}</td><td style="color:#059669; font-weight:bold;">$${p.totalVenta}</td>`;
                    
                    if (!esYoandri) {
                        html += `<td style="color:#047857;">$${p.gananciaU || 0}</td><td style="color:#047857; font-weight:bold;">$${p.gananciaT || 0}</td>`;
                    }
                    html += `</tr>`;
                });
            }
            html += '</table>';

            // DATOS FINANCIEROS
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

            // SECCIÓN 1: DATOS (Textos limpios)
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

            // SECCIÓN 2: CÁLCULOS
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

            // SECCIÓN 3: CONCLUSIONES
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

            html += `</div>`;

            container.innerHTML = html;
        }
    } catch(e) {
        container.innerHTML = '<p style="text-align:center; color:#EF4444; padding:20px;">Error al cargar el detalle.</p>';
    }
}

window.cancelarCuadre = function() {
    document.getElementById('cuadreSection').classList.remove('active');
    document.getElementById('mainApp').classList.add('active');
}

window.verAlmacen = function() { alert("Control de almacén en construcción."); }

window.selectUser = selectUser; window.goBack = goBack; window.logout = logout; window.verifyPin = verifyPin;
window.iniciarCuadre = iniciarCuadre; window.cancelarCuadre = cancelarCuadre;
