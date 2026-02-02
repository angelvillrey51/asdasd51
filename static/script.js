// Elementos del DOM
const videoElement = document.getElementById('video');
const canvasElement = document.getElementById('canvas');
const canvasCtx = canvasElement.getContext('2d');
const contador = document.getElementById('contador');

// Inicializamos MediaPipe Hands
const hands = new Hands({locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

// Función para contar dedos levantados
function contarDedos(landmarks) {
  const tipIds = [4, 8, 12, 16, 20];
  let dedos = 0;

  // Pulgar
  if (landmarks[tipIds[0]].x > landmarks[tipIds[0]-1].x) dedos++;

  // Otros 4 dedos
  for (let i = 1; i < tipIds.length; i++) {
    if (landmarks[tipIds[i]].y < landmarks[tipIds[i]-2].y) dedos++;
  }

  return dedos;
}

// Cada vez que MediaPipe detecta resultados
hands.onResults(results => {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const landmarks = results.multiHandLandmarks[0];

    // Dibujar la mano
    drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#00FFCC', lineWidth: 5});
    drawLandmarks(canvasCtx, landmarks, {color: '#FF0066', lineWidth: 2});

    // Contar dedos
    const dedos = contarDedos(landmarks);
    contador.innerText = `Dedos levantados: ${dedos}`;
  } else {
    contador.innerText = `Dedos levantados: 0`;
  }

  canvasCtx.restore();
});

// Acceso a la cámara
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({image: videoElement});
  },
  width: 640,
  height: 480
});
camera.start();
