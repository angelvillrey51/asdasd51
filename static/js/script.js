const videoElement = document.getElementById('video');
const startButton = document.getElementById('startCam');
const canvasElement = document.getElementById('canvas');
const canvasCtx = canvasElement.getContext('2d');
const accion = document.getElementById('accion');

// MediaPipe Hands
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

// Variables para detección
let lastPositions = [];
const maxHistory = 5;
const filterThreshold = 3;
let gestureCounter = 0;
let activeTimer = null;

// Contar dedos
function contarDedos(landmarks) {
  const tipIds = [4, 8, 12, 16, 20];
  let dedos = [false, false, false, false, false];
  dedos[0] = landmarks[tipIds[0]].x > landmarks[tipIds[0]-1].x;
  for (let i = 1; i < tipIds.length; i++) {
    dedos[i] = landmarks[tipIds[i]].y < landmarks[tipIds[i]-2].y;
  }
  return dedos;
}

// Detectar agitar mano
function detectarAgitar(positions) {
  if (positions.length < maxHistory) return false;

  // Calcular desplazamiento promedio de los 4 dedos largos
  let sumDiff = 0;
  for (let i = 0; i < 4; i++) {
    let dy = positions[positions.length - 1][i].y - positions[0][i].y;
    let dx = positions[positions.length - 1][i].x - positions[0][i].x;
    sumDiff += Math.sqrt(dx*dx + dy*dy);
  }

  // Umbral ajustable
  return sumDiff > 0.12;
}

// Activar acción por 3 segundos
function activarAccion(texto) {
  accion.innerText = `Acción: ${texto}`;
  if (activeTimer) clearTimeout(activeTimer);
  activeTimer = setTimeout(() => {
    accion.innerText = "Acción: Ninguna";
  }, 3000);
}

// Procesar resultados de MediaPipe
hands.onResults(results => {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  if (results.image) {
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
  }

  let detected = false;

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];

    drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#00FFCC', lineWidth: 5});
    drawLandmarks(canvasCtx, landmarks, {color: '#FF0066', lineWidth: 2});

    const dedos = contarDedos(landmarks);

    // --- Gest V ---
    if (dedos[0] && dedos[1] && !dedos[2] && !dedos[3] && !dedos[4]) {
      gestureCounter++;
      if (gestureCounter >= filterThreshold) {
        activarAccion("Abrir puerta (V)");
        detected = true;
      }
    }

    // --- Gest agitar ---
    let pos = [];
    const tipIds = [8, 12, 16, 20]; // 4 dedos largos
    for (let i = 0; i < tipIds.length; i++) {
      pos.push({x: landmarks[tipIds[i]].x, y: landmarks[tipIds[i]].y});
    }
    lastPositions.push(pos);
    if (lastPositions.length > maxHistory) lastPositions.shift();

    if (!detected && detectarAgitar(lastPositions)) {
      gestureCounter++;
      if (gestureCounter >= filterThreshold) {
        activarAccion("Abrir puerta (Agitar mano)");
        detected = true;
        lastPositions = [];
      }
    }

    if (!detected) gestureCounter = 0;
  }

  canvasCtx.restore();
});

// Iniciar cámara al presionar botón
startButton.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = stream;
    videoElement.play();
    videoElement.style.display = 'none'; // Ocultar video original

    const processFrame = async () => {
      if (videoElement.readyState === 4) { // esperar a que el video esté listo
        await hands.send({image: videoElement});
      }
      requestAnimationFrame(processFrame);
    };
    processFrame();
    startButton.style.display = 'none';
  } catch (err) {
    alert('No se pudo acceder a la cámara: ' + err);
  }
});
