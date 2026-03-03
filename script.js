const usuariosValidos = {
    "jonathan": "Jona2004", "orlando": "Orla2000", "sebastian": "Seba2007",
    "moises": "Mois2000", "jhonatan": "Jhon2004", "boris": "Bori2005",
    "alejandro": "Alej1999", "victor": "Victor1985", "piter": "Pite1975"
};

const saludosGrados = {
    1: "Hola Hno. Orlando y Hno. Boris", 2: "Hola Hno. Jonathan Añez",
    3: "Hola Hno. Jhonatan Pinto", 4: "Hola Hno. Moises",
    5: "Hola Hno. Sebastian", 6: "Hola Hno. Alejandro"
};

function validar() {
    const u = document.getElementById('user').value.toLowerCase().trim();
    const p = document.getElementById('pass').value.trim();
    if (usuariosValidos[u] && usuariosValidos[u] === p) {
        sessionStorage.setItem('auth', 'true');
        let titulo = (u === "victor") ? "Profe Victor" : "Hno. " + u.charAt(0).toUpperCase() + u.slice(1);
        sessionStorage.setItem('displayUser', titulo);
        checkLoginState();
    } else { document.getElementById('error').style.display = 'block'; }
}

function checkLoginState() {
    if (sessionStorage.getItem('auth') === 'true' && document.getElementById('login-screen')) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('portal-content').style.display = 'block';
        document.getElementById('welcome-msg').innerText = "Bienvenido, " + sessionStorage.getItem('displayUser');
    }
}

function ir(n) {
    localStorage.setItem('gradoActual', n);
    localStorage.setItem('saludoGrado', saludosGrados[n] || "");
    window.location.href = 'grado.html';
}

function cerrarSesion() { sessionStorage.clear(); window.location.href = 'index.html'; }

window.onload = () => { if(document.getElementById('login-screen')) checkLoginState(); };

if (window.location.pathname.includes('grado.html')) {
    if (sessionStorage.getItem('auth') !== 'true') window.location.href = 'index.html';
    const grado = localStorage.getItem('gradoActual') || "1";
    let db = JSON.parse(localStorage.getItem(`db_lasalle_g${grado}`)) || { edas: [], nomina: [], planes: [] };
    document.getElementById('gradoTitle').innerText = grado + "° Primaria";
    document.getElementById('userDisplay').innerText = sessionStorage.getItem('displayUser');
    document.getElementById('txt-saludo').innerText = localStorage.getItem('saludoGrado');
    if(document.getElementById('lista-nombres')) document.getElementById('lista-nombres').value = db.nomina.join('\n');
    renderEdas();
}

function show(id, btn) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    btn.classList.add('active');
    if(id === 'sesiones') renderSesionesUI();
}

function guardarNomina() {
    const g = localStorage.getItem('gradoActual');
    let db = JSON.parse(localStorage.getItem(`db_lasalle_g${g}`)) || { edas: [], nomina: [], planes: [] };
    db.nomina = document.getElementById('lista-nombres').value.split('\n').map(n => n.trim()).filter(n => n !== "");
    localStorage.setItem(`db_lasalle_g${g}`, JSON.stringify(db));
    alert("Nómina guardada localmente.");
}

function exportarDatos() {
    const g = localStorage.getItem('gradoActual');
    const db = localStorage.getItem(`db_lasalle_g${g}`);
    const blob = new Blob([db], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LaSalle_Grado${g}_Respaldo.json`;
    a.click();
}

function importarDatos(input) {
    const reader = new FileReader();
    reader.onload = function() {
        const g = localStorage.getItem('gradoActual');
        localStorage.setItem(`db_lasalle_g${g}`, reader.result);
        location.reload();
    };
    reader.readAsText(input.files[0]);
}

function nuevaEda() {
    const g = localStorage.getItem('gradoActual');
    let db = JSON.parse(localStorage.getItem(`db_lasalle_g${g}`));
    const n = prompt("Nombre de la EDA:");
    if(n) { db.edas.push({ id: Date.now(), nombre: n, sesiones: [] }); localStorage.setItem(`db_lasalle_g${g}`, JSON.stringify(db)); renderEdas(); }
}

function renderEdas() {
    const cont = document.getElementById('contenedor-edas');
    if(!cont) return;
    const g = localStorage.getItem('gradoActual');
    let db = JSON.parse(localStorage.getItem(`db_lasalle_g${g}`));
    cont.innerHTML = "";
    db.edas.forEach((eda, i) => {
        cont.innerHTML += `<div class="card" style="display:flex; justify-content:space-between"><h3>${eda.nombre}</h3><button style="color:red; border:none; background:none; cursor:pointer;" onclick="borrarEda(${i})">Eliminar</button></div>`;
    });
}

function borrarEda(i) {
    const g = localStorage.getItem('gradoActual');
    let db = JSON.parse(localStorage.getItem(`db_lasalle_g${g}`));
    db.edas.splice(i, 1);
    localStorage.setItem(`db_lasalle_g${g}`, JSON.stringify(db));
    renderEdas();
}

function renderSesionesUI() {
    const cont = document.getElementById('contenedor-sesiones-por-eda');
    const g = localStorage.getItem('gradoActual');
    let db = JSON.parse(localStorage.getItem(`db_lasalle_g${g}`));
    cont.innerHTML = "";
    db.edas.forEach((eda, eI) => {
        const d = document.createElement('div');
        d.innerHTML = `<h2 style="color:var(--primary-blue)">${eda.nombre}</h2><button class="btn-add" onclick="nuevaSesion(${eI})">+ Sesión</button><div id="ses-lista-${eI}"></div>`;
        cont.appendChild(d);
        renderListaSesiones(eI);
    });
}

function nuevaSesion(eI) {
    const g = localStorage.getItem('gradoActual');
    let db = JSON.parse(localStorage.getItem(`db_lasalle_g${g}`));
    db.edas[eI].sesiones.push({ id: Date.now(), titulo: "Nueva Sesión", tipo: "rubrica", criterios: ["Criterio 1"], notas: {}, doc: "" });
    localStorage.setItem(`db_lasalle_g${g}`, JSON.stringify(db));
    renderListaSesiones(eI);
}

function renderListaSesiones(eI) {
    const cont = document.getElementById(`ses-lista-${eI}`);
    const g = localStorage.getItem('gradoActual');
    let db = JSON.parse(localStorage.getItem(`db_lasalle_g${g}`));
    cont.innerHTML = "";
    db.edas[eI].sesiones.forEach((ses, sI) => {
        const c = document.createElement('div');
        c.className = "card";
        c.innerHTML = `
            <div style="display:flex; gap:10px; margin-bottom:10px;">
                <input type="text" value="${ses.titulo}" onchange="actT(${eI},${sI},this.value)">
                <select onchange="actType(${eI},${sI},this.value)"><option value="rubrica" ${ses.tipo=='rubrica'?'selected':''}>Rúbrica</option><option value="cotejo" ${ses.tipo=='cotejo'?'selected':''}>Cotejo</option></select>
            </div>
            <table>
                <thead><tr><th>Alumno</th>${ses.criterios.map(cr => `<th>${cr}</th>`).join('')}<th>Logro</th></tr></thead>
                <tbody>${db.nomina.map(nom => `<tr><td>${nom}</td>${ses.criterios.map((_, cI) => `<td>${getCtrl(eI, sI, nom, cI, db)}</td>`).join('')}<td id="res-${eI}-${sI}-${nom.replace(/\s/g,'')}">-</td></tr>`).join('')}</tbody>
            </table><button onclick="addCr(${eI},${sI})">+ Criterio</button>`;
        cont.appendChild(c);
        db.nomina.forEach(nom => calcN(eI, sI, nom, db));
    });
}

function getCtrl(eI, sI, nom, cI, db) {
    const s = db.edas[eI].sesiones[sI];
    const v = (s.notas[nom] && s.notas[nom][cI]) ? s.notas[nom][cI] : (s.tipo === 'rubrica' ? 'A' : 'NO');
    if(s.tipo === 'rubrica') return `<select onchange="uN(${eI},${sI},'${nom}',${cI},this.value)">${['AD','A','B','C'].map(o => `<option ${v==o?'selected':''}>${o}</option>`).join('')}</select>`;
    return `<input type="checkbox" ${v=='SI'?'checked':''} onchange="uN(${eI},${sI},'${nom}',${cI},this.checked?'SI':'NO')">`;
}

function uN(eI, sI, nom, cI, val) {
    const g = localStorage.getItem('gradoActual');
    let db = JSON.parse(localStorage.getItem(`db_lasalle_g${g}`));
    if(!db.edas[eI].sesiones[sI].notas[nom]) db.edas[eI].sesiones[sI].notas[nom] = [];
    db.edas[eI].sesiones[sI].notas[nom][cI] = val;
    localStorage.setItem(`db_lasalle_g${g}`, JSON.stringify(db));
    calcN(eI, sI, nom, db);
}

const pes = { 'AD': 4, 'A': 3, 'B': 2, 'C': 1 };
const rev = { 4: 'AD', 3: 'A', 2: 'B', 1: 'C' };

function calcN(eI, sI, nom, db) {
    const s = db.edas[eI].sesiones[sI];
    const n = s.notas[nom] || [];
    const r = document.getElementById(`res-${eI}-${sI}-${nom.replace(/\s/g,'')}`);
    if(!r) return;
    if(s.tipo === 'rubrica') {
        let sum = 0; n.forEach(v => sum += pes[v || 'A']);
        r.innerText = rev[Math.round(sum / s.criterios.length)] || 'A';
    } else {
        r.innerText = n.filter(v => v === 'SI').length + "/" + s.criterios.length;
    }
}

function renderRegistroFinal() {
    const g = localStorage.getItem('gradoActual');
    let db = JSON.parse(localStorage.getItem(`db_lasalle_g${g}`));
    const h = document.getElementById('head-final');
    const b = document.getElementById('body-final');
    h.innerHTML = "<th>Estudiante</th>";
    db.edas.forEach(eda => {
        eda.sesiones.forEach(ses => h.innerHTML += `<th>${ses.titulo}</th>`);
        h.innerHTML += `<th style="background:var(--accent-gold)">Prom. ${eda.nombre}</th>`;
    });
    b.innerHTML = "";
    db.nomina.forEach(nom => {
        let row = `<tr><td>${nom}</td>`;
        db.edas.forEach(eda => {
            let sumE = 0;
            eda.sesiones.forEach(ses => {
                let s = 0; (ses.notas[nom] || []).forEach(v => s += pes[v || 'A']);
                let f = Math.round(s / (ses.criterios.length || 1)) || 3;
                row += `<td>${rev[f]}</td>`; sumE += f;
            });
            row += `<td style="font-weight:bold">${rev[Math.round(sumE / (eda.sesiones.length || 1))] || '--'}</td>`;
        });
        b.innerHTML += row + "</tr>";
    });
}

function actT(eI, sI, v) { let db = JSON.parse(localStorage.getItem(`db_lasalle_g${localStorage.getItem('gradoActual')}`)); db.edas[eI].sesiones[sI].titulo = v; localStorage.setItem(`db_lasalle_g${localStorage.getItem('gradoActual')}`, JSON.stringify(db)); }
function actType(eI, sI, v) { let db = JSON.parse(localStorage.getItem(`db_lasalle_g${localStorage.getItem('gradoActual')}`)); db.edas[eI].sesiones[sI].tipo = v; localStorage.setItem(`db_lasalle_g${localStorage.getItem('gradoActual')}`, JSON.stringify(db)); renderListaSesiones(eI); }
function addCr(eI, sI) { let db = JSON.parse(localStorage.getItem(`db_lasalle_g${localStorage.getItem('gradoActual')}`)); db.edas[eI].sesiones[sI].criterios.push("Criterio"); localStorage.setItem(`db_lasalle_g${localStorage.getItem('gradoActual')}`, JSON.stringify(db)); renderListaSesiones(eI); }