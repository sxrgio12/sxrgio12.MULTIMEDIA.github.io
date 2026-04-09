let totalPreguntasTotales = 0;
let preguntasOriginales = [];
let preguntas = [];
let falladas = [];
let index = 0;
let repeticionesFallos = {};
let aciertos = 0;
let totalRespondidas = 0;
function escaparHTML(texto) {
    return texto
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function normalizar(texto) {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")  // Elimina acentos
        .replace(/\n/g, "")              // Reemplaza saltos de línea con espacios
        .replace(/\s+/g, " ")             // Colapsa múltiples espacios en uno solo
        .trim();                          // Elimina espacios al inicio/final
}

/**
 * Valida si una respuesta es correcta para una pregunta dada.
 * @param {string} respuestaUsuario - Respuesta proporcionada por el usuario.
 * @param {string} respuestaCorrecta - Respuesta correcta de la pregunta.
 * @returns {boolean} - `true` si la respuesta es correcta, `false` en caso contrario.
 */
function esRespuestaCorrecta(respuestaUsuario, pregunta) {
    const opcionCorrecta = pregunta.opciones[pregunta.respuesta_correcta_index];
    return respuestaUsuario === opcionCorrecta;
}

function renderQuestionList() {
    const cont = document.getElementById('question-list');
    cont.innerHTML = preguntasOriginales.map((p, i) => {
        const opciones = p.opciones.map((op, opIndex) =>
            `<li class="${opIndex === p.respuesta_correcta_index ? 'correct' : ''}">${op}</li>`
        ).join('');

        return `
<div class="question-item" data-text="${normalizar(escaparHTML(p.pregunta) + ' ' + p.opciones.join(' ') + ' ' + p.respuesta)}">
<h3>${i + 1}. ${p.pregunta}</h3>
<ul>${opciones}</ul>
</div>
`;
    }).join('');
}

function mezclar(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function actualizarEstadisticas() {
    const porcentaje = totalRespondidas > 0 ? Math.round((aciertos / totalRespondidas) * 100) : 0;
    document.getElementById("estadisticas").innerText =
        `✅ Aciertos: ${aciertos} | ❌ Fallos: ${totalRespondidas - aciertos} | 🎯 Porcentaje: ${porcentaje}% | 📋 Total: ${totalPreguntasTotales} preguntas`;
}

function guardarProgreso() {
    const estado = {
        preguntas,
        falladas,
        index,
        repeticionesFallos,
        aciertos,
        totalRespondidas
    };
    localStorage.setItem("testSQL", JSON.stringify(estado));
}

function cargarProgreso() {
    const guardado = localStorage.getItem("testSQL");
    if (!guardado) return false;

    try {
        const estado = JSON.parse(guardado);
        preguntas = estado.preguntas;
        falladas = estado.falladas;
        index = estado.index;
        repeticionesFallos = estado.repeticionesFallos;
        aciertos = estado.aciertos;
        totalRespondidas = estado.totalRespondidas;
        return true;
    } catch {
        return false;
    }
}

function cargarPregunta() {
    if (index >= preguntas.length) {
        document.getElementById("pregunta").innerText = "🎉 ¡Test finalizado!";
        document.getElementById("opciones").innerHTML = "";
        document.querySelector("button").style.display = "none";
        document.getElementById("resultado").innerText = "Buen trabajo.";
        localStorage.removeItem("testSQL");
        actualizarEstadisticas();
        return;
    }

    const p = preguntas[index];
    document.getElementById("pregunta").textContent = p.pregunta;
    const opcionesMezcladas = [...p.opciones];
    mezclar(opcionesMezcladas);

    const contenedor = document.getElementById("opciones");
    contenedor.innerHTML = "";
    opcionesMezcladas.forEach(opcion => {
        const label = document.createElement("label");
        label.className = "option";
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "opcion";
        input.value = "";
        input.setAttribute("data-texto", opcion);
        label.appendChild(input);
        label.appendChild(document.createTextNode(" " + opcion));
        contenedor.appendChild(label);
    });

    const btn = document.querySelector("button");
    btn.style.display = "inline-block";
    btn.innerText = "Corregir";
    btn.disabled = false;
    document.getElementById("resultado").innerText = "";
    estadoBoton = "corregir";
}

let estadoBoton = "corregir"; // "corregir" o "siguiente"

function siguiente() {
    const btn = document.querySelector("button");
    if (estadoBoton === "corregir") {
        const seleccionada = document.querySelector('input[name="opcion"]:checked');
        if (!seleccionada) {
            alert("Selecciona una opción.");
            return;
        }

        const respuesta = seleccionada.dataset.texto;
        const preguntaActual = preguntas[index];
        totalRespondidas++;

        if (esRespuestaCorrecta(respuesta, preguntaActual)) {
            aciertos++;
            document.getElementById("resultado").innerText = "✅ Correcto";
            document.getElementById("resultado").className = "correcto";
        } else {
            const opcionCorrecta = preguntaActual.opciones[preguntaActual.respuesta_correcta_index];
            document.getElementById("resultado").innerText = `❌ Incorrecto. Era: ${opcionCorrecta}`;
            document.getElementById("resultado").className = "incorrecto";
            const fallada = preguntas[index];
            const repeticiones = (repeticionesFallos[fallada.pregunta] || 0) + 1;
            repeticionesFallos[fallada.pregunta] = repeticiones;
            for (let i = 0; i < Math.min(repeticiones, 3); i++) {
                const posicion = index + 2 + Math.floor(Math.random() * 3);
                preguntas.splice(Math.min(posicion, preguntas.length), 0, fallada);
            }
        }

        actualizarEstadisticas();
        guardarProgreso();
        btn.innerText = "Siguiente";
        estadoBoton = "siguiente";
        document.querySelectorAll('input[name="opcion"]').forEach(input => input.disabled = true);
    } else {
        index++;
        cargarPregunta();
    }
}

function reiniciarEstadisticas() {
    localStorage.removeItem("testSQL");

    // Resetear variables
    preguntas = [...preguntasOriginales];
    falladas = [];
    index = 0;
    repeticionesFallos = {};
    aciertos = 0;
    totalRespondidas = 0;

    mezclar(preguntas);
    cargarPregunta();
    actualizarEstadisticas();

    document.getElementById("resultado").innerText = "📊 Estadísticas reiniciadas";
    document.getElementById("resultado").className = "";
}

async function iniciarTest() {
    try {
        const res = await fetch("preguntas.json");
        preguntasOriginales = await res.json();

        preguntasOriginales = preguntasOriginales.map(pregunta => {
            const respuestaNormalizada = normalizar(pregunta.respuesta);
            const respuestaCorrectaIndex = pregunta.opciones.findIndex(op =>
                normalizar(op) === respuestaNormalizada
            );

            if (respuestaCorrectaIndex === -1) {
                console.warn(`⚠️ No se encontró la respuesta correcta en las opciones para la pregunta: "${pregunta.pregunta}"`);
                console.warn("Respuesta normalizada:", `"${respuestaNormalizada}"`);
                console.warn("Opciones normalizadas:", pregunta.opciones.map(op => `"${normalizar(op)}"`));
            }

            return { ...pregunta, respuesta_correcta_index: respuestaCorrectaIndex >= 0 ? respuestaCorrectaIndex : 0 };
        });

        totalPreguntasTotales = preguntasOriginales.length;

        const guardado = localStorage.getItem("testSQL");
        if (guardado) {
            const estado = JSON.parse(guardado);
            preguntas = estado.preguntas;
            falladas = estado.falladas;
            index = estado.index;
            repeticionesFallos = estado.repeticionesFallos;
            aciertos = estado.aciertos;
            totalRespondidas = estado.totalRespondidas;

            // Añadir nuevas preguntas si hay más en el JSON
            const todasGuardadas = [...preguntas, ...falladas].map(p => p.pregunta);
            const nuevas = preguntasOriginales.filter(p => !todasGuardadas.includes(p.pregunta));

            if (nuevas.length > 0) {
                preguntas = preguntas.concat(nuevas);
                mezclar(preguntas);
            }
        } else {
            preguntas = [...preguntasOriginales];
            mezclar(preguntas);
        }

        cargarPregunta();
        actualizarEstadisticas();
        renderQuestionList();
    } catch (error) {
        console.error("Error al cargar preguntas.json:", error);
    }
}
iniciarTest();

document.getElementById('search').addEventListener('keyup', e => {

    const term = normalizar(e.target.value);
    document.querySelectorAll('.question-item').forEach(item => {
        const hay = item.getAttribute('data-text').includes(term);

        item.classList.toggle('hidden', !hay);
    });
});
