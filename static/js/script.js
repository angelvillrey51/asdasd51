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

// Variables para detección de movimiento
let lastPositions = [];
const maxHistory = 5;
const filterThreshold = 3;
let gestureCounter = 0;
let activeTimer = null;

// Contar dedos
function contarDedos(landmarks) {
  const tipIds = [4, 8, 12, 16, 20];
  let dedos = [false, false, false, false, false];
  dedos[0] = landmarks[tipIds[0]].x > landmarks[tipIds[0]-1].x; // pulgar
  for (let i = 1; i < tipIds.length; i++) {
    dedos[i] = landmarks[tipIds[i]].y < landmarks[tipIds[i]-2].y;
  }
  return dedos;
}

// Detectar gesto agitar
function detectarAgitar(lastPositions) {
  if (lastPositions.length < maxHistory) return false;
  let totalDiff = 0;
  for (let i = 0; i < 4; i++) {
    let diffY = lastPositions[maxHistory-1][i].y - lastPositions[0][i].y;
    let diffX = lastPositions[maxHistory-1][i].x - lastPositions[0][i].x;
    totalDiff += Math.abs(diffY) + Math.abs(diffX);
  }
  return totalDiff > 0.15;
}

// Activar acción por 3 segundos
function activarAccion(texto) {
  accion.innerText = `Acción: ${texto}`;
  if (activeTimer) clearTimeout(activeTimer);
  activeTimer = setTimeout(() => {
    accion.innerText = "Acción: Ninguna";
  }, 3000);
}

// Función principal de procesamiento de cada frame
hands.onResults(results => {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // Dibujar solo si hay imagen de la cámara
  if (results.image) {
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
  }

  let gestureDetected = false;

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
        gestureDetected = true;
      }
    }

    // --- Gest agitar ---
    let pos = [];
    for (let i = 1; i <= 4; i++) {
      pos.push({x: landmarks[[4,8,12,16,20][i]].x, y: landmarks[[4,8,12,16,20][i]].y});
    }
    lastPositions.push(pos);
    if (lastPositions.length > maxHistory) lastPositions.shift();

    if (!gestureDetected && detectarAgitar(lastPositions)) {
      gestureCounter++;
      if (gestureCounter >= filterThreshold) {
        activarAccion("Abrir puerta (agitar mano)");
        gestureDetected = true;
      }
    }

    if (!gestureDetected) gestureCounter = 0;
  }

  canvasCtx.restore();
});

// Iniciar cámara al presionar botón
startButton.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = stream;
    videoElement.play();

    // Ocultar video original para que no se vea doble
    videoElement.style.display = 'none';

    const processFrame = async () => {
      await hands.send({image: videoElement});
      requestAnimationFrame(processFrame);
    };
    processFrame();
    startButton.style.display = 'none';
  } catch (err) {
    alert('No se pudo acceder a la cámara: ' + err);
  }
});
