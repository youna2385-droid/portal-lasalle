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

const saludosGrados = {
    1: "Hola Hno. Orlando y Hno. Boris", 2: "Hola Hno. Jonathan Añez",
    3: "Hola Hno. Jhonatan Pinto", 4: "Hola Hno. Moises",
    5: "Hola Hno. Sebastian", 6: "Hola Hno. Alejandro"
};

let datos = { edas: [], nomina: [], planAnual: {url: "", nombre: ""} };

// --- NAVEGACIÓN ---
window.cambiarPestana = (id, btn) => {
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).style.display = 'block';
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
    } else document.getElementById('error').style.display='block';
};

window.ir = (n) => { localStorage.setItem('grado', n); window.location.href='grado.html'; };
window.cerrarSesion = () => { sessionStorage.clear(); window.location.href='index.html'; };

// --- DATOS ---
async function cargar() {
    const g = localStorage.getItem('grado');
    if(!g) return;
    onSnapshot(doc(db, "grados", `g${g}`), (snap) => {
        if(snap.exists()) {
            datos = snap.data();
            renderTodo();
        } else {
            setDoc(doc(db, "grados", `g${g}`), {edas:[], nomina:[], planAnual:{url:"", nombre:""}});
        }
    });
}

async function guardar() {
    await setDoc(doc(db, "grados", `g${localStorage.getItem('grado')}`), datos);
}

// --- ACCIONES ---
window.guardarNomina = async () => {
    datos.nomina = document.getElementById('lista-nombres').value.split('\n').filter(n=>n.trim()!=="");
    await guardar(); alert("Nómina guardada");
};

window.subirPlan = async (input) => {
    const file = input.files[0];
    if(!file) return;
    const sRef = ref(storage, `g${localStorage.getItem('grado')}/plan_${Date.now()}`);
    await uploadBytes(sRef, file);
    datos.planAnual = { url: await getDownloadURL(sRef), nombre: file.name };
    await guardar(); alert("Plan subido");
};

window.nuevaEda = async () => {
    const n = prompt("Nombre de la EDA:");
    if(n) { datos.edas.push({ nombre: n, sesiones: [] }); await guardar(); }
};

window.nuevaSesion = async (eI) => {
    if(!datos.edas[eI].sesiones) datos.edas[eI].sesiones = [];
    datos.edas[eI].sesiones.push({ titulo: "Nueva Sesión", archivoUrl: "", archivoNombre: "" });
    await guardar();
};

window.subirArchivoSesion = async (eI, sI, input) => {
    const file = input.files[0];
    if(!file) return;
    const sRef = ref(storage, `g${localStorage.getItem('grado')}/sesion_${Date.now()}`);
    await uploadBytes(sRef, file);
    datos.edas[eI].sesiones[sI].archivoUrl = await getDownloadURL(sRef);
    datos.edas[eI].sesiones[sI].archivoNombre = file.name;
    await guardar();
};

function renderTodo() {
    const g = localStorage.getItem('grado');
    const user = sessionStorage.getItem('user');
    if(!document.getElementById('gradoTitle')) return;

    document.getElementById('gradoTitle').innerText = `${g}° Primaria`;
    document.getElementById('txt-saludo').innerText = (user === "victor") ? "Hola Prof. Victor" : (saludosGrados[g] || "Hola");
    document.getElementById('userDisplay').innerText = "Sesión: " + user;

    // Nómina (solo en su pestaña)
    const txtNom = document.getElementById('lista-nombres');
    if(txtNom && document.activeElement !== txtNom) txtNom.value = (datos.nomina || []).join('\n');

    // Plan Anual
    const stPlan = document.getElementById('status-plan');
    if(datos.planAnual && datos.planAnual.url) {
        stPlan.innerHTML = `<a href="${datos.planAnual.url}" target="_blank" style="color:blue; font-weight:bold;">📄 Ver: ${datos.planAnual.nombre}</a>`;
    }

    // Sesiones
    const cSes = document.getElementById('contenedor-sesiones-por-eda');
    cSes.innerHTML = "";
    (datos.edas || []).forEach((eda, eI) => {
        const d = document.createElement('div');
        d.innerHTML = `<h3 style="background:var(--blue); color:white; padding:10px; border-radius:5px; margin-top:20px;">${eda.nombre}</h3>
                       <button class="btn-add" onclick="window.nuevaSesion(${eI})">+ Añadir Sesión</button>`;
        (eda.sesiones || []).forEach((ses, sI) => {
            d.innerHTML += `<div class="card" style="display:flex; justify-content:space-between; margin-top:10px;">
                <span>${ses.titulo}</span>
                <div>
                    <input type="file" style="font-size:0.7rem" onchange="window.subirArchivoSesion(${eI},${sI},this)">
                    ${ses.archivoUrl ? `<a href="${ses.archivoUrl}" target="_blank">👁️</a>` : ''}
                </div>
            </div>`;
        });
        cSes.appendChild(d);
    });
}

window.onload = () => {
    if(window.location.pathname.includes('grado.html')) cargar();
    else if(sessionStorage.getItem('auth')) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('portal-content').style.display = 'block';
        const user = sessionStorage.getItem('user');
        document.getElementById('welcome-msg').innerText = (user === "victor") ? "Hola Prof. Victor" : "Bienvenido Hno. " + user;
    }
};