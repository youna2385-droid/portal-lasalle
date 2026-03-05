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

const usuariosValidos = {
    "jonathan": "Jona2004", "orlando": "Orla2000", "sebastian": "Seba2007",
    "moises": "Mois2000", "jhonatan": "Jhon2004", "boris": "Bori2005",
    "alejandro": "Alej1999", "victor": "Victor1985", "piter": "Pite1975"
};

const saludos = { 1:"Hno. Orlando/Boris", 2:"Hno. Jonathan", 3:"Hno. Jhonatan", 4:"Hno. Moises", 5:"Hno. Sebastian", 6:"Hno. Alejandro" };

let datos = { edas: [], nomina: [] };

// --- ACCIONES GLOBALES ---
window.validar = () => {
    const u = document.getElementById('user').value.toLowerCase().trim();
    const p = document.getElementById('pass').value.trim();
    if(usuariosValidos[u] === p) {
        sessionStorage.setItem('auth', 'true');
        sessionStorage.setItem('user', u);
        location.reload();
    } else document.getElementById('error').style.display='block';
};

window.ir = (n) => { localStorage.setItem('grado', n); window.location.href='grado.html'; };
window.cerrarSesion = () => { sessionStorage.clear(); window.location.href='index.html'; };

// --- NUBE ---
async function cargar() {
    const g = localStorage.getItem('grado') || "1";
    onSnapshot(doc(db, "grados", `g${g}`), (s) => {
        if(s.exists()) { datos = s.data(); renderTodo(); }
    });
}

async function guardar() {
    await setDoc(doc(db, "grados", `g${localStorage.getItem('grado')}`), datos);
}

// --- FUNCIONES DE GRADO ---
window.guardarNomina = () => {
    datos.nomina = document.getElementById('lista-nombres').value.split('\n').filter(n=>n.trim()!=="");
    guardar(); alert("Sincronizado");
};

window.nuevaEda = () => {
    const n = prompt("Nombre de la EDA:");
    if(n) { datos.edas.push({ nombre: n, sesiones: [] }); guardar(); }
};

window.nuevaSesion = (i) => {
    datos.edas[i].sesiones.push({ titulo: "Nueva Sesión", notas: {}, archivoUrl: "", archivoNombre: "" });
    guardar();
};

window.subirArchivo = async (eI, sI, input) => {
    const file = input.files[0];
    if(!file) return;
    const sRef = ref(storage, `g${localStorage.getItem('grado')}/${Date.now()}_${file.name}`);
    await uploadBytes(sRef, file);
    datos.edas[eI].sesiones[sI].archivoUrl = await getDownloadURL(sRef);
    datos.edas[eI].sesiones[sI].archivoNombre = file.name;
    guardar();
    alert("Archivo en la nube");
};

// --- RENDERIZADO ---
function renderTodo() {
    if(!document.getElementById('gradoTitle')) return;
    document.getElementById('gradoTitle').innerText = localStorage.getItem('grado')+"° Primaria";
    document.getElementById('txt-saludo').innerText = "Hola " + (saludos[localStorage.getItem('grado')] || "Docente");
    if(document.getElementById('lista-nombres')) document.getElementById('lista-nombres').value = datos.nomina.join('\n');
    
    const cont = document.getElementById('contenedor-sesiones-por-eda');
    if(cont) {
        cont.innerHTML = "";
        datos.edas.forEach((eda, eI) => {
            const d = document.createElement('div');
            d.innerHTML = `<h3>${eda.nombre}</h3><button class="btn-add" onclick="nuevaSesion(${eI})">+ Sesión</button>`;
            eda.sesiones.forEach((ses, sI) => {
                d.innerHTML += `
                <div class="card">
                    <input type="text" value="${ses.titulo}" onchange="actT(${eI},${sI},this.value)">
                    <input type="file" onchange="subirArchivo(${eI},${sI},this)">
                    ${ses.archivoUrl ? `<a href="${ses.archivoUrl}" target="_blank">👁️ Ver Documento</a>` : ''}
                </div>`;
            });
            cont.appendChild(d);
        });
    }
}

window.actT = (eI, sI, v) => { datos.edas[eI].sesiones[sI].titulo = v; guardar(); };

window.show = (id, btn) => {
    document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    btn.classList.add('active');
};

if(window.location.pathname.includes('grado.html')) cargar();
else if(sessionStorage.getItem('auth')) {
    document.getElementById('login-screen').style.display='none';
    document.getElementById('portal-content').style.display='block';
    document.getElementById('welcome-msg').innerText = "Bienvenido " + sessionStorage.getItem('user');
}