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

// Variables para detectar movimiento
let lastPositions = []; // historial de posiciones para detectar “agitar”
const maxHistory = 5; // cuántos frames guardar

hands.onResults(results => {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  let accionActual = "Ninguna";

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];

    // Dibujar la mano
    drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#00FFCC', lineWidth: 5});
    drawLandmarks(canvasCtx, landmarks, {color: '#FF0066', lineWidth: 2});

    // Contar dedos levantados
    const tipIds = [4, 8, 12, 16, 20];
    let dedos = [false, false, false, false, false]; // pulgar a meñique
    // Pulgar
    dedos[0] = landmarks[tipIds[0]].x > landmarks[tipIds[0]-1].x;
    for (let i = 1; i < tipIds.length; i++) {
      dedos[i] = landmarks[tipIds[i]].y < landmarks[tipIds[i]-2].y;
    }

    // --- Detectar gesto V: pulgar + índice levantado ---
    if (dedos[0] && dedos[1] && !dedos[2] && !dedos[3] && !dedos[4]) {
      accionActual = "Abrir puerta (V)";
    }

    // --- Detectar gesto “agitar mano” ---
    // Guardamos posición media de los 4 dedos (índice, medio, anular, meñique)
    let pos = [];
    for (let i = 1; i <= 4; i++) {
      pos.push({x: landmarks[tipIds[i]].x, y: landmarks[tipIds[i]].y});
    }
    lastPositions.push(pos);
    if (lastPositions.length > maxHistory) lastPositions.shift();

    // Revisamos si la mano se movió hacia adelante
    if (lastPositions.length === maxHistory) {
      let moved = 0;
      for (let i = 0; i < 4; i++) {
        let diff = lastPositions[maxHistory-1][i].y - lastPositions[0][i].y;
        if (diff > 0.05) moved++;
      }
      if (moved >= 3) {
        accionActual = "Abrir puerta (agitar mano)";
        lastPositions = []; // reiniciar historial para no repetir
      }
    }
  }

  accion.innerText = "Acción: " + accionActual;
  canvasCtx.restore();
});

// Botón para iniciar cámara
startButton.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = stream;
    videoElement.play();

    const cameraLoop = async () => {
      await hands.send({image: videoElement});
      requestAnimationFrame(cameraLoop);
    };
    cameraLoop();
    startButton.style.display = 'none';
  } catch (err) {
    alert('No se pudo acceder a la cámara: ' + err);
  }
});
