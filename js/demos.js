document.addEventListener("DOMContentLoaded", () => {
    // IP PÚBLICA de tu servidor AWS
    const API_URL = 'http://34.236.223.58:5000';
    const socket = io(API_URL); // Socket necesario para ejecutar demo

    // --- Elementos de "Demos" ---
    const demoNombreInput = document.getElementById("demo-nombre-input");
    const sequenceBuilderControls = document.querySelector(".sequence-builder-controls");
    const demoSequenceList = document.getElementById("demo-sequence-list");
    const saveDemoButton = document.getElementById("save-demo-button");
    const clearDemoButton = document.getElementById("clear-demo-button");
    const demoList = document.getElementById("demo-list");

    if (!demoNombreInput || !demoList) {
        console.log("demos.js: No se encontraron elementos de demos.");
        return;
    }
    
    let currentSequence = [];

    // --- LÓGICA DE CARGA (USANDO FETCH/API REST) ---

    /**
     * Carga la lista de demos desde la API y renderiza los botones de ejecución.
     */
    async function loadDemos() {
        try {
            const response = await fetch(`${API_URL}/api/demos/listar`); 
            const demos = await response.json();

            if (demos.length === 0) {
                demoList.innerHTML = '<li>No hay demos guardadas.</li>';
                return;
            }

            demoList.innerHTML = '';
            demos.forEach(demo => {
                const li = document.createElement('li');
                li.textContent = demo.nombre;
                
                const runButton = document.createElement('button');
                runButton.textContent = 'Ejecutar';
                runButton.className = 'demo-run-button';
                runButton.dataset.id = demo.id;
                
                runButton.addEventListener('click', (e) => {
                    e.stopPropagation(); 
                    runDemo(demo.id, demo.nombre);
                });
                
                li.appendChild(runButton);
                demoList.appendChild(li);
            });
        } catch (error) {
            console.error("Error al cargar demos:", error);
            demoList.innerHTML = '<li>Error al conectar con el servidor.</li>';
        }
    }


    // --- LÓGICA DE CREAR DEMO ---
    
    function updateSequenceList() {
        if (currentSequence.length === 0) {
            demoSequenceList.innerHTML = '<li>Añade movimientos...</li>';
            return;
        }
        demoSequenceList.innerHTML = ''; 
        currentSequence.forEach((comando, index) => {
            const li = document.createElement('li');
            li.textContent = `${index + 1}. ${comando}`;
            demoSequenceList.appendChild(li);
        });
    }

    if (sequenceBuilderControls) {
        sequenceBuilderControls.addEventListener('click', (e) => {
            if (e.target.matches('.control-button-demo')) {
                const command = e.target.dataset.command;
                currentSequence.push(command);
                updateSequenceList();
            }
        });
    }

    if (clearDemoButton) {
        clearDemoButton.addEventListener('click', () => {
            currentSequence = [];
            updateSequenceList();
        });
    }

    // (Usa FETCH/API REST para guardar)
    if (saveDemoButton) {
        saveDemoButton.addEventListener('click', async () => {
            const nombre = demoNombreInput.value.trim();
            if (nombre === '' || currentSequence.length === 0) {
                alert('Nombre o movimientos faltantes.');
                return;
            }

            try {
                const response = await fetch(`${API_URL}/api/demos/guardar`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombre: nombre,
                        movimientos: currentSequence 
                    })
                });

                if (response.ok) {
                    alert('¡Demo guardada con éxito!');
                    demoNombreInput.value = '';
                    currentSequence = [];
                    updateSequenceList();
                    loadDemos(); // Recargar la lista
                } else {
                    const result = await response.json();
                    alert(`Error al guardar: ${result.error || response.statusText}`);
                }
            } catch (error) {
                console.error('Error de conexión al guardar demo:', error);
                alert('Error de conexión al servidor.');
            }
        });
    }

    // --- LÓGICA DE EJECUTAR DEMO (Usa FETCH/API REST para iniciar) ---
    
    async function runDemo(id, nombre) {
        if (!confirm(`¿Estás seguro de que quieres ejecutar la demo "${nombre}"?`)) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/demos/iniciar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id_secuencia: id }) 
            });

            if (response.ok) {
                alert(`Iniciando demo: "${nombre}".`);
                console.log(`Demo iniciada en el backend con ID: ${id}`);
                
                // Redirigir al monitor para ver el progreso
                setTimeout(() => {
                    window.location.href = 'monitor.html';
                }, 500);
            } else {
                const result = await response.json();
                alert(`Error al iniciar la demo: ${result.error || response.statusText}`);
            }
        } catch (error) {
            console.error('Error de conexión al iniciar demo:', error);
            alert('Error de conexión al servidor.');
        }
    }

    // --- INICIALIZACIÓN ---
    loadDemos(); // Carga inicial usando FETCH
    updateSequenceList();
});