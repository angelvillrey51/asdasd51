const videoElement = document.getElementById('video');
const startButton = document.getElementById('startCam');
const canvasElement = document.getElementById('canvas');
const canvasCtx = canvasElement.getContext('2d');
const accion = document.getElementById('accion');

// ===== MediaPipe =====
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7
});

let vCounter = 0;
const vRepetitions = 2;
let activeTimer = null;
let manoCerrada = false;

// ===== Detectar dedos =====
function contarDedos(landmarks) {
  const tipIds = [4,8,12,16,20];
  let dedos = [false,false,false,false,false];
  dedos[0] = landmarks[4].x > landmarks[3].x; 
  for (let i = 1; i < 5; i++) {
    dedos[i] = landmarks[tipIds[i]].y < landmarks[tipIds[i]-2].y;
  }
  return dedos;
}

// ===== Gesto OK 👌 =====
function detectarOK(landmarks) {
  const pulgar = landmarks[4];
  const indice = landmarks[8];
  const dist = Math.hypot(pulgar.x - indice.x, pulgar.y - indice.y);

  const medio = landmarks[12];
  const anular = landmarks[16];
  const menique = landmarks[20];

  const otrosLevantados =
    medio.y < landmarks[10].y &&
    anular.y < landmarks[14].y &&
    menique.y < landmarks[18].y;

  return dist < 0.05 && otrosLevantados;
}

// ===== Mandar señal a Render =====
function enviarSenalESP32() {
  fetch("/abrir", { method: "POST" })
    .then(() => console.log("Señal enviada a Render"))
    .catch(e => console.error("Error:", e));
}

// ===== Activar acción =====
function activarAccion(texto) {
  accion.innerText = `Acción: ${texto}`;
  enviarSenalESP32();

  if (activeTimer) clearTimeout(activeTimer);
  activeTimer = setTimeout(() => {
    accion.innerText = "Acción: Ninguna";
  }, 5000);
}

// ===== MediaPipe callback =====
hands.onResults(results => {
  canvasCtx.clearRect(0,0,canvasElement.width,canvasElement.height);
  if (results.image) {
    canvasCtx.drawImage(results.image,0,0,canvasElement.width,canvasElement.height);
  }

  if (results.multiHandLandmarks?.length) {
    const lm = results.multiHandLandmarks[0];
    drawConnectors(canvasCtx, lm, HAND_CONNECTIONS, {color:"#00FFCC", lineWidth:4});
    drawLandmarks(canvasCtx, lm, {color:"#FF0066", lineWidth:2});

    const dedos = contarDedos(lm);

    const tresCerrados = !dedos[2] && !dedos[3] && !dedos[4];
    const pulgarIndice = dedos[0] && dedos[1];

    // estado de V
    if (tresCerrados && !pulgarIndice) {
      manoCerrada = true;
    }

    if (manoCerrada && pulgarIndice && tresCerrados) {
      vCounter++;
      manoCerrada = false;
      if (vCounter >= vRepetitions) {
        activarAccion("Abrir puerta (V)");
        vCounter = 0;
      }
    }

    // OK
    if (detectarOK(lm)) {
      activarAccion("Abrir puerta (OK 👌)");
    }
  }
});

// ===== Cámara =====
startButton.addEventListener("click", async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({video:true});
    videoElement.srcObject = stream;
    videoElement.play();
    videoElement.style.display = "none";

    const loop = async () => {
      if (videoElement.readyState === 4) {
        await hands.send({image: videoElement});
      }
      requestAnimationFrame(loop);
    };
    loop();
    startButton.style.display = "none";
  } catch (e) {
    alert("No se pudo acceder a la cámara");
  }
});
