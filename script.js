import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyD6kxvJP0Gn7epSX6z6qSq6q5bgBWzigxI",
  authDomain: "portal-la-salle-2026.firebaseapp.com",
  projectId: "portal-la-salle-2026",
  storageBucket: "portal-la-salle-2026.firebasestorage.app",
  messagingSenderId: "128017197834",
  appId: "1:128017197834:web:203dde5879e339fa6328f3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

let datos = { edas: [], nomina: [], planAnual: {url: "", nombre: ""} };

// --- NAVEGACIÓN ---
window.cambiarPestana = (id, btn) => {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const target = document.getElementById(id);
    if(target) target.style.display = 'block';
    if(btn) btn.classList.add('active');
};

// --- AUTH & SALUDOS ---
const obtenerSaludo = (user) => {
    if (user === "victor") return "Hola Prof. Victor";
    return "Hola Hno. " + user.charAt(0).toUpperCase() + user.slice(1);
};

window.validar = () => {
    const u = document.getElementById('user').value.toLowerCase().trim();
    const p = document.getElementById('pass').value.trim();
    const users = {"jonathan":"Jona2004", "orlando":"Orla2000", "sebastian":"Seba2007", "moises":"Mois2000", "jhonatan":"Jhon2004", "boris":"Bori2005", "alejandro":"Alej1999", "victor":"Victor1985"};
    
    if(users[u] === p) {
        sessionStorage.setItem('auth', 'true');
        sessionStorage.setItem('user', u);
        location.reload();
    } else {
        document.getElementById('error').style.display = 'block';
    }
};

window.ir = (n) => { localStorage.setItem('grado', n); window.location.href='grado.html'; };
window.cerrarSesion = () => { sessionStorage.clear(); window.location.href='index.html'; };

// --- BASE DE DATOS (SIN SOBRESCRITURA POR ERROR) ---
async function cargar() {
    const g = localStorage.getItem('grado');
    if(!g) return;
    onSnapshot(doc(db, "grados", `g${g}`), (snap) => {
        if(snap.exists()) {
            datos = snap.data();
            renderTodo();
        } else {
            // Solo crea si el documento es totalmente nuevo
            setDoc(doc(db, "grados", `g${g}`), {edas:[], nomina:[], planAnual:{url:"", nombre:""}});
        }
    });
}

async function guardar() {
    const g = localStorage.getItem('grado');
    await setDoc(doc(db, "grados", `g${g}`), datos);
}

// --- FUNCIONES DOCENTES ---
window.guardarNomina = async () => {
    const areaTexto = document.getElementById('lista-nombres');
    if(areaTexto) {
        datos.nomina = areaTexto.value.split('\n').filter(n=>n.trim()!=="");
        await guardar();
        alert("Nómina guardada con éxito");
    }
};

window.subirPlan = async (input) => {
    const file = input.files[0];
    if(!file) return;
    const btn = input.previousElementSibling;
    if(btn) btn.innerText = "⏳ Subiendo...";

    try {
        const sRef = ref(storage, `g${localStorage.getItem('grado')}/plan_${Date.now()}_${file.name}`);
        await uploadBytes(sRef, file);
        const url = await getDownloadURL(sRef);
        datos.planAnual = { url: url, nombre: file.name };
        await guardar();
        alert("Plan Anual guardado en la nube");
    } catch (e) {
        alert("Error al subir archivo");
    }
};

window.nuevaEda = async () => {
    const n = prompt("Nombre de la EDA:");
    if(n) {
        if(!datos.edas) datos.edas = [];
        datos.edas.push({ nombre: n, sesiones: [] });
        await guardar();
    }
};

window.nuevaSesion = async (eI) => {
    if(!datos.edas[eI].sesiones) datos.edas[eI].sesiones = [];
    datos.edas[eI].sesiones.push({ titulo: "Nueva Sesión", archivoUrl: "", archivoNombre: "" });
    await guardar();
};

window.subirArchivoSesion = async (eI, sI, input) => {
    const file = input.files[0];
    if(!file) return;
    try {
        const sRef = ref(storage, `g${localStorage.getItem('grado')}/sesion_${Date.now()}_${file.name}`);
        await uploadBytes(sRef, file);
        datos.edas[eI].sesiones[sI].archivoUrl = await getDownloadURL(sRef);
        datos.edas[eI].sesiones[sI].archivoNombre = file.name;
        await guardar();
        alert("Sesión sincronizada");
    } catch (e) { alert("Error al subir"); }
};

// --- RENDERIZADO (CORREGIDO PARA NO REPETIR) ---
function renderTodo() {
    const g = localStorage.getItem('grado');
    const user = sessionStorage.getItem('user');
    if(!document.getElementById('gradoTitle')) return;

    document.getElementById('gradoTitle').innerText = `${g}° Primaria`;
    document.getElementById('userDisplay').innerText = `Usuario: ${user}`;
    document.getElementById('txt-saludo').innerText = obtenerSaludo(user);
    
    // Solo actualizar nómina si estamos en esa pestaña para evitar saltos de cursor
    const inputNomina = document.getElementById('lista-nombres');
    if(inputNomina && datos.nomina) {
        // Solo actualizamos si el usuario no está escribiendo actualmente
        if (document.activeElement !== inputNomina) {
            inputNomina.value = datos.nomina.join('\n');
        }
    }

    // Render Plan Anual
    const stPlan = document.getElementById('status-plan');
    if(datos.planAnual && datos.planAnual.url) {
        stPlan.innerHTML = `<div class="card-file">
            <span>✅ Archivo actual: <strong>${datos.planAnual.nombre}</strong></span>
            <br><br>
            <a href="${datos.planAnual.url}" target="_blank" class="btn-view">👁️ Abrir Plan Anual</a>
        </div>`;
    }

    // Render EDAs (Solo nombres)
    const cEdas = document.getElementById('contenedor-edas');
    cEdas.innerHTML = "";
    (datos.edas || []).forEach(eda => {
        cEdas.innerHTML += `<div class="card"><h3>📦 ${eda.nombre}</h3></div>`;
    });

    // Render Sesiones (Con archivos)
    const cSes = document.getElementById('contenedor-sesiones-por-eda');
    cSes.innerHTML = "";
    (datos.edas || []).forEach((eda, eI) => {
        const div = document.createElement('div');
        div.className = "eda-group";
        div.innerHTML = `<h3 class="eda-header">${eda.nombre}</h3><button class="btn-add" onclick="window.nuevaSesion(${eI})">+ Añadir Sesión</button>`;
        
        (eda.sesiones || []).forEach((ses, sI) => {
            const sCard = document.createElement('div');
            sCard.className = "card-sesion";
            sCard.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <span><strong>${ses.titulo}</strong></span>
                    <div class="actions">
                        <label class="btn-file">
                            <span>${ses.archivoNombre ? '📎 '+ses.archivoNombre : '📁 Subir'}</span>
                            <input type="file" style="display:none" onchange="window.subirArchivoSesion(${eI},${sI},this)">
                        </label>
                        ${ses.archivoUrl ? `<a href="${ses.archivoUrl}" target="_blank" class="link-view">👁️ Ver</a>` : ''}
                    </div>
                </div>`;
            div.appendChild(sCard);
        });
        cSes.appendChild(div);
    });
}

// ARRANQUE
window.onload = () => {
    if(window.location.pathname.includes('grado.html')) {
        if(!sessionStorage.getItem('auth')) window.location.href='index.html';
        cargar();
    } else {
        const portal = document.getElementById('portal-content');
        if(sessionStorage.getItem('auth') && portal) {
            document.getElementById('login-screen').style.display='none';
            portal.style.display='block';
            document.getElementById('welcome-msg').innerText = obtenerSaludo(sessionStorage.getItem('user'));
        }
    }
};