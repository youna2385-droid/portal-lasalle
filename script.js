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

// --- CONFIGURACIÓN DE SALUDOS PERSONALIZADOS POR GRADO ---
const saludosGrados = {
    1: "Hola Hno. Orlando y Hno. Boris", 
    2: "Hola Hno. Jonathan Añez",
    3: "Hola Hno. Jhonatan Pinto", 
    4: "Hola Hno. Moises",
    5: "Hola Hno. Sebastian", 
    6: "Hola Hno. Alejandro"
};

let datos = { edas: [], nomina: [], planAnual: {url: "", nombre: ""} };

// --- NAVEGACIÓN (FORZADA GLOBAL) ---
window.cambiarPestana = (id, btn) => {
    // Ocultar todas las secciones
    const secciones = ['config', 'plan', 'edas', 'sesiones'];
    secciones.forEach(s => {
        const el = document.getElementById(s);
        if(el) el.style.display = 'none';
    });
    // Quitar active de botones
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    // Mostrar la elegida
    const target = document.getElementById(id);
    if(target) target.style.display = 'block';
    if(btn) btn.classList.add('active');
};

// --- AUTH ---
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

// --- BASE DE DATOS ---
async function cargar() {
    const g = localStorage.getItem('grado') || "1";
    // Escuchar cambios en tiempo real
    onSnapshot(doc(db, "grados", `g${g}`), (snap) => {
        if(snap.exists()) {
            datos = snap.data();
            // Asegurar estructuras básicas
            if(!datos.edas) datos.edas = [];
            if(!datos.nomina) datos.nomina = [];
            if(!datos.planAnual) datos.planAnual = {url:"", nombre:""};
            renderTodo();
        } else {
            // Si no existe, crear documento inicial
            datos = { edas: [], nomina: [], planAnual: {url: "", nombre: ""} };
            guardar();
        }
    });
}

async function guardar() {
    const g = localStorage.getItem('grado');
    await setDoc(doc(db, "grados", `g${g}`), datos);
}

// --- FUNCIONES DOCENTES ---
window.guardarNomina = async () => {
    const txt = document.getElementById('lista-nombres');
    if(txt) {
        datos.nomina = txt.value.split('\n').filter(n=>n.trim()!=="");
        await guardar();
        alert("Nómina sincronizada en la nube.");
    }
};

window.subirPlan = async (input) => {
    const file = input.files[0];
    if(!file) return;
    // Ruta en Storage: gradoX/plan_fecha_nombre
    const sRef = ref(storage, `g${localStorage.getItem('grado')}/plan_${Date.now()}_${file.name}`);
    
    try {
        await uploadBytes(sRef, file);
        datos.planAnual = {
            url: await getDownloadURL(sRef),
            nombre: file.name
        };
        await guardar();
        alert("Plan Anual subido y guardado en la nube.");
    } catch (error) {
        alert("Error al subir el archivo.");
    }
};

window.nuevaEda = async () => {
    const n = prompt("Nombre de la EDA:");
    if(n) {
        datos.edas.push({ id: Date.now(), nombre: n, sesiones: [] });
        await guardar();
    }
};

window.nuevaSesion = async (eI) => {
    if(!datos.edas[eI].sesiones) datos.edas[eI].sesiones = [];
    datos.edas[eI].sesiones.push({
        titulo: "Nueva Sesión",
        archivoUrl: "",
        archivoNombre: "",
        notas: {} // Para futuras notas AD, A, B, C
    });
    await guardar();
};

window.subirArchivoSesion = async (eI, sI, input) => {
    const file = input.files[0];
    if(!file) return;
    const sRef = ref(storage, `g${localStorage.getItem('grado')}/sesion_${Date.now()}_${file.name}`);
    
    try {
        await uploadBytes(sRef, file);
        datos.edas[eI].sesiones[sI].archivoUrl = await getDownloadURL(sRef);
        datos.edas[eI].sesiones[sI].archivoNombre = file.name;
        await guardar();
        alert("Archivo de sesión guardado.");
    } catch (error) {
        alert("Error al subir.");
    }
};

// --- RENDERIZADO ---
function renderTodo() {
    const g = localStorage.getItem('grado');
    const user = sessionStorage.getItem('user');
    if(!document.getElementById('gradoTitle')) return;

    document.getElementById('gradoTitle').innerText = `${g}° Primaria`;
    document.getElementById('userDisplay').innerText = `Sesión: ${user}`;
    
    // Saludo Lógica: Victor es Prof, los demás según el grado
    let saludoFinal = (user === "victor") ? "Hola Prof. Victor" : (saludosGrados[g] || "Hola Docente");
    document.getElementById('txt-saludo').innerText = saludoFinal;
    
    // Nómina (Solo actualizar si el usuario no está escribiendo)
    const txtNom = document.getElementById('lista-nombres');
    if(txtNom && document.activeElement !== txtNom) {
        txtNom.value = (datos.nomina || []).join('\n');
    }

    // Render Plan Anual (Persistente)
    const stPlan = document.getElementById('status-plan');
    if(datos.planAnual && datos.planAnual.url) {
        stPlan.innerHTML = `<a href="${datos.planAnual.url}" target="_blank" style="color:blue; font-weight:bold;">📄 Ver Plan Anual: ${datos.planAnual.nombre}</a>`;
    } else {
        stPlan.innerHTML = `<span style="color:red">No hay plan subido.</span>`;
    }

    // Render EDAs
    const cEdas = document.getElementById('contenedor-edas');
    cEdas.innerHTML = "";
    (datos.edas || []).forEach(eda => {
        cEdas.innerHTML += `<div class="card"><h3>📦 ${eda.nombre}</h3></div>`;
    });

    // Render Sesiones
    const cSes = document.getElementById('contenedor-sesiones-por-eda');
    cSes.innerHTML = "";
    (datos.edas || []).forEach((eda, eI) => {
        const div = document.createElement('div');
        div.className = "eda-group";
        div.innerHTML = `<h3 style="color:var(--blue); border-bottom:2px solid var(--gold); padding-bottom:10px;">EDA: ${eda.nombre}</h3>
                         <button class="btn-add" onclick="window.nuevaSesion(${eI})">+ Sesión</button>`;
        
        (eda.sesiones || []).forEach((ses, sI) => {
            const sCard = document.createElement('div');
            sCard.className = "card";
            sCard.style.marginTop = "10px";
            sCard.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong>${ses.titulo}</strong>
                    <div>
                        <input type="file" style="font-size:0.7rem;" onchange="window.subirArchivoSesion(${eI},${sI},this)">
                        ${ses.archivoUrl ? `<a href="${ses.archivoUrl}" target="_blank" style="margin-left:10px;">👁️ Ver</a>` : ''}
                    </div>
                </div>`;
            div.appendChild(sCard);
        });
        cSes.appendChild(div);
    });
}

// INICIO AUTOMÁTICO
if(window.location.pathname.includes('grado.html')) {
    // Verificar autenticación
    if(sessionStorage.getItem('auth') !== 'true') {
        window.location.href = 'index.html';
    } else {
        cargar();
    }
} else {
    // Lógica para index.html
    const login = document.getElementById('login-screen');
    const portal = document.getElementById('portal-content');
    if(sessionStorage.getItem('auth') === 'true' && portal) {
        login.style.display = 'none';
        portal.style.display = 'block';
        const user = sessionStorage.getItem('user');
        // Saludo en el selector de grados
        document.getElementById('welcome-msg').innerText = (user === "victor") ? "Hola Prof. Victor" : "Bienvenido Hno. " + user.charAt(0).toUpperCase() + user.slice(1);
    }
}