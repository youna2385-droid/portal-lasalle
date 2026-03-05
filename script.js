import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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

// --- CONECTAR FUNCIONES AL WINDOW (Para que los botones del HTML funcionen) ---
window.validar = () => {
    const u = document.getElementById('user').value.toLowerCase().trim();
    const p = document.getElementById('pass').value.trim();
    if(usuariosValidos[u] === p) {
        sessionStorage.setItem('auth', 'true');
        sessionStorage.setItem('user', u);
        location.reload();
    } else {
        document.getElementById('error').style.display='block';
    }
};

window.ir = (n) => {
    localStorage.setItem('grado', n);
    window.location.href = 'grado.html';
};

window.cerrarSesion = () => {
    sessionStorage.clear();
    window.location.href = 'index.html';
};

// --- CARGA DE DATOS ---
async function cargarDatos() {
    const g = localStorage.getItem('grado');
    if(!g) {
        window.location.href = 'index.html';
        return;
    }

    const docRef = doc(db, "grados", `g${g}`);
    
    // Escuchar cambios
    onSnapshot(docRef, (snap) => {
        if(snap.exists()) {
            datos = snap.data();
        } else {
            // Si el grado no existe en Firebase, creamos uno vacío
            datos = { edas: [], nomina: [] };
            setDoc(docRef, datos);
        }
        renderTodo();
    });
}

async function guardar() {
    const g = localStorage.getItem('grado');
    await setDoc(doc(db, "grados", `g${g}`), datos);
}

// --- ACCIONES DE DOCENTE ---
window.guardarNomina = async () => {
    const texto = document.getElementById('lista-nombres').value;
    datos.nomina = texto.split('\n').map(n => n.trim()).filter(n => n !== "");
    await guardar();
    alert("Lista de alumnos sincronizada");
};

window.nuevaEda = async () => {
    const n = prompt("Nombre de la nueva EDA:");
    if(n) {
        if(!datos.edas) datos.edas = [];
        datos.edas.push({ nombre: n, sesiones: [] });
        await guardar();
    }
};

window.nuevaSesion = async (edaIdx) => {
    if(!datos.edas[edaIdx].sesiones) datos.edas[edaIdx].sesiones = [];
    datos.edas[edaIdx].sesiones.push({
        titulo: "Nueva Sesión",
        archivoUrl: "",
        archivoNombre: "",
        notas: {}
    });
    await guardar();
};

window.subirArchivo = async (eI, sI, input) => {
    const file = input.files[0];
    if(!file) return;
    
    const label = input.parentElement.querySelector('span');
    label.innerText = "⏳ Subiendo...";

    const path = `g${localStorage.getItem('grado')}/${Date.now()}_${file.name}`;
    const sRef = ref(storage, path);
    
    try {
        await uploadBytes(sRef, file);
        const url = await getDownloadURL(sRef);
        datos.edas[eI].sesiones[sI].archivoUrl = url;
        datos.edas[eI].sesiones[sI].archivoNombre = file.name;
        await guardar();
        alert("Archivo guardado en la nube");
    } catch (e) {
        alert("Error al subir");
    }
};

function renderTodo() {
    const gTitle = document.getElementById('gradoTitle');
    if(!gTitle) return;

    const grado = localStorage.getItem('grado');
    gTitle.innerText = `${grado}° Primaria`;
    document.getElementById('userDisplay').innerText = sessionStorage.getItem('user');
    document.getElementById('txt-saludo').innerText = "Hola " + (saludos[grado] || "Docente");
    
    if(document.getElementById('lista-nombres')) {
        document.getElementById('lista-nombres').value = datos.nomina ? datos.nomina.join('\n') : "";
    }

    const cont = document.getElementById('contenedor-sesiones-por-eda');
    if(cont) {
        cont.innerHTML = "";
        (datos.edas || []).forEach((eda, eI) => {
            const divEda = document.createElement('div');
            divEda.className = "eda-section";
            divEda.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; background:#e9ecef; padding:10px; border-radius:8px; margin-top:20px;">
                    <h3 style="margin:0">${eda.nombre}</h3>
                    <button class="btn-add" onclick="nuevaSesion(${eI})">+ Añadir Sesión</button>
                </div>
                <div id="sesiones-eda-${eI}"></div>
            `;
            cont.appendChild(divEda);

            const sesCont = divEda.querySelector(`#sesiones-eda-${eI}`);
            (eda.sesiones || []).forEach((ses, sI) => {
                const sCard = document.createElement('div');
                sCard.className = "card";
                sCard.style.margin = "10px 0";
                sCard.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <input type="text" value="${ses.titulo}" onchange="actT(${eI},${sI},this.value)" style="border:none; font-weight:bold; font-size:1.1rem; width:50%">
                        <div>
                            <label class="btn-add" style="background:#6c757d; font-size:0.8rem">
                                <span>${ses.archivoNombre ? '📎 '+ses.archivoNombre : '📁 Subir Archivo'}</span>
                                <input type="file" style="display:none" onchange="subirArchivo(${eI},${sI},this)">
                            </label>
                            ${ses.archivoUrl ? `<a href="${ses.archivoUrl}" target="_blank" style="margin-left:10px">👁️ Ver</a>` : ''}
                        </div>
                    </div>
                `;
                sesCont.appendChild(sCard);
            });
        });
    }
}

window.actT = (eI, sI, v) => {
    datos.edas[eI].sesiones[sI].titulo = v;
    guardar();
};

window.show = (id, btn) => {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    btn.classList.add('active');
};

// --- INICIALIZACIÓN ---
window.onload = () => {
    if(window.location.pathname.includes('grado.html')) {
        if(!sessionStorage.getItem('auth')) window.location.href = 'index.html';
        cargarDatos();
    } else {
        if(sessionStorage.getItem('auth')) {
            document.getElementById('login-screen').style.display='none';
            document.getElementById('portal-content').style.display='block';
            document.getElementById('welcome-msg').innerText = "Bienvenido " + sessionStorage.getItem('user');
        }
    }
};