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

// --- NAVEGACIÓN (FORZADA GLOBAL) ---
window.cambiarPestana = (id, btn) => {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
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
    const g = localStorage.getItem('grado');
    if(!g) return;
    onSnapshot(doc(db, "grados", `g${g}`), (snap) => {
        if(snap.exists()) {
            datos = snap.data();
            renderTodo();
        } else {
            setDoc(doc(db, "grados", `g${g}`), {edas:[], nomina:[]});
        }
    });
}

async function guardar() {
    await setDoc(doc(db, "grados", `g${localStorage.getItem('grado')}`), datos);
}

// --- FUNCIONES DOCENTES ---
window.guardarNomina = async () => {
    datos.nomina = document.getElementById('lista-nombres').value.split('\n').filter(n=>n.trim()!=="");
    await guardar();
    alert("Sincronizado con la nube");
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

window.subirPlan = async (input) => {
    const file = input.files[0];
    if(!file) return;
    const sRef = ref(storage, `g${localStorage.getItem('grado')}/plan_${Date.now()}`);
    await uploadBytes(sRef, file);
    datos.planAnual = { url: await getDownloadURL(sRef), nombre: file.name };
    await guardar();
    alert("Plan Anual subido");
};

window.subirArchivoSesion = async (eI, sI, input) => {
    const file = input.files[0];
    if(!file) return;
    const sRef = ref(storage, `g${localStorage.getItem('grado')}/sesion_${Date.now()}`);
    await uploadBytes(sRef, file);
    datos.edas[eI].sesiones[sI].archivoUrl = await getDownloadURL(sRef);
    datos.edas[eI].sesiones[sI].archivoNombre = file.name;
    await guardar();
    alert("Archivo guardado");
};

function renderTodo() {
    const g = localStorage.getItem('grado');
    if(!document.getElementById('gradoTitle')) return;

    document.getElementById('gradoTitle').innerText = `${g}° Primaria`;
    document.getElementById('userDisplay').innerText = `Sesión: ${sessionStorage.getItem('user')}`;
    document.getElementById('txt-saludo').innerText = `Panel de Gestión del Grado ${g}`;
    
    if(document.getElementById('lista-nombres')) 
        document.getElementById('lista-nombres').value = (datos.nomina || []).join('\n');

    // Render Plan Anual
    const stPlan = document.getElementById('status-plan');
    if(datos.planAnual && datos.planAnual.url) {
        stPlan.innerHTML = `<a href="${datos.planAnual.url}" target="_blank" style="color:blue; font-weight:bold;">📄 Ver Plan Anual: ${datos.planAnual.nombre}</a>`;
    }

    // Render EDAs
    const cEdas = document.getElementById('contenedor-edas');
    cEdas.innerHTML = "";
    (datos.edas || []).forEach(eda => {
        cEdas.innerHTML += `<div class="card"><h3>${eda.nombre}</h3></div>`;
    });

    // Render Sesiones
    const cSes = document.getElementById('contenedor-sesiones-por-eda');
    cSes.innerHTML = "";
    (datos.edas || []).forEach((eda, eI) => {
        const div = document.createElement('div');
        div.innerHTML = `<h3>EDA: ${eda.nombre}</h3><button class="btn-add" onclick="window.nuevaSesion(${eI})">+ Sesión</button>`;
        (eda.sesiones || []).forEach((ses, sI) => {
            div.innerHTML += `
                <div class="card" style="margin-top:10px; display:flex; justify-content:space-between;">
                    <span>${ses.titulo}</span>
                    <div>
                        <input type="file" style="font-size:0.7rem;" onchange="window.subirArchivoSesion(${eI},${sI},this)">
                        ${ses.archivoUrl ? `<a href="${ses.archivoUrl}" target="_blank">👁️ Ver</a>` : ''}
                    </div>
                </div>`;
        });
        cSes.appendChild(div);
    });
}

// ARRANQUE
if(window.location.pathname.includes('grado.html')) {
    if(!sessionStorage.getItem('auth')) window.location.href='index.html';
    cargar();
} else {
    if(sessionStorage.getItem('auth')) {
        document.getElementById('login-screen').style.display='none';
        document.getElementById('portal-content').style.display='block';
        document.getElementById('welcome-msg').innerText = "Hola " + sessionStorage.getItem('user');
    }
}